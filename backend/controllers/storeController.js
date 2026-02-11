import asyncHandler from "express-async-handler";
import Store from "../models/storeModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";

// @desc    Create a new Store
// @route   POST /api/stores
// @access  Private (Requires authentication)
const createStore = asyncHandler(async (req, res) => {
  const { name, subdomain } = req.body;

  // 1. Validation
  if (!name || !subdomain) {
    res.status(400);
    throw new Error("Please add all fields");
  }

  // 2. Check if subdomain exists
  const storeExists = await Store.findOne({ subdomain: subdomain.toLowerCase() });
  if (storeExists) {
    res.status(400);
    throw new Error("Subdomain already taken");
  }

  // 3. Check if user already owns a store
  const userStore = await Store.findOne({ owner: req.user._id });
  if (userStore) {
    res.status(400);
    throw new Error("You already own a store. Each user can only create one store.");
  }

  // 4. Create Store and link to authenticated user
  const store = await Store.create({
    name,
    subdomain: subdomain.toLowerCase(),
    owner: req.user._id, // Link to authenticated user
  });

  // 5. Update user's store field if it was null (user registered before store creation)
  // and set user as admin since they own the store
  const user = await User.findById(req.user._id);
  if (user) {
    // Always update user's store to their new store
    // This ensures they are linked to the store they just created/paid for
    user.store = store._id;
      
    if (!user.isAdmin) {
      user.isAdmin = true;
    }
    await user.save();
  }

  res.status(201).json(store);
});

// @desc    Get store dashboard stats
// @route   GET /api/stores/dashboard
// @access  Private/Store Owner
const getStoreDashboard = asyncHandler(async (req, res) => {
  const storeId = req.storeId;

  // Get store details
  const store = await Store.findById(storeId);

  // Get orders stats
  const totalOrders = await Order.countDocuments({ store: storeId });
  const paidOrders = await Order.countDocuments({
    store: storeId,
    isPaid: true,
  });
  const deliveredOrders = await Order.countDocuments({
    store: storeId,
    isDelivered: true,
  });
  const pendingOrders = totalOrders - paidOrders;

  // Get revenue stats
  const orders = await Order.find({ store: storeId, isPaid: true });
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);

  // Get recent orders
  const recentOrders = await Order.find({ store: storeId })
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(5);

  // Get products stats
  const totalProducts = await Product.countDocuments({ store: storeId });
  const outOfStockCount = await Product.countDocuments({
    store: storeId,
    countInStock: 0,
  });
  const inStockProducts = totalProducts - outOfStockCount;

  // Get list of out-of-stock products for alerts
  const outOfStockList = await Product.find({
    store: storeId,
    countInStock: 0,
  })
    .select("name _id")
    .limit(5); // Limit to 5 for the alert

  // Get users stats
  const totalUsers = await User.countDocuments({ store: storeId });
  const adminUsers = await User.countDocuments({
    store: storeId,
    isAdmin: true,
  });
  const customerUsers = totalUsers - adminUsers;

  // Calculate sales by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlySales = await Order.aggregate([
    {
      $match: {
        store: storeId,
        isPaid: true,
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        total: { $sum: "$totalPrice" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  res.json({
    store: {
      name: store.name,
      subdomain: store.subdomain,
      isActive: store.isActive,
      paymentStatus: store.paymentStatus,
      createdAt: store.createdAt,
    },
    orders: {
      total: totalOrders,
      paid: paidOrders,
      pending: pendingOrders,
      delivered: deliveredOrders,
      recent: recentOrders,
    },
    revenue: {
      total: totalRevenue.toFixed(2),
      monthlySales: monthlySales,
    },
    products: {
      total: totalProducts,
      inStock: inStockProducts,
      outOfStock: outOfStockCount,
      outOfStockList: outOfStockList,
    },
    users: {
      total: totalUsers,
      admins: adminUsers,
      customers: customerUsers,
    },
  });
});

// @desc    Get store details
// @route   GET /api/stores/details
// @access  Private/Store Owner
const getStoreDetails = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.storeId).populate(
    "owner",
    "name email"
  );

  if (!store) {
    res.status(404);
    throw new Error("Store not found");
  }

  res.json(store);
});

// @desc    Update store details
// @route   PUT /api/stores/details
// @access  Private/Store Owner
const updateStoreDetails = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.storeId);

  if (!store) {
    res.status(404);
    throw new Error("Store not found");
  }

  // Update allowed fields
  if (req.body.name) store.name = req.body.name;
  if (req.body.branding) {
    store.branding = { ...store.branding, ...req.body.branding };
  }
  if (req.body.contactInfo) {
    store.contactInfo = { ...store.contactInfo, ...req.body.contactInfo };
  }
  if (req.body.isActive !== undefined) store.isActive = req.body.isActive;

  const updatedStore = await store.save();
  res.json(updatedStore);
});

export { createStore, getStoreDashboard, getStoreDetails, updateStoreDetails };

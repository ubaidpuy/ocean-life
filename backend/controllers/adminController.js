import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import Store from "../models/storeModel.js";

// @desc    Get super admin dashboard analytics
// @route   GET /api/admin/dashboard
// @access  Private (Super Admin only)
export const getAdminDashboard = asyncHandler(async (req, res) => {
  // Calculate total subscription revenue
  // This would typically come from Stripe API, but for now we'll calculate from active subscriptions
  const activeSubscriptions = await User.countDocuments({
    subscriptionStatus: "active",
  });

  // Get all paid orders with marketplace payment breakdown
  const paidOrders = await Order.find({
    isPaid: true,
    "paymentBreakdown.totalAmount": { $gt: 0 },
  });

  // Calculate total platform commission revenue
  const totalPlatformCommission = paidOrders.reduce((sum, order) => {
    return sum + (order.paymentBreakdown?.platformFee || 0);
  }, 0);

  // Calculate total store earnings (amount transferred to stores)
  const totalStoreEarnings = paidOrders.reduce((sum, order) => {
    return sum + (order.paymentBreakdown?.storeEarning || 0);
  }, 0);

  // Calculate total subscription revenue
  // Note: In production, you should fetch this from Stripe API
  // For now, we'll estimate based on active subscriptions
  // You can enhance this by storing subscription amounts in the database
  const estimatedSubscriptionRevenue = activeSubscriptions * 29.99; // Assuming $29.99/month per subscription

  // Get total revenue (subscriptions + platform commissions)
  const totalRevenue = estimatedSubscriptionRevenue + totalPlatformCommission;

  // Get all stores
  const totalStores = await Store.countDocuments();

  // Get all users
  const totalUsers = await User.countDocuments();

  // Get recent orders (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrders = await Order.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
    isPaid: true,
  });

  // Get top stores by revenue
  const topStores = await Order.aggregate([
    {
      $match: {
        isPaid: true,
        "paymentBreakdown.storeEarning": { $gt: 0 },
      },
    },
    {
      $group: {
        _id: "$store",
        totalEarnings: { $sum: "$paymentBreakdown.storeEarning" },
        orderCount: { $sum: 1 },
      },
    },
    {
      $sort: { totalEarnings: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: "stores",
        localField: "_id",
        foreignField: "_id",
        as: "store",
      },
    },
    {
      $unwind: "$store",
    },
    {
      $project: {
        storeId: "$_id",
        storeName: "$store.name",
        storeSubdomain: "$store.subdomain",
        totalEarnings: 1,
        orderCount: 1,
      },
    },
  ]);

  res.json({
    revenue: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      subscriptionRevenue: parseFloat(estimatedSubscriptionRevenue.toFixed(2)),
      platformCommission: parseFloat(totalPlatformCommission.toFixed(2)),
      storeEarnings: parseFloat(totalStoreEarnings.toFixed(2)),
    },
    subscriptions: {
      activeCount: activeSubscriptions,
      totalRevenue: parseFloat(estimatedSubscriptionRevenue.toFixed(2)),
    },
    marketplace: {
      totalCommission: parseFloat(totalPlatformCommission.toFixed(2)),
      totalStoreEarnings: parseFloat(totalStoreEarnings.toFixed(2)),
      totalTransactions: paidOrders.length,
    },
    overview: {
      totalStores,
      totalUsers,
      activeSubscriptions,
      recentOrders,
    },
    topStores: topStores.map((store) => ({
      ...store,
      totalEarnings: parseFloat(store.totalEarnings.toFixed(2)),
    })),
  });
});

// @desc    Get detailed subscription analytics
// @route   GET /api/admin/subscriptions
// @access  Private (Super Admin only)
export const getSubscriptionAnalytics = asyncHandler(async (req, res) => {
  const subscriptions = await User.find({
    subscriptionStatus: { $ne: null },
  })
    .select("name email subscriptionStatus subscriptionId createdAt")
    .sort({ createdAt: -1 });

  const statusCounts = {
    active: 0,
    canceled: 0,
    past_due: 0,
    unpaid: 0,
    trialing: 0,
    incomplete: 0,
    incomplete_expired: 0,
  };

  subscriptions.forEach((user) => {
    if (user.subscriptionStatus && statusCounts[user.subscriptionStatus] !== undefined) {
      statusCounts[user.subscriptionStatus]++;
    }
  });

  res.json({
    total: subscriptions.length,
    statusCounts,
    subscriptions: subscriptions.map((user) => ({
      userId: user._id,
      name: user.name,
      email: user.email,
      status: user.subscriptionStatus,
      subscriptionId: user.subscriptionId,
      createdAt: user.createdAt,
    })),
  });
});

// @desc    Get marketplace transaction details
// @route   GET /api/admin/marketplace-transactions
// @access  Private (Super Admin only)
export const getMarketplaceTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const paidOrders = await Order.find({
    isPaid: true,
    "paymentBreakdown.totalAmount": { $gt: 0 },
  })
    .populate("user", "name email")
    .populate("store", "name subdomain")
    .sort({ paidAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments({
    isPaid: true,
    "paymentBreakdown.totalAmount": { $gt: 0 },
  });

  res.json({
    transactions: paidOrders.map((order) => ({
      orderId: order._id,
      customer: {
        name: order.user?.name,
        email: order.user?.email,
      },
      store: {
        name: order.store?.name,
        subdomain: order.store?.subdomain,
      },
      amount: order.paymentBreakdown?.totalAmount || 0,
      platformFee: order.paymentBreakdown?.platformFee || 0,
      storeEarning: order.paymentBreakdown?.storeEarning || 0,
      paymentIntentId: order.stripePaymentIntentId,
      transferId: order.stripeTransferId,
      paidAt: order.paidAt,
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});


import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
    return;
  } else {
    const order = new Order({
      orderItems,
      user: req.user._id,
      store: req.storeId, // SAAS: Associate order with store
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    // --- NEW: Decrement Stock for Variations ---
    // We must loop through orderItems and update the specific variation's stock
    for (const item of orderItems) {
      // Find product
      const product = await Product.findById(item.product);
      if (product) {
        // Find the specific variation
        const variantIndex = product.variations.findIndex(
          (v) => v._id.toString() === item.variationId
        );

        if (variantIndex !== -1) {
          product.variations[variantIndex].countInStock -= item.qty;
          // Ensure we don't go negative
          if (product.variations[variantIndex].countInStock < 0) {
            product.variations[variantIndex].countInStock = 0;
          }
        }
        
        // Recalculate total stock for the product summary
        const totalStock = product.variations.reduce(
          (sum, v) => sum + (v.countInStock || 0),
          0
        );
        product.countInStock = totalStock;

        await product.save();
      }
    }

    res.status(201).json(createdOrder);
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  // SAAS: Ensure ID and Store Match
  const order = await Order.findOne({
    _id: req.params.id,
    store: req.storeId,
  }).populate("user", "name email");

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    store: req.storeId,
  });

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address,
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    store: req.storeId,
  });

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  // SAAS: User orders IN THIS STORE only
  const orders = await Order.find({
    user: req.user._id,
    store: req.storeId,
  });
  res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  // SAAS: All orders for THIS STORE
  const orders = await Order.find({ store: req.storeId }).populate(
    "user",
    "id name"
  );
  res.json(orders);
});

export {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
};

import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Store from "../models/storeModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Platform commission percentage (20%)
const PLATFORM_COMMISSION = 0.2;

// @desc    Create PaymentIntent for marketplace purchase
// @route   POST /api/marketplace/create-payment-intent
// @access  Private
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    res.status(400);
    throw new Error("Order ID is required");
  }

  // Find order
  const order = await Order.findById(orderId).populate("store");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Ensure order belongs to current store context
  if (order.store._id.toString() !== req.storeId.toString()) {
    res.status(403);
    throw new Error("Order does not belong to this store");
  }

  // Check if order is already paid
  if (order.isPaid) {
    res.status(400);
    throw new Error("Order is already paid");
  }

  // Find store owner (who should have a connected account)
  const store = await Store.findById(req.storeId).populate("owner");

  if (!store || !store.owner) {
    res.status(404);
    throw new Error("Store or store owner not found");
  }

  const storeOwner = store.owner;

  // Check if store owner has active connected account
  if (!storeOwner.stripeAccountId) {
    res.status(400);
    throw new Error(
      "Store owner has not set up payment account. Please complete onboarding."
    );
  }

  // Verify connected account is active
  try {
    const account = await stripe.accounts.retrieve(storeOwner.stripeAccountId);
    if (!account.charges_enabled || !account.details_submitted) {
      res.status(400);
      throw new Error(
        "Store owner's payment account is not fully activated. Please complete onboarding."
      );
    }
  } catch (error) {
    res.status(400);
    throw new Error("Unable to verify store owner's payment account");
  }

  // Calculate amounts
  const totalAmount = Math.round(order.totalPrice * 100); // Convert to cents
  const platformFee = Math.round(totalAmount * PLATFORM_COMMISSION);
  const storeEarning = totalAmount - platformFee;

  // Create PaymentIntent with application fee
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: "usd",
    application_fee_amount: platformFee,
    transfer_data: {
      destination: storeOwner.stripeAccountId,
    },
    metadata: {
      orderId: order._id.toString(),
      storeId: store._id.toString(),
      userId: req.user._id.toString(),
      storeOwnerId: storeOwner._id.toString(),
    },
    description: `Order #${order._id} - ${store.name}`,
  });

  // Update order with payment intent ID
  order.stripePaymentIntentId = paymentIntent.id;
  order.paymentBreakdown = {
    totalAmount: order.totalPrice,
    adminEarning: platformFee / 100,
    platformFee: platformFee / 100,
    storeEarning: storeEarning / 100,
  };
  await order.save();

  res.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: totalAmount,
    currency: paymentIntent.currency,
    breakdown: {
      totalAmount: order.totalPrice,
      platformFee: platformFee / 100,
      storeEarning: storeEarning / 100,
    },
  });
});

// @desc    Get payment intent status
// @route   GET /api/marketplace/payment-intent/:paymentIntentId
// @access  Private
export const getPaymentIntentStatus = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.params;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  res.json({
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    created: new Date(paymentIntent.created * 1000).toISOString(),
  });
});


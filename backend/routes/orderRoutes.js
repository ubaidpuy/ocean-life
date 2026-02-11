import express from "express";
import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
} from "../controllers/orderController.js";

import Order from "../models/orderModel.js";
import Store from "../models/storeModel.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔐 Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ========================
// Order Routes
// ========================
router.route("/").post(protect, addOrderItems).get(protect, admin, getOrders);

router.route("/myorders").get(protect, getMyOrders);
router.route("/:id").get(protect, getOrderById);
router.route("/:id/pay").put(protect, updateOrderToPaid);
router.route("/:id/deliver").put(protect, admin, updateOrderToDelivered);

// ========================
// Stripe Checkout Route
// ========================
router.post(
  "/:id/stripe-checkout",
  protect,
  asyncHandler(async (req, res) => {
    // SAAS UPDATE: Ensure we only find orders for the current store
    const order = await Order.findOne({
      _id: req.params.id,
      store: req.storeId,
    });

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // Find store and store owner
    const store = await Store.findById(req.storeId).populate("owner");
    if (!store || !store.owner) {
      res.status(404);
      throw new Error("Store or store owner not found");
    }
    const storeOwner = store.owner;

    // Check if store owner has active connected account
    let connectedAccountId = null;
    let useMarketplace = false;
    const PLATFORM_COMMISSION = 0.2; // 20%

    if (storeOwner.stripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(storeOwner.stripeAccountId);
        if (account.charges_enabled && account.details_submitted) {
          connectedAccountId = account.id;
          useMarketplace = true;
        }
      } catch (error) {
        console.error("Error retrieving connected account:", error);
        // Continue without marketplace if account retrieval fails
      }
    }

    const frontendUrl = req.headers.origin || "http://localhost:3000";
    const totalAmount = Math.round(order.totalPrice * 100); // Convert to cents
    let platformFee = 0;

    if (useMarketplace && connectedAccountId) {
      platformFee = Math.round(totalAmount * PLATFORM_COMMISSION);
    }

    const sessionConfig = {
      payment_method_types: ["card"],
      line_items: order.orderItems.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.qty,
      })),
      mode: "payment",
      success_url: `${frontendUrl}/order/${order._id}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/order/${order._id}?cancel=true`,
      metadata: {
        orderId: order._id.toString(),
        storeId: req.storeId.toString(),
        userId: req.user._id.toString(),
      },
    };

    if (useMarketplace && connectedAccountId) {
      sessionConfig.payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: connectedAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json({ url: session.url, sessionId: session.id });
  })
);

// ========================
// Stripe Session Verification Route
// ========================
router.get(
  "/:id/verify-stripe",
  protect,
  asyncHandler(async (req, res) => {
    const { session_id } = req.query;

    // SAAS UPDATE: Ensure order belongs to current store
    const order = await Order.findOne({
      _id: req.params.id,
      store: req.storeId,
    });

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    if (!session_id) {
      res.status(400);
      throw new Error("Session ID is required");
    }

    // Retrieve the session from Stripe with expanded payment intent
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent'],
    });

    if (session.payment_status === "paid" && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: session.id,
        status: session.payment_status,
        update_time: new Date().toISOString(),
        email_address: session.customer_details?.email || order.user?.email,
      };
      order.stripePaymentIntentId = session.payment_intent?.id || null;

      // Update payment breakdown if marketplace payment (application fee)
      if (session.payment_intent) {
        const pi = session.payment_intent;
        const totalAmount = pi.amount / 100;
        const platformFee = pi.application_fee_amount
          ? pi.application_fee_amount / 100
          : 0;
        const storeEarning = totalAmount - platformFee;

        order.paymentBreakdown = {
          totalAmount: totalAmount,
          adminEarning: platformFee,
          platformFee: platformFee,
          storeEarning: storeEarning,
        };

        // NOTE: Transfer information (if any) is tracked via webhooks,
        // not by expanding payment_intent.transfer here, because that
        // property cannot be expanded in the Sessions API.
      }

      const updatedOrder = await order.save();
      res.json({ verified: true, order: updatedOrder });
    } else if (order.isPaid) {
      res.json({ verified: true, message: "Order already paid" });
    } else {
      res.status(400);
      throw new Error("Payment not completed");
    }
  })
);

export default router;

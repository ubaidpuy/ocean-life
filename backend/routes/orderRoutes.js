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
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

console.log("Stripe key:", process.env.STRIPE_SECRET_KEY);

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
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // Get the frontend URL from environment or use default
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
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
      },
    });

    // Store session ID in order (you might want to add a stripeSessionId field to the order model)
    // For now, we'll retrieve it from the session when verifying
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
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    if (!session_id) {
      res.status(400);
      throw new Error("Session ID is required");
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid" && !order.isPaid) {
      // Update order to paid
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: session.id,
        status: session.payment_status,
        update_time: new Date().toISOString(),
        email_address: session.customer_details?.email || order.user?.email,
      };

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

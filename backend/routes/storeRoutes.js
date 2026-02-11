import express from "express";
import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

import { 
  createStore, 
  getStoreDashboard, 
  getStoreDetails, 
  updateStoreDetails 
} from "../controllers/storeController.js";
import Store from "../models/storeModel.js";
import User from "../models/userModel.js";
import { protect } from "../middleware/authMiddleware.js";
import storeOwner from "../middleware/storeOwnerMiddleware.js";

const router = express.Router();

// 🔐 Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Store creation price (in cents) - $29.99
const STORE_CREATION_PRICE = 2999;

// ========================
// Store Payment Checkout Route (Protected - Requires Auth)
// ========================
router.post(
  "/payment-checkout",
  protect, // Require authentication
  asyncHandler(async (req, res) => {
    const { name, subdomain, email } = req.body;

    // Validation
    if (!name || !subdomain) {
      res.status(400);
      throw new Error("Store name and subdomain are required");
    }

    // Check if subdomain exists
    const storeExists = await Store.findOne({ subdomain: subdomain.toLowerCase() });
    if (storeExists) {
      res.status(400);
      throw new Error("Subdomain already taken");
    }

    // Get the frontend URL
    const frontendUrl = req.headers.origin || "http://localhost:3000";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Store Creation Fee",
              description: `Create your store: ${name} (${subdomain})`,
            },
            unit_amount: STORE_CREATION_PRICE,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${frontendUrl}/create-store?success=true&session_id={CHECKOUT_SESSION_ID}&name=${encodeURIComponent(name)}&subdomain=${encodeURIComponent(subdomain)}`,
      cancel_url: `${frontendUrl}/create-store?cancel=true&name=${encodeURIComponent(name)}&subdomain=${encodeURIComponent(subdomain)}`,
      metadata: {
        storeName: name,
        subdomain: subdomain.toLowerCase(),
        email: email || req.user.email || "",
        userId: req.user._id.toString(), // Link to authenticated user
      },
      customer_email: email || req.user.email || undefined,
    });

    res.json({ url: session.url, sessionId: session.id });
  })
);

// ========================
// Store Payment Verification Route (Protected - Requires Auth)
// ========================
router.get(
  "/verify-payment",
  protect, // Require authentication
  asyncHandler(async (req, res) => {
    const { session_id, name, subdomain } = req.query;

    if (!session_id) {
      res.status(400);
      throw new Error("Session ID is required");
    }

    if (!name || !subdomain) {
      res.status(400);
      throw new Error("Store name and subdomain are required");
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Verify the session belongs to the authenticated user
    const userIdFromMetadata = session.metadata?.userId;
    if (userIdFromMetadata && userIdFromMetadata !== req.user._id.toString()) {
      res.status(403);
      throw new Error("This payment session does not belong to you");
    }

    if (session.payment_status === "paid") {
      // Check if store already exists (prevent duplicates)
      let store = await Store.findOne({ subdomain: subdomain.toLowerCase() });

      if (!store) {
        // Create the store after payment verification and link to authenticated user
        store = await Store.create({
          name,
          subdomain: subdomain.toLowerCase(),
          owner: req.user._id, // Link to authenticated user
          paymentStatus: "paid",
          paidAt: Date.now(),
          paymentResult: {
            id: session.id,
            status: session.payment_status,
            update_time: new Date().toISOString(),
            email_address: session.customer_details?.email || session.metadata?.email || req.user.email,
          },
          stripeSessionId: session.id,
        });

        // Update user's store field to link user to store and set as admin
        const user = await User.findById(req.user._id);
        if (user) {
          // Always update user's store to their new store
          // This ensures they are linked to the store they just created/paid for
          user.store = store._id;
          
          // Set user as admin since they own the store
          if (!user.isAdmin) {
            user.isAdmin = true;
          }
          await user.save();
        }
      } else if (store.paymentStatus !== "paid") {
        // Update existing store with payment info and link to user if not already linked
        store.paymentStatus = "paid";
        store.paidAt = Date.now();
        if (!store.owner) {
          store.owner = req.user._id; // Link to authenticated user
        }
        store.paymentResult = {
          id: session.id,
          status: session.payment_status,
          update_time: new Date().toISOString(),
          email_address: session.customer_details?.email || session.metadata?.email || req.user.email,
        };
        store.stripeSessionId = session.id;
        await store.save();

        // Update user's store field if not already set and set as admin
        const user = await User.findById(req.user._id);
        if (user) {
          // Always update user's store to their new store
          user.store = store._id;
          
          // Set user as admin since they own the store
          if (!user.isAdmin) {
            user.isAdmin = true;
          }
          await user.save();
        }
      }

      res.json({ verified: true, store, message: "Payment verified and store created" });
    } else {
      res.status(400);
      throw new Error("Payment not completed");
    }
  })
);

// ========================
// Store Dashboard Routes (Protected - Store Owner Only)
// NOTE: These routes are registered in server.js AFTER tenantMiddleware
// because they need req.storeId which is set by tenantMiddleware
// ========================
// Dashboard routes moved to server.js to run after tenantMiddleware

router.route("/").post(protect, createStore);

export default router;

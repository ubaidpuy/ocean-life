import express from "express";
import {
  createCheckoutSession,
  getSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
} from "../controllers/subscriptionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/create-checkout-session")
  .post(protect, createCheckoutSession);

router.route("/status").get(protect, getSubscriptionStatus);

router.route("/cancel").post(protect, cancelSubscription);

router.route("/reactivate").post(protect, reactivateSubscription);

export default router;


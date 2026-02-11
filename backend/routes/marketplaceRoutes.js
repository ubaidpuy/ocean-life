import express from "express";
import {
  createPaymentIntent,
  getPaymentIntentStatus,
} from "../controllers/marketplaceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/create-payment-intent").post(protect, createPaymentIntent);

router
  .route("/payment-intent/:paymentIntentId")
  .get(protect, getPaymentIntentStatus);

export default router;


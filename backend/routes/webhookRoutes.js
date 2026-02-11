import express from "express";
import { handleStripeWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// Webhook endpoint must use raw body for signature verification
// We'll handle this in server.js with express.raw() middleware
router.route("/stripe").post(handleStripeWebhook);

export default router;


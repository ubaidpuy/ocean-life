import express from "express";
import {
  getAdminDashboard,
  getSubscriptionAnalytics,
  getMarketplaceTransactions,
} from "../controllers/adminController.js";
import { protect, superAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes require super admin access
router.use(protect, superAdmin);

router.route("/dashboard").get(getAdminDashboard);

router.route("/subscriptions").get(getSubscriptionAnalytics);

router.route("/marketplace-transactions").get(getMarketplaceTransactions);

export default router;

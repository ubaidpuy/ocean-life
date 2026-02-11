import express from "express";
import {
  createConnectedAccount,
  createOnboardingLink,
  createLoginLink,
  getConnectStatus,
} from "../controllers/connectController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/create-account").post(protect, createConnectedAccount);

router.route("/create-onboarding-link").post(protect, createOnboardingLink);

router.route("/create-login-link").post(protect, createLoginLink);

router.route("/status").get(protect, getConnectStatus);

export default router;

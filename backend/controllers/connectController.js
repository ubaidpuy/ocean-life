import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import User from "../models/userModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create Stripe Express connected account
// @route   POST /api/connect/create-account
// @access  Private
export const createConnectedAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Note: Subscription is not required for initial Connect setup
  // User will subscribe after store creation

  // Check if account already exists
  if (user.stripeAccountId) {
    res.status(400);
    throw new Error("Connected account already exists");
  }

  // Create Express account
  const account = await stripe.accounts.create({
    type: "express",
    country: "US", // You can make this dynamic based on user input
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      userId: user._id.toString(),
      email: user.email,
    },
  });

  // Save account ID to user
  user.stripeAccountId = account.id;
  user.stripeAccountStatus = account.details_submitted
    ? "active"
    : "pending";
  await user.save();

  res.json({
    accountId: account.id,
    status: user.stripeAccountStatus,
    message: "Connected account created successfully",
  });
});

// @desc    Create onboarding link for connected account
// @route   POST /api/connect/create-onboarding-link
// @access  Private
export const createOnboardingLink = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { next } = req.body; // Get next step from request body

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user.stripeAccountId) {
    res.status(400);
    throw new Error("No connected account found. Please create an account first.");
  }

  // Determine the correct frontend URL
  let frontendBaseUrl = req.headers.origin || "http://localhost:3000";
  
  // If user has a store, ensure we redirect back to THEIR store subdomain
  // This prevents redirecting to the main platform or another store
  if (user.store) {
      // Find the store to get the subdomain
      // We can't rely solely on req.headers.origin if the user initiated this from main platform (unlikely but possible)
      const Store = await import("../models/storeModel.js").then(m => m.default);
      const userStore = await Store.findById(user.store);
      
      if (userStore) {
          const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
          const host = req.headers.host; // e.g. localhost:5000 or api.domain.com
          
          // Construct URL based on environment
          // This is a simplified logic, might need adjustment based on specific deployment
           if (frontendBaseUrl.includes('localhost') || frontendBaseUrl.includes('127.0.0.1')) {
               frontendBaseUrl = `${protocol}://${userStore.subdomain}.localhost:3000`;
           } else if (frontendBaseUrl.includes('.myapp.local')) {
               const parts = new URL(frontendBaseUrl).hostname.split('.');
               const baseDomain = parts.slice(-2).join('.');
               frontendBaseUrl = `${protocol}://${userStore.subdomain}.${baseDomain}:${new URL(frontendBaseUrl).port}`;
           }
           // For production with custom domains, you'd handle it here
      }
  }

  // Build return URL with next parameter if provided
  let returnUrl = `${frontendBaseUrl}/connect/onboarding/success`;
  let refreshUrl = `${frontendBaseUrl}/connect/onboarding/refresh`;
  if (next) {
    returnUrl += `?next=${encodeURIComponent(next)}`;
    refreshUrl += `?next=${encodeURIComponent(next)}`;
  }

  // Create account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: user.stripeAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  res.json({
    url: accountLink.url,
    expiresAt: new Date(accountLink.expires_at * 1000).toISOString(),
  });
});

// @desc    Create login link for connected account
// @route   POST /api/connect/create-login-link
// @access  Private
export const createLoginLink = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user.stripeAccountId) {
    res.status(400);
    throw new Error("No connected account found");
  }

  // Create login link
  const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);

  res.json({
    url: loginLink.url,
  });
});

// @desc    Get connected account status
// @route   GET /api/connect/status
// @access  Private
export const getConnectStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  let accountDetails = null;

  if (user.stripeAccountId) {
    try {
      const account = await stripe.accounts.retrieve(user.stripeAccountId);
      accountDetails = {
        id: account.id,
        type: account.type,
        country: account.country,
        defaultCurrency: account.default_currency,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        email: account.email,
      };
    } catch (error) {
      console.error("Error retrieving account:", error);
    }
  }

  res.json({
    stripeAccountId: user.stripeAccountId,
    stripeAccountStatus: user.stripeAccountStatus,
    accountDetails,
  });
});


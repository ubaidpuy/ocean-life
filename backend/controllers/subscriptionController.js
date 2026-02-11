import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import User from "../models/userModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create Stripe Checkout session for subscription
// @route   POST /api/subscriptions/create-checkout-session
// @access  Private
export const createCheckoutSession = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if user already has an active subscription
  if (user.subscriptionStatus === "active") {
    res.status(400);
    throw new Error("User already has an active subscription");
  }

  const frontendUrl = req.headers.origin || "http://localhost:3000";

  // Create or retrieve Stripe customer
  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user._id.toString(),
      },
    });
    customerId = customer.id;

    // Save customer ID to user
    user.stripeCustomerId = customerId;
    await user.save();
  }

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/subscription/cancel`,
    metadata: {
      userId: user._id.toString(),
    },
    subscription_data: {
      metadata: {
        userId: user._id.toString(),
      },
    },
  });

  res.json({
    sessionId: session.id,
    url: session.url,
  });
});

// @desc    Get subscription status
// @route   GET /api/subscriptions/status
// @access  Private
export const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  let subscriptionDetails = null;

  if (user.subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        user.subscriptionId
      );
      subscriptionDetails = {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        currentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      console.error("Error retrieving subscription:", error);
    }
  }

  res.json({
    subscriptionStatus: user.subscriptionStatus,
    subscriptionId: user.subscriptionId,
    stripeCustomerId: user.stripeCustomerId,
    subscriptionDetails,
  });
});

// @desc    Cancel subscription
// @route   POST /api/subscriptions/cancel
// @access  Private
export const cancelSubscription = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user.subscriptionId) {
    res.status(400);
    throw new Error("No active subscription found");
  }

  // Cancel subscription at period end
  const subscription = await stripe.subscriptions.update(
    user.subscriptionId,
    {
      cancel_at_period_end: true,
    }
  );

  res.json({
    message: "Subscription will be canceled at the end of the billing period",
    subscription: {
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    },
  });
});

// @desc    Reactivate subscription
// @route   POST /api/subscriptions/reactivate
// @access  Private
export const reactivateSubscription = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user.subscriptionId) {
    res.status(400);
    throw new Error("No subscription found");
  }

  // Reactivate subscription
  const subscription = await stripe.subscriptions.update(
    user.subscriptionId,
    {
      cancel_at_period_end: false,
    }
  );

  res.json({
    message: "Subscription reactivated",
    subscription: {
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
});


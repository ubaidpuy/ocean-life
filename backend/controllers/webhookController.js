import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Handle Stripe webhooks
// @route   POST /api/webhooks/stripe
// @access  Public (Stripe will call this)
export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    res.status(500);
    throw new Error("Webhook secret not configured");
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  try {
    switch (event.type) {
      // Subscription Events
      case "checkout.session.completed":
        // Check if it's a subscription or payment
        if (event.data.object.mode === "subscription") {
          await handleCheckoutSessionCompleted(event.data.object);
        } else {
          // It's a payment checkout session
          await handlePaymentCheckoutCompleted(event.data.object);
        }
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      // Connect Account Events
      case "account.updated":
        await handleAccountUpdated(event.data.object);
        break;

      // Marketplace Payment Events
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "transfer.created":
        await handleTransferCreated(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========================
// Subscription Handlers
// ========================

const handleCheckoutSessionCompleted = async (session) => {
  if (session.mode === "subscription") {
    const userId = session.metadata?.userId;

    if (!userId) {
      console.error("No userId in checkout session metadata");
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      console.error(`User not found: ${userId}`);
      return;
    }

    // Update user with subscription info
    user.stripeCustomerId = session.customer;
    user.subscriptionId = session.subscription;
    user.subscriptionStatus = "active";

    await user.save();

    console.log(`Subscription activated for user: ${userId}`);
  }
};

const handleInvoicePaid = async (invoice) => {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return;
  }

  // Find user by subscription ID
  const user = await User.findOne({ subscriptionId });

  if (!user) {
    console.error(`User not found for subscription: ${subscriptionId}`);
    return;
  }

  // Ensure subscription is still active
  if (user.subscriptionStatus !== "active") {
    user.subscriptionStatus = "active";
    await user.save();
  }

  console.log(`Invoice paid for subscription: ${subscriptionId}`);
};

const handleSubscriptionDeleted = async (subscription) => {
  const user = await User.findOne({ subscriptionId: subscription.id });

  if (!user) {
    console.error(`User not found for subscription: ${subscription.id}`);
    return;
  }

  user.subscriptionStatus = "canceled";
  await user.save();

  console.log(`Subscription canceled for user: ${user._id}`);
};

const handleSubscriptionUpdated = async (subscription) => {
  const user = await User.findOne({ subscriptionId: subscription.id });

  if (!user) {
    console.error(`User not found for subscription: ${subscription.id}`);
    return;
  }

  user.subscriptionStatus = subscription.status;
  await user.save();

  console.log(`Subscription updated for user: ${user._id}, status: ${subscription.status}`);
};

// ========================
// Connect Account Handlers
// ========================

const handleAccountUpdated = async (account) => {
  const user = await User.findOne({ stripeAccountId: account.id });

  if (!user) {
    console.error(`User not found for account: ${account.id}`);
    return;
  }

  // Update account status
  if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
    user.stripeAccountStatus = "active";
  } else if (account.details_submitted) {
    user.stripeAccountStatus = "restricted";
  } else {
    user.stripeAccountStatus = "pending";
  }

  await user.save();

  console.log(`Account updated for user: ${user._id}, status: ${user.stripeAccountStatus}`);
};

// ========================
// Marketplace Payment Handlers
// ========================

const handlePaymentCheckoutCompleted = async (session) => {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error("No orderId in checkout session metadata");
    return;
  }

  const order = await Order.findById(orderId);

  if (!order) {
    console.error(`Order not found: ${orderId}`);
    return;
  }

  // Retrieve the PaymentIntent from the checkout session
  let paymentIntentId = null;
  if (session.payment_intent) {
    paymentIntentId = typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : session.payment_intent.id;
  }

  // If we have a PaymentIntent, retrieve it to get transfer info
  if (paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Update order with PaymentIntent ID
      order.stripePaymentIntentId = paymentIntentId;
      
      // If this is a marketplace payment, update payment breakdown
      if (paymentIntent.application_fee_amount && paymentIntent.transfer_data) {
        const totalAmount = paymentIntent.amount / 100;
        const platformFee = paymentIntent.application_fee_amount / 100;
        const storeEarning = (paymentIntent.amount - paymentIntent.application_fee_amount) / 100;
        
        order.paymentBreakdown = {
          totalAmount,
          adminEarning: platformFee,
          platformFee: platformFee,
          storeEarning: storeEarning,
        };
      }
    } catch (error) {
      console.error(`Error retrieving payment intent ${paymentIntentId}:`, error);
    }
  }

  // Update order as paid
  if (session.payment_status === "paid" && !order.isPaid) {
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      id: session.id,
      status: session.payment_status,
      update_time: new Date().toISOString(),
      email_address: session.customer_details?.email || session.customer_email,
    };

    await order.save();
    console.log(`Order ${orderId} marked as paid via checkout session`);
  }
};

const handlePaymentIntentSucceeded = async (paymentIntent) => {
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) {
    console.error("No orderId in payment intent metadata");
    return;
  }

  const order = await Order.findById(orderId);

  if (!order) {
    console.error(`Order not found: ${orderId}`);
    return;
  }

  // Update order as paid
  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentResult = {
    id: paymentIntent.id,
    status: paymentIntent.status,
    update_time: new Date().toISOString(),
    email_address: paymentIntent.receipt_email || paymentIntent.metadata?.email,
  };

  await order.save();

  console.log(`Order ${orderId} marked as paid`);
};

const handleTransferCreated = async (transfer) => {
  // Find order by payment intent ID
  const paymentIntentId = transfer.source_transaction;

  if (!paymentIntentId) {
    return;
  }

  const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });

  if (!order) {
    console.error(`Order not found for payment intent: ${paymentIntentId}`);
    return;
  }

  // Update order with transfer ID
  order.stripeTransferId = transfer.id;
  await order.save();

  console.log(`Transfer created for order: ${order._id}`);
};


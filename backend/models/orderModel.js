import mongoose from "mongoose";

const orderSchema = mongoose.Schema(
  {
    // --- NEW ADDITION START ---
    // This links the order to a specific tenant (Store)
    store: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Store",
      index: true, // IMPORTANT: Adds an index so finding orders for a specific store is fast
    },
    // --- NEW ADDITION END ---

    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        // Variation information (which specific variation was ordered)
        variationId: { type: String }, // ID of the product.variations subdocument
        sku: { type: String }, // SKU of the variation (optional)
        // New generic variation metadata, e.g. { key: "ram", name: "RAM", value: "16GB" }
        variation: {
          key: { type: String },
          name: { type: String },
          value: { type: String },
          label: { type: String },
        },
        // Legacy shape kept for backward compatibility with existing orders
        attributes: {
          color: { type: String },
          size: { type: String },
          other: { type: String },
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    // --- STRIPE MARKETPLACE PAYMENT FIELDS ---
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
    stripeTransferId: {
      type: String,
      default: null,
    },
    // Payment breakdown for marketplace
    paymentBreakdown: {
      totalAmount: { type: Number, default: 0.0 },
      adminEarning: { type: Number, default: 0.0 }, // Platform's share
      platformFee: { type: Number, default: 0.0 }, // Alias for adminEarning
      storeEarning: { type: Number, default: 0.0 }, // Store owner's share
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;

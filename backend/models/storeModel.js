import mongoose from "mongoose";

const storeSchema = mongoose.Schema(
  {
    // The Merchant (Admin) who owns this shop
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "User",
    },

    // The visual name (e.g., "Nike Shoes")
    name: {
      type: String,
      required: true,
    },

    // CRITICAL: The URL identifier (e.g., "nike" -> nike.yourapp.com)
    subdomain: {
      type: String,
      required: true,
      unique: true, // No two stores can have the same subdomain
      lowercase: true, // Always save as lowercase for URL matching
      trim: true,
    },

    // Custom Branding (So Store A looks different from Store B)
    branding: {
      logo: { type: String, default: "/images/default-logo.png" },
      primaryColor: { type: String, default: "#333333" }, // For buttons/navbar
      secondaryColor: { type: String, default: "#ffffff" },
    },

    // Contact info specific to this store (displayed in their footer/invoice)
    contactInfo: {
      email: { type: String },
      phone: { type: String },
      address: { type: String },
    },

    // SaaS Management
    isActive: {
      type: Boolean,
      default: true, // You can set this to false if they stop paying you
    },

    // Payment tracking for store creation
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentResult: {
      id: { type: String }, // Stripe session ID
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    paidAt: {
      type: Date,
    },
    stripeSessionId: {
      type: String, // Store Stripe checkout session ID
    },
  },
  {
    timestamps: true,
  }
);

const Store = mongoose.model("Store", storeSchema);

export default Store;

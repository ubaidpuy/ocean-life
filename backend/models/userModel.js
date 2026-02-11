import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    // --- NEW ADDITION: Store Reference ---
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      // We set required to false to allow for a "Super Admin"
      // who manages the whole platform and doesn't belong to one specific store.
      required: false,
    },

    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      // --- CHANGED: REMOVE 'unique: true' FROM HERE ---
      // We handle uniqueness at the bottom using a compound index
    },
    password: {
      type: String,
      required: true,
    },

    // In this new context:
    // isAdmin = true means they are the Merchant (Store Owner)
    // isAdmin = false means they are a Customer
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },

    // --- NEW ADDITION: Super Admin ---
    // This is YOU (The Platform Owner). You can see everything.
    isSuperAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },

    // --- STRIPE SUBSCRIPTION FIELDS ---
    stripeCustomerId: {
      type: String,
      default: null,
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "trialing", "past_due", "canceled", "unpaid", "incomplete", null],
      default: null,
    },
    // --- STRIPE CONNECT FIELDS ---
    stripeAccountId: {
      type: String,
      default: null,
    },
    stripeAccountStatus: {
      type: String,
      enum: ["pending", "active", "restricted", "disabled", null],
      default: null,
    },
    stripeSellerId: { // For backward compatibility if needed, though stripeAccountId is preferred
      type: String,
      default: null,
    },
    // --- EMAIL VERIFICATION FIELDS ---
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    // --- PASSWORD RESET FIELDS ---
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// --- NEW CRITICAL ADDITION: Compound Index ---
// This allows the same email to exist multiple times in the database,
// BUT only once per store.
// John can be in Store A and Store B, but John cannot be in Store A twice.
userSchema.index({ email: 1, store: 1 }, { unique: true });

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;

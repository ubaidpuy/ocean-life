import mongoose from "mongoose";

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const productSchema = mongoose.Schema(
  {
    // --- NEW ADDITION START ---
    store: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Store",
      index: true, // Essential for performance when filtering products by shop
    },
    // --- NEW ADDITION END ---

    // Note: 'user' here now represents the specific staff member/admin
    // who created the product, but 'store' represents ownership.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    // CHANGED: String -> ObjectId Ref
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      // required: true, // Temporarily false for migration safety if needed, or keeping it strict
      required: false, // Set to false to allow legacy products to exist without crashing immediately
    },
    description: {
      type: String,
      required: true,
    },
    // --- FLEXIBLE VARIATION SYSTEM ---
    // Selected variation type for this product (only one dimension per product)
    // e.g. "color" for T‑shirts, "size" for shoes, "other" for things like "RAM"
    // Not required – products can exist without any variations.
    variationType: {
      type: String,
      enum: ["color", "size", "other"],
      default: undefined,
    },
    // Human friendly label shown in the UI, e.g. "Color", "Size", "RAM"
    variationName: {
      type: String,
      default: "",
    },
    // Normalized key used internally, e.g. "color", "size", "ram"
    variationKey: {
      type: String,
      default: "",
    },
    // Each entry represents a single selectable option for the chosen variation
    // type. Example for "RAM": [{ value: "16GB", price: 100, countInStock: 5 }]
    variations: [
      {
        label: {
          type: String,
          default: "",
        },
        value: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        countInStock: {
          type: Number,
          required: true,
        },
        // Optional SKU for stores that use SKU‑based inventory
        sku: {
          type: String,
        },
        // Optional per‑variation gallery (fallbacks to product.image on frontend)
        images: [
          {
            type: String,
          },
        ],
      },
    ],
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    // NOTE: price and countInStock at product level are kept as
    // summary/fallback fields for backward compatibility. New logic
    // should manage price/stock at the variation level.
    price: {
      type: Number,
      required: false,
      default: 0,
    },
    countInStock: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;

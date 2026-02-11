import path from "path";
import express from "express";
import dotenv from "dotenv";
import colors from "colors";
import morgan from "morgan";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import connectDB from "./config/db.js";
import cors from "cors";

// --- NEW IMPORTS ---
import tenantMiddleware from "./middleware/tenantMiddleware.js";
import storeRoutes from "./routes/storeRoutes.js";
import { protect } from "./middleware/authMiddleware.js";
import storeOwner from "./middleware/storeOwnerMiddleware.js";
import {
  getStoreDashboard,
  getStoreDetails,
  updateStoreDetails,
} from "./controllers/storeController.js";
// -------------------

import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import connectRoutes from "./routes/connectRoutes.js";
import marketplaceRoutes from "./routes/marketplaceRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();
connectDB();

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests from localhost and localhost subdomains
      if (!origin || 
          origin.startsWith('http://localhost') || 
          origin.startsWith('http://127.0.0.1') ||
          origin.includes('.myapp.local') ||
          origin.includes('myapp.local')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins in development
      }
    },
    credentials: true,
  })
);

// --- WEBHOOK ROUTE (Must be before express.json()) ---
// Stripe webhooks require raw body for signature verification
app.use(
  "/api/webhooks",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

app.use(express.json());

// --- STORE CREATION ROUTES (Don't need tenant middleware) ---
// These routes need to be BEFORE tenant middleware because store doesn't exist yet
app.use("/api/stores", storeRoutes);

// --- ADMIN ROUTES (Don't need tenant middleware) ---
// Super admin routes that work across all stores
app.use("/api/admin", adminRoutes);

// --- SUBSCRIPTION ROUTES (Don't need tenant middleware) ---
// Subscription routes are platform-level, not store-specific
app.use("/api/subscriptions", subscriptionRoutes);

// --- CONNECT ROUTES (Don't need tenant middleware) ---
// Connect account routes are user-level, not store-specific
app.use("/api/connect", connectRoutes);

// --- APPLY TENANT MIDDLEWARE ---
// This must run BEFORE routes that need store identification
// It determines if the request is for "nike.app.com" or "adidas.app.com"
app.use(tenantMiddleware);
// -------------------------------

// --- STORE DASHBOARD ROUTES (Need tenant middleware) ---
// These routes need req.storeId which is set by tenantMiddleware
// Register these AFTER tenant middleware so req.storeId is available
app.get("/api/stores/dashboard", protect, storeOwner, getStoreDashboard);
app.get("/api/stores/details", protect, storeOwner, getStoreDetails);
app.put("/api/stores/details", protect, storeOwner, updateStoreDetails);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/categories", categoryRoutes);

// --- MARKETPLACE ROUTES (Need tenant middleware) ---
// Marketplace payment routes need store context
app.use("/api/marketplace", marketplaceRoutes);

app.get("/api/config/paypal", (req, res) =>
  res.send(process.env.PAYPAL_CLIENT_ID)
);

const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running....");
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

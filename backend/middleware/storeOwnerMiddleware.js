import asyncHandler from "express-async-handler";
import Store from "../models/storeModel.js";
import User from "../models/userModel.js";

// Middleware to check if user is the store owner
const storeOwner = asyncHandler(async (req, res, next) => {
  // User must be authenticated (req.user set by protect middleware)
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized, no user");
  }

  // Store must be identified (req.storeId set by tenantMiddleware)
  if (!req.storeId) {
    res.status(400);
    // Provide more helpful error message
    const subdomain = req.headers['x-subdomain'] || req.headers['X-Subdomain'] || 'unknown';
    throw new Error(`Store not identified. Subdomain: ${subdomain}. Please ensure you're accessing from the correct store subdomain.`);
  }

  // Get the store
  const store = await Store.findById(req.storeId);

  if (!store) {
    res.status(404);
    throw new Error("Store not found");
  }

  // Get full user details
  const user = await User.findById(req.user._id);

  // Check if user is the store owner OR is an admin in this store
  // Store owner is either:
  // 1. The user ID matches store.owner
  // 2. User is admin AND belongs to this store
  const isOwner = 
    (store.owner && store.owner.toString() === user._id.toString()) ||
    (user.isAdmin && user.store && user.store.toString() === req.storeId.toString());

  if (!isOwner) {
    res.status(403);
    throw new Error("Not authorized. Only store owner can access this resource.");
  }

  // Attach store info to request
  req.store = store;
  req.isStoreOwner = true;

  next();
});

export default storeOwner;


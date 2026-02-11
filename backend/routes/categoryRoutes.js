import express from "express";
const router = express.Router();
import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
} from "../controllers/categoryController.js";
import { protect } from "../middleware/authMiddleware.js";
import storeOwner from "../middleware/storeOwnerMiddleware.js";

// Public to read, Private/StoreOwner to write
router
  .route("/")
  .get(getCategories)
  .post(protect, storeOwner, createCategory);

router
  .route("/:id")
  .delete(protect, storeOwner, deleteCategory)
  .put(protect, storeOwner, updateCategory);

export default router;

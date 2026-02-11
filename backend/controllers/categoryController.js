import asyncHandler from "express-async-handler";
import Category from "../models/categoryModel.js";

// @desc    Get all categories for a store
// @route   GET /api/categories
// @access  Public (or Private? - let's keep it Public for product filtering, but maybe Private for management)
// Actually, usually public to list in UI, but management is private.
// We'll make it Public so users can see categories to filter products.
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ store: req.storeId });
  res.json(categories);
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin/StoreOwner
const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const categoryExists = await Category.findOne({ name, store: req.storeId });

  if (categoryExists) {
    res.status(400);
    throw new Error("Category already exists");
  }

  const category = await Category.create({
    name,
    user: req.user._id,
    store: req.storeId,
  });

  if (category) {
    res.status(201).json(category);
  } else {
    res.status(400);
    throw new Error("Invalid category data");
  }
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin/StoreOwner
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    _id: req.params.id,
    store: req.storeId,
  });

  if (category) {
    await category.deleteOne();
    res.json({ message: "Category removed" });
  } else {
    res.status(404);
    throw new Error("Category not found");
  }
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin/StoreOwner
const updateCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const category = await Category.findOne({
    _id: req.params.id,
    store: req.storeId,
  });

  if (category) {
    category.name = name || category.name;
    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } else {
    res.status(404);
    throw new Error("Category not found");
  }
});

export { getCategories, createCategory, deleteCategory, updateCategory };

import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";

// Helper: derive summary price & stock from variations
const applyVariationSummary = (productDoc) => {
  if (
    Array.isArray(productDoc.variations) &&
    productDoc.variations.length > 0
  ) {
    const totalStock = productDoc.variations.reduce(
      (sum, v) => sum + (v.countInStock || 0),
      0
    );
    const prices = productDoc.variations
      .map((v) => v.price)
      .filter((p) => typeof p === "number");
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

    productDoc.price = minPrice;
    productDoc.countInStock = totalStock;
  } else {
    productDoc.price = productDoc.price || 0;
    productDoc.countInStock = productDoc.countInStock || 0;
  }
};

// Helper: normalize variation key
const normalizeVariationKey = (variationType, variationName) => {
  if (variationType === "color" || variationType === "size") {
    return variationType;
  }
  const source = (variationName || "").trim() || "option";
  return source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// @desc    Fetch all products
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const keywordQuery = req.query.keyword;
  const keyword =
    keywordQuery && keywordQuery !== "null" && keywordQuery.trim() !== ""
      ? { name: { $regex: keywordQuery, $options: "i" } }
      : {};

  if (!req.storeId) return res.json({ products: [], page: 1, pages: 0 });

  const count = await Product.countDocuments({
    ...keyword,
    store: req.storeId,
  });
  const products = await Product.find({ ...keyword, store: req.storeId })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Fetch single product
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    store: req.storeId,
  });
  if (product) res.json(product);
  else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Delete a product
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    store: req.storeId,
  });
  if (product) {
    await product.deleteOne();
    res.json({ message: "Product removed" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Create a product
const createProduct = asyncHandler(async (req, res) => {
  try {
    const { name, description, image, brand, category, variations } = req.body;

    const productData = {
      name: name || "New Product",
      user: req.user._id,
      store: req.storeId,
      image: image || "/images/sample.jpg",
      brand: brand || "Brand",
      // category: category || "Category", // REMOVED default string to avoid CastError
      description: description || "Product description",
      numReviews: 0,
      variations: [],
    };

    if (Array.isArray(variations) && variations.length > 0) {
      const firstVariant = variations[0];
      const validTypes = ["color", "size", "other"];
      const incomingType = firstVariant.type
        ? firstVariant.type.toLowerCase()
        : "other";

      productData.variationType = validTypes.includes(incomingType)
        ? incomingType
        : "other";
      productData.variationName = firstVariant.name || "Option";
      productData.variationKey = normalizeVariationKey(
        productData.variationType,
        productData.variationName
      );

      productData.variations = variations.map((v) => ({
        label: v.name,
        value: v.value,
        price: Number(v.price),
        countInStock: Number(v.countInStock),
        sku: v.sku || "",
        images: [],
      }));
    }

    const product = new Product(productData);
    applyVariationSummary(product);
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @desc    Update a product (FIXED LOGIC HERE)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, image, brand, category, variations } = req.body;

  const product = await Product.findOne({
    _id: req.params.id,
    store: req.storeId,
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Update basic fields
  product.name = name || product.name;
  product.description = description || product.description;
  product.image = image || product.image;
  product.brand = brand || product.brand;
  product.category = category || product.category;

  // --- VARIATION UPDATE LOGIC (IMPROVED) ---
  if (Array.isArray(variations) && variations.length > 0) {
    const firstVariant = variations[0];
    const validTypes = ["color", "size", "other"];

    // 1. Determine Type safely
    // Pehle check karo frontend ne kya bheja
    let incomingType = firstVariant.type
      ? firstVariant.type.toLowerCase()
      : null;

    // Agar frontend ne type nahi bheja, to DB wala use karo
    if (!incomingType && product.variationType) {
      incomingType = product.variationType;
    }

    // 2. CRITICAL FIX: The "Anti-Reset" Defense
    // Agar DB mein "color" ya "size" hai, lekin frontend galti se "other" bhej raha hai
    // (jo aksar updates mein hota hai), to hum purana type force karenge.
    if (
      incomingType === "other" &&
      (product.variationType === "color" || product.variationType === "size")
    ) {
      incomingType = product.variationType;
    }

    // Final assignment check
    product.variationType = validTypes.includes(incomingType)
      ? incomingType
      : "other";

    // 3. Name Handling
    // Label bhi preserve karein
    product.variationName =
      firstVariant.name || product.variationName || "Option";

    product.variationKey = normalizeVariationKey(
      product.variationType,
      product.variationName
    );

    // 4. Map Variations
    product.variations = variations.map((v) => {
      if (!v.value) throw new Error("Variation value is required");
      if (v.price === undefined) throw new Error("Variation price is required");

      return {
        _id: v._id, // Keep existing ID
        // Important: Use v.name (frontend) OR v.label (DB) OR global name
        label: v.name || v.label || product.variationName,
        value: v.value,
        price: Number(v.price),
        countInStock: Number(v.countInStock),
        sku: v.sku,
        images: v.images || [],
      };
    });
  } else {
    // If variations cleared explicitly
    product.variationType = undefined;
    product.variationName = "";
    product.variationKey = "";
    product.variations = [];
  }

  applyVariationSummary(product);

  const updatedProduct = await product.save();
  res.json(updatedProduct);
});

// @desc    Create new review
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findOne({
    _id: req.params.id,
    store: req.storeId,
  });

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Product already reviewed");
    }
    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: "Review added" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Get top rated products
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ store: req.storeId })
    .sort({ rating: -1 })
    .limit(3);
  res.json(products);
});

export {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
};

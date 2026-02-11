import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";
import User from "./models/userModel.js";
import Product from "./models/productModel.js";
import Store from "./models/storeModel.js";
import connectDB from "./config/db.js";
import { getStoreDashboard } from "./controllers/storeController.js";

dotenv.config();

const verifyDashboard = async () => {
  try {
    await connectDB();
    console.log("DB Connected".green);

    // 1. Setup Context
    const store = await Store.findOne({});
    if (!store) {
      console.error("No store found.".red);
      process.exit(1);
    }
    
    let admin = await User.findOne({ isAdmin: true, store: store._id });
    if (!admin) {
        const salt = await import("bcryptjs").then(m => m.default.genSalt(10));
        const hash = await import("bcryptjs").then(m => m.default.hash("123456", salt));
        admin = await User.create({
            name: "Test Admin",
            email: `admin_${Date.now()}@example.com`,
            password: hash,
            isAdmin: true,
            store: store._id,
        });
    }

    // 2. Create an Out of Stock Product
    const oosProduct = await Product.create({
      name: "OOS Alert Test Product",
      user: admin._id,
      store: store._id,
      image: "/images/test.jpg",
      brand: "TestBrand",
      category: new mongoose.Types.ObjectId(), // Fake ID
      description: "Test Description",
      price: 100,
      countInStock: 0, // CRITICAL
      variations: [],
    });
    console.log(`Created OOS Product: ${oosProduct.name}`.green);

    // 3. Mock Req/Res and Call Controller
    const req = {
      storeId: store._id,
      user: admin,
    };

    let responseData = {};
    const res = {
      json: (data) => {
        responseData = data;
      },
      status: (code) => {
        console.log(`Status Code: ${code}`);
        return res;
      },
    };

    await getStoreDashboard(req, res);

    // 4. Verify Response
    console.log("\n--- Dashboard API Response Verification ---");
    if (responseData.products && responseData.products.outOfStockList) {
      console.log("outOfStockList field exists!".green);
      console.log(`Length: ${responseData.products.outOfStockList.length}`);
      
      const found = responseData.products.outOfStockList.find(
        (p) => p._id.toString() === oosProduct._id.toString()
      );

      if (found) {
        console.log(`Found OOS product in list: ${found.name}`.green.bold);
      } else {
        console.log("Did NOT find OOS product in list.".red);
      }
    } else {
      console.log("outOfStockList field MISSING in response.".red);
    }

    // Cleanup
    await Product.deleteOne({ _id: oosProduct._id });
    console.log("\nCleanup Done.");

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`.red);
    process.exit(1);
  }
};

verifyDashboard();

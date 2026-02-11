// Quick script to check if user exists
import mongoose from 'mongoose';
import User from './backend/models/userModel.js';
import Store from './backend/models/storeModel.js';
import dotenv from 'dotenv';
dotenv.config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find store by subdomain
    const store = await Store.findOne({ subdomain: 'jane-store' });
    if (store) {
      console.log('Store found:', store.name);
      console.log('Store owner ID:', store.owner);
      
      // Find user by owner ID
      const user = await User.findById(store.owner);
      if (user) {
        console.log('User found:', user.email);
        console.log('User store field:', user.store);
      } else {
        console.log('User NOT found with owner ID:', store.owner);
        
        // Try to find user by email
        const userByEmail = await User.findOne({ email: 'jane@example.com' });
        if (userByEmail) {
          console.log('User found by email:', userByEmail.email);
          console.log('User ID:', userByEmail._id);
          console.log('User store field:', userByEmail.store);
        } else {
          console.log('User NOT found by email either');
        }
      }
    } else {
      console.log('Store not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkUser();

import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import InventoryProduct from '../models/inventory.model.js';

const testInventory = async () => {
  try {
    await connectDB();
    
    // Check if inventory items exist
    const count = await InventoryProduct.countDocuments();
    console.log(`Total inventory items: ${count}`);
    
    // Get all inventory items
    const items = await InventoryProduct.find();
    console.log('Inventory items:');
    items.forEach(item => {
      console.log(`- ${item.name} (${item.category}) - Stock: ${item.stockQuantity}, Price: LKR ${item.price}`);
    });
    
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.connection.close();
  }
};

testInventory();

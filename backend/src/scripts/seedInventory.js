import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import InventoryProduct from '../models/inventory.model.js';

const inventoryItems = [
  {
    name: 'Tomato Seeds - Hybrid F1',
    category: 'seeds',
    description: 'High-yield hybrid tomato seeds perfect for home gardens and commercial farming. Disease resistant and produces large, juicy tomatoes.',
    images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'],
    stockQuantity: 150,
    price: 250.00,
    status: 'Available'
  },
  {
    name: 'NPK Fertilizer 20-20-20',
    category: 'fertilizers',
    description: 'Balanced NPK fertilizer suitable for all crops. Promotes healthy growth and high yields.',
    images: ['https://images.unsplash.com/photo-1586771107445-d3ca888129ce?w=400'],
    stockQuantity: 8,
    price: 1200.00,
    status: 'Low stock'
  },
  {
    name: 'Organic Pesticide - Neem Oil',
    category: 'pesticides',
    description: '100% organic neem oil pesticide. Safe for beneficial insects and effective against common garden pests.',
    images: ['https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400'],
    stockQuantity: 0,
    price: 850.00,
    status: 'Out of stock'
  },
  {
    name: 'Potassium Nitrate',
    category: 'chemicals',
    description: 'High-grade potassium nitrate for improved fruit quality and plant health.',
    images: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400'],
    stockQuantity: 45,
    price: 1800.00,
    status: 'Available'
  },
  {
    name: 'Garden Spade - Heavy Duty',
    category: 'equipment',
    description: 'Professional grade garden spade with ergonomic handle. Perfect for digging and soil preparation.',
    images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'],
    stockQuantity: 12,
    price: 3500.00,
    status: 'Available'
  },
  {
    name: 'Drip Irrigation Kit',
    category: 'irrigation',
    description: 'Complete drip irrigation system for efficient water delivery. Includes 50m tubing and 100 drippers.',
    images: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400'],
    stockQuantity: 5,
    price: 4500.00,
    status: 'Low stock'
  },
  {
    name: 'Bell Pepper Seeds - Red',
    category: 'seeds',
    description: 'Sweet red bell pepper seeds. High germination rate and produces large, sweet peppers.',
    images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'],
    stockQuantity: 200,
    price: 180.00,
    status: 'Available'
  },
  {
    name: 'Compost - Organic',
    category: 'fertilizers',
    description: 'Rich organic compost made from natural materials. Improves soil structure and fertility.',
    images: ['https://images.unsplash.com/photo-1586771107445-d3ca888129ce?w=400'],
    stockQuantity: 25,
    price: 800.00,
    status: 'Available'
  },
  {
    name: 'Insecticide - Pyrethrum',
    category: 'pesticides',
    description: 'Natural pyrethrum-based insecticide. Effective against flying insects and safe for plants.',
    images: ['https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400'],
    stockQuantity: 30,
    price: 950.00,
    status: 'Available'
  },
  {
    name: 'Garden Hoe - Steel Head',
    category: 'equipment',
    description: 'Durable steel garden hoe for weeding and soil cultivation. Comfortable wooden handle.',
    images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'],
    stockQuantity: 0,
    price: 2800.00,
    status: 'Out of stock'
  }
];

const seed = async () => {
  try {
    await connectDB();

    // Clear existing inventory
    await InventoryProduct.deleteMany({});

    // Insert new inventory items
    for (const item of inventoryItems) {
      await InventoryProduct.create(item);
      console.log(`Created inventory item: ${item.name}`);
    }

    console.log('Inventory seeding complete.');
  } catch (err) {
    console.error('Inventory seeding failed:', err);
  } finally {
    await mongoose.connection.close();
  }
};

seed();

import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';

const seedListings = async () => {
  try {
    await connectDB();

    // Get farmer users
    const farmers = await User.find({ role: 'FARMER' });
    if (farmers.length === 0) {
      console.log('No farmers found. Please run seed:users first.');
      return;
    }

    // Clear existing listings
    await Listing.deleteMany({});

    const sampleListings = [
      {
        farmer: farmers[0]._id, // Use first farmer
        cropName: 'Fresh Tomatoes',
        pricePerKg: 120.00,
        capacityKg: 50,
        details: 'Fresh, organic tomatoes harvested from our farm. Perfect for cooking and salads. Grown without harmful pesticides.',
        images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'],
        harvestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: 'AVAILABLE'
      },
      {
        farmer: farmers[0]._id,
        cropName: 'Red Onions',
        pricePerKg: 80.00,
        capacityKg: 30,
        details: 'Premium red onions with excellent storage quality. Great for cooking and pickling.',
        images: ['https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400'],
        harvestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        status: 'AVAILABLE'
      },
      {
        farmer: farmers[0]._id,
        cropName: 'Green Bell Peppers',
        pricePerKg: 150.00,
        capacityKg: 25,
        details: 'Fresh green bell peppers, perfect for stuffing or stir-frying. Crisp and flavorful.',
        images: ['https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400'],
        harvestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: 'AVAILABLE'
      },
      {
        farmer: farmers[0]._id,
        cropName: 'Carrots',
        pricePerKg: 90.00,
        capacityKg: 40,
        details: 'Sweet and crunchy carrots, rich in vitamins. Great for snacking or cooking.',
        images: ['https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400'],
        harvestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        status: 'AVAILABLE'
      },
      {
        farmer: farmers[0]._id,
        cropName: 'Fresh Lettuce',
        pricePerKg: 60.00,
        capacityKg: 20,
        details: 'Crisp, fresh lettuce perfect for salads. Grown in controlled environment for maximum freshness.',
        images: ['https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400'],
        harvestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: 'AVAILABLE'
      },
      {
        farmer: farmers[0]._id,
        cropName: 'Potatoes',
        pricePerKg: 70.00,
        capacityKg: 100,
        details: 'High-quality potatoes suitable for all cooking methods. Great for boiling, frying, or baking.',
        images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400'],
        harvestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        status: 'AVAILABLE'
      },
      {
        farmer: farmers[0]._id,
        cropName: 'Cucumbers',
        pricePerKg: 100.00,
        capacityKg: 35,
        details: 'Fresh, crisp cucumbers perfect for salads and pickling. Grown organically.',
        images: ['https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400'],
        harvestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: 'AVAILABLE'
      },
      {
        farmer: farmers[0]._id,
        cropName: 'Spinach',
        pricePerKg: 110.00,
        capacityKg: 15,
        details: 'Fresh spinach leaves, rich in iron and vitamins. Perfect for salads and cooking.',
        images: ['https://images.unsplash.com/photo-1576045057995-389f1fad7346?w=400'],
        harvestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: 'AVAILABLE'
      }
    ];

    // If there are multiple farmers, distribute some listings to other farmers
    if (farmers.length > 1) {
      sampleListings[3].farmer = farmers[1]._id; // Carrots to second farmer
      sampleListings[5].farmer = farmers[1]._id; // Potatoes to second farmer
    }

    // Create listings
    for (const listing of sampleListings) {
      await Listing.create(listing);
      console.log(`Created listing: ${listing.cropName} by ${farmers.find(f => f._id.toString() === listing.farmer.toString())?.fullName || 'Farmer'}`);
    }

    console.log('Listings seeding complete.');
  } catch (err) {
    console.error('Listings seeding failed:', err);
  } finally {
    await mongoose.connection.close();
  }
};

seedListings();

import Activity from '../models/activity.model.js';
import Listing from '../models/listing.model.js';
import Order from '../models/order.model.js';

// Helper function to create activity entries
export const logActivity = async (farmerId, type, title, description, listingId = null, orderId = null, metadata = {}) => {
  try {
    console.log('=== CREATING ACTIVITY ===');
    console.log('Farmer ID:', farmerId);
    console.log('Type:', type);
    console.log('Title:', title);
    console.log('Description:', description);
    
    const activity = new Activity({
      farmer: farmerId,
      type,
      title,
      description,
      listingId,
      orderId,
      metadata,
    });
    
    await activity.save();
    console.log(`Activity logged successfully: ${type} for farmer ${farmerId}`);
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to avoid breaking the main flow
    return null;
  }
};

// Log when a listing is added
export const logListingAdded = async (listing) => {
  const title = "New Listing Added";
  const description = `Added "${listing.cropName}" - ${listing.capacityKg}kg at LKR ${listing.pricePerKg}/kg`;
  const metadata = {
    cropName: listing.cropName,
    capacityKg: listing.capacityKg,
    pricePerKg: listing.pricePerKg,
    harvestedAt: listing.harvestedAt,
  };
  
  return await logActivity(listing.farmer, "LISTING_ADDED", title, description, listing._id, null, metadata);
};

// Log when an item is sold
export const logItemSold = async (order, listing, quantitySold) => {
  console.log('=== LOG ITEM SOLD ===');
  console.log('Farmer ID:', listing.farmer);
  console.log('Order ID:', order._id);
  console.log('Listing ID:', listing._id);
  console.log('Quantity:', quantitySold);
  
  const title = "Item Sold";
  const description = `${quantitySold}kg of "${listing.cropName}" sold for LKR ${listing.pricePerKg * quantitySold}`;
  const metadata = {
    cropName: listing.cropName,
    quantitySold,
    pricePerKg: listing.pricePerKg,
    totalAmount: listing.pricePerKg * quantitySold,
    orderNumber: order.orderNumber,
  };
  
  const result = await logActivity(listing.farmer, "ITEM_SOLD", title, description, listing._id, order._id, metadata);
  console.log('Activity logged result:', result ? 'SUCCESS' : 'FAILED');
  return result;
};

// Log when an item expires
export const logItemExpired = async (listing) => {
  const title = "Item Expired";
  const description = `"${listing.cropName}" expired and was removed (${listing.capacityKg}kg remaining)`;
  const metadata = {
    cropName: listing.cropName,
    remainingCapacity: listing.capacityKg,
    harvestedAt: listing.harvestedAt,
    expireAfterDays: listing.expireAfterDays,
  };
  
  return await logActivity(listing.farmer, "ITEM_EXPIRED", title, description, listing._id, null, metadata);
};

// Log when a listing is updated
export const logListingUpdated = async (listing, changes) => {
  const title = "Listing Updated";
  const description = `Updated "${listing.cropName}" - ${Object.keys(changes).join(', ')}`;
  const metadata = {
    cropName: listing.cropName,
    changes,
  };
  
  return await logActivity(listing.farmer, "LISTING_UPDATED", title, description, listing._id, null, metadata);
};

// Log when a listing is manually removed
export const logListingRemoved = async (listing) => {
  const title = "Listing Removed";
  const description = `"${listing.cropName}" was manually removed`;
  const metadata = {
    cropName: listing.cropName,
    capacityKg: listing.capacityKg,
  };
  
  return await logActivity(listing.farmer, "LISTING_REMOVED", title, description, listing._id, null, metadata);
};

// Get recent activities for a farmer
export const getFarmerActivities = async (farmerId, limit = 20) => {
  try {
    const activities = await Activity.find({ farmer: farmerId })
      .populate('listingId', 'cropName images')
      .populate('orderId', 'orderNumber status')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return activities;
  } catch (error) {
    console.error('Error fetching farmer activities:', error);
    return [];
  }
};

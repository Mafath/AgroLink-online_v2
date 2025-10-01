import Activity from '../models/activity.model.js';
import Listing from '../models/listing.model.js';
import Order from '../models/order.model.js';
import BuyerActivity from '../models/buyerActivity.model.js';

// Helper function to create activity entries
export const logActivity = async (farmerId, type, title, description, listingId = null, orderId = null, metadata = {}) => {
  try {
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
  const title = "Item Sold";
  const description = `${quantitySold}kg of "${listing.cropName}" sold for LKR ${listing.pricePerKg * quantitySold}`;
  const metadata = {
    cropName: listing.cropName,
    quantitySold,
    pricePerKg: listing.pricePerKg,
    totalAmount: listing.pricePerKg * quantitySold,
    orderNumber: order.orderNumber,
  };
  
  return await logActivity(listing.farmer, "ITEM_SOLD", title, description, listing._id, order._id, metadata);
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

// Buyer activity helpers
export const logBuyerOrderPlaced = async (order, buyerId) => {
  try {
    const title = 'Order Placed';
    const description = `You placed an order totaling LKR ${order.total}`;
    const metadata = {
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      itemsCount: order.items?.length || 0,
      orderNumber: order.orderNumber,
    };

    const act = new BuyerActivity({
      buyer: buyerId,
      type: 'ORDER_PLACED',
      title,
      description,
      orderId: order._id,
      metadata,
    });
    await act.save();
    return act;
  } catch (e) {
    console.error('Error logging buyer order placed:', e);
    return null;
  }
};

export const logBuyerOrderCancelled = async (order, buyerId) => {
  try {
    const title = 'Order Cancelled';
    const description = `Your order ${order.orderNumber || ''} was cancelled`;
    const metadata = {
      orderNumber: order.orderNumber,
      status: order.status,
    };
    const act = new BuyerActivity({
      buyer: buyerId,
      type: 'ORDER_CANCELLED',
      title,
      description,
      orderId: order._id,
      metadata,
    });
    await act.save();
    return act;
  } catch (e) {
    console.error('Error logging buyer order cancelled:', e);
    return null;
  }
};

export const getBuyerActivities = async (buyerId, limit = 20) => {
  try {
    const activities = await BuyerActivity.find({ buyer: buyerId })
      .populate('orderId', 'orderNumber status total createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);
    return activities;
  } catch (e) {
    console.error('Error fetching buyer activities:', e);
    return [];
  }
};

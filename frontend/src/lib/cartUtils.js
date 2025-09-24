// Utility functions for user-specific cart management using backend API
import { axiosInstance } from './axios.js';

/**
 * Get cart items for a specific user from backend
 * @param {string} userId - The user's ID (not used in API call, handled by auth token)
 * @returns {Promise<Array>} - Array of cart items
 */
export const getUserCart = async (userId) => {
  try {
    const response = await axiosInstance.get('/cart');
    console.log('getUserCart: Retrieved cart from API:', response.data);
    return response.data.items || [];
  } catch (error) {
    console.error('getUserCart: Error fetching cart:', error);
    return [];
  }
};

/**
 * Get cart count for a specific user from backend
 * @param {string} userId - The user's ID (not used in API call, handled by auth token)
 * @returns {Promise<number>} - Total number of unique items in cart
 */
export const getUserCartCount = async (userId) => {
  try {
    const response = await axiosInstance.get('/cart/count');
    return response.data.count || 0;
  } catch (error) {
    console.error('getUserCartCount: Error fetching cart count:', error);
    return 0;
  }
};

/**
 * Clear cart for a specific user
 * @param {string} userId - The user's ID (not used in API call, handled by auth token)
 */
export const clearUserCart = async (userId) => {
  try {
    await axiosInstance.delete('/cart/clear');
    console.log('clearUserCart: Cart cleared successfully');
  } catch (error) {
    console.error('clearUserCart: Error clearing cart:', error);
  }
};

/**
 * Add item to user's cart via backend API
 * @param {string} userId - The user's ID (not used in API call, handled by auth token)
 * @param {Object} item - Item to add to cart
 * @param {number} quantity - Quantity to add
 * @returns {Promise<boolean>} - Success status
 */
export const addToUserCart = async (userId, item, quantity = 1) => {
  console.log('addToUserCart called with:', { userId, item, quantity });
  
  if (!item || !item._id) {
    console.error('Invalid parameters for addToUserCart:', { userId, item });
    return false;
  }
  
  try {
    // Determine if this is an inventory item or listing item
    const isInventoryItem = item.name && item.price && item.stockQuantity !== undefined;
    const isListingItem = item.cropName && item.pricePerKg && item.capacityKg !== undefined;
    
    if (!isInventoryItem && !isListingItem) {
      console.error('Invalid item structure:', item);
      return false;
    }
    
    const requestData = {
      itemId: item._id,
      itemType: isInventoryItem ? 'inventory' : 'listing',
      quantity: quantity
    };
    
    console.log('Adding item to cart via API:', requestData);
    const response = await axiosInstance.post('/cart/add', requestData);
    console.log('Item added to cart successfully:', response.data);
    return true;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return false;
  }
};

/**
 * Update item quantity in user's cart via backend API
 * @param {string} userId - The user's ID (not used in API call, handled by auth token)
 * @param {string} itemId - ID of the item to update
 * @param {string} itemType - Type of item ('inventory' or 'listing')
 * @param {number} newQuantity - New quantity
 * @returns {Promise<boolean>} - Success status
 */
export const updateUserCartItemQuantity = async (userId, itemId, itemType, newQuantity) => {
  if (newQuantity < 1) return false;
  
  try {
    const requestData = {
      itemId: itemId,
      itemType: itemType,
      quantity: newQuantity
    };
    
    console.log('Updating cart item via API:', requestData);
    const response = await axiosInstance.put('/cart/update', requestData);
    console.log('Cart item updated successfully:', response.data);
    return true;
  } catch (error) {
    console.error('Error updating cart item:', error);
    return false;
  }
};

/**
 * Remove item from user's cart via backend API
 * @param {string} userId - The user's ID (not used in API call, handled by auth token)
 * @param {string} itemId - ID of the item to remove
 * @param {string} itemType - Type of item ('inventory' or 'listing')
 * @returns {Promise<boolean>} - Success status
 */
export const removeFromUserCart = async (userId, itemId, itemType) => {
  try {
    const requestData = {
      itemId: itemId,
      itemType: itemType
    };
    
    console.log('Removing cart item via API:', requestData);
    const response = await axiosInstance.delete('/cart/remove', { data: requestData });
    console.log('Cart item removed successfully:', response.data);
    return true;
  } catch (error) {
    console.error('Error removing cart item:', error);
    return false;
  }
};

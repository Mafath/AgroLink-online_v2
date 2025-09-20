// Utility functions for user-specific cart management

/**
 * Get the cart key for a specific user
 * @param {string} userId - The user's ID
 * @returns {string} - The cart key for localStorage
 */
export const getCartKey = (userId) => {
  return `cart_${userId}`;
};

/**
 * Get cart items for a specific user
 * @param {string} userId - The user's ID
 * @returns {Array} - Array of cart items
 */
export const getUserCart = (userId) => {
  if (!userId) {
    console.log('getUserCart: No userId provided');
    return [];
  }
  const cartKey = getCartKey(userId);
  console.log('getUserCart: Getting cart with key:', cartKey);
  const savedCart = localStorage.getItem(cartKey);
  const cart = savedCart ? JSON.parse(savedCart) : [];
  console.log('getUserCart: Retrieved cart:', cart);
  return cart;
};

/**
 * Save cart items for a specific user
 * @param {string} userId - The user's ID
 * @param {Array} cartItems - Array of cart items to save
 */
export const saveUserCart = (userId, cartItems) => {
  if (!userId) {
    console.log('saveUserCart: No userId provided');
    return;
  }
  const cartKey = getCartKey(userId);
  console.log('saveUserCart: Saving cart with key:', cartKey, 'items:', cartItems);
  try {
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
    console.log('saveUserCart: Cart saved successfully');
  } catch (error) {
    console.error('saveUserCart: Error saving cart:', error);
  }
};

/**
 * Clear cart for a specific user
 * @param {string} userId - The user's ID
 */
export const clearUserCart = (userId) => {
  if (!userId) return;
  const cartKey = getCartKey(userId);
  localStorage.removeItem(cartKey);
};

/**
 * Get cart count for a specific user
 * @param {string} userId - The user's ID
 * @returns {number} - Total number of items in cart
 */
export const getUserCartCount = (userId) => {
  const cart = getUserCart(userId);
  return cart.reduce((total, item) => total + item.quantity, 0);
};

/**
 * Add item to user's cart
 * @param {string} userId - The user's ID
 * @param {Object} item - Item to add to cart
 * @param {number} quantity - Quantity to add
 * @returns {boolean} - Success status
 */
export const addToUserCart = (userId, item, quantity = 1) => {
  console.log('addToUserCart called with:', { userId, item, quantity });
  
  if (!userId || !item || !item._id) {
    console.error('Invalid parameters for addToUserCart:', { userId, item });
    return false;
  }
  
  try {
    const cart = getUserCart(userId);
    console.log('Current cart:', cart);
    
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item._id);
    console.log('Existing item index:', existingItemIndex);
    
    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += quantity;
      console.log('Updated existing item quantity');
    } else {
      // Determine if this is an inventory item or listing item
      const isInventoryItem = item.name && item.price && item.stockQuantity !== undefined;
      const isListingItem = item.cropName && item.pricePerKg && item.capacityKg !== undefined;
      
      console.log('Item type detection:', { 
        isInventoryItem, 
        isListingItem, 
        hasName: !!item.name,
        hasPrice: !!item.price,
        hasStockQuantity: item.stockQuantity !== undefined,
        hasCropName: !!item.cropName,
        hasPricePerKg: !!item.pricePerKg,
        hasCapacityKg: item.capacityKg !== undefined
      });
      
      if (!isInventoryItem && !isListingItem) {
        console.error('Invalid item structure:', item);
        return false;
      }
      
      const cartItem = {
        id: item._id,
        title: isInventoryItem ? item.name : item.cropName,
        price: isInventoryItem ? item.price : item.pricePerKg,
        image: item.images?.[0] || '',
        quantity: quantity,
        category: item.category || ''
      };
      
      // Add specific fields based on item type
      if (isInventoryItem) {
        cartItem.inventoryId = item._id;
        cartItem.stockQuantity = item.stockQuantity;
        console.log('Added inventory item to cart');
      } else {
        cartItem.listingId = item._id;
        cartItem.capacity = item.capacityKg;
        console.log('Added listing item to cart');
      }
      
      console.log('Cart item to add:', cartItem);
      cart.push(cartItem);
    }
    
    console.log('Final cart before save:', cart);
    saveUserCart(userId, cart);
    console.log('Cart saved successfully');
    return true;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return false;
  }
};

/**
 * Update item quantity in user's cart
 * @param {string} userId - The user's ID
 * @param {number} itemIndex - Index of item in cart
 * @param {number} newQuantity - New quantity
 * @returns {boolean} - Success status
 */
export const updateUserCartItemQuantity = (userId, itemIndex, newQuantity) => {
  if (!userId || newQuantity < 1) return false;
  
  const cart = getUserCart(userId);
  if (itemIndex < 0 || itemIndex >= cart.length) return false;
  
  cart[itemIndex].quantity = newQuantity;
  saveUserCart(userId, cart);
  return true;
};

/**
 * Remove item from user's cart
 * @param {string} userId - The user's ID
 * @param {number} itemIndex - Index of item to remove
 * @returns {boolean} - Success status
 */
export const removeFromUserCart = (userId, itemIndex) => {
  if (!userId) return false;
  
  const cart = getUserCart(userId);
  if (itemIndex < 0 || itemIndex >= cart.length) return false;
  
  cart.splice(itemIndex, 1);
  saveUserCart(userId, cart);
  return true;
};

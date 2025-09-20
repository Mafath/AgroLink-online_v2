// Simple test function to debug cart issues
import { addToUserCart, getUserCart, saveUserCart, getCartKey } from './cartUtils.js';

export const testCartFunctionality = () => {
  console.log('=== CART FUNCTIONALITY TEST ===');
  
  // Test 1: Basic cart operations
  const testUserId = 'test-user-123';
  const testItem = {
    _id: 'test-item-123',
    name: 'Test Item',
    price: 100,
    stockQuantity: 10,
    images: ['test-image.jpg'],
    category: 'test'
  };
  
  console.log('Test 1: Basic cart operations');
  console.log('Test user ID:', testUserId);
  console.log('Test item:', testItem);
  
  // Clear any existing cart
  localStorage.removeItem(getCartKey(testUserId));
  
  // Test adding item
  const result = addToUserCart(testUserId, testItem, 2);
  console.log('Add to cart result:', result);
  
  // Test retrieving cart
  const cart = getUserCart(testUserId);
  console.log('Retrieved cart:', cart);
  
  // Test 2: Inventory item structure
  console.log('\nTest 2: Inventory item structure');
  const inventoryItem = {
    _id: 'inventory-123',
    name: 'Seeds',
    price: 50,
    stockQuantity: 100,
    images: ['seed-image.jpg'],
    category: 'seeds'
  };
  
  const inventoryResult = addToUserCart(testUserId, inventoryItem, 1);
  console.log('Inventory item add result:', inventoryResult);
  
  // Test 3: Listing item structure
  console.log('\nTest 3: Listing item structure');
  const listingItem = {
    _id: 'listing-123',
    cropName: 'Tomatoes',
    pricePerKg: 200,
    capacityKg: 50,
    images: ['tomato-image.jpg'],
    category: 'vegetables'
  };
  
  const listingResult = addToUserCart(testUserId, listingItem, 3);
  console.log('Listing item add result:', listingResult);
  
  // Final cart
  const finalCart = getUserCart(testUserId);
  console.log('Final cart:', finalCart);
  
  // Clean up
  localStorage.removeItem(getCartKey(testUserId));
  console.log('=== TEST COMPLETE ===');
};

// Test localStorage availability
export const testLocalStorage = () => {
  console.log('=== LOCALSTORAGE TEST ===');
  try {
    const testKey = 'test-key';
    const testValue = 'test-value';
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved === testValue) {
      console.log('✅ localStorage is working correctly');
      return true;
    } else {
      console.log('❌ localStorage retrieval failed');
      return false;
    }
  } catch (error) {
    console.log('❌ localStorage error:', error);
    return false;
  }
};

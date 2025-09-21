import Cart from '../models/cart.model.js';
import InventoryProduct from '../models/inventory.model.js';
import Listing from '../models/listing.model.js';

// Helper function to get item details from database
const getItemDetails = async (itemId, itemType) => {
  if (itemType === 'inventory') {
    const item = await InventoryProduct.findById(itemId);
    if (!item) return null;
    
    return {
      title: item.name,
      price: item.price,
      image: item.images?.[0] || '',
      category: item.category || '',
      maxQuantity: item.stockQuantity,
      unit: 'units'
    };
  } else if (itemType === 'listing') {
    const item = await Listing.findById(itemId);
    if (!item) return null;
    
    return {
      title: item.cropName,
      price: item.pricePerKg,
      image: item.images?.[0] || '',
      category: item.category || '',
      maxQuantity: item.capacityKg,
      unit: 'kg'
    };
  }
  return null;
};

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.json({ items: [], itemCount: 0, totalQuantity: 0, totalPrice: 0 });
    }

    // Update item details and availability
    const updatedItems = [];
    for (const item of cart.items) {
      const itemDetails = await getItemDetails(item.itemId, item.itemType);
      
      if (!itemDetails) {
        // Item no longer exists, skip it
        continue;
      }

      // Update cached details and check availability
      const updatedItem = {
        ...item.toObject(),
        title: itemDetails.title,
        price: itemDetails.price,
        image: itemDetails.image,
        category: itemDetails.category,
        maxQuantity: itemDetails.maxQuantity,
        unit: itemDetails.unit
      };

      // Adjust quantity if it exceeds available stock
      if (updatedItem.quantity > updatedItem.maxQuantity) {
        updatedItem.quantity = updatedItem.maxQuantity;
      }

      updatedItems.push(updatedItem);
    }

    // Update cart with fresh data
    cart.items = updatedItems;
    await cart.save();

    return res.json({
      items: cart.items,
      itemCount: cart.itemCount,
      totalQuantity: cart.totalQuantity,
      totalPrice: cart.totalPrice
    });
  } catch (error) {
    console.error('getCart error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch cart' } });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { itemId, itemType, quantity = 1 } = req.body;

    if (!itemId || !itemType) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Item ID and type are required' } });
    }

    if (!['inventory', 'listing'].includes(itemType)) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid item type' } });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Quantity must be at least 1' } });
    }

    // Get item details
    const itemDetails = await getItemDetails(itemId, itemType);
    if (!itemDetails) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item not found' } });
    }

    // Check availability
    if (itemDetails.maxQuantity < quantity) {
      return res.status(400).json({ 
        error: { 
          code: 'BAD_REQUEST', 
          message: `Only ${itemDetails.maxQuantity} ${itemDetails.unit} available` 
        } 
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.itemId.toString() === itemId && item.itemType === itemType
    );

    if (existingItemIndex > -1) {
      // Update existing item quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (newQuantity > itemDetails.maxQuantity) {
        return res.status(400).json({ 
          error: { 
            code: 'BAD_REQUEST', 
            message: `Cannot add ${quantity} more. Only ${itemDetails.maxQuantity - cart.items[existingItemIndex].quantity} ${itemDetails.unit} available` 
          } 
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].maxQuantity = itemDetails.maxQuantity;
    } else {
      // Add new item to cart
      cart.items.push({
        itemId,
        itemType,
        title: itemDetails.title,
        price: itemDetails.price,
        image: itemDetails.image,
        category: itemDetails.category,
        quantity,
        maxQuantity: itemDetails.maxQuantity,
        unit: itemDetails.unit
      });
    }

    await cart.save();

    return res.json({
      message: 'Item added to cart successfully',
      cart: {
        items: cart.items,
        itemCount: cart.itemCount,
        totalQuantity: cart.totalQuantity,
        totalPrice: cart.totalPrice
      }
    });
  } catch (error) {
    console.error('addToCart error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to add item to cart' } });
  }
};

// Update item quantity in cart
export const updateCartItem = async (req, res) => {
  try {
    const { itemId, itemType, quantity } = req.body;

    if (!itemId || !itemType || quantity === undefined) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Item ID, type, and quantity are required' } });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Quantity must be at least 1' } });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cart not found' } });
    }

    // Find the item in cart
    const itemIndex = cart.items.findIndex(
      item => item.itemId.toString() === itemId && item.itemType === itemType
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item not found in cart' } });
    }

    // Get fresh item details
    const itemDetails = await getItemDetails(itemId, itemType);
    if (!itemDetails) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item no longer exists' } });
    }

    // Check availability
    if (quantity > itemDetails.maxQuantity) {
      return res.status(400).json({ 
        error: { 
          code: 'BAD_REQUEST', 
          message: `Only ${itemDetails.maxQuantity} ${itemDetails.unit} available` 
        } 
      });
    }

    // Update item
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].maxQuantity = itemDetails.maxQuantity;
    cart.items[itemIndex].title = itemDetails.title;
    cart.items[itemIndex].price = itemDetails.price;
    cart.items[itemIndex].image = itemDetails.image;
    cart.items[itemIndex].category = itemDetails.category;
    cart.items[itemIndex].unit = itemDetails.unit;

    await cart.save();

    return res.json({
      message: 'Cart item updated successfully',
      cart: {
        items: cart.items,
        itemCount: cart.itemCount,
        totalQuantity: cart.totalQuantity,
        totalPrice: cart.totalPrice
      }
    });
  } catch (error) {
    console.error('updateCartItem error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update cart item' } });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { itemId, itemType } = req.body;

    if (!itemId || !itemType) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Item ID and type are required' } });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cart not found' } });
    }

    // Remove the item
    cart.items = cart.items.filter(
      item => !(item.itemId.toString() === itemId && item.itemType === itemType)
    );

    await cart.save();

    return res.json({
      message: 'Item removed from cart successfully',
      cart: {
        items: cart.items,
        itemCount: cart.itemCount,
        totalQuantity: cart.totalQuantity,
        totalPrice: cart.totalPrice
      }
    });
  } catch (error) {
    console.error('removeFromCart error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to remove item from cart' } });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cart not found' } });
    }

    cart.items = [];
    await cart.save();

    return res.json({
      message: 'Cart cleared successfully',
      cart: {
        items: [],
        itemCount: 0,
        totalQuantity: 0,
        totalPrice: 0
      }
    });
  } catch (error) {
    console.error('clearCart error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to clear cart' } });
  }
};

// Get cart count (for navbar)
export const getCartCount = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    const count = cart ? cart.itemCount : 0;
    
    return res.json({ count });
  } catch (error) {
    console.error('getCartCount error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get cart count' } });
  }
};


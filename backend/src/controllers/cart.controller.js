import Cart from '../models/cart.model.js';
import InventoryProduct from '../models/inventory.model.js';
import Listing from '../models/listing.model.js';
import RentalItem from '../models/rentalItem.model.js';

// Helper function to get item details from database
const getItemDetails = async (itemId, itemType, rentalData = null) => {
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
  } else if (itemType === 'rental') {
    const item = await RentalItem.findById(itemId);
    if (!item) return null;
    
    // For rentals, we need to calculate availability for the specific date range
    let availableQty = item.totalQty || 0;
    if (rentalData && rentalData.startDate && rentalData.endDate) {
      // Calculate overlapping bookings for the date range
      const RentalBooking = (await import('../models/rentalBooking.model.js')).default;
      const overlaps = await RentalBooking.find({
        item: itemId,
        status: 'CONFIRMED',
        $or: [
          { startDate: { $lte: new Date(rentalData.endDate) }, endDate: { $gte: new Date(rentalData.startDate) } },
        ],
      }).select('quantity');
      const booked = overlaps.reduce((s, b) => s + (b.quantity || 0), 0);
      availableQty = Math.max(0, (item.totalQty || 0) - booked);
    }
    
    return {
      title: item.productName,
      price: item.rentalPerDay, // Use daily rate as base price
      image: item.images?.[0] || '',
      category: item.category || '',
      maxQuantity: availableQty,
      unit: 'items',
      rentalPerDay: item.rentalPerDay
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
      const rentalData = item.itemType === 'rental' ? {
        startDate: item.rentalStartDate,
        endDate: item.rentalEndDate
      } : null;
      
      const itemDetails = await getItemDetails(item.itemId, item.itemType, rentalData);
      
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

      // For rental items, preserve rental-specific data
      if (item.itemType === 'rental') {
        updatedItem.rentalPerDay = itemDetails.rentalPerDay;
      }

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
    const { itemId, itemType, quantity = 1, rentalStartDate, rentalEndDate } = req.body;

    if (!itemId || !itemType) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Item ID and type are required' } });
    }

    if (!['inventory', 'listing', 'rental'].includes(itemType)) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid item type' } });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Quantity must be at least 1' } });
    }

    // For rental items, validate date range
    if (itemType === 'rental') {
      if (!rentalStartDate || !rentalEndDate) {
        return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Start and end dates are required for rental items' } });
      }
      
      const startDate = new Date(rentalStartDate);
      const endDate = new Date(rentalEndDate);
      
      // Allow same-day rentals (startDate === endDate)
      if (startDate > endDate) {
        return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'End date must be after start date' } });
      }
      
      // Normalize to date-only for past check to allow same-day bookings
      const today = new Date();
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      if (startMidnight < todayMidnight) {
        return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Start date cannot be in the past' } });
      }
    }

    // Get item details with rental data if applicable
    const rentalData = itemType === 'rental' ? { startDate: rentalStartDate, endDate: rentalEndDate } : null;
    const itemDetails = await getItemDetails(itemId, itemType, rentalData);
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

    // For rental items, check if same item with same date range already exists
    const existingItemIndex = cart.items.findIndex(item => {
      if (item.itemId.toString() === itemId && item.itemType === itemType) {
        if (itemType === 'rental') {
          // For rentals, check if date ranges match
          const itemStart = item.rentalStartDate ? new Date(item.rentalStartDate).toISOString() : null;
          const itemEnd = item.rentalEndDate ? new Date(item.rentalEndDate).toISOString() : null;
          const newStart = new Date(rentalStartDate).toISOString();
          const newEnd = new Date(rentalEndDate).toISOString();
          return itemStart === newStart && itemEnd === newEnd;
        }
        return true; // For non-rental items, just check itemId and type
      }
      return false;
    });

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
      const newItem = {
        itemId,
        itemType,
        title: itemDetails.title,
        price: itemDetails.price,
        image: itemDetails.image,
        category: itemDetails.category,
        quantity,
        maxQuantity: itemDetails.maxQuantity,
        unit: itemDetails.unit
      };

      // Add rental-specific fields if it's a rental item
      if (itemType === 'rental') {
        newItem.rentalStartDate = new Date(rentalStartDate);
        newItem.rentalEndDate = new Date(rentalEndDate);
        newItem.rentalPerDay = itemDetails.rentalPerDay;
      }

      cart.items.push(newItem);
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

    // Get fresh item details with rental data if applicable
    const cartItem = cart.items[itemIndex];
    const rentalData = cartItem.itemType === 'rental' ? {
      startDate: cartItem.rentalStartDate,
      endDate: cartItem.rentalEndDate
    } : null;
    const itemDetails = await getItemDetails(itemId, itemType, rentalData);
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

    // For rental items, preserve rental-specific data
    if (cartItem.itemType === 'rental') {
      cart.items[itemIndex].rentalPerDay = itemDetails.rentalPerDay;
    }

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

// backend/controllers/cart.controller.js
export const clearCart = async (req, res) => {
  try {
    const { purchasedItemIds } = req.body; // array of itemIds sent from frontend

    if (!purchasedItemIds || !Array.isArray(purchasedItemIds)) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'purchasedItemIds must be an array' }
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cart not found' } });
    }

    // remove only purchased items
    cart.items = cart.items.filter(
      item => !purchasedItemIds.includes(item.itemId.toString())
    );
    await cart.save();

    return res.json({
      message: 'Purchased items removed successfully',
      cart
    });
  } catch (error) {
    console.error('clearCart error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to clear purchased items from cart' }
    });
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



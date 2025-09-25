import Order from '../models/order.model.js';
import Delivery from '../models/delivery.model.js';
import Listing from '../models/listing.model.js';
import InventoryProduct from '../models/inventory.model.js';
import Cart from '../models/cart.model.js';
import mongoose from 'mongoose';
import { sendOrderPlacedEmail, sendOrderCancellationEmail } from '../lib/emailService.js';

// Helper function to update stock quantities (used for both orders and cancellations)
const updateStockQuantities = async (items, isCancellation = false) => {
  const multiplier = isCancellation ? 1 : -1; // Add back stock for cancellations, subtract for orders
  
  for (const item of items) {
    if (item.inventoryId) {
      // Update inventory item stock
      const inventoryItem = await InventoryProduct.findById(item.inventoryId);
      if (inventoryItem) {
        const newStockQuantity = inventoryItem.stockQuantity + (item.quantity * multiplier);
        inventoryItem.stockQuantity = Math.max(0, newStockQuantity); // Ensure it doesn't go below 0
        
        // Update status based on stock level
        if (inventoryItem.stockQuantity === 0) {
          inventoryItem.status = 'Out of stock';
        } else if (inventoryItem.stockQuantity <= 10) {
          inventoryItem.status = 'Low stock';
        } else {
          inventoryItem.status = 'Available';
        }
        
        await inventoryItem.save();
        console.log(`Updated inventory item ${inventoryItem.name}: stock ${inventoryItem.stockQuantity}, status ${inventoryItem.status}`);
      }
    } else if (item.listingId) {
      // Update listing capacity
      const listing = await Listing.findById(item.listingId);
      if (listing) {
        const newCapacity = listing.capacityKg + (item.quantity * multiplier);
        listing.capacityKg = Math.max(0, newCapacity); // Ensure it doesn't go below 0
        
        // Update status based on capacity
        if (listing.capacityKg === 0) {
          listing.status = 'SOLD';
        } else {
          listing.status = 'AVAILABLE';
        }
        
        await listing.save();
        console.log(`Updated listing ${listing.cropName}: capacity ${listing.capacityKg}kg, status ${listing.status}`);
      }
    }
  }
};

export const createOrder = async (req, res) => {
  try {
    const { items, deliveryType, deliveryAddress, contactName, contactPhone, contactEmail, notes, paymentMethod } = req.body;
    
    console.log('=== ORDER CREATION DEBUG ===');
    console.log('Request body items:', JSON.stringify(items, null, 2));
    console.log('User:', req.user);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Items are required' } });
    }

    if (!deliveryType || !['PICKUP', 'DELIVERY'].includes(deliveryType)) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Valid delivery type required' } });
    }

    if (deliveryType === 'DELIVERY' && !deliveryAddress) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Delivery address required for delivery orders' } });
    }

    if (!contactName || !contactPhone || !contactEmail) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Contact name, phone, and email are required' } });
    }

    // Validate items and calculate totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      console.log('Processing item:', item);
      // Check if this is an inventory item or listing item
      if (item.inventoryId) {
        console.log('Processing as inventory item:', item.inventoryId);
        // Handle inventory items
        const inventoryItem = await InventoryProduct.findById(item.inventoryId);
        if (!inventoryItem) {
          console.log('Inventory item not found:', item.inventoryId);
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Inventory item ${item.inventoryId} not found` } });
        }

        if (inventoryItem.status === 'Out of stock') {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `${inventoryItem.name} is out of stock` } });
        }

        if (inventoryItem.stockQuantity < item.quantity) {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Not enough stock for ${inventoryItem.name}` } });
        }

        const itemTotal = inventoryItem.price * item.quantity;
        subtotal += itemTotal;

        validatedItems.push({
          listing: inventoryItem._id,
          itemType: 'inventory',
          quantity: item.quantity,
          price: inventoryItem.price,
          title: inventoryItem.name,
          image: inventoryItem.images?.[0] || '',
        });
      } else if (item.listingId) {
        console.log('Processing as listing item:', item.listingId);
        // Handle listing items
        const listing = await Listing.findById(item.listingId);
        if (!listing) {
          console.log('Listing not found:', item.listingId);
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Listing ${item.listingId} not found` } });
        }

        if (listing.status !== 'AVAILABLE') {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Listing ${listing.cropName} is not available` } });
        }

        if (listing.capacityKg < item.quantity) {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Not enough stock for ${listing.cropName}` } });
        }

        const itemTotal = listing.pricePerKg * item.quantity;
        subtotal += itemTotal;

        validatedItems.push({
          listing: listing._id,
          itemType: 'listing',
          quantity: item.quantity,
          price: listing.pricePerKg,
          title: listing.cropName,
          image: listing.images?.[0] || '',
        });
      } else {
        return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Item must have either inventoryId or listingId' } });
      }
    }

    const deliveryFee = deliveryType === 'DELIVERY' ? 500 : 0; // 500 LKR delivery fee
    const total = subtotal + deliveryFee;

    const order = new Order({
      customer: req.user._id,
      customerRole: req.user.role,
      items: validatedItems,
      subtotal,
      deliveryFee,
      total,
      deliveryType,
      deliveryAddress: deliveryType === 'DELIVERY' ? deliveryAddress : undefined,
      contactName,
      contactPhone,
      contactEmail,
      notes: notes || '',
      paymentMethod: paymentMethod || 'CASH',
    });

    await order.save();

    // Update stock quantities after successful order creation
    console.log('=== UPDATING STOCK QUANTITIES ===');
    try {
      await updateStockQuantities(items, false); // false = not a cancellation
      console.log('Stock quantities updated successfully');
    } catch (stockUpdateError) {
      console.error('Error updating stock quantities:', stockUpdateError);
      // Note: We don't rollback the order here as the payment was successful
      // The stock update error should be logged and investigated separately
    }

    // If delivery type, create delivery record
    if (deliveryType === 'DELIVERY') {
      const delivery = new Delivery({
        order: order._id,
        requester: req.user._id,
        requesterRole: req.user.role,
        contactName,
        phone: contactPhone,
        address: deliveryAddress,
        notes: notes || '',
      });
      delivery.addStatus('PENDING', req.user._id);
      await delivery.save();

      // Link delivery to order
      order.delivery = delivery._id;
      await order.save();
    }

    // Fire-and-forget order confirmation email
    try {
      await sendOrderPlacedEmail(order, req.user);
    } catch (e) {
      console.error('Failed to send order confirmation email:', e);
    }

    return res.status(201).json(order);
  } catch (error) {
    console.error('createOrder error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to create order' } });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('items.listing', 'title images price')
      .populate('delivery', 'status driver')
      .sort({ createdAt: -1 });
    
    return res.json(orders);
  } catch (error) {
    console.error('getMyOrders error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch orders' } });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('customer', 'fullName email phone')
      .populate('items.listing', 'title images price')
      .populate('delivery', 'status driver statusHistory')
      .populate('delivery.driver', 'fullName email phone');

    if (!order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    // Check if user can access this order
    if (order.customer._id.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    return res.json(order);
  } catch (error) {
    console.error('getOrderById error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch order' } });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid status' } });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    // If order is being cancelled, restore stock quantities
    if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
      console.log('=== RESTORING STOCK QUANTITIES DUE TO CANCELLATION ===');
      try {
        // Convert order items back to the format expected by updateStockQuantities
        const itemsToRestore = order.items.map(item => ({
          inventoryId: item.itemType === 'inventory' ? item.listing : null,
          listingId: item.itemType === 'listing' ? item.listing : null,
          quantity: item.quantity
        }));
        
        await updateStockQuantities(itemsToRestore, true); // true = cancellation
        console.log('Stock quantities restored successfully');
      } catch (stockRestoreError) {
        console.error('Error restoring stock quantities:', stockRestoreError);
        // Log the error but don't fail the status update
      }
    }

    return res.json(order);
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update order status' } });
  }
};

export const createOrderFromCart = async (req, res) => {
  try {
    const { selectedItems, deliveryType, deliveryAddress, contactName, contactPhone, contactEmail, notes, paymentMethod } = req.body;
    
    console.log('=== CART ORDER CREATION DEBUG ===');
    console.log('Selected items:', JSON.stringify(selectedItems, null, 2));
    console.log('User:', req.user);
    
    if (!selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Selected items are required' } });
    }

    if (!deliveryType || !['PICKUP', 'DELIVERY'].includes(deliveryType)) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Valid delivery type required' } });
    }

    if (deliveryType === 'DELIVERY' && !deliveryAddress) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Delivery address required for delivery orders' } });
    }

    if (!contactName || !contactPhone || !contactEmail) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Contact name, phone, and email are required' } });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cart not found' } });
    }

    // Validate selected items and calculate totals
    let subtotal = 0;
    const validatedItems = [];
    const itemsToRemove = [];

    for (const selectedItem of selectedItems) {
      // Find the item in cart
      const cartItem = cart.items.find(
        item => item.itemId.toString() === selectedItem.itemId && item.itemType === selectedItem.itemType
      );

      if (!cartItem) {
        return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Item ${selectedItem.itemId} not found in cart` } });
      }

      // Validate item availability
      if (cartItem.itemType === 'inventory') {
        const inventoryItem = await InventoryProduct.findById(cartItem.itemId);
        if (!inventoryItem) {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Inventory item ${cartItem.itemId} not found` } });
        }

        if (inventoryItem.status === 'Out of stock') {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `${inventoryItem.name} is out of stock` } });
        }

        if (inventoryItem.stockQuantity < cartItem.quantity) {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Not enough stock for ${inventoryItem.name}` } });
        }

        const itemTotal = inventoryItem.price * cartItem.quantity;
        subtotal += itemTotal;

        validatedItems.push({
          listing: inventoryItem._id,
          itemType: 'inventory',
          quantity: cartItem.quantity,
          price: inventoryItem.price,
          title: inventoryItem.name,
          image: inventoryItem.images?.[0] || '',
        });

        itemsToRemove.push({
          inventoryId: inventoryItem._id,
          quantity: cartItem.quantity
        });
      } else if (cartItem.itemType === 'listing') {
        const listing = await Listing.findById(cartItem.itemId);
        if (!listing) {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Listing ${cartItem.itemId} not found` } });
        }

        if (listing.status !== 'AVAILABLE') {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Listing ${listing.cropName} is not available` } });
        }

        if (listing.capacityKg < cartItem.quantity) {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Not enough stock for ${listing.cropName}` } });
        }

        const itemTotal = listing.pricePerKg * cartItem.quantity;
        subtotal += itemTotal;

        validatedItems.push({
          listing: listing._id,
          itemType: 'listing',
          quantity: cartItem.quantity,
          price: listing.pricePerKg,
          title: listing.cropName,
          image: listing.images?.[0] || '',
        });

        itemsToRemove.push({
          listingId: listing._id,
          quantity: cartItem.quantity
        });
      }
    }

    const deliveryFee = deliveryType === 'DELIVERY' ? 500 : 0;
    const total = subtotal + deliveryFee;

    // Create the order
    const order = new Order({
      customer: req.user._id,
      customerRole: req.user.role,
      items: validatedItems,
      subtotal,
      deliveryFee,
      total,
      deliveryType,
      deliveryAddress: deliveryType === 'DELIVERY' ? deliveryAddress : undefined,
      contactName,
      contactPhone,
      contactEmail,
      notes: notes || '',
      paymentMethod: paymentMethod || 'CASH',
    });

    await order.save();

    // Update stock quantities after successful order creation
    console.log('=== UPDATING STOCK QUANTITIES ===');
    try {
      await updateStockQuantities(itemsToRemove, false);
      console.log('Stock quantities updated successfully');
    } catch (stockUpdateError) {
      console.error('Error updating stock quantities:', stockUpdateError);
    }

    // Remove ordered items from cart
    cart.items = cart.items.filter(
      item => !selectedItems.some(selected => 
        selected.itemId === item.itemId.toString() && selected.itemType === item.itemType
      )
    );
    await cart.save();

    // If delivery type, create delivery record
    if (deliveryType === 'DELIVERY') {
      const delivery = new Delivery({
        order: order._id,
        requester: req.user._id,
        requesterRole: req.user.role,
        contactName,
        phone: contactPhone,
        address: deliveryAddress,
        notes: notes || '',
      });
      delivery.addStatus('PENDING', req.user._id);
      await delivery.save();

      // Link delivery to order
      order.delivery = delivery._id;
      await order.save();
    }

    // Fire-and-forget order confirmation email
    try {
      await sendOrderPlacedEmail(order, req.user);
    } catch (e) {
      console.error('Failed to send order confirmation email (cart):', e);
    }

    return res.status(201).json(order);
  } catch (error) {
    console.error('createOrderFromCart error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to create order from cart' } });
  }
};

export const adminListOrders = async (req, res) => {
  try {
    const { status, deliveryType } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (deliveryType) filter.deliveryType = deliveryType;

    const orders = await Order.find(filter)
      .populate('customer', 'fullName email phone role')
      .populate('delivery', 'status driver')
      .populate('delivery.driver', 'fullName email')
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    console.error('adminListOrders error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch orders' } });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only allow cancelling if not already delivered or cancelled
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    order.status = 'CANCELLED';
    await order.save();

    // If this order has a delivery, cancel it too
    if (order.delivery) {
      try {
        const delivery = await Delivery.findById(order.delivery);
        if (delivery && delivery.status !== 'COMPLETED' && delivery.status !== 'CANCELLED') {
          delivery.addStatus('CANCELLED', req.user._id);
          await delivery.save();
          console.log(`Delivery ${delivery._id} cancelled due to order cancellation`);
        }
      } catch (deliveryError) {
        console.error('Error cancelling associated delivery:', deliveryError);
        // Don't fail the order cancellation, just log the error
      }
    }

    // Restore stock quantities for cancelled order
    try {
      const itemsToRestore = order.items.map(item => ({
        inventoryId: item.itemType === 'inventory' ? item.listing : null,
        listingId: item.itemType === 'listing' ? item.listing : null,
        quantity: item.quantity
      }));
      await updateStockQuantities(itemsToRestore, true); // true = cancellation
    } catch (stockRestoreError) {
      console.error('Error restoring stock quantities:', stockRestoreError);
      // Log the error but don't fail the cancellation
    }

    // Send cancellation email to customer
    try {
      const emailResult = await sendOrderCancellationEmail(order, req.user);
      if (!emailResult.success) {
        console.error('Failed to send order cancellation email:', emailResult.error);
        // Don't fail the cancellation, just log the error
      }
    } catch (emailError) {
      console.error('Error sending order cancellation email:', emailError);
      // Don't fail the cancellation, just log the error
    }

    return res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Farmer sales stats: available listings, current month revenue, last month's delivered orders
export const getFarmerStats = async (req, res) => {
  try {
    if (req.user.role !== 'FARMER') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only FARMER can access this endpoint' } });
    }

    const farmerId = req.user._id;

    // Available listings count
    const availableListingsCountPromise = Listing.countDocuments({ farmer: farmerId, status: 'AVAILABLE' });

    // Date ranges
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    // This month's revenue: sum(price * quantity) for items belonging to farmer's listings, within current month, delivered or paid/processing? We'll include PAID, SHIPPED, DELIVERED
    const allowedStatuses = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

    const monthRevenueAggPromise = Order.aggregate([
      { $match: { createdAt: { $gte: monthStart, $lt: nextMonthStart }, status: { $in: allowedStatuses } } },
      { $unwind: '$items' },
      { $match: { 'items.itemType': 'listing' } },
      { $lookup: { from: 'listings', localField: 'items.listing', foreignField: '_id', as: 'listingDoc' } },
      { $unwind: '$listingDoc' },
      { $match: { 'listingDoc.farmer': new mongoose.Types.ObjectId(farmerId) } },
      { $group: { _id: null, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
    ]).then(rows => (rows[0]?.revenue || 0));

    // Last month delivered orders count for this farmer (distinct orders containing at least one of farmer's listings)
    const lastMonthDeliveredOrdersPromise = Order.aggregate([
      { $match: { createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }, status: 'DELIVERED' } },
      { $unwind: '$items' },
      { $match: { 'items.itemType': 'listing' } },
      { $lookup: { from: 'listings', localField: 'items.listing', foreignField: '_id', as: 'listingDoc' } },
      { $unwind: '$listingDoc' },
      { $match: { 'listingDoc.farmer': new mongoose.Types.ObjectId(farmerId) } },
      { $group: { _id: '$_id' } },
      { $count: 'count' },
    ]).then(rows => (rows[0]?.count || 0));

    const [availableListings, monthRevenue, lastMonthDeliveredOrders] = await Promise.all([
      availableListingsCountPromise,
      monthRevenueAggPromise,
      lastMonthDeliveredOrdersPromise,
    ]);

    return res.json({ availableListings, monthRevenue, lastMonthDeliveredOrders });
  } catch (error) {
    console.error('getFarmerStats error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch farmer stats' } });
  }
};
import Order from '../models/order.model.js';
import Delivery from '../models/delivery.model.js';
import Listing from '../models/listing.model.js';
import InventoryProduct from '../models/inventory.model.js';
import Cart from '../models/cart.model.js';
import RentalItem from '../models/rentalItem.model.js';
import RentalBooking from '../models/rentalBooking.model.js';
import mongoose from 'mongoose';
import { sendOrderPlacedEmail, sendOrderCancellationEmail } from '../lib/emailService.js';
import { computeFinalPriceWithCommission } from '../lib/utils.js';
import { logItemSold, getFarmerActivities, logBuyerOrderPlaced, logBuyerOrderCancelled, getBuyerActivities } from '../lib/activityService.js';

// Helper function to update stock quantities (used for both orders and cancellations)
const updateStockQuantities = async (items, isCancellation = false, order = null) => {
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
        
        // Log activity for listing sales (only for orders, not cancellations)
        // Check both itemType field and if it's a listing item by checking if listingId exists
        if (!isCancellation && order && (item.itemType === 'listing' || item.listingId)) {
          await logItemSold(order, listing, item.quantity);
        }
      }
    }
  }
};

export const createOrder = async (req, res) => {
  try {
    const { items, deliveryType, deliveryAddress, contactName, contactPhone, contactEmail, notes, paymentMethod } = req.body;
    
    
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
      // Check if this is an inventory item or listing item
      if (item.inventoryId) {
        // Handle inventory items
        const inventoryItem = await InventoryProduct.findById(item.inventoryId);
        if (!inventoryItem) {
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
        // Handle listing items
        const listing = await Listing.findById(item.listingId);
        if (!listing) {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Listing ${item.listingId} not found` } });
        }

        if (listing.status !== 'AVAILABLE') {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Listing ${listing.cropName} is not available` } });
        }

        if (listing.capacityKg < item.quantity) {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Not enough stock for ${listing.cropName}` } });
        }

        const finalPrice = computeFinalPriceWithCommission(listing.pricePerKg);
        const itemTotal = finalPrice * item.quantity;
        subtotal += itemTotal;

        validatedItems.push({
          listing: listing._id,
          itemType: 'listing',
          quantity: item.quantity,
          price: finalPrice,
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
    try {
      await updateStockQuantities(items, false, order); // false = not a cancellation
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

    // Log buyer activity (fire and forget)
    try {
      await logBuyerOrderPlaced(order, req.user._id);
    } catch (e) {
      console.error('Failed to log buyer order placed:', e);
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

    // Match with model enums
    const allowedStatuses = ["NOT READY", "READY", "CANCELLED"];
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

    // If order is being cancelled, restore stock
    if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
      try {
        const itemsToRestore = order.items.map(item => ({
          inventoryId: item.itemType === 'inventory' ? item.listing : null,
          listingId: item.itemType === 'listing' ? item.listing : null,
          quantity: item.quantity
        }));

        await updateStockQuantities(itemsToRestore, true);
        console.log('Stock quantities restored successfully');
      } catch (err) {
        console.error('Error restoring stock quantities:', err);
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

        const finalPrice = computeFinalPriceWithCommission(listing.pricePerKg);
        const itemTotal = finalPrice * cartItem.quantity;
        subtotal += itemTotal;

        validatedItems.push({
          listing: listing._id,
          itemType: 'listing',
          quantity: cartItem.quantity,
          price: finalPrice,
          title: listing.cropName,
          image: listing.images?.[0] || '',
        });

        itemsToRemove.push({
          listingId: listing._id,
          quantity: cartItem.quantity
        });
      } else if (cartItem.itemType === 'rental') {
        const rental = await RentalItem.findById(cartItem.itemId);
        if (!rental) {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Rental item ${cartItem.itemId} not found` } });
        }

        // Validate dates
        const start = new Date(cartItem.rentalStartDate);
        const end = new Date(cartItem.rentalEndDate);
        if (!(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end) || end < start) {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid rental date range' } });
        }

        // Check availability overlap
        const overlaps = await RentalBooking.find({
          item: rental._id,
          status: 'CONFIRMED',
          $or: [
            { startDate: { $lte: end }, endDate: { $gte: start } },
          ],
        }).select('quantity');
        const booked = overlaps.reduce((s, b) => s + (b.quantity || 0), 0);
        const available = Math.max(0, (rental.totalQty || 0) - booked);
        if (cartItem.quantity > available) {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Only ${available} available for selected dates` } });
        }

        // Compute subtotal for rental (per-day pricing, inclusive range)
        const msPerDay = 1000 * 60 * 60 * 24;
        const days = Math.ceil((end - start) / msPerDay) + 1;
        const itemTotal = (rental.rentalPerDay || 0) * days * cartItem.quantity;
        subtotal += itemTotal;

        validatedItems.push({
          listing: rental._id,
          itemType: 'rental',
          quantity: cartItem.quantity,
          price: rental.rentalPerDay, // base rate
          title: rental.productName,
          image: (rental.images && rental.images[0]) || '',
          rentalStartDate: start,
          rentalEndDate: end,
          rentalPerDay: rental.rentalPerDay,
        });

        itemsToRemove.push({
          rentalId: rental._id,
          quantity: cartItem.quantity,
          startDate: start,
          endDate: end,
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

    // Create rental bookings for any rental items in this order
    try {
      const rentalItems = validatedItems.filter(it => it.itemType === 'rental');
      for (const r of rentalItems) {
        await RentalBooking.create({
          item: r.listing,
          renter: req.user._id,
          quantity: r.quantity,
          startDate: r.rentalStartDate,
          endDate: r.rentalEndDate,
          status: 'CONFIRMED',
          notes: `Order ${order.orderNumber || order._id}`,
        });
      }
    } catch (rbErr) {
      console.error('Failed to create rental bookings for order:', rbErr);
      // Do not fail the order if booking creation fails; log for follow-up.
    }

    // Update stock quantities after successful order creation
    try {
      await updateStockQuantities(itemsToRemove, false, order);
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

    // Log buyer cancellation activity (fire and forget)
    try {
      await logBuyerOrderCancelled(order, order.customer);
    } catch (e) {
      console.error('Failed to log buyer order cancelled:', e);
    }

    // If this order has a delivery, cancel it too
    if (order.delivery) {
      try {
        const delivery = await Delivery.findById(order.delivery);
        if (delivery && delivery.status !== 'COMPLETED' && delivery.status !== 'CANCELLED') {
          delivery.addStatus('CANCELLED', req.user._id);
          await delivery.save();
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

// Farmer sales stats: available listings, last 30 days revenue, last 30 days delivered orders
export const getFarmerStats = async (req, res) => {
  try {
    if (req.user.role !== 'FARMER') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only FARMER can access this endpoint' } });
    }

    const farmerId = req.user._id;

    // Available listings count
    const availableListingsCountPromise = Listing.countDocuments({ farmer: farmerId, status: 'AVAILABLE' });

    // Date ranges - Last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Last 30 days revenue: sum(price * quantity) for items belonging to farmer's listings
    // Include ALL orders except CANCELLED to capture all sales (COD, PAID, etc.)
    const excludedStatuses = ['CANCELLED'];

    const monthRevenueAggPromise = Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: thirtyDaysAgo },
          status: { $nin: excludedStatuses } 
        } 
      },
      { $unwind: '$items' },
      { $match: { 'items.itemType': 'listing' } },
      { $lookup: { from: 'listings', localField: 'items.listing', foreignField: '_id', as: 'listingDoc' } },
      { $unwind: '$listingDoc' },
      { $match: { 'listingDoc.farmer': new mongoose.Types.ObjectId(farmerId) } },
      { $group: { _id: null, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
    ]).then(rows => (rows[0]?.revenue || 0));

    // Last 30 days delivered orders count for this farmer (distinct orders containing at least one of farmer's listings)
    // We check both createdAt and updatedAt to catch orders that were delivered recently
    const lastMonthDeliveredOrdersPromise = Order.aggregate([
      { 
        $match: { 
          $or: [
            { createdAt: { $gte: thirtyDaysAgo } },
            { updatedAt: { $gte: thirtyDaysAgo } }
          ],
          status: 'DELIVERED' 
        } 
      },
      { $unwind: '$items' },
      { $match: { 'items.itemType': 'listing' } },
      { $lookup: { from: 'listings', localField: 'items.listing', foreignField: '_id', as: 'listingDoc' } },
      { $unwind: '$listingDoc' },
      { $match: { 'listingDoc.farmer': new mongoose.Types.ObjectId(farmerId) } },
      { $group: { _id: '$_id' } },
      { $count: 'count' },
    ]).then(rows => (rows[0]?.count || 0));

    // Total sales count (all orders except cancelled)
    const totalSalesCountPromise = Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: thirtyDaysAgo },
          status: { $nin: ['CANCELLED'] } 
        } 
      },
      { $unwind: '$items' },
      { $match: { 'items.itemType': 'listing' } },
      { $lookup: { from: 'listings', localField: 'items.listing', foreignField: '_id', as: 'listingDoc' } },
      { $unwind: '$listingDoc' },
      { $match: { 'listingDoc.farmer': new mongoose.Types.ObjectId(farmerId) } },
      { $group: { _id: '$_id' } },
      { $count: 'count' },
    ]).then(rows => (rows[0]?.count || 0));

    const [availableListings, monthRevenue, lastMonthDeliveredOrders, totalSalesCount] = await Promise.all([
      availableListingsCountPromise,
      monthRevenueAggPromise,
      lastMonthDeliveredOrdersPromise,
      totalSalesCountPromise,
    ]);

    return res.json({ 
      availableListings, 
      monthRevenue, 
      lastMonthDeliveredOrders,
      totalSalesCount,
      dateRange: {
        from: thirtyDaysAgo.toISOString(),
        to: now.toISOString()
      }
    });
  } catch (error) {
    console.error('getFarmerStats error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch farmer stats' } });
  }
};

// Get farmer activities
export const getFarmerActivitiesEndpoint = async (req, res) => {
  try {
    if (req.user.role !== 'FARMER') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only FARMER can access this endpoint' } });
    }

    const farmerId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;
    
    const activities = await getFarmerActivities(farmerId, limit);
    
    return res.json(activities);
  } catch (error) {
    console.error('getFarmerActivitiesEndpoint error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch farmer activities' } });
  }
};

// Get buyer activities
export const getBuyerActivitiesEndpoint = async (req, res) => {
  try {
    if (req.user.role !== 'BUYER' && req.user.role !== 'FARMER') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only BUYER or FARMER can access this endpoint' } });
    }

    const buyerId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;
    const activities = await getBuyerActivities(buyerId, limit);
    return res.json(activities);
  } catch (error) {
    console.error('getBuyerActivitiesEndpoint error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch buyer activities' } });
  }
};
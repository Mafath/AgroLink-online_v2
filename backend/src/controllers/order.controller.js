import Order from '../models/order.model.js';
import Delivery from '../models/delivery.model.js';
import Listing from '../models/listing.model.js';
import InventoryProduct from '../models/inventory.model.js';

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
    const { items, deliveryType, deliveryAddress, contactName, contactPhone, notes, paymentMethod } = req.body;
    
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

    if (!contactName || !contactPhone) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Contact name and phone required' } });
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

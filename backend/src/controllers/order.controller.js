import Order from '../models/order.model.js';
import Delivery from '../models/delivery.model.js';
import Listing from '../models/listing.model.js';
import InventoryProduct from '../models/inventory.model.js';

export const createOrder = async (req, res) => {
  try {
    const { items, deliveryType, deliveryAddress, contactName, contactPhone, notes, paymentMethod } = req.body;
    
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

    order.status = status;
    await order.save();

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

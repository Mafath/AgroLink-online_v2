import Delivery, { STATUS } from '../models/delivery.model.js';

export const createDeliveryRequest = async (req, res) => {
  try {
    const { orderId, fullName, phone, addressLine1, addressLine2, city, state, postalCode, notes } = req.body;
    if (!orderId || !fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing required fields' } });
    }

    const requesterRole = req.user.role;
    if (!['FARMER', 'BUYER'].includes(requesterRole)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only farmers and buyers can request deliveries' } });
    }

    // Verify order exists and belongs to user
    const Order = (await import('../models/order.model.js')).default;
    const order = await Order.findById(orderId);
    if (!order || order.customer.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    const delivery = new Delivery({
      order: orderId,
      requester: req.user._id,
      requesterRole,
      contactName: fullName,
      phone,
      address: {
        line1: addressLine1,
        line2: addressLine2 || '',
        city,
        state,
        postalCode,
      },
      notes: notes || '',
    });
    delivery.addStatus('PENDING', req.user._id);
    await delivery.save();

    // Link delivery to order
    order.delivery = delivery._id;
    await order.save();

    return res.status(201).json(delivery);
  } catch (error) {
    console.error('createDeliveryRequest error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to create delivery request' } });
  }
};

export const getMyDeliveries = async (req, res) => {
  try {
    const query = { requester: req.user._id };
    const deliveries = await Delivery.find(query)
      .populate('order', 'orderNumber items total status')
      .populate('driver', 'fullName email phone')
      .sort({ createdAt: -1 });
    return res.json(deliveries);
  } catch (error) {
    console.error('getMyDeliveries error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch deliveries' } });
  }
};

export const adminListDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && STATUS.includes(status)) filter.status = status;
    const deliveries = await Delivery.find(filter)
      .populate('order', 'orderNumber items total status')
      .populate('requester', 'fullName email role')
      .populate('driver', 'fullName email phone');
    return res.json(deliveries);
  } catch (error) {
    console.error('adminListDeliveries error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch deliveries' } });
  }
};

export const assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'driverId required' } });

    const delivery = await Delivery.findById(id);
    if (!delivery) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Delivery not found' } });

    delivery.driver = driverId;
    delivery.addStatus('ASSIGNED', req.user._id);
    await delivery.save();
    return res.json(delivery);
  } catch (error) {
    console.error('assignDriver error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to assign driver' } });
  }
};

export const driverUpdateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['PREPARING', 'COLLECTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'];
    if (!allowed.includes(status)) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid status' } });

    const delivery = await Delivery.findOne({ _id: id, driver: req.user._id });
    if (!delivery) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Delivery not found or not assigned' } });

    delivery.addStatus(status, req.user._id);
    await delivery.save();
    return res.json(delivery);
  } catch (error) {
    console.error('driverUpdateStatus error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update status' } });
  }
};

export const getDriverDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({ driver: req.user._id })
      .populate('order', 'orderNumber items total status')
      .populate('requester', 'fullName email phone')
      .sort({ createdAt: -1 });
    return res.json(deliveries);
  } catch (error) {
    console.error('getDriverDeliveries error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch driver deliveries' } });
  }
};



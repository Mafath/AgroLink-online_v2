import Delivery, { STATUS } from '../models/delivery.model.js';
import { sendDeliveryCancellationEmail } from '../lib/emailService.js';
import DeliveryManagerMessage from '../models/deliveryManagerMessage.model.js';

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

// Get delivery by order id for the current requester
export const getMyDeliveryByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'orderId required' } });
    const delivery = await Delivery.findOne({ requester: req.user._id, order: orderId })
      .populate('order', 'orderNumber items total status')
      .populate('driver', 'fullName email phone');
    if (!delivery) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Delivery not found for this order' } });
    return res.json(delivery);
  } catch (error) {
    console.error('getMyDeliveryByOrder error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch delivery' } });
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

    // Assign driver and set to assignment pending
    delivery.driver = driverId;
    delivery.assignmentStatus = {
      status: 'PENDING',
      assignedAt: new Date()
    };
    delivery.addStatus('ASSIGNMENT_PENDING', req.user._id);
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

// Get driver's pending assignments
export const getDriverPendingAssignments = async (req, res) => {
  try {
    const deliveries = await Delivery.find({ 
      driver: req.user._id,
      status: 'ASSIGNMENT_PENDING',
      'assignmentStatus.status': 'PENDING'
    })
      .populate('order', 'orderNumber items total status')
      .populate('requester', 'fullName email phone')
      .sort({ createdAt: -1 });
    return res.json(deliveries);
  } catch (error) {
    console.error('getDriverPendingAssignments error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch pending assignments' } });
  }
};

// Driver accept assignment
export const driverAcceptAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await Delivery.findOne({ 
      _id: id, 
      driver: req.user._id,
      status: 'ASSIGNMENT_PENDING',
      'assignmentStatus.status': 'PENDING'
    });

    if (!delivery) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'Assignment not found or already responded' } 
      });
    }

    // Update assignment status
    delivery.assignmentStatus = {
      status: 'ACCEPTED',
      assignedAt: delivery.assignmentStatus.assignedAt,
      respondedAt: new Date(),
      response: 'ACCEPTED'
    };

    // Update delivery status to ASSIGNED
    delivery.addStatus('ASSIGNED', req.user._id);
    await delivery.save();

    return res.json(delivery);
  } catch (error) {
    console.error('driverAcceptAssignment error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to accept assignment' } 
    });
  }
};

// Driver decline assignment
export const driverDeclineAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await Delivery.findOne({ 
      _id: id, 
      driver: req.user._id,
      status: 'ASSIGNMENT_PENDING',
      'assignmentStatus.status': 'PENDING'
    });

    if (!delivery) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'Assignment not found or already responded' } 
      });
    }

    // Update assignment status
    delivery.assignmentStatus = {
      status: 'DECLINED',
      assignedAt: delivery.assignmentStatus.assignedAt,
      respondedAt: new Date(),
      response: 'DECLINED'
    };

    // Remove driver assignment and return to pending
    delivery.driver = null;
    delivery.addStatus('PENDING', req.user._id);
    await delivery.save();

    return res.json(delivery);
  } catch (error) {
    console.error('driverDeclineAssignment error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to decline assignment' } 
    });
  }
};

// Admin can cancel a delivery at any time
export const adminCancelDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await Delivery.findById(id)
      .populate('order')
      .populate('requester', 'fullName email');
    if (!delivery) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Delivery not found' } });

    if (delivery.status === 'COMPLETED') {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Cannot cancel a completed delivery' } });
    }
    if (delivery.status === 'CANCELLED') {
      return res.status(200).json(delivery);
    }

    delivery.addStatus('CANCELLED', req.user._id);
    await delivery.save();

    // Create a message for the delivery manager instead of sending email
    try {
      const message = new DeliveryManagerMessage({
        delivery: delivery._id,
        order: delivery.order,
        message: `Order ${delivery.order?.orderNumber || delivery._id} has been cancelled. The customer has been notified and the order has been removed from the active delivery queue.`,
        messageType: 'CANCELLATION_REPLY',
        createdBy: req.user._id,
        senderType: 'SYSTEM'
      });
      await message.save();
    } catch (messageError) {
      console.error('Error creating delivery manager message:', messageError);
      // Don't fail the cancellation, just log the error
    }

    return res.json(delivery);
  } catch (error) {
    console.error('adminCancelDelivery error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to cancel delivery' } });
  }
};

// Get delivery manager messages (for delivery managers)
export const getDeliveryManagerMessages = async (req, res) => {
  try {
    const { messageType, senderType, delivery, limit = 50 } = req.query;
    
    let query = {};
    if (messageType && ['CANCELLATION_REPLY', 'ASSIGNMENT_REPLY', 'STATUS_UPDATE', 'CUSTOMER_MESSAGE', 'MANAGER_REPLY'].includes(messageType)) {
      query.messageType = messageType;
    }
    if (senderType && ['SYSTEM', 'CUSTOMER', 'MANAGER'].includes(senderType)) {
      query.senderType = senderType;
    }
    if (delivery) {
      query.delivery = delivery;
    }
    
    const messages = await DeliveryManagerMessage.find(query)
      .populate('delivery', 'order requester status')
      .populate('order', 'orderNumber total status')
      .populate('createdBy', 'fullName email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    return res.json(messages);
  } catch (error) {
    console.error('getDeliveryManagerMessages error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch messages' } });
  }
};

// Get unread messages count
export const getUnreadMessagesCount = async (req, res) => {
  try {
    const count = await DeliveryManagerMessage.getUnreadCount();
    return res.json({ count });
  } catch (error) {
    console.error('getUnreadMessagesCount error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch unread count' } });
  }
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await DeliveryManagerMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Message not found' } });
    }
    
    await message.markAsRead();
    return res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('markMessageAsRead error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to mark message as read' } });
  }
};

// Mark all messages as read
export const markAllMessagesAsRead = async (req, res) => {
  try {
    await DeliveryManagerMessage.updateMany(
      { isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    return res.json({ message: 'All messages marked as read' });
  } catch (error) {
    console.error('markAllMessagesAsRead error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to mark all messages as read' } });
  }
};

// Customer sends message to delivery manager about cancelled delivery
export const sendMessageToManager = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Message is required' } 
      });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Message is too long (max 1000 characters)' } 
      });
    }

    // Find the delivery and verify it belongs to the user and is cancelled
    const delivery = await Delivery.findById(deliveryId)
      .populate('order');
    
    if (!delivery) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'Delivery not found' } 
      });
    }

    // Check if delivery belongs to the user
    if (delivery.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: { code: 'FORBIDDEN', message: 'You can only send messages for your own deliveries' } 
      });
    }

    // Check if delivery is cancelled
    if (delivery.status !== 'CANCELLED') {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'You can only send messages for cancelled deliveries' } 
      });
    }

    // Check if customer has already sent a message for this delivery
    const existingMessage = await DeliveryManagerMessage.findOne({
      delivery: delivery._id,
      senderType: 'CUSTOMER',
      createdBy: req.user._id
    });

    if (existingMessage) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'You can only send one message per delivery' } 
      });
    }

    // Create the message
    const managerMessage = new DeliveryManagerMessage({
      delivery: delivery._id,
      order: delivery.order,
      message: message.trim(),
      messageType: 'CUSTOMER_MESSAGE',
      createdBy: req.user._id,
      senderType: 'CUSTOMER'
    });

    await managerMessage.save();

    // Populate the created message for response
    const populatedMessage = await DeliveryManagerMessage.findById(managerMessage._id)
      .populate('delivery', 'order requester status')
      .populate('order', 'orderNumber total status')
      .populate('createdBy', 'fullName email role');

    return res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('sendMessageToManager error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to send message' } 
    });
  }
};

// Get customer's messages for a specific delivery
export const getMyDeliveryMessages = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    // Find the delivery and verify it belongs to the user
    const delivery = await Delivery.findById(deliveryId);
    
    if (!delivery) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'Delivery not found' } 
      });
    }

    // Check if delivery belongs to the user
    if (delivery.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: { code: 'FORBIDDEN', message: 'You can only view messages for your own deliveries' } 
      });
    }

    // Get all messages for this delivery (customer messages, manager replies, system messages)
    const messages = await DeliveryManagerMessage.find({ delivery: deliveryId })
      .populate('delivery', 'order requester status')
      .populate('order', 'orderNumber total status')
      .populate('createdBy', 'fullName email role')
      .sort({ createdAt: -1 });

    return res.json(messages);
  } catch (error) {
    console.error('getMyDeliveryMessages error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch messages' } 
    });
  }
};

// Manager replies to customer message
export const replyToCustomerMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reply } = req.body;

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Reply message is required' } 
      });
    }

    if (reply.trim().length > 1000) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Reply message is too long (max 1000 characters)' } 
      });
    }

    // Find the original customer message
    const originalMessage = await DeliveryManagerMessage.findById(messageId)
      .populate('delivery', 'order requester status')
      .populate('order', 'orderNumber total status');
    
    if (!originalMessage) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'Message not found' } 
      });
    }

    // Check if it's a customer message
    if (originalMessage.senderType !== 'CUSTOMER') {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Can only reply to customer messages' } 
      });
    }

    // Create the manager reply
    const managerReply = new DeliveryManagerMessage({
      delivery: originalMessage.delivery,
      order: originalMessage.order,
      message: reply.trim(),
      messageType: 'MANAGER_REPLY',
      createdBy: req.user._id,
      senderType: 'MANAGER'
    });

    await managerReply.save();

    // Mark the original message as read
    originalMessage.isRead = true;
    originalMessage.readAt = new Date();
    await originalMessage.save();

    // Populate the reply for response
    const populatedReply = await DeliveryManagerMessage.findById(managerReply._id)
      .populate('delivery', 'order requester status')
      .populate('order', 'orderNumber total status')
      .populate('createdBy', 'fullName email role');

    return res.status(201).json(populatedReply);
  } catch (error) {
    console.error('replyToCustomerMessage error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to send reply' } 
    });
  }
};



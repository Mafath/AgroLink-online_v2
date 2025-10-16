import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  createDeliveryRequest,
  getMyDeliveries,
  getMyDeliveryByOrder,
  adminListDeliveries,
  assignDriver,
  driverUpdateStatus,
  getDriverDeliveries,
  adminCancelDelivery,
  getDeliveryManagerMessages,
  getUnreadMessagesCount,
  markMessageAsRead,
  markAllMessagesAsRead,
  sendMessageToManager,
  getMyDeliveryMessages,
  replyToCustomerMessage,
  adminUpdateManagerMessage,
  adminDeleteManagerMessage,
  adminDeleteDelivery,
} from '../controllers/delivery.controller.js';

const router = express.Router();

// Farmers and buyers create requests and view their own
router.post('/', requireAuth, requireRole('FARMER', 'BUYER'), createDeliveryRequest);
router.get('/me', requireAuth, requireRole('FARMER', 'BUYER'), getMyDeliveries);
router.get('/order/:orderId', requireAuth, requireRole('FARMER', 'BUYER'), getMyDeliveryByOrder);

// Customer messages for cancelled deliveries
router.post('/:deliveryId/message', requireAuth, requireRole('FARMER', 'BUYER'), sendMessageToManager);
router.get('/:deliveryId/messages', requireAuth, requireRole('FARMER', 'BUYER'), getMyDeliveryMessages);

// Admin lists all and assigns drivers
router.get('/', requireAuth, requireRole('ADMIN'), adminListDeliveries);
router.post('/:id/assign', requireAuth, requireRole('ADMIN'), assignDriver);
router.patch('/:id/cancel', requireAuth, requireRole('ADMIN'), adminCancelDelivery);
router.delete('/:id', requireAuth, requireRole('ADMIN'), adminDeleteDelivery);

// Drivers view their deliveries and update status
router.get('/driver/me', requireAuth, requireRole('DRIVER'), getDriverDeliveries);
router.post('/:id/status', requireAuth, requireRole('DRIVER'), driverUpdateStatus);

// Delivery manager messages (for delivery managers)
router.get('/messages', requireAuth, requireRole('ADMIN'), getDeliveryManagerMessages);
router.get('/messages/unread-count', requireAuth, requireRole('ADMIN'), getUnreadMessagesCount);
router.patch('/messages/:messageId/read', requireAuth, requireRole('ADMIN'), markMessageAsRead);
router.patch('/messages/read-all', requireAuth, requireRole('ADMIN'), markAllMessagesAsRead);
router.post('/messages/:messageId/reply', requireAuth, requireRole('ADMIN'), replyToCustomerMessage);
router.patch('/messages/:messageId', requireAuth, requireRole('ADMIN'), adminUpdateManagerMessage);
router.delete('/messages/:messageId', requireAuth, requireRole('ADMIN'), adminDeleteManagerMessage);

export default router;



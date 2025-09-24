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
} from '../controllers/delivery.controller.js';

const router = express.Router();

// Farmers and buyers create requests and view their own
router.post('/', requireAuth, requireRole('FARMER', 'BUYER'), createDeliveryRequest);
router.get('/me', requireAuth, requireRole('FARMER', 'BUYER'), getMyDeliveries);
router.get('/order/:orderId', requireAuth, requireRole('FARMER', 'BUYER'), getMyDeliveryByOrder);

// Admin lists all and assigns drivers
router.get('/', requireAuth, requireRole('ADMIN'), adminListDeliveries);
router.post('/:id/assign', requireAuth, requireRole('ADMIN'), assignDriver);
router.patch('/:id/cancel', requireAuth, requireRole('ADMIN'), adminCancelDelivery);

// Drivers view their deliveries and update status
router.get('/driver/me', requireAuth, requireRole('DRIVER'), getDriverDeliveries);
router.post('/:id/status', requireAuth, requireRole('DRIVER'), driverUpdateStatus);

export default router;



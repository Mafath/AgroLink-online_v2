import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  createOrder,
  createOrderFromCart,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  adminListOrders,
  cancelOrder,
  getFarmerStats,
} from '../controllers/order.controller.js';

const router = express.Router();

// Customer routes
router.post('/', requireAuth, requireRole('FARMER', 'BUYER'), createOrder);
router.post('/from-cart', requireAuth, requireRole('FARMER', 'BUYER'), createOrderFromCart);
router.get('/me', requireAuth, requireRole('FARMER', 'BUYER'), getMyOrders);
router.get('/:id', requireAuth, getOrderById);

// Farmer stats
router.get('/stats/farmer', requireAuth, requireRole('FARMER'), getFarmerStats);

// Admin routes
router.get('/', requireAuth, requireRole('ADMIN'), adminListOrders);
router.patch('/:id/status', requireAuth, requireRole('ADMIN'), updateOrderStatus);
// Cancel order
router.patch('/:id/cancel', requireAuth, cancelOrder);

export default router;

import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  createOrder,
  createOrderFromCart,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  adminListOrders,
} from '../controllers/order.controller.js';

const router = express.Router();

// Customer routes
router.post('/', requireAuth, requireRole('FARMER', 'BUYER'), createOrder);
router.post('/from-cart', requireAuth, requireRole('FARMER', 'BUYER'), createOrderFromCart);
router.get('/me', requireAuth, requireRole('FARMER', 'BUYER'), getMyOrders);
router.get('/:id', requireAuth, getOrderById);

// Admin routes
router.get('/', requireAuth, requireRole('ADMIN'), adminListOrders);
router.patch('/:id/status', requireAuth, requireRole('ADMIN'), updateOrderStatus);

export default router;

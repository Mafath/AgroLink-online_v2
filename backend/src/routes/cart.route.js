import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount
} from '../controllers/cart.controller.js';

const router = express.Router();

// All cart routes require authentication
router.use(requireAuth);

// GET /api/cart - Get user's cart
router.get('/', getCart);

// GET /api/cart/count - Get cart item count (for navbar)
router.get('/count', getCartCount);

// POST /api/cart/add - Add item to cart
router.post('/add', addToCart);

// PUT /api/cart/update - Update item quantity in cart
router.put('/update', updateCartItem);

// DELETE /api/cart/remove - Remove item from cart
router.delete('/remove', removeFromCart);

// DELETE /api/cart/clear - Clear entire cart
router.delete('/clear', clearCart);

export default router;

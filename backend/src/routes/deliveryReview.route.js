import express from 'express';
import {
  createDeliveryReview,
  updateMyDeliveryReview,
  deleteMyDeliveryReview,
  getMyDeliveryReviews,
  getAllDeliveryReviews,
  replyToReview,
  updateAdminReply,
  deleteAdminReply,
  toggleReviewVisibility,
  toggleAdminReplyVisibility,
  getReviewStatistics
} from '../controllers/deliveryReview.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// User routes (authenticated users)
router.post('/', requireAuth, createDeliveryReview);
router.put('/my/:reviewId', requireAuth, updateMyDeliveryReview);
router.delete('/my/:reviewId', requireAuth, deleteMyDeliveryReview);
router.get('/my', requireAuth, getMyDeliveryReviews);

// Admin routes (admin only)
router.get('/admin', requireAuth, getAllDeliveryReviews);
router.post('/admin/:reviewId/reply', requireAuth, replyToReview);
router.put('/admin/:reviewId/reply', requireAuth, updateAdminReply);
router.delete('/admin/:reviewId/reply', requireAuth, deleteAdminReply);
router.patch('/admin/:reviewId/visibility', requireAuth, toggleReviewVisibility);
router.patch('/admin/:reviewId/reply-visibility', requireAuth, toggleAdminReplyVisibility);
router.get('/admin/statistics', requireAuth, getReviewStatistics);

export default router;

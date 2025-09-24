import express from 'express';
import {
  verifyEmail,
  resendVerificationEmail,
  checkVerificationStatus,
  sendVerificationEmailToUser
} from '../controllers/emailVerification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/verify/:token', verifyEmail);
router.post('/resend', resendVerificationEmail);
router.get('/status/:email', checkVerificationStatus);

// Protected routes (require authentication)
router.post('/send/:userId', requireAuth, sendVerificationEmailToUser);

export default router;

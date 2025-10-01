import express from 'express';
import {
  createReport,
  getAllAgronomists,
  getFarmerReports,
  getAgronomistReports,
  replyToReport,
  resolveReport,
  getReportStats
} from '../controllers/report.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Reports route is working!' });
});

// Farmer routes
router.post('/', requireAuth, requireRole('FARMER'), createReport);
router.get('/agronomists', getAllAgronomists);
router.get('/farmer', getFarmerReports);
router.get('/stats', requireAuth, requireRole('FARMER'), getReportStats);

// Agronomist routes
router.get('/agronomist', requireAuth, requireRole('AGRONOMIST'), getAgronomistReports);
router.post('/:reportId/reply', requireAuth, requireRole('AGRONOMIST'), replyToReport);
router.put('/:reportId/resolve', requireAuth, requireRole('AGRONOMIST'), resolveReport);

export default router;
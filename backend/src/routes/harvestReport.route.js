import express from 'express';
import { 
  submitReport, 
  getFarmerReports, 
  getAgronomistReports, 
  replyToReport, 
  farmerReplyToReport,
  resolveReport, 
  getReportById 
} from '../controllers/harvestReport.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Submit a new harvest report (any authenticated user can submit)
router.post('/', requireAuth, submitReport);

// Get a specific report by ID (farmer, assigned agronomist, or admin)
router.get('/:reportId', requireAuth, getReportById);

// Get reports for farmers
router.get('/farmer/reports', requireAuth, getFarmerReports);

// Get reports assigned to agronomists
router.get('/agronomist/reports', requireAuth, requireRole('AGRONOMIST'), getAgronomistReports);

// Agronomist replies to a report
router.put('/:reportId/reply', requireAuth, requireRole('AGRONOMIST'), replyToReport);

// Farmer replies to agronomist's reply
router.put('/:reportId/farmer-reply', requireAuth, farmerReplyToReport);

// Agronomist marks report as resolved
router.put('/:reportId/resolve', requireAuth, requireRole('AGRONOMIST'), resolveReport);

export default router;

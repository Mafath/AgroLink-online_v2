import express from 'express'
import { createRentalItem, listRentalItems } from '../controllers/rental.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router()

// List all rental items (admin view)
router.get('/', requireAuth, requireRole('ADMIN'), listRentalItems)

// Create rental item
router.post('/', requireAuth, requireRole('ADMIN'), createRentalItem)

export default router



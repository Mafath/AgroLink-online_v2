import express from 'express'
import { createRentalItem, listRentalItems, updateRentalItem, deleteRentalItem } from '../controllers/rental.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router()

// List all rental items (admin view)
router.get('/', requireAuth, requireRole('ADMIN'), listRentalItems)

// List all rental items (public view for farmers)
router.get('/public', listRentalItems)

// Create rental item
router.post('/', requireAuth, requireRole('ADMIN'), createRentalItem)

// Update rental item
router.put('/:id', requireAuth, requireRole('ADMIN'), updateRentalItem)
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteRentalItem)

export default router



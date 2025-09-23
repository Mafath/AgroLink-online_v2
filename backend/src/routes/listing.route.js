import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'
import { getMyListings, createListing, getAllListings, updateListing, deleteListing, getAllListingsAll } from '../controllers/listing.controller.js'
const router = express.Router()
// Public listings for buyers
router.get('/', getAllListings)

// Admin: get all listings (all statuses)
router.get('/all', requireAuth, requireRole('ADMIN'), getAllListingsAll)

// Only FARMERs can manage their listings
router.get('/mine', requireAuth, requireRole('FARMER'), getMyListings)
router.post('/', requireAuth, requireRole('FARMER'), createListing)
router.put('/:id', requireAuth, requireRole('FARMER'), updateListing)
router.delete('/:id', requireAuth, requireRole('FARMER'), deleteListing)

export default router



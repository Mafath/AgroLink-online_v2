import express from 'express'
import { listInventory, createInventory, updateInventory, deleteInventory } from '../controllers/inventory.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', requireAuth, requireRole('ADMIN'), listInventory)
router.post('/', requireAuth, requireRole('ADMIN'), createInventory)
router.put('/:id', requireAuth, requireRole('ADMIN'), updateInventory)
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteInventory)

export default router



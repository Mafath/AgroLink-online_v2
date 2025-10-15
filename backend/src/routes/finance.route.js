import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'
import {
  getSummary,
  listTransactions, createTransaction, updateTransaction, deleteTransaction,
  getIncomeFromOrders, getIncomeFromDeliveryFees, getIncomeBySource,
  getDriverPayouts, getFarmerPayouts,
} from '../controllers/finance.controller.js'

const router = express.Router()

// Admin protected routes
router.use(requireAuth, requireRole('ADMIN'))

router.get('/summary', getSummary)
router.get('/income/orders', getIncomeFromOrders)
router.get('/income/delivery-fees', getIncomeFromDeliveryFees)
router.get('/income/by-source', getIncomeBySource)
router.get('/expenses/driver-payouts', getDriverPayouts)
router.get('/expenses/farmer-payouts', getFarmerPayouts)

router.get('/transactions', listTransactions)
router.post('/transactions', createTransaction)
router.put('/transactions/:id', updateTransaction)
router.delete('/transactions/:id', deleteTransaction)

// removed budgets/goals/debts/recurring endpoints per spec

export default router



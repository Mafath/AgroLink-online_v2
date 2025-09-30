import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'
import {
  getSummary,
  listTransactions, createTransaction, updateTransaction, deleteTransaction,
  listBudgets, createBudget, updateBudget, deleteBudget,
  getBudgetUtilization,
  listGoals, createGoal, updateGoal, deleteGoal,
  listDebts, createDebt, updateDebt, deleteDebt,
  listRecurring, createRecurring, updateRecurring, deleteRecurring,
  getIncomeFromOrders,
} from '../controllers/finance.controller.js'

const router = express.Router()

// Admin protected routes
router.use(requireAuth, requireRole('ADMIN'))

router.get('/summary', getSummary)
router.get('/income/orders', getIncomeFromOrders)

router.get('/transactions', listTransactions)
router.post('/transactions', createTransaction)
router.put('/transactions/:id', updateTransaction)
router.delete('/transactions/:id', deleteTransaction)

router.get('/budgets', listBudgets)
router.post('/budgets', createBudget)
router.put('/budgets/:id', updateBudget)
router.delete('/budgets/:id', deleteBudget)
router.get('/budgets/utilization', getBudgetUtilization)

router.get('/goals', listGoals)
router.post('/goals', createGoal)
router.put('/goals/:id', updateGoal)
router.delete('/goals/:id', deleteGoal)

router.get('/debts', listDebts)
router.post('/debts', createDebt)
router.put('/debts/:id', updateDebt)
router.delete('/debts/:id', deleteDebt)

router.get('/recurring', listRecurring)
router.post('/recurring', createRecurring)
router.put('/recurring/:id', updateRecurring)
router.delete('/recurring/:id', deleteRecurring)
// Optional: run a recurring item now (creates immediate transaction)
router.post('/recurring/:id/run', async (req, res) => {
  try {
    const item = await (await import('../models/financeRecurring.model.js')).default.findById(req.params.id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    const FinanceTransaction = (await import('../models/financeTransaction.model.js')).default
    const doc = await FinanceTransaction.create({
      type: item.type,
      amount: item.amount,
      date: new Date(),
      category: item.category,
      description: `[Recurring] ${item.title}`,
      createdBy: req.user?._id,
    })
    return res.json(doc)
  } catch (e) {
    return res.status(400).json({ error: 'Failed to run recurring' })
  }
})

export default router



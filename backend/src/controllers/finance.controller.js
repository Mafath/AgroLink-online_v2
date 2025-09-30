import FinanceTransaction from '../models/financeTransaction.model.js'
import FinanceBudget from '../models/financeBudget.model.js'
import FinanceGoal from '../models/financeGoal.model.js'
import FinanceDebt from '../models/financeDebt.model.js'
import FinanceRecurring from '../models/financeRecurring.model.js'
import cloudinary from '../lib/cloudinary.js'
import { sendBudgetAlertEmail } from '../lib/emailService.js'
import Order from '../models/order.model.js'

export const getSummary = async (req, res) => {
  try {
    const [incomeAgg] = await FinanceTransaction.aggregate([
      { $match: { type: 'INCOME' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ])
    const [expenseAgg] = await FinanceTransaction.aggregate([
      { $match: { type: 'EXPENSE' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ])

    const income = incomeAgg?.sum || 0
    const expenses = expenseAgg?.sum || 0
    const balance = income - expenses

    return res.json({ income, expenses, balance })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch summary' })
  }
}

// Transactions CRUD
export const listTransactions = async (req, res) => {
  try {
    const { type, from, to, q } = req.query
    const filter = {}
    if (type && ['INCOME','EXPENSE'].includes(type)) filter.type = type
    if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = new Date(from)
      if (to) filter.date.$lte = new Date(to)
    }
    if (q) {
      filter.$or = [
        { category: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { source: { $regex: q, $options: 'i' } },
      ]
    }
    const docs = await FinanceTransaction.find(filter).sort({ date: -1, createdAt: -1 })
    return res.json(docs)
  } catch (e) {
    return res.status(500).json({ error: 'Failed to list transactions' })
  }
}

export const createTransaction = async (req, res) => {
  try {
    const { type, amount, date, category, description, source, receiptBase64 } = req.body
    let receiptUrl, receiptPublicId
    if (receiptBase64) {
      const upload = await cloudinary.uploader.upload(receiptBase64, { folder: 'agrolink/finance/receipts' })
      receiptUrl = upload.secure_url
      receiptPublicId = upload.public_id
    }
    const doc = await FinanceTransaction.create({ type, amount, date, category, description, source, receiptUrl, receiptPublicId, createdBy: req.user?._id })

    // Budget alert on expenses
    if (type === 'EXPENSE') {
      try {
        const budgets = await FinanceBudget.find()
        const now = new Date(date || Date.now())
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay())
        for (const b of budgets) {
          const matchCategories = Array.isArray(b.categories) && b.categories.length > 0 ? b.categories.includes(category) : true
          if (!matchCategories) continue
          const periodStart = b.period === 'WEEKLY' ? startOfWeek : startOfMonth
          const [agg] = await FinanceTransaction.aggregate([
            { $match: { type: 'EXPENSE', date: { $gte: periodStart }, ...(matchCategories && Array.isArray(b.categories) && b.categories.length>0 ? { category: { $in: b.categories } } : {}) } },
            { $group: { _id: null, sum: { $sum: '$amount' } } },
          ])
          const spent = agg?.sum || 0
          const utilization = b.amount > 0 ? spent / b.amount : 0
          if (utilization >= (b.alertThreshold || 0.8) && b.notifyEmail) {
            await sendBudgetAlertEmail({ to: b.notifyEmail, budgetName: b.name, period: b.period, amount: b.amount, spent, utilization })
          }
        }
      } catch {}
    }

    return res.status(201).json(doc)
  } catch (e) {
    return res.status(400).json({ error: 'Failed to create transaction' })
  }
}

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params
    const { receiptBase64, removeReceipt, ...rest } = req.body
    const doc = await FinanceTransaction.findById(id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    if (removeReceipt && doc.receiptPublicId) {
      try { await cloudinary.uploader.destroy(doc.receiptPublicId) } catch {}
      doc.receiptPublicId = undefined
      doc.receiptUrl = undefined
    }
    if (receiptBase64) {
      if (doc.receiptPublicId) { try { await cloudinary.uploader.destroy(doc.receiptPublicId) } catch {} }
      const upload = await cloudinary.uploader.upload(receiptBase64, { folder: 'agrolink/finance/receipts' })
      doc.receiptUrl = upload.secure_url
      doc.receiptPublicId = upload.public_id
    }
    Object.assign(doc, rest)
    await doc.save()
    return res.json(doc)
  } catch (e) {
    return res.status(400).json({ error: 'Failed to update transaction' })
  }
}

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params
    const doc = await FinanceTransaction.findById(id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    if (doc.receiptPublicId) { try { await cloudinary.uploader.destroy(doc.receiptPublicId) } catch {} }
    await doc.deleteOne()
    return res.json({ success: true })
  } catch (e) {
    return res.status(400).json({ error: 'Failed to delete transaction' })
  }
}

// Budgets
export const listBudgets = async (_req, res) => {
  try { const docs = await FinanceBudget.find().sort({ createdAt: -1 }); return res.json(docs) } catch { return res.status(500).json({ error: 'Failed to list budgets' }) }
}
export const createBudget = async (req, res) => {
  try { const doc = await FinanceBudget.create({ ...req.body, createdBy: req.user?._id }); return res.status(201).json(doc) } catch { return res.status(400).json({ error: 'Failed to create budget' }) }
}
export const updateBudget = async (req, res) => {
  try { const doc = await FinanceBudget.findByIdAndUpdate(req.params.id, req.body, { new: true }); if (!doc) return res.status(404).json({ error: 'Not found' }); return res.json(doc) } catch { return res.status(400).json({ error: 'Failed to update budget' }) }
}
export const deleteBudget = async (req, res) => {
  try { await FinanceBudget.findByIdAndDelete(req.params.id); return res.json({ success: true }) } catch { return res.status(400).json({ error: 'Failed to delete budget' }) }
}

export const getBudgetUtilization = async (req, res) => {
  try {
    const budgets = await FinanceBudget.find()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const results = []
    for (const b of budgets) {
      const periodStart = b.period === 'WEEKLY' ? startOfWeek : startOfMonth
      const matchCategories = Array.isArray(b.categories) && b.categories.length > 0
        ? { category: { $in: b.categories } }
        : {}
      const [agg] = await FinanceTransaction.aggregate([
        { $match: { type: 'EXPENSE', date: { $gte: periodStart }, ...matchCategories } },
        { $group: { _id: null, sum: { $sum: '$amount' } } },
      ])
      const spent = agg?.sum || 0
      const utilization = b.amount > 0 ? spent / b.amount : 0
      results.push({ id: String(b._id), name: b.name, period: b.period, amount: b.amount, categories: b.categories, spent, utilization, alertThreshold: b.alertThreshold })
    }
    return res.json(results)
  } catch (e) {
    return res.status(500).json({ error: 'Failed to compute utilization' })
  }
}

// Goals
export const listGoals = async (_req, res) => {
  try { const docs = await FinanceGoal.find().sort({ createdAt: -1 }); return res.json(docs) } catch { return res.status(500).json({ error: 'Failed to list goals' }) }
}
export const createGoal = async (req, res) => {
  try { const doc = await FinanceGoal.create({ ...req.body, createdBy: req.user?._id }); return res.status(201).json(doc) } catch { return res.status(400).json({ error: 'Failed to create goal' }) }
}
export const updateGoal = async (req, res) => {
  try { const doc = await FinanceGoal.findByIdAndUpdate(req.params.id, req.body, { new: true }); if (!doc) return res.status(404).json({ error: 'Not found' }); return res.json(doc) } catch { return res.status(400).json({ error: 'Failed to update goal' }) }
}
export const deleteGoal = async (req, res) => {
  try { await FinanceGoal.findByIdAndDelete(req.params.id); return res.json({ success: true }) } catch { return res.status(400).json({ error: 'Failed to delete goal' }) }
}

// Debts
export const listDebts = async (_req, res) => {
  try { const docs = await FinanceDebt.find().sort({ createdAt: -1 }); return res.json(docs) } catch { return res.status(500).json({ error: 'Failed to list debts' }) }
}
export const createDebt = async (req, res) => {
  try { const doc = await FinanceDebt.create({ ...req.body, createdBy: req.user?._id }); return res.status(201).json(doc) } catch { return res.status(400).json({ error: 'Failed to create debt' }) }
}
export const updateDebt = async (req, res) => {
  try { const doc = await FinanceDebt.findByIdAndUpdate(req.params.id, req.body, { new: true }); if (!doc) return res.status(404).json({ error: 'Not found' }); return res.json(doc) } catch { return res.status(400).json({ error: 'Failed to update debt' }) }
}
export const deleteDebt = async (req, res) => {
  try { await FinanceDebt.findByIdAndDelete(req.params.id); return res.json({ success: true }) } catch { return res.status(400).json({ error: 'Failed to delete debt' }) }
}

// Recurring
export const listRecurring = async (_req, res) => {
  try { const docs = await FinanceRecurring.find().sort({ createdAt: -1 }); return res.json(docs) } catch { return res.status(500).json({ error: 'Failed to list recurring' }) }
}
export const createRecurring = async (req, res) => {
  try { const doc = await FinanceRecurring.create({ ...req.body, createdBy: req.user?._id }); return res.status(201).json(doc) } catch { return res.status(400).json({ error: 'Failed to create recurring' }) }
}
export const updateRecurring = async (req, res) => {
  try { const doc = await FinanceRecurring.findByIdAndUpdate(req.params.id, req.body, { new: true }); if (!doc) return res.status(404).json({ error: 'Not found' }); return res.json(doc) } catch { return res.status(400).json({ error: 'Failed to update recurring' }) }
}
export const deleteRecurring = async (req, res) => {
  try { await FinanceRecurring.findByIdAndDelete(req.params.id); return res.json({ success: true }) } catch { return res.status(400).json({ error: 'Failed to delete recurring' }) }
}

// Company income from orders (inventory, rental, listing)
export const getIncomeFromOrders = async (req, res) => {
  try {
    const { from, to } = req.query
    const filter = {}
    if (from || to) {
      filter.createdAt = {}
      if (from) filter.createdAt.$gte = new Date(from)
      if (to) filter.createdAt.$lte = new Date(to)
    }
    // Exclude cancelled orders
    filter.status = { $ne: 'CANCELLED' }
    // Prefer paid orders if paymentStatus exists
    // We'll not strictly enforce PAID to avoid missing cash-on-delivery marked PENDING; adjust as needed

    const orders = await Order.find(filter).lean()
    const items = []
    const totalsByType = { inventory: 0, rental: 0, listing: 0 }

    for (const o of orders) {
      for (const it of (o.items || [])) {
        const qty = Number(it.quantity || 1)
        let lineTotal = 0
        if (it.itemType === 'rental') {
          const perDay = Number(it.rentalPerDay || it.price || 0)
          const start = it.rentalStartDate ? new Date(it.rentalStartDate) : null
          const end = it.rentalEndDate ? new Date(it.rentalEndDate) : null
          let days = 1
          if (start && end && !isNaN(start) && !isNaN(end)) {
            const ms = Math.max(0, end.setHours(0,0,0,0) - start.setHours(0,0,0,0))
            days = Math.max(1, Math.ceil(ms / (1000*60*60*24)) + 1)
          }
          lineTotal = perDay * days * qty
        } else {
          const price = Number(it.price || 0)
          lineTotal = price * qty
        }
        totalsByType[it.itemType] = (totalsByType[it.itemType] || 0) + lineTotal
        items.push({
          orderId: o._id,
          orderNumber: o.orderNumber,
          createdAt: o.createdAt,
          itemType: it.itemType,
          title: it.title,
          quantity: qty,
          unitPrice: it.itemType === 'rental' ? Number(it.rentalPerDay || it.price || 0) : Number(it.price || 0),
          lineTotal,
        })
      }
    }

    const totalIncome = (totalsByType.inventory || 0) + (totalsByType.rental || 0) + (totalsByType.listing || 0)
    return res.json({ totalsByType, totalIncome, items })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to compute income from orders' })
  }
}


import mongoose from 'mongoose'

const FinanceTransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['INCOME','EXPENSE'], required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: () => new Date() },
  category: { type: String, trim: true },
  description: { type: String, trim: true },
  source: { type: String, trim: true },
  receiptUrl: { type: String },
  receiptPublicId: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

FinanceTransactionSchema.index({ date: -1 })

const FinanceTransaction = mongoose.model('FinanceTransaction', FinanceTransactionSchema)
export default FinanceTransaction



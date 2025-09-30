import mongoose from 'mongoose'

const FinanceRecurringSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['INCOME','EXPENSE'], required: true },
  amount: { type: Number, required: true, min: 0 },
  cadence: { type: String, enum: ['DAILY','WEEKLY','MONTHLY','YEARLY'], default: 'MONTHLY' },
  nextRunAt: { type: Date, default: () => new Date() },
  category: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  active: { type: Boolean, default: true },
}, { timestamps: true })

const FinanceRecurring = mongoose.model('FinanceRecurring', FinanceRecurringSchema)
export default FinanceRecurring



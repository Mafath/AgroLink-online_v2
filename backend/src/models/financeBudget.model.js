import mongoose from 'mongoose'

const BudgetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  period: { type: String, enum: ['MONTHLY','WEEKLY'], default: 'MONTHLY' },
  amount: { type: Number, required: true, min: 0 },
  categories: [{ type: String }],
  startDate: { type: Date },
  endDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  alertThreshold: { type: Number, default: 0.8 }, // 80% by default
  notifyEmail: { type: String },
}, { timestamps: true })

const FinanceBudget = mongoose.model('FinanceBudget', BudgetSchema)
export default FinanceBudget



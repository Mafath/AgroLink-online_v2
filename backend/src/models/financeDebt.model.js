import mongoose from 'mongoose'

const FinanceDebtSchema = new mongoose.Schema({
  type: { type: String, enum: ['BORROWED','LENT'], required: true },
  party: { type: String, required: true, trim: true },
  principal: { type: Number, required: true, min: 0 },
  interestRate: { type: Number, default: 0 },
  startDate: { type: Date, default: () => new Date() },
  dueDate: { type: Date },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

const FinanceDebt = mongoose.model('FinanceDebt', FinanceDebtSchema)
export default FinanceDebt



import mongoose from 'mongoose'

const FinanceGoalSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true, min: 0 },
  currentAmount: { type: Number, default: 0, min: 0 },
  dueDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

const FinanceGoal = mongoose.model('FinanceGoal', FinanceGoalSchema)
export default FinanceGoal



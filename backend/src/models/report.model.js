import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agronomist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Will be auto-assigned based on active harvest
  },
  harvest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Harvest',
    default: null // Optional: link to specific harvest
  },
  crop: {
    type: String,
    required: true
  },
  problem: {
    type: String,
    required: true
  },
  images: [{
    type: String, // Cloudinary URLs
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'assigned', 'replied', 'resolved'],
    default: 'pending'
  },
  reply: {
    type: String,
    default: ''
  },
  replyDate: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Index for efficient queries
reportSchema.index({ farmer: 1, createdAt: -1 });
reportSchema.index({ agronomist: 1, status: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;

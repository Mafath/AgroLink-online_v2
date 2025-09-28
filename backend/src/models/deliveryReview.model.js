import mongoose from 'mongoose';

const deliveryReviewSchema = new mongoose.Schema(
  {
    delivery: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Delivery', 
      required: true, 
      index: true 
    },
    reviewer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    reviewerRole: { 
      type: String, 
      enum: ['FARMER', 'BUYER'], 
      required: true 
    },
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5 
    },
    comment: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 1000 
    },
    adminReply: {
      reply: { 
        type: String, 
        default: '', 
        trim: true, 
        maxlength: 1000 
      },
      repliedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
      },
      repliedAt: { 
        type: Date 
      },
      isVisible: {
        type: Boolean,
        default: true
      }
    },
    isVisible: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

// Ensure one review per delivery per user
deliveryReviewSchema.index({ delivery: 1, reviewer: 1 }, { unique: true });

// Add text index for search functionality
deliveryReviewSchema.index({ comment: 'text', 'adminReply.reply': 'text' });

const DeliveryReview = mongoose.model('DeliveryReview', deliveryReviewSchema);

export default DeliveryReview;

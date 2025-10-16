import mongoose from 'mongoose';

const deliveryManagerMessageSchema = new mongoose.Schema(
  {
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
      required: true,
      index: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    messageType: {
      type: String,
      enum: ['CANCELLATION_REPLY', 'ASSIGNMENT_REPLY', 'STATUS_UPDATE', 'CUSTOMER_MESSAGE', 'MANAGER_REPLY'],
      default: 'CANCELLATION_REPLY',
      index: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderType: {
      type: String,
      enum: ['SYSTEM', 'CUSTOMER', 'MANAGER'],
      default: 'SYSTEM',
      index: true
    }
  },
  { timestamps: true }
);

// Index for efficient queries
deliveryManagerMessageSchema.index({ delivery: 1, createdAt: -1 });
deliveryManagerMessageSchema.index({ messageType: 1, isRead: 1, createdAt: -1 });

// Method to mark message as read
deliveryManagerMessageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread messages count
deliveryManagerMessageSchema.statics.getUnreadCount = function() {
  return this.countDocuments({ isRead: false });
};

// Static method to get messages by delivery
deliveryManagerMessageSchema.statics.getByDelivery = function(deliveryId) {
  return this.find({ delivery: deliveryId })
    .populate('delivery', 'order requester status')
    .populate('order', 'orderNumber total status')
    .populate('createdBy', 'fullName email role')
    .sort({ createdAt: -1 });
};

// Static method to get messages by type
deliveryManagerMessageSchema.statics.getByType = function(messageType, limit = 50) {
  return this.find({ messageType })
    .populate('delivery', 'order requester status')
    .populate('order', 'orderNumber total status')
    .populate('createdBy', 'fullName email role')
    .sort({ createdAt: -1 })
    .limit(limit);
};

export default mongoose.model('DeliveryManagerMessage', deliveryManagerMessageSchema);

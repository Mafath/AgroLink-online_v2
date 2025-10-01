import mongoose from 'mongoose';

const STATUS = [
  'PENDING',
  'ASSIGNED',
  'PREPARING',
  'COLLECTED',
  'IN_TRANSIT',
  'COMPLETED',
  'CANCELLED',
];

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUS, required: true },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requesterRole: { type: String, enum: ['FARMER', 'BUYER'], required: true, index: true },
    contactName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: addressSchema, required: true },
    notes: { type: String, default: '', trim: true, maxlength: 1000 },
    status: { type: String, enum: STATUS, default: 'PENDING', index: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    statusHistory: { type: [statusHistorySchema], default: [] },
    review: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryReview', default: null },
  },
  { timestamps: true }
);

deliverySchema.methods.addStatus = function(status, userId) {
  this.status = status;
  this.statusHistory.push({ status, updatedBy: userId, updatedAt: new Date() });
};

const Delivery = mongoose.model('Delivery', deliverySchema);

export { STATUS };
export default Delivery;



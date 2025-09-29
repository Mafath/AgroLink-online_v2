import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, required: true }, // Can reference Listing or InventoryProduct
  itemType: { type: String, enum: ['listing', 'inventory'], required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  title: { type: String, required: true },
  image: { type: String, default: '' },
}, { _id: false });

const addressSchema = new mongoose.Schema({
  line1: { type: String, required: true, trim: true },
  line2: { type: String, default: '', trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerRole: { type: String, enum: ['FARMER', 'BUYER'], required: true },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ["NOT READY", "READY", "CANCELLED"], 
    default: "NOT READY",
    index: true 
  },
  deliveryType: { 
    type: String, 
    enum: ['PICKUP', 'DELIVERY'], 
    required: true 
  },
  deliveryAddress: { type: addressSchema, required: function() { return this.deliveryType === 'DELIVERY'; } },
  contactName: { type: String, required: true, trim: true },
  contactPhone: { type: String, required: true, trim: true },
  contactEmail: { type: String, required: true, trim: true },
  notes: { type: String, default: '', trim: true, maxlength: 1000 },
  delivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', default: null },
  paymentMethod: { type: String, default: 'CASH', enum: ['CASH', 'CARD', 'BANK_TRANSFER'] },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
}, { timestamps: true });

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;

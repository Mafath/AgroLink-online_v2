import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  // Reference to either inventory or listing
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  itemType: { type: String, enum: ['inventory', 'listing'], required: true },
  
  // Cached item details for quick access
  title: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  category: { type: String, default: '' },
  
  // Quantity and availability
  quantity: { type: Number, required: true, min: 1 },
  maxQuantity: { type: Number, required: true, min: 0 }, // stockQuantity or capacityKg
  
  // Additional item-specific fields
  unit: { type: String, default: 'units' }, // 'units' for inventory, 'kg' for listings
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for faster queries
cartSchema.index({ user: 1 });
cartSchema.index({ lastUpdated: 1 });

// Update lastUpdated timestamp before saving
cartSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Virtual for total items count
cartSchema.virtual('itemCount').get(function() {
  return this.items.length;
});

// Virtual for total quantity
cartSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for total price
cartSchema.virtual('totalPrice').get(function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Ensure virtual fields are serialized
cartSchema.set('toJSON', { virtuals: true });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;



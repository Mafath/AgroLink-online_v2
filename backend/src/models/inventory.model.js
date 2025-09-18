import mongoose from "mongoose";

const inventoryProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'seeds',
        'fertilizers',
        'pesticides',
        'chemicals',
        'equipment',
        'irrigation',
      ],
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 4;
        },
        message: 'Cannot have more than 4 images'
      }
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Available', 'Low stock', 'Out of stock'],
      default: 'Available',
    },
  },
  { timestamps: true },
);

// Add indexes for better query performance
inventoryProductSchema.index({ createdAt: -1 });
inventoryProductSchema.index({ category: 1 });
inventoryProductSchema.index({ status: 1 });
inventoryProductSchema.index({ name: 'text', description: 'text' }); // Text search index
inventoryProductSchema.index({ category: 1, status: 1 }); // Compound index for common filters
inventoryProductSchema.index({ stockQuantity: 1 }); // For stock-based queries

const InventoryProduct = mongoose.model("Inventoryproduct", inventoryProductSchema);

export default InventoryProduct;



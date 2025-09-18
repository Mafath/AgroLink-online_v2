import mongoose from "mongoose";

const inventoryProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true,
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
      index: true,
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
      index: true,
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
      index: true,
    },
  },
  { timestamps: true },
);

const InventoryProduct = mongoose.model("InventoryProduct", inventoryProductSchema);

export default InventoryProduct;



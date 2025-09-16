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
    price: {
      type: Number,
      required: true,
      min: 0,
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
        validator: function (val) {
          return Array.isArray(val) && val.length <= 4;
        },
        message: "You can upload at most 4 images per product.",
      },
    },
    status: {
      type: String,
      enum: ["ACTIVE", "HIDDEN"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true },
);

const InventoryProduct = mongoose.model("InventoryProduct", inventoryProductSchema);

export default InventoryProduct;



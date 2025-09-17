import mongoose from "mongoose";

const rentalItemSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    rentalPerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    rentalPerWeek: {
      type: Number,
      required: true,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length <= 4;
        },
        message: "You can upload at most 4 images per item.",
      },
    },
    totalQty: {
      type: Number,
      required: true,
      min: 0,
    },
    availableQty: {
      type: Number,
      min: 0,
      default: function () { return this.totalQty || 0 },
      validate: {
        validator: function (v) {
          return typeof this.totalQty === "number" ? v <= this.totalQty : true;
        },
        message: "Available quantity cannot exceed total quantity.",
      },
    },
  },
  { timestamps: true }
);

const RentalItem = mongoose.model("RentalItem", rentalItemSchema);

export default RentalItem;



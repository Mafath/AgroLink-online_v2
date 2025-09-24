import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    pricePerKg: {
      type: Number,
      required: true,
      min: 0,
    },
    capacityKg: {
      // how much is offered to sell
      type: Number,
      required: true,
      min: 0,
    },
    details: {
      type: String,
      default: "",
      trim: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length <= 4;
        },
        message: 'You can upload at most 4 images per listing.',
      },
    },
    harvestedAt: {
      type: Date,
      required: true,
    },
    expireAfterDays: {
      // number of days after harvestedAt when the listing expires
      type: Number,
      min: 1,
      default: null,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "SOLD", "REMOVED"],
      default: "AVAILABLE",
      index: true,
    },
  },
  { timestamps: true },
);

const Listing = mongoose.model("Listing", listingSchema);

export default Listing;



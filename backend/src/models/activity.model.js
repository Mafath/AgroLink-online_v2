import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["LISTING_ADDED", "ITEM_SOLD", "ITEM_EXPIRED", "LISTING_UPDATED", "LISTING_REMOVED"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Reference to the related entity
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      default: null,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    // Additional data for the activity
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for efficient queries
activitySchema.index({ farmer: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;

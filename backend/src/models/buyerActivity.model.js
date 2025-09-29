import mongoose from "mongoose";

const buyerActivitySchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["ORDER_PLACED", "ORDER_CANCELLED"],
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
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

buyerActivitySchema.index({ buyer: 1, createdAt: -1 });

const BuyerActivity = mongoose.model("BuyerActivity", buyerActivitySchema);

export default BuyerActivity;



import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deviceName: {
      type: String,
      required: true,
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet"],
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
    },
    userAgent: {
      type: String,
      required: true,
      trim: true,
    },
    success: {
      type: Boolean,
      required: true,
      default: true,
    },
    failureReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
loginHistorySchema.index({ user: 1, timestamp: -1 });
loginHistorySchema.index({ user: 1, success: 1 });

const LoginHistory = mongoose.model("LoginHistory", loginHistorySchema);

export default LoginHistory;

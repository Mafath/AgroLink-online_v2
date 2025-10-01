import mongoose from "mongoose";

const harvestReportSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    agronomist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    crop: {
      type: String,
      required: true,
      trim: true,
    },
    problem: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "replied", "resolved"],
      default: "pending",
      index: true,
    },
    images: [{
      type: String, // URLs to uploaded images
      required: false,
    }],
    reply: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    // Conversation thread
    conversation: [{
      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
      },
      sender: {
        type: String,
        enum: ['farmer', 'agronomist'],
        required: true,
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    location: {
      type: String,
      default: "",
      trim: true,
    },
    // Additional fields for better tracking
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
harvestReportSchema.index({ farmer: 1, createdAt: -1 });
harvestReportSchema.index({ agronomist: 1, status: 1 });
harvestReportSchema.index({ status: 1, priority: 1 });

const HarvestReport = mongoose.model("HarvestReport", harvestReportSchema);

export default HarvestReport;

// backend/models/harvest.model.js
import mongoose from "mongoose";

const STATUS = [
  "REQUEST_PENDING", // a farmer has submitted a schedule request
  "ASSIGNED",        // admin has assigned an agronomist
  "ACCEPTED",        // agronomist has accepted the assignment
  "SCHEDULED",       // agronomist accepted and ready to start
  "IN_PROGRESS",     // harvest activity started
  "COMPLETED",
  "CANCELLED",
];

// Sub-schema for tracking progress updates
const trackingSchema = new mongoose.Schema(
  {
    progress: { type: String, required: true, trim: true }, // e.g. "50% completed"
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who updated
    notes: { type: String, trim: true, default: "" }, // optional notes
    agronomistName: { type: String, trim: true, default: "" }, // agronomist name for rejections
  },
  { _id: false }
);

// Main Harvest schema (unified: request + tracking)
const harvestSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Crop name. For requests coming from UI, map cropType -> crop
    crop: { type: String, required: true, trim: true },

    // Request-specific optional fields
    farmerName: { type: String, trim: true, default: "" },
    expectedYield: { type: Number, min: 0 },
    harvestDate: { type: Date },
    notes: { type: String, trim: true, default: "" },

    // Admin scheduling
    expertId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    expertName: { type: String, trim: true, default: "" },
    adminAdvice: { type: String, trim: true, default: "" },
    scheduledDate: { type: Date }, // Date when agronomist accepted and harvest is scheduled

    // Personalized data from comprehensive harvest request form
    personalizedData: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Tracking progress
    tracking: { type: [trackingSchema], default: [] },

    // Current unified status (defaults chosen by controller per flow)
    status: { type: String, enum: STATUS, default: "IN_PROGRESS", index: true },
  },
  { timestamps: true }
);

// Method to update status
harvestSchema.methods.addStatus = function (status, userId) {
  this.status = status;
  this.tracking.push({
    progress: `Status changed to ${status}`,
    updatedBy: userId,
    updatedAt: new Date(),
  });
};

const Harvest = mongoose.model("Harvest", harvestSchema);

export { STATUS };
export default Harvest;

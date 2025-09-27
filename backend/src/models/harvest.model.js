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

    // Harvest Schedule (created by agronomist after accepting)
    harvestSchedule: {
      // Basic Info
      cropVariety: { type: String, trim: true, default: "" },
      farmLocation: {
        address: { type: String, trim: true, default: "" },
        coordinates: {
          lat: { type: Number },
          lng: { type: Number }
        },
        soilType: { type: String, trim: true, default: "" }
      },
      farmSize: {
        area: { type: Number, min: 0 },
        unit: { type: String, enum: ["acres", "hectares"], default: "acres" }
      },
      
      // Harvest Planning
      expectedHarvestDate: { type: Date },
      harvestDuration: { type: Number, min: 1, default: 1 }, // days
      harvestMethod: { type: String, enum: ["Manual", "Mechanical", "Hybrid"], default: "Manual" },
      expectedYield: {
        quantity: { type: Number, min: 0 },
        unit: { type: String, enum: ["kg", "tons", "lbs"], default: "kg" }
      },
      
      // Resources
      laborRequired: {
        workers: { type: Number, min: 0, default: 0 },
        skills: [{ type: String, trim: true }]
      },
      equipment: [{ type: String, trim: true }],
      transportation: [{ type: String, trim: true }],
      storage: {
        type: { type: String, trim: true, default: "" },
        capacity: { type: String, trim: true, default: "" },
        duration: { type: String, trim: true, default: "" }
      },
      
      // Timeline & Milestones
      timeline: [{
        phase: { type: String, trim: true, required: true },
        activities: [{ type: String, trim: true }],
        startDate: { type: Date },
        duration: { type: Number, min: 0 }, // days
        status: { type: String, enum: ["Pending", "In Progress", "Completed", "Delayed"], default: "Pending" },
        completedAt: { type: Date },
        notes: { type: String, trim: true, default: "" }
      }],
      
      // Quality Standards
      qualityStandards: {
        size: { type: String, trim: true, default: "" },
        color: { type: String, trim: true, default: "" },
        ripeness: { type: String, trim: true, default: "" },
        packaging: { type: String, trim: true, default: "" }
      },
      
      // Risk Management
      risks: [{
        type: { type: String, trim: true },
        description: { type: String, trim: true },
        mitigation: { type: String, trim: true }
      }],
      
      // Schedule Status
      scheduleStatus: { type: String, enum: ["Draft", "Published", "In Progress", "Completed", "Cancelled"], default: "Draft" },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    },

    // Tracking progress
    tracking: { type: [trackingSchema], default: [] },

    // Hide from agronomist dashboard (but keep visible to farmer)
    hiddenFromAgronomist: { type: Boolean, default: false },

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

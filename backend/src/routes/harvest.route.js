// backend/routes/harvest.routes.js
import express from "express";
import {
  createHarvest,
  getMyHarvests,
  addHarvestUpdate,
  updateHarvestStatus,
  createHarvestRequest,
  getMyHarvestRequests,
  adminScheduleHarvest,
  adminListPendingRequests,
  adminListAgronomists,
  listAssignedToAgronomist,
  getAgronomistAssignedHarvests,
  agronomistAcceptHarvest,
  agronomistAddNotes,
  agronomistPortalAcceptHarvest,
  agronomistPortalAddNotes,
} from "../controllers/harvest.controller.js";

import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// Start a new harvest tracking record (only FARMER can create)
router.post("/", requireAuth, requireRole("FARMER"), createHarvest);

// Get all harvest records of the logged-in farmer
router.get("/me", requireAuth, requireRole("FARMER"), getMyHarvests);

// Add tracking update for a specific harvest
router.post("/:id/update", requireAuth, requireRole("FARMER"), addHarvestUpdate);

// Update the status of a harvest (e.g., IN_PROGRESS, COMPLETED, CANCELLED)
router.post("/:id/status", requireAuth, requireRole("FARMER"), updateHarvestStatus);

// Debug endpoint to test authentication
router.get("/debug/auth", requireAuth, (req, res) => {
  res.json({ 
    message: "Authentication working", 
    user: { 
      id: req.user._id, 
      role: req.user.role, 
      email: req.user.email 
    } 
  });
});

// Additional endpoints for harvest requests
router.post("/request", requireAuth, requireRole("FARMER"), createHarvestRequest);
router.get("/requests", requireAuth, requireRole("FARMER"), getMyHarvestRequests);

// Admin endpoints
router.get("/admin/requests", requireAuth, requireRole("ADMIN"), adminListPendingRequests);
router.post("/:id/admin/schedule", requireAuth, requireRole("ADMIN"), adminScheduleHarvest);
router.get("/admin/agronomists", requireAuth, requireRole("ADMIN"), adminListAgronomists);
router.get("/agronomist/assigned", requireAuth, requireRole("AGRONOMIST"), listAssignedToAgronomist);
router.get("/agronomist/:agronomistId/assigned", getAgronomistAssignedHarvests);

// Agronomist endpoints (authenticated)
router.post("/:harvestId/agronomist/accept", requireAuth, requireRole("AGRONOMIST"), agronomistAcceptHarvest);
router.post("/:harvestId/agronomist/notes", requireAuth, requireRole("AGRONOMIST"), agronomistAddNotes);

// Agronomist portal endpoints (no auth required)
router.post("/:harvestId/portal/accept", agronomistPortalAcceptHarvest);
router.post("/:harvestId/portal/notes", agronomistPortalAddNotes);

export default router;

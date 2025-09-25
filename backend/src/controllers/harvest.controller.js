// backend/controllers/harvest.controller.js
import Harvest, { STATUS } from "../models/harvest.model.js";

// Create a new harvest tracking record
export const createHarvest = async (req, res) => {
  try {
    const { crop } = req.body;
    if (!crop) {
      return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Crop is required" } });
    }

    const harvest = new Harvest({
      farmer: req.user._id, // logged in farmer
      crop,
      tracking: [
        { progress: "Harvest tracking started", updatedBy: req.user._id },
      ],
    });

    await harvest.save();
    return res.status(201).json(harvest);
  } catch (error) {
    console.error("createHarvest error:", error);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to create harvest" } });
  }
};

// Get all my harvest tracking records
export const getMyHarvests = async (req, res) => {
  try {
    const harvests = await Harvest.find({ farmer: req.user._id }).sort({ createdAt: -1 });
    return res.json(harvests);
  } catch (error) {
    console.error("getMyHarvests error:", error);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to fetch harvests" } });
  }
};

// Add a new tracking update
export const addHarvestUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    if (!progress) {
      return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Progress is required" } });
    }

    const harvest = await Harvest.findOne({ _id: id, farmer: req.user._id });
    if (!harvest) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Harvest not found" } });
    }

    harvest.tracking.push({
      progress,
      updatedBy: req.user._id,
    });
    await harvest.save();

    return res.json(harvest);
  } catch (error) {
    console.error("addHarvestUpdate error:", error);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to add update" } });
  }
};

// Update harvest status (e.g., mark as completed)
export const updateHarvestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!STATUS.includes(status)) {
      return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Invalid status" } });
    }

    const harvest = await Harvest.findOne({ _id: id, farmer: req.user._id });
    if (!harvest) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Harvest not found" } });
    }

    harvest.addStatus(status, req.user._id);
    await harvest.save();

    return res.json(harvest);
  } catch (error) {
    console.error("updateHarvestStatus error:", error);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to update status" } });
  }
};

// Create a harvest request (from HarvestRequest.jsx form)
export const createHarvestRequest = async (req, res) => {
  try {
    console.log('createHarvestRequest called with:', {
      user: req.user ? { id: req.user._id, role: req.user.role, email: req.user.email } : 'No user',
      body: req.body,
      headers: req.headers.authorization ? 'Authorization header present' : 'No authorization header'
    });

    const { farmerName, cropType, expectedYield, harvestDate, notes, personalizedData } = req.body;

    if (!farmerName || !cropType || !expectedYield || !harvestDate) {
      return res.status(400).json({ error: { code: "BAD_REQUEST", message: "All required fields must be provided" } });
    }

    const request = new Harvest({
      farmer: req.user._id,
      farmerName,
      crop: cropType,
      expectedYield,
      harvestDate,
      notes: notes || "",
      personalizedData: personalizedData || {},
      status: "REQUEST_PENDING",
      tracking: [
        { progress: "Harvest schedule requested", updatedBy: req.user._id },
      ],
    });

    await request.save();
    return res.status(201).json({ message: "Harvest request created", request });
  } catch (error) {
    console.error("createHarvestRequest error:", error);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to create harvest request" } });
  }
};

// Get my pending/active harvest requests for schedule page
export const getMyHarvestRequests = async (req, res) => {
  try {
    const { status } = req.query; // optional filter - can be single status or comma-separated
    const query = { farmer: req.user._id };
    
    if (status) {
      // Handle multiple statuses separated by commas
      if (status.includes(',')) {
        const statuses = status.split(',').map(s => s.trim());
        query.status = { $in: statuses };
      } else {
        query.status = status;
      }
    }
    
    const requests = await Harvest.find(query).sort({ createdAt: -1 });
    return res.json({ requests });
  } catch (error) {
    console.error("getMyHarvestRequests error:", error);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to fetch harvest requests" } });
  }
};

// ADMIN: schedule a harvest request -> sets expert/advice and marks as SCHEDULED
export const adminScheduleHarvest = async (req, res) => {
  try {
    const { id } = req.params;
    const { expertId, expertName, adminAdvice, scheduledDate } = req.body;
    const harvest = await Harvest.findById(id);
    if (!harvest) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Harvest request not found' } });
    }

    harvest.expertId = expertId || harvest.expertId;
    harvest.expertName = expertName || harvest.expertName;
    harvest.adminAdvice = adminAdvice || harvest.adminAdvice;
    if (scheduledDate) {
      harvest.harvestDate = scheduledDate;
      harvest.scheduledDate = scheduledDate; // Set scheduled date for display
    }
    harvest.status = 'ASSIGNED'; // Agronomist needs to accept first
    harvest.tracking.push({ progress: 'Harvest assigned to agronomist', updatedBy: req.user._id });
    await harvest.save();
    return res.json({ message: 'Harvest scheduled', harvest });
  } catch (error) {
    console.error('adminScheduleHarvest error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to schedule harvest' } });
  }
};

// ADMIN: list pending requests to schedule
export const adminListPendingRequests = async (req, res) => {
  try {
    const requests = await Harvest.find({ status: 'REQUEST_PENDING' }).sort({ createdAt: -1 }).populate('farmer', 'fullName email');
    return res.json({ requests });
  } catch (error) {
    console.error('adminListPendingRequests error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch pending requests' } });
  }
};

// ADMIN: list agronomists, optionally filter by availability=AVAILABLE
export const adminListAgronomists = async (req, res) => {
  try {
    const { onlyAvailable } = req.query;
    const query = { role: 'AGRONOMIST' };
    if (String(onlyAvailable || '').toLowerCase() === 'true') query.availability = 'AVAILABLE';
    const User = (await import('../models/user.model.js')).default;
    const agronomists = await User.find(query).select('fullName email availability profilePic expertise');
    return res.json({ agronomists });
  } catch (error) {
    console.error('adminListAgronomists error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch agronomists' } });
  }
};

// AGRONOMIST: list harvests assigned to me
export const listAssignedToAgronomist = async (req, res) => {
  try {
    const items = await Harvest.find({ expertId: req.user._id }).sort({ createdAt: -1 });
    return res.json({ items });
  } catch (error) {
    console.error('listAssignedToAgronomist error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch assigned harvests' } });
  }
};

// Get harvests assigned to a specific agronomist by ID (for agronomist portal)
export const getAgronomistAssignedHarvests = async (req, res) => {
  try {
    const { agronomistId } = req.params;
    const harvests = await Harvest.find({ expertId: agronomistId }).sort({ createdAt: -1 });
    return res.json({ harvests });
  } catch (error) {
    console.error('getAgronomistAssignedHarvests error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch assigned harvests' } });
  }
};

// AGRONOMIST: Accept or reject a harvest assignment
export const agronomistAcceptHarvest = async (req, res) => {
  try {
    const { harvestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const { notes } = req.body; // optional notes from agronomist

    const harvest = await Harvest.findById(harvestId);
    if (!harvest) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Harvest not found' } });
    }

    if (harvest.expertId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not assigned to this harvest' } });
    }

    if (harvest.status !== 'ASSIGNED') {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Harvest is not in assigned status' } });
    }

    if (action === 'accept') {
      harvest.status = 'ACCEPTED';
      harvest.tracking.push({ 
        progress: 'Assignment accepted by agronomist', 
        notes: notes || 'Agronomist accepted the assignment',
        updatedBy: req.user._id 
      });
    } else if (action === 'reject') {
      harvest.status = 'REQUEST_PENDING';
      harvest.expertId = null;
      harvest.expertName = '';
      harvest.tracking.push({ 
        progress: 'Assignment rejected by agronomist', 
        notes: notes || 'Agronomist rejected the assignment',
        updatedBy: req.user._id 
      });
    } else {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid action. Use accept or reject' } });
    }

    await harvest.save();
    return res.json({ 
      message: `Assignment ${action}ed successfully`, 
      harvest,
      status: harvest.status 
    });
  } catch (error) {
    console.error('agronomistAcceptHarvest error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to process assignment' } });
  }
};

// AGRONOMIST: Add notes to a harvest (no progress updates)
export const agronomistAddNotes = async (req, res) => {
  try {
    const { harvestId } = req.params;
    const { notes } = req.body;

    const harvest = await Harvest.findById(harvestId);
    if (!harvest) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Harvest not found' } });
    }

    if (harvest.expertId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not assigned to this harvest' } });
    }

    if (!['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'].includes(harvest.status)) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Cannot add notes to this harvest status' } });
    }

    harvest.tracking.push({ 
      progress: 'Agronomist added notes', 
      notes: notes,
      updatedBy: req.user._id 
    });

    await harvest.save();
    return res.json({ 
      message: 'Notes added successfully', 
      harvest 
    });
  } catch (error) {
    console.error('agronomistAddNotes error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to add notes' } });
  }
};

// AGRONOMIST PORTAL: Accept or reject harvest assignment (no auth required)
export const agronomistPortalAcceptHarvest = async (req, res) => {
  try {
    const { harvestId } = req.params;
    const { action, agronomistId, notes } = req.body; // 'accept' or 'reject'

    const harvest = await Harvest.findById(harvestId);
    if (!harvest) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Harvest not found' } });
    }

    if (harvest.expertId.toString() !== agronomistId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not assigned to this harvest' } });
    }

    if (harvest.status !== 'ASSIGNED') {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Harvest is not in assigned status' } });
    }

    if (action === 'accept') {
      harvest.status = 'ACCEPTED';
      // Set scheduled date to the harvest date when agronomist accepts
      if (harvest.harvestDate && !harvest.scheduledDate) {
        harvest.scheduledDate = harvest.harvestDate;
      }
      harvest.tracking.push({ 
        progress: 'Assignment accepted by agronomist', 
        notes: notes || 'Agronomist accepted the assignment',
        updatedBy: agronomistId 
      });
    } else if (action === 'reject') {
      harvest.status = 'REQUEST_PENDING';
      harvest.expertId = null;
      harvest.expertName = '';
      harvest.tracking.push({ 
        progress: 'Assignment rejected by agronomist', 
        notes: notes || 'Agronomist rejected the assignment',
        updatedBy: agronomistId 
      });
    } else {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid action. Use accept or reject' } });
    }

    await harvest.save();
    return res.json({ 
      message: `Assignment ${action}ed successfully`, 
      harvest,
      status: harvest.status 
    });
  } catch (error) {
    console.error('agronomistPortalAcceptHarvest error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to process assignment' } });
  }
};

// AGRONOMIST PORTAL: Add notes to harvest (no auth required)
export const agronomistPortalAddNotes = async (req, res) => {
  try {
    const { harvestId } = req.params;
    const { notes, agronomistId } = req.body;

    const harvest = await Harvest.findById(harvestId);
    if (!harvest) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Harvest not found' } });
    }

    if (harvest.expertId.toString() !== agronomistId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not assigned to this harvest' } });
    }

    if (!['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'].includes(harvest.status)) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Cannot add notes to this harvest status' } });
    }

    harvest.tracking.push({ 
      progress: 'Agronomist added notes', 
      notes: notes,
      updatedBy: agronomistId 
    });

    await harvest.save();
    return res.json({ 
      message: 'Notes added successfully', 
      harvest 
    });
  } catch (error) {
    console.error('agronomistPortalAddNotes error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to add notes' } });
  }
};
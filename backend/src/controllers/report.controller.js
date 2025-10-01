import Report from '../models/report.model.js';
import Harvest from '../models/harvest.model.js';
import { uploadToCloudinary } from '../lib/cloudinary.js';

// Create a new report with auto-assignment to agronomist
export const createReport = async (req, res) => {
  try {
    const { problem, images, crop, priority = 'medium' } = req.body;
    const farmerId = req.user._id;

    if (!problem || !images || !crop) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Problem description, images, and crop are required' } 
      });
    }

    // Try to find assigned agronomist from active harvest
    let assignedAgronomist = null;
    let linkedHarvest = null;
    
    const activeHarvest = await Harvest.findOne({
      farmer: farmerId,
      status: { $in: ['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'] }
    }).populate('expertId', 'fullName email');

    if (activeHarvest?.expertId) {
      assignedAgronomist = activeHarvest.expertId._id;
      linkedHarvest = activeHarvest._id;
    }

    // Upload images to Cloudinary
    const uploadedImages = [];
    for (const image of images) {
      try {
        const result = await uploadToCloudinary(image, 'reports');
        uploadedImages.push(result.secure_url);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        return res.status(500).json({ 
          error: { code: 'UPLOAD_ERROR', message: 'Failed to upload images' } 
        });
      }
    }

    const report = new Report({
      farmer: farmerId,
      agronomist: assignedAgronomist,
      harvest: linkedHarvest,
      crop,
      problem,
      images: uploadedImages,
      priority,
      status: assignedAgronomist ? 'assigned' : 'pending'
    });

    await report.save();
    
    // Populate the response with agronomist info
    await report.populate([
      { path: 'farmer', select: 'fullName email' },
      { path: 'agronomist', select: 'fullName email' },
      { path: 'harvest', select: 'crop status' }
    ]);

    return res.status(201).json({
      message: 'Report created successfully',
      report
    });
  } catch (error) {
    console.error('createReport error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to create report' } 
    });
  }
};

// Get reports for a farmer
export const getFarmerReports = async (req, res) => {
  try {
    console.log('getFarmerReports called');
    // For testing without auth, return empty array
    if (!req.user) {
      console.log('No user found, returning empty reports');
      return res.json({ reports: [] });
    }
    
    const farmerId = req.user._id;
    
    const reports = await Report.find({ farmer: farmerId })
      .populate('agronomist', 'fullName email expertise')
      .sort({ createdAt: -1 });

    console.log('Found reports:', reports.length);
    return res.json({ reports });
  } catch (error) {
    console.error('getFarmerReports error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch reports' } 
    });
  }
};

// Get reports assigned to an agronomist
export const getAgronomistReports = async (req, res) => {
  try {
    const agronomistId = req.user._id;
    const { status } = req.query;
    
    const query = { agronomist: agronomistId };
    if (status) {
      query.status = status;
    }
    
    const reports = await Report.find(query)
      .populate('farmer', 'fullName email')
      .populate('harvest', 'crop status')
      .sort({ priority: -1, createdAt: -1 }); // Sort by priority first, then date

    return res.json({ reports });
  } catch (error) {
    console.error('getAgronomistReports error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch reports' } 
    });
  }
};

// Reply to a report (agronomist only)
export const replyToReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { reply } = req.body;
    const agronomistId = req.user._id;

    if (!reply) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Reply is required' } 
      });
    }

    const report = await Report.findOne({ 
      _id: reportId, 
      agronomist: agronomistId 
    });

    if (!report) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'Report not found or not assigned to you' } 
      });
    }

    report.reply = reply;
    report.status = 'replied';
    report.replyDate = new Date();

    await report.save();
    
    // Populate the response
    await report.populate([
      { path: 'farmer', select: 'fullName email' },
      { path: 'agronomist', select: 'fullName email' },
      { path: 'harvest', select: 'crop status' }
    ]);

    return res.json({
      message: 'Reply sent successfully',
      report
    });
  } catch (error) {
    console.error('replyToReport error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to send reply' } 
    });
  }
};

// Mark report as resolved
export const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const agronomistId = req.user._id;

    const report = await Report.findOne({ 
      _id: reportId, 
      agronomist: agronomistId 
    });

    if (!report) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'Report not found or not assigned to you' } 
      });
    }

    report.status = 'resolved';
    await report.save();

    return res.json({
      message: 'Report marked as resolved',
      report
    });
  } catch (error) {
    console.error('resolveReport error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to resolve report' } 
    });
  }
};

// Get all agronomists for farmer to choose from
export const getAllAgronomists = async (req, res) => {
  try {
    console.log('getAllAgronomists called');
    const User = (await import('../models/user.model.js')).default;
    const agronomists = await User.find({ 
      role: 'AGRONOMIST'
    }).select('fullName email expertise profilePic');

    console.log('Found agronomists:', agronomists.length);
    return res.json({ agronomists });
  } catch (error) {
    console.error('getAllAgronomists error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch agronomists' } 
    });
  }
};

// Get report statistics for dashboard
export const getReportStats = async (req, res) => {
  try {
    const farmerId = req.user._id;
    
    const totalReports = await Report.countDocuments({ farmer: farmerId });
    const pendingReports = await Report.countDocuments({ 
      farmer: farmerId, 
      status: { $in: ['pending', 'assigned'] } 
    });
    const repliedReports = await Report.countDocuments({ 
      farmer: farmerId, 
      status: 'replied' 
    });
    const resolvedReports = await Report.countDocuments({ 
      farmer: farmerId, 
      status: 'resolved' 
    });

    return res.json({
      totalReports,
      pendingReports,
      repliedReports,
      resolvedReports
    });
  } catch (error) {
    console.error('getReportStats error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch report statistics' } 
    });
  }
};

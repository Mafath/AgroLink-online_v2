import HarvestReport from '../models/harvestReport.model.js';
import User from '../models/user.model.js';
import cloudinary from '../lib/cloudinary.js';

// Submit a new harvest report
export const submitReport = async (req, res) => {
  try {
    const { crop, problem, priority, agronomistId, images, location } = req.body;
    const farmerId = req.user._id;

    // Validate required fields
    if (!crop || !problem || !agronomistId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Crop, problem, and agronomist are required' }
      });
    }

    // Verify agronomist exists and is available
    const agronomist = await User.findOne({
      _id: agronomistId,
      role: 'AGRONOMIST',
      isEmailVerified: true,
      status: { $ne: 'SUSPENDED' }
    });

    if (!agronomist) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Agronomist not found or not available' }
      });
    }

    // Process images if provided
    let imageUrls = [];
    if (images && images.length > 0) {
      const haveCloudinary = Boolean(
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET
      );

      if (haveCloudinary) {
        // Upload images to Cloudinary
        for (const image of images) {
          try {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrls.push(uploadResponse.secure_url);
          } catch (uploadError) {
            console.error('Failed to upload image:', uploadError);
            // Continue with other images even if one fails
          }
        }
      } else {
        // Fallback: store base64 images directly (not recommended for production)
        imageUrls = images;
      }
    }

    // Create the report
    const report = new HarvestReport({
      farmer: farmerId,
      agronomist: agronomistId,
      crop: crop.trim(),
      problem: problem.trim(),
      priority: priority || 'medium',
      images: imageUrls,
      location: location ? location.trim() : '',
      status: 'assigned', // Automatically assigned to the selected agronomist
      assignedAt: new Date()
    });

    await report.save();

    // Populate the response with user details
    await report.populate([
      { path: 'farmer', select: 'fullName email' },
      { path: 'agronomist', select: 'fullName expertise' }
    ]);

    return res.status(201).json({
      message: 'Report submitted successfully',
      data: report
    });

  } catch (error) {
    console.error('Error in submitReport:', error.message);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
};

// Get reports for a farmer
export const getFarmerReports = async (req, res) => {
  try {
    const farmerId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { farmer: farmerId };
    if (status) {
      filter.status = status;
    }

    const reports = await HarvestReport.find(filter)
      .populate('agronomist', 'fullName expertise profilePic')
      .populate('conversation.senderId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await HarvestReport.countDocuments(filter);

    return res.status(200).json({
      data: reports,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error in getFarmerReports:', error.message);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
};

// Get reports assigned to an agronomist
export const getAgronomistReports = async (req, res) => {
  try {
    const agronomistId = req.user._id;
    const { status, priority, page = 1, limit = 10 } = req.query;

    const filter = { agronomist: agronomistId };
    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }

    const reports = await HarvestReport.find(filter)
      .populate('farmer', 'fullName email phone address')
      .populate('conversation.senderId', 'fullName')
      .sort({ priority: -1, createdAt: -1 }) // Sort by priority first, then by date
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await HarvestReport.countDocuments(filter);

    return res.status(200).json({
      data: reports,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error in getAgronomistReports:', error.message);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
};

// Agronomist replies to a report
export const replyToReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { reply } = req.body;
    const agronomistId = req.user._id;

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Reply is required' }
      });
    }

    // Find the report and verify the agronomist is assigned to it
    const report = await HarvestReport.findOne({
      _id: reportId,
      agronomist: agronomistId
    });

    if (!report) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Report not found or not assigned to you' }
      });
    }

    // Update the report with the reply
    report.reply = reply.trim();
    report.status = 'replied';
    report.repliedAt = new Date();

    // Add to conversation thread
    report.conversation.push({
      message: reply.trim(),
      sender: 'agronomist',
      senderId: agronomistId
    });

    await report.save();

    // Populate the response
    await report.populate([
      { path: 'farmer', select: 'fullName email' },
      { path: 'agronomist', select: 'fullName expertise' },
      { path: 'conversation.senderId', select: 'fullName' }
    ]);

    return res.status(200).json({
      message: 'Reply submitted successfully',
      data: report
    });

  } catch (error) {
    console.error('Error in replyToReport:', error.message);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
};

// Farmer replies to agronomist's reply
export const farmerReplyToReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { message } = req.body;
    const farmerId = req.user._id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Message is required' }
      });
    }

    // Find the report and verify the farmer owns it
    const report = await HarvestReport.findOne({
      _id: reportId,
      farmer: farmerId
    });

    if (!report) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Report not found or you do not have access to it' }
      });
    }

    // Add farmer's message to conversation thread
    report.conversation.push({
      message: message.trim(),
      sender: 'farmer',
      senderId: farmerId
    });

    // Update status to indicate there's a new message from farmer
    if (report.status === 'replied') {
      report.status = 'assigned'; // Reset to assigned to indicate agronomist needs to respond
    }

    await report.save();

    // Populate the response
    await report.populate([
      { path: 'farmer', select: 'fullName email' },
      { path: 'agronomist', select: 'fullName expertise' },
      { path: 'conversation.senderId', select: 'fullName' }
    ]);

    return res.status(200).json({
      message: 'Message sent successfully',
      data: report
    });

  } catch (error) {
    console.error('Error in farmerReplyToReport:', error.message);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
};

// Mark report as resolved
export const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const agronomistId = req.user._id;

    const report = await HarvestReport.findOne({
      _id: reportId,
      agronomist: agronomistId
    });

    if (!report) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Report not found or not assigned to you' }
      });
    }

    report.status = 'resolved';
    report.resolvedAt = new Date();

    await report.save();

    await report.populate([
      { path: 'farmer', select: 'fullName email' },
      { path: 'agronomist', select: 'fullName expertise' }
    ]);

    return res.status(200).json({
      message: 'Report marked as resolved',
      data: report
    });

  } catch (error) {
    console.error('Error in resolveReport:', error.message);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
};

// Get a single report by ID
export const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const report = await HarvestReport.findById(reportId)
      .populate('farmer', 'fullName email phone address')
      .populate('agronomist', 'fullName expertise profilePic')
      .populate('conversation.senderId', 'fullName');

    if (!report) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Report not found' }
      });
    }

    // Check if user has access to this report
    const hasAccess = 
      report.farmer._id.toString() === userId.toString() ||
      report.agronomist._id.toString() === userId.toString() ||
      userRole === 'ADMIN';

    if (!hasAccess) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    return res.status(200).json({ data: report });

  } catch (error) {
    console.error('Error in getReportById:', error.message);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
};

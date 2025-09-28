import DeliveryReview from '../models/deliveryReview.model.js';
import Delivery from '../models/delivery.model.js';

// Create a new delivery review
export const createDeliveryReview = async (req, res) => {
  try {
    const { deliveryId, rating, comment } = req.body;
    
    if (!deliveryId || !rating || !comment) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Missing required fields' } 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Rating must be between 1 and 5' } 
      });
    }

    // Check if delivery exists and belongs to the user
    const delivery = await Delivery.findById(deliveryId)
      .populate('order')
      .populate('requester');
    
    if (!delivery) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'Delivery not found' } 
      });
    }

    if (delivery.requester._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: { code: 'FORBIDDEN', message: 'You can only review your own deliveries' } 
      });
    }

    if (delivery.status !== 'COMPLETED') {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Can only review completed deliveries' } 
      });
    }

    // Check if review already exists
    const existingReview = await DeliveryReview.findOne({ 
      delivery: deliveryId, 
      reviewer: req.user._id 
    });

    if (existingReview) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'You have already reviewed this delivery' } 
      });
    }

    const review = new DeliveryReview({
      delivery: deliveryId,
      reviewer: req.user._id,
      reviewerRole: req.user.role,
      rating,
      comment
    });

    await review.save();
    
    // Link review to delivery
    delivery.review = review._id;
    await delivery.save();
    
    // Populate the review with delivery and reviewer details
    const populatedReview = await DeliveryReview.findById(review._id)
      .populate('delivery', 'order requester status')
      .populate('reviewer', 'fullName email role');

    return res.status(201).json(populatedReview);
  } catch (error) {
    console.error('createDeliveryReview error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to create review' } 
    });
  }
};

// Get user's own delivery reviews
export const getMyDeliveryReviews = async (req, res) => {
  try {
    const reviews = await DeliveryReview.find({ 
      reviewer: req.user._id,
      isVisible: true  // Only return visible reviews
    })
      .populate({
        path: 'delivery',
        select: 'order requester status',
        populate: {
          path: 'order',
          select: 'orderNumber total status'
        }
      })
      .populate('reviewer', 'fullName email role')
      .populate('adminReply.repliedBy', 'fullName email')
      .sort({ createdAt: -1 });

    // Filter out admin replies that are not visible
    const filteredReviews = reviews.map(review => {
      if (review.adminReply && review.adminReply.reply && !review.adminReply.isVisible) {
        // Hide the admin reply content but keep the structure
        return {
          ...review.toObject(),
          adminReply: {
            ...review.adminReply,
            reply: '', // Hide the reply content
            isVisible: false
          }
        };
      }
      return review;
    });

    return res.json(filteredReviews);
  } catch (error) {
    console.error('getMyDeliveryReviews error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch reviews' } 
    });
  }
};

// Get all delivery reviews (admin only) - includes hidden reviews
export const getAllDeliveryReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating, search, visibility } = req.query;
    const filter = {};

    if (rating) {
      filter.rating = parseInt(rating);
    }

    if (visibility !== undefined) {
      filter.isVisible = visibility === 'true';
    }

    if (search) {
      filter.$or = [
        { comment: { $regex: search, $options: 'i' } },
        { 'adminReply.reply': { $regex: search, $options: 'i' } }
      ];
    }

    const reviews = await DeliveryReview.find(filter)
      .populate({
        path: 'delivery',
        select: 'order requester status',
        populate: {
          path: 'order',
          select: 'orderNumber total status'
        }
      })
      .populate('reviewer', 'fullName email role')
      .populate('adminReply.repliedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DeliveryReview.countDocuments(filter);

    return res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('getAllDeliveryReviews error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch reviews' } 
    });
  }
};

// Admin reply to a review
export const replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Reply is required' } 
      });
    }

    const review = await DeliveryReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'Review not found' } 
      });
    }

    review.adminReply = {
      reply: reply.trim(),
      repliedBy: req.user._id,
      repliedAt: new Date(),
      isVisible: true  // Admin replies are visible by default
    };

    await review.save();

    const populatedReview = await DeliveryReview.findById(reviewId)
      .populate('delivery', 'order requester status')
      .populate('reviewer', 'fullName email role')
      .populate('adminReply.repliedBy', 'fullName email');

    return res.json(populatedReview);
  } catch (error) {
    console.error('replyToReview error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to reply to review' } 
    });
  }
};

// Update admin reply
export const updateAdminReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Reply is required' } 
      });
    }

    const review = await DeliveryReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'Review not found' } 
      });
    }

    review.adminReply.reply = reply.trim();
    review.adminReply.repliedAt = new Date();

    await review.save();

    const populatedReview = await DeliveryReview.findById(reviewId)
      .populate('delivery', 'order requester status')
      .populate('reviewer', 'fullName email role')
      .populate('adminReply.repliedBy', 'fullName email');

    return res.json(populatedReview);
  } catch (error) {
    console.error('updateAdminReply error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to update reply' } 
    });
  }
};

// Delete admin reply
export const deleteAdminReply = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await DeliveryReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'Review not found' } 
      });
    }

    review.adminReply = {
      reply: '',
      repliedBy: null,
      repliedAt: null
    };

    await review.save();

    const populatedReview = await DeliveryReview.findById(reviewId)
      .populate('delivery', 'order requester status')
      .populate('reviewer', 'fullName email role')
      .populate('adminReply.repliedBy', 'fullName email');

    return res.json(populatedReview);
  } catch (error) {
    console.error('deleteAdminReply error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to delete reply' } 
    });
  }
};

// Toggle review visibility (admin only)
export const toggleReviewVisibility = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await DeliveryReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'Review not found' } 
      });
    }

    review.isVisible = !review.isVisible;
    await review.save();

    const populatedReview = await DeliveryReview.findById(reviewId)
      .populate('delivery', 'order requester status')
      .populate('reviewer', 'fullName email role')
      .populate('adminReply.repliedBy', 'fullName email');

    return res.json(populatedReview);
  } catch (error) {
    console.error('toggleReviewVisibility error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to toggle visibility' } 
    });
  }
};

// Toggle admin reply visibility (admin only)
export const toggleAdminReplyVisibility = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await DeliveryReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'Review not found' } 
      });
    }

    if (!review.adminReply || !review.adminReply.reply) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'No admin reply found' } 
      });
    }

    review.adminReply.isVisible = !review.adminReply.isVisible;
    await review.save();

    const populatedReview = await DeliveryReview.findById(reviewId)
      .populate('delivery', 'order requester status')
      .populate('reviewer', 'fullName email role')
      .populate('adminReply.repliedBy', 'fullName email');

    return res.json(populatedReview);
  } catch (error) {
    console.error('toggleAdminReplyVisibility error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to toggle admin reply visibility' } 
    });
  }
};

// Get review statistics (admin only)
export const getReviewStatistics = async (req, res) => {
  try {
    const stats = await DeliveryReview.aggregate([
      {
        $match: { isVisible: true }  // Only count visible reviews
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      },
      {
        $project: {
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 2] },
          ratingDistribution: {
            $reduce: {
              input: [1, 2, 3, 4, 5],
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [{
                        k: { $toString: '$$this' },
                        v: {
                          $size: {
                            $filter: {
                              input: '$ratingDistribution',
                              cond: { $eq: ['$$item', '$$this'] }
                            }
                          }
                        }
                      }]
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    ]);

    return res.json(stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    });
  } catch (error) {
    console.error('getReviewStatistics error:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch statistics' } 
    });
  }
};

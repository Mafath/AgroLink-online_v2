import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Package, Calendar, User, Truck, Edit2, Save, X, Trash2 } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

const MyDeliveryReviews = () => {
  const { authUser } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const fetchMyReviews = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/delivery-reviews/my');
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Failed to load your reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditRating(0);
    setEditComment('');
  };

  const handleUpdateReview = async (reviewId) => {
    if (editRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!editComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    try {
      setIsUpdating(true);
      await axiosInstance.put(`/delivery-reviews/my/${reviewId}`, {
        rating: editRating,
        comment: editComment.trim()
      });
      
      toast.success('Review updated successfully!');
      setEditingReview(null);
      setEditRating(0);
      setEditComment('');
      fetchMyReviews();
    } catch (error) {
      console.error('Failed to update review:', error);
      const message = error?.response?.data?.error?.message || 'Failed to update review';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const confirmed = window.confirm('Are you sure you want to delete this review? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await axiosInstance.delete(`/delivery-reviews/my/${reviewId}`);
      toast.success('Review deleted successfully!');
      fetchMyReviews();
    } catch (error) {
      console.error('Failed to delete review:', error);
      const message = error?.response?.data?.error?.message || 'Failed to delete review';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const renderEditableStars = (rating, onRatingChange) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isFilled = starValue <= rating;
      
      return (
        <button
          key={i}
          type="button"
          className="focus:outline-none"
          onClick={() => onRatingChange(starValue)}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              isFilled ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        </button>
      );
    });
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Delivery Reviews</h1>
          <p className="text-gray-600">
            View your delivery reviews and admin responses
          </p>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
            <p className="text-gray-600">
              You haven't reviewed any deliveries yet. Reviews will appear here once you complete a delivery and submit a review.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white rounded-lg shadow-sm border p-6">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Order #{review.delivery?.order?.orderNumber || 'N/A'}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{review.reviewerRole}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(review.delivery?.status)}`}>
                      {review.delivery?.status}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {editingReview === review._id ? (
                        renderEditableStars(editRating, setEditRating)
                      ) : (
                        renderStars(review.rating)
                      )}
                    </div>
                    <span className={`text-sm font-medium ${getRatingColor(editingReview === review._id ? editRating : review.rating)}`}>
                      {editingReview === review._id ? editRating : review.rating} out of 5 stars
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  {editingReview !== review._id && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditReview(review)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        title="Edit review"
                      >
                        <Edit2 className="w-4 h-4 mr-1.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        disabled={isDeleting}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete review"
                      >
                        {isDeleting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1.5"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Review Comment */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Your Review:</h4>
                  {editingReview === review._id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Share your thoughts about the delivery service..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={4}
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500">
                        {editComment.length}/1000 characters
                      </p>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleUpdateReview(review._id)}
                          disabled={isUpdating}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {isUpdating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                      {review.comment}
                    </p>
                  )}
                </div>

                {/* Admin Reply */}
                {review.adminReply?.reply && review.adminReply.isVisible && (
                  <div className="border-t pt-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900">Admin Response</h4>
                          <span className="text-xs text-gray-500">
                            {new Date(review.adminReply.repliedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 bg-blue-50 rounded-lg p-3">
                          {review.adminReply.reply}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Reply Hidden Message */}
                {review.adminReply?.reply && !review.adminReply.isVisible && (
                  <div className="border-t pt-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-500">Admin Response</h4>
                          <span className="text-xs text-gray-400">
                            {new Date(review.adminReply.repliedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-400 bg-gray-50 rounded-lg p-3 italic">
                          This admin response is currently not visible to you.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Details */}
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Delivery Status:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <Truck className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{review.delivery?.status}</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Review Date:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {reviews.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Review Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{reviews.length}</div>
                <div className="text-sm text-gray-600">Total Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {reviews.length > 0 
                    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                    : '0.0'
                  }
                </div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {reviews.filter(review => review.adminReply?.reply).length}
                </div>
                <div className="text-sm text-gray-600">Admin Replies</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDeliveryReviews;

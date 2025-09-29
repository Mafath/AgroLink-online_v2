import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Package, Calendar, User, Truck } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

const MyDeliveryReviews = () => {
  const { authUser } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

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
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex">
                    {renderStars(review.rating)}
                  </div>
                  <span className={`text-sm font-medium ${getRatingColor(review.rating)}`}>
                    {review.rating} out of 5 stars
                  </span>
                </div>

                {/* Review Comment */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Your Review:</h4>
                  <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                    {review.comment}
                  </p>
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

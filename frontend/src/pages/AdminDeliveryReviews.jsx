import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Search, Filter, Eye, EyeOff, Reply, Edit, Trash2, BarChart3 } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import AdminSidebar from '../components/AdminSidebar';

const AdminDeliveryReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchStatistics();
  }, [currentPage, ratingFilter, searchTerm, visibilityFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(ratingFilter && { rating: ratingFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(visibilityFilter && { visibility: visibilityFilter })
      });

      const response = await axiosInstance.get(`/delivery-reviews/admin?${params}`);
      setReviews(response.data.reviews);
      setTotalPages(response.data.totalPages);
      setTotalReviews(response.data.total);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axiosInstance.get('/delivery-reviews/admin/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      setIsReplying(true);
      await axiosInstance.post(`/delivery-reviews/admin/${reviewId}/reply`, {
        reply: replyText.trim()
      });
      toast.success('Reply sent successfully');
      setReplyText('');
      setSelectedReview(null);
      fetchReviews();
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  const handleUpdateReply = async (reviewId) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      setIsReplying(true);
      await axiosInstance.put(`/delivery-reviews/admin/${reviewId}/reply`, {
        reply: replyText.trim()
      });
      toast.success('Reply updated successfully');
      setReplyText('');
      setSelectedReview(null);
      fetchReviews();
    } catch (error) {
      console.error('Failed to update reply:', error);
      toast.error('Failed to update reply');
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteReply = async (reviewId) => {
    const confirmed = window.confirm('Are you sure you want to delete this reply?');
    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/delivery-reviews/admin/${reviewId}/reply`);
      toast.success('Reply deleted successfully');
      fetchReviews();
    } catch (error) {
      console.error('Failed to delete reply:', error);
      toast.error('Failed to delete reply');
    }
  };

  const handleToggleAdminReplyVisibility = async (reviewId) => {
    try {
      await axiosInstance.patch(`/delivery-reviews/admin/${reviewId}/reply-visibility`);
      toast.success('Admin reply visibility updated successfully');
      fetchReviews();
    } catch (error) {
      console.error('Failed to toggle admin reply visibility:', error);
      toast.error('Failed to update admin reply visibility');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
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

  if (loading && reviews.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none mx-0 w-full px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold">Delivery Reviews Management</h1>
          <div className="flex items-center space-x-2">
            <span className="px-4 py-2 rounded-lg font-medium bg-primary-600 text-white">
              Total Reviews: {totalReviews}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[240px,1fr] gap-6">
          {/* Sidebar */}
          <AdminSidebar activePage="delivery-reviews" />

          {/* Main Content */}
          <div className="space-y-6">
            {/* Statistics Cards */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center">
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Total Reviews</p>
                      <p className="text-2xl font-semibold text-gray-900">{statistics.totalReviews}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center">
                    <Star className="w-8 h-8 text-yellow-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Average Rating</p>
                      <p className="text-2xl font-semibold text-gray-900">{statistics.averageRating}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold">5</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">5 Star Reviews</p>
                      <p className="text-2xl font-semibold text-gray-900">{statistics.ratingDistribution[5] || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold">1</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">1 Star Reviews</p>
                      <p className="text-2xl font-semibold text-gray-900">{statistics.ratingDistribution[1] || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search reviews..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                  <select
                    value={visibilityFilter}
                    onChange={(e) => setVisibilityFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">All Reviews</option>
                    <option value="true">Visible Only</option>
                    <option value="false">Hidden Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reviews Table */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Review
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reviews.map((review) => (
                      <tr key={review._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-900 line-clamp-2">
                              {review.comment}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {review.reviewer?.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {review.reviewer?.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              {review.reviewerRole}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Order #{review.delivery?.order?.orderNumber || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {review.delivery?.status}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Driver: {review.delivery?.driver?.fullName || 'Not Assigned'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex">
                              {renderStars(review.rating)}
                            </div>
                            <span className={`ml-2 text-sm font-medium ${getRatingColor(review.rating)}`}>
                              {review.rating}/5
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            {review.adminReply?.reply && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                review.adminReply.isVisible 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                Reply: {review.adminReply.isVisible ? 'Visible' : 'Hidden'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedReview(review);
                                setReplyText(review.adminReply?.reply || '');
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Reply to review"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            {review.adminReply?.reply && (
                              <button
                                onClick={() => handleToggleAdminReplyVisibility(review._id)}
                                className={review.adminReply.isVisible ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                                title={review.adminReply.isVisible ? 'Hide admin reply from users' : 'Show admin reply to users'}
                              >
                                {review.adminReply.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedReview.adminReply?.reply ? 'Update Reply' : 'Reply to Review'}
              </h3>
              
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {renderStars(selectedReview.rating)}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${getRatingColor(selectedReview.rating)}`}>
                    {selectedReview.rating}/5
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Customer:</strong> {selectedReview.reviewer?.fullName}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Review:</strong> {selectedReview.comment}
                </p>
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Enter your reply..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
              />

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedReview(null);
                    setReplyText('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                {selectedReview.adminReply?.reply && (
                  <button
                    onClick={() => handleDeleteReply(selectedReview._id)}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Delete
                  </button>
                )}
                <button
                  onClick={() => 
                    selectedReview.adminReply?.reply 
                      ? handleUpdateReply(selectedReview._id)
                      : handleReply(selectedReview._id)
                  }
                  disabled={isReplying}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {isReplying ? 'Sending...' : (selectedReview.adminReply?.reply ? 'Update Reply' : 'Send Reply')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeliveryReviews;

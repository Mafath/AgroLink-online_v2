import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Truck, Package, MapPin, Clock, CheckCircle, AlertCircle, Mail, Star, MessageSquare, X, RefreshCw } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import DeliveryReviewForm from '../components/DeliveryReviewForm';

const DeliveryTrackingPage = () => {
  const { authUser } = useAuthStore();
  const [deliveries, setDeliveries] = useState([]);
  const { orderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [deliveryMessages, setDeliveryMessages] = useState({});

  useEffect(() => {
    fetchDeliveries();
  }, []);

  // Refresh messages when deliveries change
  useEffect(() => {
    if (deliveries.length > 0) {
      const cancelledDeliveries = deliveries.filter(delivery => delivery.status === 'CANCELLED');
      cancelledDeliveries.forEach(delivery => {
        fetchDeliveryMessages(delivery._id);
      });
    }
  }, [deliveries]);

  const fetchDeliveries = async () => {
    try {
      if (orderId) {
        const response = await axiosInstance.get(`/deliveries/order/${orderId}`);
        setDeliveries(Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []));
      } else {
        const response = await axiosInstance.get('/deliveries/me');
        setDeliveries(response.data);
      }
      
      // Fetch messages for cancelled deliveries
      const cancelledDeliveries = deliveries.filter(delivery => delivery.status === 'CANCELLED');
      for (const delivery of cancelledDeliveries) {
        await fetchDeliveryMessages(delivery._id);
      }
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryMessages = async (deliveryId) => {
    try {
      // Fetch all messages for this delivery (customer messages, manager replies, system messages)
      const response = await axiosInstance.get(`/deliveries/${deliveryId}/messages`);
      setDeliveryMessages(prev => ({
        ...prev,
        [deliveryId]: response.data
      }));
    } catch (error) {
      console.error('Failed to fetch delivery messages:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'ASSIGNED':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'PREPARING':
        return <Package className="w-5 h-5 text-orange-500" />;
      case 'COLLECTED':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'IN_TRANSIT':
        return <Truck className="w-5 h-5 text-indigo-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'CANCELLED':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Assignment';
      case 'ASSIGNED':
        return 'Driver Assigned';
      case 'PREPARING':
        return 'Preparing for Collection';
      case 'COLLECTED':
        return 'Collected from Warehouse';
      case 'IN_TRANSIT':
        return 'On the Way';
      case 'COMPLETED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'PREPARING':
        return 'bg-orange-100 text-orange-800';
      case 'COLLECTED':
        return 'bg-purple-100 text-purple-800';
      case 'IN_TRANSIT':
        return 'bg-indigo-100 text-indigo-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (status) => {
    switch (status) {
      case 'PENDING':
        return 10;
      case 'ASSIGNED':
        return 25;
      case 'PREPARING':
        return 40;
      case 'COLLECTED':
        return 60;
      case 'IN_TRANSIT':
        return 80;
      case 'COMPLETED':
        return 100;
      case 'CANCELLED':
        return 0;
      default:
        return 0;
    }
  };

  const handleSendMessage = (delivery) => {
    setSelectedDelivery(delivery);
    setShowMessageForm(true);
    setMessageText('');
  };

  const handleMessageSubmit = async () => {
    if (!messageText.trim() || !selectedDelivery) return;

    setSendingMessage(true);
    try {
      await axiosInstance.post(`/deliveries/${selectedDelivery._id}/message`, {
        message: messageText.trim()
      });
      
      // Refresh messages for this delivery
      await fetchDeliveryMessages(selectedDelivery._id);
      
      setShowMessageForm(false);
      setSelectedDelivery(null);
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMessageCancel = () => {
    setShowMessageForm(false);
    setSelectedDelivery(null);
    setMessageText('');
  };

  const refreshMessages = async (deliveryId) => {
    await fetchDeliveryMessages(deliveryId);
  };

  const handleReviewClick = (delivery) => {
    setSelectedDelivery(delivery);
    setShowReviewForm(true);
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setSelectedDelivery(null);
    fetchDeliveries(); // Refresh deliveries to show updated review status
  };

  const handleReviewCancel = () => {
    setShowReviewForm(false);
    setSelectedDelivery(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Truck className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Delivery Tracking</h1>
        </div>

        {deliveries.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No deliveries found</h2>
            <p className="text-gray-600">You don't have any delivery requests yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {deliveries.map((delivery) => (
              <div key={delivery._id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{delivery.order?.orderNumber || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Created: {new Date(delivery.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                      {getStatusText(delivery.status)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{getProgressPercentage(delivery.status)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(delivery.status)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Delivery Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Delivery Address</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>{delivery.contactName}</p>
                        <p>{delivery.phone}</p>
                        <p>{delivery.address.line1}</p>
                        {delivery.address.line2 && <p>{delivery.address.line2}</p>}
                        <p>{delivery.address.city}, {delivery.address.state} {delivery.address.postalCode}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Order Details</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Total: LKR {delivery.order?.total?.toFixed(2) || 'N/A'}</p>
                        <p>Items: {delivery.order?.items?.length || 0}</p>
                        {delivery.driver && (
                          <p>Driver: {delivery.driver.fullName}</p>
                        )}
                        {delivery.notes && (
                          <p>Notes: {delivery.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status History */}
                  {delivery.statusHistory && delivery.statusHistory.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Status History</h4>
                      <div className="space-y-2">
                        {delivery.statusHistory
                          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                          .map((history, index) => (
                            <div key={index} className="flex items-center space-x-3 text-sm">
                              {getStatusIcon(history.status)}
                              <span className="text-gray-600">{getStatusText(history.status)}</span>
                              <span className="text-gray-400">
                                {new Date(history.updatedAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Review Button for Completed Deliveries */}
                  {delivery.status === 'COMPLETED' && !delivery.review && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-green-800 mb-2">
                              Delivery Completed!
                            </h4>
                            <p className="text-sm text-green-700 mb-3">
                              Your delivery has been completed successfully. We'd love to hear about your experience!
                            </p>
                            <button
                              onClick={() => handleReviewClick(delivery)}
                              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Leave a Review
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review Submitted Message */}
                  {delivery.status === 'COMPLETED' && delivery.review && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-blue-800 mb-2">
                              Review Submitted
                            </h4>
                            <p className="text-sm text-blue-700">
                              Thank you for your feedback! Your review has been submitted and our team will review it.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message Manager for Cancelled Deliveries */}
                  {delivery.status === 'CANCELLED' && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-red-800 mb-2">
                              Delivery Cancelled
                            </h4>
                            <p className="text-sm text-red-700 mb-3">
                              Your delivery has been cancelled. You can send one message to our delivery manager if you have any questions or concerns.
                            </p>
                            <div className="flex items-center space-x-3">
                              {!deliveryMessages[delivery._id] || !deliveryMessages[delivery._id].some(msg => msg.senderType === 'CUSTOMER') ? (
                                <button
                                  onClick={() => handleSendMessage(delivery)}
                                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Send Message
                                </button>
                              ) : (
                                <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg">
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Message Sent
                                </div>
                              )}
                              <button
                                onClick={() => refreshMessages(delivery._id)}
                                className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-300"
                                title="Check for new messages"
                              >
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Check Messages
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show existing messages for cancelled deliveries */}
                  {delivery.status === 'CANCELLED' && deliveryMessages[delivery._id] && deliveryMessages[delivery._id].length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Messages</h4>
                        <button
                          onClick={() => refreshMessages(delivery._id)}
                          className="inline-flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                          title="Refresh messages"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Refresh
                        </button>
                      </div>
                      <div className="space-y-3">
                        {deliveryMessages[delivery._id].map((message, index) => (
                          <div key={index} className={`p-3 rounded-lg ${
                            message.senderType === 'CUSTOMER' 
                              ? 'bg-blue-50 border border-blue-200' 
                              : message.senderType === 'MANAGER'
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-gray-50 border border-gray-200'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">{message.message}</p>
                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                  <span>
                                    {message.senderType === 'CUSTOMER' 
                                      ? 'You' 
                                      : message.senderType === 'MANAGER'
                                      ? 'Manager Reply'
                                      : 'System'
                                    }
                                  </span>
                                  <span className="mx-2">•</span>
                                  <span>{new Date(message.createdAt).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && selectedDelivery && (
        <DeliveryReviewForm
          delivery={selectedDelivery}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={handleReviewCancel}
        />
      )}

      {/* Message Form Modal */}
      {showMessageForm && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Message to Manager</h3>
              <button
                onClick={handleMessageCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Order #{selectedDelivery.order?.orderNumber || selectedDelivery._id}
              </p>
              <p className="text-sm text-gray-500">
                Send a message to our delivery manager about this cancelled delivery. You can only send one message per delivery.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={4}
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {messageText.length}/1000 characters
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleMessageCancel}
                disabled={sendingMessage}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMessageSubmit}
                disabled={!messageText.trim() || sendingMessage}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTrackingPage;

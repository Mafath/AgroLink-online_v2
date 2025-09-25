import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Truck, Package, MapPin, Clock, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { axiosInstance } from '../lib/axios';

const DeliveryTrackingPage = () => {
  const { authUser } = useAuthStore();
  const [deliveries, setDeliveries] = useState([]);
  const { orderId } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      if (orderId) {
        const response = await axiosInstance.get(`/deliveries/order/${orderId}`);
        setDeliveries(Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []));
      } else {
        const response = await axiosInstance.get('/deliveries/me');
        setDeliveries(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    } finally {
      setLoading(false);
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

  const handleContactSupport = (delivery) => {
    const supportEmail = 'ishan78ahmed01@gmail.com';
    const subject = `Delivery Cancellation Support - Order ${delivery.order?.orderNumber || delivery._id}`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(supportEmail)}&su=${encodeURIComponent(subject)}`;
    window.open(gmailUrl, '_blank');
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

                  {/* Contact Support Button for Cancelled Deliveries */}
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
                              Your delivery has been cancelled. If you have any questions or concerns, please contact our support team.
                            </p>
                            <button
                              onClick={() => handleContactSupport(delivery)}
                              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Contact Support
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryTrackingPage;

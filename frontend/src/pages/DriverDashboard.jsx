import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Truck, Package, MapPin, Clock, CheckCircle, AlertCircle, Phone, User } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

const DriverDashboard = () => {
  const { authUser } = useAuthStore();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const response = await axiosInstance.get('/deliveries/driver/me');
      setDeliveries(response.data);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId, status) => {
    try {
      await axiosInstance.post(`/deliveries/${deliveryId}/status`, { status });
      toast.success('Delivery status updated');
      fetchDeliveries();
    } catch (error) {
      console.error('Failed to update delivery status:', error);
      toast.error('Failed to update delivery status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'ASSIGNED':
        return <User className="w-5 h-5 text-blue-500" />;
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
        return 'Assigned to You';
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

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'ASSIGNED':
        return 'PREPARING';
      case 'PREPARING':
        return 'COLLECTED';
      case 'COLLECTED':
        return 'IN_TRANSIT';
      case 'IN_TRANSIT':
        return 'COMPLETED';
      default:
        return null;
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

  const filteredDeliveries = deliveries.filter(delivery => {
    if (statusFilter !== 'all' && delivery.status !== statusFilter) return false;
    return true;
  });

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none mx-0 w-full px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold">Driver Dashboard</h1>
            <p className="text-gray-600">Welcome back, {authUser?.fullName || 'Driver'}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">{deliveries.length}</div>
            <div className="text-sm text-gray-600">Total Deliveries</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {deliveries.filter(d => d.status === 'ASSIGNED').length}
                </div>
                <div className="text-sm text-gray-600">Assigned</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {deliveries.filter(d => d.status === 'PREPARING').length}
                </div>
                <div className="text-sm text-gray-600">Preparing</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Truck className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {deliveries.filter(d => d.status === 'IN_TRANSIT').length}
                </div>
                <div className="text-sm text-gray-600">In Transit</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {deliveries.filter(d => d.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Statuses</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="PREPARING">Preparing</option>
              <option value="COLLECTED">Collected</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="space-y-6">
          {filteredDeliveries.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No deliveries found</h2>
              <p className="text-gray-600">You don't have any assigned deliveries yet.</p>
            </div>
          ) : (
            filteredDeliveries.map((delivery) => (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Customer Information
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Name:</strong> {delivery.contactName}</p>
                        <p><strong>Phone:</strong> {delivery.phone}</p>
                        <p><strong>Order Total:</strong> LKR {delivery.order?.total?.toFixed(2) || 'N/A'}</p>
                        <p><strong>Items:</strong> {delivery.order?.items?.length || 0}</p>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Delivery Address
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>{delivery.address.line1}</p>
                        {delivery.address.line2 && <p>{delivery.address.line2}</p>}
                        <p>{delivery.address.city}, {delivery.address.state} {delivery.address.postalCode}</p>
                        {delivery.notes && (
                          <p className="mt-2 p-2 bg-gray-50 rounded">
                            <strong>Notes:</strong> {delivery.notes}
                          </p>
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

                  {/* Action Button */}
                  <div className="mt-6 flex justify-end">
                    {getNextStatus(delivery.status) && (
                      <button
                        onClick={() => updateDeliveryStatus(delivery._id, getNextStatus(delivery.status))}
                        className="btn-primary"
                      >
                        {getNextStatus(delivery.status) === 'PREPARING' && 'Start Preparing'}
                        {getNextStatus(delivery.status) === 'COLLECTED' && 'Mark as Collected'}
                        {getNextStatus(delivery.status) === 'IN_TRANSIT' && 'Start Delivery'}
                        {getNextStatus(delivery.status) === 'COMPLETED' && 'Mark as Delivered'}
                      </button>
                    )}
                    {delivery.status === 'COMPLETED' && (
                      <span className="text-green-600 font-medium">Delivery Completed</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;


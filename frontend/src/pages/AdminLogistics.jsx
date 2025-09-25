import React, { useState, useEffect } from 'react';
import { Truck, Package, Users, Clock, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

const AdminLogistics = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'unassigned' | 'cancelled'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deliveriesRes, driversRes] = await Promise.all([
        axiosInstance.get('/deliveries'),
        axiosInstance.get('/auth/admin/users?role=DRIVER')
      ]);
      
      setDeliveries(deliveriesRes.data);
      setDrivers(driversRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load logistics data');
    } finally {
      setLoading(false);
    }
  };

  const assignDriver = async (deliveryId, driverId) => {
    try {
      await axiosInstance.post(`/deliveries/${deliveryId}/assign`, { driverId });
      toast.success('Driver assigned successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to assign driver:', error);
      toast.error('Failed to assign driver');
    }
  };

  const cancelDelivery = async (deliveryId) => {
    const confirmed = window.confirm('Are you sure you want to cancel this delivery?');
    if (!confirmed) return;
    try {
      await axiosInstance.patch(`/deliveries/${deliveryId}/cancel`);
      toast.success('Delivery cancelled successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to cancel delivery:', error);
      const message = error?.response?.data?.error?.message || 'Failed to cancel delivery';
      toast.error(message);
    }
  };

  

  const getDeliveryStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'ASSIGNED':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'PREPARING':
        return <Package className="w-4 h-4 text-orange-500" />;
      case 'COLLECTED':
        return <Truck className="w-4 h-4 text-purple-500" />;
      case 'IN_TRANSIT':
        return <Truck className="w-4 h-4 text-indigo-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'CANCELLED':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    if (activeTab === 'assigned' && statusFilter !== 'all' && delivery.status !== statusFilter) return false;
    return true;
  });

  // Split into unassigned vs assigned (exclude cancelled here)
  const unassignedDeliveries = filteredDeliveries.filter(d => !d.driver && d.status !== 'CANCELLED');
  const assignedDeliveries = filteredDeliveries.filter(d => !!d.driver && d.status !== 'CANCELLED');
  // Cancelled (independent of status filter to always show in tab)
  const cancelledDeliveries = deliveries.filter(d => d.status === 'CANCELLED');

  // Sort by most recent first
  const sortedUnassigned = [...unassignedDeliveries].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime() || 0;
    const bTime = new Date(b.createdAt).getTime() || 0;
    return bTime - aTime;
  });

  const sortedAssigned = [...assignedDeliveries].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime() || 0;
    const bTime = new Date(b.createdAt).getTime() || 0;
    return bTime - aTime;
  });
  
  const sortedCancelled = [...cancelledDeliveries].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime() || 0;
    const bTime = new Date(b.createdAt).getTime() || 0;
    return bTime - aTime;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading logistics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none mx-0 w-full px-8 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-semibold ml-2">Logistics Management</h1>
          <div className="flex items-center space-x-2">
            <span className="px-4 py-2 rounded-lg font-medium bg-primary-600 text-white">Deliveries ({deliveries.length})</span>
          </div>
        </div>

        <div className="grid grid-cols-[240px,1fr] gap-6">
          {/* Sidebar */}
          <div className="bg-white rounded-xl border border-gray-200 p-2">
            <nav className="space-y-1 text-gray-700 text-sm">
              <a href="/admin" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Dashboards</a>
              <a href="/admin/users" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Users & Roles</a>
              <a href="/admin/inventory" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Inventory</a>
              <a href="/admin/rentals" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Rentals</a>
              <a href="/admin/listings" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Listings</a>
              <a href="/admin/harvest" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Harvest Management</a>
              <a href="/admin/drivers" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Driver Management</a>
              <a href="/admin/logistics" className="block px-3 py-2 rounded-lg bg-green-100 text-green-700">Logistics</a>
              <a href='/admin/orders' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Orders</a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="space-y-6">

        {/* Filters and Tab Buttons */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <div className="flex space-x-4">
                {activeTab === 'assigned' && (
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
                  </select>
                )}
              </div>
            </div>
            
            {/* Tab Buttons */}
            <div className="flex items-center gap-3">
              <button
                className={`px-5 py-2 text-sm rounded-full transition-all shadow ${
                  activeTab === 'assigned'
                    ? 'bg-green-600 text-white shadow-green-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('assigned')}
              >
                <span className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 8v5a3 3 0 0 1-3 3H9l-4 4V8a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3Z"/></svg>
                  Assigned
                </span>
              </button>
              <button
                className={`px-5 py-2 text-sm rounded-full transition-all shadow ${
                  activeTab === 'unassigned'
                    ? 'bg-indigo-600 text-white shadow-indigo-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('unassigned')}
              >
                <span className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Unassigned
                </span>
              </button>
              <button
                className={`px-5 py-2 text-sm rounded-full transition-all shadow ${
                  activeTab === 'cancelled'
                    ? 'bg-red-600 text-white shadow-red-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('cancelled')}
              >
                <span className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  Cancelled
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tables */}
        {activeTab === 'unassigned' ? (
          // Unassigned Deliveries
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700" colSpan="6">Unassigned Deliveries ({sortedUnassigned.length})</th>
                  </tr>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedUnassigned.map((delivery) => (
                    <tr key={delivery._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{delivery.order?.orderNumber || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(delivery.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {delivery.contactName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {delivery.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {delivery.address.line1}
                        </div>
                        <div className="text-sm text-gray-500">
                          {delivery.address.city}, {delivery.address.state}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getDeliveryStatusIcon(delivery.status)}
                          <span className="ml-2 text-sm text-gray-900">{delivery.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const province = (delivery.address?.state || '').toString().trim().toLowerCase();
                          const eligibleDrivers = drivers.filter((driver) => {
                            const area = (driver.service_area || '').toString().trim().toLowerCase();
                            const isAvailable = (driver.availability || '').toString().toUpperCase() === 'AVAILABLE';
                            return area === province && isAvailable;
                          });
                          return (
                            <select
                              onChange={(e) => assignDriver(delivery._id, e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-xs w-40"
                              defaultValue=""
                            >
                              <option value="">Assign Driver</option>
                              {eligibleDrivers.length === 0 ? (
                                <option value="" disabled>No drivers for this province</option>
                              ) : (
                                eligibleDrivers.map((driver) => (
                                  <option key={driver._id} value={driver._id}>
                                    {driver.fullName}
                                  </option>
                                ))
                              )}
                            </select>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => cancelDelivery(delivery._id)}
                          disabled={delivery.status === 'COMPLETED' || delivery.status === 'CANCELLED'}
                          className={`px-3 py-1 rounded border ${
                            delivery.status === 'COMPLETED' || delivery.status === 'CANCELLED'
                              ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                              : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                          }`}
                        >
                          Cancel Delivery
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'assigned' ? (
          // Assigned Deliveries
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700" colSpan="6">Assigned Deliveries ({sortedAssigned.length})</th>
                  </tr>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedAssigned.map((delivery) => (
                    <tr key={delivery._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">#{delivery.order?.orderNumber || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{new Date(delivery.createdAt).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{delivery.contactName}</div>
                          <div className="text-sm text-gray-500">{delivery.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{delivery.address.line1}</div>
                        <div className="text-sm text-gray-500">{delivery.address.city}, {delivery.address.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getDeliveryStatusIcon(delivery.status)}
                          <span className="ml-2 text-sm text-gray-900">{delivery.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{delivery.driver?.fullName}</div>
                          <div className="text-sm text-gray-500">{delivery.driver?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => cancelDelivery(delivery._id)}
                          disabled={delivery.status === 'COMPLETED' || delivery.status === 'CANCELLED'}
                          className={`px-3 py-1 rounded border ${
                            delivery.status === 'COMPLETED' || delivery.status === 'CANCELLED'
                              ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                              : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                          }`}
                        >
                          Cancel Delivery
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Cancelled Deliveries
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700" colSpan="6">Cancelled Deliveries ({sortedCancelled.length})</th>
                  </tr>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCancelled.map((delivery) => (
                    <tr key={delivery._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">#{delivery.order?.orderNumber || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{new Date(delivery.createdAt).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{delivery.contactName}</div>
                          <div className="text-sm text-gray-500">{delivery.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{delivery.address.line1}</div>
                        <div className="text-sm text-gray-500">{delivery.address.city}, {delivery.address.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getDeliveryStatusIcon(delivery.status)}
                          <span className="ml-2 text-sm text-gray-900">{delivery.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{delivery.driver?.fullName || '-'}</div>
                          <div className="text-sm text-gray-500">{delivery.driver?.email || ''}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          disabled
                          className={`px-3 py-1 rounded border bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed`}
                        >
                          Cancelled
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogistics;



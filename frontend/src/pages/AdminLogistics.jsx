import React, { useState, useEffect } from 'react';
import { Truck, Package, Users, MapPin, Clock, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

const AdminLogistics = () => {
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('orders');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, deliveriesRes, driversRes] = await Promise.all([
        axiosInstance.get('/orders'),
        axiosInstance.get('/deliveries'),
        axiosInstance.get('/auth/admin/users?role=DRIVER')
      ]);
      
      setOrders(ordersRes.data);
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

  const updateOrderStatus = async (orderId, status) => {
  try {
    // Determine endpoint: use /cancel for cancellations, /status otherwise
    const endpoint =
      status === 'CANCELLED' ? `/orders/${orderId}/cancel` : `/orders/${orderId}/status`;

    await axiosInstance.patch(endpoint, status === 'CANCELLED' ? {} : { status });

    toast.success(
      status === 'CANCELLED'
        ? 'Order cancelled successfully'
        : 'Order status updated'
    );

    // Refresh orders & deliveries
    fetchData();
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    toast.error(
      status === 'CANCELLED'
        ? 'Failed to cancel order'
        : 'Failed to update order status'
    );
  }
};


  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PROCESSING':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'SHIPPED':
        return <Truck className="w-4 h-4 text-purple-500" />;
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'CANCELLED':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
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

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (deliveryTypeFilter !== 'all' && order.deliveryType !== deliveryTypeFilter) return false;
    return true;
  });

  const filteredDeliveries = deliveries.filter(delivery => {
    if (statusFilter !== 'all' && delivery.status !== statusFilter) return false;
    return true;
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold ml-2">Logistics Management</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedTab('orders')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedTab === 'orders' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setSelectedTab('deliveries')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedTab === 'deliveries' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Deliveries ({deliveries.length})
            </button>
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
              <a href="/admin/drivers" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Drivers</a>
              <a href="/admin/logistics" className="block px-3 py-2 rounded-lg bg-green-100 text-green-700">Logistics</a>
              <a href='/admin/orders' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Orders</a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="space-y-6">

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              {selectedTab === 'orders' && (
                <select
                  value={deliveryTypeFilter}
                  onChange={(e) => setDeliveryTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="all">All Types</option>
                  <option value="PICKUP">Pickup</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Orders Tab */}
        {selectedTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{order.orderNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer?.fullName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customer?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.deliveryType === 'DELIVERY' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {order.deliveryType === 'DELIVERY' ? (
                            <>
                              <Truck className="w-3 h-3 mr-1" />
                              Delivery
                            </>
                          ) : (
                            <>
                              <Package className="w-3 h-3 mr-1" />
                              Pickup
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(order.status)}
                          <span className="ml-2 text-sm text-gray-900">{order.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        LKR {order.total?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PAID">Paid</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Deliveries Tab */}
        {selectedTab === 'deliveries' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeliveries.map((delivery) => (
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
                        {delivery.driver ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {delivery.driver.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {delivery.driver.email}
                            </div>
                          </div>
                        ) : (
                          <select
                            onChange={(e) => assignDriver(delivery._id, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-xs"
                            defaultValue=""
                          >
                            <option value="">Assign Driver</option>
                            {drivers.map((driver) => (
                              <option key={driver._id} value={driver._id}>
                                {driver.fullName}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => window.open(`/delivery-tracking?delivery=${delivery._id}`, '_blank')}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View Details
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



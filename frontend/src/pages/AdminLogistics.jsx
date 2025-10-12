import React, { useState, useEffect } from 'react';
import { Truck, Package, Users, Clock, CheckCircle, AlertCircle, Filter, MessageSquare, Eye, EyeOff, X } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import AdminSidebar from '../components/AdminSidebar';

const AdminLogistics = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'unassigned' | 'cancelled'
  const [messages, setMessages] = useState([]);
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deliveriesRes, driversRes, messagesRes] = await Promise.all([
        axiosInstance.get('/deliveries'),
        axiosInstance.get('/auth/admin/users?role=DRIVER'),
        axiosInstance.get('/deliveries/messages?senderType=CUSTOMER&messageType=CUSTOMER_MESSAGE')
      ]);
      
      setDeliveries(deliveriesRes.data);
      setDrivers(driversRes.data.data || []);
      setMessages(messagesRes.data);
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

  const toggleMessageExpansion = (deliveryId) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(deliveryId)) {
      newExpanded.delete(deliveryId);
    } else {
      newExpanded.add(deliveryId);
    }
    setExpandedMessages(newExpanded);
  };

  const markMessageAsRead = async (messageId) => {
    try {
      await axiosInstance.patch(`/deliveries/messages/${messageId}/read`);
      // Refresh messages to update read status
      const messagesRes = await axiosInstance.get('/deliveries/messages?senderType=CUSTOMER&messageType=CUSTOMER_MESSAGE');
      setMessages(messagesRes.data);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const getMessagesForDelivery = (deliveryId) => {
    return messages.filter(message => message.delivery._id === deliveryId);
  };

  const handleReplyClick = (message) => {
    setReplyingToMessage(message);
    setReplyText('');
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !replyingToMessage) return;

    setSendingReply(true);
    try {
      await axiosInstance.post(`/deliveries/messages/${replyingToMessage._id}/reply`, {
        reply: replyText.trim()
      });
      
      // Refresh messages to show the new reply
      const messagesRes = await axiosInstance.get('/deliveries/messages?senderType=CUSTOMER&messageType=CUSTOMER_MESSAGE');
      setMessages(messagesRes.data);
      
      setReplyingToMessage(null);
      setReplyText('');
      toast.success('Reply sent successfully');
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleReplyCancel = () => {
    setReplyingToMessage(null);
    setReplyText('');
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
          <AdminSidebar activePage="logistics" />

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
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700" colSpan="7">Cancelled Deliveries ({sortedCancelled.length})</th>
                  </tr>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCancelled.map((delivery) => {
                    const deliveryMessages = getMessagesForDelivery(delivery._id);
                    const hasUnreadMessages = deliveryMessages.some(msg => !msg.isRead);
                    const isExpanded = expandedMessages.has(delivery._id);
                    
                    return (
                      <React.Fragment key={delivery._id}>
                        <tr>
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm ${hasUnreadMessages ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                {deliveryMessages.length} message{deliveryMessages.length !== 1 ? 's' : ''}
                              </span>
                              {deliveryMessages.length > 0 && (
                                <button
                                  onClick={() => toggleMessageExpansion(delivery._id)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              )}
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
                        
                        {/* Expanded Messages Row */}
                        {isExpanded && deliveryMessages.length > 0 && (
                          <tr>
                            <td colSpan="7" className="px-6 py-4 bg-gray-50">
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Customer Messages ({deliveryMessages.length})
                                </h4>
                                {deliveryMessages.map((message, index) => (
                                  <div key={index} className={`p-3 rounded-lg border ${
                                    message.senderType === 'CUSTOMER' 
                                      ? (message.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200')
                                      : 'bg-green-50 border-green-200'
                                  }`}>
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm text-gray-700">{message.message}</p>
                                        <div className="flex items-center mt-2 text-xs text-gray-500">
                                          <span>From: {message.createdBy?.fullName || (message.senderType === 'CUSTOMER' ? 'Customer' : 'Manager')}</span>
                                          <span className="mx-2">•</span>
                                          <span>{new Date(message.createdAt).toLocaleString()}</span>
                                          {message.senderType === 'CUSTOMER' && !message.isRead && (
                                            <>
                                              <span className="mx-2">•</span>
                                              <span className="text-red-600 font-medium">Unread</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        {message.senderType === 'CUSTOMER' && !message.isRead && (
                                          <button
                                            onClick={() => markMessageAsRead(message._id)}
                                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                          >
                                            Mark as Read
                                          </button>
                                        )}
                                        {message.senderType === 'CUSTOMER' && (
                                          <button
                                            onClick={() => handleReplyClick(message)}
                                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                          >
                                            Reply
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      {replyingToMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reply to Customer</h3>
              <button
                onClick={handleReplyCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Order #{replyingToMessage.order?.orderNumber || replyingToMessage.delivery?._id}
              </p>
              <p className="text-sm text-gray-500">
                Replying to: {replyingToMessage.createdBy?.fullName || 'Customer'}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Reply
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                rows={4}
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {replyText.length}/1000 characters
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleReplyCancel}
                disabled={sendingReply}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReplySubmit}
                disabled={!replyText.trim() || sendingReply}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingReply ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogistics;



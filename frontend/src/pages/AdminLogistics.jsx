import React, { useState, useEffect } from 'react';
import { Truck, Package, Users, Clock, CheckCircle, AlertCircle, Filter, FileDown } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import AdminSidebar from '../components/AdminSidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import logoImg from '../assets/AgroLink_logo3-removebg-preview.png';

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

  const downloadLogisticsPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Top green and black bars
      pdf.setFillColor(13, 126, 121);
      pdf.rect(0, 0, 157.5, 8, 'F');
      pdf.setFillColor(0, 0, 0);
      pdf.rect(157.5, 0, 52.5, 8, 'F');

      // White spacer below top bars
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 8, 210, 5, 'F');

      // Header main content background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 13, 210, 25, 'F');

      // Logo via html2canvas (same as other PDFs)
      try {
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '60px';
        tempDiv.style.height = '60px';
        tempDiv.style.display = 'flex';
        tempDiv.style.alignItems = 'center';
        tempDiv.style.justifyContent = 'center';
        tempDiv.innerHTML = `<img src="${logoImg}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />`;
        document.body.appendChild(tempDiv);
        const canvas = await html2canvas(tempDiv, { width:60, height:60, backgroundColor:null, scale:2 });
        document.body.removeChild(tempDiv);
        const logoDataURL = canvas.toDataURL('image/png');
        pdf.addImage(logoDataURL, 'PNG', 15, 13, 16, 16);
      } catch (_) {
        // fallback silently
      }

      // Gradient company text
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const startColor = { r: 0, g: 128, b: 111 };
      const endColor = { r: 139, g: 195, b: 75 };
      const brand = 'AgroLink';
      const startX = 35;
      const letterPositions = [0, 4, 7.5, 9.5, 12.8, 16.7, 18.3, 21.5];
      for (let i = 0; i < brand.length; i++) {
        const progress = i / (brand.length - 1);
        const r = Math.round(startColor.r + (endColor.r - startColor.r) * progress);
        const g = Math.round(startColor.g + (endColor.g - startColor.g) * progress);
        const b = Math.round(startColor.b + (endColor.b - startColor.b) * progress);
        pdf.setTextColor(r, g, b);
        pdf.text(brand[i], startX + letterPositions[i], 23);
      }

      // Tagline
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Agricultural Technology Solutions', 35, 27);

      // Right contact block (match existing)
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(120, 17, 120, 33);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Email:', 130, 17);
      pdf.setFont('helvetica', 'normal');
      pdf.text('info@agrolink.org', 145, 17);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Phone:', 130, 21);
      pdf.setFont('helvetica', 'normal');
      pdf.text('+94 71 920 7688', 145, 21);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Web:', 130, 25);
      pdf.setFont('helvetica', 'normal');
      pdf.text('www.AgroLink.org', 145, 25);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Address:', 130, 29);
      pdf.setFont('helvetica', 'normal');
      pdf.text('States Rd, Colombo 04, Sri Lanka', 145, 29);

      // Bottom separator line of header
      pdf.setDrawColor(13, 126, 121);
      pdf.setLineWidth(1);
      pdf.line(20, 40, 190, 40);

      // Content titles and spacing
      const titleMap = { assigned: 'Assigned Deliveries', unassigned: 'Unassigned Deliveries', cancelled: 'Cancelled Deliveries' };
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Logistics - ${titleMap[activeTab]} Report`, 20, 55);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 63);

      // Summary details (fill space between title and table)
      const rowsSource = activeTab === 'assigned' ? sortedAssigned : activeTab === 'unassigned' ? sortedUnassigned : sortedCancelled;
      const totalCount = rowsSource.length;
      const dates = rowsSource.map(d => new Date(d?.createdAt || 0).getTime()).filter(n => Number.isFinite(n) && n > 0);
      const minDate = dates.length ? new Date(Math.min(...dates)).toLocaleDateString() : '-';
      const maxDate = dates.length ? new Date(Math.max(...dates)).toLocaleDateString() : '-';
      const statusInfo = activeTab === 'assigned' && statusFilter !== 'all' ? `Filter: ${statusFilter}` : '';
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.text('Summary', 20, 75);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
      pdf.text(`Total records: ${totalCount}`, 20, 83);
      pdf.text(`Date range: ${minDate} - ${maxDate}`, 20, 91);
      if (statusInfo) pdf.text(statusInfo, 120, 83);

      // Section title before table
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Deliveries', 20, 105);

      // Table with consistent startY and styles
      const headers = [['Order', 'Customer', 'Phone', 'Address', 'Status', 'Driver', 'Created']];
      const data = rowsSource.map(d => [
        `#${d?.order?.orderNumber || 'N/A'}`,
        d?.contactName || '-',
        d?.phone || '-',
        `${d?.address?.line1 || ''}, ${d?.address?.city || ''}, ${d?.address?.state || ''}`.replace(/^,\s*/, ''),
        d?.status || '-',
        d?.driver?.fullName || '-',
        d?.createdAt ? new Date(d.createdAt).toLocaleDateString() : '-'
      ]);

      autoTable(pdf, {
        head: headers,
        body: data,
        startY: 115,
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, minCellHeight: 12, lineWidth: 0 },
        headStyles: { fillColor: [13, 126, 121], textColor: [255,255,255] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 20, right: 20 }
      });

      // Footer on every page
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(13, 126, 121);
        pdf.setLineWidth(1);
        pdf.line(20, 280, 190, 280);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text('AgroLink - Agricultural Technology Solutions', 20, 285);
        pdf.text(`Page ${i} of ${pageCount}`, 160, 285);
        pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 290);
      }

      pdf.save(`logistics-${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast.error('Failed to generate PDF');
    }
  };

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
            <button onClick={downloadLogisticsPDF} className="px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-900">
              <FileDown className="inline w-4 h-4 mr-1" /> Export PDF
            </button>
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



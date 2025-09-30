import React, { useEffect, useMemo, useState } from "react";
import Chart from 'react-apexcharts'
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { FileDown, TrendingUp, Package, DollarSign, XCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from 'html2canvas';
import logoImg from '../assets/AgroLink_logo3-removebg-preview.png';
import AdminSidebar from "../components/AdminSidebar";

const statuses = ['NOT READY', 'READY', 'CANCELLED'];
const statusList = ['NOT READY', 'READY', 'CANCELLED'];

const colorMap = {
  'NOT READY': '#f59e0b',
  'READY': '#22c55e',
  'CANCELLED': '#ef4444'
};


const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
)

const LineChart = ({ categories = ['Jan','Feb','Mar','Apr','May','Jun'], series = [{ name: 'Signups', data: [20,28,22,30,26,40] }], color = '#22c55e' }) => (
  <Chart type='line' height={180} options={{
    chart:{toolbar:{show:false}},
    stroke:{width:3, curve:'smooth'},
    colors:[color],
    grid:{borderColor:'#eee'},
    xaxis:{categories, labels:{style:{colors:'#9ca3af'}}},
    yaxis:{labels:{style:{colors:'#9ca3af'}}},
    legend:{show:false}
  }} series={series} />
)

const DonutChart = ({ labels = ['Admin','Farmer','Buyer','Driver','Agronomist'], series = [5,45,40,10,5], colors = ['#8b5cf6', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444'] }) => (
  <Chart key={Array.isArray(series) ? series.join(',') : 'static'} type='donut' height={220} options={{
    chart:{toolbar:{show:false}},
    labels,
    colors,
    legend:{show:false},
    dataLabels:{enabled:false},
    plotOptions:{
      pie:{
        donut:{
          size:'70%',
          labels:{
            show:true,
            name:{ show:false },
            value:{ show:false },
            total:{
              show:true,
              label:'Total',
              formatter: function(w){
                try {
                  const totals = w?.globals?.seriesTotals || []
                  const total = totals.reduce((a,b)=>a + Number(b||0), 0)
                  return total.toLocaleString()
                } catch (_) { return '' }
              }
            }
          }
        }
      }
    }
  }} series={series} />
)

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const AdminOrders = () => {
  const [query, setQuery] = useState({ search: '', status: '' })
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/orders");
      setOrders(res.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

 const updateOrderStatus = async (orderId, newStatus) => {
  try {
    if (newStatus === "CANCELLED") {
      // Use cancel endpoint for cancellations
      await axiosInstance.patch(`/orders/${orderId}/cancel`);

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? { ...o, status: "CANCELLED", cancelledBy: "admin" }
            : o
        )
      );
    } else {
      // Use status endpoint for other status updates
      await axiosInstance.patch(`/orders/${orderId}/status`, {
        status: newStatus,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status: newStatus } : o
        )
      );
    }

    toast.success("Status updated successfully");
  } catch (err) {
    console.error("Error updating status:", err.response?.data?.error || err.message);
    toast.error(`Failed to update status: ${err.response?.data?.error || "Unknown error"}`);
  }
};


  const filteredOrders = useMemo(() => {
    let list = orders;
    if (query.status) {
      list = list.filter(o => String(o.status).toUpperCase() === query.status.toUpperCase());
    }
    const search = (query.search || '').trim().toLowerCase();
    if (search) {
      list = list.filter(o => (o.orderNumber || o._id || '').toLowerCase().includes(search));
    }
    return list;
  }, [orders, query]);

  const totalRevenue = useMemo(() => {
    return filteredOrders
      .filter(order => String(order.status).toUpperCase() !== 'CANCELLED')
      .reduce((sum, order) => sum + (order.total || 0), 0);
  }, [filteredOrders]);

  const recentOrdersCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return filteredOrders.filter(o => new Date(o.createdAt).getTime() >= cutoff).length;
  }, [filteredOrders]);

  const totalOrdersCount = filteredOrders.length;

  const cancelledOrdersCount = useMemo(() => {
    return filteredOrders.filter(o => String(o.status).toUpperCase() === 'CANCELLED').length;
  }, [filteredOrders]);

  const orderGrowth = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count: 0
      });
    }
    for (const o of filteredOrders) {
      const t = new Date(o.createdAt);
      if (!isNaN(t.getTime())) {
        const key = `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`;
        const bucket = buckets.find(b => b.key === key);
        if (bucket) bucket.count += 1;
      }
    }
    return {
      categories: buckets.map(b => b.label),
      data: buckets.map(b => b.count),
    };
  }, [filteredOrders]);

  const revenueGrowth = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        sum: 0
      });
    }
    for (const o of filteredOrders) {
      if (String(o.status).toUpperCase() === 'CANCELLED') continue;
      const t = new Date(o.createdAt);
      if (!isNaN(t.getTime())) {
        const key = `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`;
        const bucket = buckets.find(b => b.key === key);
        if (bucket) bucket.sum += o.total || 0;
      }
    }
    return {
      categories: buckets.map(b => b.label),
      data: buckets.map(b => b.sum),
    };
  }, [filteredOrders]);

  const statusCounts = useMemo(() => {
  const counts = { 'NOT READY': 0, 'READY': 0, 'CANCELLED': 0 };
  for (const o of filteredOrders) {
    const s = o.status || 'NOT READY';
    if (counts[s] != null) counts[s] += 1;
  }
  return counts;
}, [filteredOrders]);


  const getStatusColor = (status) => {
  switch (status) {
    case 'NOT READY': return 'bg-amber-100 text-amber-700';
    case 'READY': return 'bg-green-100 text-green-700';
    case 'CANCELLED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};


  const downloadPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Top green and black bar (3/4 green, 1/4 black)
      pdf.setFillColor(13, 126, 121); // Primary green (#0d7e79)
      pdf.rect(0, 0, 157.5, 8, 'F'); // 3/4 of 210mm = 157.5mm
      
      pdf.setFillColor(0, 0, 0); // Black
      pdf.rect(157.5, 0, 52.5, 8, 'F'); // 1/4 of 210mm = 52.5mm
      
      // Add space below top bar
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 8, 210, 5, 'F'); // 5mm white space
      
      // Main content area (white background)
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 13, 210, 25, 'F');
      
      // Add the actual AgroLink logo using html2canvas
      try {
        // Create a temporary div with the logo
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
        
        // Capture the logo with html2canvas
        const canvas = await html2canvas(tempDiv, {
          width: 60,
          height: 60,
          backgroundColor: null,
          scale: 2 // Higher resolution
        });
        
        // Remove the temporary div
        document.body.removeChild(tempDiv);
        
        // Add the logo to PDF with correct aspect ratio (bigger size)
        const logoDataURL = canvas.toDataURL('image/png');
        pdf.addImage(logoDataURL, 'PNG', 15, 13, 16, 16); // Adjusted for space below top bar
      } catch (error) {
        console.log('Could not load logo, using text fallback');
        // Fallback to text if logo fails
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(13, 126, 121);
        pdf.text('AgroLink', 15, 25);
      }
      
      // Company information
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Email:', 130, 17); // Adjusted for space below top bar
      pdf.setFont('helvetica', 'normal');
      pdf.text('info@agrolink.org', 145, 17);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Phone:', 130, 21); // Adjusted for space below top bar
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
      
      // Bottom line separator
      pdf.setDrawColor(13, 126, 121); // Primary green
      pdf.setLineWidth(1);
      pdf.line(20, 40, 190, 40); // Adjusted for space below top bar
      
      // Reset text color for content
      pdf.setTextColor(0, 0, 0);
      
      // Add report title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Orders Management Report', 20, 55); // Adjusted for space below top bar
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 63); // Adjusted for space below top bar
    
      // Summary Section
      pdf.setFontSize(12);
      pdf.setTextColor(0);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary', 20, 75);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Total Orders: ${filteredOrders.length.toLocaleString()}`, 20, 85);
      pdf.text(`Active Orders Revenue: LKR ${totalRevenue.toFixed(2)}`, 20, 92);
      pdf.text(`Cancelled Orders: ${cancelledOrdersCount.toLocaleString()}`, 20, 99);
      
      // Line separator
      pdf.setDrawColor(200);
      pdf.line(20, 105, 190, 105);

      // Table styling
      const tableColumn = ["Order ID", "Date", "Time", "Products", "Payment Method", "Delivery Option", "Total (LKR)", "Status"];
      const tableRows = filteredOrders.map(order => {
        const date = new Date(order.createdAt);
        const products = order.items?.map(item => `${item.title || item.listing?.title} x ${item.quantity}`).join(', ') || '';
        return [
          order.orderNumber || order._id,
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          products,
          capitalizeFirst(order.paymentMethod),
          capitalizeFirst(order.deliveryType),
          order.total?.toFixed(2) || "0.00",
          capitalizeFirst(order.status || 'not_ready')
        ];
      });

      autoTable(pdf, {
        head: [tableColumn],
        body: tableRows,
        startY: 110,
        theme: 'striped',
        headStyles: {
          fillColor: [13, 126, 121], // Primary green
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 20 }, // Order ID
          1: { cellWidth: 15 }, // Date
          2: { cellWidth: 15 }, // Time
          3: { cellWidth: 'auto' }, // Products
          4: { cellWidth: 20 }, // Payment Method
          5: { cellWidth: 20 }, // Delivery Option
          6: { cellWidth: 15 }, // Total
          7: { cellWidth: 20 }  // Status
        },
        margin: { left: 20, right: 20 }
      });

      // Footer with totals
      const finalY = pdf.lastAutoTable.finalY + 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0);
      pdf.text('Order Totals', 20, finalY);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const activeTotal = filteredOrders
        .filter(o => String(o.status).toUpperCase() !== 'CANCELLED')
        .reduce((sum, o) => sum + (o.total || 0), 0);
      pdf.text(`Active Orders Total: LKR ${activeTotal.toFixed(2)}`, 20, finalY + 10);
      
      const cancelledTotal = filteredOrders
        .filter(o => String(o.status).toUpperCase() === 'CANCELLED')
        .reduce((sum, o) => sum + (o.total || 0), 0);
      pdf.text(`Cancelled Orders Total: LKR ${cancelledTotal.toFixed(2)}`, 20, finalY + 17);
      
      // Add footer with proper margins
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Check if content extends too close to footer and add margin
        const currentPageHeight = pdf.internal.pageSize.height;
        const footerStartY = currentPageHeight - 20; // 20mm from bottom
        const contentEndY = i === pageCount ? finalY + 25 : currentPageHeight; // Use finalY for last page
        
        // If content is too close to footer, add margin
        if (contentEndY > footerStartY - 10) {
          // Add extra space before footer
          const extraMargin = Math.max(0, (contentEndY + 10) - footerStartY);
          const adjustedFooterY = footerStartY + extraMargin;
          
          // Footer line with top margin
          pdf.setDrawColor(13, 126, 121); // Primary green
          pdf.setLineWidth(1);
          pdf.line(20, adjustedFooterY, 190, adjustedFooterY);
          
          // Footer text with proper spacing
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          pdf.text('AgroLink - Agricultural Technology Solutions', 20, adjustedFooterY + 5);
          pdf.text(`Page ${i} of ${pageCount}`, 160, adjustedFooterY + 5);
          pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, adjustedFooterY + 10);
        } else {
          // Footer line
          pdf.setDrawColor(13, 126, 121); // Primary green
          pdf.setLineWidth(1);
          pdf.line(20, footerStartY, 190, footerStartY);
          
          // Footer text
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          pdf.text('AgroLink - Agricultural Technology Solutions', 20, footerStartY + 5);
          pdf.text(`Page ${i} of ${pageCount}`, 160, footerStartY + 5);
          pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, footerStartY + 10);
        }
      }

      // Save the PDF
      pdf.save(`AgroLink-Orders-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none mx-0 w-full px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold ml-2">Orders Management</h1>
          <button
            onClick={downloadPDF}
            className="px-4 py-2 rounded-lg font-medium bg-primary-600 text-white hover:bg-green-700"
          >
            <FileDown className="w-4 h-4 inline-block mr-1" /> Download PDF
          </button>
        </div>

        <div className="grid grid-cols-[240px,1fr] gap-6">
          <AdminSidebar activePage="orders" />

          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 col-span-4">
                <div className="px-4 py-3 border-b border-gray-100 grid grid-cols-3 items-center gap-3">
                  <div>
                    <div className="text-md font-medium text-gray-700">Orders</div>
                  </div>
                  <div className="flex justify-center">
                    <div className="relative hidden sm:block">
                      <input
                        className="bg-white border border-gray-200 rounded-full h-9 pl-3 pr-3 w-56 text-sm outline-none"
                        placeholder="Search"
                        value={query.search || ''}
                        onChange={e => setQuery(q => ({ ...q, search: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <select
                      className="input-field h-9 py-1 text-sm hidden sm:block rounded-full w-36"
                      value={query.status}
                      onChange={e => setQuery(q => ({ ...q, status: e.target.value }))}
                    >
                      <option value="">All Statuses</option>
                      {statuses.map(s => <option key={s} value={s}>{capitalizeFirst(s)}</option>)}
                    </select>
                  </div>
                </div>

                <div className="max-h-[240px] overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-gray-100 z-10 rounded-t-lg">
                      <tr className="text-center text-gray-500 border-b align-middle h-12">
                        <th className="py-3 px-3 rounded-tl-lg pl-3 text-center align-middle">Order ID</th>
                        <th className="py-3 px-3 text-center align-middle">Date</th>
                        <th className="py-3 px-3 text-center align-middle">Time</th>
                        <th className="py-3 px-3 text-center align-middle">Products</th>
                        <th className="py-3 px-3 text-center align-middle">Payment Method</th>
                        <th className="py-3 px-3 text-center align-middle">Delivery Option</th>
                        <th className="py-3 px-3 text-center align-middle">Total</th>
                        <th className="py-3 px-3 text-center align-middle">Status</th>
                        <th className="py-3 px-3 rounded-tr-xl text-center align-middle">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td className="py-6 text-center text-gray-500" colSpan={9}>Loading…</td>
                        </tr>
                      ) : filteredOrders.length === 0 ? (
                        <tr>
                          <td className="py-6 text-center text-gray-500" colSpan={9}>No orders</td>
                        </tr>
                      ) : filteredOrders.map((order) => (
                        <tr key={order._id} className="border-t align-middle">
                          <td className="py-2 px-3 text-center align-middle">{order.orderNumber || order._id}</td>
                          <td className="py-2 px-3 text-center align-middle">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="py-2 px-3 text-center align-middle">{new Date(order.createdAt).toLocaleTimeString()}</td>
                          <td className="py-2 px-3 text-center align-middle">
                            {order.items?.map(item => `${item.title || item.listing?.title} x ${item.quantity}`).join(', ')}
                          </td>
                          <td className="py-2 px-3 text-center align-middle">{capitalizeFirst(order.paymentMethod)}</td>
                          <td className="py-2 px-3 text-center align-middle">{capitalizeFirst(order.deliveryType)}</td>
                          <td className="py-2 px-3 text-center align-middle">LKR {order.total?.toFixed(2)}</td>
                          <td className="py-2 px-3 text-center align-middle">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}>
                              {capitalizeFirst(order.status || 'not_ready')}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center align-middle">
  <select
    value={order.status || 'NOT READY'}
    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
    className="px-2 py-1 border rounded-md text-sm"
    disabled={order.status === 'CANCELLED'} // <-- disable if cancelled
  >
    <option value="NOT READY">Not Ready</option>
    <option value="READY">Ready</option>
    <option value="CANCELLED">Cancel</option>
  </select>
</td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <Card className="col-span-1">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">New Orders</div>
                    <div className="text-2xl font-semibold mt-1">{recentOrdersCount.toLocaleString()} <span className="text-green-600 text-xs align-middle">last 24h</span></div>
                    <div className="mt-3">
                      <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">Rolling 24 hours</span>
                    </div>
                  </div>
                  <div className="w-24 h-24 bg-violet-100 rounded-lg grid place-items-center">
                    <TrendingUp className="w-12 h-12 text-violet-600" />
                  </div>
                </div>
              </Card>
              <Card className="col-span-1">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Total Orders</div>
                    <div className="text-2xl font-semibold mt-1">{totalOrdersCount.toLocaleString()} <span className="text-green-600 text-xs align-middle">total</span></div>
                    <div className="mt-3 text-xs text-gray-600">All orders</div>
                  </div>
                  <div className="w-24 h-24 bg-blue-100 rounded-lg grid place-items-center">
                    <Package className="w-12 h-12 text-blue-600" />
                  </div>
                </div>
              </Card>
              <Card className="col-span-1">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Cancelled Orders</div>
                    <div className="text-2xl font-semibold mt-1">{cancelledOrdersCount.toLocaleString()}</div>
                    <div className="mt-3 text-xs text-gray-600">Total cancelled</div>
                  </div>
                  <div className="w-24 h-24 bg-red-100 rounded-lg grid place-items-center">
                    <XCircle className="w-12 h-12 text-red-600" />
                  </div>
                </div>
              </Card>
              <Card className="col-span-1">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                    <div className="text-2xl font-semibold mt-1">LKR {totalRevenue.toFixed(2)}</div>
                    <div className="mt-3 text-xs text-gray-600">From active orders</div>
                  </div>
                  <div className="w-24 h-24 bg-green-100 rounded-lg grid place-items-center">
                    <DollarSign className="w-12 h-12 text-green-600" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <Card className="col-span-2">
                <div className="p-4">
                  <div className="text-sm text-gray-700 font-medium mb-2">Order Growth</div>
                  <div className="rounded-lg border border-dashed">
                    <LineChart categories={orderGrowth.categories} series={[{ name: 'Orders', data: orderGrowth.data }]} color="#3b82f6" />
                  </div>
                </div>
              </Card>
              <Card className="col-span-2">
                <div className="p-4">
                  <div className="text-sm text-gray-700 font-medium mb-2">Revenue Growth</div>
                  <div className="rounded-lg border border-dashed">
                    <LineChart categories={revenueGrowth.categories} series={[{ name: 'Revenue', data: revenueGrowth.data }]} color="#22c55e" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <Card className="col-span-2">
                <div className="p-4">
                  <div className="text-sm text-gray-700 font-medium mb-2">Status Distribution</div>
                  <div className="grid grid-cols-[1fr,240px] gap-4">
                    <div className="grid place-items-center">
                      <div className="rounded-lg border border-dashed w-full max-w-[220px] relative">
                        <DonutChart
                          labels={statusList}
                          series={statusList.map(s => statusCounts[s])}
                          colors={statusList.map(s => colorMap[s])}
                        />
                        <div className="absolute inset-0 grid place-items-center pointer-events-none">
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Total orders</div>
                            <div className="text-lg font-semibold">{filteredOrders.length.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-9 h-9 rounded-lg bg-violet-100 grid place-items-center text-violet-600">📦</span>
                        <div>
                          <div className="text-xs text-gray-500">Total Orders</div>
                          <div className="font-semibold text-base">{filteredOrders.length}</div>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 my-3"></div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        {statusList.map((s, idx) => (
                          <div key={idx}>
                            <div className="flex items-center gap-2 text-gray-700">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMap[s] }}></span>
                              {capitalizeFirst(s)}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{statusCounts[s].toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
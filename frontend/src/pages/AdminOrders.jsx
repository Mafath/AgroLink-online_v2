import React, { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Correct import for table

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
  try {
    const res = await axiosInstance.get("/orders");
    const activeOrders = res.data.filter(order => order.status !== 'CANCELLED'); // <-- filter out cancelled
    setOrders(activeOrders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    toast.error("Failed to load orders");
  } finally {
    setLoading(false);
  }
};


  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Orders Report", 14, 20);

    // Table headers
    const tableColumn = ["Order ID", "Date", "Time", "Total (LKR)"];

    // Table rows
    const tableRows = orders.map(order => {
      const date = new Date(order.createdAt);
      return [
        order.orderNumber || order._id,
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        order.total?.toFixed(2) || "0.00",
      ];
    });

    // Create table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    // Grand total
    doc.text(`Grand Total: LKR ${totalRevenue.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);

    doc.save("orders_report.pdf");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none mx-0 w-full px-8 py-6">
        {/* Top bar */}
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
              <a href="/admin/logistics" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Logistics</a>
              <a href="/admin/orders" className="block px-3 py-2 rounded-lg bg-green-100 text-green-700">Orders</a>
            </nav>
          </div>

          {/* Main content */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">ORDER ID</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">DATE</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">TIME</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4">{order.orderNumber || order._id}</td>
                      <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{new Date(order.createdAt).toLocaleTimeString()}</td>
                      <td className="px-6 py-4">LKR {order.total?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-6 py-3 text-right" colSpan="3">NET TOTAL :</td>
                    <td className="px-6 py-3">LKR {totalRevenue.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;

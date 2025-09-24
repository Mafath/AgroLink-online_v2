import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import { Package, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-200 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
};

const MyOrders = () => {
  const { authUser } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!authUser) return;
      try {
        const res = await axiosInstance.get('orders/me');
        setOrders(res.data);
      } catch (err) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [authUser]);

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your orders</h1>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <button
            onClick={() => navigate('/delivery-tracking')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-black text-white hover:bg-gray-900"
          >
            <Truck className="w-4 h-4" />
            Delivery Tracking
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">You haven't placed any orders. Browse our marketplace to start shopping!</p>
            <button
              onClick={() => navigate('/marketplace')}
              className="btn-primary"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs text-gray-500">Order ID</span>
                    <span className="ml-2 font-semibold text-gray-900">{order.orderNumber || order._id}</span>
                  </div>
                  <button className={`px-3 py-1 rounded-full text-xs font-semibold focus:outline-none ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>{order.status}</button>
                </div>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div>
                    <span className="text-xs text-gray-500">Date</span>
                    <div className="font-medium text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Time</span>
                    <div className="font-medium text-gray-700">{new Date(order.createdAt).toLocaleTimeString()}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Total</span>
                    <div className="font-semibold text-green-700">LKR {order.total?.toFixed(2)}</div>
                  </div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Order Items</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                        <img src={item.image || (item.listing?.images?.[0] || '/placeholder-image.jpg')} alt={item.title || item.listing?.title} className="w-16 h-16 object-cover rounded-lg border" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.title || item.listing?.title}</div>
                          <div className="text-xs text-gray-500">Quantity: {item.quantity}</div>
                          <div className="text-xs text-gray-500">LKR {item.price?.toFixed(2)} each</div>
                        </div>
                      </div>
                    ))}
                  </div>
                    {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                      <button
                        onClick={async () => {
                          if (!window.confirm('Are you sure you want to cancel this order?')) return;
                          try {
                            const res = await axiosInstance.patch(`/orders/${order._id}/cancel`);
                            setOrders((prev) =>
                              prev.map((o) => (o._id === order._id ? { ...o, status: 'CANCELLED' } : o))
                            );
                            toast.success('Order cancelled successfully');
                          } catch (err) {
                            toast.error('Failed to cancel order');
                          }
                        }}
                        className="mt-2 px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold"
                      >
                        Cancel Order
                      </button>
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

export default MyOrders;

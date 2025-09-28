import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import { Package, Truck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';


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
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className='flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-700 text-emerald-700 rounded-full transition-colors hover:bg-emerald-50'
            >
              <ArrowLeft className='w-3.5 h-3.5' />
              <span className='text-xs'>Back</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          </div>
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
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs text-gray-500">Order ID</span>
                    <span className="ml-2 font-semibold text-gray-900">{order.orderNumber || order._id}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mb-4 items-end">
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
                  {order.deliveryType === 'DELIVERY' && (
                    <button
                      onClick={() => navigate(`/delivery-tracking/${order._id}`)}
                      disabled={order.status === 'CANCELLED'}
                      className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-2 ${
                        order.status === 'CANCELLED'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      <Truck className="w-4 h-4" /> Track delivery
                    </button>
                  )}
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
                    {order.status !== 'DELIVERED' && (() => {
                      const orderDate = new Date(order.createdAt);
                      const now = new Date();
                      const hoursSinceOrder = (now - orderDate) / (1000 * 60 * 60);
                      const canCancel = hoursSinceOrder < 24;
                      const isCancelled = order.status === 'CANCELLED';
                      const isDeliveryCompleted = order.delivery?.status === 'COMPLETED';
                      const isTimeExpired = !canCancel && !isCancelled && !isDeliveryCompleted;
                      
                      return (
                        <div>
                          <button
                            onClick={async () => {
                              if (isCancelled || isDeliveryCompleted) return;
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
                            disabled={isCancelled || isDeliveryCompleted || !canCancel}
                            className={`mt-2 px-3 py-1 rounded-lg text-xs font-semibold ${
                              isCancelled
                                ? 'bg-red-300 text-red-700 cursor-not-allowed opacity-60'
                                : isDeliveryCompleted
                                  ? 'bg-red-300 text-red-700 cursor-not-allowed opacity-60'
                                  : canCancel 
                                    ? 'bg-red-600 text-white hover:bg-red-700' 
                                    : 'bg-red-300 text-red-700 cursor-not-allowed opacity-60'
                            }`}
                          >
                            {isCancelled ? 'Cancelled' : 'Cancel Order'}
                          </button>
                          {isTimeExpired && (
                            <p className="text-xs text-gray-400 mt-1">
                              *Cannot cancel the order after 24 hrs
                            </p>
                          )}
                          {isCancelled && (
                            <p className="text-xs text-gray-400 mt-1">
                              *Order cancelled by you
                            </p>
                          )}
                          {isDeliveryCompleted && (
                            <p className="text-xs text-gray-400 mt-1">
                              *Cannot cancel the order after delivery is completed
                            </p>
                          )}
                        </div>
                      );
                    })()}
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

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import { Package, Truck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from "react-hot-toast";

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

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
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your orders</h1>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-lg font-medium bg-primary-600 text-white hover:bg-green-700"
          >
            Login
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders. Browse our marketplace to start shopping!
            </p>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-4 py-2 rounded-lg font-medium bg-primary-600 text-white hover:bg-green-700"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs text-gray-500">Order ID</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {order.orderNumber || order._id}
                    </span>
                  </div>
                </div>

                {/* Order meta info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-xs text-gray-500">Date</span>
                    <div className="font-medium text-gray-700">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Time</span>
                    <div className="font-medium text-gray-700">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Total</span>
                    <div className="font-semibold text-green-700">
                      LKR {order.total?.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-4 mt-4">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Order Items</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 bg-gray-50 rounded-lg p-3"
                      >
                        <img
                          src={
                            item.image ||
                            (item.listing?.images?.[0] || '/placeholder-image.jpg')
                          }
                          alt={item.title || item.listing?.title}
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {item.title || item.listing?.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            Quantity: {item.quantity}
                          </div>
                          <div className="text-xs text-gray-500">
                            LKR {item.price?.toFixed(2)} each
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4">
                    {order.status !== 'DELIVERED' && (() => {
                      const orderDate = new Date(order.createdAt);
                      const now = new Date();
                      const hoursSinceOrder = (now - orderDate) / (1000 * 60 * 60);
                      const canCancel = hoursSinceOrder < 24;
                      const isCancelled = order.status === 'CANCELLED';
                      const isDeliveryCompleted = order.delivery?.status === 'COMPLETED';
                      const isTimeExpired = !canCancel && !isCancelled && !isDeliveryCompleted;

                      return (
                        <div className="flex flex-col">
                          {/* Cancel button */}
                          <button
                            onClick={async () => {
                              if (isCancelled || isDeliveryCompleted) return;
                              if (
                                !window.confirm(
                                  'Are you sure you want to cancel this order?'
                                )
                              )
                                return;
                              try {
                                await axiosInstance.patch(
                                  `/orders/${order._id}/cancel`,
                                  { cancelledBy: 'user' }
                                );
                                setOrders((prev) =>
                                  prev.map((o) =>
                                    o._id === order._id
                                      ? {
                                          ...o,
                                          status: 'CANCELLED',
                                          cancelledBy: 'user',
                                        }
                                      : o
                                  )
                                );
                                toast.success('Order cancelled successfully');
                              } catch (err) {
                                console.error(
                                  'Error cancelling order:',
                                  err.response?.data?.error || err.message
                                );
                                toast.error(
                                  `Failed to cancel order: ${
                                    err.response?.data?.error || 'Unknown error'
                                  }`
                                );
                              }
                            }}
                            disabled={
                              isCancelled ||
                              isDeliveryCompleted ||
                              !canCancel ||
                              order.cancelledBy === 'admin'
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                              order.cancelledBy === 'admin'
                                ? 'bg-red-100 text-red-700 cursor-not-allowed opacity-60'
                                : isCancelled
                                ? 'bg-red-100 text-red-700 cursor-not-allowed opacity-60'
                                : isDeliveryCompleted
                                ? 'bg-red-100 text-red-700 cursor-not-allowed opacity-60'
                                : canCancel
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-red-100 text-red-700 cursor-not-allowed opacity-60'
                            }`}
                          >
                            {order.cancelledBy === 'admin'
                              ? 'Cancelled by AgroLink'
                              : isCancelled
                              ? 'Cancelled'
                              : 'Cancel Order'}
                          </button>

                          {/* Extra messages */}
                          {isTimeExpired && (
                            <p className="text-xs text-gray-400 mt-1">
                              *Cannot cancel the order after 24 hrs
                            </p>
                          )}
                          {isCancelled && order.cancelledBy === 'user' && (
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

                    {/* Delivery tracking */}
                    {order.deliveryType === 'DELIVERY' && (
                      <button
                        onClick={() => navigate(`/delivery-tracking/${order._id}`)}
                        disabled={order.status === 'CANCELLED'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-2 ${
                          order.status === 'CANCELLED'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        <Truck className="w-4 h-4" /> Track delivery
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;

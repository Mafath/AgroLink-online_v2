import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { CreditCard, Truck, Package, ArrowLeft, MapPin, User, Phone } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [checkoutData, setCheckoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: authUser?.fullName || '',
    phone: authUser?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    notes: ''
  });

  useEffect(() => {
    const savedCheckoutData = localStorage.getItem('checkoutData');
    if (savedCheckoutData) {
      setCheckoutData(JSON.parse(savedCheckoutData));
    } else {
      navigate('/cart');
    }
  }, [navigate]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setDeliveryAddress(prev => ({ ...prev, [name]: value }));
  };

  const handlePayment = async () => {
    if (!checkoutData) return;

    // Validate delivery address if delivery is selected
    if (checkoutData.deliveryType === 'DELIVERY') {
      const { fullName, phone, addressLine1, city, state, postalCode } = deliveryAddress;
      if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
        toast.error('Please fill in all required delivery address fields');
        return;
      }
    }

    setLoading(true);
    try {
      // Prepare order data
      const orderData = {
        items: checkoutData.cart.map(item => ({
          listingId: item.listingId || item.id,
          quantity: item.quantity
        })),
        deliveryType: checkoutData.deliveryType,
        contactName: deliveryAddress.fullName,
        contactPhone: deliveryAddress.phone,
        notes: deliveryAddress.notes,
        paymentMethod: 'CASH', // Default to cash for now
        ...(checkoutData.deliveryType === 'DELIVERY' && {
          deliveryAddress: {
            line1: deliveryAddress.addressLine1,
            line2: deliveryAddress.addressLine2,
            city: deliveryAddress.city,
            state: deliveryAddress.state,
            postalCode: deliveryAddress.postalCode,
          }
        })
      };

      console.log('Order data being sent:', JSON.stringify(orderData, null, 2));
      console.log('Auth token:', sessionStorage.getItem('accessToken'));
      
      const response = await axiosInstance.post('/orders', orderData);
      
      // Clear cart and checkout data
      localStorage.removeItem('cart');
      localStorage.removeItem('checkoutData');
      
      toast.success('Order placed successfully!');
      
      // Navigate to order confirmation or delivery page
      if (checkoutData.deliveryType === 'DELIVERY') {
        navigate('/delivery-address', { state: { orderId: response.data._id } });
      } else {
        navigate('/my-orders');
      }
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      toast.error(error.response?.data?.error?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <CreditCard className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="space-y-6">
            {/* Delivery Type Display */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Option</h2>
              <div className="flex items-center">
                {checkoutData.deliveryType === 'DELIVERY' ? (
                  <>
                    <Truck className="w-5 h-5 text-primary-600 mr-2" />
                    <span>Delivery - LKR 500</span>
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5 text-primary-600 mr-2" />
                    <span>Pickup - Free</span>
                  </>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={deliveryAddress.fullName}
                    onChange={handleAddressChange}
                    required
                    className="input w-full"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={deliveryAddress.phone}
                    onChange={handleAddressChange}
                    required
                    className="input w-full"
                    placeholder="07X XXX XXXX"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address (if delivery selected) */}
            {checkoutData.deliveryType === 'DELIVERY' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={deliveryAddress.addressLine1}
                      onChange={handleAddressChange}
                      required
                      className="input w-full"
                      placeholder="House No, Street"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={deliveryAddress.addressLine2}
                      onChange={handleAddressChange}
                      className="input w-full"
                      placeholder="Apartment, Landmark"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={deliveryAddress.city}
                        onChange={handleAddressChange}
                        required
                        className="input w-full"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                      <input
                        type="text"
                        name="state"
                        value={deliveryAddress.state}
                        onChange={handleAddressChange}
                        required
                        className="input w-full"
                        placeholder="Province"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={deliveryAddress.postalCode}
                        onChange={handleAddressChange}
                        required
                        className="input w-full"
                        placeholder="XXXXX"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes for Driver</label>
                    <textarea
                      name="notes"
                      value={deliveryAddress.notes}
                      onChange={handleAddressChange}
                      className="textarea w-full"
                      rows={3}
                      placeholder="Any special instructions..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH"
                  defaultChecked
                  className="mr-3"
                />
                <span>Cash on Delivery/Pickup</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border sticky top-4">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                {/* Items */}
                <div className="space-y-3 mb-6">
                  {checkoutData.cart.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <img
                        src={item.image || '/placeholder-image.jpg'}
                        alt={item.title}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        LKR {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>LKR {checkoutData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>LKR {checkoutData.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>LKR {checkoutData.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full btn-primary"
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

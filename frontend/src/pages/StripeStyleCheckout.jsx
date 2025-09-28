import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, CreditCard, Package, Truck, User, Mail, Phone } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { clearUserCart } from '../lib/cartUtils';
import toast from 'react-hot-toast';

const StripeStyleCheckout = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [checkoutData, setCheckoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || '',
    email: authUser?.email || '',
    phone: authUser?.phone || '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: ''
  });

  useEffect(() => {
    const savedCheckoutData = localStorage.getItem('checkoutData');
    if (savedCheckoutData) {
      setCheckoutData(JSON.parse(savedCheckoutData));
    } else {
      navigate('/cart');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
    // Format expiry date
    else if (name === 'expiryDate') {
      const formatted = value.replace(/\D/g, '').replace(/(.{2})/, '$1/');
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
    // Format CVC (only numbers, max 4 digits)
    else if (name === 'cvc') {
      const formatted = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePayment = async () => {
    if (!checkoutData) return;

    // Basic validation
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error('Please fill in all required contact information');
      return;
    }

    // Card validation if card payment is selected
    if (paymentMethod === 'CARD') {
      if (!formData.cardNumber || !formData.expiryDate || !formData.cvc || !formData.cardholderName) {
        toast.error('Please fill in all required card details');
        return;
      }
    }

    // Additional validation for delivery
    if (checkoutData.deliveryType === 'DELIVERY') {
      if (!formData.addressLine1 || !formData.city || !formData.state || !formData.postalCode) {
        toast.error('Please fill in all required delivery address fields');
        return;
      }
    }

    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Validate cart items
      const invalidItems = checkoutData.cart.filter(item => !item.itemId || !['inventory', 'listing'].includes(item.itemType));
      if (invalidItems.length > 0) {
        console.error('Invalid cart items found:', invalidItems);
        toast.error('Some items in your cart are invalid. Please refresh and try again.');
        return;
      }

      // Prepare order data
      const orderData = {
        items: checkoutData.cart.map(item => {
          if (item.itemType === 'inventory') {
            return {
              inventoryId: item.itemId,
              quantity: item.quantity
            };
          } else if (item.itemType === 'listing') {
            return {
              listingId: item.itemId,
              quantity: item.quantity
            };
          } else {
            throw new Error(`Invalid item type: ${item.itemType}`);
          }
        }),
        deliveryType: checkoutData.deliveryType,
        contactName: formData.fullName,
        contactPhone: formData.phone,
        contactEmail: formData.email,
        notes: '',
        paymentMethod: paymentMethod
      };

      // Add delivery address if delivery type is selected
      if (checkoutData.deliveryType === 'DELIVERY') {
        orderData.deliveryAddress = {
          line1: formData.addressLine1 || '',
          line2: formData.addressLine2 || '',
          city: formData.city || '',
          state: formData.state || '',
          postalCode: formData.postalCode || ''
        };
      }

      console.log('=== DEBUGGING ORDER CREATION ===');
      console.log('Original cart items:', checkoutData.cart);
      console.log('Mapped order items:', orderData.items);
      console.log('Sending order data:', JSON.stringify(orderData, null, 2));
      console.log('Checkout data:', JSON.stringify(checkoutData, null, 2));
      console.log('Form data:', formData);
      
      const response = await axiosInstance.post('/orders', orderData);
      
      // Clear user-specific cart and checkout data
      if (authUser) {
        // Get all purchased item IDs from checkoutData
        const purchasedItemIds = checkoutData.cart.map(item => item.itemId);
        
        // Call the backend endpoint to clear only purchased items
        await axiosInstance.post('/cart/clear', { purchasedItemIds });
      }
      localStorage.removeItem('checkoutData');
      
      // Show success modal
      setOrderId(response.data.orderNumber || response.data._id);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('=== ERROR DETAILS ===');
      console.error('Full error object:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error code:', error.response?.data?.error?.code);
      console.error('Error message:', error.response?.data?.error?.message);
      
      // Show more specific error message
      const errorMessage = error.response?.data?.error?.message || 'Payment failed. Please try again.';
      console.error('Final error message:', errorMessage);
      toast.error(errorMessage);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-700 text-emerald-700 rounded-full transition-colors hover:bg-emerald-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="text-xs">Back</span>
            </button>
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-teal-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Payment</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Forms */}
          <div className="space-y-6">
            
            {/* Delivery Option Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Option</h2>
              <div className="flex items-center">
                {checkoutData.deliveryType === 'PICKUP' ? (
                  <>
                    <Package className="w-5 h-5 text-teal-600 mr-3" />
                    <span className="text-gray-700">Pickup - Free</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-5 h-5 text-teal-600 mr-3" />
                    <span className="text-gray-700">Delivery - LKR 500</span>
                  </>
                )}
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="07X XXX XXXX"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH"
                    checked={paymentMethod === 'CASH'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-gray-700">Cash on Delivery/Pickup</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-gray-700">Credit/Debit Card</span>
                </label>
              </div>

              {/* Card Details - Only show if card payment is selected */}
              {paymentMethod === 'CARD' && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="1234 1234 1234 1234"
                      maxLength="19"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="MM/YY"
                        maxLength="5"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVC *</label>
                      <input
                        type="text"
                        name="cvc"
                        value={formData.cvc}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="CVC"
                        maxLength="4"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name *</label>
                    <input
                      type="text"
                      name="cardholderName"
                      value={formData.cardholderName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Full name on card"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Address - Only show if delivery is selected */}
            {checkoutData?.deliveryType === 'DELIVERY' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="House No, Street"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Apartment, Landmark"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="City"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select province</option>
                        <option value="Western">Western</option>
                        <option value="Central">Central</option>
                        <option value="Southern">Southern</option>
                        <option value="Northern">Northern</option>
                        <option value="Eastern">Eastern</option>
                        <option value="North Western">North Western</option>
                        <option value="North Central">North Central</option>
                        <option value="Uva">Uva</option>
                        <option value="Sabaragamuwa">Sabaragamuwa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="XXXXX"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
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
              <div className="space-y-2 border-t pt-4">
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

              {/* Place Order Button */}
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full mt-6 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              {/* Success Message */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Placed Successfully!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your order has been placed successfully. Order ID: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{orderId}</span>
              </p>
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-sm p-3">
                Please check your email for the order confirmation and next steps.
              </div>
              
              {/* Order Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-700">
                  <div className="flex justify-between mb-1">
                    <span>Total Paid:</span>
                    <span className="font-semibold">LKR {checkoutData?.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Payment Method:</span>
                    <span>{paymentMethod === 'CARD' ? 'Card Payment' : 'Cash on Delivery/Pickup'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span>{checkoutData?.deliveryType === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/marketplace')}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => navigate('/my-orders')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  View My Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StripeStyleCheckout;
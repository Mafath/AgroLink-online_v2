import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, CreditCard, Lock, Shield } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

const StripeStyleCheckout = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [checkoutData, setCheckoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: authUser?.email || '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
    country: 'Sri Lanka'
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
    if (!formData.email || !formData.cardNumber || !formData.expiryDate || !formData.cvc || !formData.cardholderName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Prepare order data
      const orderData = {
        items: checkoutData.cart.map(item => ({
          listingId: item.listingId || item.id,
          quantity: item.quantity
        })),
        deliveryType: checkoutData.deliveryType,
        contactName: formData.cardholderName,
        contactPhone: authUser?.phone || '',
        notes: '',
        paymentMethod: 'CARD',
        email: formData.email
      };

      const response = await axiosInstance.post('/orders', orderData);
      
      // Clear cart and checkout data
      localStorage.removeItem('cart');
      localStorage.removeItem('checkoutData');
      
      toast.success('Payment successful! Your order has been placed.');
      
      // Navigate to order confirmation
      if (checkoutData.deliveryType === 'DELIVERY') {
        navigate('/delivery-address', { state: { orderId: response.data._id } });
      } else {
        navigate('/my-orders');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
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
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <Lock className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm text-gray-600">Secure checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Order Summary - Left Side */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Pay {authUser?.email || 'customer'}
                </h2>
                <div className="text-3xl font-bold text-gray-900">
                  LKR {checkoutData.total.toFixed(2)}
                </div>
              </div>

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
                    <span>Total due</span>
                    <span>LKR {checkoutData.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form - Right Side */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Or pay with card</h2>
              
              <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {/* Card Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card information</label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1234 1234 1234 1234"
                      maxLength="19"
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="MM/YY"
                        maxLength="5"
                        required
                      />
                      <input
                        type="text"
                        name="cvc"
                        value={formData.cvc}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="CVC"
                        maxLength="4"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Card Logos */}
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-gray-500">We accept:</span>
                    <div className="flex space-x-1">
                      <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">V</div>
                      <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">M</div>
                      <div className="w-8 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">A</div>
                    </div>
                  </div>
                </div>

                {/* Cardholder Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder name</label>
                  <input
                    type="text"
                    name="cardholderName"
                    value={formData.cardholderName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Full name on card"
                    required
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country or region</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Sri Lanka">Sri Lanka</option>
                    <option value="India">India</option>
                    <option value="USA">United States</option>
                    <option value="UK">United Kingdom</option>
                  </select>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Shield className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900">Secure Payment</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Your payment information is encrypted and processed securely. This is a demo environment - no real charges will be made.
                  </p>
                </div>

                {/* Pay Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
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
                    `Pay LKR ${checkoutData.total.toFixed(2)}`
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <span>Powered by</span>
                    <span className="font-semibold text-gray-700 ml-1">stripe</span>
                  </div>
                  <div className="flex space-x-4">
                    <a href="#" className="hover:text-gray-700">Terms</a>
                    <a href="#" className="hover:text-gray-700">Privacy</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeStyleCheckout;

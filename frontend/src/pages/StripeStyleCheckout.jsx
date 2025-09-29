import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, CreditCard, Package, Truck, User, Mail, Phone, Calendar } from 'lucide-react';
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
  const [errors, setErrors] = useState({});
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [tempMonth, setTempMonth] = useState('');
  const [tempYear, setTempYear] = useState('');

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
  const newErrors = { ...errors };

  // Prevent invalid characters based on field
  if (name === 'fullName' || name === 'cardholderName') {
    // Allow only letters, spaces, and periods
    if (value && !/^[a-zA-Z\s.]*$/.test(value)) {
      newErrors[name] = 'Only letters, spaces, and periods allowed';
      setErrors(newErrors);
      return;
    } else {
      delete newErrors[name];
    }
  } else if (name === 'phone') {
    // Allow only digits, enforce "0" as first digit, "7" as second digit, up to 10 digits
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue) {
      if (cleanValue.length >= 1 && cleanValue[0] !== '0') {
        newErrors.phone = 'Phone number must start with 0';
        setErrors(newErrors);
        return;
      }
      if (cleanValue.length >= 2 && cleanValue[1] !== '7') {
        newErrors.phone = 'Second digit must be 7';
        setErrors(newErrors);
        return;
      }
      if (!/^\d{0,10}$/.test(cleanValue)) {
        newErrors.phone = 'Only digits allowed, up to 10';
        setErrors(newErrors);
        return;
      }
      delete newErrors.phone;
    } else {
      delete newErrors.phone;
    }
  } else if (name === 'cardNumber') {
    // Allow only digits
    const cleanValue = value.replace(/\s/g, '');
    if (cleanValue && !/^\d*$/.test(cleanValue)) {
      newErrors.cardNumber = 'Only digits allowed';
      setErrors(newErrors);
      return;
    } else {
      delete newErrors.cardNumber;
    }
    const formatted = cleanValue.replace(/(.{4})/g, '$1 ').trim();
    setFormData(prev => ({ ...prev, [name]: formatted }));
    return;
  } else if (name === 'expiryDate') {
    // Allow only digits and forward slash
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue && !/^\d{0,4}$/.test(cleanValue)) {
      newErrors.expiryDate = 'Only digits allowed';
      setErrors(newErrors);
      return;
    } else {
      delete newErrors.expiryDate;
    }
    const formatted = cleanValue.replace(/(.{2})/, '$1/').slice(0, 5);
    setFormData(prev => ({ ...prev, [name]: formatted }));
    return;
  } else if (name === 'cvc') {
    // Allow only 3 digits
    if (value && !/^\d{0,3}$/.test(value)) {
      newErrors.cvc = 'Only digits allowed, up to 3';
      setErrors(newErrors);
      return;
    } else {
      delete newErrors.cvc;
    }
  } else if (name === 'city') {
    // Allow only letters and spaces
    if (value && !/^[a-zA-Z\s]*$/.test(value)) {
      newErrors.city = 'Only letters and spaces allowed';
      setErrors(newErrors);
      return;
    } else {
      delete newErrors.city;
    }
  } else if (name === 'postalCode') {
    // Allow only 5 digits
    if (value && !/^\d{0,5}$/.test(value)) {
      newErrors.postalCode = 'Only digits allowed, up to 5';
      setErrors(newErrors);
      return;
    } else {
      delete newErrors.postalCode;
    }
  } else if (name === 'addressLine1' || name === 'addressLine2') {
    // Allow any characters, validation for content will be in validateForm
    delete newErrors[name];
  }

  setErrors(newErrors);
  setFormData(prev => ({ ...prev, [name]: value }));
};

  const openExpiryPicker = () => {
    let initialMonth = '';
    let initialYear = '';
    if (formData.expiryDate) {
      const [m, y] = formData.expiryDate.split('/');
      initialMonth = m?.trim().padStart(2, '0') || '';
      initialYear = y?.trim() || '';
    } else {
      const now = new Date();
      initialMonth = (now.getMonth() + 1).toString().padStart(2, '0');
      initialYear = ('' + now.getFullYear()).slice(2);
    }
    setTempMonth(initialMonth);
    setTempYear(initialYear);
    setShowExpiryPicker(true);
  };

  const saveExpiryDate = () => {
    if (tempMonth && tempYear) {
      setFormData(prev => ({ ...prev, expiryDate: `${tempMonth}/${tempYear}` }));
    }
    setShowExpiryPicker(false);
  };

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    const fullName = formData.fullName.trim();
    if (!fullName) {
      newErrors.fullName = 'Full name is required';
    } else if (!/^[a-zA-Z\s.]+$/.test(fullName)) {
      newErrors.fullName = 'Name can only contain letters, spaces, and periods';
    }

    // Email validation
    const email = formData.email.trim();
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone validation
    const phone = formData.phone.trim();
    if (!phone) {
      newErrors.phone = 'Phone is required';
    } else if (!/^07\d{8}$/.test(phone)) {
      newErrors.phone = 'Phone must start with 07 and have exactly 10 digits';
    }

    // Card details if CARD selected
    if (paymentMethod === 'CARD') {
      // Card Number
      const cardNumberClean = formData.cardNumber.replace(/\s/g, '');
      if (!cardNumberClean) {
        newErrors.cardNumber = 'Card number is required';
      } else if (!/^\d{13,19}$/.test(cardNumberClean)) {
        newErrors.cardNumber = 'Invalid card number (13-19 digits)';
      }

      // Expiry Date
      if (!formData.expiryDate) {
        newErrors.expiryDate = 'Expiry date is required';
      } else {
        const [monthStr, yearStr] = formData.expiryDate.split('/');
        const month = parseInt(monthStr?.trim() || '0');
        const year = parseInt(yearStr?.trim() || '0');
        if (isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 0 || year > 99) {
          newErrors.expiryDate = 'Invalid expiry date format (MM/YY)';
        } else {
          const fullYear = 2000 + year;
          const expDate = new Date(fullYear, month - 1, 1);
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          if (fullYear < currentYear || (fullYear === currentYear && month - 1 < currentMonth)) {
            newErrors.expiryDate = 'Card has expired';
          }
        }
      }

      // CVC
      if (!formData.cvc) {
        newErrors.cvc = 'CVC is required';
      } else if (!/^\d{3}$/.test(formData.cvc)) {
        newErrors.cvc = 'CVC must be exactly 3 digits';
      }

      // Cardholder Name
      const cardholderName = formData.cardholderName.trim();
      if (!cardholderName) {
        newErrors.cardholderName = 'Cardholder name is required';
      } else if (!/^[a-zA-Z\s.]+$/.test(cardholderName)) {
        newErrors.cardholderName = 'Name can only contain letters, spaces, and periods';
      }
    }

    // Delivery address if DELIVERY
    if (checkoutData?.deliveryType === 'DELIVERY') {
      // Address Line 1
      const addressLine1 = formData.addressLine1.trim();
      if (!addressLine1) {
        newErrors.addressLine1 = 'Address Line 1 is required';
      } else {
        const cleaned1 = addressLine1.replace(/\s/g, '');
        if (/^\d+$/.test(cleaned1)) {
          newErrors.addressLine1 = 'Address cannot contain only numbers';
        } else if (/^[^a-zA-Z]+$/.test(cleaned1)) {
          newErrors.addressLine1 = 'Address must contain at least one letter';
        }
      }

      // Address Line 2 (optional, but validate if present)
      const addressLine2 = formData.addressLine2.trim();
      if (addressLine2) {
        const cleaned2 = addressLine2.replace(/\s/g, '');
        if (/^\d+$/.test(cleaned2)) {
          newErrors.addressLine2 = 'Address cannot contain only numbers';
        } else if (/^[^a-zA-Z]+$/.test(cleaned2)) {
          newErrors.addressLine2 = 'Address must contain at least one letter';
        }
      }

      // City
      const city = formData.city.trim();
      if (!city) {
        newErrors.city = 'City is required';
      } else if (!/^[a-zA-Z\s]+$/.test(city)) {
        newErrors.city = 'City can only contain letters and spaces';
      }

      // State/Province
      if (!formData.state) {
        newErrors.state = 'Province is required';
      }

      // Postal Code
      const postalCode = formData.postalCode.trim();
      if (!postalCode) {
        newErrors.postalCode = 'Postal code is required';
      } else if (!/^\d{5}$/.test(postalCode)) {
        newErrors.postalCode = 'Postal code must be exactly 5 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!checkoutData) return;

    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
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
              <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
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
              <p className="text-sm text-gray-600 mt-2">
                {checkoutData.deliveryType === 'PICKUP' 
                  ? 'You can collect your order from our warehouse at Galle Road, Colombo 03. Please collect your order within 2-3 days, otherwise it will be cancelled.'
                  : 'Will take 2-3 business days'}
              </p>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-sm text-gray-600 mb-4">You will be receiving the order confirmation to the email you provide</p>
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
                      className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.fullName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
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
                      className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
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
                      className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="07X XXX XXXX"
                      maxLength="10"
                      required
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
              <p className="text-sm text-gray-600 mb-4">Select your preferred payment option. All transactions are secure and encrypted.</p>
              <div className="space-y-4">
                {checkoutData.deliveryType === 'DELIVERY' && (
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH"
                      checked={paymentMethod === 'CASH'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-gray-700">Cash on Delivery</span>
                  </label>
                )}
                {checkoutData.deliveryType === 'PICKUP' && (
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH"
                      checked={paymentMethod === 'CASH'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-gray-700">Pay at Seller</span>
                  </label>
                )}
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

              {paymentMethod === 'CARD' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-end space-x-2 mb-4">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/800px-Mastercard_2019_logo.svg.png" alt="Mastercard" className="h-6" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/800px-PayPal.svg.png" alt="PayPal" className="h-6" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/800px-Stripe_Logo%2C_revised_2016.svg.png" alt="Stripe" className="h-6" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="1234 1234 1234 1234"
                        maxLength="19"
                        required
                      />
                      {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                        <div className="relative">
                          <input
                            type="text"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent pr-8 ${
                              errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="MM/YY"
                            maxLength="5"
                            required
                          />
                          <button
                            type="button"
                            onClick={openExpiryPicker}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        </div>
                        {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVC *</label>
                        <input
                          type="text"
                          name="cvc"
                          value={formData.cvc}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                            errors.cvc ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="CVC"
                          maxLength="3"
                          required
                        />
                        {errors.cvc && <p className="text-red-500 text-xs mt-1">{errors.cvc}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name *</label>
                      <input
                        type="text"
                        name="cardholderName"
                        value={formData.cardholderName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          errors.cardholderName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Full name on card"
                        required
                      />
                      {errors.cardholderName && <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Address - Only show if delivery is selected */}
            {checkoutData?.deliveryType === 'DELIVERY' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h2>
                <p className="text-sm text-gray-600 mb-4">Provide accurate information to ensure seamless delivery. Your data is safe with us.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.addressLine1 ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="House No, Street"
                      required
                    />
                    {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.addressLine2 ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Apartment, Landmark"
                    />
                    {errors.addressLine2 && <p className="text-red-500 text-xs mt-1">{errors.addressLine2}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="City"
                        required
                      />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          errors.state ? 'border-red-500' : 'border-gray-300'
                        }`}
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
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          errors.postalCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="XXXXX"
                        maxLength="5"
                        required
                      />
                      {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
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

      {/* Expiry Date Picker Modal */}
      {showExpiryPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Select Expiry Date</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={tempMonth}
                  onChange={(e) => setTempMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Month</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m.toString().padStart(2, '0')}>
                      {m.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={tempYear}
                  onChange={(e) => setTempYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Year</option>
                  {Array.from({ length: 11 }, (_, i) => {
                    const currentYear = new Date().getFullYear();
                    const year = currentYear + i;
                    return (
                      <option key={year} value={('' + year).slice(2)}>
                        {('' + year).slice(2)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowExpiryPicker(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveExpiryDate}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Placed Successfully!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your order has been placed successfully. Order ID: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{orderId}</span>
              </p>
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-sm p-3">
                Please check your email for the order confirmation and next steps.
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-700">
                  <div className="flex justify-between mb-1">
                    <span>Total Paid:</span>
                    <span className="font-semibold">LKR {checkoutData?.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Payment Method:</span>
                    <span>{paymentMethod === 'CARD' ? 'Card Payment' : checkoutData?.deliveryType === 'DELIVERY' ? 'Cash on Delivery' : 'Pay at Seller'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span>{checkoutData?.deliveryType === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}</span>
                  </div>
                </div>
              </div>
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
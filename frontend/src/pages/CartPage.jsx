import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShoppingCart, Truck, Package, Trash2, Plus, Minus } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { 
  getUserCart, 
  saveUserCart, 
  updateUserCartItemQuantity, 
  removeFromUserCart 
} from '../lib/cartUtils';

const CartPage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deliveryType, setDeliveryType] = useState('PICKUP');

  useEffect(() => {
    // Load user-specific cart from localStorage
    if (authUser) {
      const userId = authUser._id || authUser.id;
      const userCart = getUserCart(userId);
      setCart(userCart);
    } else {
      setCart([]);
    }
  }, [authUser]);

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1 || !authUser) return;
    
    const userId = authUser._id || authUser.id;
    const item = cart[index];
    const maxQuantity = item.stockQuantity || item.capacity;
    
    // Check if new quantity exceeds available capacity/stock
    if (maxQuantity && newQuantity > maxQuantity) {
      toast.error(`Quantity cannot exceed available ${item.stockQuantity ? 'stock' : 'capacity'} (${maxQuantity} ${item.stockQuantity ? 'units' : 'kg'})`);
      return;
    }
    
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    setCart(updatedCart);
    saveUserCart(userId, updatedCart);
  };

  const removeItem = (index) => {
    if (!authUser) return;
    const userId = authUser._id || authUser.id;
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    saveUserCart(userId, updatedCart);
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDeliveryFee = () => {
    return deliveryType === 'DELIVERY' ? 500 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee();
  };

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    // Save cart and delivery type to localStorage for payment page
    localStorage.setItem('checkoutData', JSON.stringify({
      cart,
      deliveryType,
      subtotal: calculateSubtotal(),
      deliveryFee: calculateDeliveryFee(),
      total: calculateTotal()
    }));

    navigate('/stripe-checkout');
  };

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your cart</h1>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <ShoppingCart className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some items from the marketplace to get started</p>
            <button
              onClick={() => navigate('/marketplace')}
              className="btn-primary"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Cart Items</h2>
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <img
                          src={item.image || '/placeholder-image.jpg'}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600">LKR {item.price.toFixed(2)} each</p>
                          {(item.stockQuantity || item.capacity) && (
                            <p className="text-xs text-gray-500">
                              Available: {item.stockQuantity || item.capacity} {item.stockQuantity ? 'units' : 'kg'}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            LKR {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border sticky top-4">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                  
                  {/* Delivery Type Selection */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Delivery Option</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="deliveryType"
                          value="PICKUP"
                          checked={deliveryType === 'PICKUP'}
                          onChange={(e) => setDeliveryType(e.target.value)}
                          className="mr-3"
                        />
                        <Package className="w-4 h-4 mr-2" />
                        <span className="text-sm">Pickup (Free)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="deliveryType"
                          value="DELIVERY"
                          checked={deliveryType === 'DELIVERY'}
                          onChange={(e) => setDeliveryType(e.target.value)}
                          className="mr-3"
                        />
                        <Truck className="w-4 h-4 mr-2" />
                        <span className="text-sm">Delivery (LKR 500)</span>
                      </label>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>LKR {calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee</span>
                      <span>LKR {calculateDeliveryFee().toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>LKR {calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToPayment}
                    disabled={loading}
                    className="w-full btn-primary"
                  >
                    {loading ? 'Processing...' : 'Proceed to Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;

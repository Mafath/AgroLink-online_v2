import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShoppingCart, Truck, Package, Trash2, Plus, Minus, Check, ArrowLeft } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { 
  getUserCart, 
  updateUserCartItemQuantity, 
  removeFromUserCart 
} from '../lib/cartUtils';

const CartPage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deliveryType, setDeliveryType] = useState('PICKUP');
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    // Load user-specific cart from backend API
    const loadCart = async () => {
      if (authUser) {
        try {
          const userId = authUser._id || authUser.id;
          const userCart = await getUserCart(userId);
          setCart(userCart);
          // Initialize all items as selected by default
          setSelectedItems(new Set(userCart.map((_, index) => index)));
        } catch (error) {
          console.error('Error loading cart:', error);
          setCart([]);
          setSelectedItems(new Set());
        }
      } else {
        setCart([]);
        setSelectedItems(new Set());
      }
    };

    loadCart();
  }, [authUser]);

  const updateQuantity = async (index, newQuantity) => {
    if (newQuantity < 1 || !authUser) return;
    
    const userId = authUser._id || authUser.id;
    const item = cart[index];
    const maxQuantity = item.maxQuantity;
    
    // Check if new quantity exceeds available capacity/stock
    if (maxQuantity && newQuantity > maxQuantity) {
      toast.error(`Quantity cannot exceed available ${item.unit} (${maxQuantity} ${item.unit})`);
      return;
    }
    
    try {
      const success = await updateUserCartItemQuantity(userId, item.itemId, item.itemType, newQuantity);
      if (success) {
        // Reload cart to get updated data
        const updatedCart = await getUserCart(userId);
        setCart(updatedCart);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const removeItem = async (index) => {
    if (!authUser) return;
    
    const userId = authUser._id || authUser.id;
    const item = cart[index];
    
    try {
      const success = await removeFromUserCart(userId, item.itemId, item.itemType);
      if (success) {
        // Reload cart to get updated data
        const updatedCart = await getUserCart(userId);
        setCart(updatedCart);
        
        // Update selected items set
        const newSelectedItems = new Set();
        selectedItems.forEach(selectedIndex => {
          if (selectedIndex < index) {
            newSelectedItems.add(selectedIndex);
          } else if (selectedIndex > index) {
            newSelectedItems.add(selectedIndex - 1);
          }
          // Skip the removed item (selectedIndex === index)
        });
        setSelectedItems(newSelectedItems);
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const toggleItemSelection = (index) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(index)) {
      newSelectedItems.delete(index);
    } else {
      newSelectedItems.add(index);
    }
    setSelectedItems(newSelectedItems);
  };

  const selectAllItems = () => {
    setSelectedItems(new Set(cart.map((_, index) => index)));
  };

  const deselectAllItems = () => {
    setSelectedItems(new Set());
  };

  const getSelectedCartItems = () => {
    return cart.filter((_, index) => selectedItems.has(index));
  };

  const calculateSubtotal = () => {
    return getSelectedCartItems().reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDeliveryFee = () => {
    return deliveryType === 'DELIVERY' ? 500 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee();
  };

  const handleProceedToPayment = () => {
    const selectedCartItems = getSelectedCartItems();
    
    if (selectedCartItems.length === 0) {
      toast.error('Please select at least one item to proceed to checkout');
      return;
    }

    // Save selected cart items and delivery type to localStorage for payment page
    localStorage.setItem('checkoutData', JSON.stringify({
      cart: selectedCartItems,
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className='flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-700 text-emerald-700 rounded-full transition-colors hover:bg-emerald-50'
            >
              <ArrowLeft className='w-3.5 h-3.5' />
              <span className='text-xs'>Back</span>
            </button>
            <div className="flex items-center">
              <ShoppingCart className="w-8 h-8 text-primary-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            </div>
          </div>
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
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={selectAllItems}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={deselectAllItems}
                        className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <div key={index} className={`flex items-center space-x-4 p-4 border rounded-lg transition-colors ${
                        selectedItems.has(index) 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        {/* Selection Checkbox */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => toggleItemSelection(index)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              selectedItems.has(index)
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-gray-300 hover:border-blue-400'
                            }`}
                          >
                            {selectedItems.has(index) && (
                              <Check className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        <img
                          src={item.image || '/placeholder-image.jpg'}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600">LKR {item.price.toFixed(2)} per {item.unit}</p>
                          {item.maxQuantity && (
                            <p className="text-xs text-gray-500">
                              Available: {item.maxQuantity} {item.unit}
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
                  
                  {/* Selection Summary */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{selectedItems.size}</span> of <span className="font-medium">{cart.length}</span> items selected
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border sticky top-4">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                  
                  {/* Selected Items Count */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">{selectedItems.size}</span> item{selectedItems.size !== 1 ? 's' : ''} selected for checkout
                    </p>
                  </div>
                  
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
                      <span>Subtotal ({selectedItems.size} items)</span>
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
                    disabled={loading || selectedItems.size === 0}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-200 ${
                      selectedItems.size === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                  >
                    {loading ? 'Processing...' : `Proceed to Payment (${selectedItems.size} items)`}
                  </button>
                  
                  {selectedItems.size === 0 && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Select items to proceed to checkout
                    </p>
                  )}
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
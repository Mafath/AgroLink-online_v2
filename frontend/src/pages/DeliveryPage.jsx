import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { MapPin, User, Phone, Home, Building, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../assets/AgroLink logo3.png';

const DeliveryPage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.fullName || !formData.phone || !formData.addressLine1 || 
        !formData.city || !formData.state || !formData.postalCode) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Store delivery address in localStorage for later use
    localStorage.setItem('deliveryAddress', JSON.stringify(formData));
    
    toast.success('Delivery address saved successfully!');
    navigate('/marketplace');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={Logo} alt="AgroLink logo" className="w-16 h-16 rounded-2xl object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Information</h1>
          <p className="mt-2 text-gray-600">Please provide your delivery address details</p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-700 text-emerald-700 rounded-full transition-colors hover:bg-emerald-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-xs">Back</span>
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-soft p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-500" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="form-label">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="form-label">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary-500" />
                Delivery Address
              </h3>
              
              <div>
                <label htmlFor="addressLine1" className="form-label">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  id="addressLine1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Street address, P.O. box, company name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="addressLine2" className="form-label">
                  Address Line 2
                </label>
                <input
                  type="text"
                  id="addressLine2"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="form-label">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="City"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="state" className="form-label">
                    State/Province *
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="State"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="postalCode" className="form-label">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Postal code"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label htmlFor="notes" className="form-label">
                Delivery Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="input-field"
                rows={3}
                placeholder="Any special delivery instructions..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Save Delivery Address
              </button>
            </div>
          </form>
        </div>

        {/* User Info */}
        {authUser && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Logged in as: <span className="font-medium">{authUser.email}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryPage;

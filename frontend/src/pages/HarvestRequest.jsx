import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
)

const HarvestRequest = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();

  const [formData, setFormData] = useState({
    // Farmer Information (Auto-filled)
    farmerName: "",
    farmLocation: "",
    contactInfo: "",
    
    // Crop & Farm Details
    cropType: "",
    variety: "",
    plantingDate: "",
    farmSize: "",
    expectedYield: "",
    expectedHarvestPeriod: "",
    
    // Growing Conditions
    soilType: "",
    irrigationMethod: "",
    fertilizerUsed: "",
    pestDiseaseIssues: "",
    weatherConditions: "",
    
    // Harvest Requirements
    harvestMethodPreference: "",
    storageRequirements: "",
    transportationNeeds: "",
    qualityStandards: "",
    
    // Special Requests
    timingConstraints: "",
    budgetConsiderations: "",
    additionalServices: "",
    notes: "",
  });

  // Auto-fill farmer information from user profile
  useEffect(() => {
    if (authUser) {
      setFormData(prev => ({
        ...prev,
        farmerName: authUser.fullName || authUser.email || authUser.name || "",
        farmLocation: authUser.location || authUser.address || "",
        contactInfo: authUser.phone || authUser.email || "",
      }));
    }
  }, [authUser]);

  // Check if required fields are filled
  const isFormValid = () => {
    const basicValidation = formData.farmerName.trim() !== "" && 
           formData.cropType !== "" && 
           formData.expectedYield !== "" &&
           formData.expectedHarvestPeriod !== "";
    
    // Check date validation
    const dateValidation = !formData.plantingDate || !formData.expectedHarvestPeriod || 
           new Date(formData.expectedHarvestPeriod) >= new Date(formData.plantingDate);
    
    const isValid = basicValidation && dateValidation;
    
    // Debug logging to help identify the issue
    if (!isValid) {
      console.log('Form validation failed:', {
        farmerName: formData.farmerName,
        farmerNameTrimmed: formData.farmerName.trim(),
        farmerNameValid: formData.farmerName.trim() !== "",
        cropType: formData.cropType,
        cropTypeValid: formData.cropType !== "",
        expectedYield: formData.expectedYield,
        expectedYieldValid: formData.expectedYield !== "",
        expectedHarvestPeriod: formData.expectedHarvestPeriod,
        expectedHarvestPeriodValid: formData.expectedHarvestPeriod !== "",
        dateValidation: dateValidation,
        plantingDate: formData.plantingDate,
        harvestDate: formData.expectedHarvestPeriod
      });
    }
    
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent negative numbers for expected yield
    if (name === 'expectedYield' && value < 0) {
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check required fields
    if (!isFormValid()) {
      const missingFields = [];
      if (formData.farmerName.trim() === "") missingFields.push("Farmer Name");
      if (formData.cropType === "") missingFields.push("Crop Type");
      if (formData.expectedYield === "") missingFields.push("Expected Yield");
      if (formData.expectedHarvestPeriod === "") missingFields.push("Expected Harvest Period");
      
      // Check date validation
      if (formData.plantingDate && formData.expectedHarvestPeriod && 
          new Date(formData.expectedHarvestPeriod) < new Date(formData.plantingDate)) {
        toast.error("Harvest date cannot be before planting date");
        return;
      }
      
      toast.error(`Please fill in the required fields: ${missingFields.join(", ")}`);
      return;
    }
    
    try {
      const payload = {
        // Basic harvest request data (for existing API)
        farmerName: formData.farmerName,
        cropType: formData.cropType,
        expectedYield: Number(formData.expectedYield) || 0,
        harvestDate: formData.expectedHarvestPeriod,
        notes: formData.notes,
        
        // Extended personalized data (for future agronomist advice)
        personalizedData: {
          farmLocation: formData.farmLocation,
          contactInfo: formData.contactInfo,
          variety: formData.variety,
          plantingDate: formData.plantingDate,
          farmSize: formData.farmSize,
          expectedYield: formData.expectedYield,
          soilType: formData.soilType,
          irrigationMethod: formData.irrigationMethod,
          fertilizerUsed: formData.fertilizerUsed,
          pestDiseaseIssues: formData.pestDiseaseIssues,
          weatherConditions: formData.weatherConditions,
          harvestMethodPreference: formData.harvestMethodPreference,
          storageRequirements: formData.storageRequirements,
          transportationNeeds: formData.transportationNeeds,
          qualityStandards: formData.qualityStandards,
          timingConstraints: formData.timingConstraints,
          budgetConsiderations: formData.budgetConsiderations,
          additionalServices: formData.additionalServices,
        }
      };
      
      const { data } = await axiosInstance.post("/harvest/request", payload);
      console.log("Personalized Harvest Request Submitted:", data);
      toast.success("Personalized harvest schedule requested successfully! An agronomist will review your details and create a custom schedule.");
      navigate("/harvest-schedule");
    } catch (error) {
      console.error("Harvest request failed:", error);
      const message = error?.response?.data?.error?.message || "Failed to submit harvest request";
      toast.error(message);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button 
              onClick={() => navigate('/harvest-dashboard')}
              className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
              </svg>
              <span className='text-sm font-medium'>Back to Dashboard</span>
            </button>
            <div className='h-6 w-px bg-gray-300'></div>
            <div className='text-center'>
              <h1 className='text-4xl font-bold text-gray-900 mb-2'>🌱 Request Harvest Schedule</h1>
              <p className='text-gray-600'>Submit a new harvest schedule request for your crops</p>
            </div>
          </div>
        </div>

        <div className='max-w-4xl mx-auto'>
          <Card>
            <div className='p-6'>
              <form onSubmit={handleSubmit} className='space-y-8'>
                {/* Farmer Information Section */}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>👤 Farmer Information</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Farmer Name *
                      </label>
                      <input
                        type='text'
                        name='farmerName'
                        value={formData.farmerName}
                        onChange={handleChange}
                        className='input-field w-full'
                        placeholder='Auto-filled from profile'
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Farm Location
                      </label>
                      <input
                        type='text'
                        name='farmLocation'
                        value={formData.farmLocation}
                        onChange={handleChange}
                        className='input-field w-full'
                        placeholder='Enter farm location'
                      />
                    </div>
                  </div>
                </div>

                {/* Crop & Farm Details Section */}
                <div className='border-t border-gray-200 pt-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>🌱 Crop & Farm Details</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Crop Type *
                      </label>
                      <select
                        name='cropType'
                        value={formData.cropType}
                        onChange={handleChange}
                        className='input-field w-full'
                        required
                      >
                        <option value=''>Select crop type</option>
                        <option value='Tomatoes'>Tomatoes</option>
                        <option value='Wheat'>Wheat</option>
                        <option value='Corn'>Corn</option>
                        <option value='Rice'>Rice</option>
                        <option value='Potatoes'>Potatoes</option>
                        <option value='Onions'>Onions</option>
                        <option value='Carrots'>Carrots</option>
                        <option value='Lettuce'>Lettuce</option>
                        <option value='Other'>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Variety/Seed Type
                      </label>
                      <input
                        type='text'
                        name='variety'
                        value={formData.variety}
                        onChange={handleChange}
                        className='input-field w-full'
                        placeholder='e.g., Roma, Hybrid, Organic'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Planting Date
                      </label>
                      <input
                        type='date'
                        name='plantingDate'
                        value={formData.plantingDate}
                        onChange={handleChange}
                        className='input-field w-full'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Farm Size (acres/hectares)
                      </label>
                      <input
                        type='text'
                        name='farmSize'
                        value={formData.farmSize}
                        onChange={handleChange}
                        className='input-field w-full'
                        placeholder='e.g., 5 acres, 2 hectares'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Expected Yield (kg) *
                      </label>
                      <input
                        type='number'
                        name='expectedYield'
                        value={formData.expectedYield}
                        onChange={handleChange}
                        className='input-field w-full'
                        placeholder='Enter expected yield in kilograms'
                        min='0'
                        required
                      />
                    </div>
                    <div className='md:col-span-2'>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Expected Harvest Period *
                      </label>
                      <input
                        type='date'
                        name='expectedHarvestPeriod'
                        value={formData.expectedHarvestPeriod}
                        onChange={handleChange}
                        className='input-field w-full'
                        min={formData.plantingDate || new Date().toISOString().split('T')[0]}
                        required
                      />
                      {formData.plantingDate && formData.expectedHarvestPeriod && new Date(formData.expectedHarvestPeriod) < new Date(formData.plantingDate) && (
                        <p className='text-red-500 text-xs mt-1'>Harvest date cannot be before planting date</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Growing Conditions Section */}
                <div className='border-t border-gray-200 pt-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>🌿 Growing Conditions</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Soil Type
                      </label>
                      <select
                        name='soilType'
                        value={formData.soilType}
                        onChange={handleChange}
                        className='input-field w-full'
                      >
                        <option value=''>Select soil type</option>
                        <option value='Clay'>Clay</option>
                        <option value='Sandy'>Sandy</option>
                        <option value='Loamy'>Loamy</option>
                        <option value='Silty'>Silty</option>
                        <option value='Peaty'>Peaty</option>
                        <option value='Chalky'>Chalky</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Irrigation Method
                      </label>
                      <select
                        name='irrigationMethod'
                        value={formData.irrigationMethod}
                        onChange={handleChange}
                        className='input-field w-full'
                      >
                        <option value=''>Select irrigation method</option>
                        <option value='Drip'>Drip Irrigation</option>
                        <option value='Sprinkler'>Sprinkler</option>
                        <option value='Flood'>Flood Irrigation</option>
                        <option value='Rain-fed'>Rain-fed</option>
                        <option value='Manual'>Manual Watering</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Fertilizer Used
                      </label>
                      <select
                        name='fertilizerUsed'
                        value={formData.fertilizerUsed}
                        onChange={handleChange}
                        className='input-field w-full'
                      >
                        <option value=''>Select fertilizer type</option>
                        <option value='Organic'>Organic</option>
                        <option value='Chemical'>Chemical</option>
                        <option value='Mixed'>Mixed (Organic + Chemical)</option>
                        <option value='None'>None</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Current Pest/Disease Issues
                      </label>
                      <input
                        type='text'
                        name='pestDiseaseIssues'
                        value={formData.pestDiseaseIssues}
                        onChange={handleChange}
                        className='input-field w-full'
                        placeholder='Describe any current issues'
                      />
                    </div>
                    <div className='md:col-span-2'>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Recent Weather Conditions
                      </label>
                      <textarea
                        name='weatherConditions'
                        value={formData.weatherConditions}
                        onChange={handleChange}
                        rows='2'
                        className='input-field w-full'
                        placeholder='Describe recent weather patterns, rainfall, temperature, etc.'
                      />
                    </div>
                  </div>
                </div>

                {/* Harvest Requirements Section */}
                <div className='border-t border-gray-200 pt-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>🚜 Harvest Requirements</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Harvest Method Preference
                      </label>
                      <select
                        name='harvestMethodPreference'
                        value={formData.harvestMethodPreference}
                        onChange={handleChange}
                        className='input-field w-full'
                      >
                        <option value=''>Select harvest method</option>
                        <option value='Manual'>Manual Harvesting</option>
                        <option value='Mechanical'>Mechanical Harvesting</option>
                        <option value='Mixed'>Mixed (Manual + Mechanical)</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Storage Requirements
                      </label>
                      <select
                        name='storageRequirements'
                        value={formData.storageRequirements}
                        onChange={handleChange}
                        className='input-field w-full'
                      >
                        <option value=''>Select storage type</option>
                        <option value='Cold Storage'>Cold Storage</option>
                        <option value='Dry Storage'>Dry Storage</option>
                        <option value='Controlled Atmosphere'>Controlled Atmosphere</option>
                        <option value='Immediate Sale'>Immediate Sale</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Transportation Needs
                      </label>
                      <select
                        name='transportationNeeds'
                        value={formData.transportationNeeds}
                        onChange={handleChange}
                        className='input-field w-full'
                      >
                        <option value=''>Select transportation</option>
                        <option value='Local Delivery'>Local Delivery</option>
                        <option value='Long Distance'>Long Distance</option>
                        <option value='Export'>Export</option>
                        <option value='Self Transport'>Self Transport</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Quality Standards
                      </label>
                      <select
                        name='qualityStandards'
                        value={formData.qualityStandards}
                        onChange={handleChange}
                        className='input-field w-full'
                      >
                        <option value=''>Select quality standard</option>
                        <option value='Premium'>Premium Grade</option>
                        <option value='Standard'>Standard Grade</option>
                        <option value='Organic Certified'>Organic Certified</option>
                        <option value='Fair Trade'>Fair Trade</option>
                        <option value='No Specific'>No Specific Requirements</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Special Requests Section */}
                <div className='border-t border-gray-200 pt-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>⭐ Special Requests</h3>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Timing Constraints
                      </label>
                      <textarea
                        name='timingConstraints'
                        value={formData.timingConstraints}
                        onChange={handleChange}
                        rows='2'
                        className='input-field w-full'
                        placeholder='Any specific timing requirements, deadlines, or constraints...'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Budget Considerations
                      </label>
                      <textarea
                        name='budgetConsiderations'
                        value={formData.budgetConsiderations}
                        onChange={handleChange}
                        rows='2'
                        className='input-field w-full'
                        placeholder='Budget preferences, cost considerations, payment terms...'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Additional Services Needed
                      </label>
                      <textarea
                        name='additionalServices'
                        value={formData.additionalServices}
                        onChange={handleChange}
                        rows='2'
                        className='input-field w-full'
                        placeholder='Processing, packaging, marketing, consulting services...'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Additional Notes
                      </label>
                      <textarea
                        name='notes'
                        value={formData.notes}
                        onChange={handleChange}
                        rows='3'
                        className='input-field w-full'
                        placeholder='Any other special requirements, concerns, or information that would help create a personalized schedule...'
                      />
                    </div>
                  </div>
                </div>

                {/* Form Status & Submit Button */}
                <div className='pt-6 border-t border-gray-200'>
                  {/* Form Status Indicator */}
                  {!isFormValid() && (
                    <div className='mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                      <div className='flex items-center gap-2 mb-2'>
                        <svg className='w-5 h-5 text-yellow-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z' />
                        </svg>
                        <span className='text-sm font-medium text-yellow-800'>Required fields missing:</span>
                      </div>
                      <ul className='text-sm text-yellow-700 space-y-1'>
                        {formData.farmerName.trim() === "" && <li>• Farmer Name is required</li>}
                        {formData.cropType === "" && <li>• Crop Type is required</li>}
                        {formData.expectedYield === "" && <li>• Expected Yield is required</li>}
                        {formData.expectedHarvestPeriod === "" && <li>• Expected Harvest Period is required</li>}
                        {formData.plantingDate && formData.expectedHarvestPeriod && new Date(formData.expectedHarvestPeriod) < new Date(formData.plantingDate) && (
                          <li>• Harvest date cannot be before planting date</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  <div className='flex items-center justify-end gap-3'>
                    <button
                      type='button'
                      onClick={() => navigate('/harvest-dashboard')}
                      className='border border-gray-300 px-6 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                        isFormValid() 
                          ? 'btn-primary' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!isFormValid()}
                    >
                      Request Personalized Schedule
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HarvestRequest;


import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../lib/axios'
import { Calendar, MapPin, Users, Package, Clock, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const CreateHarvestSchedule = () => {
  const { harvestId } = useParams()
  const navigate = useNavigate()
  const [harvest, setHarvest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    // Basic Info
    cropVariety: '',
    farmLocation: {
      address: '',
      coordinates: { lat: '', lng: '' },
      soilType: ''
    },
    farmSize: {
      area: 0,
      unit: 'acres'
    },
    
    // Harvest Planning
    expectedHarvestDate: '',
    harvestDuration: 1,
    harvestMethod: 'Manual',
    expectedYield: {
      quantity: '',
      unit: 'kg'
    },
    
    // Resources
    laborRequired: {
      workers: 0,
      skills: []
    },
    equipment: [],
    transportation: [],
    storage: {
      type: '',
      capacity: '',
      duration: ''
    },
    
    // Timeline
    timeline: [
      {
        phase: 'Pre-harvest Preparation',
        activities: ['Field inspection', 'Equipment check'],
        startDate: '',
        duration: 1,
        status: 'Pending'
      },
      {
        phase: 'Harvest Execution',
        activities: ['Picking', 'Sorting', 'Packaging'],
        startDate: '',
        duration: 3,
        status: 'Pending'
      },
      {
        phase: 'Post-harvest Activities',
        activities: ['Quality check', 'Storage', 'Delivery'],
        startDate: '',
        duration: 1,
        status: 'Pending'
      }
    ],
    
    // Quality Standards
    qualityStandards: {
      size: '',
      color: '',
      ripeness: '',
      packaging: ''
    },
    
    // Risk Management
    risks: []
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const totalSteps = 4

  useEffect(() => {
    fetchHarvestDetails()
  }, [harvestId])

  const fetchHarvestDetails = async () => {
    try {
      const response = await axiosInstance.get(`/harvest/agronomist/assigned`)
      const harvestData = response.data.items.find(h => h._id === harvestId)
      
      if (!harvestData) {
        toast.error('Harvest not found')
        navigate('/agronomist-dashboard')
        return
      }

      setHarvest(harvestData)
      
      // Pre-fill form with harvest data
      setFormData(prev => ({
        ...prev,
        cropVariety: harvestData.crop || '',
        farmLocation: {
          address: harvestData.personalizedData?.farmLocation || '',
          coordinates: { lat: '', lng: '' },
          soilType: harvestData.personalizedData?.soilType || ''
        },
        farmSize: {
          area: parseFloat(harvestData.personalizedData?.farmSize) || 0,
          unit: 'acres'
        },
        expectedHarvestDate: harvestData.harvestDate || '',
        expectedYield: {
          quantity: parseFloat(harvestData.expectedYield) || 0,
          unit: 'kg'
        }
      }))
    } catch (error) {
      console.error('Failed to fetch harvest details:', error)
      toast.error('Failed to load harvest details')
      navigate('/agronomist')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

  }

  // Function to calculate automatic dates for timeline phases
  const calculateTimelineDates = (updatedTimeline) => {
    return updatedTimeline.map((phase, index) => {
      if (index === 0) {
        // First phase: keep the start date as is (user can edit it)
        return phase
      } else {
        // Subsequent phases: start date is end date of previous phase
        const previousPhase = updatedTimeline[index - 1]
        if (previousPhase.startDate && previousPhase.duration) {
          const previousStartDate = new Date(previousPhase.startDate)
          const previousEndDate = new Date(previousStartDate)
          previousEndDate.setDate(previousEndDate.getDate() + previousPhase.duration)
          
          return {
            ...phase,
            startDate: previousEndDate.toISOString().split('T')[0]
          }
        }
        return phase
      }
    })
  }

  const handleArrayChange = (field, index, value) => {
    if (field === 'timeline') {
      // For timeline changes, update the specific phase and recalculate dates
      const updatedTimeline = formData.timeline.map((item, i) => i === index ? value : item)
      const recalculatedTimeline = calculateTimelineDates(updatedTimeline)
      
      setFormData(prev => ({
        ...prev,
        timeline: recalculatedTimeline
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].map((item, i) => i === index ? value : item)
      }))
    }
  }

  const addArrayItem = (field, defaultValue) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], defaultValue]
    }))
  }

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const errors = []
    
    // Only validate Steps 3 & 4 (agronomist input)
    // Steps 1 & 2 are pre-filled from farmer request
    
    // Timeline validation (Step 3)
    formData.timeline.forEach((phase, index) => {
      if (!phase.phase.trim()) errors.push(`Phase ${index + 1} name is required`)
      if (!phase.duration || phase.duration <= 0) errors.push(`Phase ${index + 1} duration is required`)
      if (!phase.startDate) errors.push(`Phase ${index + 1} start date is required`)
    })
    
    // Quality standards validation (Step 4)
    if (!formData.qualityStandards.size.trim()) errors.push('Size requirements are required')
    if (!formData.qualityStandards.color.trim()) errors.push('Color standards are required')
    if (!formData.qualityStandards.ripeness.trim()) errors.push('Ripeness level is required')
    if (!formData.qualityStandards.packaging.trim()) errors.push('Packaging requirements are required')
    
    return errors
  }

  const handleSubmit = async () => {
    // Validate form first
    const errors = validateForm()
    if (errors.length > 0) {
      toast.error(`Please fill required fields: ${errors.join(', ')}`)
      return
    }

    setSubmitting(true)
    try {
      console.log('Sending schedule data:', formData)
      console.log('Harvest ID:', harvestId)
      await axiosInstance.post(`/harvest/${harvestId}/schedule`, formData)
      toast.success('Harvest schedule created successfully!')
      navigate('/agronomist')
    } catch (error) {
      console.error('Failed to create schedule:', error)
      console.error('Error response:', error.response)
      console.error('Error data:', error.response?.data)
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create harvest schedule'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Package className="w-5 h-5" />
        Basic Information (From Farmer Request)
      </h3>
      <p className="text-sm text-gray-600 mb-4">This information is pre-filled from the farmer's harvest request.</p>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Crop Variety</label>
          <input
            type="text"
            value={formData.cropVariety}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Farm Size</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={`${formData.farmSize.area} ${formData.farmSize.unit}`}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
              readOnly
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Farm Location</label>
        <input
          type="text"
          value={formData.farmLocation.address}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
          readOnly
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Soil Type</label>
        <input
          type="text"
          value={formData.farmLocation.soilType}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
          readOnly
        />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Harvest Planning (From Farmer Request)
      </h3>
      <p className="text-sm text-gray-600 mb-4">This information is pre-filled from the farmer's harvest request.</p>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Expected Harvest Date</label>
          <input
            type="text"
            value={formData.expectedHarvestDate ? new Date(formData.expectedHarvestDate).toLocaleDateString() : 'Not specified'}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Harvest Duration (days)</label>
          <input
            type="text"
            value={`${formData.harvestDuration} days`}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
            readOnly
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Harvest Method</label>
        <input
          type="text"
          value={formData.harvestMethod}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
          readOnly
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Expected Yield</label>
        <input
          type="text"
          value={`${formData.expectedYield.quantity} ${formData.expectedYield.unit}`}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
          readOnly
        />
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Users className="w-5 h-5" />
        Resources & Timeline (Agronomist Input)
      </h3>
      <p className="text-sm text-gray-600 mb-4">Fill in the resources and timeline details. All fields are required.</p>
      
      <div>
        <label className="block text-sm font-medium mb-1">Labor Required <span className="text-red-500">*</span></label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={formData.laborRequired.workers}
            onChange={(e) => handleChange('laborRequired.workers', parseInt(e.target.value))}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Workers"
            required
          />
          <input
            type="text"
            value={formData.laborRequired.skills.join(', ')}
            onChange={(e) => handleChange('laborRequired.skills', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Required skills (comma separated)"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Equipment Needed <span className="text-red-500">*</span></label>
        <div className="space-y-2">
          {formData.equipment.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleArrayChange('equipment', index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Equipment item"
              />
              <button
                type="button"
                onClick={() => removeArrayItem('equipment', index)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('equipment', '')}
            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            Add Equipment
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Timeline Phases <span className="text-red-500">*</span></label>
        <div className="space-y-3">
          {formData.timeline.map((phase, index) => (
            <div key={index} className="p-3 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phase Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={phase.phase}
                    onChange={(e) => handleArrayChange('timeline', index, { ...phase, phase: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Phase name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Duration (days) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    value={phase.duration}
                    onChange={(e) => handleArrayChange('timeline', index, { ...phase, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Duration (days)"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Activities <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={phase.activities.join(', ')}
                  onChange={(e) => handleArrayChange('timeline', index, { ...phase, activities: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                  placeholder="Activities (comma separated)"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Start Date {index === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="date"
                    value={phase.startDate}
                    onChange={(e) => handleArrayChange('timeline', index, { ...phase, startDate: e.target.value })}
                    readOnly={index > 0}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      index > 0 ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                    required={index === 0}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={phase.startDate && phase.duration ? 
                      new Date(new Date(phase.startDate).getTime() + (phase.duration * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] 
                      : ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <CheckCircle className="w-5 h-5" />
        Quality Standards & Review (Agronomist Input)
      </h3>
      <p className="text-sm text-gray-600 mb-4">Define quality standards and review the schedule. All fields are required.</p>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Size Requirements <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={formData.qualityStandards.size}
            onChange={(e) => handleChange('qualityStandards.size', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., Medium to large"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Color Standards <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={formData.qualityStandards.color}
            onChange={(e) => handleChange('qualityStandards.color', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., Red, fully ripe"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ripeness Level <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={formData.qualityStandards.ripeness}
            onChange={(e) => handleChange('qualityStandards.ripeness', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., 90-95%"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Packaging <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={formData.qualityStandards.packaging}
            onChange={(e) => handleChange('qualityStandards.packaging', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., 5kg boxes"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Storage Requirements</label>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            value={formData.storage.type}
            onChange={(e) => handleChange('storage.type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Storage type"
          />
          <input
            type="text"
            value={formData.storage.capacity}
            onChange={(e) => handleChange('storage.capacity', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Capacity"
          />
          <input
            type="text"
            value={formData.storage.duration}
            onChange={(e) => handleChange('storage.duration', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Duration"
          />
        </div>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      default: return renderStep1()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!harvest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Harvest not found</h2>
          <button
            onClick={() => navigate('/agronomist')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/agronomist')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Harvest Schedule</h1>
          <p className="text-gray-600">Create a detailed schedule for {harvest.crop} harvest</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`w-16 h-1 mx-2 ${
                  step < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/agronomist')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
          </div>
          
          <div className="flex gap-2">
            {currentStep < totalSteps ? (
              <button
                onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Confirm & Create Schedule'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateHarvestSchedule

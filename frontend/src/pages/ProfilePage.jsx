import React, { useEffect, useState } from 'react'
import { axiosInstance } from '../lib/axios'
import { Camera, Mail, User, Phone, MapPin, ShieldCheck, CalendarDays, PieChart, Settings, Edit3, HelpCircle, LogOut, ArrowLeft, ArrowRight, Lock, Eye, EyeOff, AlertTriangle, Trash2, CheckCircle, XCircle, Clock, Monitor, Smartphone, Globe, Key, MailCheck } from 'lucide-react'
import defaultAvatar from '../assets/User Avatar.jpg'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const location = useLocation()
  const [me, setMe] = useState(null)
  const [error, setError] = useState(null)
  const [fullName, setFullName] = useState('')
  const [profilePic, setProfilePic] = useState('')
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [bio, setBio] = useState('')
  const [touched, setTouched] = useState({ fullName: false, phone: false, address: false, bio: false })
  const [errors, setErrors] = useState({ fullName: '', phone: '', address: '', bio: '' })
  const [phoneInputWarning, setPhoneInputWarning] = useState('')
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'activity' | 'security'
  const [isEditing, setIsEditing] = useState(false)
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [lastActivityCheck, setLastActivityCheck] = useState(null)
  const navigate = useNavigate()
  const { logout, checkAuth } = useAuthStore()

  const loadActivities = async (showLoading = true) => {
    if (!me?.role) return
    
    if (showLoading) setActivitiesLoading(true)
    try {
      if (me.role === 'FARMER') {
        const [farmerRes, buyerRes] = await Promise.all([
          axiosInstance.get('/orders/activities/farmer?limit=10'),
          axiosInstance.get('/orders/activities/buyer?limit=10'),
        ])
        const merged = [...(farmerRes.data || []), ...(buyerRes.data || [])]
        merged.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        setActivities(merged)
      } else {
        const res = await axiosInstance.get('/orders/activities/buyer?limit=10')
        setActivities(res.data)
      }
      setLastActivityCheck(new Date())
    } catch (error) {
      console.error('Error loading activities:', error)
      setActivities([])
    } finally {
      if (showLoading) setActivitiesLoading(false)
    }
  }

  const checkForNewActivities = async () => {
    if (!me?.role || !lastActivityCheck) return
    
    try {
      let newActivities = []
      if (me.role === 'FARMER') {
        const [farmerRes, buyerRes] = await Promise.all([
          axiosInstance.get('/orders/activities/farmer?limit=10'),
          axiosInstance.get('/orders/activities/buyer?limit=10'),
        ])
        const merged = [...(farmerRes.data || []), ...(buyerRes.data || [])]
        merged.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        newActivities = merged
      } else {
        const res = await axiosInstance.get('/orders/activities/buyer?limit=10')
        newActivities = res.data
      }
      
      // Check if there are new activities by comparing the first activity's timestamp
      if (newActivities.length > 0 && activities.length > 0) {
        const latestActivity = newActivities[0]
        const currentLatest = activities[0]
        
        if (latestActivity._id !== currentLatest._id) {
          // New activities found, update the list
          setActivities(newActivities)
          setLastActivityCheck(new Date())
        }
      } else if (newActivities.length > 0 && activities.length === 0) {
        // First load
        setActivities(newActivities)
        setLastActivityCheck(new Date())
      }
    } catch (error) {
      console.error('Error checking for new activities:', error)
    }
  }

  // Function to refresh activities immediately (can be called from other components)
  const refreshActivities = () => {
    if (me?.role) {
      loadActivities(false) // Don't show loading spinner for background refresh
    }
  }

  // Expose refresh function globally for other components to use
  React.useEffect(() => {
    window.refreshFarmerActivities = refreshActivities
    return () => {
      delete window.refreshFarmerActivities
    }
  }, [me?.role])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get('/auth/me')
        setMe(res.data)
        setFullName(res.data.fullName || '')
        setPhone(res.data.phone || '')
        setAddress(res.data.address || '')
        setBio(res.data.bio || '')
      } catch (err) {
        setError(err?.response?.data?.error?.message || 'Failed to load profile')
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (me?.role) {
      loadActivities()
    }
  }, [me?.role])

  // Handle URL parameters for tab switching
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const tab = urlParams.get('tab')
    if (tab && ['overview', 'activity', 'security'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [location.search])

  // Load activities when switching to activity tab
  useEffect(() => {
    if (activeTab === 'activity' && me?.role && activities.length === 0) {
      loadActivities()
    }
  }, [activeTab, me?.role])

  // Poll for new activities when on activity tab
  useEffect(() => {
    if (activeTab === 'activity' && me?.role) {
      // Check for new activities every 30 seconds
      const interval = setInterval(() => {
        checkForNewActivities()
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [activeTab, me?.role, lastActivityCheck])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setProfilePic(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    // Validate before saving
    const validation = validateAll({ fullName, phone, address, bio })
    setErrors(validation)
    setTouched({ fullName: true, phone: true, address: true, bio: true })
    const hasErrors = Object.values(validation).some(Boolean)
    if (hasErrors) {
      toast.error('Please fix the highlighted fields')
      return
    }

    try {
      setSaving(true)
      const payload = { fullName, phone, address, bio }
      if (profilePic) payload.profilePic = profilePic
      const res = await axiosInstance.put('/auth/update-profile', payload)
      setMe(res.data)
      setProfilePic('')
      toast.success('Profile updated')
      setIsEditing(false)
      try { await checkAuth() } catch {}
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (error) return <div className='p-4 text-red-600'>{error}</div>
  if (!me) return <div className='p-4'>Loading...</div>

  const isChanged = (
    fullName.trim() !== (me.fullName || '') ||
    phone.trim() !== (me.phone || '') ||
    address.trim() !== (me.address || '') ||
    bio.trim() !== (me.bio || '') ||
    Boolean(profilePic)
  )

  // Validation helpers
  const validateFullName = (value) => {
    const v = value.trim()
    if (!v) return 'Full name is required'
    if (v.length < 2) return 'Full name must be at least 2 characters'
    if (!/^[A-Za-z ]+$/.test(v)) return 'Use letters and spaces only'
    return ''
  }

  const validatePhone = (value) => {
    const v = value.trim()
    if (!v) return '' // optional field
    
    // Remove any non-digit characters for validation
    const digitsOnly = v.replace(/\D/g, '')
    
    if (digitsOnly.length === 0) return 'Phone number is required'
    if (digitsOnly.length < 10) return 'Phone number must be at least 10 digits'
    if (digitsOnly.length > 10) return 'Phone number must be exactly 10 digits'
    if (!digitsOnly.startsWith('0')) return 'Phone number must start with 0'
    
    return ''
  }

  const validateAddress = (value) => {
    const v = value.trim()
    if (!v) return '' // optional
    if (v.length > 200) return 'Address must be at most 200 characters'
    return ''
  }

  const validateBio = (value) => {
    const v = value.trim()
    if (!v) return '' // optional
    if (v.length > 300) return 'Bio must be at most 300 characters'
    return ''
  }

  const validateAll = ({ fullName, phone, address, bio }) => ({
    fullName: validateFullName(fullName),
    phone: validatePhone(phone),
    address: validateAddress(address),
    bio: validateBio(bio),
  })

  const formValidation = validateAll({ fullName, phone, address, bio })
  const isFormValid = !formValidation.fullName && !formValidation.phone && !formValidation.address && !formValidation.bio

  return (
    <div className='p-4 mt-5 max-w-6xl mx-auto'>
      {/* Header Section */}
      <div className='relative'>
        <div
          className='rounded-2xl h-24 shadow-medium bg-cover bg-center relative'
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80')",
          }}
        >
          <div className='absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/60 to-accent-500/40'></div>
        </div>
        <div className='absolute left-3 top-3 z-20'>
          <button 
            onClick={() => navigate('/')}
            className='flex items-center gap-1.5 px-3 py-1.5 bg-white/90 border border-emerald-700 text-emerald-700 rounded-full transition-colors hover:bg-white'
          >
            <ArrowLeft className='w-3.5 h-3.5' />
            <span className='text-xs'>Back</span>
          </button>
        </div>
        <div className='absolute right-3 top-3 z-20 flex items-center gap-2'>
          <button
            type='button'
            onClick={() => {
              if (isEditing) {
                setIsEditing(false)
                setFullName(me.fullName || '')
                setPhone(me.phone || '')
                setAddress(me.address || '')
                setProfilePic('')
                setPhoneInputWarning('')
              } else {
                setIsEditing(true)
              }
            }}
            aria-pressed={isEditing}
            className='bg-white/90 hover:bg-white border px-3 py-1.5 rounded-md text-sm flex items-center gap-1'
          >
            <Edit3 className='w-4 h-4' /> {isEditing ? 'Editing…' : 'Edit Profile'}
          </button>
          <button type='button' onClick={() => navigate('/settings')} className='bg-white/90 hover:bg-white border p-2 rounded-md' aria-label='Settings'>
            <Settings className='w-4 h-4' />
          </button>
        </div>
        <div className='absolute inset-x-0 -bottom-10 flex justify-center'>
          <div className='relative'>
            <img
              src={profilePic || me.profilePic || defaultAvatar}
              alt='avatar'
              className='w-28 h-28 rounded-full object-cover ring-4 ring-white shadow-xl'
            />
            {isEditing && (
              <label className='absolute -bottom-2 -right-2 bg-white border rounded-full p-2 cursor-pointer shadow-sm'>
                <Camera className='w-4 h-4' />
                <input type='file' accept='image/*' className='hidden' onChange={handleImageChange} />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className='mt-14 text-center'>
        <div className='text-2xl font-semibold'>{me.fullName || (me.email ? me.email.split('@')[0] : '')}</div>
        <div className='mt-1'>
          <span className='inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium capitalize bg-green-50 text-green-700 border border-green-200'>
            <ShieldCheck className='w-3 h-3' /> {me.role.toLowerCase()}
          </span>
        </div>
        <div className='text-xs text-gray-500 mt-1 flex items-center justify-center gap-1'>
          <CalendarDays className='w-4 h-4' /> Member since {new Date(me.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Top Tabs Navigation */}
      <div className='mt-6 flex justify-center'>
        <div className='flex bg-gray-100 rounded-lg p-1 shadow-sm'>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-white text-gray-900 shadow-md transform scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className='flex items-center gap-1.5'>
              <User className='w-3.5 h-3.5' />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'activity'
                ? 'bg-white text-gray-900 shadow-md transform scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className='flex items-center gap-1.5'>
              <CalendarDays className='w-3.5 h-3.5' />
              Activity
            </div>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'security'
                ? 'bg-white text-gray-900 shadow-md transform scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className='flex items-center gap-1.5'>
              <ShieldCheck className='w-3.5 h-3.5' />
              Security
            </div>
          </button>
        </div>
      </div>

      {/* Profile Overview - Enhanced UI */}
      {(activeTab === 'overview') && (
        <div className='max-w-6xl mx-auto mt-6 space-y-6'>
          

          {/* Profile Information Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Personal Information */}
            <div className='bg-white rounded-2xl p-6 border border-gray-200 shadow-sm'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <User className='w-5 h-5 text-blue-600' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900'>Personal Information</h3>
              </div>
              
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Full Name</label>
                  <input
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                    value={fullName}
                    onChange={(e) => {
                      const val = e.target.value
                      setFullName(val)
                      if (touched.fullName) setErrors((er) => ({ ...er, fullName: validateFullName(val) }))
                    }}
                    onBlur={() => { setTouched((t) => ({ ...t, fullName: true })); setErrors((er) => ({ ...er, fullName: validateFullName(fullName) })) }}
                    disabled={!isEditing}
                  />
                  {touched.fullName && errors.fullName && (
                    <p className='mt-1 text-sm text-red-600'>{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Phone Number</label>
                  <input
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      touched.phone && errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={phone}
                    onChange={(e) => {
                      const originalValue = e.target.value
                      
                      // Check if user tried to enter non-numeric characters
                      if (/[^0-9]/.test(originalValue)) {
                        setPhoneInputWarning('Only numbers are allowed')
                        return // Don't process further if non-numeric characters were entered
                      }
                      
                      // Filter to only digits and limit to 10 characters
                      const digitsOnly = originalValue.replace(/\D/g, '').slice(0, 10)
                      
                      // Check if user tried to start with a digit other than 0
                      if (digitsOnly.length > 0 && !digitsOnly.startsWith('0')) {
                        setPhoneInputWarning('Phone number must start with 0')
                        // Don't update the phone state if it doesn't start with 0
                        return
                      }
                      
                      // Clear warning if input is valid (only digits and starts with 0 or is empty)
                      setPhoneInputWarning('')
                      setPhone(digitsOnly)
                      // Don't show validation errors while typing, only on blur
                    }}
                    onBlur={() => { 
                      setTouched((t) => ({ ...t, phone: true }))
                      setErrors((er) => ({ ...er, phone: validatePhone(phone) }))
                    }}
                    placeholder='0712345678'
                    inputMode='numeric'
                    pattern='^0\d{9}$'
                    maxLength={10}
                    disabled={!isEditing}
                  />
                  {touched.phone && errors.phone && (
                    <p className='mt-1 text-sm text-red-600'>{errors.phone}</p>
                  )}
                  {phoneInputWarning && (
                    <p className='mt-1 text-sm text-red-600'>{phoneInputWarning}</p>
                  )}
                  {!errors.phone && !phoneInputWarning && phone && (
                    <p className='mt-1 text-xs text-gray-500'>Format: 0xxxxxxxxx (10 digits starting with 0)</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Email Address</label>
                  <input
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600'
                    value={me.email}
                    disabled
                  />
                  <p className='mt-1 text-xs text-gray-500'>Email cannot be changed here. Use Security tab to change email.</p>
                </div>
              </div>
            </div>

            {/* Location & Bio */}
            <div className='bg-white rounded-2xl p-6 border border-gray-200 shadow-sm'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <MapPin className='w-5 h-5 text-green-600' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900'>Location & Bio</h3>
              </div>
              
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Address</label>
                  <textarea
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200'
                    rows={3}
                    value={address}
                    onChange={(e) => {
                      const val = e.target.value
                      setAddress(val)
                      if (touched.address) setErrors((er) => ({ ...er, address: validateAddress(val) }))
                    }}
                    onBlur={() => { setTouched((t) => ({ ...t, address: true })); setErrors((er) => ({ ...er, address: validateAddress(address) })) }}
                    placeholder='Street, City, State, ZIP'
                    disabled={!isEditing}
                  />
                  {touched.address && errors.address && (
                    <p className='mt-1 text-sm text-red-600'>{errors.address}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Bio / About</label>
                  <textarea
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200'
                    rows={3}
                    value={bio}
                    onChange={(e) => {
                      const val = e.target.value
                      setBio(val)
                      if (touched.bio) setErrors((er) => ({ ...er, bio: validateBio(val) }))
                    }}
                    onBlur={() => { setTouched((t) => ({ ...t, bio: true })); setErrors((er) => ({ ...er, bio: validateBio(bio) })) }}
                    placeholder='Tell others about you...'
                    disabled={!isEditing}
                  />
                  {touched.bio && errors.bio && (
                    <p className='mt-1 text-sm text-red-600'>{errors.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className='bg-white rounded-2xl p-6 border border-gray-200 shadow-sm'>
              <div className='flex items-center justify-between'>
                <div className='text-sm text-gray-600'>
                  <p className='font-medium'>Ready to save your changes?</p>
                  <p>Make sure all information is correct before saving.</p>
                </div>
                <div className='flex gap-3'>
                  <button
                    type='button'
                    className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                    onClick={() => {
                      setFullName(me.fullName || ''); 
                      setPhone(me.phone || ''); 
                      setAddress(me.address || ''); 
                      setBio(me.bio || '');
                      setProfilePic('');
                      setIsEditing(false);
                      setTouched({ fullName: false, phone: false, address: false, bio: false });
                      setErrors({ fullName: '', phone: '', address: '', bio: '' });
                      setPhoneInputWarning('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={saving || !isChanged || !isFormValid} 
                    onClick={handleSave} 
                    className='px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none'
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'overview' && (
        <StatsSection me={me} />
      )}

      {/* Activity Content */}
      {activeTab === 'activity' && (
        <ActivitySection 
          activities={activities}
          activitiesLoading={activitiesLoading}
          loadActivities={loadActivities}
          userRole={me?.role}
        />
      )}

      {/* Security Content */}
      {activeTab === 'security' && (
        <SecuritySection 
          user={me}
          onUserUpdate={setMe}
        />
      )}

      {/* Footer Section */}
      <div className='mt-10 flex items-center justify-between text-sm'>
        <Link to='/settings' className='flex items-center gap-1 text-primary-700'>
          <HelpCircle className='w-4 h-4' /> Support / Help
        </Link>
        <button onClick={async () => { await logout(); navigate('/login'); }} className='flex items-center gap-1 text-red-600'>
          <LogOut className='w-4 h-4' /> Logout
        </button>
      </div>
    </div>
  )
}

// Helper functions for activity display
const groupActivitiesByDate = (activities) => {
  const groups = {}
  
  activities.forEach(activity => {
    const date = new Date(activity.createdAt)
    const dateKey = date.toDateString() // e.g., "Mon Dec 25 2023"
    
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: date,
        activities: []
      }
    }
    
    groups[dateKey].activities.push(activity)
  })
  
  // Convert to array and sort by date (newest first)
  return Object.values(groups).sort((a, b) => b.date - a.date)
}

const formatDateHeader = (date) => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const activityDate = new Date(date)
  
  // Reset time to compare only dates
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
  const activityDateOnly = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate())
  
  if (activityDateOnly.getTime() === todayDate.getTime()) {
    return 'Today'
  } else if (activityDateOnly.getTime() === yesterdayDate.getTime()) {
    return 'Yesterday'
  } else {
    return activityDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
}

const formatTimeOnly = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })
}

// Security Section Component
const SecuritySection = ({ user, onUserUpdate }) => {
  const navigate = useNavigate()

  const securityOptions = [
    {
      id: 'email',
      title: 'Email Management',
      description: 'Change your email address and manage verification',
      icon: Mail,
      color: 'blue',
      gradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonGradient: 'from-blue-600 to-indigo-600',
      buttonHover: 'hover:from-blue-700 hover:to-indigo-700',
      path: '/security/email'
    },
    {
      id: 'password',
      title: 'Password Security',
      description: 'Update your password and security settings',
      icon: Lock,
      color: 'green',
      gradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-100',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonGradient: 'from-green-600 to-emerald-600',
      buttonHover: 'hover:from-green-700 hover:to-emerald-700',
      path: '/security/password'
    },
    {
      id: 'history',
      title: 'Login History',
      description: 'View recent login attempts and active sessions',
      icon: Clock,
      color: 'purple',
      gradient: 'from-purple-50 to-violet-50',
      borderColor: 'border-purple-100',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      buttonGradient: 'from-purple-600 to-violet-600',
      buttonHover: 'hover:from-purple-700 hover:to-violet-700',
      path: '/security/history'
    },
    {
      id: 'deletion',
      title: 'Account Deletion',
      description: 'Permanently delete your account and all data',
      icon: AlertTriangle,
      color: 'red',
      gradient: 'from-red-50 to-rose-50',
      borderColor: 'border-red-100',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonGradient: 'from-red-600 to-rose-600',
      buttonHover: 'hover:from-red-700 hover:to-rose-700',
      path: '/security/deletion'
    }
  ]

  return (
    <div className='max-w-6xl mx-auto mt-6'>
      {/* Security Header */}
      <div className='text-center mb-8'>
        <div className='inline-flex items-center gap-3 mb-4 -ml-14'>
          <div className='p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl'>
            <ShieldCheck className='w-6 h-6 text-indigo-600' />
          </div>
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>Security Center</h2>
            <p className='text-gray-600'>Manage your account security and privacy settings</p>
          </div>
        </div>
      </div>

      {/* Security Options Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {securityOptions.map((option) => {
          const IconComponent = option.icon
          return (
            <div
              key={option.id}
              className={`bg-gradient-to-br ${option.gradient} rounded-2xl p-6 border ${option.borderColor} shadow-lg hover:shadow-md transition-all duration-200 cursor-pointer group`}
              onClick={() => navigate(option.path)}
            >
              <div className='flex items-start gap-4'>
                <div className={`p-3 ${option.iconBg} rounded-xl transition-transform duration-200`}>
                  <IconComponent className={`w-6 h-6 ${option.iconColor}`} />
                </div>
                <div className='flex-1'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2 transition-colors duration-200'>
                    {option.title}
                  </h3>
                  <p className='text-sm text-gray-600 mb-4 leading-relaxed'>
                    {option.description}
                  </p>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/70 rounded-lg text-sm font-medium text-gray-700 transition-all duration-200`}>
                    <span>Manage</span>
                    <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Security Tips */}
      <div className='mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200'>
        <div className='flex items-start gap-4'>
          <div className='p-2 bg-blue-100 rounded-lg'>
            <Key className='w-5 h-5 text-blue-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Security Tips</h3>
            <ul className='text-sm text-gray-600 space-y-2'>
              <li className='flex items-center gap-2'>
                <CheckCircle className='w-4 h-4 text-green-500' />
                Use a strong, unique password for your account
              </li>
              <li className='flex items-center gap-2'>
                <CheckCircle className='w-4 h-4 text-green-500' />
                Keep your email address up to date for security notifications
              </li>
              <li className='flex items-center gap-2'>
                <CheckCircle className='w-4 h-4 text-green-500' />
                Regularly review your login history for suspicious activity
              </li>
              <li className='flex items-center gap-2'>
                <CheckCircle className='w-4 h-4 text-green-500' />
                Log out from devices you no longer use
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Activity Section Component
const ActivitySection = ({ activities, activitiesLoading, loadActivities, userRole }) => {

  return (
    <div className='mt-6 card'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <div className='font-medium'>Recent Activity</div>
          <div className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full'>
            Auto-refreshes every 30s
          </div>
        </div>
        <button 
          onClick={() => loadActivities(true)}
          disabled={activitiesLoading}
          className='flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50'
        >
          <svg className={`w-4 h-4 ${activitiesLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {activitiesLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {activitiesLoading ? (
        <div className='text-center py-4 text-gray-500'>Loading activities...</div>
      ) : activities.length === 0 ? (
        <div className='text-center py-4 text-gray-500'>No recent activity to show</div>
      ) : (
        <div className='space-y-6'>
          {groupActivitiesByDate(activities).map((dayGroup, dayIndex) => (
            <div key={dayIndex}>
              {/* Date Header */}
              <div className='sticky top-0 bg-white py-2 mb-3 border-b border-gray-200'>
                <h3 className='text-sm font-semibold text-gray-700'>
                  {formatDateHeader(dayGroup.date)}
                </h3>
              </div>
              
              {/* Activities for this day */}
              <div className='space-y-3'>
                {dayGroup.activities.map((activity, index) => (
                  <div 
                    key={activity._id || index} 
                    className={`flex items-start gap-3 p-4 rounded-lg ${
                      activity.type === 'LISTING_ADDED' ? 'bg-green-50 border-l-4 border-green-400' :
                      activity.type === 'ITEM_SOLD' ? 'bg-blue-50 border-l-4 border-blue-400' :
                      activity.type === 'ITEM_EXPIRED' ? 'bg-orange-50 border-l-4 border-orange-400' :
                      activity.type === 'LISTING_UPDATED' ? 'bg-purple-50 border-l-4 border-purple-400' :
                      activity.type === 'LISTING_REMOVED' ? 'bg-red-50 border-l-4 border-red-400' :
                      activity.type === 'ORDER_PLACED' ? 'bg-blue-50 border-l-4 border-blue-400' :
                      activity.type === 'ORDER_CANCELLED' ? 'bg-red-50 border-l-4 border-red-400' :
                      'bg-gray-50 border-l-4 border-gray-400'
                    }`}
                  >
                    <div className={`mt-1 w-3 h-3 rounded-full ${
                      activity.type === 'LISTING_ADDED' ? 'bg-green-500' :
                      activity.type === 'ITEM_SOLD' ? 'bg-blue-500' :
                      activity.type === 'ITEM_EXPIRED' ? 'bg-orange-500' :
                      activity.type === 'LISTING_UPDATED' ? 'bg-purple-500' :
                      activity.type === 'LISTING_REMOVED' ? 'bg-red-500' :
                      activity.type === 'ORDER_PLACED' ? 'bg-blue-500' :
                      activity.type === 'ORDER_CANCELLED' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div className='flex-1'>
                      <div className='text-gray-800 font-medium'>{activity.title}</div>
                      <div className='text-sm text-gray-600 mt-1'>{activity.description}</div>
                      <div className='text-xs text-gray-500 mt-2'>
                        {formatTimeOnly(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProfilePage

// Inline Stats component to show real counts
const StatsSection = ({ me }) => {
  const [ordersCount, setOrdersCount] = React.useState(null)
  const [listingsCount, setListingsCount] = React.useState(null)
  const [farmerMonthRevenue, setFarmerMonthRevenue] = React.useState(null)
  const [farmerLastMonthDelivered, setFarmerLastMonthDelivered] = React.useState(null)
  const [farmerTotalSales, setFarmerTotalSales] = React.useState(null)
  const [buyerTotalSpent30, setBuyerTotalSpent30] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const loadStats = async () => {
    setLoading(true)
    try {
      // Orders count (for both FARMER/BUYER we use their customer orders endpoint)
      const ordersRes = await axiosInstance.get('/orders/me')
      setOrdersCount(Array.isArray(ordersRes.data) ? ordersRes.data.length : 0)

      // Buyer: compute total spent in last 30 days
      if (me.role !== 'FARMER' && Array.isArray(ordersRes.data)) {
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
        const total = ordersRes.data
          .filter(o => new Date(o.createdAt) >= thirtyDaysAgo && o.status !== 'CANCELLED')
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
        setBuyerTotalSpent30(total)
      } else if (me.role !== 'FARMER') {
        setBuyerTotalSpent30(0)
      }
    } catch {
      setOrdersCount(0)
      if (me.role !== 'FARMER') setBuyerTotalSpent30(0)
    }

    try {
      if (me.role === 'FARMER') {
        const [listingsRes, farmerStats] = await Promise.all([
          axiosInstance.get('/listings/mine'),
          axiosInstance.get('/orders/stats/farmer')
        ])
        console.log('Farmer stats response:', farmerStats.data)
        // Count only listings with "AVAILABLE" status
        const availableListings = Array.isArray(listingsRes.data) 
          ? listingsRes.data.filter(listing => listing.status === 'AVAILABLE')
          : []
        setListingsCount(availableListings.length)
        setFarmerMonthRevenue(farmerStats.data?.monthRevenue ?? 0)
        setFarmerLastMonthDelivered(farmerStats.data?.lastMonthDeliveredOrders ?? 0)
        setFarmerTotalSales(farmerStats.data?.totalSalesCount ?? 0)
      } else {
        setListingsCount(0)
      }
    } catch (error) {
      console.error('Error loading farmer stats:', error)
      setListingsCount(0)
      setFarmerMonthRevenue(0)
      setFarmerLastMonthDelivered(0)
      setFarmerTotalSales(0)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadStats()
  }, [me?.role])

  if (me.role === 'FARMER') {
    return (
      <div className='mt-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-800'>Farm Statistics</h3>
          <button 
            onClick={loadStats}
            disabled={loading}
            className='flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50'
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div className='card text-center'>
            <div className='text-xs text-gray-500'>Available Listings</div>
            <div className='text-2xl font-semibold'>{listingsCount == null ? '—' : listingsCount}</div>
          </div>
          <div className='card text-center'>
            <div className='text-xs text-gray-500'>Revenue (Last 30 Days)</div>
            <div className='text-2xl font-semibold'>{farmerMonthRevenue == null ? '—' : `LKR ${Number(farmerMonthRevenue).toLocaleString()}`}</div>
            <div className='text-xs text-gray-400 mt-1'>All sales (COD, PAID, etc.)</div>
          </div>
          <div className='card text-center'>
            <div className='text-xs text-gray-500'>Total Sales (Last 30 Days)</div>
            <div className='text-2xl font-semibold'>{farmerTotalSales == null ? '—' : farmerTotalSales}</div>
            <div className='text-xs text-gray-400 mt-1'>Orders placed</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4'>
      <div className='card text-center'>
        <div className='text-xs text-gray-500'>Orders Count</div>
        <div className='text-2xl font-semibold'>{ordersCount == null ? '—' : ordersCount}</div>
      </div>
      <div className='card text-center'>
        <div className='text-xs text-gray-500'>Last Login</div>
        <div className='text-2xl font-semibold'>{me?.lastLogin ? new Date(me.lastLogin).toLocaleDateString() : '—'}</div>
      </div>
      <div className='card text-center'>
        <div className='text-xs text-gray-500'>Total Spent (Last 30 Days)</div>
        <div className='text-2xl font-semibold'>{buyerTotalSpent30 == null ? '—' : `LKR ${Number(buyerTotalSpent30).toLocaleString()}`}</div>
      </div>
    </div>
  )
}

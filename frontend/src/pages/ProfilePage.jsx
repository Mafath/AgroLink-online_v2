import React, { useEffect, useState } from 'react'
import { axiosInstance } from '../lib/axios'
import { Camera, Mail, User, Phone, MapPin, ShieldCheck, CalendarDays, PieChart, Settings, Edit3, HelpCircle, LogOut, ArrowLeft } from 'lucide-react'
import defaultAvatar from '../assets/User Avatar.jpg'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

const ProfilePage = () => {
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
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'activity'
  const [isEditing, setIsEditing] = useState(false)
  const navigate = useNavigate()
  const { logout, checkAuth } = useAuthStore()

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
    if (!v) return '' // optional
    const phoneRegex = /^0\d{9}$/ // Exactly 10 digits, starting with 0
    if (!phoneRegex.test(v)) return 'Phone must start with 0 and be exactly 10 digits'
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
        <div className='flex bg-gray-100 rounded-lg p-1'>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'activity'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Activity
          </button>
        </div>
      </div>

      {/* Profile Info Card (Overview) */}
      {(activeTab === 'overview') && (
        <div className='card max-w-4xl mx-auto mt-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='form-label'><User className='inline mr-2 w-4 h-4 text-gray-400' />Full Name</label>
              <input
                className='input-field'
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
                <p className='mt-1 text-xs text-red-600'>{errors.fullName}</p>
              )}
            </div>
            <div>
              <label className='form-label'><Phone className='inline mr-2 w-4 h-4 text-gray-400' />Phone Number</label>
              <input
                className='input-field'
                value={phone}
                onChange={(e) => {
                  // allow only digits, limit to 10
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setPhone(val)
                  if (touched.phone) setErrors((er) => ({ ...er, phone: validatePhone(val) }))
                }}
                onBlur={() => { setTouched((t) => ({ ...t, phone: true })); setErrors((er) => ({ ...er, phone: validatePhone(phone) })) }}
                placeholder='0712345678'
                inputMode='numeric'
                pattern='^0\d{9}$'
                maxLength={10}
                disabled={!isEditing}
              />
              {touched.phone && errors.phone && (
                <p className='mt-1 text-xs text-red-600'>{errors.phone}</p>
              )}
            </div>
          </div>
          <div className='mt-4'>
            <label className='form-label'><Mail className='inline mr-2 w-4 h-4 text-gray-400' />Email</label>
            <input className='input-field' value={me.email} disabled />
          </div>
          <div className='mt-4'>
            <label className='form-label'><MapPin className='inline mr-2 w-4 h-4 text-gray-400' />Address</label>
            <textarea
              className='input-field'
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
              <p className='mt-1 text-xs text-red-600'>{errors.address}</p>
            )}
          </div>
          <div className='mt-4'>
            <label className='form-label'>Bio / About</label>
            <textarea
              className='input-field'
              rows={3}
              value={bio}
              onChange={(e) => {
                const val = e.target.value
                setBio(val)
                if (touched.bio) setErrors((er) => ({ ...er, bio: validateBio(val) }))
              }}
              onBlur={() => { setTouched((t) => ({ ...t, bio: true })); setErrors((er) => ({ ...er, bio: validateBio(bio) })) }}
              placeholder='Tell others about you'
              disabled={!isEditing}
            />
            {touched.bio && errors.bio && (
              <p className='mt-1 text-xs text-red-600'>{errors.bio}</p>
            )}
          </div>
          {me.verified && (
            <div className='mt-4'>
              <span className='inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200'>
                <ShieldCheck className='w-3 h-3' /> Verified
              </span>
            </div>
          )}
          {isEditing && (
            <div className='mt-6 flex gap-3 justify-end'>
              <button
                type='button'
                className='border px-4 py-2 rounded-lg'
                onClick={() => { setFullName(me.fullName || ''); setPhone(me.phone || ''); setAddress(me.address || ''); setProfilePic('') }}
              >
                Cancel
              </button>
              <button disabled={saving || !isChanged || !isFormValid} onClick={handleSave} className='btn-primary disabled:opacity-60 disabled:cursor-not-allowed'>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'overview' && (
        <StatsSection me={me} />
      )}

      {/* Activity Content */}
      {activeTab === 'activity' && (
        <div className='mt-6 card'>
          <div className='font-medium mb-3'>Recent Activity</div>
          <ul className='space-y-3 text-sm'>
            <li className='flex items-start gap-3'>
              <span className='mt-1 w-2 h-2 rounded-full bg-primary-500'></span>
              <div>
                <div className='text-gray-800'>No recent activity to show</div>
                <div className='text-xs text-gray-500'>Your latest actions will appear here.</div>
              </div>
            </li>
          </ul>
        </div>
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

export default ProfilePage

// Inline Stats component to show real counts
const StatsSection = ({ me }) => {
  const [ordersCount, setOrdersCount] = React.useState(null)
  const [listingsCount, setListingsCount] = React.useState(null)
  const [farmerMonthRevenue, setFarmerMonthRevenue] = React.useState(null)
  const [farmerLastMonthDelivered, setFarmerLastMonthDelivered] = React.useState(null)
  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        // Orders count (for both FARMER/BUYER we use their customer orders endpoint)
        const ordersRes = await axiosInstance.get('/orders/me')
        if (!cancelled) setOrdersCount(Array.isArray(ordersRes.data) ? ordersRes.data.length : 0)
      } catch {
        if (!cancelled) setOrdersCount(0)
      }

      try {
        if (me.role === 'FARMER') {
          const [listingsRes, farmerStats] = await Promise.all([
            axiosInstance.get('/listings/mine'),
            axiosInstance.get('/orders/stats/farmer')
          ])
          if (!cancelled) {
            setListingsCount(Array.isArray(listingsRes.data) ? listingsRes.data.length : 0)
            setFarmerMonthRevenue(farmerStats.data?.monthRevenue ?? 0)
            setFarmerLastMonthDelivered(farmerStats.data?.lastMonthDeliveredOrders ?? 0)
          }
        } else {
          if (!cancelled) setListingsCount(0)
        }
      } catch {
        if (!cancelled) setListingsCount(0)
      }
    }
    load()
    return () => { cancelled = true }
  }, [me?.role])

  if (me.role === 'FARMER') {
    return (
      <div className='mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='card text-center'>
          <div className='text-xs text-gray-500'>Available Listings</div>
          <div className='text-2xl font-semibold'>{listingsCount == null ? '—' : listingsCount}</div>
        </div>
        <div className='card text-center'>
          <div className='text-xs text-gray-500'>Revenue (Last 30 Days)</div>
          <div className='text-2xl font-semibold'>{farmerMonthRevenue == null ? '—' : `LKR ${Number(farmerMonthRevenue).toLocaleString()}`}</div>
        </div>
        <div className='card text-center'>
          <div className='text-xs text-gray-500'>Delivered Orders (Last 30 Days)</div>
          <div className='text-2xl font-semibold'>{farmerLastMonthDelivered == null ? '—' : farmerLastMonthDelivered}</div>
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
        <div className='text-xs text-gray-500'>Products Listed</div>
        <div className='text-2xl font-semibold'>{listingsCount == null ? '—' : listingsCount}</div>
      </div>
    </div>
  )
}

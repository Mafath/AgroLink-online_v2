import React, { useEffect, useState } from 'react'
import { axiosInstance } from '../lib/axios'
import { Camera, Mail, User, Phone, MapPin, ShieldCheck, CalendarDays, PieChart, Settings, Edit3, HelpCircle, LogOut } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'activity' | 'settings'
  const [isEditing, setIsEditing] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuthStore()

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
    try {
      setSaving(true)
      const payload = { fullName, phone, address, bio }
      if (profilePic) payload.profilePic = profilePic
      const res = await axiosInstance.put('/auth/update-profile', payload)
      setMe(res.data)
      setProfilePic('')
      toast.success('Profile updated')
      setIsEditing(false)
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

  return (
    <div className='p-4 max-w-5xl mx-auto'>
      {/* Header Section */}
      <div className='relative'>
        <div className='bg-gradient-primary rounded-2xl h-24 shadow-medium'></div>
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
              src={profilePic || me.profilePic || 'https://ui-avatars.com/api/?background=0d7e79&color=fff&name=' + encodeURIComponent(me.fullName || me.email)}
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
          <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize bg-green-50 text-green-700 border border-green-200'>
            {me.role.toLowerCase()}
          </span>
        </div>
        <div className='text-xs text-gray-500 mt-1 flex items-center justify-center gap-1'>
          <CalendarDays className='w-4 h-4' /> Member since {new Date(me.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Profile Info Card */}
      <div className='card max-w-3xl mx-auto mt-6'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <label className='form-label'><User className='inline mr-2 w-4 h-4 text-gray-400' />Full Name</label>
            <input className='input-field' value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!isEditing} />
          </div>
          <div>
            <label className='form-label'><Phone className='inline mr-2 w-4 h-4 text-gray-400' />Phone Number</label>
            <input className='input-field' value={phone} onChange={(e) => setPhone(e.target.value)} placeholder='+1 555 123 4567' disabled={!isEditing} />
          </div>
        </div>
        <div className='mt-4'>
          <label className='form-label'><Mail className='inline mr-2 w-4 h-4 text-gray-400' />Email</label>
          <input className='input-field' value={me.email} disabled />
        </div>
        <div className='mt-4'>
          <label className='form-label'><MapPin className='inline mr-2 w-4 h-4 text-gray-400' />Address</label>
          <textarea className='input-field' rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder='Street, City, State, ZIP' disabled={!isEditing} />
        </div>
        <div className='mt-4'>
          <label className='form-label'>Bio / About</label>
          <textarea className='input-field' rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder='Tell others about you' disabled={!isEditing} />
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
              onClick={() => { setIsEditing(false); setFullName(me.fullName || ''); setPhone(me.phone || ''); setAddress(me.address || ''); setProfilePic('') }}
            >
              Cancel
            </button>
            <button disabled={saving || !isChanged} onClick={handleSave} className='btn-primary disabled:opacity-60 disabled:cursor-not-allowed'>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className='mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4'>
        <div className='card'>
          <div className='text-xs text-gray-500'>Orders Count</div>
          <div className='text-2xl font-semibold'>-</div>
        </div>
        <div className='card'>
          <div className='text-xs text-gray-500'>Products Listed</div>
          <div className='text-2xl font-semibold'>-</div>
        </div>
        <div className='card'>
          <div className='text-xs text-gray-500'>Deliveries Completed</div>
          <div className='text-2xl font-semibold'>-</div>
        </div>
        <div className='card'>
          <div className='text-xs text-gray-500'>Last Login</div>
          <div className='text-2xl font-semibold'>-</div>
        </div>
      </div>

      {/* Tabs / Navigation */}
      <div className='mt-8 border-b'></div>
      <div className='mt-4 flex items-center gap-2'>
        <button onClick={() => setActiveTab('overview')} className={`px-3 py-1.5 rounded-md text-sm ${activeTab === 'overview' ? 'bg-primary-500 text-white' : 'border hover:bg-gray-50'}`}>Overview</button>
        <button onClick={() => setActiveTab('activity')} className={`px-3 py-1.5 rounded-md text-sm ${activeTab === 'activity' ? 'bg-primary-500 text-white' : 'border hover:bg-gray-50'}`}>Activity / History</button>
        <button onClick={() => setActiveTab('settings')} className={`px-3 py-1.5 rounded-md text-sm ${activeTab === 'settings' ? 'bg-primary-500 text-white' : 'border hover:bg-gray-50'}`}>Settings</button>
      </div>

      {/* Content Area */}
      <div className='mt-4 text-sm text-gray-700'>
        {activeTab === 'overview' && (
          <div>Welcome to your profile overview.</div>
        )}
        {activeTab === 'activity' && (
          <div>Activity and history will appear here.</div>
        )}
        {activeTab === 'settings' && (
          <div>Manage account preferences in <Link to='/settings' className='text-primary-600 underline'>Settings</Link>.</div>
        )}
      </div>

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

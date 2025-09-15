import React, { useEffect, useState } from 'react'
import { axiosInstance } from '../lib/axios'
import { Camera, Mail, User, Phone, MapPin, ShieldCheck, CalendarDays, PieChart } from 'lucide-react'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const [me, setMe] = useState(null)
  const [error, setError] = useState(null)
  const [fullName, setFullName] = useState('')
  const [profilePic, setProfilePic] = useState('')
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [activeTab, setActiveTab] = useState('info') // 'info' | 'stats'

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get('/auth/me')
        setMe(res.data)
        setFullName(res.data.fullName || '')
        setPhone(res.data.phone || '')
        setAddress(res.data.address || '')
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
      const payload = { fullName, phone, address }
      if (profilePic) payload.profilePic = profilePic
      const res = await axiosInstance.put('/auth/update-profile', payload)
      setMe(res.data)
      setProfilePic('')
      toast.success('Profile updated')
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
    Boolean(profilePic)
  )

  return (
    <div className='p-4 mt-16 max-w-5xl mx-auto'>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mt-20 mb-20'>
        {/* Left: Avatar card */}
        <div className='card h-full space-y-4 flex flex-col items-center overflow-visible md:h-[calc(100vh-16rem)]'>
          <div className='relative w-24 h-24 -mt-12'>
            <img
              src={profilePic || me.profilePic || 'https://ui-avatars.com/api/?background=0d7e79&color=fff&name=' + encodeURIComponent(me.fullName || me.email)}
              alt='avatar'
              className='w-24 h-24 rounded-full object-cover border ring-4 ring-white shadow-xl'
            />
            <label className='absolute -bottom-2 -right-2 bg-white border rounded-full p-2 cursor-pointer shadow-sm'>
              <Camera className='w-4 h-4' />
              <input type='file' accept='image/*' className='hidden' onChange={handleImageChange} />
            </label>
          </div>
          <div className='text-lg font-semibold text-gray-900 text-center flex items-center justify-center gap-2'>
            <User className='w-4 h-4 text-gray-400' />
            {me.fullName || (me.email ? me.email.split('@')[0] : '')}
          </div>
          <div className='text-xs text-gray-500 text-center flex items-center justify-center gap-2 -mt-4'>
            <Mail className='w-3 h-3 text-gray-400' />
            {me.email}
          </div>
          <div className='text-sm text-gray-700 text-center flex items-center justify-center gap-2 mt-1'>
            <ShieldCheck className='w-4 h-4 text-primary-500' />
            Registered as a <span className='font-semibold'>{me.role.toLowerCase()}</span>
          </div>
          <div className='flex-1' />
          <div className='w-full'>
            <div className='text-xs text-gray-500 text-center flex items-center justify-center gap-2 mt-1'>
              <CalendarDays className='w-4 h-4 text-gray-400' />
              Member since <span className='font-medium'>{new Date(me.createdAt).toLocaleDateString()}</span>
            </div>
          </div>    
        </div>

        {/* Right: Details/Stats card */}
        <div className='card md:col-span-3 md:h-[calc(100vh-16rem)] overflow-y-auto'>
          {/* Top controls */}
          <div className='flex items-center justify-end gap-2 mb-4'>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-3 py-1 rounded-md text-sm border ${activeTab === 'info' ? 'bg-primary-500 text-white border-primary-500' : 'text-gray-700 hover:bg-gray-50'}`}
              aria-label='User info'
            >
              Info
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1 rounded-md text-sm border flex items-center gap-1 ${activeTab === 'stats' ? 'bg-primary-500 text-white border-primary-500' : 'text-gray-700 hover:bg-gray-50'}`}
              aria-label='User stats'
            >
              <PieChart className='w-4 h-4' /> Stats
            </button>
          </div>

          {activeTab === 'info' && (
            <>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='form-label'><User className='inline mr-2 w-4 h-4 text-gray-400' />Full Name</label>
                  <input className='input-field' value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <label className='form-label'><Phone className='inline mr-2 w-4 h-4 text-gray-400' />Phone Number</label>
                  <input className='input-field' value={phone} onChange={(e) => setPhone(e.target.value)} placeholder='+1 555 123 4567' />
                </div>
              </div>

              <div className='mt-4'>
                <label className='form-label'><Mail className='inline mr-2 w-4 h-4 text-gray-400' />Email</label>
                <input className='input-field' value={me.email} disabled />
              </div>

              <div className='mt-4'>
                <label className='form-label'><MapPin className='inline mr-2 w-4 h-4 text-gray-400' />Address</label>
                <textarea className='input-field' rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder='Street, City, State, ZIP' />
              </div>

              <div className='mt-6 flex gap-3 justify-end'>
                <button disabled={saving || !isChanged} onClick={handleSave} className='btn-primary disabled:opacity-60 disabled:cursor-not-allowed'>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </>
          )}

          {activeTab === 'stats' && (
            <div className='mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div className='card'>
                <div className='text-xs text-gray-500'>Orders completed</div>
                <div className='text-2xl font-semibold'>-</div>
              </div>
              <div className='card'>
                <div className='text-xs text-gray-500'>Listings</div>
                <div className='text-2xl font-semibold'>-</div>
              </div>
              <div className='card'>
                <div className='text-xs text-gray-500'>Ratings</div>
                <div className='text-2xl font-semibold'>-</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

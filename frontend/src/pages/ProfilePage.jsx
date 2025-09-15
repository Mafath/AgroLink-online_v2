import React, { useEffect, useState } from 'react'
import { axiosInstance } from '../lib/axios'
import { Camera } from 'lucide-react'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const [me, setMe] = useState(null)
  const [error, setError] = useState(null)
  const [fullName, setFullName] = useState('')
  const [profilePic, setProfilePic] = useState('')
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

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
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-20'>
        {/* Left: Avatar card */}
        <div className='card space-y-4 flex flex-col items-center'>
          <div className='relative w-24 h-24'>
            <img
              src={profilePic || me.profilePic || 'https://ui-avatars.com/api/?background=0d7e79&color=fff&name=' + encodeURIComponent(me.fullName || me.email)}
              alt='avatar'
              className='w-24 h-24 rounded-full object-cover border'
            />
            <label className='absolute -bottom-2 -right-2 bg-white border rounded-full p-2 cursor-pointer shadow-sm'>
              <Camera className='w-4 h-4' />
              <input type='file' accept='image/*' className='hidden' onChange={handleImageChange} />
            </label>
          </div>
          <div className='text-sm text-gray-700 text-center'>
            Registered as verified <span className='font-semibold'>{me.role}</span>
          </div>
          <div className='text-center'>
            <div className='text-xs text-gray-500'>Member since</div>
            <div className='font-medium'>{new Date(me.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Right: Details card */}
        <div className='card md:col-span-2'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='form-label'>Full Name</label>
              <input className='input-field' value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className='form-label'>Phone Number</label>
              <input className='input-field' value={phone} onChange={(e) => setPhone(e.target.value)} placeholder='+1 555 123 4567' />
            </div>
          </div>

          <div className='mt-4'>
            <label className='form-label'>Email</label>
            <input className='input-field' value={me.email} disabled />
          </div>

          <div className='mt-4'>
            <label className='form-label'>Address</label>
            <textarea className='input-field' rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder='Street, City, State, ZIP' />
          </div>

          <div className='mt-6 flex gap-3 justify-end'>
            <button disabled={saving || !isChanged} onClick={handleSave} className='btn-primary disabled:opacity-60 disabled:cursor-not-allowed'>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

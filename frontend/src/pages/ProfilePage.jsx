import React, { useEffect, useState } from 'react'
import { axiosInstance } from '../lib/axios'

const ProfilePage = () => {
  const [me, setMe] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get('/auth/me')
        setMe(res.data)
      } catch (err) {
        setError(err?.response?.data?.error?.message || 'Failed to load profile')
      }
    }
    load()
  }, [])

  if (error) return <div className='p-4 text-error'>{error}</div>
  if (!me) return <div className='p-4'>Loading...</div>

  return (
    <div className='p-4'>
      <div className='font-semibold'>My Profile</div>
      <div className='mt-2 text-sm'>
        <div><span className='font-medium'>ID:</span> {me.id}</div>
        <div><span className='font-medium'>Email:</span> {me.email}</div>
        <div><span className='font-medium'>Role:</span> {me.role}</div>
      </div>
    </div>
  )
}

export default ProfilePage

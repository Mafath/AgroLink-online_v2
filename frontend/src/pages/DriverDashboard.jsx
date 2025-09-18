import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { axiosInstance } from '../lib/axios'

const DriverDashboard = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        <h1 className='text-3xl font-semibold ml-2 mb-4'>Driver Dashboard</h1>
        <div className='bg-white rounded-xl border border-gray-200 p-6 text-gray-600'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-gray-800 font-semibold text-lg'>Availability</div>
              <div className='text-sm text-gray-500'>Set whether you are available to take jobs</div>
            </div>
            <AvailabilityToggle />
          </div>
        </div>
        <AvailabilityPrompt />
      </div>
    </div>
  )
}

const AvailabilityToggle = () => {
  const { authUser, checkAuth } = useAuthStore();
  const current = String(authUser?.availability || 'AVAILABLE').toUpperCase();
  const [saving, setSaving] = useState(false);

  const next = current === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';

  const onToggle = async () => {
    setSaving(true);
    try {
      await axiosInstance.put('/auth/update-profile', { availability: next });
      await checkAuth();
    } finally {
      setSaving(false);
    }
  };

  return (
    <button onClick={onToggle} disabled={saving} className={`px-4 py-2 rounded-full text-sm font-medium ${current === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
      {saving ? 'Saving…' : current === 'AVAILABLE' ? 'Available' : 'Unavailable'}
    </button>
  );
}

const AvailabilityPrompt = () => {
  const { authUser, checkAuth } = useAuthStore();
  const isDriver = String(authUser?.role || '').toUpperCase() === 'DRIVER';
  const isUnavailable = String(authUser?.availability || 'UNAVAILABLE').toUpperCase() === 'UNAVAILABLE';
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isDriver && isUnavailable) setOpen(true);
  }, [isDriver, isUnavailable]);

  if (!open) return null;

  return (
    <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
      <div className='bg-white rounded-lg w-full max-w-md p-4'>
        <div className='mb-2 text-lg font-semibold'>Set availability to Available?</div>
        <div className='text-sm text-gray-600 mb-4'>You are currently unavailable. Would you like to switch to Available so you can receive jobs?</div>
        <div className='flex items-center justify-end gap-2'>
          <button className='border px-3 py-2 rounded-md' onClick={() => setOpen(false)}>Not now</button>
          <button
            className='btn-primary px-3.5 h-9 rounded-full text-[13px] font-medium'
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await axiosInstance.put('/auth/update-profile', { availability: 'AVAILABLE' });
                await checkAuth();
                setOpen(false);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Updating…' : 'Set Available'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DriverDashboard


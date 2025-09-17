import React, { useEffect, useState } from 'react'
import { BarChart3, Activity, Users, Store, Package, TrendingUp, Settings, ShieldCheck, Bell, Search } from 'lucide-react'
import { axiosInstance } from '../lib/axios'

const KPI = ({ label, value, sub }) => (
  <div className='card'>
    <div className='text-xs text-gray-500'>{label}</div>
    <div className='text-3xl font-semibold mt-1'>{value}</div>
    {sub && <div className='text-xs text-gray-500 mt-1'>{sub}</div>}
  </div>
)

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let cancelled = false
    axiosInstance.get('auth/admin/stats')
      .then(res => { if (!cancelled) setStats(res.data) })
      .catch(() => { /* silent */ })
    return () => { cancelled = true }
  }, [])

  const activeUsers = stats?.users?.total ?? '—'
  const totalListings = stats?.listings?.total ?? '—'

  return (
    <div className='p-4 max-w-7xl mx-auto flex gap-6'>
      {/* Sidebar */}

      <aside className='w-56 h-50 shrink-0 hidden md:block bg-black text-white border border-gray-800 rounded-md p-2 sticky self-start'>
        <nav className='space-y-3 text-sm'>
          <a href='/admin' className='block px-3 py-2 rounded-md text-gray-200 bg-white/10 mt-6'>Dashboard</a>
          <a href='/admin/users' className='block px-3 py-2 rounded-md text-gray-200 bg-white/10'>Users & Roles Management</a>
          <a href='/admin/roles' className='block px-3 py-2 rounded-md text-gray-200 bg-white/10'>Roles & Permissions</a>
          <a href='/admin/inventory' className='block px-3 py-2 rounded-md text-gray-200 bg-white/10'>Inventory</a>
          <a href='/admin/listings' className='block px-3 py-2 rounded-md text-gray-200 bg-white/10'>Listings</a>
          <a href='/admin/rentals' className='block px-3 py-2 rounded-md text-gray-200 bg-white/10'>Rentals</a>
          <a href='/admin/settings' className='block px-3 py-2 rounded-md text-gray-200 bg-white/10'>Settings</a>
          <a href='/admin/settings' className='block px-3 py-2 rounded-md text-gray-200 bg-white/10'>Settings</a>
          <a href='/admin/settings' className='block px-3 py-2 rounded-md text-gray-200 bg-white/10'>Settings</a>
        </nav>
      </aside>
      <div className='flex-1'>
      {/* Top bar */}
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-semibold'>Admin Dashboard</h1>
        <div className='flex items-center gap-2'>
          <div className='relative hidden sm:block'>
            <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
            <input className='input-field pl-9 w-64' placeholder='Search...' />
          </div>
          <button className='border px-3 py-2 rounded-md flex items-center gap-2'><Settings className='w-4 h-4' /> Settings</button>
          <button className='border px-3 py-2 rounded-md flex items-center gap-2'><Bell className='w-4 h-4' /> Alerts</button>
        </div>
      </div>

      


      </div>
    </div>
  )
}

export default AdminDashboard



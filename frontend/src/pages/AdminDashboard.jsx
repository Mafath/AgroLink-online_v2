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
          <a href='/admin/settings' className='block px-3 py-2 rounded-md text-gray-200 bg-white/10'>Settings</a>
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

      {/* KPIs */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <KPI label='Active Users' value={activeUsers} sub='Current total users' />
        <KPI label='Total Listings' value={totalListings} sub='All listings in system' />
        <KPI label='Completed Orders' value='7,902' sub='This week' />
        <KPI label='Revenue' value='LKR 1.2M' sub='This month' />
      </div>

      {/* Main grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          <div className='card'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'><TrendingUp className='w-4 h-4' /><span className='font-medium'>Traffic & Sales</span></div>
              <button className='border px-3 py-1.5 rounded-md text-sm'>Export</button>
            </div>
            <div className='h-56 grid place-items-center text-gray-400 text-sm border border-dashed rounded-md'>
              Chart placeholder
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='card'>
              <div className='flex items-center gap-2 mb-3'><Store className='w-4 h-4' /><span className='font-medium'>Top Farmers</span></div>
              <ul className='space-y-3 text-sm'>
                {['GreenFields Co.', 'AgroPlus', 'Harvest Hub', 'FreshRoots'].map((n, i) => (
                  <li key={i} className='flex items-center justify-between'>
                    <span>{n}</span>
                    <span className='text-gray-500'>+{(Math.random()*100|0)} orders</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className='card'>
              <div className='flex items-center gap-2 mb-3'><Package className='w-4 h-4' /><span className='font-medium'>Recent Listings</span></div>
              <ul className='space-y-3 text-sm'>
                {['Tomatoes', 'Maize', 'Onions', 'Tea Leaves', 'Rice'].map((n, i) => (
                  <li key={i} className='flex items-center justify-between'>
                    <span>{n}</span>
                    <span className='text-gray-500'>LKR {(100+Math.random()*900|0)}/kg</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className='space-y-6'>
          <div className='card'>
            <div className='flex items-center gap-2 mb-3'><Users className='w-4 h-4' /><span className='font-medium'>User Breakdown</span></div>
            <div className='h-40 grid place-items-center text-gray-400 text-sm border border-dashed rounded-md'>
              Donut chart placeholder
            </div>
            <div className='mt-3 grid grid-cols-3 gap-2 text-xs'>
              <div className='bg-gray-50 rounded-md p-2 text-center'>Farmers<br/><span className='font-medium'>1,120</span></div>
              <div className='bg-gray-50 rounded-md p-2 text-center'>Buyers<br/><span className='font-medium'>3,240</span></div>
              <div className='bg-gray-50 rounded-md p-2 text-center'>Drivers<br/><span className='font-medium'>78</span></div>
            </div>
          </div>
          <div className='card'>
            <div className='flex items-center gap-2 mb-3'><Activity className='w-4 h-4' /><span className='font-medium'>System Health</span></div>
            <ul className='space-y-2 text-sm'>
              <li className='flex justify-between'><span>API latency</span><span className='text-green-600'>Normal</span></li>
              <li className='flex justify-between'><span>DB status</span><span className='text-green-600'>Operational</span></li>
              <li className='flex justify-between'><span>Queue backlog</span><span className='text-yellow-600'>Moderate</span></li>
            </ul>
          </div>
          <div className='card'>
            <div className='flex items-center gap-2 mb-3'><ShieldCheck className='w-4 h-4' /><span className='font-medium'>Security</span></div>
            <ul className='space-y-2 text-sm'>
              <li className='flex justify-between'><span>2FA enabled</span><span className='text-green-600'>72%</span></li>
              <li className='flex justify-between'><span>Password resets</span><span className='text-gray-600'>14/day</span></li>
              <li className='flex justify-between'><span>Suspicious logins</span><span className='text-red-600'>2</span></li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default AdminDashboard



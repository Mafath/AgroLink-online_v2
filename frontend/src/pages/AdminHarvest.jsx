import React, { useEffect, useMemo, useState } from 'react'
import { axiosInstance } from '../lib/axios'
import { Info, Calendar, User, ClipboardList, CheckCircle, Pencil, Trash2, Users, Plus, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import DefaultAvatar from '../assets/User Avatar.jpg'

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
)

const AdminHarvest = () => {
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showRequestInfo, setShowRequestInfo] = useState(false)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const { data } = await axiosInstance.get('/harvest/admin/requests')
      setRequests(data?.requests || [])
    } catch (e) {
      toast.error('Failed to load pending harvest requests')
      setRequests([])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchPending() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return requests
    return requests.filter(r => (r.crop || '').toLowerCase().includes(q) || (r.farmerName || '').toLowerCase().includes(q) || (r.farmer?.fullName || '').toLowerCase().includes(q))
  }, [requests, search])

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-semibold ml-2'>Harvest Management</h1>
          <div />
        </div>

        <div className='grid grid-cols-[240px,1fr] gap-6'>
          {/* Sidebar (match Dashboard) */}
          <div className='bg-white rounded-xl border border-gray-200 p-2'>
            <nav className='space-y-1 text-gray-700 text-sm'>
              <a href='/admin' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Dashboards</a>
              <a href='/admin/users' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Users & Roles</a>
              <a href='/admin/inventory' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Inventory</a>
              <a href='/admin/rentals' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Rentals</a>
              <a href='/admin/listings' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Listings</a>
              <a href='/admin/harvest' className='block px-3 py-2 rounded-lg bg-green-100 text-green-700'>Harvest Management</a>
              <a href='/admin/drivers' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Driver Management</a>
              <a href='/admin/logistics' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Logistics</a>
              <a href='/admin/orders' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Orders</a>
            </nav>
          </div>

          {/* Main content */}
          <div className='space-y-6'>
            {/* Pending Requests */}
            <Card>
              <div className='px-4 py-3 border-b border-gray-100 flex items-center justify-between'>
                <div className='text-lg font-medium text-gray-900'>Pending Harvest Requests</div>
                <div className='flex items-center gap-3'>
                  <div className='relative'>
                    <input className='bg-white border border-gray-200 rounded-full h-9 pl-3 pr-3 w-56 text-sm outline-none' placeholder='Search requests...' value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className='max-h-[400px] overflow-y-auto'>
                <table className='min-w-full text-sm'>
                  <thead className='sticky top-0 bg-gray-100 z-10 rounded-t-lg'>
                    <tr className='text-center text-gray-500 border-b align-middle h-12'>
                      <th className='py-3 px-3 rounded-tl-lg pl-3 text-center align-middle'>Farmer</th>
                      <th className='py-3 pl-8 pr-3 text-left align-middle'>Crop</th>
                      <th className='py-3 px-3 text-center align-middle'>Expected Yield</th>
                      <th className='py-3 px-3 text-center align-middle'>Request Date</th>
                      <th className='py-3 px-3 text-center align-middle'>Status</th>
                      <th className='py-3 px-3 rounded-tr-xl text-center align-middle'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td className='py-6 text-center text-gray-500' colSpan={6}>Loading…</td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr><td className='py-6 text-center text-gray-500' colSpan={6}>No pending requests</td></tr>
                    ) : filtered.map(r => (
                      <tr key={r._id} className='border-t align-middle'>
                        <td className='py-2 px-3 text-left align-middle'>
                          <div className='flex items-center justify-start gap-2'>
                            <img
                              src={r.farmer?.profilePic || DefaultAvatar}
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DefaultAvatar; }}
                              className='w-8 h-8 rounded-full object-cover block'
                              alt='avatar'
                            />
                            <span className='text-sm font-medium'>{r.farmerName || r.farmer?.fullName || '—'}</span>
                          </div>
                        </td>
                        <td className='py-2 pl-8 pr-3 text-left align-middle'>
                          <div className='font-medium'>{r.crop}</div>
                          {r.notes && <div className='text-xs text-gray-500 mt-1'>{r.notes}</div>}
                        </td>
                        <td className='py-2 px-3 text-center align-middle'>
                          <span className='text-sm'>{r.expectedYield ? `${r.expectedYield} kg` : '—'}</span>
                        </td>
                        <td className='py-2 px-3 text-center align-middle'>
                          <span className='text-sm'>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</span>
                        </td>
                        <td className='py-2 px-3 text-center align-middle'>
                          <span className={`inline-flex items-center justify-center h-6 px-2 text-xs ${r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 rounded-full' : 'bg-gray-100 text-gray-700 rounded-full'}`}>
                            {r.status || 'PENDING'}
                          </span>
                        </td>
                        <td className='py-2 px-3 flex items-center justify-center gap-3 align-middle'>
                          <button className='icon-btn bg-green-100 text-green-700 px-3 py-1 rounded-xl inline-flex items-center gap-1 text-xs' onClick={() => setSelected(r)} title='View Details'>
                            <Info className='w-3 h-3' />
                            <span className='text-xs'>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Request Info Modal */}
      {showRequestInfo && selected && (
        <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-2xl p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-semibold'>Harvest Request Details</h2>
              <button onClick={() => setShowRequestInfo(false)} className='text-gray-500 hover:text-gray-700'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            {/* Farmer Info */}
            <div className='mb-6'>
              <div className='flex items-center gap-4'>
                <img
                  src={selected.farmer?.profilePic || DefaultAvatar}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DefaultAvatar; }}
                  className='w-16 h-16 rounded-full object-cover'
                  alt='avatar'
                />
                <div>
                  <h3 className='text-lg font-medium text-gray-900'>{selected.farmerName || selected.farmer?.fullName || '—'}</h3>
                  <p className='text-sm text-gray-500'>{selected.farmer?.email || '—'}</p>
                  {selected.farmer?.phone && <p className='text-sm text-gray-500'>{selected.farmer.phone}</p>}
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-4'>
                <div>
                  <label className='text-sm font-medium text-gray-500'>Crop Type</label>
                  <p className='text-sm text-gray-900 mt-1'>{selected.crop}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>Expected Yield</label>
                  <p className='text-sm text-gray-900 mt-1'>{selected.expectedYield ? `${selected.expectedYield} kg` : 'Not specified'}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>Request Date</label>
                  <p className='text-sm text-gray-900 mt-1'>
                    {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='text-sm font-medium text-gray-500'>Status</label>
                  <p className='text-sm text-gray-900 mt-1'>{selected.status || 'PENDING'}</p>
                </div>
                {selected.notes && (
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Farmer Notes</label>
                    <p className='text-sm text-gray-900 mt-1'>{selected.notes}</p>
                  </div>
                )}
                <div>
                  <label className='text-sm font-medium text-gray-500'>Request ID</label>
                  <p className='text-sm text-gray-900 mt-1 font-mono'>{selected._id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminHarvest
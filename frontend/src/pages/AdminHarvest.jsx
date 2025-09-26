import React, { useEffect, useMemo, useState } from 'react'
import { axiosInstance } from '../lib/axios'
import { Info, Calendar, User, ClipboardList, CheckCircle, Pencil, Trash2, Users, Plus, Eye, EyeOff, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import DefaultAvatar from '../assets/User Avatar.jpg'
import AdminSidebar from '../components/AdminSidebar'

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
)

const AdminHarvest = () => {
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [searchType, setSearchType] = useState('all') // 'all', 'farmer', 'crop'
  const [selected, setSelected] = useState(null)
  const [showRequestInfo, setShowRequestInfo] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [availableAgronomists, setAvailableAgronomists] = useState([])
  const [assignForm, setAssignForm] = useState({ expertId: '', expertName: '', adminAdvice: '', scheduledDate: '' })

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

  const fetchAvailableAgronomists = async () => {
    try {
      const { data } = await axiosInstance.get('/auth/admin/users', {
        params: { role: 'AGRONOMIST', availability: 'AVAILABLE', status: 'ACTIVE' }
      })
      setAvailableAgronomists(data?.data || [])
    } catch (e) {
      console.error('Failed to fetch agronomists:', e)
      setAvailableAgronomists([])
    }
  }

  const handleAssignAgronomist = async () => {
    if (!selected || !assignForm.expertId || !assignForm.expertName) {
      toast.error('Please select an agronomist and provide required information')
      return
    }

    try {
      await axiosInstance.post(`/harvest/${selected._id}/admin/schedule`, {
        expertId: assignForm.expertId,
        expertName: assignForm.expertName,
        adminAdvice: assignForm.adminAdvice,
        scheduledDate: assignForm.scheduledDate || selected.harvestDate
      })
      
      toast.success('Agronomist assigned successfully!')
      setShowAssignModal(false)
      setAssignForm({ expertId: '', expertName: '', adminAdvice: '', scheduledDate: '' })
      fetchPending()
    } catch (error) {
      console.error('Failed to assign agronomist:', error)
      const message = error?.response?.data?.error?.message || 'Failed to assign agronomist'
      toast.error(message)
    }
  }

  const openAssignModal = (request) => {
    setSelected(request)
    setAssignForm({
      expertId: '',
      expertName: '',
      adminAdvice: '',
      scheduledDate: request.harvestDate || ''
    })
    setShowAssignModal(true)
    fetchAvailableAgronomists()
  }

  useEffect(() => { fetchPending() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return requests
    
    return requests.filter(r => {
      switch (searchType) {
        case 'farmer':
          return (r.farmerName || '').toLowerCase().includes(q) || 
                 (r.farmer?.fullName || '').toLowerCase().includes(q)
        case 'crop':
          return (r.crop || '').toLowerCase().includes(q) ||
                 (r.personalizedData?.variety || '').toLowerCase().includes(q)
        default: // 'all'
          return (r.crop || '').toLowerCase().includes(q) || 
                 (r.farmerName || '').toLowerCase().includes(q) || 
                 (r.farmer?.fullName || '').toLowerCase().includes(q) ||
                 (r.personalizedData?.variety || '').toLowerCase().includes(q) ||
                 (r.personalizedData?.farmLocation || '').toLowerCase().includes(q) ||
                 (r.personalizedData?.soilType || '').toLowerCase().includes(q) ||
                 (r.notes || '').toLowerCase().includes(q)
      }
    })
  }, [requests, search, searchType])

  // Calculate statistics
  const stats = useMemo(() => {
    const pending = requests.filter(r => r.status === 'REQUEST_PENDING').length
    const assigned = requests.filter(r => ['ASSIGNED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'].includes(r.status)).length
    const completed = requests.filter(r => r.status === 'COMPLETED').length
    const total = requests.length
    
    // Calculate percentages for charts
    const pendingPercent = total > 0 ? (pending / total) * 100 : 0
    const assignedPercent = total > 0 ? (assigned / total) * 100 : 0
    const completedPercent = total > 0 ? (completed / total) * 100 : 0
    
    // Group by crop type for crop distribution chart
    const cropStats = requests.reduce((acc, r) => {
      const crop = r.crop || 'Unknown'
      acc[crop] = (acc[crop] || 0) + 1
      return acc
    }, {})
    
    // Group by month for timeline chart
    const monthlyStats = requests.reduce((acc, r) => {
      if (r.createdAt) {
        const month = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        acc[month] = (acc[month] || 0) + 1
      }
      return acc
    }, {})
    
    return { 
      pending, 
      assigned, 
      completed, 
      total, 
      pendingPercent, 
      assignedPercent, 
      completedPercent,
      cropStats,
      monthlyStats
    }
  }, [requests])

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-3xl font-semibold ml-2'>Harvest Management</h1>
            <p className='text-sm text-gray-600 ml-2 mt-1'>Review and manage harvest requests from farmers, assign agronomists, and track harvest activities</p>
          </div>
          <div />
        </div>

        <div className='grid grid-cols-[240px,1fr] gap-6'>
          {/* Sidebar */}
          <AdminSidebar activePage="harvest" />

          {/* Main content */}
          <div className='space-y-6'>

            {/* Pending Requests */}
            <Card>
              <div className='px-4 py-3 border-b border-gray-100 flex items-center justify-between'>
                <div className='text-lg font-medium text-gray-900'>Pending Harvest Requests</div>
                <div className='flex items-center gap-3'>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => setSearchType('farmer')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        searchType === 'farmer'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      Search by Farmer
                    </button>
                    <button
                      onClick={() => setSearchType('crop')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        searchType === 'crop'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      Search by Crop
                    </button>
                    <button
                      onClick={() => setSearchType('all')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        searchType === 'all'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      Search All
                    </button>
                  </div>
                  <div className='relative'>
                    <input 
                      className='bg-white border border-gray-200 rounded-full h-9 pl-3 pr-3 w-56 text-sm outline-none' 
                      placeholder={
                        searchType === 'farmer' ? 'Search by farmer name...' :
                        searchType === 'crop' ? 'Search by crop type or variety...' :
                        'Search by farmer name, crop type, variety, location...'
                      } 
                      value={search} 
                      onChange={e => setSearch(e.target.value)} 
                    />
                  </div>
                  <button className='btn-primary whitespace-nowrap px-4 py-2 text-sm inline-flex items-center gap-2'>
                    <Plus className='w-4 h-4' />
                    Add Agronomist
                  </button>
                </div>
              </div>
              <div className='max-h-[400px] overflow-y-auto'>
                <table className='min-w-full text-sm'>
                  <thead className='sticky top-0 bg-gray-100 z-10 rounded-t-lg'>
                    <tr className='text-center text-gray-500 border-b align-middle h-12'>
                      <th className='py-3 px-3 rounded-tl-lg pl-3 text-center align-middle'>Farmer</th>
                      <th className='py-3 pl-8 pr-3 text-left align-middle'>Crop & Variety</th>
                      <th className='py-3 px-3 text-center align-middle'>Farm Size</th>
                      <th className='py-3 px-3 text-center align-middle'>Expected Yield</th>
                      <th className='py-3 px-3 text-center align-middle'>Request Date</th>
                      <th className='py-3 px-3 text-center align-middle'>Status</th>
                      <th className='py-3 px-3 rounded-tr-xl text-center align-middle'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td className='py-6 text-center text-gray-500' colSpan={7}>Loading…</td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr><td className='py-6 text-center text-gray-500' colSpan={7}>No pending requests</td></tr>
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
                            <div>
                              <div className='text-sm font-medium'>{r.farmerName || r.farmer?.fullName || '—'}</div>
                              {r.personalizedData?.farmLocation && (
                                <div className='text-xs text-gray-500'>{r.personalizedData.farmLocation}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className='py-2 pl-8 pr-3 text-left align-middle'>
                          <div className='font-medium'>{r.crop}</div>
                          {r.personalizedData?.variety && (
                            <div className='text-xs text-gray-500 mt-1'>Variety: {r.personalizedData.variety}</div>
                          )}
                          {r.notes && <div className='text-xs text-gray-500 mt-1'>{r.notes}</div>}
                        </td>
                        <td className='py-2 px-3 text-center align-middle'>
                          <span className='text-sm'>{r.personalizedData?.farmSize || '—'}</span>
                        </td>
                        <td className='py-2 px-3 text-center align-middle'>
                          <span className='text-sm'>{r.expectedYield ? `${r.expectedYield} kg` : '—'}</span>
                        </td>
                        <td className='py-2 px-3 text-center align-middle'>
                          <span className='text-sm'>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</span>
                        </td>
                        <td className='py-2 px-3 text-center align-middle'>

                          <span className={`inline-flex items-center justify-center h-6 px-2 text-xs ${
                            r.status === 'REQUEST_PENDING' ? 'bg-yellow-100 text-yellow-700 rounded-full' :
                            r.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700 rounded-full' :
                            r.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 rounded-full' :
                            r.status === 'SCHEDULED' ? 'bg-purple-100 text-purple-700 rounded-full' :
                            r.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-700 rounded-full' :
                            r.status === 'COMPLETED' ? 'bg-green-100 text-green-700 rounded-full' :
                            r.status === 'CANCELLED' ? 'bg-red-100 text-red-700 rounded-full' :
                            'bg-gray-100 text-gray-700 rounded-full'
                          }`}>
                            {r.status === 'REQUEST_PENDING' ? 'Pending' :
                             r.status === 'ASSIGNED' ? 'Assigned' :
                             r.status === 'ACCEPTED' ? 'Accepted' :
                             r.status === 'SCHEDULED' ? 'Scheduled' :
                             r.status === 'IN_PROGRESS' ? 'In Progress' :
                             r.status === 'COMPLETED' ? 'Completed' :
                             r.status === 'CANCELLED' ? 'Cancelled' :
                             r.status || 'Pending'}
                          </span>
                        </td>
                        <td className='py-2 px-3 flex items-center justify-center gap-3 align-middle'>
                          <button className='icon-btn bg-green-100 text-green-700 px-3 py-1 rounded-xl inline-flex items-center gap-1 text-xs' onClick={() => { setSelected(r); setShowRequestInfo(true); }} title='View Details'>

                            <Info className='w-3 h-3' />
                            <span className='text-xs'>Info</span>
                          </button>
                          <button 
                            className='icon-btn bg-green-100 text-green-700 px-3 py-1 rounded-xl inline-flex items-center gap-1 text-xs hover:bg-green-200 transition-colors' 
                            onClick={() => {
                              // TODO: Implement assign agronomist functionality
                              toast.success('Assign Agronomist feature coming soon!');
                            }} 
                            title='Assign Agronomist'
                          >
                            <Users className='w-3 h-3' />
                            <span className='text-xs'>Assign</span>
                          </button>
                          {r.status === 'REQUEST_PENDING' && (
                            <button className='icon-btn bg-blue-100 text-blue-700 px-3 py-1 rounded-xl inline-flex items-center gap-1 text-xs' onClick={() => openAssignModal(r)} title='Assign Agronomist'>
                              <UserCheck className='w-3 h-3' />
                              <span className='text-xs'>Assign</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Statistics Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
              <Card className='p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>Total Requests</p>
                    <p className='text-2xl font-bold text-gray-900'>{stats.total}</p>
                  </div>
                  <div className='p-3 bg-blue-100 rounded-full'>
                    <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className='p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>Pending</p>
                    <p className='text-2xl font-bold text-yellow-600'>{stats.pending}</p>
                  </div>
                  <div className='p-3 bg-yellow-100 rounded-full'>
                    <svg className='w-6 h-6 text-yellow-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className='p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>Assigned/Ongoing</p>
                    <p className='text-2xl font-bold text-blue-600'>{stats.assigned}</p>
                  </div>
                  <div className='p-3 bg-blue-100 rounded-full'>
                    <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className='p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>Completed</p>
                    <p className='text-2xl font-bold text-green-600'>{stats.completed}</p>
                  </div>
                  <div className='p-3 bg-green-100 rounded-full'>
                    <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Section */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
              {/* Status Distribution Pie Chart */}
              <Card className='p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>📊 Status Distribution</h3>
                <div className='flex items-center justify-center'>
                  <div className='relative w-48 h-48'>
                    {/* Pie Chart using CSS */}
                    <div className='absolute inset-0 rounded-full border-8 border-gray-200'></div>
                    <div 
                      className='absolute inset-0 rounded-full border-8 border-yellow-500'
                      style={{
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((stats.pendingPercent / 100) * 2 * Math.PI - Math.PI/2)}% ${50 + 50 * Math.sin((stats.pendingPercent / 100) * 2 * Math.PI - Math.PI/2)}%)`
                      }}
                    ></div>
                    <div 
                      className='absolute inset-0 rounded-full border-8 border-blue-500'
                      style={{
                        clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((stats.pendingPercent / 100) * 2 * Math.PI - Math.PI/2)}% ${50 + 50 * Math.sin((stats.pendingPercent / 100) * 2 * Math.PI - Math.PI/2)}%, ${50 + 50 * Math.cos(((stats.pendingPercent + stats.assignedPercent) / 100) * 2 * Math.PI - Math.PI/2)}% ${50 + 50 * Math.sin(((stats.pendingPercent + stats.assignedPercent) / 100) * 2 * Math.PI - Math.PI/2)}%)`
                      }}
                    ></div>
                    <div 
                      className='absolute inset-0 rounded-full border-8 border-green-500'
                      style={{
                        clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(((stats.pendingPercent + stats.assignedPercent) / 100) * 2 * Math.PI - Math.PI/2)}% ${50 + 50 * Math.sin(((stats.pendingPercent + stats.assignedPercent) / 100) * 2 * Math.PI - Math.PI/2)}%, 50% 0%)`
                      }}
                    ></div>
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <div className='text-center'>
                        <div className='text-2xl font-bold text-gray-900'>{stats.total}</div>
                        <div className='text-sm text-gray-500'>Total</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='mt-4 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
                      <span className='text-sm text-gray-600'>Pending</span>
                    </div>
                    <span className='text-sm font-medium'>{stats.pending} ({stats.pendingPercent.toFixed(1)}%)</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                      <span className='text-sm text-gray-600'>Assigned/Ongoing</span>
                    </div>
                    <span className='text-sm font-medium'>{stats.assigned} ({stats.assignedPercent.toFixed(1)}%)</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                      <span className='text-sm text-gray-600'>Completed</span>
                    </div>
                    <span className='text-sm font-medium'>{stats.completed} ({stats.completedPercent.toFixed(1)}%)</span>
                  </div>
                </div>
              </Card>

              {/* Crop Distribution Chart */}
              <Card className='p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>🌾 Crop Distribution</h3>
                <div className='space-y-3'>
                  {Object.entries(stats.cropStats).map(([crop, count]) => {
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                    return (
                      <div key={crop} className='space-y-1'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium text-gray-700'>{crop}</span>
                          <span className='text-sm text-gray-500'>{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div 
                            className='bg-blue-500 h-2 rounded-full transition-all duration-300'
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(stats.cropStats).length === 0 && (
                    <div className='text-center py-8 text-gray-500'>
                      <div className='text-4xl mb-2'>🌱</div>
                      <p>No crop data available</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Monthly Requests Line Chart */}
            <Card className='p-6 mb-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>📈 Monthly Requests Trend</h3>
              <div className='space-y-4'>
                {Object.entries(stats.monthlyStats).length > 0 ? (
                  <>
                    {/* Chart Area with Y-axis */}
                    <div className='flex'>
                      {/* Y-axis */}
                      <div className='flex flex-col justify-between h-64 pr-2'>
                        {(() => {
                          const maxCount = Math.max(...Object.values(stats.monthlyStats))
                          const ticks = []
                          const numTicks = 5
                          for (let i = 0; i <= numTicks; i++) {
                            const value = Math.round((maxCount / numTicks) * i)
                            ticks.push(value)
                          }
                          return ticks.reverse().map((tick, index) => (
                            <div key={tick} className='flex items-center justify-end h-0'>
                              <div className='text-xs text-gray-500 font-medium'>{tick}</div>
                              <div className='w-2 h-px bg-gray-300 ml-1'></div>
                            </div>
                          ))
                        })()}
                      </div>
                      
                      {/* Chart area */}
                      <div className='flex-1 px-4 border-b border-gray-200 relative h-64'>
                        {/* Y-axis grid lines */}
                        {(() => {
                          const maxCount = Math.max(...Object.values(stats.monthlyStats))
                          const numTicks = 5
                          const ticks = []
                          for (let i = 0; i <= numTicks; i++) {
                            const value = Math.round((maxCount / numTicks) * i)
                            ticks.push(value)
                          }
                          return ticks.map((tick, index) => (
                            <div 
                              key={tick}
                              className='absolute w-full h-px bg-gray-100'
                              style={{ bottom: `${(index / numTicks) * 100}%` }}
                            ></div>
                          ))
                        })()}
                        
                        {/* Line Chart */}
                        <svg className='absolute inset-0 w-full h-full' viewBox='0 0 100 100' preserveAspectRatio='none'>
                          {/* Line path */}
                          <path
                            d={(() => {
                              const entries = Object.entries(stats.monthlyStats)
                              const maxCount = Math.max(...Object.values(stats.monthlyStats))
                              const points = entries.map(([month, count], index) => {
                                const x = (index / (entries.length - 1)) * 100
                                const y = 100 - (count / maxCount) * 100
                                return `${x},${y}`
                              }).join(' L ')
                              return `M ${points}`
                            })()}
                            fill='none'
                            stroke='#3B82F6'
                            strokeWidth='0.5'
                            className='drop-shadow-sm'
                          />
                          
                          {/* Area under the line */}
                          <path
                            d={(() => {
                              const entries = Object.entries(stats.monthlyStats)
                              const maxCount = Math.max(...Object.values(stats.monthlyStats))
                              const points = entries.map(([month, count], index) => {
                                const x = (index / (entries.length - 1)) * 100
                                const y = 100 - (count / maxCount) * 100
                                return `${x},${y}`
                              }).join(' L ')
                              return `M 0,100 L ${points} L 100,100 Z`
                            })()}
                            fill='url(#gradient)'
                            opacity='0.1'
                          />
                          
                          {/* Gradient definition */}
                          <defs>
                            <linearGradient id='gradient' x1='0%' y1='0%' x2='0%' y2='100%'>
                              <stop offset='0%' stopColor='#3B82F6' stopOpacity='0.3' />
                              <stop offset='100%' stopColor='#3B82F6' stopOpacity='0' />
                            </linearGradient>
                          </defs>
                          
                          {/* Data points */}
                          {Object.entries(stats.monthlyStats).map(([month, count], index) => {
                            const maxCount = Math.max(...Object.values(stats.monthlyStats))
                            const x = (index / (Object.entries(stats.monthlyStats).length - 1)) * 100
                            const y = 100 - (count / maxCount) * 100
                            return (
                              <g key={month}>
                                <circle
                                  cx={x}
                                  cy={y}
                                  r='1.5'
                                  fill='#3B82F6'
                                  className='hover:r-2 transition-all duration-200'
                                />
                                <circle
                                  cx={x}
                                  cy={y}
                                  r='3'
                                  fill='#3B82F6'
                                  opacity='0.2'
                                  className='hover:opacity-0.4 transition-all duration-200'
                                />
                              </g>
                            )
                          })}
                        </svg>
                        
                        {/* Month labels */}
                        <div className='absolute bottom-0 left-0 right-0 flex justify-between px-4'>
                          {Object.entries(stats.monthlyStats).map(([month, count]) => (
                            <div key={month} className='text-xs text-gray-500 text-center leading-tight'>
                              {month}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Chart Legend and Stats */}
                    <div className='flex items-center justify-between text-sm text-gray-600'>
                      <div className='flex items-center gap-4'>
                        <div className='flex items-center gap-2'>
                          <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                          <span>Monthly requests trend</span>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div>Total: {stats.total} requests</div>
                        <div>Peak: {Math.max(...Object.values(stats.monthlyStats))} requests</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className='flex items-center justify-center h-64 text-gray-500'>
                    <div className='text-center'>
                      <div className='text-4xl mb-2'>📈</div>
                      <p>No monthly data available</p>
                      <p className='text-sm mt-1'>Submit some harvest requests to see the trend</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
        </div>
      </div>

      {/* Request Info Modal */}
      {showRequestInfo && selected && (
        <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-2xl p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h2 className='text-xl font-semibold'>Comprehensive Harvest Request</h2>
                <p className='text-sm text-gray-500 mt-1'>Detailed farm information and harvest requirements</p>
              </div>
              <button onClick={() => setShowRequestInfo(false)} className='text-gray-500 hover:text-gray-700'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            {/* Quick Summary */}
            <div className='bg-gray-50 rounded-lg p-4 mb-6'>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
                <div>
                  <div className='text-lg font-semibold text-gray-900'>{selected.crop}</div>
                  <div className='text-xs text-gray-500'>Crop Type</div>
                </div>
                <div>
                  <div className='text-lg font-semibold text-gray-900'>{selected.expectedYield ? `${selected.expectedYield} kg` : '—'}</div>
                  <div className='text-xs text-gray-500'>Expected Yield</div>
                </div>
                <div>
                  <div className='text-lg font-semibold text-gray-900'>{selected.personalizedData?.farmSize || '—'}</div>
                  <div className='text-xs text-gray-500'>Farm Size</div>
                </div>
                <div>
                  <div className='text-lg font-semibold text-gray-900'>{selected.personalizedData?.variety || '—'}</div>
                  <div className='text-xs text-gray-500'>Variety</div>
                </div>
              </div>
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
                  {selected.personalizedData?.contactInfo && (
                    <p className='text-sm text-gray-500'>Contact: {selected.personalizedData.contactInfo}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Request Details */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
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
                  <label className='text-sm font-medium text-gray-500'>Harvest Date</label>
                  <p className='text-sm text-gray-900 mt-1'>{selected.harvestDate ? new Date(selected.harvestDate).toLocaleDateString() : 'Not specified'}</p>
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
                  <p className='text-sm text-gray-900 mt-1'>
                    {selected.status === 'REQUEST_PENDING' ? 'Pending' :
                     selected.status === 'ASSIGNED' ? 'Assigned' :
                     selected.status === 'ACCEPTED' ? 'Accepted' :
                     selected.status === 'SCHEDULED' ? 'Scheduled' :
                     selected.status === 'IN_PROGRESS' ? 'In Progress' :
                     selected.status === 'COMPLETED' ? 'Completed' :
                     selected.status === 'CANCELLED' ? 'Cancelled' :
                     selected.status || 'Pending'}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>Request ID</label>
                  <p className='text-sm text-gray-900 mt-1 font-mono'>{selected._id}</p>
                </div>
                {selected.notes && (
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Farmer Notes</label>
                    <p className='text-sm text-gray-900 mt-1'>{selected.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Personalized Data Section */}
            {selected.personalizedData && (
              <div className='border-t border-gray-200 pt-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>🌱 Personalized Farm Details</h3>
                
                {/* Farm & Crop Information */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                  <div className='space-y-4'>
                    <h4 className='text-md font-medium text-gray-700 border-b border-gray-200 pb-2'>Farm Information</h4>
                    {selected.personalizedData.farmLocation && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Farm Location</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.farmLocation}</p>
                      </div>
                    )}
                    {selected.personalizedData.farmSize && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Farm Size</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.farmSize}</p>
                      </div>
                    )}
                    {selected.personalizedData.variety && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Crop Variety</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.variety}</p>
                      </div>
                    )}
                    {selected.personalizedData.plantingDate && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Planting Date</label>
                        <p className='text-sm text-gray-900 mt-1'>{new Date(selected.personalizedData.plantingDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  <div className='space-y-4'>
                    <h4 className='text-md font-medium text-gray-700 border-b border-gray-200 pb-2'>Growing Conditions</h4>
                    {selected.personalizedData.soilType && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Soil Type</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.soilType}</p>
                      </div>
                    )}
                    {selected.personalizedData.irrigationMethod && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Irrigation Method</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.irrigationMethod}</p>
                      </div>
                    )}
                    {selected.personalizedData.fertilizerUsed && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Fertilizer Used</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.fertilizerUsed}</p>
                      </div>
                    )}
                    {selected.personalizedData.pestDiseaseIssues && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Pest/Disease Issues</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.pestDiseaseIssues}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Harvest Requirements */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                  <div className='space-y-4'>
                    <h4 className='text-md font-medium text-gray-700 border-b border-gray-200 pb-2'>Harvest Requirements</h4>
                    {selected.personalizedData.harvestMethodPreference && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Harvest Method</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.harvestMethodPreference}</p>
                      </div>
                    )}
                    {selected.personalizedData.storageRequirements && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Storage Requirements</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.storageRequirements}</p>
                      </div>
                    )}
                    {selected.personalizedData.transportationNeeds && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Transportation Needs</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.transportationNeeds}</p>
                      </div>
                    )}
                    {selected.personalizedData.qualityStandards && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Quality Standards</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.qualityStandards}</p>
                      </div>
                    )}
                  </div>

                  <div className='space-y-4'>
                    <h4 className='text-md font-medium text-gray-700 border-b border-gray-200 pb-2'>Special Requests</h4>
                    {selected.personalizedData.timingConstraints && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Timing Constraints</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.timingConstraints}</p>
                      </div>
                    )}
                    {selected.personalizedData.budgetConsiderations && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Budget Considerations</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.budgetConsiderations}</p>
                      </div>
                    )}
                    {selected.personalizedData.additionalServices && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Additional Services</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.additionalServices}</p>
                      </div>
                    )}
                    {selected.personalizedData.weatherConditions && (
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Weather Conditions</label>
                        <p className='text-sm text-gray-900 mt-1'>{selected.personalizedData.weatherConditions}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-6'>
              <button
                onClick={() => setShowRequestInfo(false)}
                className='border border-gray-300 px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
              >
                Close
              </button>
              <button
                onClick={() => {
                  // TODO: Implement assign agronomist functionality
                  toast.success('Assign Agronomist feature coming soon!');
                  setShowRequestInfo(false);
                }}
                className='btn-primary px-4 py-2 rounded-md text-sm font-medium'
              >
                Assign Agronomist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Agronomist Modal */}
      {showAssignModal && selected && (
        <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-2xl p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-semibold'>Assign Agronomist</h2>
              <button onClick={() => setShowAssignModal(false)} className='text-gray-500 hover:text-gray-700'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            {/* Request Info */}
            <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
              <h3 className='font-medium text-gray-900 mb-2'>Harvest Request Details</h3>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-gray-500'>Farmer:</span> {selected.farmerName || selected.farmer?.fullName}
                </div>
                <div>
                  <span className='text-gray-500'>Crop:</span> {selected.crop}
                </div>
                <div>
                  <span className='text-gray-500'>Expected Yield:</span> {selected.expectedYield ? `${selected.expectedYield} kg` : 'Not specified'}
                </div>
                <div>
                  <span className='text-gray-500'>Harvest Date:</span> {selected.harvestDate ? new Date(selected.harvestDate).toLocaleDateString() : 'Not specified'}
                </div>
              </div>
            </div>

            {/* Assignment Form */}
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Select Agronomist *</label>
                <select
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  value={assignForm.expertId}
                  onChange={(e) => {
                    const selectedAgronomist = availableAgronomists.find(a => a._id === e.target.value)
                    setAssignForm({
                      ...assignForm,
                      expertId: e.target.value,
                      expertName: selectedAgronomist ? selectedAgronomist.fullName : ''
                    })
                  }}
                  required
                >
                  <option value=''>Choose an agronomist...</option>
                  {availableAgronomists.map(agronomist => (
                    <option key={agronomist._id} value={agronomist._id}>
                      {agronomist.fullName} - {agronomist.expertise}
                    </option>
                  ))}
                </select>
                {availableAgronomists.length === 0 && (
                  <p className='text-sm text-red-600 mt-1'>No available agronomists found</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Admin Advice</label>
                <textarea
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  rows='3'
                  value={assignForm.adminAdvice}
                  onChange={(e) => setAssignForm({ ...assignForm, adminAdvice: e.target.value })}
                  placeholder='Provide any specific advice or instructions for the agronomist...'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Scheduled Date</label>
                <input
                  type='date'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  value={assignForm.scheduledDate}
                  onChange={(e) => setAssignForm({ ...assignForm, scheduledDate: e.target.value })}
                />
                <p className='text-xs text-gray-500 mt-1'>Leave empty to use the farmer's preferred harvest date</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center justify-end gap-3 mt-6'>
              <button
                onClick={() => setShowAssignModal(false)}
                className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                onClick={handleAssignAgronomist}
                disabled={!assignForm.expertId || !assignForm.expertName}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
              >
                Assign Agronomist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminHarvest

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
          {/* Sidebar */}
          <AdminSidebar activePage="harvest" />

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
                            <span className='text-xs'>View</span>
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
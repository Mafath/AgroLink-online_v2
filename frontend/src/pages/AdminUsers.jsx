import React, { useEffect, useMemo, useState } from 'react'
import { axiosInstance } from '../lib/axios'
import { Eye, Pencil, Trash2, ChevronDown } from 'lucide-react'
import DefaultAvatar from '../assets/User Avatar.jpg'

const roles = ['Admin', 'Farmer', 'Buyer', 'Driver']
const statuses = ['Active', 'Suspended']
// removed verification fields

const AdminUsers = () => {
  const [query, setQuery] = useState({ role: '', status: '' })
  const [resp, setResp] = useState({ data: [] })
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = { ...query }
      Object.keys(params).forEach(k => params[k] === '' && delete params[k])
      const res = await axiosInstance.get('auth/admin/users', { params })
      setResp(res.data)
    } catch (e) {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [query.role, query.status])

  const items = resp.data
  const filteredItems = useMemo(() => {
    const search = (query.search || '').trim().toLowerCase()
    if (!search) return items
    return items.filter(u => {
      const name = (u.fullName || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      const role = (u.role || '').toLowerCase()
      return name.includes(search) || email.includes(search) || role.includes(search)
    })
  }, [items, query.search])


  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  return (
    <div className='p-4 max-w-7xl mx-auto'>
      <div className='w-full'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-2xl font-semibold'>User & Role Management</h1>
          <div className='text-sm text-gray-500'>Total Registered Users: {filteredItems.length}</div>
        </div>

        {/* Filters */}
        <div className='card mb-4'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
            <div className='w-full md:flex-1 md:flex md:justify-center'>
              <input
                className='input-field rounded-full w-full md:w-80'
                placeholder='Search by name, role, or email'
                value={query.search || ''}
                onChange={e => setQuery(q => ({ ...q, search: e.target.value }))}
              />
            </div>
            <div className='w-full md:w-auto flex items-center justify-end gap-2'>
              <div className='relative'>
                <select className='input-field w-32 appearance-none pr-8 h-9 text-sm py-1' value={query.role} onChange={e => setQuery(q => ({ ...q, role: e.target.value }))}>
                  <option value=''>All Roles</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown className='w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none' />
              </div>
              <div className='relative'>
                <select className='input-field w-32 appearance-none pr-8 h-9 text-sm py-1' value={query.status} onChange={e => setQuery(q => ({ ...q, status: e.target.value }))}>
                  <option value=''>Any Status</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className='w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none' />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className='card overflow-x-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='text-left text-gray-500'>
                <th className='py-2 pr-4'>Profile Image</th>
                <th className='py-2 pr-4'>Full Name</th>
                <th className='py-2 pr-4'>Role</th>
                <th className='py-2 pr-4'>Contact</th>
                <th className='py-2 pr-4'>Status</th>
                <th className='py-2 pr-4'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className='py-6 text-center text-gray-500' colSpan={7}>Loading…</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td className='py-6 text-center text-gray-500' colSpan={7}>No users</td></tr>
              ) : filteredItems.map(u => (
                <tr key={u._id} className='border-t'>
                  <td className='py-2 pr-4'>
                    <img
                      src={u.profilePic || DefaultAvatar}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DefaultAvatar; }}
                      className='w-8 h-8 rounded-full object-cover'
                      alt='avatar'
                    />
                  </td>
                  <td className='py-2 pr-4'>{u.fullName || '—'}</td>
                  <td className='py-2 pr-4'>{capitalizeFirst(u.role)}</td>
                  <td className='py-2 pr-4'>
                    <div>{u.email}</div>
                    {u.phone && <div className='text-xs text-gray-500'>{u.phone}</div>}
                  </td>
                  <td className='py-2 pr-4'>
                    <span className={`px-2 py-0.5 rounded text-xs ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span>
                  </td>
                  <td className='py-2 pr-4 flex items-center gap-4 mt-2'>
                    <button className='icon-btn bg-blue-100 text-blue-700 px-3 py-1 rounded-xl' onClick={() => setSelected(u)} title='Edit'><Pencil className='w-4 h-4' /></button>
                    <button className='icon-btn bg-red-100 text-red-700 px-3 py-1 rounded-xl' onClick={async () => { if (confirm('Delete user?')) { await axiosInstance.delete(`auth/admin/users/${u._id}`); fetchUsers(); }}} title='Delete'><Trash2 className='w-4 h-4' /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* No pagination */}
      </div>

      {/* Details modal */}
      {selected && (
        <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-3xl p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-semibold'>User Details</h2>
              <button onClick={() => setSelected(null)} className='text-gray-500'>Close</button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Left: profile */}
              <div className='space-y-2'>
                <div className='flex items-center gap-3'>
                  <img
                    src={selected.profilePic || DefaultAvatar}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DefaultAvatar; }}
                    className='w-12 h-12 rounded-full object-cover'
                    alt='avatar'
                  />
                  <div>
                    <div className='font-medium'>{selected.fullName || '—'}</div>
                    <div className='text-xs text-gray-500'>{selected.role}</div>
                  </div>
                </div>
                <div className='text-sm'>Email: {selected.email}</div>
                {selected.phone && <div className='text-sm'>Phone: {selected.phone}</div>}
                <div className='text-sm text-gray-500'>Member since {new Date(selected.createdAt).toLocaleDateString()}</div>
              </div>
              {/* Right: actions */}
              <div className='space-y-3'>
                {/* Removed verification actions */}
                <div>
                  <label className='text-xs text-gray-500'>Change Role</label>
                  <select className='input-field mt-1' value={selected.role} onChange={async (e) => { const role = e.target.value; await axiosInstance.put(`auth/admin/users/${selected._id}`, { role }); fetchUsers(); setSelected(s => ({ ...s, role })); }}>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  {selected.status === 'ACTIVE' ? (
                    <button className='border px-3 py-2 rounded-md' onClick={async () => { await axiosInstance.put(`auth/admin/users/${selected._id}`, { status: 'SUSPENDED' }); fetchUsers(); setSelected(s => ({ ...s, status: 'SUSPENDED' })); }}>Suspend</button>
                  ) : (
                    <button className='btn-primary' onClick={async () => { await axiosInstance.put(`auth/admin/users/${selected._id}`, { status: 'ACTIVE' }); fetchUsers(); setSelected(s => ({ ...s, status: 'ACTIVE' })); }}>Activate</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers



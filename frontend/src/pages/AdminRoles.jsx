import React, { useState } from 'react'

const defaultMatrix = {
  ADMIN: { READ: true, WRITE: true, APPROVE: true, DELETE: true },
  FARMER: { READ: true, WRITE: true, APPROVE: false, DELETE: false },
  BUYER: { READ: true, WRITE: false, APPROVE: false, DELETE: false },
  DRIVER: { READ: true, WRITE: false, APPROVE: false, DELETE: false },
}

const perms = ['READ', 'WRITE', 'APPROVE', 'DELETE']
const roles = Object.keys(defaultMatrix)

const AdminRoles = () => {
  const [matrix, setMatrix] = useState(defaultMatrix)

  const toggle = (role, perm) => {
    setMatrix(prev => ({ ...prev, [role]: { ...prev[role], [perm]: !prev[role][perm] } }))
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-semibold ml-2'>Roles & Permissions</h1>
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
              <a href='/admin/harvest' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Harvest Management</a>
              <a href='/admin/drivers' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Driver Management</a>
              <a href='/admin/logistics' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Logistics</a>
              <a href='/admin/orders' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Orders</a>
            </nav>
          </div>

          {/* Main content */}
          <div className='space-y-6'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4'>
              <h1 className='text-2xl font-semibold mb-4'>Roles & Permissions</h1>
              <div className='card overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead>
                    <tr className='text-left text-gray-500'>
                      <th className='py-2 pr-4'>Role</th>
                      {perms.map(p => <th key={p} className='py-2 pr-4'>{p}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map(role => (
                      <tr key={role} className='border-t'>
                        <td className='py-2 pr-4 font-medium'>{role}</td>
                        {perms.map(p => (
                          <td key={p} className='py-2 pr-4'>
                            <label className='inline-flex items-center gap-2'>
                              <input type='checkbox' checked={!!matrix[role][p]} onChange={() => toggle(role, p)} />
                            </label>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className='mt-4'>
                <button className='btn-primary'>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminRoles



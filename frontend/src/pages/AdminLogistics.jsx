import React from 'react'

const AdminLogistics = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        <div className='grid grid-cols-[240px,1fr] gap-6'>
          <div className='bg-white rounded-xl border border-gray-200 p-2'>
            <nav className='space-y-1 text-gray-700 text-sm'>
              <a href='/admin' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Dashboards</a>
              <a href='/admin/users' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Users & Roles</a>
              <a href='/admin/inventory' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Inventory</a>
              <a href='/admin/listings' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Listings</a>
              <a href='/admin/rentals' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Rentals</a>
              <a href='/admin/drivers' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Driver Management</a>
              <a href='/admin/logistics' className='block px-3 py-2 rounded-lg bg-green-100 text-green-700'>Logistics</a>
            </nav>
          </div>
          <div>
            <h1 className='text-3xl font-semibold mb-4'>Logistics</h1>
            <div className='bg-white rounded-xl border border-gray-200 p-6 text-gray-600'>
              This is a placeholder for Logistics. Build features here.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogistics



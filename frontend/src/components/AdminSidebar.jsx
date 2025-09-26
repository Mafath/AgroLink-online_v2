import React from 'react'

const AdminSidebar = ({ activePage = 'dashboard' }) => {
  const menuItems = [
    { key: 'dashboard', label: 'Dashboards', href: '/admin' },
    { key: 'users', label: 'Users & Roles', href: '/admin/users' },
    { key: 'inventory', label: 'Inventory', href: '/admin/inventory' },
    { key: 'rentals', label: 'Rentals', href: '/admin/rentals' },
    { key: 'listings', label: 'Listings', href: '/admin/listings' },
    { key: 'harvest', label: 'Harvest Management', href: '/admin/harvest' },
    { key: 'drivers', label: 'Driver Management', href: '/admin/drivers' },
    { key: 'consultants', label: 'Agronomist Management', href: '/admin/consultants' },
    { key: 'logistics', label: 'Logistics', href: '/admin/logistics' },
    { key: 'orders', label: 'Orders', href: '/admin/orders' },
  ]

  return (
    <div className='bg-white rounded-xl border border-gray-200 p-2'>
      <nav className='space-y-1 text-gray-700 text-sm'>
        {menuItems.map((item) => (
          <a
            key={item.key}
            href={item.href}
            className={`block px-3 py-2 rounded-lg hover:bg-gray-50 ${
              activePage === item.key ? 'bg-green-100 text-green-700' : ''
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  )
}

export default AdminSidebar

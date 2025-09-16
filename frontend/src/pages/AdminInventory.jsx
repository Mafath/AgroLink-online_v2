import React, { useState } from 'react'

const AdminInventory = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ name: '', price: '', description: '', images: [] })

  const addProduct = (e) => {
    e.preventDefault()
    const item = {
      id: crypto.randomUUID(),
      name: form.name,
      price: form.price,
      description: form.description,
      images: (form.images || []).filter(Boolean).slice(0,4),
      createdAt: new Date().toISOString(),
    }
    setProducts((p) => [item, ...p])
    setForm({ name: '', price: '', description: '', images: [] })
    setIsOpen(false)
  }

  return (
    <div className='p-4 max-w-7xl mx-auto flex gap-6'>
      {/* Sidebar copied from AdminUsers */}
      <aside className='w-56 shrink-0 hidden md:block'>
        <nav className='space-y-2 sticky top-20'>
          <a href='/admin' className='block px-3 py-2 rounded-md hover:bg-gray-50'>Dashboard</a>
          <a href='/admin/users' className='block px-3 py-2 rounded-md hover:bg-gray-50'>User & Role Management</a>
          <a href='/admin/listings' className='block px-3 py-2 rounded-md hover:bg-gray-50'>Listings</a>
          <a href='/admin/settings' className='block px-3 py-2 rounded-md hover:bg-gray-50'>Settings</a>
        </nav>
      </aside>

      {/* Content */}
      <div className='flex-1'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-2xl font-semibold'>Inventory</h1>
          <button className='btn-primary' onClick={() => setIsOpen(true)}>Add Product</button>
        </div>

        <div className='card'>
          {products.length === 0 ? (
            <div className='text-center text-gray-500 py-10'>No products yet</div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {products.map(p => (
                <div key={p.id} className='border rounded-lg p-3'>
                  <div className='flex items-center gap-3'>
                    {(p.images && p.images[0]) ? (
                      <img src={p.images[0]} alt={p.name} className='w-12 h-12 rounded object-cover' />
                    ) : (
                      <div className='w-12 h-12 rounded bg-gray-200' />
                    )}
                    <div>
                      <div className='font-medium'>{p.name}</div>
                      <div className='text-xs text-gray-500 truncate max-w-[200px]' title={p.description}>{p.description || '—'}</div>
                    </div>
                  </div>
                  <div className='mt-2 text-sm flex items-center justify-between'>
                    <span>LKR {p.price || '0.00'}</span>
                    <span className='text-gray-500'>Images: {p.images?.length || 0}/4</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {isOpen && (
        <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-lg p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-semibold'>Add Product</h2>
              <button onClick={() => setIsOpen(false)} className='text-gray-500'>Close</button>
            </div>
            <form onSubmit={addProduct} className='space-y-3'>
              <div>
                <label className='form-label'>Product Name</label>
                <input className='input-field' value={form.name} onChange={(e)=>setForm(f=>({...f, name:e.target.value}))} placeholder='Enter product name' required />
              </div>
              <div>
                <label className='form-label'>Price (LKR)</label>
                <input type='number' min='0' step='0.01' className='input-field' value={form.price} onChange={(e)=>setForm(f=>({...f, price:e.target.value}))} placeholder='0.00' required />
              </div>
              <div>
                <label className='form-label'>Description</label>
                <textarea className='input-field' rows={3} value={form.description} onChange={(e)=>setForm(f=>({...f, description:e.target.value}))} placeholder='Describe the product' />
              </div>
              <div>
                <label className='form-label'>Images (up to 4)</label>
                <input
                  type='file'
                  accept='image/*'
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 4)
                    const readers = files.map(file => new Promise((resolve) => {
                      const reader = new FileReader()
                      reader.onload = () => resolve(reader.result)
                      reader.readAsDataURL(file)
                    }))
                    Promise.all(readers).then((results) => {
                      setForm(prev => ({ ...prev, images: results.slice(0, 4) }))
                    })
                  }}
                  className='block w-full text-sm'
                />
                {Array.isArray(form.images) && form.images.filter(Boolean).length > 0 && (
                  <div className='mt-2 grid grid-cols-4 gap-2'>
                    {form.images.filter(Boolean).map((src, idx) => (
                      <img key={idx} src={src} alt={'img'+idx} className='w-full h-16 object-cover rounded-md border' />
                    ))}
                  </div>
                )}
              </div>
              <div className='flex justify-end gap-2 pt-2'>
                <button type='button' className='border px-3 py-2 rounded-md' onClick={()=>setIsOpen(false)}>Cancel</button>
                <button type='submit' className='btn-primary'>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInventory



import React, { useEffect, useState } from 'react'
import { axiosInstance } from '../lib/axios'
import toast from 'react-hot-toast'
import { ChevronDown, X } from 'lucide-react'

const Marketplace = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [q, setQ] = useState('')
  const [sortBy, setSortBy] = useState('latest')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await axiosInstance.get('/listings')
        setItems(res.data)
      } catch (e) {
        toast.error('Failed to load marketplace')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredItems = (Array.isArray(items) ? items : []).filter((it) => {
    const query = q.trim().toLowerCase()
    if (!query) return true
    const farmerName = it.farmer?.fullName || (it.farmer?.email ? it.farmer.email.split('@')[0] : '')
    return (
      String(it.cropName || '').toLowerCase().includes(query) ||
      String(it.details || '').toLowerCase().includes(query) ||
      String(farmerName || '').toLowerCase().includes(query)
    )
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'price_asc') return Number(a.pricePerKg) - Number(b.pricePerKg)
    if (sortBy === 'price_desc') return Number(b.pricePerKg) - Number(a.pricePerKg)
    if (sortBy === 'harvested_asc') return new Date(a.harvestedAt) - new Date(b.harvestedAt)
    if (sortBy === 'harvested_desc') return new Date(b.harvestedAt) - new Date(a.harvestedAt)
    if (sortBy === 'capacity_asc') return Number(a.capacityKg) - Number(b.capacityKg)
    if (sortBy === 'capacity_desc') return Number(b.capacityKg) - Number(a.capacityKg)
    if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    // default latest
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  })

  return (
    <div className='p-4 mb-20 max-w-6xl mx-auto'>
      <h2 className='text-3xl md:text-4xl font-bold text-black text-center mt-6 mb-6'>Marketplace</h2>
      <div className='relative mb-6 flex items-center'>
        <div className='mx-auto max-w-md w-full'>
          <input
            className='input-field rounded-full w-full'
            placeholder='Search crops, farmers, details...'
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className='absolute right-0 w-40'>
          <div className='relative'>
            <select className='input-field rounded-full pr-10 appearance-none' value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label='Sort by'>
              <option value='latest'>Latest</option>
              <option value='oldest'>Oldest</option>
              <option value='price_asc'>Price: Low to High</option>
              <option value='price_desc'>Price: High to Low</option>
              <option value='harvested_desc'>Harvest date: Newest</option>
              <option value='harvested_asc'>Harvest date: Oldest</option>
              <option value='capacity_desc'>Capacity: High to Low</option>
              <option value='capacity_asc'>Capacity: Low to High</option>
            </select>
            <ChevronDown className='w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none' />
          </div>
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : sortedItems.length === 0 ? (
        <div className='text-gray-500 text-sm'>No matching products.</div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {sortedItems.map(it => (
            <div key={it._id} className='card flex flex-col'>
              {Array.isArray(it.images) && it.images.length > 0 ? (
                <div className='overflow-hidden rounded-lg -mt-2 -mx-2 mb-3'>
                  <img src={it.images[0]} alt={it.cropName} className='w-full h-28 object-cover' />
                </div>
              ) : (
                <div className='w-full h-28 bg-gray-100 rounded-lg -mt-2 -mx-2 mb-3 grid place-items-center text-gray-400 text-sm'>
                  No image
                </div>
              )}
              <div className='text-lg font-semibold'>{it.cropName}</div>
              <div className='mt-2 text-sm text-gray-700'>Price: LKR {Number(it.pricePerKg).toFixed(2)} / kg</div>
              <div className='text-sm text-gray-700'>Available: {it.capacityKg} kg</div>
              <div className='text-xs text-gray-500 mt-1'>Harvested: {new Date(it.harvestedAt).toLocaleDateString()}</div>
              <div className='text-sm mt-2 text-gray-700'>
                Posted by: {it.farmer?.fullName || (it.farmer?.email ? it.farmer.email.split('@')[0] : 'Farmer')}
              </div>
              <div className='mt-3 flex gap-2'>
                <button className='border px-3 py-2 rounded-md text-xs' onClick={() => { setSelected(it); setSelectedImageIndex(0) }}>View info</button>
                <button className='btn-primary flex-1 px-3 py-2 text-xs' onClick={() => toast.success('Added to cart')}>Add to cart</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-50'>
          <div className='card w-full max-w-sm relative'>
            <button onClick={() => setSelected(null)} aria-label='Close' className='absolute right-3 top-3 p-2 rounded-full hover:bg-gray-100'>
              <X className='w-4 h-4 text-gray-600' />
            </button>
            {Array.isArray(selected.images) && selected.images.length > 0 ? (
              <div className='overflow-hidden rounded-lg -mt-2 mb-3 flex justify-center'>
                <img src={selected.images[selectedImageIndex]} alt={selected.cropName} className='h-32 w-3/4 object-cover rounded-md' />
              </div>
            ) : (
              <div className='h-32 w-3/4 bg-gray-100 rounded-lg -mt-2 mb-3 grid place-items-center text-gray-400 text-sm mx-auto'>
                No image
              </div>
            )}
            {Array.isArray(selected.images) && selected.images.length > 0 && (
              <div className='mb-2 flex flex-wrap gap-1 justify-start'>
                {selected.images.slice(0, 4).map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`rounded-md overflow-hidden border ${idx === selectedImageIndex ? 'ring-2 ring-primary-500' : 'hover:border-gray-400'}`}
                    aria-label={`Thumbnail ${idx + 1}`}
                  >
                    <img src={src} alt={'thumb'+idx} className='w-12 h-12 object-cover' />
                  </button>
                ))}
              </div>
            )}
            <h3 className='text-lg font-semibold mb-2'>{selected.cropName}</h3>
            <div className='text-sm text-gray-500 mb-2'>
              Farmer: {selected.farmer?.fullName || (selected.farmer?.email ? selected.farmer.email.split('@')[0] : 'Farmer')}
            </div>
            <div className='grid grid-cols-2 gap-3 text-sm'>
              <div>
                <div className='text-gray-500'>Price / kg</div>
                <div className='font-medium'>LKR {Number(selected.pricePerKg).toFixed(2)}</div>
              </div>
              <div>
                <div className='text-gray-500'>Available</div>
                <div className='font-medium'>{selected.capacityKg} kg</div>
              </div>
              <div>
                <div className='text-gray-500'>Harvested</div>
                <div className='font-medium'>{new Date(selected.harvestedAt).toLocaleDateString()}</div>
              </div>
              <div>
                <div className='text-gray-500'>Status</div>
                <div className='font-medium'>{selected.status}</div>
              </div>
            </div>
            {selected.details && (
              <div className='mt-3 text-sm'>
                <div className='text-gray-500'>Details</div>
                <div>{selected.details}</div>
              </div>
            )}
            <div className='mt-3 flex justify-end gap-2'>
              <button className='border px-2 py-1 rounded-md text-xs' onClick={() => setSelected(null)}>Close</button>
              <button className='btn-primary px-3 py-2 text-xs' onClick={() => { toast.success('Added to cart'); }}>Add to cart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Marketplace



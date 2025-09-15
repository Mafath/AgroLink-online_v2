import React, { useEffect, useState } from 'react'
import { axiosInstance } from '../lib/axios'
import toast from 'react-hot-toast'

const Marketplace = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await axiosInstance.get('/listings')
        setItems(res.data)
      } catch (e) {
        // ignore for now
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className='p-4 mt-20 max-w-6xl mx-auto'>
      <h2 className='text-xl font-semibold mb-4'>Marketplace</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {items.map(it => (
            <div key={it._id} className='card flex flex-col'>
              <div className='text-sm text-gray-500 mb-1'>
                {it.farmer?.fullName || (it.farmer?.email ? it.farmer.email.split('@')[0] : 'Farmer')}
              </div>
              <div className='text-lg font-semibold'>{it.cropName}</div>
              <div className='mt-2 text-sm text-gray-700'>Price: LKR {Number(it.pricePerKg).toFixed(2)} / kg</div>
              <div className='text-sm text-gray-700'>Available: {it.capacityKg} kg</div>
              <div className='text-xs text-gray-500 mt-1'>Harvested: {new Date(it.harvestedAt).toLocaleDateString()}</div>
              {it.details && <div className='text-sm mt-2 line-clamp-3'>{it.details}</div>}
              <div className='mt-4 flex gap-2'>
                <button className='border px-4 py-2 rounded-lg text-sm' onClick={() => setSelected(it)}>View info</button>
                <button className='btn-primary flex-1' onClick={() => toast.success('Added to cart')}>Add to cart</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-50'>
          <div className='card w-full max-w-lg relative'>
            <button onClick={() => setSelected(null)} className='absolute right-3 top-3 border px-2 py-1 rounded-lg text-xs'>Close</button>
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
            <div className='mt-4 flex justify-end gap-2'>
              <button className='border px-4 py-2 rounded-lg' onClick={() => setSelected(null)}>Close</button>
              <button className='btn-primary' onClick={() => { toast.success('Added to cart'); }}>Add to cart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Marketplace



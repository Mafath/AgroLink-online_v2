import React, { useEffect, useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { axiosInstance } from '../lib/axios'
import { Info, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
)

const AdminListings = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState({ search: '' })
  const [selected, setSelected] = useState(null)
  

  const fetchListings = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/listings')
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch (_) {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchListings() }, [])

  const filteredItems = useMemo(() => {
    const search = (query.search || '').trim().toLowerCase()
    if (!search) return items
    return items.filter(it => {
      const crop = (it.cropName || '').toLowerCase()
      const farmer = (it.farmer?.fullName || it.farmer?.email || '').toLowerCase()
      return crop.includes(search) || farmer.includes(search)
    })
  }, [items, query.search])

  const topFarmersByListings = useMemo(() => {
    const counter = new Map()
    for (const it of (Array.isArray(items) ? items : [])) {
      const farmerLabel = it.farmer?.fullName || (it.farmer?.email ? it.farmer.email.split('@')[0] : 'Unknown')
      counter.set(farmerLabel, (counter.get(farmerLabel) || 0) + 1)
    }
    const sorted = Array.from(counter.entries()).sort((a,b)=> b[1]-a[1]).slice(0,5)
    return {
      categories: sorted.map(([name]) => name),
      series: [{ name: 'Listings', data: sorted.map(([,count]) => count) }]
    }
  }, [items])

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-semibold ml-2'>Farmer Listings</h1>
          <div />
        </div>
        <div className='grid grid-cols-[240px,1fr] gap-6'>
          {/* Sidebar (copied pattern) */}
          <div className='bg-white rounded-xl border border-gray-200 p-2'>
            <nav className='space-y-1 text-gray-700 text-sm'>
              <a href='/admin' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Dashboards</a>
              <a href='/admin/users' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Users & Roles</a>
              <a href='/admin/inventory' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Inventory</a>
              <a href='/admin/listings' className='block px-3 py-2 rounded-lg bg-green-100 text-green-700'>Listings</a>
              <a href='/admin/rentals' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Rentals</a>
              <a href='/admin/drivers' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Driver Management</a>
              <a href='/admin/logistics' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Logistics</a>
            </nav>
          </div>

          {/* Main content (copied layout) */}
          <div className='space-y-6'>
            {/* Summary cards above table */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-gray-600'>Total Listings</div>
                    <div className='text-2xl font-semibold mt-1'>{items.length.toLocaleString()}</div>
                    <div className='mt-3 text-xs text-gray-600'>Overall</div>
                  </div>
                  <div className='w-24 h-24 bg-violet-100 rounded-lg grid place-items-center'>
                    <Users className='w-12 h-12 text-violet-600' />
                  </div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-gray-600'>Available</div>
                    <div className='text-2xl font-semibold mt-1'>{items.filter(i=>String(i.status).toUpperCase().includes('ACTIVE')||String(i.status).toUpperCase().includes('AVAILABLE')).length.toLocaleString()}</div>
                    <div className='mt-3 text-xs text-gray-600'>Current status</div>
                  </div>
                  <div className='w-24 h-24 bg-green-100 rounded-lg grid place-items-center'>
                    <Users className='w-12 h-12 text-green-600' />
                  </div>
                </div>
              </Card>
            </div>

            <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
              <div className='px-4 py-3 border-b border-gray-100 grid grid-cols-3 items-center gap-3'>
                <div>
                  <div className='text-md font-medium text-gray-700'>Listings</div>
                </div>
                <div className='flex justify-center'>
                  <div className='relative hidden sm:block'>
                    <input className='bg-white border border-gray-200 rounded-full h-9 pl-3 pr-3 w-56 text-sm outline-none' placeholder='Search' value={query.search || ''} onChange={e => setQuery(q => ({ ...q, search: e.target.value }))} />
                  </div>
                </div>
                <div className='flex items-center justify-end gap-3'></div>
              </div>
              <div className='max-h-[280px] overflow-y-auto'>
                <table className='min-w-full text-sm'>
                  <thead className='sticky top-0 bg-gray-100 z-10 rounded-t-lg'>
                    <tr className='text-center text-gray-500 border-b align-middle h-12'>
                      <th className='py-3 pl-6 pr-3 text-left align-middle'>Crop</th>
                      <th className='py-3 px-3 text-left align-middle'>Farmer</th>
                      <th className='py-3 px-3 text-center align-middle'>Price/kg</th>
                      <th className='py-3 px-3 text-center align-middle'>Capacity (kg)</th>
                      <th className='py-3 px-3 text-center align-middle'>Harvested</th>
                      <th className='py-3 px-3 text-center align-middle'>Status</th>
                      <th className='py-3 px-3 text-center align-middle'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td className='py-10 text-center text-gray-400' colSpan={7}>Loading…</td></tr>
                    ) : filteredItems.length === 0 ? (
                      <tr><td className='py-10 text-center text-gray-400' colSpan={7}>No listings</td></tr>
                    ) : filteredItems.map((it) => (
                      <tr key={it._id} className='border-t align-middle'>
                        <td className='py-2 pl-6 pr-3 text-left align-middle'>{it.cropName}</td>
                        <td className='py-2 px-3 text-left align-middle'>{it.farmer?.fullName || it.farmer?.email || '—'}</td>
                        <td className='py-2 px-3 text-center align-middle'>LKR {Number(it.pricePerKg || 0).toLocaleString()}</td>
                        <td className='py-2 px-3 text-center align-middle'>{it.capacityKg} kg</td>
                        <td className='py-2 px-3 text-center align-middle'>{it.harvestedAt ? new Date(it.harvestedAt).toLocaleDateString() : '—'}</td>
                        <td className='py-2 px-3 text-center align-middle'>
                          <span className='inline-flex items-center justify-center h-6 px-2 text-xs bg-yellow-100 text-yellow-700 rounded-full'>{it.status}</span>
                        </td>
                        <td className='py-2 px-3 text-center align-middle'>
                          <div className='inline-flex items-center gap-2'>
                            <button className='px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs inline-flex items-center gap-1' onClick={()=>{ setSelected(it); }}>
                              <Info className='w-3.5 h-3.5' /> Info
                            </button>
                            <button className='px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs inline-flex items-center gap-1' onClick={async()=>{ if(window.confirm('Delete this listing?')){ try{ await axiosInstance.delete(`/listings/${it._id}`); setItems(prev=> prev.filter(x => x._id !== it._id)); toast.success('Listing deleted'); }catch(_){ toast.error('Failed to delete'); } } }}>
                              <Trash2 className='w-3.5 h-3.5' /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Listings and Top 5 Farmers cards */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium'>Recent Listings</div>
                  <div className='text-xs text-gray-500 mt-1'>Latest 6 created</div>
                  <div className='mt-3 space-y-2 text-sm'>
                    {items.slice(0,6).map((it)=> (
                      <div key={it._id} className='grid grid-cols-[1fr,120px,120px] gap-3'>
                        <div className='font-medium'>{it.cropName}</div>
                        <div className='text-gray-600 text-xs'>LKR {Number(it.pricePerKg||0).toLocaleString()} / kg</div>
                        <div className='text-gray-700 text-right text-xs'>{new Date(it.createdAt||it.harvestedAt||0).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Top 5 Farmers by Listings</div>
                  <div className='rounded-lg border border-dashed'>
                    <Chart
                      type='bar'
                      height={260}
                      options={{
                        chart:{toolbar:{show:false}},
                        plotOptions:{ bar:{ columnWidth:'55%', borderRadius:4 }},
                        colors:['#22c55e'],
                        grid:{ borderColor:'#eee' },
                        xaxis:{ categories: topFarmersByListings.categories, labels:{ style:{ colors:'#9ca3af' }, rotate: -15 } },
                        yaxis:{ labels:{ style:{ colors:'#9ca3af' } } },
                        dataLabels:{ enabled:false },
                        legend:{ show:false }
                      }}
                      series={topFarmersByListings.series}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {selected && (
        <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-2xl p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-semibold'>Listing Info</h2>
              <button onClick={()=>{ setSelected(null); }} className='text-gray-500'>Close</button>
            </div>
            {
              <div className='space-y-3 text-sm'>
                <div><span className='text-gray-500'>Crop:</span> <span className='font-medium'>{selected.cropName}</span></div>
                <div><span className='text-gray-500'>Farmer:</span> <span className='font-medium'>{selected.farmer?.fullName || selected.farmer?.email || '—'}</span></div>
                <div className='grid grid-cols-2 gap-4'>
                  <div><span className='text-gray-500'>Price/kg:</span> <span className='font-medium'>LKR {Number(selected.pricePerKg||0).toLocaleString()}</span></div>
                  <div><span className='text-gray-500'>Capacity:</span> <span className='font-medium'>{Number(selected.capacityKg||0)} kg</span></div>
                  <div><span className='text-gray-500'>Harvested:</span> <span className='font-medium'>{selected.harvestedAt ? new Date(selected.harvestedAt).toLocaleDateString() : '—'}</span></div>
                  <div><span className='text-gray-500'>Status:</span> <span className='font-medium'>{selected.status || '—'}</span></div>
                </div>
                <div>
                  <div className='text-gray-500 mb-1'>Details</div>
                  <div className='font-medium whitespace-pre-wrap'>{selected.details || '—'}</div>
                </div>
                <div>
                  <div className='text-gray-500 mb-1'>Images</div>
                  {Array.isArray(selected.images) && selected.images.filter(Boolean).length > 0 ? (
                    <div className='grid grid-cols-6 gap-2'>
                      {selected.images.filter(Boolean).slice(0, 12).map((src, idx) => (
                        <img key={idx} src={src} alt={'img'+idx} className='w-full h-16 object-cover rounded-md border' />
                      ))}
                    </div>
                  ) : (
                    <div className='text-gray-400'>No images</div>
                  )}
                </div>
                <div className='grid grid-cols-2 gap-4 text-xs text-gray-500'>
                  <div>Created: <span className='font-medium text-gray-700'>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</span></div>
                  <div>Updated: <span className='font-medium text-gray-700'>{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : '—'}</span></div>
                </div>
              </div>
            }
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminListings



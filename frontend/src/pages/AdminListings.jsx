import React, { useEffect, useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { axiosInstance } from '../lib/axios'
import { useAuthStore } from '../store/useAuthStore'
import { Info, Pencil, Trash2, Package, AlertTriangle, DollarSign, BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
)

const LineChart = () => (
  <Chart type='line' height={180} options={{
    chart:{toolbar:{show:false}},
    stroke:{width:3, curve:'smooth'},
    colors:['#22c55e'],
    grid:{borderColor:'#eee'},
    xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun'], labels:{style:{colors:'#9ca3af'}}},
    yaxis:{labels:{style:{colors:'#9ca3af'}}},
    legend:{show:false}
  }} series={[{name:'Sales', data:[20,28,22,30,26,40]}]} />
)

const BarChart = () => (
  <Chart type='bar' height={180} options={{
    chart:{toolbar:{show:false}},
    plotOptions:{bar:{columnWidth:'40%', borderRadius:4}},
    colors:['#22c55e','#9ca3af'],
    grid:{borderColor:'#eee'},
    xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun'], labels:{style:{colors:'#9ca3af'}}},
    yaxis:{labels:{style:{colors:'#9ca3af'}}},
    legend:{show:false}
  }} series={[{name:'Earning', data:[14,22,18,26,20,30]},{name:'Expense', data:[10,14,12,16,12,18]}]} />
)

const DonutChart = () => (
  <Chart type='donut' height={220} options={{
    chart:{toolbar:{show:false}},
    labels:['Apparel','Electronics','FMCG','Other'],
    colors:['#a78bfa','#8b5cf6','#c4b5fd','#ddd6fe'],
    legend:{show:false},
    dataLabels:{enabled:false}
  }} series={[30,25,15,30]} />
)

const Sparkline = () => (
  <Chart type='line' height={90} options={{
    chart:{sparkline:{enabled:true}, toolbar:{show:false}},
    stroke:{width:3, curve:'smooth'},
    colors:['#22c55e'],
  }} series={[{data:[10,14,12,18,16,24,20,30]}]} />
)

// Listings-specific chart components
const ListingsValueChart = ({ data = [] }) => (
  <Chart type='line' height={180} options={{
    chart:{toolbar:{show:false}},
    stroke:{width:3, curve:'smooth'},
    colors:['#3b82f6'],
    grid:{borderColor:'#eee'},
    xaxis:{categories:data.map(d => d.date), labels:{style:{colors:'#9ca3af'}}},
    yaxis:{labels:{style:{colors:'#9ca3af'}, formatter: (val) => `LKR ${val.toLocaleString()}`}},
    legend:{show:false}
  }} series={[{name:'Listings Value', data:data.map(d => d.value)}]} />
)

const CropDistributionChart = ({ data = [] }) => (
  <Chart type='donut' height={220} options={{
    chart:{toolbar:{show:false}},
    labels:data.map(d => d.crop),
    colors:['#8b5cf6', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4'],
    legend:{show:false},
    dataLabels:{enabled:false},
    plotOptions:{
      pie:{
        donut:{
          size:'70%',
          labels:{
            show:true,
            name:{ show:false },
            value:{ show:false },
            total:{
              show:true,
              label:'Total Listings',
              formatter: function(w){
                try {
                  const totals = w?.globals?.seriesTotals || []
                  const total = totals.reduce((a,b)=>a + Number(b||0), 0)
                  return total.toLocaleString()
                } catch (_) { return '' }
              }
            }
          }
        }
      }
    }
  }} series={data.map(d => d.count)} />
)

const PriceLevelChart = ({ data = [] }) => (
  <Chart type='bar' height={180} options={{
    chart:{toolbar:{show:false}},
    plotOptions:{bar:{columnWidth:'60%', borderRadius:4}},
    colors:['#ef4444', '#f59e0b', '#22c55e'],
    grid:{borderColor:'#eee'},
    xaxis:{categories:data.map(d => d.name), labels:{style:{colors:'#9ca3af'}, rotate:-45}},
    yaxis:{labels:{style:{colors:'#9ca3af'}}},
    legend:{show:false}
  }} series={[{name:'Price per Kg', data:data.map(d => d.price)}]} />
)

const AdminListings = () => {
  const { authUser } = useAuthStore()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAddListing, setIsAddListing] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [listingForm, setListingForm] = useState({
    cropName: '',
    pricePerKg: '',
    capacityKg: '',
    details: '',
    harvestedAt: '',
    images: [],
  })

  const [listings, setListings] = useState([])
  const [isLoadingListings, setIsLoadingListings] = useState(false)
  const [listingsSortMode, setListingsSortMode] = useState('newest')
  const [query, setQuery] = useState('')
  const [statusSortMode, setStatusSortMode] = useState('none') // none | availableFirst | soldFirst | removedFirst

  const loadListings = async () => {
    try {
      setIsLoadingListings(true)
      console.log('Loading listings...')
      const { data } = await axiosInstance.get('listings')
      console.log('Listings API response:', data)
      setListings(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load listings:', e)
      console.error('Error details:', e.response?.data)
      console.error('Status:', e.response?.status)
      setListings([])
    } finally {
      setIsLoadingListings(false)
    }
  }

  useEffect(() => { loadListings() }, [])

  const listingsSorted = useMemo(() => {
    const arr = [...listings]
    arr.sort((a,b)=>{
      const timeA = new Date(a.createdAt||0).getTime()
      const timeB = new Date(b.createdAt||0).getTime()
      const priceA = Number(a.pricePerKg||0)
      const priceB = Number(b.pricePerKg||0)
      switch (listingsSortMode) {
        case 'oldest':
          return timeA - timeB
        case 'priceAsc':
          return priceA - priceB
        case 'priceDesc':
          return priceB - priceA
        case 'newest':
        default:
          return timeB - timeA
      }
    })
    if (statusSortMode !== 'none') {
      const rank = (status) => {
        const s = String(status||'')
        if (statusSortMode === 'availableFirst') return s === 'AVAILABLE' ? 0 : (s === 'SOLD' ? 1 : 2)
        if (statusSortMode === 'soldFirst') return s === 'SOLD' ? 0 : (s === 'AVAILABLE' ? 1 : 2)
        if (statusSortMode === 'removedFirst') return s === 'REMOVED' ? 0 : (s === 'SOLD' ? 1 : 2)
        return 0
      }
      arr.sort((a,b)=> rank(a.status) - rank(b.status))
    }
    return arr
  }, [listings, listingsSortMode, statusSortMode])

  // Filter by search query
  const filteredListings = useMemo(() => {
    const q = (query || '').trim().toLowerCase()
    if (!q) return listingsSorted
    return listingsSorted.filter((it) => {
      const cropName = String(it.cropName || '').toLowerCase()
      const price = String(it.pricePerKg || '')
      const capacity = String(it.capacityKg || '')
      const farmer = String(it.farmer?.fullName || '').toLowerCase()
      return (
        cropName.includes(q) ||
        price.includes(q) ||
        capacity.includes(q) ||
        farmer.includes(q)
      )
    })
  }, [listingsSorted, query])

  // Listings metrics
  const listingsMetrics = useMemo(() => {
    const totalListings = listings.length
    const availableListings = listings.filter(item => item.status === 'AVAILABLE').length
    const totalValue = listings.reduce((sum, item) => sum + (Number(item.pricePerKg || 0) * Number(item.capacityKg || 0)), 0)
    const crops = listings.reduce((acc, item) => {
      acc[item.cropName] = (acc[item.cropName] || 0) + 1
      return acc
    }, {})

    return {
      totalListings,
      availableListings,
      totalValue,
      crops
    }
  }, [listings])

  // Crop distribution data
  const cropData = useMemo(() => {
    return Object.entries(listingsMetrics.crops).map(([crop, count]) => ({
      crop: crop.charAt(0).toUpperCase() + crop.slice(1),
      count
    }))
  }, [listingsMetrics.crops])

  // Price level data for chart
  const priceLevelData = useMemo(() => {
    return listings
      .filter(item => Number(item.pricePerKg || 0) > 0) // Show items with price
      .slice(0, 8) // Limit to 8 items for readability
      .map(item => ({
        name: item.cropName.length > 15 ? item.cropName.substring(0, 15) + '...' : item.cropName,
        price: Number(item.pricePerKg || 0)
      }))
  }, [listings])

  // Listings value added per day (sum of pricePerKg * capacityKg for listings created each day)
  const listingsValueData = useMemo(() => {
    // helper to format date to YYYY-MM-DD
    const toKey = (d) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    // last 7 days including today
    const today = new Date()
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      return d
    })

    // aggregate value per day from listings.createdAt
    const dayToValue = new Map()
    for (const d of days) dayToValue.set(toKey(d), 0)

    listings.forEach((item) => {
      const created = item?.createdAt ? new Date(item.createdAt) : null
      if (!created || isNaN(created.getTime())) return
      const key = toKey(created)
      if (!dayToValue.has(key)) return
      const itemValue = Number(item.pricePerKg || 0) * Number(item.capacityKg || 0)
      dayToValue.set(key, dayToValue.get(key) + itemValue)
    })

    return days.map((d) => ({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      value: dayToValue.get(toKey(d)) || 0,
    }))
  }, [listings])

  const handleSubmitListing = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        cropName: listingForm.cropName,
        pricePerKg: Number(listingForm.pricePerKg),
        capacityKg: Number(listingForm.capacityKg),
        details: listingForm.details,
        harvestedAt: listingForm.harvestedAt,
        images: listingForm.images,
      }
      await axiosInstance.post('listings', payload)
      setIsAddOpen(false)
      setIsAddListing(false)
      setListingForm({ cropName: '', pricePerKg: '', capacityKg: '', details: '', harvestedAt: '', images: [] })
      loadListings()
    } catch (err) {
      // optional: surface error
    }
  }

  // Check if user is admin
  if (authUser && authUser.role !== 'ADMIN') {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Access Denied</h1>
          <p className='text-gray-600'>You need admin privileges to access the listings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-semibold ml-2'>Listings</h1>
        </div>

        <div className='grid grid-cols-[240px,1fr] gap-6'>
          {/* Sidebar (match Dashboard) */}
          <div className='bg-white rounded-xl border border-gray-200 p-2'>
          <nav className='space-y-1 text-gray-700 text-sm'>
              <a href='/admin' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Dashboards</a>
              <a href='/admin/users' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Users & Roles</a>
              <a href='/admin/inventory' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Inventory</a>
              <a href='/admin/rentals' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Rentals</a>
              <a href='/admin/listings' className='block px-3 py-2 rounded-lg bg-green-100 text-green-700'>Listings</a>
              <a href='/admin/drivers' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Driver Management</a>
              <a href='/admin/logistics' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Logistics</a>
              <a href='/admin/orders' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Orders</a>
            </nav>
          </div>

          {/* Main content */}
          <div className='space-y-6'>
            {/* Top cards row: Listings Metrics */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-gray-600'>Total Listings</div>
                    <div className='text-2xl font-semibold mt-1'>{listingsMetrics.totalListings}</div>
                    <div className='mt-3'>
                      <span className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full'>All Crops</span>
                    </div>
                  </div>
                  <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                    <Package className='w-6 h-6 text-blue-600' />
                  </div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-gray-600'>Available Listings</div>
                    <div className='text-2xl font-semibold mt-1'>{listingsMetrics.availableListings}</div>
                    <div className='mt-3'>
                      <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>Ready to Sell</span>
                    </div>
                  </div>
                  <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                    <TrendingUp className='w-6 h-6 text-green-600' />
                  </div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-gray-600'>Total Value</div>
                    <div className='text-2xl font-semibold mt-1'>LKR {listingsMetrics.totalValue.toLocaleString()}</div>
                    <div className='mt-3'>
                      <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>Market Value</span>
                    </div>
                  </div>
                  <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                    <DollarSign className='w-6 h-6 text-green-600' />
                  </div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-gray-600'>Crop Types</div>
                    <div className='text-2xl font-semibold mt-1'>{Object.keys(listingsMetrics.crops).length}</div>
                    <div className='mt-3'>
                      <span className='text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full'>Unique Crops</span>
                    </div>
                  </div>
                  <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                    <BarChart3 className='w-6 h-6 text-purple-600' />
                  </div>
                </div>
              </Card>
            </div>

            {/* Listings table */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
              <div className='px-4 py-3 border-b border-gray-100 grid grid-cols-3 items-center gap-3'>
                <div>
                  <div className='text-md font-medium text-gray-700'>Marketplace Listings</div>
                </div>
                <div className='hidden sm:flex justify-center'>
                  <div className='relative'>
                    <input value={query} onChange={(e)=>setQuery(e.target.value)} className='bg-white border border-gray-200 rounded-full h-9 pl-9 pr-3 w-72 text-sm outline-none' placeholder='Search' />
                  </div>
                </div>
                <div className='flex items-center justify-end gap-3'>
                  <select className='input-field h-9 py-1 text-sm hidden sm:block' value={listingsSortMode} onChange={(e)=>setListingsSortMode(e.target.value)}>
                    <option value='newest'>Newest</option>
                    <option value='oldest'>Oldest</option>
                    <option value='priceAsc'>Price: Low to High</option>
                    <option value='priceDesc'>Price: High to Low</option>
                  </select>
                  <select className='input-field h-9 py-1 text-sm hidden sm:block' value={statusSortMode} onChange={(e)=>setStatusSortMode(e.target.value)}>
                    <option value='none'>Status: Default</option>
                    <option value='availableFirst'>Available first</option>
                    <option value='soldFirst'>Sold first</option>
                    <option value='removedFirst'>Removed first</option>
                  </select>
                  <button className='btn-primary whitespace-nowrap px-3 py-2 text-sm' onClick={()=>{ setIsAddListing(true); setIsAddOpen(true) }}>Add Listing +</button>
                </div>
              </div>
              <div className='max-h-[240px] overflow-y-auto'>
                <table className='min-w-full text-sm'>
                  <thead className='sticky top-0 bg-gray-100 z-10'>
                    <tr className='text-left text-gray-500'>
                      <th className='py-3 px-3 text-left'>Crop Name</th>
                      <th className='py-3 px-3 text-center'>Farmer</th>
                      <th className='py-3 px-3 text-center'>Image</th>
                      <th className='py-3 px-3 text-center'>Capacity (Kg)</th>
                      <th className='py-3 px-3 text-center'>Price/Kg</th>
                      <th className='py-3 px-3 text-center'>Status</th>
                      <th className='py-3 px-3 text-center'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingListings ? (
                      <tr><td className='py-10 text-center text-gray-400' colSpan={7}>Loading…</td></tr>
                    ) : listings.length === 0 ? (
                      <tr><td className='py-10 text-center text-gray-400' colSpan={7}>No data yet</td></tr>
                    ) : (
                      filteredListings.map((it) => (
                        <tr key={it._id} className='border-t'>
                          <td className='py-1 px-3 ml-3 text-left'>{it.cropName}</td>
                          <td className='py-1 px-3 text-left'>{it.farmer?.fullName || 'Unknown'}</td>
                          <td className='py-1 px-3 text-left'>
                            {it.images && it.images.length > 0 ? (
                              <div className='flex gap-1'>
                                {it.images.slice(0, 2).map((img, idx) => (
                                  <img key={idx} src={img} alt={`${it.cropName} ${idx + 1}`} className='w-8 h-8 rounded object-cover'/>
                                ))}
                                {it.images.length > 2 && (
                                  <div className='w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500'>
                                    +{it.images.length - 2}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className='text-gray-400'>—</span>
                            )}
                          </td>
                          <td className='py-1 px-3 text-center'>{it.capacityKg}</td>
                          <td className='py-1 px-3 text-center'>LKR {Number(it.pricePerKg||0).toLocaleString()}</td>
                          <td className='py-1 px-3 text-center'>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              it.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                              it.status === 'SOLD' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {it.status}
                            </span>
                          </td>
                          <td className='py-1 px-3 text-center'>
                            <div className='inline-flex items-center gap-2'>
                              <button className='px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs inline-flex items-center gap-1' onClick={()=>{ setViewItem({ ...it, isListing:true }); setIsEditing(false); }}>
                                <Info className='w-3.5 h-3.5' /> Info
                              </button>
                              <button className='px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs inline-flex items-center gap-1' onClick={()=>{ setViewItem({ ...it, isListing:true }); setIsEditing(true); }}>
                                <Pencil className='w-3.5 h-3.5' /> Edit
                              </button>
                              <button className='px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs inline-flex items-center gap-1' onClick={async()=>{ if(window.confirm('Delete this listing?')){ try{ await axiosInstance.delete(`listings/${it._id}`); loadListings(); }catch(_){ } } }}>
                                <Trash2 className='w-3.5 h-3.5' /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
    {/* View/Edit Modal */}
    {viewItem && (
      <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
        <div className='bg-white rounded-lg w-full max-w-2xl p-4'>
          <div className='flex items-center justify-between mb-3'>
            <h2 className='text-lg font-semibold'>{isEditing ? 'Edit Listing' : 'Listing Info'}</h2>
            <button onClick={()=>{ setViewItem(null); setIsEditing(false); }} className='text-gray-500'>Close</button>
          </div>
          {isEditing ? (
            <form onSubmit={async (e)=>{ e.preventDefault(); try{ const payload={ cropName:viewItem.cropName, pricePerKg:Number(viewItem.pricePerKg), capacityKg:Number(viewItem.capacityKg), details:viewItem.details, harvestedAt:viewItem.harvestedAt, images:viewItem.images }; await axiosInstance.put(`listings/${viewItem._id}`, payload); loadListings(); setViewItem(null); setIsEditing(false); }catch(_){}}} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='form-label'>Crop Name</label>
                <input className='input-field' value={viewItem.cropName || ''} onChange={(e)=>setViewItem(v=>({...v, cropName:e.target.value}))} required />
              </div>
              <div>
                <label className='form-label'>Price per Kg</label>
                <input type='number' min='0' step='0.01' className='input-field' value={viewItem.pricePerKg||0} onChange={(e)=>setViewItem(v=>({...v, pricePerKg:e.target.value}))} required />
              </div>
              <div>
                <label className='form-label'>Capacity (Kg)</label>
                <input type='number' min='0' className='input-field' value={viewItem.capacityKg||0} onChange={(e)=>setViewItem(v=>({...v, capacityKg:e.target.value}))} required />
              </div>
              <div>
                <label className='form-label'>Harvested Date</label>
                <input type='date' className='input-field' value={viewItem.harvestedAt ? new Date(viewItem.harvestedAt).toISOString().split('T')[0] : ''} onChange={(e)=>setViewItem(v=>({...v, harvestedAt:e.target.value}))} required />
              </div>
              <div className='md:col-span-2'>
                <label className='form-label'>Details</label>
                <textarea className='input-field' rows={3} value={viewItem.details||''} onChange={(e)=>setViewItem(v=>({...v, details:e.target.value}))} />
              </div>
              <div className='md:col-span-2'>
                <label className='form-label'>Images (up to 4)</label>
                <input type='file' accept='image/*' multiple className='block w-full text-sm' onChange={(e)=>{
                  const files = Array.from(e.target.files||[]).slice(0,4)
                  const readers = files.map(file=> new Promise((resolve)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.readAsDataURL(file) }))
                  Promise.all(readers).then(results=> setViewItem(v=>({...v, images: results})))
                }} />
                {Array.isArray(viewItem.images)&&viewItem.images.length>0 && (
                  <div className='mt-2 grid grid-cols-6 gap-2'>
                    {viewItem.images.map((src, idx)=> (
                      <img key={idx} src={src} alt={'img'+idx} className='w-full h-16 object-cover rounded-md border' />
                    ))}
                  </div>
                )}
              </div>
              <div className='md:col-span-2 flex justify-end gap-2 pt-2'>
                <button type='button' className='border px-3 py-2 rounded-md' onClick={()=>{ setViewItem(null); setIsEditing(false); }}>Cancel</button>
                <button type='submit' className='btn-primary'>Save</button>
              </div>
            </form>
          ) : (
            <div className='space-y-3 text-sm'>
              <div><span className='text-gray-500'>Crop Name:</span> <span className='font-medium'>{viewItem.cropName}</span></div>
              <div><span className='text-gray-500'>Farmer:</span> <span className='font-medium'>{viewItem.farmer?.fullName || 'Unknown'}</span></div>
              <div><span className='text-gray-500'>Details:</span> <span className='font-medium'>{viewItem.details||'—'}</span></div>
              <div className='grid grid-cols-2 gap-4'>
                <div><span className='text-gray-500'>Price per Kg:</span> <span className='font-medium'>LKR {Number(viewItem.pricePerKg||0).toLocaleString()}</span></div>
                <div><span className='text-gray-500'>Capacity:</span> <span className='font-medium'>{viewItem.capacityKg} Kg</span></div>
                <div><span className='text-gray-500'>Total Value:</span> <span className='font-medium'>LKR {(Number(viewItem.pricePerKg||0) * Number(viewItem.capacityKg||0)).toLocaleString()}</span></div>
                <div><span className='text-gray-500'>Status:</span> <span className='font-medium'>{viewItem.status}</span></div>
                <div><span className='text-gray-500'>Harvested:</span> <span className='font-medium'>{viewItem.harvestedAt ? new Date(viewItem.harvestedAt).toLocaleDateString() : '—'}</span></div>
              </div>
              <div>
                <div className='text-gray-500 mb-1'>Images</div>
                {Array.isArray(viewItem.images)&&viewItem.images.length>0 ? (
                  <div className='grid grid-cols-6 gap-2'>
                    {viewItem.images.map((src, idx)=> (
                      <img key={idx} src={src} alt={'img'+idx} className='w-full h-16 object-cover rounded-md border' />
                    ))}
                  </div>
                ) : (
                  <div className='text-gray-400'>No images</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

            {/* Middle cards: Listings Charts */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Listings Value Trend</div>
                  <div className='rounded-lg border border-dashed'>
                    <ListingsValueChart data={listingsValueData} />
                  </div>
                </div>
              </Card>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Price Analysis</div>
                  <div className='rounded-lg border border-dashed'>
                    <PriceLevelChart data={priceLevelData} />
                  </div>
                </div>
              </Card>
              
            </div>

            {/* Bottom row: Additional Listings Insights */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Recent Listings Activity</div>
                  <div className='space-y-4 text-sm'>
                    {listings.slice(0, 4).map((item, i) => (
                      <div key={i}>
                        <div className='grid grid-cols-[1fr,110px,120px] gap-3 items-start'>
                        <div>
                            <div className='font-medium'>{item.cropName}</div>
                            <div className='text-gray-500'>{item.farmer?.fullName || 'Unknown'} • {item.capacityKg} Kg listed</div>
                          </div>
                          <div className='text-gray-600 text-xs mt-0.5 ml-5'>LKR {Number(item.pricePerKg || 0).toLocaleString()} / kg</div>
                          <div className='text-gray-700 text-right text-xs font-medium'>
                            LKR {(Number(item.pricePerKg || 0) * Number(item.capacityKg || 0)).toLocaleString()}
                          </div>
                        </div>
                        {i !== Math.min(listings.length, 4) - 1 && (
                          <div className='h-px bg-gray-200 mx-2 my-2'></div>
                        )}
                </div>
              ))}
                  </div>
                </div>
              </Card>
              
              
            </div>
          </div>
        </div>
      </div>
      {/* Add Listing Modal */}
      {isAddOpen && (
        <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-2xl p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-semibold'>Add New Listing</h2>
              <button onClick={() => setIsAddOpen(false)} className='text-gray-500'>Close</button>
            </div>
            <form onSubmit={handleSubmitListing} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='form-label'>Crop Name</label>
                <input className='input-field' value={listingForm.cropName} onChange={(e)=>setListingForm(f=>({...f, cropName:e.target.value}))} required />
              </div>
              <div>
                <label className='form-label'>Price per Kg</label>
                <input type='number' min='0' step='0.01' className='input-field' value={listingForm.pricePerKg} onChange={(e)=>setListingForm(f=>({...f, pricePerKg:e.target.value}))} required />
              </div>
              <div>
                <label className='form-label'>Capacity (Kg)</label>
                <input type='number' min='0' className='input-field' value={listingForm.capacityKg} onChange={(e)=>setListingForm(f=>({...f, capacityKg:e.target.value}))} required />
              </div>
              <div>
                <label className='form-label'>Harvested Date</label>
                <input type='date' className='input-field' value={listingForm.harvestedAt} onChange={(e)=>setListingForm(f=>({...f, harvestedAt:e.target.value}))} required />
              </div>
              <div className='md:col-span-2'>
                <label className='form-label'>Details</label>
                <textarea className='input-field' rows={3} value={listingForm.details} onChange={(e)=>setListingForm(f=>({...f, details:e.target.value}))} />
              </div>
              <div className='md:col-span-2'>
                <label className='form-label'>Images (up to 4)</label>
                <input type='file' accept='image/*' multiple className='block w-full text-sm' onChange={(e)=>{
                  const files = Array.from(e.target.files||[]).slice(0,4)
                  const readers = files.map(file=> new Promise((resolve)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.readAsDataURL(file) }))
                  Promise.all(readers).then(results=> setListingForm(f=>({...f, images: results})))
                }} />
                {Array.isArray(listingForm.images) && listingForm.images.length>0 && (
                  <div className='mt-2 grid grid-cols-4 gap-2'>
                    {listingForm.images.map((src, idx)=> (
                      <img key={idx} src={src} alt={'img'+idx} className='w-full h-16 object-cover rounded-md border' />
                    ))}
                  </div>
                )}
              </div>
              <div className='md:col-span-2 flex justify-end gap-2 pt-2'>
                <button type='button' className='border px-3 py-2 rounded-md' onClick={()=>setIsAddOpen(false)}>Cancel</button>
                <button type='submit' className='btn-primary'>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminListings

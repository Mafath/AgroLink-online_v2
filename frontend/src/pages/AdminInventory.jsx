import React, { useEffect, useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { axiosInstance } from '../lib/axios'
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

// Inventory-specific chart components
const InventoryValueChart = ({ data = [] }) => (
  <Chart type='line' height={180} options={{
    chart:{toolbar:{show:false}},
    stroke:{width:3, curve:'smooth'},
    colors:['#3b82f6'],
    grid:{borderColor:'#eee'},
    xaxis:{categories:data.map(d => d.date), labels:{style:{colors:'#9ca3af'}}},
    yaxis:{labels:{style:{colors:'#9ca3af'}, formatter: (val) => `LKR ${val.toLocaleString()}`}},
    legend:{show:false}
  }} series={[{name:'Inventory Value', data:data.map(d => d.value)}]} />
)

const CategoryDistributionChart = ({ data = [] }) => (
  <Chart type='donut' height={220} options={{
    chart:{toolbar:{show:false}},
    labels:data.map(d => d.category),
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
              label:'Total Items',
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

const StockLevelChart = ({ data = [] }) => (
  <Chart type='bar' height={180} options={{
    chart:{toolbar:{show:false}},
    plotOptions:{bar:{columnWidth:'60%', borderRadius:4}},
    colors:['#ef4444', '#f59e0b', '#22c55e'],
    grid:{borderColor:'#eee'},
    xaxis:{categories:data.map(d => d.name), labels:{style:{colors:'#9ca3af'}, rotate:-45}},
    yaxis:{labels:{style:{colors:'#9ca3af'}}},
    legend:{show:false}
  }} series={[{name:'Stock Level', data:data.map(d => d.stock)}]} />
)

const AdminInventory = () => {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAddInventory, setIsAddInventory] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [rentalForm, setRentalForm] = useState({
    productName: '',
    description: '',
    rentalPerDay: '',
    rentalPerWeek: '',
    images: [],
    totalQty: '',
  })

  const [rentalItems, setRentalItems] = useState([])
  const [isLoadingRentals, setIsLoadingRentals] = useState(false)
  const [inventoryItems, setInventoryItems] = useState([])
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)
  const [inventorySortMode, setInventorySortMode] = useState('newest')
  const [inventoryForm, setInventoryForm] = useState({ name: '', category: 'seeds', image: '', stockQuantity: '', price: '', description: '' })

  const loadRentals = async () => {
    try {
      setIsLoadingRentals(true)
      const { data } = await axiosInstance.get('rentals')
      setRentalItems(Array.isArray(data?.data) ? data.data : [])
    } catch (e) {
      setRentalItems([])
    } finally {
      setIsLoadingRentals(false)
    }
  }

  useEffect(() => { loadRentals() }, [])

  const loadInventory = async () => {
    try {
      setIsLoadingInventory(true)
      const { data } = await axiosInstance.get('inventory')
      setInventoryItems(Array.isArray(data?.data) ? data.data : [])
    } catch (e) {
      setInventoryItems([])
    } finally {
      setIsLoadingInventory(false)
    }
  }

  useEffect(() => { loadInventory() }, [])

  const inventorySorted = useMemo(() => {
    const arr = [...inventoryItems]
    arr.sort((a,b)=>{
      const timeA = new Date(a.createdAt||0).getTime()
      const timeB = new Date(b.createdAt||0).getTime()
      const priceA = Number(a.price||0)
      const priceB = Number(b.price||0)
      switch (inventorySortMode) {
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
    return arr
  }, [inventoryItems, inventorySortMode])

  // Inventory metrics
  const inventoryMetrics = useMemo(() => {
    const totalItems = inventoryItems.length
    const lowStockItems = inventoryItems.filter(item => Number(item.stockQuantity || 0) < 10).length
    const totalValue = inventoryItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.stockQuantity || 0)), 0)
    const categories = inventoryItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {})

    return {
      totalItems,
      lowStockItems,
      totalValue,
      categories
    }
  }, [inventoryItems])

  // Category distribution data
  const categoryData = useMemo(() => {
    return Object.entries(inventoryMetrics.categories).map(([category, count]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count
    }))
  }, [inventoryMetrics.categories])

  // Stock level data for chart
  const stockLevelData = useMemo(() => {
    return inventoryItems
      .filter(item => Number(item.stockQuantity || 0) < 20) // Show items with low stock
      .slice(0, 8) // Limit to 8 items for readability
      .map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
        stock: Number(item.stockQuantity || 0)
      }))
  }, [inventoryItems])

  // Mock inventory value trend data (in real app, this would come from historical data)
  const inventoryValueData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((day, index) => ({
      date: day,
      value: Math.floor(inventoryMetrics.totalValue * (0.8 + Math.random() * 0.4))
    }))
  }, [inventoryMetrics.totalValue])

  const handleSubmitRental = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        productName: rentalForm.productName,
        description: rentalForm.description,
        rentalPerDay: Number(rentalForm.rentalPerDay),
        rentalPerWeek: Number(rentalForm.rentalPerWeek),
        images: rentalForm.images,
        totalQty: Number(rentalForm.totalQty),
      }
      await axiosInstance.post('rentals', payload)
      setIsAddOpen(false)
      setRentalForm({ productName: '', description: '', rentalPerDay: '', rentalPerWeek: '', images: [], totalQty: '' })
      loadRentals()
    } catch (err) {
      // handle error later; keep silent for now
    }
  }

  const handleSubmitInventory = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: inventoryForm.name,
        category: inventoryForm.category,
        description: inventoryForm.description,
        image: inventoryForm.image,
        stockQuantity: Number(inventoryForm.stockQuantity || 0),
        price: Number(inventoryForm.price || 0),
        status: 'Available',
      }
      await axiosInstance.post('inventory', payload)
      setIsAddOpen(false)
      setIsAddInventory(false)
      setInventoryForm({ name: '', category: 'seeds', image: '', stockQuantity: '', price: '', description: '' })
      loadInventory()
    } catch (err) {
      // optional: surface error
    }
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-semibold ml-2'>Inventory</h1>
        </div>

        <div className='grid grid-cols-[240px,1fr] gap-6'>
          {/* Sidebar (match Dashboard) */}
          <div className='bg-white rounded-xl border border-gray-200 p-2'>
          <nav className='space-y-1 text-gray-700 text-sm'>
              <a href='/admin' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Dashboards</a>
              <a href='/admin/users' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Users & Roles</a>
              <a href='/admin/inventory' className='block px-3 py-2 rounded-lg bg-green-100 text-green-700'>Inventory</a>
              <a href='/admin/rentals' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Rentals</a>
              <a href='/admin/drivers' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Driver Management</a>
              <a href='/admin/logistics' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Logistics</a>
            </nav>
          </div>

          {/* Main content */}
          <div className='space-y-6'>
            

            {/* Inventory table */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
              <div className='px-4 py-3 border-b border-gray-100 grid grid-cols-3 items-center gap-3'>
                <div>
                  <div className='text-md font-medium text-gray-700'>Inventory Items</div>
                </div>
                <div className='hidden sm:flex justify-center'>
                  <div className='relative'>
                    <input className='bg-white border border-gray-200 rounded-full h-9 pl-9 pr-3 w-72 text-sm outline-none' placeholder='Search' />
                  </div>
                </div>
                <div className='flex items-center justify-end gap-3'>
                  <select className='input-field h-9 py-1 text-sm hidden sm:block' value={inventorySortMode} onChange={(e)=>setInventorySortMode(e.target.value)}>
                    <option value='newest'>Newest</option>
                    <option value='oldest'>Oldest</option>
                    <option value='priceAsc'>Price: Low to High</option>
                    <option value='priceDesc'>Price: High to Low</option>
                  </select>
                  <button className='btn-primary whitespace-nowrap' onClick={()=>{ setIsAddInventory(true); setIsAddOpen(true) }}>Add Inventory Item +</button>
                </div>
              </div>
              <div className='max-h-[256px] overflow-y-auto'>
                <table className='min-w-full text-sm'>
                  <thead className='sticky top-0 bg-gray-100 z-10'>
                    <tr className='text-left text-gray-500'>
                      <th className='py-1 px-3 text-center'>Name</th>
                      <th className='py-1 px-3 text-center'>Category</th>
                      <th className='py-1 px-3 text-center'>Image</th>
                      <th className='py-1 px-3 text-center'>Stock Qty</th>
                      <th className='py-1 px-3 text-center'>Price</th>
                      <th className='py-1 px-3 text-center'>Status</th>
                      <th className='py-1 px-3 text-center'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingInventory ? (
                      <tr><td className='py-10 text-center text-gray-400' colSpan={7}>Loading…</td></tr>
                    ) : inventoryItems.length === 0 ? (
                      <tr><td className='py-10 text-center text-gray-400' colSpan={7}>No data yet</td></tr>
                    ) : (
                      inventorySorted.map((it) => (
                        <tr key={it._id} className='border-t'>
                          <td className='py-2 px-3 text-center'>{it.name}</td>
                          <td className='py-2 px-3 text-center capitalize'>{it.category}</td>
                          <td className='py-2 px-3 text-center'>{it.image ? <img src={it.image} alt={it.name} className='w-10 h-10 rounded object-cover inline-block'/> : <span className='text-gray-400'>—</span>}</td>
                          <td className='py-2 px-3 text-center'>{it.stockQuantity}</td>
                          <td className='py-2 px-3 text-center'>LKR {Number(it.price||0).toLocaleString()}</td>
                          <td className='py-2 px-3 text-center'>{it.status}</td>
                          <td className='py-2 px-3 text-center'>
                            <div className='inline-flex items-center gap-2'>
                              <button className='px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs inline-flex items-center gap-1' onClick={()=>{ setViewItem({ ...it, isInventory:true }); setIsEditing(false); }}>
                                <Info className='w-3.5 h-3.5' /> Info
                              </button>
                              <button className='px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs inline-flex items-center gap-1' onClick={()=>{ setViewItem({ ...it, isInventory:true }); setIsEditing(true); }}>
                                <Pencil className='w-3.5 h-3.5' /> Edit
                              </button>
                              <button className='px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs inline-flex items-center gap-1' onClick={async()=>{ if(window.confirm('Delete this item?')){ try{ await axiosInstance.delete(`inventory/${it._id}`); loadInventory(); }catch(_){ } } }}>
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
            <h2 className='text-lg font-semibold'>{isEditing ? 'Edit Rental Item' : 'Rental Item Info'}</h2>
            <button onClick={()=>{ setViewItem(null); setIsEditing(false); }} className='text-gray-500'>Close</button>
          </div>
          {isEditing ? (
            <form onSubmit={async (e)=>{ e.preventDefault(); try{ if(viewItem.isInventory){ const payload={ name:viewItem.name, category:viewItem.category, description:viewItem.description, image:viewItem.image, stockQuantity:Number(viewItem.stockQuantity), price:Number(viewItem.price), status:viewItem.status }; await axiosInstance.put(`inventory/${viewItem._id}`, payload); loadInventory(); } else { const payload={ productName:viewItem.productName, description:viewItem.description, rentalPerDay:Number(viewItem.rentalPerDay), rentalPerWeek:Number(viewItem.rentalPerWeek), images:viewItem.images, totalQty:Number(viewItem.totalQty) }; await axiosInstance.put(`rentals/${viewItem._id}`, payload); loadRentals(); } setViewItem(null); setIsEditing(false); }catch(_){}}} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='form-label'>{viewItem.isInventory ? 'Name' : 'Product name'}</label>
                <input className='input-field' value={(viewItem.isInventory ? viewItem.name : viewItem.productName) || ''} onChange={(e)=>setViewItem(v=> v.isInventory ? ({...v, name:e.target.value}) : ({...v, productName:e.target.value}))} required />
              </div>
              {viewItem.isInventory ? (
                <>
                  <div>
                    <label className='form-label'>Category</label>
                    <select className='input-field' value={viewItem.category||'seeds'} onChange={(e)=>setViewItem(v=>({...v, category:e.target.value}))}>
                      {['seeds','fertilizers','pesticides','chemicals','equipment','irrigation'].map(c=> <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className='form-label'>Stock Qty</label>
                    <input type='number' min='0' className='input-field' value={viewItem.stockQuantity||0} onChange={(e)=>setViewItem(v=>({...v, stockQuantity:e.target.value}))} />
                  </div>
                  <div>
                    <label className='form-label'>Price</label>
                    <input type='number' min='0' step='0.01' className='input-field' value={viewItem.price||0} onChange={(e)=>setViewItem(v=>({...v, price:e.target.value}))} />
                  </div>
                  <div>
                    <label className='form-label'>Image</label>
                    <input type='file' accept='image/*' className='block w-full text-sm' onChange={(e)=>{
                      const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=> setViewItem(v=>({...v, image:r.result})); r.readAsDataURL(f);
                    }} />
                    {viewItem.image && <img src={viewItem.image} alt='preview' className='mt-2 w-20 h-20 object-cover rounded border' />}
                  </div>
                  <div className='md:col-span-2'>
                    <label className='form-label'>Description</label>
                    <textarea className='input-field' rows={3} value={viewItem.description||''} onChange={(e)=>setViewItem(v=>({...v, description:e.target.value}))} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className='form-label'>Total Qty</label>
                    <input type='number' min='0' className='input-field' value={viewItem.totalQty||''} onChange={(e)=>setViewItem(v=>({...v, totalQty:e.target.value}))} required />
                  </div>
                  <div className='md:col-span-2'>
                    <label className='form-label'>Description</label>
                    <textarea className='input-field' rows={3} value={viewItem.description||''} onChange={(e)=>setViewItem(v=>({...v, description:e.target.value}))} />
                  </div>
                  <div>
                    <label className='form-label'>Rental / Day</label>
                    <input type='number' min='0' step='0.01' className='input-field' value={viewItem.rentalPerDay||''} onChange={(e)=>setViewItem(v=>({...v, rentalPerDay:e.target.value}))} required />
                  </div>
                  <div>
                    <label className='form-label'>Rental / Week</label>
                    <input type='number' min='0' step='0.01' className='input-field' value={viewItem.rentalPerWeek||''} onChange={(e)=>setViewItem(v=>({...v, rentalPerWeek:e.target.value}))} required />
                  </div>
                  <div className='md:col-span-2'>
                    <label className='form-label'>Images (up to 4)</label>
                    <input type='file' accept='image/*' multiple className='block w-full text-sm' onChange={(e)=>{
                      const files = Array.from(e.target.files||[]).slice(0,4)
                      const readers = files.map(file=> new Promise((resolve)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.readAsDataURL(file) }))
                      Promise.all(readers).then(results=> setViewItem(v=>({...v, images: results})))
                    }} />
                    {Array.isArray(viewItem.images) && viewItem.images.length>0 && (
                      <div className='mt-2 grid grid-cols-6 gap-2'>
                        {viewItem.images.map((src, idx)=> (
                          <img key={idx} src={src} alt={'img'+idx} className='w-full h-16 object-cover rounded-md border' />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              <div className='md:col-span-2 flex justify-end gap-2 pt-2'>
                <button type='button' className='border px-3 py-2 rounded-md' onClick={()=>{ setViewItem(null); setIsEditing(false); }}>Cancel</button>
                <button type='submit' className='btn-primary'>Save</button>
              </div>
            </form>
          ) : (
            <div className='space-y-3 text-sm'>
              <div><span className='text-gray-500'>{viewItem.isInventory ? 'Name' : 'Product name'}:</span> <span className='font-medium'>{viewItem.isInventory ? viewItem.name : viewItem.productName}</span></div>
              <div><span className='text-gray-500'>Description:</span> <span className='font-medium'>{viewItem.description||'—'}</span></div>
              <div className='grid grid-cols-2 gap-4'>
                {viewItem.isInventory ? (
                  <>
                    <div><span className='text-gray-500'>Category:</span> <span className='font-medium capitalize'>{viewItem.category}</span></div>
                    <div><span className='text-gray-500'>Stock Qty:</span> <span className='font-medium'>{viewItem.stockQuantity}</span></div>
                    <div><span className='text-gray-500'>Price:</span> <span className='font-medium'>LKR {Number(viewItem.price||0).toLocaleString()}</span></div>
                    <div><span className='text-gray-500'>Status:</span> <span className='font-medium'>{viewItem.status}</span></div>
                  </>
                ) : (
                  <>
                    <div><span className='text-gray-500'>Rental / Day:</span> <span className='font-medium'>LKR {Number(viewItem.rentalPerDay||0).toLocaleString()}</span></div>
                    <div><span className='text-gray-500'>Rental / Week:</span> <span className='font-medium'>LKR {Number(viewItem.rentalPerWeek||0).toLocaleString()}</span></div>
                    <div><span className='text-gray-500'>Total Qty:</span> <span className='font-medium'>{viewItem.totalQty}</span></div>
                    <div><span className='text-gray-500'>Available Qty:</span> <span className='font-medium'>{viewItem.availableQty}</span></div>
                  </>
                )}
              </div>
              <div>
                <div className='text-gray-500 mb-1'>Images</div>
                {viewItem.isInventory ? (
                  viewItem.image ? <img src={viewItem.image} alt='img' className='w-24 h-24 object-cover rounded-md border'/> : <div className='text-gray-400'>No image</div>
                ) : (
                  Array.isArray(viewItem.images)&&viewItem.images.length>0 ? (
                    <div className='grid grid-cols-6 gap-2'>
                      {viewItem.images.map((src, idx)=> (
                        <img key={idx} src={src} alt={'img'+idx} className='w-full h-16 object-cover rounded-md border' />
                      ))}
                    </div>
                  ) : (
                    <div className='text-gray-400'>No images</div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )}
            {/* Top cards row: Inventory Metrics */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-gray-600'>Total Items</div>
                    <div className='text-2xl font-semibold mt-1'>{inventoryMetrics.totalItems}</div>
                    <div className='mt-3'>
                      <span className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full'>All Categories</span>
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
                    <div className='text-sm text-gray-600'>Low Stock Items</div>
                    <div className='text-2xl font-semibold mt-1'>{inventoryMetrics.lowStockItems}</div>
                    <div className='mt-3 text-xs text-gray-600'>Need Restocking</div>
                  </div>
                  <div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center'>
                    <AlertTriangle className='w-6 h-6 text-red-600' />
                  </div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-gray-600'>Total Value</div>
                    <div className='text-2xl font-semibold mt-1'>LKR {inventoryMetrics.totalValue.toLocaleString()}</div>
                    <div className='mt-3 text-xs text-gray-600'>Inventory Worth</div>
                  </div>
                  <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                    <DollarSign className='w-6 h-6 text-green-600' />
                  </div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-gray-600'>Categories</div>
                    <div className='text-2xl font-semibold mt-1'>{Object.keys(inventoryMetrics.categories).length}</div>
                    <div className='mt-3 text-xs text-gray-600'>Active Categories</div>
                  </div>
                  <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                    <BarChart3 className='w-6 h-6 text-purple-600' />
                  </div>
                </div>
              </Card>
            </div>

            {/* Middle cards: Inventory Charts */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-1'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Inventory Value Trend</div>
                  <div className='rounded-lg border border-dashed'>
                    <InventoryValueChart data={inventoryValueData} />
                  </div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Low Stock Alert</div>
                  <div className='rounded-lg border border-dashed'>
                    <StockLevelChart data={stockLevelData} />
                  </div>
                </div>
              </Card>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Category Distribution</div>
                  <div className='grid grid-cols-[1fr,240px] gap-4'>
                    <div className='grid place-items-center'>
                      <div className='rounded-lg border border-dashed w-full max-w-[220px]'>
                        <CategoryDistributionChart data={categoryData} />
                      </div>
                    </div>
                    <div className='text-sm'>
                      <div className='flex items-center gap-3 mb-3'>
                        <span className='w-9 h-9 rounded-lg bg-purple-100 grid place-items-center text-purple-600'>
                          <Package className='w-5 h-5' />
                        </span>
                        <div>
                          <div className='text-xs text-gray-500'>Total Items</div>
                          <div className='font-semibold text-base'>{inventoryMetrics.totalItems}</div>
                        </div>
                      </div>
                      <div className='border-t border-gray-200 my-3'></div>
                      <div className='grid grid-cols-2 gap-x-8 gap-y-4'>
                        {categoryData.slice(0, 4).map((item, index) => (
                          <div key={index}>
                            <div className='flex items-center gap-2 text-gray-700'>
                              <span className={`w-2 h-2 rounded-full ${
                                index === 0 ? 'bg-purple-500' :
                                index === 1 ? 'bg-green-500' :
                                index === 2 ? 'bg-blue-500' :
                                'bg-yellow-500'
                              }`}></span>
                              {item.category}
                            </div>
                            <div className='text-xs text-gray-500 mt-0.5'>{item.count} items</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Bottom row: Additional Inventory Insights */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Recent Inventory Activity</div>
                  <div className='space-y-4 text-sm'>
                    {inventoryItems.slice(0, 4).map((item, i) => (
                      <div key={i} className='grid grid-cols-[16px,1fr,100px] gap-3 items-start'>
                        <span className={`w-3 h-3 rounded-full mt-1 ${
                          Number(item.stockQuantity || 0) < 10 ? 'bg-red-500' :
                          Number(item.stockQuantity || 0) < 20 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <div>
                          <div className='font-medium'>{item.name}</div>
                          <div className='text-gray-500'>{item.category} • Stock: {item.stockQuantity}</div>
                        </div>
                        <div className='text-gray-500 text-xs text-right'>LKR {Number(item.price || 0).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Price Range Distribution</div>
                  <div className='rounded-lg border border-dashed'>
                    <BarChart />
                  </div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4'>
                  <div className='text-2xl font-semibold'>LKR {inventoryMetrics.totalValue.toLocaleString()}</div>
                  <div className='text-xs text-gray-500 mt-1'>Total Inventory Value</div>
                  <div className='mt-2 rounded-lg border border-dashed'>
                    <Sparkline />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      {/* Add Item Modal */}
      {isAddOpen && (
        <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-2xl p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-semibold'>{isAddInventory ? 'Add Inventory Item' : 'Add Rental Item'}</h2>
              <button onClick={() => setIsAddOpen(false)} className='text-gray-500'>Close</button>
            </div>
            {!isAddInventory ? (
            <form onSubmit={handleSubmitRental} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='form-label'>Product name</label>
                <input className='input-field' value={rentalForm.productName} onChange={(e)=>setRentalForm(f=>({...f, productName:e.target.value}))} required />
              </div>
              <div>
                <label className='form-label'>Total Qty</label>
                <input type='number' min='0' className='input-field' value={rentalForm.totalQty} onChange={(e)=>setRentalForm(f=>({...f, totalQty:e.target.value}))} required />
              </div>
              <div className='md:col-span-2'>
                <label className='form-label'>Description</label>
                <textarea className='input-field' rows={3} value={rentalForm.description} onChange={(e)=>setRentalForm(f=>({...f, description:e.target.value}))} />
              </div>
              <div>
                <label className='form-label'>Rental / Day</label>
                <input type='number' min='0' step='0.01' className='input-field' value={rentalForm.rentalPerDay} onChange={(e)=>setRentalForm(f=>({...f, rentalPerDay:e.target.value}))} required />
              </div>
              <div>
                <label className='form-label'>Rental / Week</label>
                <input type='number' min='0' step='0.01' className='input-field' value={rentalForm.rentalPerWeek} onChange={(e)=>setRentalForm(f=>({...f, rentalPerWeek:e.target.value}))} required />
              </div>
              <div className='md:col-span-2'>
                <label className='form-label'>Images (up to 4)</label>
                <input type='file' accept='image/*' multiple className='block w-full text-sm' onChange={(e)=>{
                  const files = Array.from(e.target.files||[]).slice(0,4)
                  const readers = files.map(file=> new Promise((resolve)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.readAsDataURL(file) }))
                  Promise.all(readers).then(results=> setRentalForm(f=>({...f, images: results})))
                }} />
                {Array.isArray(rentalForm.images) && rentalForm.images.length>0 && (
                  <div className='mt-2 grid grid-cols-4 gap-2'>
                    {rentalForm.images.map((src, idx)=> (
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
            ) : (
            <form onSubmit={handleSubmitInventory} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='form-label'>Product name</label>
                <input className='input-field' value={inventoryForm.name} onChange={(e)=>setInventoryForm(f=>({...f, name:e.target.value}))} required />
              </div>
              <div>
                <label className='form-label'>Product category</label>
                <select className='input-field' value={inventoryForm.category} onChange={(e)=>setInventoryForm(f=>({...f, category:e.target.value}))}>
                  {['seeds','fertilizers','pesticides','chemicals','equipment','irrigation'].map(c=> <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className='form-label'>Stock quantity</label>
                <input type='number' min='0' className='input-field' value={inventoryForm.stockQuantity} onChange={(e)=>setInventoryForm(f=>({...f, stockQuantity:e.target.value}))} required />
              </div>
              <div>
                <label className='form-label'>Price</label>
                <input type='number' min='0' step='0.01' className='input-field' value={inventoryForm.price} onChange={(e)=>setInventoryForm(f=>({...f, price:e.target.value}))} required />
              </div>
              <div className='md:col-span-2'>
                <label className='form-label'>Image</label>
                <input type='file' accept='image/*' className='block w-full text-sm' onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=> setInventoryForm(v=>({...v, image:r.result})); r.readAsDataURL(f); }} />
                {inventoryForm.image && <img src={inventoryForm.image} alt='preview' className='mt-2 w-20 h-20 object-cover rounded border' />}
              </div>
              <div className='md:col-span-2'>
                <label className='form-label'>Description</label>
                <textarea className='input-field' rows={3} value={inventoryForm.description} onChange={(e)=>setInventoryForm(f=>({...f, description:e.target.value}))} />
              </div>
              <div className='md:col-span-2 flex justify-end gap-2 pt-2'>
                <button type='button' className='border px-3 py-2 rounded-md' onClick={()=>setIsAddOpen(false)}>Cancel</button>
                <button type='submit' className='btn-primary'>Save</button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInventory




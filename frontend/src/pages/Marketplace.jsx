import React, { useEffect, useState } from 'react'
import { axiosInstance } from '../lib/axios'
import toast from 'react-hot-toast'
import { ChevronDown, X, ShoppingCart, Plus, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { addToUserCart } from '../lib/cartUtils'
import { useNavigate } from 'react-router-dom'

const Marketplace = () => {
  const { authUser } = useAuthStore()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [q, setQ] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [quantities, setQuantities] = useState({})
  const [activeTab, setActiveTab] = useState('marketplace') // 'marketplace' or 'rentals'
  // Rentals booking state
  const [rentalQty, setRentalQty] = useState(1)
  const [rentalStart, setRentalStart] = useState('')
  const [rentalEnd, setRentalEnd] = useState('')
  const [availability, setAvailability] = useState(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  const userRole = String(authUser?.role || '').toUpperCase()
  const isFarmer = userRole === 'FARMER'

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        if (isFarmer) {
          if (activeTab === 'marketplace') {
            // Farmers see inventory items
            const res = await axiosInstance.get('/inventory')
            setItems(res.data.data || res.data)
          } else if (activeTab === 'rentals') {
            // Farmers see rental items
            const res = await axiosInstance.get('/rentals/public')
            setItems(res.data.data || res.data)
          }
        } else {
          // Buyers see farmer listings (with finalPricePerKg from API)
          const res = await axiosInstance.get('/listings')
          setItems(res.data)
        }
      } catch (e) {
        toast.error('Failed to load marketplace')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isFarmer, activeTab])

  // Rentals: check availability for a selected item and date range
  const checkRentalAvailability = async (itemId) => {
    if (!rentalStart || !rentalEnd) {
      toast.error('Select start and end dates')
      return
    }
    try {
      setCheckingAvailability(true)
      const res = await axiosInstance.get(`/rentals/${itemId}/availability`, {
        params: { start: rentalStart, end: rentalEnd },
      })
      setAvailability(res.data?.data || res.data)
    } catch (e) {
      toast.error('Failed to check availability')
      setAvailability(null)
    } finally {
      setCheckingAvailability(false)
    }
  }

  // Rentals: add rental booking to cart
  const addRentalToCart = async (item) => {
    if (!authUser) {
      toast.error('Please login to add rentals to cart')
      return
    }
    if (!rentalStart || !rentalEnd) {
      toast.error('Select start and end dates')
      return
    }
    if (!rentalQty || rentalQty < 1) {
      toast.error('Enter a valid quantity')
      return
    }
    
    const userId = authUser._id || authUser.id
    const rentalData = {
      startDate: rentalStart,
      endDate: rentalEnd
    }
    
    const success = await addToUserCart(userId, item, rentalQty, rentalData)
    if (success) {
      toast.success('Rental added to cart')
      setSelected(null)
    } else {
      toast.error('Failed to add rental to cart')
    }
  }

  const filteredItems = (Array.isArray(items) ? items : []).filter((it) => {
    const query = q.trim().toLowerCase();
    
    if (isFarmer) {
      if (activeTab === 'marketplace') {
        // For inventory items - exclude items with 0 stock quantity
        if (Number(it.stockQuantity || 0) === 0) return false;
        
        if (!query && (categoryFilter === 'all' || !categoryFilter)) return true;
        
        const matchesQuery = (
          String(it.name || '').toLowerCase().includes(query) ||
          String(it.description || '').toLowerCase().includes(query) ||
          String(it.category || '').toLowerCase().includes(query)
        )
        const matchesCategory = categoryFilter === 'all' || String(it.category || '').toLowerCase() === categoryFilter
        return matchesQuery && matchesCategory
      } else if (activeTab === 'rentals') {
        // For rental items - exclude items with 0 available quantity
        if (Number(it.availableQty || 0) === 0) return false;
        
        if (!query) return true;
        
        const matchesQuery = (
          String(it.productName || '').toLowerCase().includes(query) ||
          String(it.description || '').toLowerCase().includes(query)
        )
        return matchesQuery
      }
    } else {
      // For listing items
      if (!query) return true;
      
      const farmerName = it.farmer?.fullName || (it.farmer?.email ? it.farmer.email.split('@')[0] : '')
      return (
        String(it.cropName || '').toLowerCase().includes(query) ||
        String(it.details || '').toLowerCase().includes(query) ||
        String(farmerName || '').toLowerCase().includes(query)
      )
    }
  })

  let sortedItems = [...filteredItems].sort((a, b) => {
    if (isFarmer) {
      if (activeTab === 'marketplace') {
        // For inventory items
        if (sortBy === 'price_asc') return Number(a.price) - Number(b.price)
        if (sortBy === 'price_desc') return Number(b.price) - Number(a.price)
        if (sortBy === 'stock_asc') return Number(a.stockQuantity) - Number(b.stockQuantity)
        if (sortBy === 'stock_desc') return Number(b.stockQuantity) - Number(a.stockQuantity)
        if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        // default latest
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      } else if (activeTab === 'rentals') {
        // For rental items
        if (sortBy === 'price_asc') return Number(a.rentalPerDay) - Number(b.rentalPerDay)
        if (sortBy === 'price_desc') return Number(b.rentalPerDay) - Number(a.rentalPerDay)
        if (sortBy === 'stock_asc') return Number(a.availableQty) - Number(b.availableQty)
        if (sortBy === 'stock_desc') return Number(b.availableQty) - Number(a.availableQty)
        if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        // default latest
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      }
    } else {
      // For listing items
      if (sortBy === 'price_asc') return Number((a.finalPricePerKg ?? a.pricePerKg) || 0) - Number((b.finalPricePerKg ?? b.pricePerKg) || 0)
      if (sortBy === 'price_desc') return Number((b.finalPricePerKg ?? b.pricePerKg) || 0) - Number((a.finalPricePerKg ?? a.pricePerKg) || 0)
      if (sortBy === 'harvested_asc') return new Date(a.harvestedAt) - new Date(b.harvestedAt)
      if (sortBy === 'harvested_desc') return new Date(b.harvestedAt) - new Date(a.harvestedAt)
      if (sortBy === 'capacity_asc') return Number(a.capacityKg) - Number(b.capacityKg)
      if (sortBy === 'capacity_desc') return Number(b.capacityKg) - Number(a.capacityKg)
      if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      // default latest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    }
  })

  if (isFarmer && categoryFilter !== 'all') {
    sortedItems = sortedItems.sort((a, b) => {
      const ca = String(a.category || '').toLowerCase()
      const cb = String(b.category || '').toLowerCase()
      if (categoryFilter === 'asc') return ca.localeCompare(cb)
      if (categoryFilter === 'desc') return cb.localeCompare(ca)
      return 0
    })
  }

  const addToCart = (item) => {
    console.log('addToCart called with:', { item, authUser, isFarmer });
    
    if (!authUser) {
      toast.error('Please login to add items to cart');
      return;
    }

    const userId = authUser._id || authUser.id;
    if (!userId) {
      console.error('User ID is missing:', authUser);
      toast.error('User authentication error. Please login again.');
      return;
    }

    if (!item || !item._id) {
      console.error('Invalid item:', item);
      toast.error('Invalid item. Please try again.');
      return;
    }

    const quantity = quantities[item._id] || 1;
    if (quantity < 1) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    if (isFarmer) {
      // For inventory items - check stock quantity
      if (quantity > item.stockQuantity) {
        toast.error('Quantity exceeds available stock');
        return;
      }
    } else {
      // For listing items - check capacity
      if (quantity > item.capacityKg) {
        toast.error('Quantity exceeds available capacity');
        return;
      }
    }

    // Use the user-specific cart utility function
    console.log('Adding to cart:', { 
      userId: userId, 
      item: {
        _id: item._id,
        name: item.name,
        cropName: item.cropName,
        price: item.price,
        pricePerKg: item.pricePerKg,
        stockQuantity: item.stockQuantity,
        capacityKg: item.capacityKg,
        images: item.images,
        category: item.category
      }, 
      quantity 
    });
    
    const success = addToUserCart(userId, item, quantity);
    
    if (success) {
      toast.success('Added to cart');
      setQuantities({ ...quantities, [item._id]: 1 });
    } else {
      console.error('Failed to add item to cart:', { item, quantity, userId: userId });
      toast.error('Failed to add item to cart');
    }
  };

  const updateQuantity = (itemId, quantity) => {
    setQuantities({ ...quantities, [itemId]: Math.max(1, quantity) });
  };

  return (
    <div className='px-28 py-4 mb-20 max-w-none mx-auto'>
      <div className='flex items-center justify-between mb-6 mt-6'>
        <button 
          onClick={() => navigate('/')}
          className='flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-700 text-emerald-700 rounded-full transition-colors hover:bg-emerald-50'
        >
          <ArrowLeft className='w-3.5 h-3.5' />
          <span className='text-xs'>Back</span>
        </button>
        <h2 className='text-3xl md:text-4xl font-bold text-black'>Marketplace</h2>
        <div className='w-32'></div>
      </div>
      <div className='relative mb-6 flex items-center'>
        <div className='mx-auto max-w-md w-full'>
          <input
            className='input-field rounded-full w-full text-sm py-2'
            placeholder={isFarmer ? (activeTab === 'marketplace' ? 'Search products, categories, descriptions...' : 'Search rental items, descriptions...') : 'Search crops, farmers, details...'}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className='absolute right-0 flex gap-2'>
          <div className='relative w-36'>
            <select className='input-field rounded-full pr-7 py-1 h-8 text-xs appearance-none' value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label='Sort by'>
              <option value='latest'>Latest</option>
              <option value='oldest'>Oldest</option>
              <option value='price_asc'>Price: Low to High</option>
              <option value='price_desc'>Price: High to Low</option>
              {isFarmer ? (
                <></>
              ) : (
                <>
                  <option value='harvested_desc'>Harvest date: Newest</option>
                  <option value='harvested_asc'>Harvest date: Oldest</option>
                  <option value='capacity_desc'>Capacity: High to Low</option>
                  <option value='capacity_asc'>Capacity: Low to High</option>
                </>
              )}
            </select>
            <ChevronDown className='w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none' />
          </div>
          {isFarmer && (
            <div className='relative w-40'>
              <select className='input-field rounded-full pr-7 py-1 h-8 text-xs appearance-none'
                value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label='Filter by category'>
                <option value='all'>All categories</option>
                <option value='seeds'>seeds</option>
                <option value='fertilizers'>fertilizers</option>
                <option value='pesticides'>pesticides</option>
                <option value='chemicals'>chemicals</option>
                <option value='equipment'>equipment</option>
                <option value='irrigation'>irrigation</option>
              </select>
              <ChevronDown className='w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none' />
            </div>
          )}
        </div>
      </div>
      
      {/* Tab buttons for farmers */}
      {isFarmer && (
        <div className='flex justify-center mb-6'>
          <div className='flex bg-gray-100 rounded-lg p-1'>
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'marketplace'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Marketplace
            </button>
            <button
              onClick={() => setActiveTab('rentals')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'rentals'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Rentals
            </button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div>Loading...</div>
      ) : sortedItems.length === 0 ? (
        <div className='text-gray-500 text-sm'>No matching products.</div>
      ) : (
        <div className='border-2 border-gray-200 rounded-xl px-4 py-3 bg-white max-h-[80vh] overflow-y-auto shadow-lg'>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
            {sortedItems.map(it => (
            <div key={it._id} className='card p-4 flex flex-col text-sm min-h-[280px]'>
              {Array.isArray(it.images) && it.images.length > 0 ? (
                <div className={`overflow-hidden rounded-lg -mt-1 -mx-1 ${isFarmer ? 'mb  -2' : 'mb-1.5'}`}>
                  <img src={it.images[0]} alt={isFarmer ? it.name : it.cropName} className={`w-full ${isFarmer ? 'h-32' : 'h-36'} object-cover`} />
                </div>
              ) : (
                <div className={`w-full ${isFarmer ? 'h-32' : 'h-36'} bg-gray-100 rounded-lg -mt-1 -mx-1 ${isFarmer ? 'mb-2' : 'mb-1.5'} grid place-items-center text-gray-400 text-xs`}>
                  No image
                </div>
              )}
              <div className={`${isFarmer ? 'text-base' : 'text-sm'} font-semibold`}>
                {isFarmer ? (activeTab === 'marketplace' ? it.name : it.productName) : it.cropName}
              </div>
              <div className={`mt-1 ${isFarmer ? 'text-xs' : 'text-[10px]'} font-semibold text-gray-900`}>
                {isFarmer && activeTab === 'rentals' ? (
                  <>
                    <div>LKR {Number(it.rentalPerDay).toFixed(2)} / day</div>
                  </>
                ) : (
                  <>LKR {Number(isFarmer ? it.price : (it.finalPricePerKg ?? it.pricePerKg)).toFixed(2)} {isFarmer ? '' : '/ kg'}</>
                )}
              </div>
              {isFarmer ? (
                <>
                  {activeTab === 'marketplace' ? (
                    <div className='text-xs text-gray-500 mt-1'>Category: {it.category}</div>
                  ) : (
                    <div className='mt-1 text-xs text-gray-600 truncate' title={it.description || ''}>
                      {String(it.description || '').trim() || '—'}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className='mt-1 flex items-center gap-2'>
                    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700 border'>
                      {it.capacityKg} kg available
                    </span>
                    <span className='text-[10px] text-gray-500'>
                      by {it.farmer?.fullName || (it.farmer?.email ? it.farmer.email.split('@')[0] : 'Farmer')}
                    </span>
                  </div>
                  <div className={`${isFarmer ? 'mt-1' : 'mt-0.5'} text-[11px] text-gray-600 flex flex-col`}>
                    <span>Harvested {new Date(it.harvestedAt).toLocaleDateString()}</span>
                    {(() => {
                      const days = Number(it.expireAfterDays)
                      if (!Number.isFinite(days) || days <= 0) return null
                      const d = new Date(it.harvestedAt)
                      d.setDate(d.getDate() + days)
                      return <span>Best before {d.toLocaleDateString()}</span>
                    })()}
                  </div>
                </>
              )}
              <div className={`${isFarmer ? 'mt-3 space-y-2' : 'mt-2 space-y-1.5'}`}>
                {isFarmer && activeTab === 'rentals' ? (
                  <div className='flex gap-2'>
                    <button className='border flex-1 px-2.5 py-1.5 rounded-md text-xs flex items-center justify-center' onClick={() => { setSelected(it); setSelectedImageIndex(0); setRentalQty(1); setRentalStart(''); setRentalEnd(''); setAvailability(null) }}>View info</button>
                    <button className='btn-primary flex-1 px-2 py-1.5 text-[10px] flex items-center justify-center gap-0.5' onClick={() => { setSelected(it); setSelectedImageIndex(0); setRentalQty(1); setRentalStart(''); setRentalEnd(''); setAvailability(null) }}>
                      <Plus className='w-3 h-3' />
                      <span className='whitespace-nowrap'>Rent</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className='flex items-center gap-2'>
                      <label className='text-[11px] text-gray-600'>Qty:</label>
                      <input
                        type='number'
                        min='1'
                        max={isFarmer ? (activeTab === 'marketplace' ? it.stockQuantity : it.availableQty) : it.capacityKg}
                        value={quantities[it._id] || 1}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value) || 1
                          const max = isFarmer ? (activeTab === 'marketplace' ? Number(it.stockQuantity) : Number(it.availableQty)) : Number(it.capacityKg)
                          const clamped = Math.max(1, Math.min(max, raw))
                          updateQuantity(it._id, clamped)
                        }}
                        className='w-14 px-2 py-1 text-xs border border-gray-300 rounded'
                      />
                      <span className='text-[11px] text-gray-500'>
                        {isFarmer ? (activeTab === 'marketplace' ? 'units' : 'items') : 'kg'}
                      </span>
                    </div>
                    <div className='flex gap-2'>
                      <button className='border flex-1 px-2.5 py-1.5 rounded-md text-xs flex items-center justify-center' onClick={() => { setSelected(it); setSelectedImageIndex(0) }}>View info</button>
                      <button className='btn-primary flex-1 px-2 py-1.5 text-[10px] flex items-center justify-center gap-0.5' onClick={() => addToCart(it)}>
                        <ShoppingCart className='w-3 h-3' />
                        <span className='whitespace-nowrap'>Add to cart</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-50'>
          <div className='card w-full max-w-xl relative'>
            <button onClick={() => setSelected(null)} aria-label='Close' className='absolute right-3 top-3 p-2 rounded-full hover:bg-gray-100'>
              <X className='w-4 h-4 text-gray-600' />
            </button>
            {Array.isArray(selected.images) && selected.images.length > 0 ? (
              <div className='overflow-hidden rounded-lg -mt-2 mb-3 flex justify-center'>
                <img src={selected.images[selectedImageIndex]} alt={isFarmer ? selected.name : selected.cropName} className='h-48 w-full object-cover rounded-md' />
              </div>
            ) : (
              <div className='h-48 w-full bg-gray-100 rounded-lg -mt-2 mb-3 grid place-items-center text-gray-400 text-sm mx-auto'>
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
                    <img src={src} alt={'thumb'+idx} className='w-16 h-16 object-cover' />
                  </button>
                ))}
              </div>
            )}
            <h3 className='text-lg font-semibold mb-2'>{isFarmer ? (activeTab === 'rentals' ? selected.productName : selected.name) : selected.cropName}</h3>
            {!isFarmer && (
              <div className='text-sm text-gray-500 mb-2'>
                Farmer: {selected.farmer?.fullName || (selected.farmer?.email ? selected.farmer.email.split('@')[0] : 'Farmer')}
              </div>
            )}
            {/* Summary section varies by context */}
            <div className='grid grid-cols-2 gap-3 text-sm'>
              {isFarmer ? (
                activeTab === 'rentals' ? (
                  <>
                    <div>
                      <div className='text-gray-500'>Rate / day</div>
                      <div className='font-medium'>LKR {Number(selected.rentalPerDay).toFixed(2)}</div>
                    </div>
                    
                  </>
                ) : (
                  <>
                    <div>
                      <div className='text-gray-500'>Price</div>
                      <div className='font-medium'>LKR {Number(selected.price).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className='text-gray-500'>Stock</div>
                      <div className='font-medium'>{selected.stockQuantity} units</div>
                    </div>
                    <div>
                      <div className='text-gray-500'>Category</div>
                      <div className='font-medium'>{selected.category}</div>
                    </div>
                    <div>
                      <div className='text-gray-500'>Status</div>
                      <div className='font-medium'>{selected.status}</div>
                    </div>
                  </>
                )
              ) : (
                <>
                  <div>
                    <div className='text-gray-500'>Price / kg</div>
                    <div className='font-medium'>LKR {Number(selected.finalPricePerKg ?? selected.pricePerKg).toFixed(2)}</div>
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
                </>
              )}
            </div>
            {(selected.details || selected.description) && (
              <div className='mt-3 text-sm'>
                <div className='text-gray-500'>Details</div>
                <div>{selected.details || selected.description}</div>
              </div>
            )}
            {/* Action area: differs for rentals vs others */}
            {isFarmer && activeTab === 'rentals' ? (
              <div className='mt-3 space-y-3'>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='flex flex-col'>
                    <label className='text-xs text-gray-600 mb-1'>Start date</label>
                    <input 
                      type='date' 
                      className='input-field text-sm' 
                      value={rentalStart} 
                      min={(new Date()).toISOString().split('T')[0]} 
                      onChange={(e)=>{ 
                        const v = e.target.value
                        const today = new Date()
                        const start = v ? new Date(v) : null
                        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                        if (start && start < startOfToday) {
                          setRentalStart(startOfToday.toISOString().split('T')[0])
                          // Clamp end date into [today, today+30d]
                          const maxEnd = new Date(startOfToday.getTime() + 30 * 24 * 60 * 60 * 1000)
                          const currentEnd = rentalEnd ? new Date(rentalEnd) : null
                          if (!currentEnd || currentEnd < startOfToday) {
                            setRentalEnd(startOfToday.toISOString().split('T')[0])
                          } else if (currentEnd > maxEnd) {
                            setRentalEnd(maxEnd.toISOString().split('T')[0])
                          }
                          setAvailability(null)
                          return
                        }
                        setRentalStart(v)
                        // After setting start, clamp end within [start, start+30d]
                        if (start) {
                          const dayStart = new Date(start.getFullYear(), start.getMonth(), start.getDate())
                          const maxEnd = new Date(dayStart.getTime() + 30 * 24 * 60 * 60 * 1000)
                          const currentEnd = rentalEnd ? new Date(rentalEnd) : null
                          if (!currentEnd || currentEnd < dayStart) {
                            setRentalEnd(dayStart.toISOString().split('T')[0])
                          } else if (currentEnd > maxEnd) {
                            setRentalEnd(maxEnd.toISOString().split('T')[0])
                          }
                        }
                        setAvailability(null) 
                      }} 
                    />
                  </div>
                  <div className='flex flex-col'>
                    <label className='text-xs text-gray-600 mb-1'>End date</label>
                    <input 
                      type='date' 
                      className='input-field text-sm' 
                      value={rentalEnd} 
                      min={(rentalStart ? new Date(rentalStart) : new Date()).toISOString().split('T')[0]} 
                      max={(function(){
                        const base = rentalStart ? new Date(rentalStart) : new Date()
                        const startOfBase = new Date(base.getFullYear(), base.getMonth(), base.getDate())
                        const maxDate = new Date(startOfBase.getTime() + 30 * 24 * 60 * 60 * 1000)
                        return maxDate.toISOString().split('T')[0]
                      })()} 
                      onChange={(e)=>{ 
                        const v = e.target.value
                        const base = rentalStart ? new Date(rentalStart) : new Date()
                        const startOfBase = new Date(base.getFullYear(), base.getMonth(), base.getDate())
                        const maxDate = new Date(startOfBase.getTime() + 30 * 24 * 60 * 60 * 1000)
                        const picked = v ? new Date(v) : null
                        if (picked) {
                          if (picked < startOfBase) {
                            setRentalEnd(startOfBase.toISOString().split('T')[0])
                            setAvailability(null)
                            return
                          }
                          if (picked > maxDate) {
                            setRentalEnd(maxDate.toISOString().split('T')[0])
                            setAvailability(null)
                            return
                          }
                        }
                        setRentalEnd(v); 
                        setAvailability(null) 
                      }} 
                    />
                  </div>
                  <div className='flex items-center gap-2 col-span-2'>
                    <label className='text-sm text-gray-600'>Quantity (items):</label>
                    <input type='number' min='1' className='w-20 px-2 py-1 text-sm border border-gray-300 rounded' value={rentalQty}
                      onChange={(e)=> setRentalQty(Math.max(1, Number(e.target.value) || 1))} />
                    <button className='px-2 py-1 text-xs border rounded-md'
                      onClick={()=> checkRentalAvailability(selected._id)} disabled={checkingAvailability}>
                      {checkingAvailability ? 'Checking...' : 'Check availability'}
                    </button>
                  </div>
                </div>
                {availability && (
                  <div className='text-xs text-gray-700'>
                    Available for selected dates: <span className='font-semibold'>{Number(availability.availableQty || 0)}</span>
                  </div>
                )}
                <div className='flex justify-end gap-2'>
                  <button className='border px-2 py-1 rounded-md text-xs' onClick={() => setSelected(null)}>Close</button>
                  <button className='btn-primary px-3 py-2 text-xs' onClick={()=> addRentalToCart(selected)}>
                    Add to cart
                  </button>
                </div>
              </div>
            ) : (
              <div className='mt-3 space-y-2'>
                <div className='flex items-center gap-2'>
                  <label className='text-sm text-gray-600'>Quantity ({isFarmer ? 'units' : 'kg'}):</label>
                  <input
                    type='number'
                    min='1'
                    max={isFarmer ? selected.stockQuantity : selected.capacityKg}
                    value={quantities[selected._id] || 1}
                    onChange={(e) => {
                      const raw = parseInt(e.target.value) || 1
                      const max = isFarmer ? Number(selected.stockQuantity) : Number(selected.capacityKg)
                      const clamped = Math.max(1, Math.min(max, raw))
                      updateQuantity(selected._id, clamped)
                    }}
                    className='w-20 px-2 py-1 text-sm border border-gray-300 rounded'
                  />
                </div>
                <div className='flex justify-end gap-2'>
                  <button className='border px-2 py-1 rounded-md text-xs' onClick={() => setSelected(null)}>Close</button>
                  <button className='btn-primary px-3 py-2 text-xs flex items-center gap-1' onClick={() => addToCart(selected)}>
                    <ShoppingCart className='w-3 h-3' />
                    Add to cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Marketplace



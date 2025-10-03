import React, { useEffect, useState } from 'react'
import { axiosInstance } from '../lib/axios'
import { Plus, X, Edit, Trash2, Info, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const MyListings = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ cropName: '', pricePerKg: '', capacityKg: '', details: '', harvestedAt: '', expireAfterDays: '', images: [] })
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [infoModal, setInfoModal] = useState(null)
  const [newListExpireSort, setNewListExpireSort] = useState('soon') // 'soon' | 'later'

  const toInputDate = (value) => {
    try {
      const d = value ? new Date(value) : null
      if (!d || isNaN(d.getTime())) return ''
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch {
      return ''
    }
  }

  const toBackendStatus = (s) => {
    if (s === 'ACTIVE') return 'AVAILABLE'
    if (s === 'SOLD_OUT') return 'SOLD'
    if (s === 'INACTIVE') return 'REMOVED'
    return s
  }

  const handleOpenEdit = (it) => {
    setPreview(it)
    setEditForm({
      cropName: it.cropName || '',
      pricePerKg: it.pricePerKg ?? '',
      capacityKg: it.capacityKg ?? '',
      harvestedAt: toInputDate(it.harvestedAt),
      details: it.details || '',
      status: toBackendStatus(it.status || 'AVAILABLE'),
      expireAfterDays: it.expireAfterDays ?? '',
      images: [], // selecting new images replaces existing ones; empty keeps current
    })
  }

  const load = async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get('/listings/mine')
      setItems(res.data)
    } catch (e) {
      toast.error('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const daysTillExpire = (it) => {
    const days = Number(it.expireAfterDays)
    if (!Number.isFinite(days) || days <= 0) return null
    const harvested = new Date(it.harvestedAt)
    if (isNaN(harvested.getTime())) return null
    const best = new Date(harvested.getFullYear(), harvested.getMonth(), harvested.getDate())
    best.setDate(best.getDate() + days)
    const today = new Date()
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const diffMs = best - startToday
    return Math.ceil(diffMs / (24*60*60*1000))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.cropName || !form.pricePerKg || !form.capacityKg || !form.harvestedAt) {
      toast.error('Please fill all required fields')
      return
    }
    try {
      setSaving(true)
      const payload = {
        cropName: form.cropName,
        pricePerKg: Number(form.pricePerKg),
        capacityKg: Number(form.capacityKg),
        details: form.details,
        harvestedAt: form.harvestedAt,
        expireAfterDays: form.expireAfterDays ? Number(form.expireAfterDays) : undefined,
        images: form.images,
      }
      const res = await axiosInstance.post('/listings', payload)
      toast.success('Listing created')
      setShowForm(false)
      setForm({ cropName: '', pricePerKg: '', capacityKg: '', details: '', harvestedAt: '', expireAfterDays: '', images: [] })
      setItems(prev => [res.data, ...prev])
      
      // Refresh farmer activities if the global function exists
      if (window.refreshFarmerActivities) {
        window.refreshFarmerActivities()
      }
    } catch (e) {
      toast.error(e?.response?.data?.error?.message || 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  const mapStatus = (s) => {
    if (s === 'AVAILABLE') return 'AVAILABLE'
    if (s === 'SOLD') return 'SOLD'
    if (s === 'REMOVED') return 'REMOVED'
    return s
  }

  return (
    <div className='p-4 max-w-7xl mx-auto'>
      <div className='flex items-center justify-between mb-4 mt-6'>
        <button 
          onClick={() => navigate('/')}
          className='flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-700 text-emerald-700 rounded-full transition-colors hover:bg-emerald-50'
        >
          <ArrowLeft className='w-3.5 h-3.5' />
          <span className='text-xs'>Back</span>
        </button>
        <h2 className='text-3xl md:text-4xl font-bold text-black'>My Listings</h2>
        <div className='w-20'></div>
      </div>
      <div className='flex items-center justify-end mb-4'>
        <button onClick={() => setShowForm(true)} className='btn-primary flex items-center gap-2 whitespace-nowrap'>
          <Plus className='w-4 h-4' /> Add new post
        </button>
      </div>

      <div className='card'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xl font-semibold text-green-800'>New Listings</h3>
          <div className='flex items-center gap-2'>
            <label className='text-xs text-gray-600'>Sort by expiry:</label>
            <select className='input-field py-1 h-8 text-xs' value={newListExpireSort} onChange={(e)=>setNewListExpireSort(e.target.value)}>
              <option value='soon'>Soonest first</option>
              <option value='later'>Latest first</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : items.filter(item => item.status === 'AVAILABLE').length === 0 ? (
          <div className='text-gray-500 text-sm'>No active listings yet.</div>
        ) : (
          <div className='overflow-x-auto border border-gray-200 rounded-lg p-4'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left border-b'>
                  <th className='py-2 pr-4'>Crop</th>
                  <th className='py-2 pr-4'>Price/kg</th>
                  <th className='py-2 pr-4 text-center'>Capacity (kg)</th>
                  <th className='py-2 pr-4'>Harvested</th>
                  <th className='py-2 pr-4 text-center'>Days till expire</th>
                  <th className='py-2 pr-4'>Images</th>
                  <th className='py-2'>Status</th>
                  <th className='py-2 pl-4'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items
                  .filter(item => item.status === 'AVAILABLE')
                  .sort((a,b)=>{
                    const da = daysTillExpire(a)
                    const db = daysTillExpire(b)
                    const na = (da == null ? Number.POSITIVE_INFINITY : da)
                    const nb = (db == null ? Number.POSITIVE_INFINITY : db)
                    return newListExpireSort === 'soon' ? na - nb : nb - na
                  })
                  .map(it => {
                    const dte = daysTillExpire(it)
                    const bestBefore = (()=>{ const days = Number(it.expireAfterDays); if(!Number.isFinite(days)||days<=0) return null; const d=new Date(it.harvestedAt); d.setDate(d.getDate()+days); return d })()
                    return (
                  <tr key={it._id} className='border-b last:border-0 hover:bg-gray-50'>
                    <td className='py-2 pr-4'>{it.cropName}</td>
                    <td className='py-2 pr-4'>LKR {Number(it.pricePerKg).toFixed(2)}</td>
                    <td className='py-2 pr-4 text-center'>{it.capacityKg} kg</td>
                    <td className='py-2 pr-4'>{new Date(it.harvestedAt).toLocaleDateString()}</td>
                    <td className='py-2 pr-4 text-center'>{dte != null ? dte : (bestBefore ? 0 : '—')}</td>
                    <td className='py-2 pr-4'>
                      {Array.isArray(it.images) && it.images.length > 0 ? (
                        <div className='grid grid-cols-4 gap-1 max-w-[180px]'>
                          {it.images.slice(0,4).map((src, idx) => (
                            <img key={idx} src={src} alt={'img'+idx} className='w-10 h-10 object-cover rounded' />
                          ))}
                        </div>
                      ) : (
                        <span className='text-gray-400'>No images</span>
                      )}
                    </td>
                    <td className='py-2'>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        it.status === 'AVAILABLE' ? 'bg-blue-100 text-blue-800' :
                        it.status === 'SOLD' ? 'bg-green-100 text-green-800' :
                        it.status === 'REMOVED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {mapStatus(it.status)}
                      </span>
                    </td>
                    <td className='py-2 pl-4'>
                      <div className='flex gap-2'>
                        <button className='border px-2 py-1 rounded-md text-xs flex items-center gap-1' onClick={() => setInfoModal(it)}><Info className='w-3 h-3' /> Info</button>
                        <button className='border px-2 py-1 rounded-md text-xs flex items-center gap-1' onClick={() => handleOpenEdit(it)}><Edit className='w-3 h-3' /> Edit</button>
                        <button className='border px-2 py-1 rounded-md text-xs text-red-600 flex items-center gap-1' onClick={() => setConfirmDelete(it)}><Trash2 className='w-3 h-3' /> Delete</button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sold Items Table */}
      <div className='card mt-6'>
        <h3 className='text-xl font-semibold text-red-800 mb-4'>Sold Items</h3>
        {loading ? (
          <div>Loading...</div>
        ) : items.filter(item => item.status === 'SOLD').length === 0 ? (
          <div className='text-gray-500 text-sm'>No sold items yet.</div>
        ) : (
          <div className='overflow-x-auto border border-gray-200 rounded-lg p-4'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left border-b'>
                  <th className='py-2 pr-4'>Crop</th>
                  <th className='py-2 pr-4'>Price/kg</th>
                  <th className='py-2 pr-4'>Harvested Date</th>
                  <th className='py-2 pr-4'>Sold Date</th>
                  <th className='py-2 pr-4'>Images</th>
                  <th className='py-2'>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.filter(item => item.status === 'SOLD').map(it => (
                  <tr key={it._id} className='border-b last:border-0 hover:bg-gray-50'>
                    <td className='py-2 pr-4'>{it.cropName}</td>
                    <td className='py-2 pr-4'>LKR {Number(it.pricePerKg).toFixed(2)}</td>
                    <td className='py-2 pr-4'>{new Date(it.harvestedAt).toLocaleDateString()}</td>
                    <td className='py-2 pr-4'>{(it.soldAt ? new Date(it.soldAt) : (it.updatedAt ? new Date(it.updatedAt) : null))?.toLocaleDateString?.() || 'N/A'}</td>
                    <td className='py-2 pr-4'>
                      {Array.isArray(it.images) && it.images.length > 0 ? (
                        <div className='grid grid-cols-4 gap-1 max-w-[180px]'>
                          {it.images.slice(0,4).map((src, idx) => (
                            <img key={idx} src={src} alt={`${it.cropName} ${idx+1}`} className='w-8 h-8 object-cover rounded border' />
                          ))}
                        </div>
                      ) : (
                        <span className='text-gray-400 text-xs'>No images</span>
                      )}
                    </td>
                    <td className='py-2'>
                      <span className='px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'>
                        SOLD
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Removed Items Table */}
      <div className='card mt-6'>
        <h3 className='text-xl font-semibold text-gray-800 mb-4'>Removed Items</h3>
        {loading ? (
          <div>Loading...</div>
        ) : items.filter(item => item.status === 'REMOVED').length === 0 ? (
          <div className='text-gray-500 text-sm'>No removed items.</div>
        ) : (
          <div className='overflow-x-auto border border-gray-200 rounded-lg p-4'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left border-b'>
                  <th className='py-2 pr-4'>Crop</th>
                  <th className='py-2 pr-4'>Price/kg</th>
                  <th className='py-2 pr-4'>Harvested</th>
                  <th className='py-2 pr-4'>Best before</th>
                  <th className='py-2 pr-4'>Images</th>
                  <th className='py-2'>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.filter(item => item.status === 'REMOVED').map(it => {
                  const bestBefore = (() => {
                    const days = Number(it.expireAfterDays)
                    if (!Number.isFinite(days) || days <= 0) return null
                    const d = new Date(it.harvestedAt)
                    d.setDate(d.getDate() + days)
                    return d
                  })()
                  return (
                  <tr key={it._id} className='border-b last:border-0 hover:bg-gray-50'>
                    <td className='py-2 pr-4'>{it.cropName}</td>
                    <td className='py-2 pr-4'>LKR {Number(it.pricePerKg).toFixed(2)}</td>
                    <td className='py-2 pr-4'>{new Date(it.harvestedAt).toLocaleDateString()}</td>
                    <td className='py-2 pr-4'>{bestBefore ? bestBefore.toLocaleDateString() : '—'}</td>
                    <td className='py-2 pr-4'>
                      {Array.isArray(it.images) && it.images.length > 0 ? (
                        <div className='grid grid-cols-4 gap-1 max-w-[180px]'>
                          {it.images.slice(0,4).map((src, idx) => (
                            <img key={idx} src={src} alt={'img'+idx} className='w-10 h-10 object-cover rounded' />
                          ))}
                        </div>
                      ) : (
                        <span className='text-gray-400'>No images</span>
                      )}
                    </td>
                    <td className='py-2'>
                      <span className='px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800'>REMOVED</span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-50'>
          <div className='card w-full max-w-lg relative max-h-[85vh] overflow-y-auto mx-4'>
            <button onClick={() => setShowForm(false)} className='absolute right-3 top-3 p-2 rounded-md hover:bg-gray-100'><X className='w-4 h-4' /></button>
            <h3 className='text-lg font-semibold mb-4'>Create new post</h3>
            <form onSubmit={handleCreate} className='space-y-4'>
              <div>
                <label className='form-label'>Crop Name</label>
                <input
                  className='input-field'
                  value={form.cropName}
                  onChange={e => {
                    const onlyAlphaNum = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '')
                    setForm({ ...form, cropName: onlyAlphaNum })
                  }}
                  inputMode='text'
                  pattern='[A-Za-z0-9 ]*'
                />
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='form-label'>Price per kg</label>
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    className='input-field'
                    value={form.pricePerKg}
                    onChange={e => {
                      const v = e.target.value
                      if (v === '') return setForm({ ...form, pricePerKg: '' })
                      const n = Number(v)
                      setForm({ ...form, pricePerKg: (isNaN(n) || n < 0) ? '0' : v })
                    }}
                    placeholder='0.00'
                  />
                </div>
                <div>
                  <label className='form-label'>Capacity (kg)</label>
                  <input
                    type='number'
                    min='0'
                    step='1'
                    className='input-field'
                    value={form.capacityKg}
                    onChange={e => {
                      const v = e.target.value
                      if (v === '') return setForm({ ...form, capacityKg: '' })
                      const n = Number(v)
                      setForm({ ...form, capacityKg: (isNaN(n) || n < 0) ? '0' : v })
                    }}
                    placeholder='0'
                  />
                </div>
              </div>
              <div>
                <label className='form-label'>Harvested date</label>
                <input
                  type='date'
                  className='input-field'
                  value={form.harvestedAt}
                  max={toInputDate(new Date())}
                  onChange={e => {
                    const v = e.target.value
                    const today = new Date()
                    const picked = v ? new Date(v) : null
                    if (picked && picked > new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                      // clamp to today
                      return setForm({ ...form, harvestedAt: toInputDate(new Date()) })
                    }
                    setForm({ ...form, harvestedAt: v })
                  }}
                />
              </div>
              <div>
                <label className='form-label'>Expire after (days)</label>
                <input
                  type='number'
                  min='1'
                  step='1'
                  className='input-field'
                  value={form.expireAfterDays}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '')
                    // Only allow values >= 1, or empty string for editing
                    if (v === '' || (Number(v) >= 1)) {
                      setForm({ ...form, expireAfterDays: v })
                    }
                  }}
                  placeholder='e.g., 21 for ~3 weeks'
                />
                <p className='text-xs text-gray-500 mt-1'>Enter the period until this produce expires (in days).</p>
              </div>
              <div>
                <label className='form-label'>Images (up to 4)</label>
                <input
                  type='file'
                  accept='image/*'
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 4)
                    
                    // Validate file size and type
                    const validFiles = files.filter(file => {
                      if (!file.type.startsWith('image/')) {
                        toast.error(`${file.name} is not a valid image file`)
                        return false
                      }
                      if (file.size > 5 * 1024 * 1024) { // 5MB limit
                        toast.error(`${file.name} is too large. Please select images under 5MB`)
                        return false
                      }
                      return true
                    })
                    
                    if (validFiles.length === 0) return
                    
                    const readers = validFiles.map(file => new Promise((resolve) => {
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
                {form.images?.length > 0 && (
                  <div className='mt-2 grid grid-cols-4 gap-2'>
                    {form.images.map((src, idx) => (
                      <img key={idx} src={src} alt={'img'+idx} className='w-full h-16 object-cover rounded-md border' />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className='form-label'>Details</label>
                <textarea rows={3} className='input-field' value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} />
              </div>
              <div className='flex justify-end gap-2'>
                <button type='button' onClick={() => setShowForm(false)} className='border px-4 py-2 rounded-lg'>Cancel</button>
                <button disabled={saving} className='btn-primary'>{saving ? 'Posting...' : 'Post'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {preview && editForm && (
        <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-50'>
          <div className='card w-full max-w-lg relative max-h-[85vh] overflow-y-auto mx-4 p-4 sm:p-5 text-sm'>
            <button onClick={() => { setPreview(null); setEditForm(null) }} className='absolute right-3 top-3 p-2 rounded-md hover:bg-gray-100'><X className='w-4 h-4' /></button>
            <h3 className='text-base font-semibold mb-3'>Edit listing</h3>
            <div className='space-y-3'>
              <div>
                <label className='form-label'>Crop Name</label>
                <input
                  className='input-field py-2 px-3 text-sm'
                  value={editForm.cropName}
                  onChange={(e) => {
                    const onlyAlphaNum = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '')
                    setEditForm({ ...editForm, cropName: onlyAlphaNum })
                  }}
                  inputMode='text'
                  pattern='[A-Za-z0-9 ]*'
                />
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                  <label className='form-label'>Price per kg</label>
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    className='input-field py-2 px-3 text-sm'
                    value={editForm.pricePerKg}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '') return setEditForm({ ...editForm, pricePerKg: '' })
                      const n = Number(v)
                      setEditForm({ ...editForm, pricePerKg: (isNaN(n) || n < 0) ? '0' : v })
                    }}
                    placeholder='0.00'
                  />
                </div>
                <div>
                  <label className='form-label'>Capacity (kg)</label>
                  <input
                    type='number'
                    min='0'
                    step='1'
                    className='input-field py-2 px-3 text-sm'
                    value={editForm.capacityKg}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '') return setEditForm({ ...editForm, capacityKg: '' })
                      const n = Number(v)
                      setEditForm({ ...editForm, capacityKg: (isNaN(n) || n < 0) ? '0' : v })
                    }}
                    placeholder='0'
                  />
                </div>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                  <label className='form-label'>Harvested date</label>
                  <input
                    type='date'
                    className='input-field py-2 px-3 text-sm'
                    value={editForm.harvestedAt}
                    max={toInputDate(new Date())}
                    onChange={(e) => {
                      const v = e.target.value
                      const today = new Date()
                      const picked = v ? new Date(v) : null
                      if (picked && picked > new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                        return setEditForm({ ...editForm, harvestedAt: toInputDate(new Date()) })
                      }
                      setEditForm({ ...editForm, harvestedAt: v })
                    }}
                  />
                </div>
                <div>
                  <label className='form-label'>Expire after (days)</label>
                  <input
                    type='number'
                    min='1'
                    step='1'
                    className='input-field py-2 px-3 text-sm'
                    value={editForm.expireAfterDays}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '')
                      // Only allow values >= 1, or empty string for editing
                      if (v === '' || (Number(v) >= 1)) {
                        setEditForm({ ...editForm, expireAfterDays: v })
                      }
                    }}
                    placeholder='e.g., 21'
                  />
                </div>
              </div>
              <div>
                <label className='form-label'>Status</label>
                <input className='input-field py-2 px-3 text-sm bg-gray-100' value={editForm.status} readOnly disabled />
              </div>
              <div>
                <label className='form-label'>Current images</label>
                {Array.isArray(preview.images) && preview.images.length > 0 ? (
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                    {preview.images.slice(0, 4).map((src, idx) => (
                      <img key={idx} src={src} alt={'img'+idx} className='w-full h-16 object-cover rounded-md border' />
                    ))}
                  </div>
                ) : (
                  <div className='text-sm text-gray-500'>No images</div>
                )}
              </div>
              <div>
                <label className='form-label'>Replace images (up to 4)</label>
                <input
                  type='file'
                  accept='image/*'
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 4)
                    
                    // Validate file size and type
                    const validFiles = files.filter(file => {
                      if (!file.type.startsWith('image/')) {
                        toast.error(`${file.name} is not a valid image file`)
                        return false
                      }
                      if (file.size > 5 * 1024 * 1024) { // 5MB limit
                        toast.error(`${file.name} is too large. Please select images under 5MB`)
                        return false
                      }
                      return true
                    })
                    
                    if (validFiles.length === 0) return
                    
                    const readers = validFiles.map(file => new Promise((resolve) => {
                      const reader = new FileReader()
                      reader.onload = () => resolve(reader.result)
                      reader.readAsDataURL(file)
                    }))
                    Promise.all(readers).then((results) => {
                      setEditForm(prev => ({ ...prev, images: results.slice(0, 4) }))
                    })
                  }}
                  className='block w-full text-sm'
                />
                {editForm.images?.length > 0 && (
                  <div className='mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2'>
                    {editForm.images.map((src, idx) => (
                      <img key={idx} src={src} alt={'new'+idx} className='w-full h-16 object-cover rounded-md border' />
                    ))}
                  </div>
                )}
                <div className='text-xs text-gray-500 mt-1'>If you select new images, they will replace the current images.</div>
              </div>
              <div>
                <label className='form-label'>Details</label>
                <textarea rows={3} className='input-field py-2 px-3 text-sm' value={editForm.details} onChange={(e) => setEditForm({ ...editForm, details: e.target.value })} />
              </div>
              <div className='flex justify-end'>
                <button
                  onClick={async () => {
                    try {
                      setSaving(true)
                      const payload = {
                        cropName: editForm.cropName,
                        pricePerKg: Number(editForm.pricePerKg),
                        capacityKg: Number(editForm.capacityKg),
                        details: editForm.details,
                        harvestedAt: editForm.harvestedAt,
                        expireAfterDays: editForm.expireAfterDays ? Number(editForm.expireAfterDays) : undefined,
                      }
                      if (Array.isArray(editForm.images) && editForm.images.length > 0) {
                        payload.images = editForm.images
                      }
                      const res = await axiosInstance.put(`/listings/${preview._id}`, payload)
                      setItems(items.map(i => i._id === res.data._id ? res.data : i))
                      toast.success('Listing updated')
                      setPreview(null)
                      setEditForm(null)
                    } catch (e) {
                      toast.error(e?.response?.data?.error?.message || 'Failed to update')
                    } finally {
                      setSaving(false)
                    }
                  }}
                  className='btn-primary py-2 px-4 text-sm'
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-50'>
          <div className='card w-full max-w-sm'>
            <h3 className='text-lg font-semibold mb-2'>Delete listing</h3>
            <p className='text-sm text-gray-600'>Are you sure you want to delete this listing?</p>
            <div className='mt-4 flex justify-end gap-2'>
              <button className='border px-4 py-2 rounded-lg' onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className='btn-primary bg-red-600 hover:bg-red-700' onClick={async () => {
                try {
                  await axiosInstance.delete(`/listings/${confirmDelete._id}`)
                  setItems(items.filter(i => i._id !== confirmDelete._id))
                  setConfirmDelete(null)
                  toast.success('Listing deleted')
                } catch (e) {
                  toast.error('Failed to delete')
                }
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {infoModal && (
        <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-50'>
          <div className='card w-full max-w-2xl relative max-h-[85vh] overflow-y-auto mx-4'>
            <button onClick={() => setInfoModal(null)} className='absolute right-3 top-3 p-2 rounded-md hover:bg-gray-100'><X className='w-4 h-4' /></button>
            <h3 className='text-lg font-semibold mb-4'>Listing Information</h3>
            <div className='space-y-4'>
              {/* Images */}
              {Array.isArray(infoModal.images) && infoModal.images.length > 0 && (
                <div>
                  <label className='form-label'>Images</label>
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                    {infoModal.images.map((src, idx) => (
                      <img key={idx} src={src} alt={'img'+idx} className='w-full h-24 object-cover rounded-md border' />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Basic Information */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='form-label'>Crop Name</label>
                  <div className='text-sm bg-gray-50 p-2 rounded border'>{infoModal.cropName}</div>
                </div>
                <div>
                  <label className='form-label'>Status</label>
                  <div className='text-sm bg-gray-50 p-2 rounded border'>{mapStatus(infoModal.status)}</div>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='form-label'>Price per kg</label>
                  <div className='text-sm bg-gray-50 p-2 rounded border'>LKR {Number(infoModal.pricePerKg).toFixed(2)}</div>
                </div>
                <div>
                  <label className='form-label'>Capacity (kg)</label>
                  <div className='text-sm bg-gray-50 p-2 rounded border'>{infoModal.capacityKg}</div>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='form-label'>Harvested Date</label>
                  <div className='text-sm bg-gray-50 p-2 rounded border'>{new Date(infoModal.harvestedAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <label className='form-label'>Expire after (days)</label>
                  <div className='text-sm bg-gray-50 p-2 rounded border'>{infoModal.expireAfterDays != null ? infoModal.expireAfterDays : '—'}</div>
                </div>
              </div>

              {infoModal.details && (
                <div>
                  <label className='form-label'>Details</label>
                  <div className='text-sm bg-gray-50 p-2 rounded border whitespace-pre-wrap'>{infoModal.details}</div>
                </div>
              )}

              {/* Additional Information */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='form-label'>Created</label>
                  <div className='text-sm bg-gray-50 p-2 rounded border'>{new Date(infoModal.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <label className='form-label'>Last Updated</label>
                  <div className='text-sm bg-gray-50 p-2 rounded border'>{new Date(infoModal.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className='flex justify-end gap-2 pt-4'>
                <button onClick={() => setInfoModal(null)} className='border px-4 py-2 rounded-lg'>Close</button>
                <button onClick={() => { setInfoModal(null); handleOpenEdit(infoModal); }} className='btn-primary'>Edit Listing</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyListings



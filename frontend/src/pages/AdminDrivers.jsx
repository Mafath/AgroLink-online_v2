import React, { useEffect, useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { axiosInstance } from '../lib/axios'
import { Info, Pencil, Trash2, Shield, Sprout, ShoppingCart, Truck, TrendingUp, Users, Plus, Eye, EyeOff } from 'lucide-react'
import DefaultAvatar from '../assets/User Avatar.jpg'
import toast from 'react-hot-toast'
import AdminSidebar from '../components/AdminSidebar'

const roles = ['Admin', 'Farmer', 'Buyer', 'Driver']
const statuses = ['Active', 'Suspended']

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
)

const LineChart = ({ categories = ['Jan','Feb','Mar','Apr','May','Jun'], series = [{ name: 'Signups', data: [20,28,22,30,26,40] }], color = '#22c55e' }) => (
  <Chart type='line' height={180} options={{
    chart:{toolbar:{show:false}},
    stroke:{width:3, curve:'smooth'},
    colors:[color],
    grid:{borderColor:'#eee'},
    xaxis:{categories, labels:{style:{colors:'#9ca3af'}}},
    yaxis:{labels:{style:{colors:'#9ca3af'}}},
    legend:{show:false}
  }} series={series} />
)

const DonutChart = ({ labels = ['Admin','Farmer','Buyer','Driver'], series = [5,45,40,10] }) => (
  <Chart key={Array.isArray(series) ? series.join(',') : 'static'} type='donut' height={220} options={{
    chart:{toolbar:{show:false}},
    labels,
    colors:['#8b5cf6', '#22c55e', '#3b82f6', '#f59e0b'],
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
              label:'Total',
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
  }} series={series} />
)

const BarChart = ({ categories = [], series = [] }) => (
  <Chart type='bar' height={260} options={{
    chart:{toolbar:{show:false}},
    plotOptions:{bar:{columnWidth:'60%', borderRadius:4}},
    colors:['#22c55e','#9ca3af'],
    grid:{borderColor:'#eee'},
    xaxis:{categories, labels:{style:{colors:'#9ca3af'}}},
    yaxis:{labels:{style:{colors:'#9ca3af'}}},
    legend:{show:true}
  }} series={series} />
)

const AdminDrivers = () => {
  const [query, setQuery] = useState({ role: 'Driver', status: '' , availability: '', service_area: ''})
  const [resp, setResp] = useState({ data: [] })
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', password: '', service_area: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState({ fullName: '', email: '', password: '', service_area: '' })
  const [formTouched, setFormTouched] = useState({ fullName: false, email: false, password: false, service_area: false })

  // Validation functions
  const validateFullName = (name) => {
    if (!name || !name.trim()) return 'Full name is required'
    if (name.trim().length < 2) return 'Full name must be at least 2 characters'
    if (name.trim().length > 50) return 'Full name must be less than 50 characters'
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) return 'Full name can only contain letters and spaces'
    return ''
  }

  const validateEmail = (email) => {
    if (!email || !email.trim()) return 'Email is required'
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address'
    return ''
  }

  const validatePassword = (password) => {
    if (!password) return 'Password is required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (password.length > 128) return 'Password must be less than 128 characters'
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter'
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter'
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number'
    if (!/(?=.*[@$!%*?&])/.test(password)) return 'Password must contain at least one special character (@$!%*?&)'
    return ''
  }

  const validateServiceArea = (area) => {
    if (!area || !area.trim()) return 'Service area is required'
    return ''
  }

  const validateAll = (form) => ({
    fullName: validateFullName(form.fullName),
    email: validateEmail(form.email),
    password: validatePassword(form.password),
    service_area: validateServiceArea(form.service_area)
  })

  const isFormValid = () => {
    const errors = validateAll(createForm)
    return !Object.values(errors).some(error => error !== '')
  }

  const handleFormFieldChange = (field, value) => {
    setCreateForm(prev => ({ ...prev, [field]: value }))
    
    // Validate the field immediately
    let error = ''
    switch (field) {
      case 'fullName':
        error = validateFullName(value)
        break
      case 'email':
        error = validateEmail(value)
        break
      case 'password':
        error = validatePassword(value)
        break
      case 'service_area':
        error = validateServiceArea(value)
        break
    }
    
    setFormErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleFormFieldBlur = (field) => {
    setFormTouched(prev => ({ ...prev, [field]: true }))
  }

  const resetForm = () => {
    setCreateForm({ fullName: '', email: '', password: '', service_area: '' })
    setFormErrors({ fullName: '', email: '', password: '', service_area: '' })
    setFormTouched({ fullName: false, email: false, password: false, service_area: false })
    setShowPassword(false)
  }

  const fetchDrivers = async () => {
    setLoading(true)
    try {
      const params = { ...query }
      Object.keys(params).forEach(k => params[k] === '' && delete params[k])
      const res = await axiosInstance.get('auth/admin/users', { params })
      setResp(res.data)
    } catch (e) {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDrivers() }, [query.role, query.status, query.availability, query.service_area])

  const items = resp.data
  const filteredItems = useMemo(() => {
    const search = (query.search || '').trim().toLowerCase()
    if (!search) return items
    return items.filter(u => {
      const name = (u.fullName || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      const role = (u.role || '').toLowerCase()
      return name.includes(search) || email.includes(search) || role.includes(search)
    })
  }, [items, query.search])

  const recentSignupsCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    return (Array.isArray(items) ? items : []).filter(u => {
      const t = new Date(u.createdAt || 0).getTime()
      return !Number.isNaN(t) && t >= cutoff
    }).length
  }, [items])

  const activeUsersCount = useMemo(() => {
    return (Array.isArray(items) ? items : []).filter(u => String(u.status).toUpperCase() === 'ACTIVE').length
  }, [items])
  const suspendedUsersCount = useMemo(() => {
    return (Array.isArray(items) ? items : []).filter(u => String(u.status).toUpperCase() === 'SUSPENDED').length
  }, [items])
  const availableDriversCount = useMemo(() => {
    return (Array.isArray(items) ? items : []).filter(u => String(u.availability || 'UNAVAILABLE').toUpperCase() === 'AVAILABLE').length
  }, [items])
  const unavailableDriversCount = useMemo(() => {
    return (Array.isArray(items) ? items : []).filter(u => String(u.availability || 'UNAVAILABLE').toUpperCase() !== 'AVAILABLE').length
  }, [items])
  const userGrowth = useMemo(() => {
    const now = new Date()
    const buckets = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, label: d.toLocaleDateString(undefined,{ month:'short', day:'numeric' }), year: d.getFullYear(), month: d.getMonth(), date: d.getDate(), count: 0 })
    }
    for (const u of (Array.isArray(items) ? items : [])) {
      const t = new Date(u.createdAt||0)
      if (!isNaN(t.getTime())) {
        const key = `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`
        const bucket = buckets.find(b => b.key === key)
        if (bucket) bucket.count += 1
      }
    }
    return {
      categories: buckets.map(b => b.label),
      data: buckets.map(b => b.count),
    }
  }, [items])

  const roleCounts = useMemo(() => {
    const counts = { ADMIN: 0, FARMER: 0, BUYER: 0, DRIVER: 0 }
    for (const u of (Array.isArray(items) ? items : [])) {
      const r = String(u.role || '').toUpperCase()
      if (counts[r] != null) counts[r] += 1
    }
    return counts
  }, [items])

  const serviceAreaData = useMemo(() => {
    const provinces = ['Northern','North Central','North Western','Western','Central','Sabaragamuwa','Eastern','Uva','Southern']
    const available = Object.fromEntries(provinces.map(p => [p, 0]))
    const unavailable = Object.fromEntries(provinces.map(p => [p, 0]))
    for (const u of (Array.isArray(items) ? items : [])) {
      if (String(u.role || '').toUpperCase() !== 'DRIVER') continue
      const p = typeof u.service_area === 'string' && u.service_area.trim() ? u.service_area.trim() : null
      if (!p || available[p] == null) continue
      const isAvail = String(u.availability || 'UNAVAILABLE').toUpperCase() === 'AVAILABLE'
      if (isAvail) available[p] += 1; else unavailable[p] += 1
    }
    const categories = provinces
    const series = [
      { name: 'Available', data: categories.map(p => available[p]) },
      { name: 'Unavailable', data: categories.map(p => unavailable[p]) },
    ]
    return { categories, series }
  }, [items])

  function formatRelativeTime(input) {
    if (!input) return '—';
    const time = new Date(input).getTime();
    if (Number.isNaN(time)) return '—';
    const diffMs = Date.now() - time;
    if (diffMs < 0) return '—';
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return new Date(input).toLocaleDateString();
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-semibold ml-2'>Driver Management</h1>
          <div />
        </div>

        <div className='grid grid-cols-[240px,1fr] gap-6'>
          {/* Sidebar */}
          <AdminSidebar activePage="drivers" />

        {/* Main content */}
        <div className='space-y-6'>
          {/* Table */}
          <div className='grid grid-cols-4 gap-6'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 col-span-4'>
            <div className='px-4 py-3 border-b border-gray-100 grid grid-cols-3 items-center gap-3'>
              <div>
                <div className='text-md font-medium text-gray-700'>Drivers</div>
              </div>
              <div className='flex justify-center'>
                <div />
              </div>
              <div className='flex items-center justify-end gap-3'>
                <div className='relative hidden sm:block'>
                  <input className='bg-white border border-gray-200 rounded-full h-9 pl-3 pr-3 w-56 text-sm outline-none' placeholder='Search' value={query.search || ''} onChange={e => setQuery(q => ({ ...q, search: e.target.value }))} />
                </div>
                <select className='input-field h-9 py-1 text-sm hidden sm:block rounded-full w-56' value={query.status} onChange={e => setQuery(q => ({ ...q, status: e.target.value }))}>
                  <option value=''>Any Status</option>
                  {statuses.map(s => {
                    const val = s.toUpperCase();
                    const label = s;
                    return (<option key={val} value={val}>{label}</option>)
                  })}
                </select>
                <select className='input-field h-9 py-1 text-sm hidden sm:block rounded-full w-56' value={query.service_area || ''} onChange={e => setQuery(q => ({ ...q, service_area: e.target.value }))}>
                  <option value=''>Any Service Area</option>
                  <option value='Northern'>Northern</option>
                  <option value='North Central'>North Central</option>
                  <option value='North Western'>North Western</option>
                  <option value='Western'>Western</option>
                  <option value='Central'>Central</option>
                  <option value='Sabaragamuwa'>Sabaragamuwa</option>
                  <option value='Eastern'>Eastern</option>
                  <option value='Uva'>Uva</option>
                  <option value='Southern'>Southern</option>
                </select>
                <select className='input-field h-9 py-1 text-sm hidden sm:block rounded-full w-56' value={query.availability || ''} onChange={e => setQuery(q => ({ ...q, availability: e.target.value }))}>
                  <option value=''>Any Availability</option>
                  <option value='AVAILABLE'>Available</option>
                  <option value='UNAVAILABLE'>Unavailable</option>
                </select>
                <button
                  className='btn-primary h-9 px-5 rounded-full text-[13px] font-medium shadow-sm inline-flex items-center justify-center gap-1.5 hover:opacity-95 active:opacity-90 focus:ring-2 focus:ring-green-300 whitespace-nowrap'
                  onClick={() => setCreating(true)}
                >
                  <Plus className='w-3.5 h-3.5' />
                  Add Driver
                </button>
              </div>
            </div>

            <div className='max-h-[240px] overflow-y-auto'>
              <table className='min-w-full text-sm'>
                <thead className='sticky top-0 bg-gray-100 z-10 rounded-t-lg'>
                  <tr className='text-center text-gray-500 border-b align-middle h-12'>
                    <th className='py-3 px-3 rounded-tl-lg pl-3 text-center align-middle'>Profile</th>
                    <th className='py-3 pl-8 pr-3 text-left align-middle'>Contact</th>
                    <th className='py-3 px-3 text-center align-middle'>Service Area</th>
                    <th className='py-3 px-3 text-center align-middle'>Availability</th>
                    <th className='py-3 px-3 text-center align-middle'>Status</th>
                    <th className='py-3 px-3 rounded-tr-xl text-center align-middle'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className='py-6 text-center text-gray-500' colSpan={6}>Loading…</td>
                    </tr>
                      ) : filteredItems.length === 0 ? (
                        <tr><td className='py-6 text-center text-gray-500' colSpan={6}>No drivers</td></tr>
                      ) : filteredItems.map(u => (
                    <tr key={u._id} className='border-t align-middle'>
                    <td className='py-2 px-3 text-left align-middle'>
                        <div className='flex items-center justify-start gap-2'>
                          <img
                            src={u.profilePic || DefaultAvatar}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DefaultAvatar; }}
                            className='w-8 h-8 rounded-full object-cover block'
                            alt='avatar'
                          />
                          <span className='text-sm font-medium'>{u.fullName || '—'}</span>
                        </div>
                      </td>
                     <td className='py-2 pl-8 pr-3 text-left align-middle'>
                        <div>{u.email}</div>
                        {u.phone && <div className='text-xs text-gray-500'>{u.phone}</div>}
                      </td>
                    <td className='py-2 px-3 text-center align-middle'>
                      {u.service_area || '—'}
                    </td>
                    <td className='py-2 px-3 text-center align-middle'>
                      <span className={`inline-flex items-center justify-center h-6 px-2 text-xs ${String(u.availability||'AVAILABLE').toUpperCase() === 'AVAILABLE' ? 'bg-green-100 text-green-700 rounded-full' : 'bg-gray-100 text-gray-700 rounded-full'}`}>{(u.availability||'AVAILABLE').charAt(0) + String(u.availability||'AVAILABLE').slice(1).toLowerCase()}</span>
                    </td>
                    <td className='py-2 px-3 text-center align-middle'>
                      <span className={`inline-flex items-center justify-center h-6 px-2 text-xs ${u.status === 'ACTIVE' ? 'bg-yellow-100 text-yellow-700 rounded-full' : 'bg-red-100 text-red-700 rounded-full'}`}>{u.status && u.status.charAt(0) + u.status.slice(1).toLowerCase()}</span>
                      </td>
                    <td className='py-2 px-3 text-center align-middle'>
                        <div className='flex items-center justify-center gap-2'>
                        <button className='icon-btn bg-green-100 text-green-700 px-3 py-1 rounded-xl inline-flex items-center gap-1 text-xs' onClick={() => setSelected(u)} title='Info'>
                          <Info className='w-3 h-3' />
                          <span className='text-xs'>Info</span>
                        </button>
                        <button className='icon-btn bg-blue-100 text-blue-700 px-3 py-1 rounded-xl inline-flex items-center gap-1 text-xs' onClick={() => setSelected(u)} title='Edit'>
                          <Pencil className='w-3 h-3' />
                          <span className='text-xs'>Edit</span>
                        </button>
                        <button className='icon-btn bg-red-100 text-red-700 px-3 py-1 rounded-xl inline-flex items-center gap-1 text-xs' onClick={async () => { if (confirm('Delete driver?')) { await axiosInstance.delete(`auth/admin/users/${u._id}`); fetchDrivers(); }}} title='Delete'>
                          <Trash2 className='w-3 h-3' />
                          <span className='text-xs'>Delete</span>
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
               </table>
             </div>
            </div>
          </div>

            {/* Top cards row: 1-1-2 */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                    <div>
                    <div className='text-sm text-gray-600'>Drivers Availability</div>
                    <div className='text-2xl font-semibold mt-1'>{availableDriversCount.toLocaleString()} <span className='text-green-600 text-xs align-middle'>available</span></div>
                    <div className='mt-2 text-sm text-gray-700'>Unavailable: <span className='font-semibold'>{unavailableDriversCount.toLocaleString()}</span></div>
                  </div>
                  <div className='w-24 h-24 bg-green-100 rounded-lg grid place-items-center'>
                    <Truck className='w-12 h-12 text-green-600' />
                  </div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-gray-600'>Total Active Drivers</div>
                    <div className='text-2xl font-semibold mt-1'>{activeUsersCount.toLocaleString()} <span className='text-green-600 text-xs align-middle'>total</span></div>
                    <div className='mt-3 text-xs text-gray-600'>Current status</div>
                  </div>
                  <div className='w-24 h-24 bg-violet-100 rounded-lg grid place-items-center'>
                    <Users className='w-12 h-12 text-violet-600' />
                  </div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                    <div>
                    <div className='text-sm text-gray-600'>Suspended Drivers</div>
                    <div className='text-2xl font-semibold mt-1'>{suspendedUsersCount.toLocaleString()} <span className='text-rose-600 text-xs align-middle'>total</span></div>
                    <div className='mt-3'>
                      <span className='text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full'>Current</span>
                    </div>
                  </div>
                  <div className='w-24 h-24 bg-rose-100 rounded-lg grid place-items-center'>
                    <Users className='w-12 h-12 text-rose-600' />
                  </div>
                </div>
              </Card>
            </div>

            

            {/* Drivers by Service Area */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-4'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Drivers by Service Area</div>
                  <div className='rounded-lg border border-dashed'>
                    <BarChart categories={serviceAreaData.categories} series={serviceAreaData.series} />
                  </div>
                </div>
              </Card>
            </div>

          </div>
        </div>

      </div>

      {/* Create Driver modal */}
      {creating && (
        <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-md p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-semibold'>Add Driver</h2>
              <button onClick={() => setCreating(false)} className='text-gray-500'>Close</button>
            </div>
            <div className='space-y-3'>
              <div>
                <label className='text-xs text-gray-500'>Full Name *</label>
                <input 
                  className={`input-field mt-1 w-full ${formTouched.fullName && formErrors.fullName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  value={createForm.fullName} 
                  onChange={e => handleFormFieldChange('fullName', e.target.value)}
                  onBlur={() => handleFormFieldBlur('fullName')}
                  placeholder='John Doe' 
                />
                {formTouched.fullName && formErrors.fullName && (
                  <p className='mt-1 text-xs text-red-600'>{formErrors.fullName}</p>
                )}
              </div>
              <div>
                <label className='text-xs text-gray-500'>Email *</label>
                <input 
                  className={`input-field mt-1 w-full ${formTouched.email && formErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  type='email' 
                  value={createForm.email} 
                  onChange={e => handleFormFieldChange('email', e.target.value)}
                  onBlur={() => handleFormFieldBlur('email')}
                  placeholder='driver@example.com' 
                />
                {formTouched.email && formErrors.email && (
                  <p className='mt-1 text-xs text-red-600'>{formErrors.email}</p>
                )}
              </div>
              <div>
                <label className='text-xs text-gray-500'>Password *</label>
                <div className='relative'>
                  <input
                    className={`input-field mt-1 w-full pr-10 ${formTouched.password && formErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    type={showPassword ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={e => handleFormFieldChange('password', e.target.value)}
                    onBlur={() => handleFormFieldBlur('password')}
                    placeholder='Enter a strong password'
                  />
                  <button
                    type='button'
                    className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </div>
                {formTouched.password && formErrors.password && (
                  <p className='mt-1 text-xs text-red-600'>{formErrors.password}</p>
                )}
                {!formTouched.password && (
                  <p className='mt-1 text-xs text-gray-500'>Must contain uppercase, lowercase, number, and special character</p>
                )}
              </div>
              <div>
                <label className='text-xs text-gray-500'>Service Area *</label>
                <select 
                  className={`input-field mt-1 w-full ${formTouched.service_area && formErrors.service_area ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  value={createForm.service_area} 
                  onChange={e => handleFormFieldChange('service_area', e.target.value)}
                  onBlur={() => handleFormFieldBlur('service_area')}
                >
                  <option value=''>Select a province</option>
                  <option value='Northern'>Northern</option>
                  <option value='North Central'>North Central</option>
                  <option value='North Western'>North Western</option>
                  <option value='Western'>Western</option>
                  <option value='Central'>Central</option>
                  <option value='Sabaragamuwa'>Sabaragamuwa</option>
                  <option value='Eastern'>Eastern</option>
                  <option value='Uva'>Uva</option>
                  <option value='Southern'>Southern</option>
                </select>
                {formTouched.service_area && formErrors.service_area && (
                  <p className='mt-1 text-xs text-red-600'>{formErrors.service_area}</p>
                )}
              </div>
              <div className='flex items-center justify-end gap-2 pt-2'>
                <button 
                  type='button'
                  className='border px-3 py-2 rounded-md hover:bg-gray-50' 
                  onClick={() => {
                    setCreating(false)
                    resetForm()
                  }}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className={`px-3.5 h-9 rounded-full text-[13px] font-medium inline-flex items-center justify-center ${
                    isFormValid() 
                      ? 'btn-primary' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!isFormValid()}
                  onClick={async () => {
                    // Mark all fields as touched to show any remaining errors
                    setFormTouched({ fullName: true, email: true, password: true, service_area: true })
                    
                    if (!isFormValid()) {
                      return
                    }

                    try {
                      const payload = { 
                        ...createForm, 
                        role: 'DRIVER', 
                        availability: 'UNAVAILABLE',
                        fullName: createForm.fullName.trim(),
                        email: createForm.email.trim().toLowerCase()
                      };
                      const response = await axiosInstance.post('auth/admin/users', payload);
                      setCreating(false);
                      resetForm();
                      fetchDrivers();
                      toast.success('Driver account added successfully');
                    } catch (error) {
                      const errorMessage = error?.response?.data?.error?.message || 'Failed to create driver account. Please try again.';
                      toast.error(errorMessage);
                      console.error('Error creating driver:', error);
                    }
                  }}
                >
                  Create Driver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details modal */}
      {selected && (
        <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-3xl p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-semibold'>Driver Details</h2>
              <button onClick={() => setSelected(null)} className='text-gray-500'>Close</button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Left: profile */}
              <div className='space-y-2'>
                <div className='flex items-center gap-3'>
                  <img
                    src={selected.profilePic || DefaultAvatar}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DefaultAvatar; }}
                    className='w-12 h-12 rounded-full object-cover'
                    alt='avatar'
                  />
                  <div>
                    <div className='font-medium'>{selected.fullName || '—'}</div>
                    <div className='text-xs text-gray-500'>{selected.role}</div>
                  </div>
                </div>
                <div className='text-sm'>Email: {selected.email}</div>
                {selected.phone && <div className='text-sm'>Phone: {selected.phone}</div>}
                <div className='text-sm text-gray-500'>Member since {new Date(selected.createdAt).toLocaleDateString()}</div>
              </div>
              {/* Right: actions */}
              <div className='space-y-3'>
                <div>
                  <label className='text-xs text-gray-500'>Service Area</label>
                  <select
                    className='input-field mt-1'
                    value={selected.service_area || ''}
                    onChange={async (e) => {
                      const service_area = e.target.value
                      try {
                        await axiosInstance.put(`auth/admin/users/${selected._id}`, { service_area })
                        fetchDrivers()
                        setSelected(s => ({ ...s, service_area }))
                      } catch (_) { /* silent */ }
                    }}
                  >
                    <option value=''>Select a province</option>
                    <option value='Northern'>Northern</option>
                    <option value='North Central'>North Central</option>
                    <option value='North Western'>North Western</option>
                    <option value='Western'>Western</option>
                    <option value='Central'>Central</option>
                    <option value='Sabaragamuwa'>Sabaragamuwa</option>
                    <option value='Eastern'>Eastern</option>
                    <option value='Uva'>Uva</option>
                    <option value='Southern'>Southern</option>
                  </select>
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  {selected.status === 'ACTIVE' ? (
                    <button className='border px-3 py-2 rounded-md' onClick={async () => { await axiosInstance.put(`auth/admin/users/${selected._id}`, { status: 'SUSPENDED' }); fetchDrivers(); setSelected(s => ({ ...s, status: 'SUSPENDED' })); }}>Suspend</button>
                  ) : (
                    <button className='btn-primary' onClick={async () => { await axiosInstance.put(`auth/admin/users/${selected._id}`, { status: 'ACTIVE' }); fetchDrivers(); setSelected(s => ({ ...s, status: 'ACTIVE' })); }}>Activate</button>
                  )}
                </div>
              </div>
        </div>
      </div>
        </div>
      )}
    </div>
  )
}

export default AdminDrivers

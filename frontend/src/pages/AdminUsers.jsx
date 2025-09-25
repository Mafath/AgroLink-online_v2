import React, { useEffect, useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { axiosInstance } from '../lib/axios'
import { Info, Pencil, Trash2, Shield, Sprout, ShoppingCart, Truck, TrendingUp, Users } from 'lucide-react'
import DefaultAvatar from '../assets/User Avatar.jpg'
import AdminSidebar from '../components/AdminSidebar'

const roles = ['Admin', 'Farmer', 'Buyer', 'Driver']
const statuses = ['Active', 'Suspended']
// removed verification fields

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

const BarChart = () => (
  <Chart type='bar' height={180} options={{
    chart:{toolbar:{show:false}},
    plotOptions:{bar:{columnWidth:'40%', borderRadius:4}},
    colors:['#22c55e','#9ca3af'],
    grid:{borderColor:'#eee'},
    xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun'], labels:{style:{colors:'#9ca3af'}}},
    yaxis:{labels:{style:{colors:'#9ca3af'}}},
    legend:{show:false}
  }} series={[{name:'Active', data:[14,22,18,26,20,30]},{name:'Suspended', data:[2,3,4,2,3,2]}]} />
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

const Sparkline = () => (
  <Chart type='line' height={90} options={{
    chart:{sparkline:{enabled:true}, toolbar:{show:false}},
    stroke:{width:3, curve:'smooth'},
    colors:['#22c55e'],
  }} series={[{data:[10,14,12,18,16,24,20,30]}]} />
)

const AdminUsers = () => {
  const [query, setQuery] = useState({ role: '', status: '' })
  const [resp, setResp] = useState({ data: [] })
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  const fetchUsers = async () => {
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

  useEffect(() => { fetchUsers() }, [query.role, query.status])

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
  const userGrowth = useMemo(() => {
    // last 7 days including today
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


  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

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
          <h1 className='text-3xl font-semibold ml-2'>User & Role Management</h1>
          <div />
        </div>

        <div className='grid grid-cols-[240px,1fr] gap-6'>
          {/* Sidebar */}
          <AdminSidebar activePage="users" />

        {/* Main content */}
        <div className='space-y-6'>
          {/* Table */}
          <div className='grid grid-cols-4 gap-6'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 col-span-4'>
            <div className='px-4 py-3 border-b border-gray-100 grid grid-cols-3 items-center gap-3'>
              <div>
                <div className='text-md font-medium text-gray-700'>Users</div>
              </div>
              <div className='flex justify-center'>
                <div className='relative hidden sm:block'>
                  <input className='bg-white border border-gray-200 rounded-full h-9 pl-3 pr-3 w-56 text-sm outline-none' placeholder='Search' value={query.search || ''} onChange={e => setQuery(q => ({ ...q, search: e.target.value }))} />
                </div>
              </div>
              <div className='flex items-center justify-end gap-3'>
                <select className='input-field h-9 py-1 text-sm hidden sm:block rounded-full w-36' value={query.role} onChange={e => setQuery(q => ({ ...q, role: e.target.value }))}>
                  <option value=''>All Roles</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select className='input-field h-9 py-1 text-sm hidden sm:block rounded-full w-36' value={query.status} onChange={e => setQuery(q => ({ ...q, status: e.target.value }))}>
                  <option value=''>Any Status</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className='max-h-[240px] overflow-y-auto'>
              <table className='min-w-full text-sm'>
                <thead className='sticky top-0 bg-gray-100 z-10 rounded-t-lg'>
                  <tr className='text-center text-gray-500 border-b align-middle h-12'>
                    <th className='py-3 px-3 rounded-tl-lg pl-3 text-center align-middle'>Profile</th>
                    <th className='py-3 pr-8 pl-6 text-center align-middle'>Role</th>
                    <th className='py-3 pl-8 pr-3 text-left align-middle'>Contact</th>
                    <th className='py-3 px-3 text-center align-middle'>Joined</th>
                    <th className='py-3 px-3 text-center align-middle'>Last login</th>
                    <th className='py-3 px-3 text-center align-middle'>Status</th>
                    <th className='py-3 px-3 rounded-tr-xl text-center align-middle'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className='py-6 text-center text-gray-500' colSpan={7}>Loading…</td>
                    </tr>
                      ) : filteredItems.length === 0 ? (
                        <tr><td className='py-6 text-center text-gray-500' colSpan={7}>No users</td></tr>
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
                     <td className='py-2 pr-8 pl-6 text-center align-middle'>
                       <span className='inline-flex items-center justify-center gap-1'>
                         {u.role === 'ADMIN' ? (
                           <Shield className='w-3.5 h-3.5 text-violet-600' />
                         ) : u.role === 'FARMER' ? (
                           <Sprout className='w-3.5 h-3.5 text-green-600' />
                         ) : u.role === 'BUYER' ? (
                           <ShoppingCart className='w-3.5 h-3.5 text-blue-600' />
                         ) : (
                           <Truck className='w-3.5 h-3.5 text-amber-600' />
                         )}
                         {capitalizeFirst(u.role)}
                       </span>
                     </td>
                     <td className='py-2 pl-8 pr-3 text-left align-middle'>
                        <div>{u.email}</div>
                        {u.phone && <div className='text-xs text-gray-500'>{u.phone}</div>}
                      </td>
                    <td className='py-2 px-3 text-center align-middle'>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className='py-2 px-3 text-center align-middle'>
                      {formatRelativeTime(u.lastLogin || u.createdAt)}
                    </td>
                    <td className='py-2 px-3 text-center align-middle'>
                      <span className={`px-2 py-0.5 text-xs ${u.status === 'ACTIVE' ? 'bg-yellow-100 text-yellow-700 rounded-full' : 'bg-red-100 text-red-700 rounded-full'}`}>{capitalizeFirst(u.status)}</span>
                      </td>
                    <td className='py-2 px-3 flex items-center justify-center gap-3 mt-2 align-middle'>
                        <button className='icon-btn bg-green-100 text-green-700 px-3 py-1 rounded-xl inline-flex items-center gap-1 text-xs' onClick={() => setSelected(u)} title='Info'>
                          <Info className='w-3 h-3' />
                          <span className='text-xs'>Info</span>
                        </button>
                        <button className='icon-btn bg-blue-100 text-blue-700 px-3 py-1 rounded-xl inline-flex items-center gap-1 text-xs' onClick={() => setSelected(u)} title='Edit'>
                          <Pencil className='w-3 h-3' />
                          <span className='text-xs'>Edit</span>
                        </button>
                        <button className='icon-btn bg-red-100 text-red-700 px-3 py-1 rounded-xl inline-flex items-center gap-1 text-xs' onClick={async () => { if (confirm('Delete user?')) { await axiosInstance.delete(`auth/admin/users/${u._id}`); fetchUsers(); }}} title='Delete'>
                          <Trash2 className='w-3 h-3' />
                          <span className='text-xs'>Delete</span>
                        </button>
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
                    <div className='text-sm text-gray-600'>New Signups</div>
                    <div className='text-2xl font-semibold mt-1'>{recentSignupsCount.toLocaleString()} <span className='text-green-600 text-xs align-middle'>last 24h</span></div>
                    <div className='mt-3'>
                      <span className='text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full'>Rolling 24 hours</span>
                    </div>
                  </div>
                  <div className='w-24 h-24 bg-violet-100 rounded-lg grid place-items-center'>
                    <TrendingUp className='w-12 h-12 text-violet-600' />
                  </div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-gray-600'>Total Active Users</div>
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
                    <div className='text-sm text-gray-600'>Suspended Users</div>
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

            {/* Middle cards: 1-1-2 */}
            <div className='grid grid-cols-4 gap-6'>
               <Card className='col-span-2'><div className='p-4'><div className='text-sm text-gray-700 font-medium mb-2'>User Growth</div><div className='rounded-lg border border-dashed'><LineChart categories={userGrowth.categories} series={[{ name: 'Users', data: userGrowth.data }]} color={'#22c55e'} /></div></div></Card>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Role Distribution</div>
                    <div className='grid grid-cols-[1fr,240px] gap-4'>
                    <div className='grid place-items-center'>
                      <div className='rounded-lg border border-dashed w-full max-w-[220px] relative'>
                        <DonutChart labels={['Admin','Farmer','Buyer','Driver']} series={[roleCounts.ADMIN, roleCounts.FARMER, roleCounts.BUYER, roleCounts.DRIVER]} />
                        <div className='absolute inset-0 grid place-items-center pointer-events-none'>
                          <div className='text-center'>
                            <div className='text-xs text-gray-500'>Total users</div>
                            <div className='text-lg font-semibold'>{filteredItems.length.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='text-sm'>
                      <div className='flex items-center gap-3 mb-3'>
                        <span className='w-9 h-9 rounded-lg bg-violet-100 grid place-items-center text-violet-600'>👥</span>
                        <div>
                          <div className='text-xs text-gray-500'>Total Users</div>
                          <div className='font-semibold text-base'>{filteredItems.length}</div>
                        </div>
                      </div>
                      <div className='border-t border-gray-200 my-3'></div>
                      <div className='grid grid-cols-2 gap-x-8 gap-y-4'>
                        <div>
                          <div className='flex items-center gap-2 text-gray-700'><span className='w-2 h-2 rounded-full' style={{backgroundColor:'#8b5cf6'}}></span>Admin</div>
                          <div className='text-xs text-gray-500 mt-0.5'>{roleCounts.ADMIN.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className='flex items-center gap-2 text-gray-700'><span className='w-2 h-2 rounded-full' style={{backgroundColor:'#22c55e'}}></span>Farmer</div>
                          <div className='text-xs text-gray-500 mt-0.5'>{roleCounts.FARMER.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className='flex items-center gap-2 text-gray-700'><span className='w-2 h-2 rounded-full' style={{backgroundColor:'#3b82f6'}}></span>Buyer</div>
                          <div className='text-xs text-gray-500 mt-0.5'>{roleCounts.BUYER.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className='flex items-center gap-2 text-gray-700'><span className='w-2 h-2 rounded-full' style={{backgroundColor:'#f59e0b'}}></span>Driver</div>
                          <div className='text-xs text-gray-500 mt-0.5'>{roleCounts.DRIVER.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            

            

          </div>
        </div>

      </div>

      {/* Details modal */}
      {selected && (
        <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-3xl p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-semibold'>User Details</h2>
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
                {/* Removed verification actions */}
                <div>
                  <label className='text-xs text-gray-500'>Change Role</label>
                  <select className='input-field mt-1' value={selected.role} onChange={async (e) => { const role = e.target.value; await axiosInstance.put(`auth/admin/users/${selected._id}`, { role }); fetchUsers(); setSelected(s => ({ ...s, role })); }}>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  {selected.status === 'ACTIVE' ? (
                    <button className='border px-3 py-2 rounded-md' onClick={async () => { await axiosInstance.put(`auth/admin/users/${selected._id}`, { status: 'SUSPENDED' }); fetchUsers(); setSelected(s => ({ ...s, status: 'SUSPENDED' })); }}>Suspend</button>
                  ) : (
                    <button className='btn-primary' onClick={async () => { await axiosInstance.put(`auth/admin/users/${selected._id}`, { status: 'ACTIVE' }); fetchUsers(); setSelected(s => ({ ...s, status: 'ACTIVE' })); }}>Activate</button>
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

export default AdminUsers



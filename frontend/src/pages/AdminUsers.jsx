import React, { useEffect, useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { axiosInstance } from '../lib/axios'
import { Info, Pencil, Trash2, Shield, Sprout, ShoppingCart, Truck, TrendingUp, Users, UserCheck, FileDown, XCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import DefaultAvatar from '../assets/User Avatar.jpg'
import AdminSidebar from '../components/AdminSidebar'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import logoImg from '../assets/AgroLink_logo3-removebg-preview.png'

const roles = ['Admin', 'Farmer', 'Buyer', 'Driver', 'Agronomist']
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

const DonutChart = ({ labels = ['Admin','Farmer','Buyer','Driver','Agronomist'], series = [5,45,40,10,5] }) => (
  <Chart key={Array.isArray(series) ? series.join(',') : 'static'} type='donut' height={220} options={{
    chart:{toolbar:{show:false}},
    labels,
    colors:['#8b5cf6', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
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
  const [viewingUser, setViewingUser] = useState(null)
  const [statsItems, setStatsItems] = useState([])
  const [formErrors, setFormErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false)

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

  // Validation functions (from signup page)
  const validateFullName = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return "Full name is required";
    if (trimmed.length < 3) return "Full name must be at least 3 characters";
    if (!/^[A-Za-z ]+$/.test(trimmed)) return "Use letters and spaces only";
    return "";
  };

  const validateEmail = (email) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return "Email is required";
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(normalized)) return "Enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password is weak";
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    
    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      return "Password is weak";
    }
    
    return "";
  };

  useEffect(() => { fetchUsers() }, [query.role, query.status])

  // Keep stats source in sync with table by default
  useEffect(() => {
    setStatsItems(Array.isArray(resp.data) ? resp.data : [])
  }, [resp.data])

  const items = resp.data
  const statsBase = statsItems
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
    return (Array.isArray(statsBase) ? statsBase : []).filter(u => {
      const t = new Date(u.createdAt || 0).getTime()
      return !Number.isNaN(t) && t >= cutoff
    }).length
  }, [statsBase])

  const activeUsersCount = useMemo(() => {
    return (Array.isArray(statsBase) ? statsBase : []).filter(u => String(u.status).toUpperCase() === 'ACTIVE').length
  }, [statsBase])
  const suspendedUsersCount = useMemo(() => {
    return (Array.isArray(statsBase) ? statsBase : []).filter(u => String(u.status).toUpperCase() === 'SUSPENDED').length
  }, [statsBase])
  const userGrowth = useMemo(() => {
    // last 7 days including today
    const now = new Date()
    const buckets = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, label: d.toLocaleDateString(undefined,{ month:'short', day:'numeric' }), year: d.getFullYear(), month: d.getMonth(), date: d.getDate(), count: 0 })
    }
    for (const u of (Array.isArray(statsBase) ? statsBase : [])) {
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
  }, [statsBase])

  const roleCounts = useMemo(() => {
    const counts = { ADMIN: 0, FARMER: 0, BUYER: 0, DRIVER: 0, AGRONOMIST: 0 }
    for (const u of (Array.isArray(statsBase) ? statsBase : [])) {
      const r = String(u.role || '').toUpperCase()
      if (counts[r] != null) counts[r] += 1
    }
    return counts
  }, [statsBase])


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

  const downloadUsersPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Top green and black bar (3/4 green, 1/4 black)
      pdf.setFillColor(13, 126, 121); // Primary green (#0d7e79)
      pdf.rect(0, 0, 157.5, 8, 'F'); // 3/4 of 210mm = 157.5mm
      
      pdf.setFillColor(0, 0, 0); // Black
      pdf.rect(157.5, 0, 52.5, 8, 'F'); // 1/4 of 210mm = 52.5mm
      
      // Add space below top bar
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 8, 210, 5, 'F'); // 5mm white space
      
      // Main content area (white background)
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 13, 210, 25, 'F');
      
      // Add the actual AgroLink logo using html2canvas
      try {
        // Create a temporary div with the logo maintaining aspect ratio
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '60px';
        tempDiv.style.height = '60px';
        tempDiv.style.display = 'flex';
        tempDiv.style.alignItems = 'center';
        tempDiv.style.justifyContent = 'center';
        tempDiv.innerHTML = `<img src="${logoImg}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />`;
        document.body.appendChild(tempDiv);
        
        // Capture the logo with html2canvas
        const canvas = await html2canvas(tempDiv, {
          width: 60,
          height: 60,
          backgroundColor: null,
          scale: 2 // Higher resolution
        });
        
        // Remove the temporary div
        document.body.removeChild(tempDiv);
        
        // Add the logo to PDF with correct aspect ratio (bigger size)
        const logoDataURL = canvas.toDataURL('image/png');
        pdf.addImage(logoDataURL, 'PNG', 15, 13, 16, 16); // Adjusted for space below top bar
      } catch (error) {
        console.log('Could not load logo, using text fallback');
        // Fallback: just show company name if logo fails to load
      }
      
      // Company name with gradient effect (left to right like navbar)
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      
      // Create gradient effect by interpolating colors from left to right
      const startColor = { r: 0, g: 128, b: 111 }; // #00806F (darker teal)
      const endColor = { r: 139, g: 195, b: 75 }; // #8BC34B (lighter yellow-green)
      const text = 'AgroLink';
      const startX = 35;
      
      // Custom letter positions for better spacing
      const letterPositions = [0, 4, 7.5, 9.5, 12.8, 16.7, 18.3, 21.5]; // A-g-r-o-L-i-n-k
      
      for (let i = 0; i < text.length; i++) {
        const progress = i / (text.length - 1); // 0 to 1
        
        // Interpolate colors
        const r = Math.round(startColor.r + (endColor.r - startColor.r) * progress);
        const g = Math.round(startColor.g + (endColor.g - startColor.g) * progress);
        const b = Math.round(startColor.b + (endColor.b - startColor.b) * progress);
        
        pdf.setTextColor(r, g, b);
        pdf.text(text[i], startX + letterPositions[i], 23); // Adjusted for space below top bar
      }
      
      // Tagline
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Agricultural Technology Solutions', 35, 27); // Adjusted for space below top bar
      
      // Vertical separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(120, 17, 120, 33); // Adjusted for space below top bar
      
      // Contact information on the right
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Phone:', 130, 21); // Adjusted for space below top bar
      pdf.setFont('helvetica', 'normal');
      pdf.text('+94 71 920 7688', 145, 21);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Web:', 130, 25);
      pdf.setFont('helvetica', 'normal');
      pdf.text('www.AgroLink.org', 145, 25);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Address:', 130, 29);
      pdf.setFont('helvetica', 'normal');
      pdf.text('States Rd, Colombo 04, Sri Lanka', 145, 29);
      
      // Bottom line separator
      pdf.setDrawColor(13, 126, 121); // Primary green
      pdf.setLineWidth(1);
      pdf.line(20, 40, 190, 40); // Adjusted for space below top bar
      
      // Reset text color for content
      pdf.setTextColor(0, 0, 0);
      
      // Add report title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Users & Roles Management Report', 20, 55); // Adjusted for space below top bar
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 63); // Adjusted for space below top bar
      
      // Add summary stats
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary Statistics:', 20, 70);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Users: ${filteredItems.length}`, 20, 80);
      pdf.text(`Active Users: ${activeUsersCount}`, 20, 85);
      pdf.text(`Suspended Users: ${suspendedUsersCount}`, 20, 90);
      pdf.text(`Recent Signups (24h): ${recentSignupsCount}`, 20, 95);
      
      // Add role distribution
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Role Distribution:', 20, 110);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let yPos = 120;
      Object.entries(roleCounts).forEach(([role, count]) => {
        pdf.text(`${role}: ${count}`, 20, yPos);
        yPos += 5;
      });
      
      // Add user details table
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('User Details:', 20, yPos + 10);
      
      // Table headers with black background
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      let tableY = yPos + 20;
      
      // Draw primary green background for header row
      pdf.setFillColor(13, 126, 121); // Primary green background
      pdf.rect(20, tableY - 6, 170, 12, 'F'); // Rectangle covering header row (increased height)
      
      // Set white text color for headers
      pdf.setTextColor(255, 255, 255); // White text
      pdf.text('Name', 25, tableY);
      pdf.text('Email', 50, tableY); // Moved closer to name column
      pdf.text('Role', 110, tableY); // Adjusted position
      pdf.text('Status', 140, tableY); // Adjusted position
      pdf.text('Joined', 170, tableY); // Adjusted position
      
      // Reset text color for data rows
      pdf.setTextColor(0, 0, 0); // Black text
      
      // Table data
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10); // Increased font size for data rows
      tableY += 10; // Increased spacing
      
      filteredItems.slice(0, 20).forEach((user, index) => {
        if (tableY > 260) { // Reduced from 280 to add more margin above footer
          pdf.addPage();
          tableY = 20;
        }
        
        // Add alternating backgrounds for all rows
        if (index % 2 === 0) {
          pdf.setFillColor(240, 240, 240); // Light gray background for even rows
        } else {
          pdf.setFillColor(255, 255, 255); // White background for odd rows
        }
        pdf.rect(20, tableY - 6, 170, 12, 'F'); // Rectangle covering row (increased height)
        
        pdf.text(user.fullName || '—', 25, tableY);
        pdf.text(user.email || '—', 50, tableY); // Moved closer to name column
        pdf.text(user.role || '—', 110, tableY); // Adjusted position
        pdf.text(user.status || '—', 140, tableY); // Adjusted position
        pdf.text(user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—', 170, tableY); // Adjusted position
        
        tableY += 12; // Increased spacing
      });
      
      // Add footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Footer line
        pdf.setDrawColor(13, 126, 121); // Primary green
        pdf.setLineWidth(1);
        pdf.line(20, 270, 190, 270); // Moved up from 280 to 270
        
        // Footer text
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text('AgroLink - Agricultural Technology Solutions', 20, 275); // Moved up from 285 to 275
        pdf.text(`Page ${i} of ${pageCount}`, 160, 275); // Moved up from 285 to 275
        pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 280); // Moved up from 290 to 280
      }
      
      // Save the PDF
      pdf.save(`AgroLink-Users-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-semibold ml-2'>User & Role Management</h1>
          <div className='flex items-center gap-2'>
            <button onClick={downloadUsersPDF} className='inline-flex items-center gap-2 px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-900 transition-colors' title='Export PDF'>
              <FileDown className='w-4 h-4' />
              Export
            </button>
          </div>
        </div>

        <div className='grid grid-cols-[240px,1fr] gap-6'>
          {/* Sidebar */}
          <AdminSidebar activePage="users" />

        {/* Main content */}
        <div className='space-y-6'>
          {/* Table */}
          <div className='grid grid-cols-4 gap-6'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 col-span-4'>
            <div className='px-4 py-3 border-b border-gray-100 grid grid-cols-3 items-center gap-2'>
              <div>
                <div className='text-md font-medium text-gray-700'>Users</div>
              </div>
              <div className='flex justify-center'>
                <div className='relative hidden sm:block'>
                  <input className='bg-white border border-gray-200 rounded-full h-9 pl-3 pr-3 w-56 text-sm outline-none' placeholder='Search' value={query.search || ''} onChange={e => setQuery(q => ({ ...q, search: e.target.value }))} />
                </div>
              </div>
              <div className='flex items-center justify-end gap-2'>
                <select className='input-field h-9 py-1 text-sm hidden sm:block rounded-full w-32' value={query.role} onChange={e => setQuery(q => ({ ...q, role: e.target.value }))}>
                  <option value=''>All Roles</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select className='input-field h-9 py-1 text-sm hidden sm:block rounded-full w-32' value={query.status} onChange={e => setQuery(q => ({ ...q, status: e.target.value }))}>
                  <option value=''>Any Status</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  onClick={() => {
                    setSelected({ _id: null, fullName: '', email: '', password: '', role: 'ADMIN', status: 'ACTIVE' })
                    setFormErrors({})
                    setTouched({})
                    setShowPassword(false)
                    setIsCreatingAdmin(false)
                  }}
                  className='inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-black transition-colors whitespace-nowrap'
                  title='Add Admin'
                >
                  Add Admin +
                </button>
              </div>
            </div>

            <div className='h-[61vh] overflow-y-auto'>
              <table className='min-w-full text-sm'>
                <thead className='sticky top-0 bg-gray-100 z-10 rounded-t-lg'>
                  <tr className='text-center text-gray-500 border-b align-middle h-12'>
                    <th className='py-3 px-3 rounded-tl-lg pl-3 text-center align-middle font-normal'>Profile</th>
                    <th className='py-3 pr-8 pl-6 text-center align-middle font-normal'>Role</th>
                    <th className='py-3 pl-8 pr-3 text-left align-middle font-normal'>Contact</th>
                    <th className='py-3 px-3 text-center align-middle font-normal'>Joined</th>
                    <th className='py-3 px-3 text-center align-middle font-normal'>Last login</th>
                    <th className='py-3 px-3 text-center align-middle font-normal'>Status</th>
                    <th className='py-3 px-3 rounded-tr-xl text-center align-middle font-normal'>Actions</th>
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
                    <td className='py-3 px-3 text-left align-middle'>
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
                     <td className='py-3 pr-8 pl-6 text-center align-middle'>
                       <span className='inline-flex items-center justify-center gap-1'>
                         {u.role === 'ADMIN' ? (
                           <Shield className='w-3.5 h-3.5 text-violet-600' />
                         ) : u.role === 'FARMER' ? (
                           <Sprout className='w-3.5 h-3.5 text-green-600' />
                         ) : u.role === 'BUYER' ? (
                           <ShoppingCart className='w-3.5 h-3.5 text-blue-600' />
                         ) : u.role === 'DRIVER' ? (
                           <Truck className='w-3.5 h-3.5 text-amber-600' />
                         ) : (
                           <UserCheck className='w-3.5 h-3.5 text-red-600' />
                         )}
                         {capitalizeFirst(u.role)}
                       </span>
                     </td>
                     <td className='py-3 pl-8 pr-3 text-left align-middle'>
                        <div>{u.email}</div>
                        {u.phone && <div className='text-xs text-gray-500'>{u.phone}</div>}
                      </td>
                    <td className='py-3 px-3 text-center align-middle'>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className='py-3 px-3 text-center align-middle'>
                      {formatRelativeTime(u.lastLogin || u.createdAt)}
                    </td>
                    <td className='py-3 px-3 text-center align-middle'>
                      <span className={`px-2 py-0.5 text-xs ${u.status === 'ACTIVE' ? 'bg-yellow-100 text-yellow-700 rounded-full' : 'bg-red-100 text-red-700 rounded-full'}`}>{capitalizeFirst(u.status)}</span>
                      </td>
                    <td className='py-3 px-3 flex items-center justify-center gap-3 mt-2 align-middle'>
                        <button className='icon-btn bg-green-100 text-green-700 px-3 py-1 rounded-xl inline-flex items-center gap-1 text-xs' onClick={() => setViewingUser(u)} title='Info'>
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

            {/* Top cards row: 1-1-1-1 */}
            <div className='grid grid-cols-4 gap-6 items-start'>
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
            <div className='grid grid-cols-4 gap-6 items-start'>
               <Card className='col-span-2'><div className='p-4'><div className='text-sm text-gray-700 font-medium mb-2'>User Growth</div><div className='rounded-lg border border-dashed'><LineChart categories={userGrowth.categories} series={[{ name: 'Users', data: userGrowth.data }]} color={'#22c55e'} /></div></div></Card>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Role Distribution</div>
                    <div className='grid grid-cols-[1fr,240px] gap-4'>
                    <div className='grid place-items-center'>
                      <div className='rounded-lg border border-dashed w-full max-w-[220px] relative'>
                        <DonutChart labels={['Admin','Farmer','Buyer','Driver','Agronomist']} series={[roleCounts.ADMIN, roleCounts.FARMER, roleCounts.BUYER, roleCounts.DRIVER, roleCounts.AGRONOMIST]} />
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
                        <div>
                          <div className='flex items-center gap-2 text-gray-700'><span className='w-2 h-2 rounded-full' style={{backgroundColor:'#ef4444'}}></span>Agronomist</div>
                          <div className='text-xs text-gray-500 mt-0.5'>{roleCounts.AGRONOMIST.toLocaleString()}</div>
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
              <h2 className='text-lg font-semibold'>{selected._id ? 'User Details' : 'Add Admin'}</h2>
              <button onClick={() => setSelected(null)} className='text-gray-500'>Close</button>
            </div>
            {selected._id ? (
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
                {/* Right: view only info */}
                <div className='space-y-3'>
                  <div>
                    <label className='text-xs text-gray-500'>User Role</label>
                    <div className='input-field mt-1 bg-gray-50 text-gray-700 cursor-not-allowed'>
                      {selected.role}
                    </div>
                  </div>
              <div className='grid grid-cols-2 gap-2 mt-4'>
                    {selected.status === 'ACTIVE' ? (
                      <button className='border px-3 py-2 rounded-md' onClick={async () => { await axiosInstance.put(`auth/admin/users/${selected._id}`, { status: 'SUSPENDED' }); fetchUsers(); setSelected(s => ({ ...s, status: 'SUSPENDED' })); }}>Suspend</button>
                    ) : (
                      <button className='btn-primary' onClick={async () => { await axiosInstance.put(`auth/admin/users/${selected._id}`, { status: 'ACTIVE' }); fetchUsers(); setSelected(s => ({ ...s, status: 'ACTIVE' })); }}>Activate</button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-3'>
                  <div>
                    <label className='text-xs text-gray-500'>Full name</label>
                    <input 
                      className='input-field mt-1' 
                      placeholder='Admin name' 
                      value={selected.fullName} 
                      onChange={e => {
                        const value = e.target.value.replace(/[^A-Za-z ]/g, '');
                        setSelected(s => ({ ...s, fullName: value }));
                      }}
                      onBlur={() => {
                        setTouched(prev => ({ ...prev, fullName: true }));
                        setFormErrors(prev => ({ ...prev, fullName: validateFullName(selected.fullName) }));
                      }}
                    />
                    {touched.fullName && formErrors.fullName && (
                      <p className='text-xs text-red-600 mt-1'>{formErrors.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Email</label>
                    <input 
                      className='input-field mt-1' 
                      placeholder='email@company.com' 
                      type='email' 
                      value={selected.email} 
                      onChange={e => setSelected(s => ({ ...s, email: e.target.value }))}
                      onBlur={() => {
                        setTouched(prev => ({ ...prev, email: true }));
                        setFormErrors(prev => ({ ...prev, email: validateEmail(selected.email) }));
                      }}
                    />
                    {touched.email && formErrors.email && (
                      <p className='text-xs text-red-600 mt-1'>{formErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Password</label>
                    <div className='relative'>
                      <input 
                        className='input-field mt-1 pr-10' 
                        placeholder='Password' 
                        type={showPassword ? 'text' : 'password'} 
                        value={selected.password || ''} 
                        onChange={e => setSelected(s => ({ ...s, password: e.target.value }))}
                        onBlur={() => {
                          setTouched(prev => ({ ...prev, password: true }));
                          setFormErrors(prev => ({ ...prev, password: validatePassword(selected.password || '') }));
                        }}
                      />
                      <button
                        type="button"
                        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {touched.password && formErrors.password && (
                      <p className='text-xs text-red-600 mt-1'>{formErrors.password}</p>
                    )}
                  </div>
                </div>
                <div className='space-y-3'>
                  <div>
                    <label className='text-xs text-gray-500'>Role</label>
                    <select className='input-field mt-1' value={selected.role} onChange={e=>setSelected(s=>({ ...s, role: e.target.value }))}>
                      <option value='ADMIN'>ADMIN</option>
                    </select>
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Status</label>
                    <select className='input-field mt-1' value={selected.status} onChange={e=>setSelected(s=>({ ...s, status: e.target.value }))}>
                      <option value='ACTIVE'>ACTIVE</option>
                      <option value='SUSPENDED'>SUSPENDED</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className='pt-4 flex justify-end'>
                <button 
                  className={`px-4 py-2 rounded-md text-white transition-all duration-200 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${
                    isCreatingAdmin 
                      ? 'bg-gray-600 scale-95' 
                      : 'bg-black hover:bg-gray-900 hover:scale-105 active:scale-95 disabled:opacity-50'
                  }`}
                  onClick={async ()=>{
                    // Validate all fields
                    const fullNameError = validateFullName(selected.fullName);
                    const emailError = validateEmail(selected.email);
                    const passwordError = validatePassword(selected.password || '');
                    
                    setFormErrors({
                      fullName: fullNameError,
                      email: emailError,
                      password: passwordError
                    });
                    
                    setTouched({
                      fullName: true,
                      email: true,
                      password: true
                    });
                    
                    // Stop if there are validation errors
                    if (fullNameError || emailError || passwordError) {
                      return;
                    }
                    
                    setIsCreatingAdmin(true);
                    
                    try {
                      const payload = { 
                        fullName: selected.fullName, 
                        email: selected.email, 
                        password: selected.password, 
                        role: 'ADMIN', 
                        status: selected.status 
                      }
                      await axiosInstance.post('auth/admin/users', payload)
                      setSelected(null)
                      setFormErrors({})
                      setTouched({})
                      setShowPassword(false)
                      fetchUsers()
                    } catch (error) {
                      console.error('Error creating admin:', error)
                      console.error('Error response:', error.response?.data)
                      console.error('Error status:', error.response?.status)
                      alert(`Failed to create admin: ${error.response?.data?.error?.message || error.message}`)
                    } finally {
                      setIsCreatingAdmin(false);
                    }
                  }}
                  disabled={
                    isCreatingAdmin ||
                    !selected.fullName || 
                    !selected.email || 
                    !selected.password ||
                    validateFullName(selected.fullName) ||
                    validateEmail(selected.email) ||
                    validatePassword(selected.password || '')
                  }
                >
                  {isCreatingAdmin ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Admin'
                  )}
                </button>
              </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* User Info Modal (View Only) */}
      {viewingUser && (
        <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-2xl p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-semibold text-gray-900'>User Information</h2>
              <button onClick={() => setViewingUser(null)} className='text-gray-500 hover:text-gray-700'>
                <XCircle className='w-5 h-5' />
              </button>
            </div>
            
            <div className='space-y-6'>
              {/* Profile Section */}
              <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
                <img
                  src={viewingUser.profilePic || DefaultAvatar}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DefaultAvatar; }}
                  className='w-16 h-16 rounded-full object-cover border-2 border-gray-200'
                  alt='User Avatar'
                />
                <div>
                  <h3 className='text-lg font-medium text-gray-900'>{viewingUser.fullName || 'No name provided'}</h3>
                  <p className='text-sm text-gray-600'>{viewingUser.role}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                    viewingUser.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {viewingUser.status}
                  </span>
                </div>
              </div>

              {/* User Details */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Email Address</label>
                    <p className='text-sm text-gray-900 bg-gray-50 p-2 rounded border'>{viewingUser.email}</p>
                  </div>
                  
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Phone Number</label>
                    <p className='text-sm text-gray-900 bg-gray-50 p-2 rounded border'>
                      {viewingUser.phone || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Address</label>
                    <p className='text-sm text-gray-900 bg-gray-50 p-2 rounded border'>
                      {viewingUser.address || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Account Created</label>
                    <p className='text-sm text-gray-900 bg-gray-50 p-2 rounded border'>
                      {new Date(viewingUser.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Last Login</label>
                    <p className='text-sm text-gray-900 bg-gray-50 p-2 rounded border'>
                      {viewingUser.lastLogin 
                        ? new Date(viewingUser.lastLogin).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Never logged in'
                      }
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Email Verified</label>
                    <p className={`text-sm p-2 rounded border ${
                      viewingUser.isEmailVerified 
                        ? 'text-green-700 bg-green-50' 
                        : 'text-red-700 bg-red-50'
                    }`}>
                      {viewingUser.isEmailVerified ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio Section (if available) */}
              {viewingUser.bio && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Bio</label>
                  <p className='text-sm text-gray-900 bg-gray-50 p-3 rounded border'>
                    {viewingUser.bio}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className='flex justify-end gap-3 pt-4 border-t'>
                <button 
                  onClick={() => setViewingUser(null)}
                  className='px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors'
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setSelected(viewingUser)
                    setViewingUser(null)
                  }}
                  className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
                >
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers



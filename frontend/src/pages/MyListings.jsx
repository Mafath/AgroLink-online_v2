import React, { useEffect, useState } from 'react'
import { axiosInstance } from '../lib/axios'
import { Plus, X, Edit, Trash2, Info, ArrowLeft, FileDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import logoImg from '../assets/AgroLink_logo3-removebg-preview.png'

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

  const clearForm = () => {
    setForm({ cropName: '', pricePerKg: '', capacityKg: '', details: '', harvestedAt: '', expireAfterDays: '', images: [] })
  }

  const downloadMyListingsPDF = async () => {
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
        // Create a temporary div with the logo
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
        // Fallback to text logo
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255); // White text
        pdf.text('AgroLink', 20, 20);
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
      pdf.text('Email:', 130, 17); // Adjusted for space below top bar
      pdf.setFont('helvetica', 'normal');
      pdf.text('info@agrolink.org', 145, 17);
      
      pdf.setFont('helvetica', 'bold');
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
      pdf.text('My Listings Report', 20, 55); // Adjusted for space below top bar
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 63); // Adjusted for space below top bar
      
      // Add summary stats
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary Statistics:', 20, 75);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const totalListings = items.length;
      const availableListings = items.filter(item => item.status === 'AVAILABLE').length;
      const soldListings = items.filter(item => item.status === 'SOLD').length;
      const totalValue = items.reduce((sum, item) => sum + (Number(item.pricePerKg || 0) * Number(item.capacityKg || 0)), 0);
      
      pdf.text(`Total Listings: ${totalListings}`, 20, 85);
      pdf.text(`Available Listings: ${availableListings}`, 20, 90);
      pdf.text(`Sold Listings: ${soldListings}`, 20, 95);
      pdf.text(`Total Value: LKR ${totalValue.toLocaleString()}`, 20, 100);
      
      // Helper function to create a table
      const createTable = (title, items, startY) => {
        let tableY = startY;
        
        // Table title
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(title, 20, tableY);
        tableY += 8;
        
        if (items.length === 0) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          pdf.text('No items found', 20, tableY);
          return tableY + 15;
        }
        
        // Table headers
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        
        // Draw primary green background for header row
        pdf.setFillColor(13, 126, 121); // Primary green background
        pdf.rect(20, tableY - 5, 170, 10, 'F'); // Rectangle covering header row
        
        // Set white text color for headers
        pdf.setTextColor(255, 255, 255); // White text
        pdf.text('Crop Name', 20, tableY);
        pdf.text('Price/Kg', 60, tableY);
        pdf.text('Capacity', 100, tableY);
        pdf.text('Harvested', 130, tableY);
        pdf.text('Created', 160, tableY);
        
        // Reset text color for data rows
        pdf.setTextColor(0, 0, 0); // Black text
        tableY += 10;
        
        // Table data
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        items.forEach((item, index) => {
          if (tableY > 260) {
            pdf.addPage();
            tableY = 20;
          }
          
          // Add alternating backgrounds for all rows
          if (index % 2 === 0) {
            pdf.setFillColor(240, 240, 240); // Light gray background for even rows
          } else {
            pdf.setFillColor(255, 255, 255); // White background for odd rows
          }
          pdf.rect(20, tableY - 5, 170, 10, 'F'); // Rectangle covering row
          
          pdf.text(item.cropName || '—', 20, tableY);
          pdf.text(`LKR ${Number(item.pricePerKg || 0).toLocaleString()}`, 60, tableY);
          pdf.text(`${item.capacityKg} Kg`, 100, tableY);
          pdf.text(item.harvestedAt ? new Date(item.harvestedAt).toLocaleDateString() : '—', 130, tableY);
          pdf.text(item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—', 160, tableY);
          
          tableY += 12;
        });
        
        return tableY + 10; // Add some space after table
      };
      
      // Separate items by status
      const availableItems = items.filter(item => item.status === 'AVAILABLE');
      const soldItems = items.filter(item => item.status === 'SOLD');
      const removedItems = items.filter(item => item.status === 'REMOVED');
      
      let currentY = 115;
      
      // Create tables for each status
      currentY = createTable('Available Listings', availableItems, currentY);
      currentY = createTable('Sold Items', soldItems, currentY);
      currentY = createTable('Removed Items', removedItems, currentY);
      
      // Add footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Footer line
        pdf.setDrawColor(13, 126, 121); // Primary green
        pdf.setLineWidth(1);
        pdf.line(20, 280, 190, 280);
        
        // Footer text
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text('AgroLink - Agricultural Technology Solutions', 20, 285);
        pdf.text(`Page ${i} of ${pageCount}`, 160, 285);
        pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 290);
      }
      
      // Save the PDF
      pdf.save(`My-Listings-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF. Please try again.');
    }
  };

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
      <div className='flex items-center justify-end mb-4 gap-2'>
        <button onClick={() => setShowForm(true)} className='btn-primary flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm'>
          <Plus className='w-3.5 h-3.5' /> Add new post
        </button>
        <button 
          onClick={downloadMyListingsPDF} 
          className='inline-flex items-center gap-2 px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-900 transition-colors' 
          title='Export PDF'
        >
          <FileDown className='w-4 h-4' />
          Export
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
        <h3 className='text-xl font-semibold text-gray-800 mb-1'>Removed Items</h3>
        <p className='text-red-500 text-sm mb-4'>*These listings were automatically removed after passing their expiry date</p>
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
            <button onClick={() => { setShowForm(false); clearForm(); }} className='absolute right-3 top-3 p-2 rounded-md hover:bg-gray-100'><X className='w-4 h-4' /></button>
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
                    onKeyDown={(e) => {
                      // Prevent minus sign, plus sign, and 'e' from being typed
                      if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault()
                      }
                    }}
                    onChange={e => {
                      const v = e.target.value
                      // Remove any minus signs and only allow positive numbers or empty string
                      const cleanValue = v.replace(/[^0-9.]/g, '')
                      if (cleanValue === '' || (Number(cleanValue) >= 0)) {
                        setForm({ ...form, pricePerKg: cleanValue })
                      }
                    }}
                    placeholder='0.00'
                  />
                  {(() => {
                    const base = Number(form.pricePerKg || 0)
                    const rate = 0.05 // backend COMMISSION_RATE; duplicated for display only
                    const final = Math.round((base * (1 + rate)) * 100 + Number.EPSILON) / 100
                    return (
                      <div className='mt-1 text-xs text-gray-600'>
                        Buyers will see: <span className='font-semibold'>LKR {isNaN(final) ? '0.00' : final.toFixed(2)}</span> (includes {Math.round(rate*100)}% commission paid by buyers)
                      </div>
                    )
                  })()}
                </div>
                <div>
                  <label className='form-label'>Capacity (kg)</label>
                  <input
                    type='number'
                    min='0'
                    step='1'
                    className='input-field'
                    value={form.capacityKg}
                    onKeyDown={(e) => {
                      // Prevent minus sign, plus sign, decimal point, and 'e' from being typed
                      if (e.key === '-' || e.key === '+' || e.key === '.' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault()
                      }
                    }}
                    onChange={e => {
                      const v = e.target.value
                      // Remove any non-numeric characters and only allow positive integers or empty string
                      const cleanValue = v.replace(/[^0-9]/g, '')
                      if (cleanValue === '' || (Number(cleanValue) >= 0)) {
                        setForm({ ...form, capacityKg: cleanValue })
                      }
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
                  min={toInputDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))}
                  onChange={e => {
                    const v = e.target.value
                    const today = new Date()
                    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    const picked = v ? new Date(v) : null
                    
                    if (picked && picked > new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                      // clamp to today if future date
                      return setForm({ ...form, harvestedAt: toInputDate(new Date()) })
                    }
                    if (picked && picked < oneMonthAgo) {
                      // clamp to one month ago if too old
                      return setForm({ ...form, harvestedAt: toInputDate(oneMonthAgo) })
                    }
                    setForm({ ...form, harvestedAt: v })
                  }}
                />
                <p className='text-xs text-gray-500 mt-1'>Select a date within the last 30 days.</p>
              </div>
              <div>
                <label className='form-label'>Expire after (days)</label>
                <input
                  type='number'
                  min='1'
                  step='1'
                  className='input-field'
                  value={form.expireAfterDays}
                  onKeyDown={(e) => {
                    // Prevent minus sign, decimal point, plus sign, and 'e' from being typed
                    if (e.key === '-' || e.key === '+' || e.key === '.' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault()
                    }
                    // Prevent arrow keys from going below 0
                    if (e.key === 'ArrowDown' && (form.expireAfterDays === '' || Number(form.expireAfterDays) <= 1)) {
                      e.preventDefault()
                    }
                  }}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, '') // Remove all non-numeric characters
                    // Only allow values >= 1, or empty string for editing
                    if (v === '' || (Number(v) >= 1)) {
                      setForm({ ...form, expireAfterDays: v })
                    }
                  }}
                  placeholder='e.g., 21 for ~3 weeks'
                />
                <p className='text-xs text-gray-500 mt-1'>Enter the period until this produce expires (in days). Minimum 1 day.</p>
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
                <button type='button' onClick={() => { setShowForm(false); clearForm(); }} className='border px-4 py-2 rounded-lg'>Cancel</button>
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
                    onKeyDown={(e) => {
                      // Prevent minus sign, plus sign, and 'e' from being typed
                      if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault()
                      }
                    }}
                    onChange={(e) => {
                      const v = e.target.value
                      // Remove any minus signs and only allow positive numbers or empty string
                      const cleanValue = v.replace(/[^0-9.]/g, '')
                      if (cleanValue === '' || (Number(cleanValue) >= 0)) {
                        setEditForm({ ...editForm, pricePerKg: cleanValue })
                      }
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
                    onKeyDown={(e) => {
                      // Prevent minus sign, plus sign, decimal point, and 'e' from being typed
                      if (e.key === '-' || e.key === '+' || e.key === '.' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault()
                      }
                    }}
                    onChange={(e) => {
                      const v = e.target.value
                      // Remove any non-numeric characters and only allow positive integers or empty string
                      const cleanValue = v.replace(/[^0-9]/g, '')
                      if (cleanValue === '' || (Number(cleanValue) >= 0)) {
                        setEditForm({ ...editForm, capacityKg: cleanValue })
                      }
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
                    min={toInputDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))}
                    onChange={(e) => {
                      const v = e.target.value
                      const today = new Date()
                      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      const picked = v ? new Date(v) : null
                      
                      if (picked && picked > new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                        // clamp to today if future date
                        return setEditForm({ ...editForm, harvestedAt: toInputDate(new Date()) })
                      }
                      if (picked && picked < oneMonthAgo) {
                        // clamp to one month ago if too old
                        return setEditForm({ ...editForm, harvestedAt: toInputDate(oneMonthAgo) })
                      }
                      setEditForm({ ...editForm, harvestedAt: v })
                    }}
                  />
                  <p className='text-xs text-gray-500 mt-1'>Select a date within the last 30 days.</p>
                </div>
                <div>
                  <label className='form-label'>Expire after (days)</label>
                  <input
                    type='number'
                    min='1'
                    step='1'
                    className='input-field py-2 px-3 text-sm'
                    value={editForm.expireAfterDays}
                    onKeyDown={(e) => {
                      // Prevent minus sign, decimal point, plus sign, and 'e' from being typed
                      if (e.key === '-' || e.key === '+' || e.key === '.' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault()
                      }
                      // Prevent arrow keys from going below 0
                      if (e.key === 'ArrowDown' && (editForm.expireAfterDays === '' || Number(editForm.expireAfterDays) <= 1)) {
                        e.preventDefault()
                      }
                    }}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '') // Remove all non-numeric characters
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



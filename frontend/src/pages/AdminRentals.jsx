import React, { useEffect, useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { axiosInstance } from '../lib/axios'
import { Info, Pencil, Trash2, Package, DollarSign, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import logoImg from '../assets/AgroLink_logo3-removebg-preview.png'
import AdminSidebar from '../components/AdminSidebar'

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
)

// Charts used in AdminInventory replicated here
const LineChart = () => (
  <Chart type='line' height={180} options={{ chart:{toolbar:{show:false}}, stroke:{width:3, curve:'smooth'}, colors:['#22c55e'], grid:{borderColor:'#eee'}, xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun'], labels:{style:{colors:'#9ca3af'}}}, yaxis:{labels:{style:{colors:'#9ca3af'}}}, legend:{show:false} }} series={[{name:'Sales', data:[20,28,22,30,26,40]}]} />
)
const BarChart = () => (
  <Chart type='bar' height={180} options={{ chart:{toolbar:{show:false}}, plotOptions:{bar:{columnWidth:'40%', borderRadius:4}}, colors:['#22c55e','#9ca3af'], grid:{borderColor:'#eee'}, xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun'], labels:{style:{colors:'#9ca3af'}}}, yaxis:{labels:{style:{colors:'#9ca3af'}}}, legend:{show:false} }} series={[{name:'Earning', data:[14,22,18,26,20,30]},{name:'Expense', data:[10,14,12,16,12,18]}]} />
)
const DonutChart = () => (
  <Chart type='donut' height={220} options={{ chart:{toolbar:{show:false}}, labels:['Apparel','Electronics','FMCG','Other'], colors:['#a78bfa','#8b5cf6','#c4b5fd','#ddd6fe'], legend:{show:false}, dataLabels:{enabled:false} }} series={[30,25,15,30]} />
)
const Sparkline = () => (
  <Chart type='line' height={90} options={{ chart:{sparkline:{enabled:true}, toolbar:{show:false}}, stroke:{width:3, curve:'smooth'}, colors:['#22c55e'], }} series={[{data:[10,14,12,18,16,24,20,30]}]} />
)

const AdminRentals = () => {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [rentalForm, setRentalForm] = useState({ productName: '', description: '', rentalPerDay: '', images: [], totalQty: '' })
  const [rentalItems, setRentalItems] = useState([])
  const [isLoadingRentals, setIsLoadingRentals] = useState(false)
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState('newest')
  const filteredRentals = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = rentalItems
    if (q) {
      list = list.filter(it => {
        const name = (it.productName||'').toLowerCase()
        const desc = (it.description||'').toLowerCase()
        return name.includes(q) || desc.includes(q)
      })
    }
    const arr = [...list]
    arr.sort((a,b)=>{
      const timeA = new Date(a.createdAt||0).getTime()
      const timeB = new Date(b.createdAt||0).getTime()
      const priceA = Number(a.rentalPerDay||0)
      const priceB = Number(b.rentalPerDay||0)
      switch (sortMode) {
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
  }, [rentalItems, search, sortMode])
  const [viewItem, setViewItem] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

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

  const handleSubmitRental = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        productName: rentalForm.productName,
        description: rentalForm.description,
        rentalPerDay: Number(rentalForm.rentalPerDay),
        images: rentalForm.images,
        totalQty: Number(rentalForm.totalQty),
      }
      await axiosInstance.post('rentals', payload)
      setIsAddOpen(false)
      setRentalForm({ productName: '', description: '', rentalPerDay: '', images: [], totalQty: '' })
      loadRentals()
    } catch (err) {
      // handle error later; keep silent for now
    }
  }

  const downloadRentalsPDF = async () => {
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
      pdf.text('Rental Items Management Report', 20, 55); // Adjusted for space below top bar
      
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
      pdf.text(`Total Rental Items: ${rentalItems.length}`, 20, 85);
      pdf.text(`Total Items Value: LKR ${rentalItems.reduce((sum, item) => sum + (Number(item.rentalPerDay || 0) * Number(item.totalQty || 0)), 0).toLocaleString()}`, 20, 90);
      
      // Add rental details table
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Rental Items Details:', 20, 105);
      
      // Table headers with black background
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      let tableY = 115;
      
      // Draw primary green background for header row
      pdf.setFillColor(13, 126, 121); // Primary green background
      pdf.rect(20, tableY - 5, 170, 10, 'F'); // Rectangle covering header row (increased height)
      
      // Set white text color for headers
      pdf.setTextColor(255, 255, 255); // White text
      pdf.text('Product Name', 20, tableY);
      pdf.text('Rental/Day', 80, tableY);
      pdf.text('Total Qty', 120, tableY);
      pdf.text('Description', 150, tableY);
      
      // Reset text color for data rows
      pdf.setTextColor(0, 0, 0); // Black text
      
      // Table data
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10); // Increased font size for data rows
      tableY += 10; // Increased spacing
      
      rentalItems.slice(0, 20).forEach((item, index) => {
        if (tableY > 260) {
          pdf.addPage();
          tableY = 20;
        }
        
        // Calculate row height based on description length
        const description = item.description || '—';
        const maxDescriptionWidth = 40; // Maximum width for description column
        const descriptionLines = pdf.splitTextToSize(description, maxDescriptionWidth);
        const rowHeight = Math.max(10, descriptionLines.length * 4 + 2); // Dynamic row height
        
        // Add alternating backgrounds for all rows
        if (index % 2 === 0) {
          pdf.setFillColor(240, 240, 240); // Light gray background for even rows
        } else {
          pdf.setFillColor(255, 255, 255); // White background for odd rows
        }
        pdf.rect(20, tableY - 5, 170, rowHeight, 'F'); // Rectangle covering row (dynamic height)
        
        // Product name
        pdf.text(item.productName || '—', 20, tableY);
        
        // Rental per day
        pdf.text(`LKR ${Number(item.rentalPerDay || 0).toLocaleString()}`, 80, tableY);
        
        // Total quantity
        pdf.text(String(item.totalQty || 0), 120, tableY);
        
        // Description with line wrapping
        pdf.text(descriptionLines, 150, tableY);
        
        tableY += rowHeight + 2; // Dynamic spacing based on row height
      });
      
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
      pdf.save(`AgroLink-Rentals-Report-${new Date().toISOString().split('T')[0]}.pdf`);
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
          <h1 className='text-3xl font-semibold ml-2'>Rentals</h1>
          <div className='flex items-center gap-2'>
            <button
              onClick={downloadRentalsPDF}
              className='inline-flex items-center gap-2 px-4 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors'
              title='Download Rentals Report as PDF'
            >
              <Download className='w-4 h-4' />
              Download PDF
            </button>
          </div>
        </div>

        <div className='grid grid-cols-[240px,1fr] gap-6'>
          {/* Sidebar */}
          <AdminSidebar activePage="rentals" />

          {/* Main content */}
          <div className='space-y-6'>
            {/* Rental Metrics Cards */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-gray-600'>Total Rental Items</div>
                    <div className='text-2xl font-semibold mt-1'>{rentalItems.length}</div>
                    <div className='mt-3'>
                      <span className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full'>All Items</span>
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
                    <div className='text-sm text-gray-600'>Total Rental Value</div>
                    <div className='text-2xl font-semibold mt-1'>LKR {rentalItems.reduce((sum, item) => sum + (Number(item.rentalPerDay || 0) * Number(item.totalQty || 0)), 0).toLocaleString()}</div>
                    <div className='mt-3'>
                      <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>Daily Value</span>
                    </div>
                  </div>
                  <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                    <DollarSign className='w-6 h-6 text-green-600' />
                  </div>
                </div>
              </Card>
            </div>

            {/* Rentals table */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
              <div className='px-4 py-3 border-b border-gray-100 grid grid-cols-3 items-center gap-3'>
                <div className='text-md font-medium text-gray-700'>Rental Items</div>
                <div className='flex justify-center'>
                  <div className='relative hidden sm:block'>
                    <input className='bg-white border border-gray-200 rounded-full h-9 pl-3 pr-3 w-56 text-sm outline-none' placeholder='Search' value={search} onChange={(e)=>setSearch(e.target.value)} />
                  </div>
                </div>
                <div className='flex items-center justify-end gap-3'>
                  <select className='input-field h-9 py-1 text-sm hidden sm:block' value={sortMode} onChange={(e)=>setSortMode(e.target.value)}>
                    <option value='newest'>Newest</option>
                    <option value='oldest'>Oldest</option>
                    <option value='priceAsc'>Price: Low to High</option>
                    <option value='priceDesc'>Price: High to Low</option>
                  </select>
                  <button className='btn-primary whitespace-nowrap' onClick={() => setIsAddOpen(true)}>Add Rental Item +</button>
                </div>
              </div>
              <div className='h-[61vh] overflow-y-auto'>
                <table className='min-w-full text-sm'>
                  <thead className='sticky top-0 bg-gray-100 z-10'>
                    <tr className='text-left text-gray-500'>
                      <th className='py-3 px-4 text-center font-normal'>Product name</th>
                      <th className='py-3 px-4 text-center font-normal'>Rental / Day</th>
                      <th className='py-3 px-4 text-center font-normal'>Images</th>
                      <th className='py-3 px-4 text-center font-normal'>Total Qty</th>
                      <th className='py-3 px-4 text-center font-normal'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingRentals ? (
                      <tr><td className='py-10 text-center text-gray-400' colSpan={5}>Loading…</td></tr>
                    ) : rentalItems.length === 0 ? (
                      <tr><td className='py-10 text-center text-gray-400' colSpan={5}>No data yet</td></tr>
                    ) : (
                      filteredRentals.map((it) => (
                        <tr key={it._id} className='border-t'>
                          <td className='py-3 px-4 text-center'>{it.productName}</td>
                          <td className='py-3 px-4 text-center'>LKR {Number(it.rentalPerDay || 0).toLocaleString()}</td>
                          
                          <td className='py-3 px-4 text-center'>
                            {Array.isArray(it.images) && it.images.filter(Boolean).length > 0 ? (
                              <div className='inline-grid grid-cols-4 gap-1'>
                                {it.images.filter(Boolean).slice(0,4).map((src, idx) => (
                                  <img key={idx} src={src} alt={'img'+idx} className='w-8 h-8 object-cover rounded' />
                                ))}
                              </div>
                            ) : (
                              <span className='text-gray-400'>—</span>
                            )}
                          </td>
                          <td className='py-3 px-4 text-center'>{it.totalQty}</td>
                          <td className='py-3 px-4 text-center'>
                            <div className='inline-flex items-center gap-2'>
                              <button className='px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs inline-flex items-center gap-1' onClick={()=>{ setViewItem(it); setIsEditing(false); }}>
                                <Info className='w-3.5 h-3.5' /> Info
                              </button>
                              <button className='px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs inline-flex items-center gap-1' onClick={()=>{ setViewItem(it); setIsEditing(true); }}>
                                <Pencil className='w-3.5 h-3.5' /> Edit
                              </button>
                              <button className='px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs inline-flex items-center gap-1' onClick={async()=>{ if(window.confirm('Delete this item?')){ try{ await axiosInstance.delete(`rentals/${it._id}`); loadRentals(); }catch(_){ } } }}>
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

            {/* Recent Rental Activity and Metrics */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Recent Rental Activity</div>
                  <div className='space-y-4 text-sm'>
                    {rentalItems.slice(0, 4).map((item, i) => (
                      <div key={i}>
                        <div className='grid grid-cols-[1fr,110px,120px] gap-3 items-start'>
                        <div>
                            <div className='font-medium'>{item.productName}</div>
                            <div className='text-gray-500'>Total Qty: {item.totalQty} items available</div>
                          </div>
                          <div className='text-gray-600 text-xs mt-0.5 ml-5'>LKR {Number(item.rentalPerDay || 0).toLocaleString()} / day</div>
                          <div className='text-gray-700 text-right text-xs font-medium'>
                            LKR {Number(item.rentalPerDay || 0).toLocaleString()}
                          </div>
                        </div>
                        {i !== Math.min(rentalItems.length, 4) - 1 && (
                          <div className='h-px bg-gray-200 mx-2 my-2'></div>
                        )}
                </div>
              ))}
                  </div>
                </div>
              </Card>
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
                    <form onSubmit={async (e)=>{ e.preventDefault(); try { const payload={ productName:viewItem.productName, description:viewItem.description, rentalPerDay:Number(viewItem.rentalPerDay), images:viewItem.images, totalQty:Number(viewItem.totalQty) }; await axiosInstance.put(`rentals/${viewItem._id}`, payload); loadRentals(); setViewItem(null); setIsEditing(false); } catch(_){} }} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='form-label'>Product name</label>
                        <input className='input-field' value={viewItem.productName||''} onChange={(e)=>setViewItem(v=>({...v, productName:e.target.value}))} required />
                      </div>
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
                      <div className='md:col-span-2 flex justify-end gap-2 pt-2'>
                        <button type='button' className='border px-3 py-2 rounded-md' onClick={()=>{ setViewItem(null); setIsEditing(false); }}>Cancel</button>
                        <button type='submit' className='btn-primary'>Save</button>
                      </div>
                    </form>
                  ) : (
                    <div className='space-y-3 text-sm'>
                      <div><span className='text-gray-500'>Product name:</span> <span className='font-medium'>{viewItem.productName}</span></div>
                      <div><span className='text-gray-500'>Description:</span> <span className='font-medium'>{viewItem.description||'—'}</span></div>
                      <div className='grid grid-cols-2 gap-4'>
                        <div><span className='text-gray-500'>Rental / Day:</span> <span className='font-medium'>LKR {Number(viewItem.rentalPerDay||0).toLocaleString()}</span></div>
                        
                        <div><span className='text-gray-500'>Total Qty:</span> <span className='font-medium'>{viewItem.totalQty}</span></div>
                        <div><span className='text-gray-500'>Available Qty:</span> <span className='font-medium'>{viewItem.availableQty}</span></div>
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
                      <div className='flex justify-end pt-2'>
                        <button className='btn-primary' onClick={()=>setIsEditing(true)}>Edit</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Add Rental Item Modal */}
      {isAddOpen && (
        <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-2xl p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-semibold'>Add Rental Item</h2>
              <button onClick={() => setIsAddOpen(false)} className='text-gray-500'>Close</button>
            </div>
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
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRentals



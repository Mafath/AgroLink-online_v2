import React, { useEffect, useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { axiosInstance } from '../lib/axios'
import { useAuthStore } from '../store/useAuthStore'
import { Info, Pencil, Trash2, Package, AlertTriangle, DollarSign, BarChart3, TrendingUp, TrendingDown, FileDown } from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import logoImg from '../assets/AgroLink_logo3-removebg-preview.png'

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
  const { authUser } = useAuthStore()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAddInventory, setIsAddInventory] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [rentalForm, setRentalForm] = useState({
    productName: '',
    description: '',
    rentalPerDay: '',
    images: [],
    totalQty: '',
  })

  const [rentalItems, setRentalItems] = useState([])
  const [isLoadingRentals, setIsLoadingRentals] = useState(false)
  const [inventoryItems, setInventoryItems] = useState([])
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)
  const [inventorySortMode, setInventorySortMode] = useState('newest')
  const [query, setQuery] = useState('')
  const [statusSortMode, setStatusSortMode] = useState('none') // none | availableFirst | lowFirst | outFirst
  const [inventoryForm, setInventoryForm] = useState({ name: '', category: 'seeds', images: [], stockQuantity: '', price: '', description: '' })

  // Function to calculate status based on stock quantity
  const getStockStatus = (stockQuantity) => {
    const qty = Number(stockQuantity || 0)
    if (qty === 0) return 'Out of stock'
    if (qty < 20) return 'Low stock'
    return 'Available'
  }

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
      console.log('Loading inventory...')
      const { data } = await axiosInstance.get('inventory')
      console.log('Inventory API response:', data)
      setInventoryItems(Array.isArray(data?.data) ? data.data : [])
    } catch (e) {
      console.error('Failed to load inventory:', e)
      console.error('Error details:', e.response?.data)
      console.error('Status:', e.response?.status)
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

  // Filter by search query and status
  const filteredInventory = useMemo(() => {
    let filtered = inventorySorted
    
    // Filter by status if a specific status is selected
    if (statusSortMode !== 'none') {
      filtered = filtered.filter((item) => {
        const status = getStockStatus(item.stockQuantity)
        if (statusSortMode === 'availableFirst') return status === 'Available'
        if (statusSortMode === 'lowFirst') return status === 'Low stock'
        if (statusSortMode === 'outFirst') return status === 'Out of stock'
        return true
      })
    }
    
    // Filter by search query
    const q = (query || '').trim().toLowerCase()
    if (!q) return filtered
    return filtered.filter((it) => {
      const name = String(it.name || '').toLowerCase()
      const category = String(it.category || '').toLowerCase()
      const price = String(it.price || '')
      const stock = String(it.stockQuantity || '')
      return (
        name.includes(q) ||
        category.includes(q) ||
        price.includes(q) ||
        stock.includes(q)
      )
    })
  }, [inventorySorted, query, statusSortMode])

  // Inventory metrics
  const inventoryMetrics = useMemo(() => {
    const totalItems = inventoryItems.length
    const lowStockItems = inventoryItems.filter(item => Number(item.stockQuantity || 0) < 20).length
    const outOfStockItems = inventoryItems.filter(item => Number(item.stockQuantity || 0) === 0).length
    const totalValue = inventoryItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.stockQuantity || 0)), 0)
    const categories = inventoryItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {})

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
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

  // Inventory value added per day (sum of price * stockQuantity for items created each day)
  const inventoryValueData = useMemo(() => {
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

    // aggregate value per day from inventoryItems.createdAt
    const dayToValue = new Map()
    for (const d of days) dayToValue.set(toKey(d), 0)

    inventoryItems.forEach((item) => {
      const created = item?.createdAt ? new Date(item.createdAt) : null
      if (!created || isNaN(created.getTime())) return
      const key = toKey(created)
      if (!dayToValue.has(key)) return
      const itemValue = Number(item.price || 0) * Number(item.stockQuantity || 0)
      dayToValue.set(key, dayToValue.get(key) + itemValue)
    })

    return days.map((d) => ({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      value: dayToValue.get(toKey(d)) || 0,
    }))
  }, [inventoryItems])

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

  const handleSubmitInventory = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: inventoryForm.name,
        category: inventoryForm.category,
        description: inventoryForm.description,
        images: inventoryForm.images,
        stockQuantity: Number(inventoryForm.stockQuantity || 0),
        price: Number(inventoryForm.price || 0),
      }
      await axiosInstance.post('inventory', payload)
      setIsAddOpen(false)
      setIsAddInventory(false)
      setInventoryForm({ name: '', category: 'seeds', images: [], stockQuantity: '', price: '', description: '' })
      loadInventory()
    } catch (err) {
      // optional: surface error
    }
  }

  const downloadInventoryPDF = async () => {
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
      pdf.text('Inventory Management Report', 20, 55); // Adjusted for space below top bar
      
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
      pdf.text(`Total Items: ${inventoryMetrics.totalItems}`, 20, 85);
      pdf.text(`Low Stock Items: ${inventoryMetrics.lowStockItems}`, 20, 90);
      pdf.text(`Out of Stock Items: ${inventoryMetrics.outOfStockItems}`, 20, 95);
      pdf.text(`Total Value: LKR ${inventoryMetrics.totalValue.toLocaleString()}`, 20, 100);
      
      // Add category distribution
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Category Distribution:', 20, 115);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let yPos = 125;
      Object.entries(inventoryMetrics.categories).forEach(([category, count]) => {
        pdf.text(`${category}: ${count}`, 20, yPos);
        yPos += 5;
      });
      
      // Add inventory details table
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Inventory Details:', 20, yPos + 10);
      
      // Table headers with black background
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      let tableY = yPos + 20;
      
      // Draw primary green background for header row
      pdf.setFillColor(13, 126, 121); // Primary green background
      pdf.rect(20, tableY - 5, 170, 10, 'F'); // Rectangle covering header row (increased height)
      
      // Set white text color for headers
      pdf.setTextColor(255, 255, 255); // White text
      pdf.text('Name', 30, tableY);
      pdf.text('Category', 70, tableY);
      pdf.text('Stock Qty', 100, tableY);
      pdf.text('Price', 120, tableY);
      pdf.text('Status', 150, tableY);
      
      // Reset text color for data rows
      pdf.setTextColor(0, 0, 0); // Black text
      
      // Table data
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10); // Increased font size for data rows
      tableY += 10; // Increased spacing
      
      inventoryItems.slice(0, 20).forEach((item, index) => {
        if (tableY > 280) {
          pdf.addPage();
          tableY = 20;
        }
        
        // Add alternating backgrounds for all rows
        if (index % 2 === 0) {
          pdf.setFillColor(240, 240, 240); // Light gray background for even rows
        } else {
          pdf.setFillColor(255, 255, 255); // White background for odd rows
        }
        pdf.rect(20, tableY - 5, 170, 10, 'F'); // Rectangle covering row (consistent height)
        
        pdf.text(item.name || '—', 30, tableY);
        pdf.text(item.category || '—', 70, tableY);
        pdf.text(String(item.stockQuantity || 0), 100, tableY);
        pdf.text(`LKR ${Number(item.price || 0).toLocaleString()}`, 120, tableY);
        pdf.text(getStockStatus(item.stockQuantity), 150, tableY);
        
        tableY += 12; // Increased spacing
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
      pdf.save(`AgroLink-Inventory-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Check if user is admin
  if (authUser && authUser.role !== 'ADMIN') {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Access Denied</h1>
          <p className='text-gray-600'>You need admin privileges to access the inventory.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-semibold ml-2'>Inventory</h1>
          <div className='flex items-center gap-2'>
            <button onClick={downloadInventoryPDF} className='inline-flex items-center gap-2 px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-900 transition-colors' title='Export PDF'>
              <FileDown className='w-4 h-4' />
              Export
            </button>
          </div>
        </div>

        <div className='grid grid-cols-[240px,1fr] gap-6'>
          {/* Sidebar */}
          <AdminSidebar activePage="inventory" />

          {/* Main content */}
          <div className='space-y-6'>
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
                    <div className='mt-3'>
                      <span className='text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full'>Needs Restocking</span>
                    </div>
                  </div>
                  <div className='w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center'>
                    <AlertTriangle className='w-6 h-6 text-yellow-600' />
                  </div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-gray-600'>Out of Stock Items</div>
                    <div className='text-2xl font-semibold mt-1'>{inventoryMetrics.outOfStockItems}</div>
                    <div className='mt-3'>
                      <span className='text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full'>Needs Restocking</span>
                    </div>
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
                    <div className='mt-3'>
                      <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>Inventory Worth</span>
                    </div>
                  </div>
                  <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                    <DollarSign className='w-6 h-6 text-green-600' />
                  </div>
                </div>
              </Card>
            </div>

            {/* Inventory table */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
              <div className='px-4 py-3 border-b border-gray-100 grid grid-cols-3 items-center gap-3'>
                <div>
                  <div className='text-md font-medium text-gray-700'>Inventory Items</div>
                </div>
                <div className='hidden sm:flex justify-center'>
                  <div className='relative'>
                    <input value={query} onChange={(e)=>setQuery(e.target.value)} className='bg-white border border-gray-200 rounded-full h-9 pl-9 pr-3 w-72 text-sm outline-none' placeholder='Search' />
                  </div>
                </div>
                <div className='flex items-center justify-end gap-3'>
                  <select className='input-field h-9 py-1 text-sm hidden sm:block' value={inventorySortMode} onChange={(e)=>setInventorySortMode(e.target.value)}>
                    <option value='newest'>Newest</option>
                    <option value='oldest'>Oldest</option>
                    <option value='priceAsc'>Price: Low to High</option>
                    <option value='priceDesc'>Price: High to Low</option>
                  </select>
                  <select className='input-field h-9 py-1 text-sm hidden sm:block' value={statusSortMode} onChange={(e)=>setStatusSortMode(e.target.value)}>
                    <option value='none'>Status: Default</option>
                    <option value='availableFirst'>Available</option>
                    <option value='lowFirst'>Low stock</option>
                    <option value='outFirst'>Out of stock</option>
                  </select>
                  <button className='bg-black text-white hover:bg-gray-900 transition-colors whitespace-nowrap px-3 py-2 text-sm rounded-md' onClick={()=>{ setIsAddInventory(true); setIsAddOpen(true) }}>Add Inventory Item +</button>
                </div>
              </div>
              <div className='h-[61vh] overflow-y-auto'>
                <table className='min-w-full text-sm'>
                  <thead className='sticky top-0 bg-gray-100 z-10'>
                    <tr className='text-left text-gray-500'>
                      <th className='py-3 px-4 text-left font-normal'>Name</th>
                      <th className='py-3 px-4 text-left font-normal'>Category</th>
                      <th className='py-3 px-4 text-left font-normal'>Image</th>
                      <th className='py-3 px-4 text-center font-normal'>Stock Qty</th>
                      <th className='py-3 px-4 text-center font-normal'>Price/qty</th>
                      <th className='py-3 px-4 text-center font-normal'>Status</th>
                      <th className='py-3 px-4 text-center font-normal'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingInventory ? (
                      <tr><td className='py-10 text-center text-gray-400' colSpan={7}>Loading…</td></tr>
                    ) : inventoryItems.length === 0 ? (
                      <tr><td className='py-10 text-center text-gray-400' colSpan={7}>No data yet</td></tr>
                    ) : (
                      filteredInventory.map((it) => (
                        <tr key={it._id} className='border-t'>
                          <td className='py-3 px-4 text-left'>{it.name}</td>
                          <td className='py-3 px-4 text-left capitalize'>{it.category}</td>
                          <td className='py-3 px-4 text-left'>
                            {it.images && it.images.length > 0 ? (
                              <div className='flex gap-1'>
                                {it.images.slice(0, 4).map((img, idx) => (
                                  <img key={idx} src={img} alt={`${it.name} ${idx + 1}`} className='w-8 h-8 rounded object-cover'/>
                                ))}
                                {it.images.length > 4 && (
                                  <div className='w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500'>
                                    +{it.images.length - 4}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className='text-gray-400'>—</span>
                            )}
                          </td>
                          <td className='py-3 px-4 text-center'>{it.stockQuantity}</td>
                          <td className='py-3 px-4 text-center'>LKR {Number(it.price||0).toLocaleString()}</td>
                          <td className='py-3 px-4 text-center'>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              getStockStatus(it.stockQuantity) === 'Available' ? 'bg-purple-100 text-purple-700' :
                              getStockStatus(it.stockQuantity) === 'Low stock' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {getStockStatus(it.stockQuantity)}
                            </span>
                          </td>
                          <td className='py-3 px-4 text-center'>
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
        <div className='bg-white rounded-lg w-full max-w-lg p-4'>
          <div className='flex items-center justify-between mb-3'>
            <h2 className='text-lg font-semibold'>{isEditing ? (viewItem.isInventory ? 'Edit Inventory Item' : 'Edit Rental Item') : (viewItem.isInventory ? 'Inventory Item Info' : 'Rental Item Info')}</h2>
            <button onClick={()=>{ setViewItem(null); setIsEditing(false); }} className='text-gray-500'>Close</button>
          </div>
          {isEditing ? (
            <div className='bg-gray-50 p-3 rounded-lg'>
              <div className='mb-3'>
                <h3 className='text-md font-semibold text-gray-800 mb-1'>Edit Item Details</h3>
                <p className='text-xs text-gray-600'>Update the information below and click Save to apply changes.</p>
              </div>
              <form onSubmit={async (e)=>{ e.preventDefault(); try{ if(viewItem.isInventory){ const payload={ name:viewItem.name, category:viewItem.category, description:viewItem.description, images:viewItem.images, stockQuantity:Number(viewItem.stockQuantity || 0), price:Number(viewItem.price || 0) }; console.log('Submitting inventory update:', payload); await axiosInstance.put(`inventory/${viewItem._id}`, payload); loadInventory(); } else { const payload={ productName:viewItem.productName, description:viewItem.description, rentalPerDay:Number(viewItem.rentalPerDay), images:viewItem.images, totalQty:Number(viewItem.totalQty) }; await axiosInstance.put(`rentals/${viewItem._id}`, payload); loadRentals(); } setViewItem(null); setIsEditing(false); }catch(err){ console.error('Update failed:', err); }}} className='grid grid-cols-1 md:grid-cols-2 gap-3'>
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
                    <input 
                      type='number'
                      min='0'
                      step='1'
                      className='input-field' 
                      value={viewItem.stockQuantity !== undefined ? String(viewItem.stockQuantity) : ''} 
                      onKeyDown={(e) => {
                        // Prevent minus sign, plus sign, decimal point, and 'e' from being typed
                        if (e.key === '-' || e.key === '+' || e.key === '.' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault()
                        }
                      }}
                      onChange={(e) => {
                        const v = e.target.value
                        console.log('Stock quantity changed to:', v)
                        // Remove any non-numeric characters and only allow positive integers or empty string
                        const cleanValue = v.replace(/[^0-9]/g, '')
                        if (cleanValue === '' || (Number(cleanValue) >= 0)) {
                          setViewItem(prev => ({ ...prev, stockQuantity: cleanValue }))
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className='form-label'>Price</label>
                    <input 
                      type='number'
                      min='0'
                      step='0.01'
                      className='input-field' 
                      value={viewItem.price !== undefined ? String(viewItem.price) : ''} 
                      onKeyDown={(e) => {
                        // Prevent minus sign, plus sign, and 'e' from being typed
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault()
                        }
                      }}
                      onChange={(e) => {
                        const v = e.target.value
                        console.log('Price changed to:', v)
                        // Remove any minus signs and only allow positive numbers or empty string
                        const cleanValue = v.replace(/[^0-9.]/g, '')
                        if (cleanValue === '' || (Number(cleanValue) >= 0)) {
                          setViewItem(prev => ({ ...prev, price: cleanValue }))
                        }
                      }}
                    />
                  </div>
                  <div className='md:col-span-2'>
                    <label className='form-label'>Images (up to 4)</label>
                    <input type='file' accept='image/*' multiple className='block w-full text-sm' onChange={(e)=>{
                      const files = Array.from(e.target.files||[]).slice(0,4)
                      const readers = files.map(file=> new Promise((resolve)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.readAsDataURL(file) }))
                      Promise.all(readers).then(results=> setViewItem(v=>({...v, images: results})))
                    }} />
                    {Array.isArray(viewItem.images) && viewItem.images.length>0 && (
                      <div className='mt-2 grid grid-cols-4 gap-2'>
                        {viewItem.images.map((src, idx)=> (
                          <img key={idx} src={src} alt={'img'+idx} className='w-full h-16 object-cover rounded-md border' />
                        ))}
                      </div>
                    )}
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
                    <input 
                      type='number' 
                      min='0' 
                      className='input-field' 
                      value={viewItem.totalQty||''} 
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
                          setViewItem(v => ({ ...v, totalQty: cleanValue }))
                        }
                      }}
                      required 
                    />
                  </div>
                  <div className='md:col-span-2'>
                    <label className='form-label'>Description</label>
                    <textarea className='input-field' rows={3} value={viewItem.description||''} onChange={(e)=>setViewItem(v=>({...v, description:e.target.value}))} />
                  </div>
                  <div>
                    <label className='form-label'>Rental / Day</label>
                    <input 
                      type='number' 
                      min='0' 
                      step='0.01' 
                      className='input-field' 
                      value={viewItem.rentalPerDay||''} 
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
                          setViewItem(v => ({ ...v, rentalPerDay: cleanValue }))
                        }
                      }}
                      required 
                    />
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
              <div className='md:col-span-2 flex justify-end gap-2 pt-3 border-t border-gray-200'>
                <button type='button' className='px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors' onClick={()=>{ setViewItem(null); setIsEditing(false); }}>Cancel</button>
                <button type='submit' className='px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'>Save</button>
              </div>
            </form>
            </div>
          ) : (
            <div className='space-y-3 text-sm'>
              {/* Basic Information */}
              <div className='bg-gray-50 p-3 rounded-lg'>
                <h3 className='font-semibold text-gray-800 mb-2 text-sm'>Basic Information</h3>
                <div className='space-y-1'>
                  <div><span className='text-gray-500 text-xs'>{viewItem.isInventory ? 'Product Name' : 'Product name'}:</span> <span className='font-medium ml-2 text-sm'>{viewItem.isInventory ? viewItem.name : viewItem.productName}</span></div>
                  <div><span className='text-gray-500 text-xs'>Description:</span> <span className='font-medium ml-2 text-sm'>{viewItem.description||'—'}</span></div>
                </div>
              </div>

              {/* Details Grid */}
              <div className='grid grid-cols-2 gap-2'>
                {viewItem.isInventory ? (
                  <>
                    <div className='bg-blue-50 p-2 rounded-lg'>
                      <div className='text-gray-500 text-xs uppercase tracking-wide'>Category</div>
                      <div className='font-semibold text-blue-800 capitalize text-sm'>{viewItem.category}</div>
                    </div>
                    <div className='bg-green-50 p-2 rounded-lg'>
                      <div className='text-gray-500 text-xs uppercase tracking-wide'>Stock Quantity</div>
                      <div className='font-semibold text-green-800 text-sm'>{viewItem.stockQuantity} units</div>
                    </div>
                    <div className='bg-purple-50 p-2 rounded-lg'>
                      <div className='text-gray-500 text-xs uppercase tracking-wide'>Price per Unit</div>
                      <div className='font-semibold text-purple-800 text-sm'>LKR {Number(viewItem.price||0).toLocaleString()}</div>
                    </div>
                    <div className='bg-orange-50 p-2 rounded-lg'>
                      <div className='text-gray-500 text-xs uppercase tracking-wide'>Status</div>
                      <div className={`font-semibold text-sm ${
                        getStockStatus(viewItem.stockQuantity) === 'Available' ? 'text-green-800' :
                        getStockStatus(viewItem.stockQuantity) === 'Low stock' ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>
                        {getStockStatus(viewItem.stockQuantity)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className='bg-blue-50 p-2 rounded-lg'>
                      <div className='text-gray-500 text-xs uppercase tracking-wide'>Rental / Day</div>
                      <div className='font-semibold text-blue-800 text-sm'>LKR {Number(viewItem.rentalPerDay||0).toLocaleString()}</div>
                    </div>
                    
                    <div className='bg-purple-50 p-2 rounded-lg'>
                      <div className='text-gray-500 text-xs uppercase tracking-wide'>Total Qty</div>
                      <div className='font-semibold text-purple-800 text-sm'>{viewItem.totalQty}</div>
                    </div>
                    <div className='bg-orange-50 p-2 rounded-lg'>
                      <div className='text-gray-500 text-xs uppercase tracking-wide'>Available Qty</div>
                      <div className='font-semibold text-orange-800 text-sm'>{viewItem.availableQty}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Additional Information for Inventory Items */}
              {viewItem.isInventory && (
                <div className='bg-gray-50 p-2 rounded-lg'>
                  <h3 className='font-semibold text-gray-800 mb-2 text-sm'>Additional Information</h3>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <div className='text-gray-500 text-xs uppercase tracking-wide'>Total Value</div>
                      <div className='font-semibold text-gray-800 text-sm'>LKR {(Number(viewItem.price||0) * Number(viewItem.stockQuantity||0)).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className='text-gray-500 text-xs uppercase tracking-wide'>Item ID</div>
                      <div className='font-mono text-xs text-gray-600'>{viewItem._id}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Images Section */}
              <div className='bg-gray-50 p-2 rounded-lg'>
                <h3 className='font-semibold text-gray-800 mb-2 text-sm'>Images</h3>
                {viewItem.isInventory ? (
                  viewItem.images && viewItem.images.length > 0 ? (
                    <div className='grid grid-cols-4 gap-2'>
                      {viewItem.images.map((src, idx) => (
                        <img key={idx} src={src} alt={`${viewItem.name} ${idx + 1}`} className='w-full h-16 object-cover rounded-md border'/>
                      ))}
                    </div>
                  ) : (
                    <div className='text-gray-400 text-center py-2 text-xs'>No images available</div>
                  )
                ) : (
                  Array.isArray(viewItem.images) && viewItem.images.length > 0 ? (
                    <div className='grid grid-cols-4 gap-2'>
                      {viewItem.images.map((src, idx) => (
                        <img key={idx} src={src} alt={`${viewItem.productName} ${idx + 1}`} className='w-full h-16 object-cover rounded-md border' />
                      ))}
                    </div>
                  ) : (
                    <div className='text-gray-400 text-center py-2 text-xs'>No images available</div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

            {/* Middle cards: Inventory Charts */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Inventory Value Trend</div>
                  <div className='rounded-lg border border-dashed'>
                    <InventoryValueChart data={inventoryValueData} />
                  </div>
                </div>
              </Card>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Low Stock Alert</div>
                  <div className='rounded-lg border border-dashed'>
                    <StockLevelChart data={stockLevelData} />
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
                      <div key={i}>
                        <div className='grid grid-cols-[1fr,110px,120px] gap-3 items-start'>
                        <div>
                            <div className='font-medium'>{item.name}</div>
                            <div className='text-gray-500'>{item.category} • Stock: {item.stockQuantity} items added</div>
                          </div>
                          <div className='text-gray-600 text-xs mt-0.5 ml-5'>LKR {Number(item.price || 0).toLocaleString()} / qty</div>
                          <div className='text-gray-700 text-right text-xs font-medium'>
                            LKR {(Number(item.price || 0) * Number(item.stockQuantity || 0)).toLocaleString()}
                          </div>
                        </div>
                        {i !== Math.min(inventoryItems.length, 4) - 1 && (
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
                <input 
                  type='number' 
                  min='0' 
                  className='input-field' 
                  value={rentalForm.totalQty} 
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
                      setRentalForm(f => ({ ...f, totalQty: cleanValue }))
                    }
                  }}
                  required 
                />
              </div>
              <div className='md:col-span-2'>
                <label className='form-label'>Description</label>
                <textarea className='input-field' rows={3} value={rentalForm.description} onChange={(e)=>setRentalForm(f=>({...f, description:e.target.value}))} />
              </div>
              <div>
                <label className='form-label'>Rental / Day</label>
                <input 
                  type='number' 
                  min='0' 
                  step='0.01' 
                  className='input-field' 
                  value={rentalForm.rentalPerDay} 
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
                      setRentalForm(f => ({ ...f, rentalPerDay: cleanValue }))
                    }
                  }}
                  required 
                />
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
                <input 
                  type='number' 
                  min='0' 
                  step='1'
                  className='input-field' 
                  value={inventoryForm.stockQuantity} 
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
                      setInventoryForm(f => ({ ...f, stockQuantity: cleanValue }))
                    }
                  }}
                  required 
                />
              </div>
              <div>
                <label className='form-label'>Price</label>
                <input 
                  type='number' 
                  min='0' 
                  step='0.01' 
                  className='input-field' 
                  value={inventoryForm.price} 
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
                      setInventoryForm(f => ({ ...f, price: cleanValue }))
                    }
                  }}
                  required 
                />
              </div>
              <div className='md:col-span-2'>
                <label className='form-label'>Images (up to 4)</label>
                <input type='file' accept='image/*' multiple className='block w-full text-sm' onChange={(e)=>{
                  const files = Array.from(e.target.files||[]).slice(0,4)
                  const readers = files.map(file=> new Promise((resolve)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.readAsDataURL(file) }))
                  Promise.all(readers).then(results=> setInventoryForm(f=>({...f, images: results})))
                }} />
                {Array.isArray(inventoryForm.images) && inventoryForm.images.length>0 && (
                  <div className='mt-2 grid grid-cols-4 gap-2'>
                    {inventoryForm.images.map((src, idx)=> (
                      <img key={idx} src={src} alt={'img'+idx} className='w-full h-16 object-cover rounded-md border' />
                    ))}
                  </div>
                )}
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




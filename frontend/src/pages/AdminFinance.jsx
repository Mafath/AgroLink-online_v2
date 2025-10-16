import React from 'react'
import AdminSidebar from '../components/AdminSidebar'
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, CalendarRange, PieChart, BarChart3, LineChart, Receipt, Target, Repeat, FileDown, ChevronDown } from 'lucide-react'
import Chart from 'react-apexcharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'
import logoImg from '../assets/AgroLink_logo3-removebg-preview.png'
import { axiosInstance } from '../lib/axios'

const StatCard = ({ icon: Icon, title, value, trend, positive = true }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
    <div className={`p-2 rounded-xl ${positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
      <Icon className="size-5" />
    </div>
    <div className="flex-1">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          <span>{trend}</span>
        </div>
      )}
    </div>
  </div>
)

const PlaceholderChart = ({ title, icon: Icon }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 text-gray-800 font-semibold">
        <Icon className="size-5 text-gray-500" />
        <span>{title}</span>
      </div>
      <div className="text-xs text-gray-400">Sample data</div>
    </div>
    <div className="h-56 rounded-xl bg-[linear-gradient(120deg,#f3f4f6_10%,transparent_10%),linear-gradient(0deg,#f3f4f6_10%,transparent_10%)] bg-[length:16px_16px]" />
  </div>
)

const SectionHeader = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Icon className="size-5 text-gray-500" />
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
    {action}
  </div>
)

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'income', label: 'Income' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'reports', label: 'Reports' },
]

const AdminFinance = () => {
  const [activeTab, setActiveTab] = React.useState('overview')
  const [summary, setSummary] = React.useState({ income: 0, expenses: 0, balance: 0 })
  const [loadingSummary, setLoadingSummary] = React.useState(false)
  const [incomeItems, setIncomeItems] = React.useState([])
  const [expenseItems, setExpenseItems] = React.useState([])
  const [loadingIncome, setLoadingIncome] = React.useState(false)
  const [loadingExpenses, setLoadingExpenses] = React.useState(false)
  const [companyIncome, setCompanyIncome] = React.useState({ totalsByType: { inventory: 0, rental: 0, listingCommission: 0, listingPassThrough: 0 }, totalIncome: 0, items: [] })
  const [incomeRange, setIncomeRange] = React.useState('') // '', 'day' | 'week' | 'month' | 'lastMonth'
  const [incomeTypeFilter, setIncomeTypeFilter] = React.useState('all') // 'all' | 'inventory' | 'rental' | 'listing'
  const [showOrderIncomeDetails, setShowOrderIncomeDetails] = React.useState(false)
  const [deliveryIncome, setDeliveryIncome] = React.useState({ total: 0, count: 0, items: [] })
  const [sourceTotals, setSourceTotals] = React.useState({ deliveryFees: 0, listingCommission: 0, rentalFees: 0, manualIncome: 0, recurringIncome: 0, total: 0 })
  const [showListingIncome, setShowListingIncome] = React.useState(false)
  const [showDeliveryIncomeDetails, setShowDeliveryIncomeDetails] = React.useState(false)
  const [overviewIncomeTx, setOverviewIncomeTx] = React.useState([])
  const [overviewExpenseTx, setOverviewExpenseTx] = React.useState([])
  const [overviewIncome7d, setOverviewIncome7d] = React.useState([])
  const [overviewExpense7d, setOverviewExpense7d] = React.useState([])
  const [overviewRange, setOverviewRange] = React.useState('') // '' | 'day' | 'week' | 'month' | 'lastMonth'
  const [creating, setCreating] = React.useState(false)
  const [form, setForm] = React.useState({ type: 'INCOME', amount: '', date: '', category: '', description: '', source: '', receiptBase64: '' })
  const [selectedIncome, setSelectedIncome] = React.useState(null)
  const [budgets, setBudgets] = React.useState([])
  const [loadingBudgets, setLoadingBudgets] = React.useState(false)
  const [budgetForm, setBudgetForm] = React.useState({ name: '', period: 'MONTHLY', amount: '', categories: '', alertThreshold: '0.8', notifyEmail: '' })
  const [utilization, setUtilization] = React.useState([])
  const [goals, setGoals] = React.useState([])
  const [loadingGoals, setLoadingGoals] = React.useState(false)
  const [goalForm, setGoalForm] = React.useState({ title: '', targetAmount: '', dueDate: '' })
  const [debts, setDebts] = React.useState([])
  const [loadingDebts, setLoadingDebts] = React.useState(false)
  const [debtForm, setDebtForm] = React.useState({ type: 'BORROWED', party: '', principal: '', interestRate: '', dueDate: '' })
  const [recurrings, setRecurrings] = React.useState([])
  const [loadingRecurring, setLoadingRecurring] = React.useState(false)
  const [recurringForm, setRecurringForm] = React.useState({ title: '', type: 'EXPENSE', amount: '', cadence: 'MONTHLY', nextRunAt: '', category: '' })
  const [allTransactions, setAllTransactions] = React.useState([])
  const [loadingReports, setLoadingReports] = React.useState(false)
  const [showIncomeRecords, setShowIncomeRecords] = React.useState(false)
  const [driverRange, setDriverRange] = React.useState('')
  const [farmerRange, setFarmerRange] = React.useState('')
  const [driverPayouts, setDriverPayouts] = React.useState({ total: 0, count: 0, items: [], totalsByDriver: [] })
  const [driverPaid, setDriverPaid] = React.useState({})
  const [showDriverPayments, setShowDriverPayments] = React.useState(false)
  const [farmerPayouts, setFarmerPayouts] = React.useState({ total: 0, items: [], commissionPercent: 15 })
  const [driverRate, setDriverRate] = React.useState({ type: 'flat', value: '0' })
  const [showFarmerPayments, setShowFarmerPayments] = React.useState(false)

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoadingSummary(true)
        const res = await axiosInstance.get('/finance/summary')
        setSummary(res.data || { income: 0, expenses: 0, balance: 0 })
      } catch (_) {
        // silent
      } finally {
        setLoadingSummary(false)
      }
    }
    load()
  }, [])

  const reloadSummary = async () => {
    try {
      const res = await axiosInstance.get('/finance/summary')
      setSummary(res.data || { income: 0, expenses: 0, balance: 0 })
    } catch {}
  }

  const fetchTransactions = async (type) => {
    if (type === 'INCOME') setLoadingIncome(true); else setLoadingExpenses(true)
    try {
      const res = await axiosInstance.get('/finance/transactions', { params: { type } })
      if (type === 'INCOME') setIncomeItems(res.data || [])
      else setExpenseItems(res.data || [])
    } catch (_) {
      if (type === 'INCOME') setIncomeItems([]); else setExpenseItems([])
    } finally {
      if (type === 'INCOME') setLoadingIncome(false); else setLoadingExpenses(false)
    }
  }

  React.useEffect(() => {
    if (activeTab === 'income') fetchTransactions('INCOME')
    if (activeTab === 'income') { fetchCompanyIncome(incomeRange); fetchDeliveryIncome(incomeRange); fetchIncomeBySource(incomeRange) }
    if (activeTab === 'expenses') fetchTransactions('EXPENSE')
    if (activeTab === 'expenses') { fetchDriverPayouts(driverRange, driverRate); fetchFarmerPayouts(farmerRange) }
    if (activeTab === 'overview') {
      const paramsFor = (range) => {
        if (!range) return {}
        const now = new Date()
        if (range === 'lastMonth') {
          const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endPrev = new Date(now.getFullYear(), now.getMonth(), 0); endPrev.setHours(23,59,59,999)
          return { from: startPrev.toISOString(), to: endPrev.toISOString() }
        }
        const { from, to } = rangeToFromTo(range)
        return { from, to }
      }
      axiosInstance.get('/finance/transactions', { params: { type: 'INCOME', ...paramsFor(overviewRange) } }).then(r=>setOverviewIncomeTx(r.data||[])).catch(()=>setOverviewIncomeTx([]))
      axiosInstance.get('/finance/transactions', { params: { type: 'EXPENSE', ...paramsFor(overviewRange) } }).then(r=>setOverviewExpenseTx(r.data||[])).catch(()=>setOverviewExpenseTx([]))
      // Always fetch last 7 days (today and past 6 days) for the 7-day bar chart, ignoring filters
      const nowIso = new Date().toISOString()
      const d7 = new Date(); d7.setDate(d7.getDate() - 6)
      const from7 = d7.toISOString()
      axiosInstance.get('/finance/transactions', { params: { type: 'INCOME', from: from7, to: nowIso } }).then(r=>setOverviewIncome7d(r.data||[])).catch(()=>setOverviewIncome7d([]))
      axiosInstance.get('/finance/transactions', { params: { type: 'EXPENSE', from: from7, to: nowIso } }).then(r=>setOverviewExpense7d(r.data||[])).catch(()=>setOverviewExpense7d([]))
      fetchIncomeBySource(overviewRange)
      fetchCompanyIncome(overviewRange)
      fetchDeliveryIncome(overviewRange)
      fetchDriverPayouts(overviewRange, driverRate)
      fetchFarmerPayouts(overviewRange)
    }
    if (activeTab === 'reports' || activeTab === 'export') fetchAllTransactions()
  }, [activeTab, overviewRange, incomeRange, driverRange, farmerRange, driverRate])

  React.useEffect(() => { if (activeTab === 'expenses') fetchDriverPayouts(driverRange, driverRate) }, [driverRange, driverRate])
  React.useEffect(() => { if (activeTab === 'expenses') fetchFarmerPayouts(farmerRange) }, [farmerRange])

  React.useEffect(() => {
    if (activeTab === 'income') fetchCompanyIncome(incomeRange)
    if (activeTab === 'income') fetchDeliveryIncome(incomeRange)
    if (activeTab === 'income') fetchIncomeBySource(incomeRange)
  }, [incomeRange])
  const fetchCompanyIncome = async (range = 'month') => {
    try {
      const params = (() => {
        if (!range) return {}
        if (range === 'lastMonth') {
          const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endPrev = new Date(now.getFullYear(), now.getMonth(), 0); endPrev.setHours(23,59,59,999)
          return { from: startPrev.toISOString(), to: endPrev.toISOString() }
        }
        const { from, to } = rangeToFromTo(range)
        return { from, to }
      })()
      const res = await axiosInstance.get('/finance/income/orders', { params })
      setCompanyIncome(res.data || { totalsByType: { inventory: 0, rental: 0, listingCommission: 0, listingPassThrough: 0 }, totalIncome: 0, items: [] })
    } catch {}
  }

  const fetchDeliveryIncome = async (range = 'month') => {
    try {
      const params = (() => {
        if (!range) return {}
        if (range === 'lastMonth') {
          const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endPrev = new Date(now.getFullYear(), now.getMonth(), 0); endPrev.setHours(23,59,59,999)
          return { from: startPrev.toISOString(), to: endPrev.toISOString() }
        }
        const { from, to } = rangeToFromTo(range)
        return { from, to }
      })()
      const res = await axiosInstance.get('/finance/income/delivery-fees', { params })
      setDeliveryIncome(res.data || { total: 0, count: 0, items: [] })
    } catch { setDeliveryIncome({ total: 0, count: 0, items: [] }) }
  }

  const fetchIncomeBySource = async (range = 'month') => {
    try {
      const params = (() => {
        if (!range) return {}
        const { from, to } = range === 'lastMonth' ? (()=>{
          const now = new Date(); const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1); const endPrev = new Date(now.getFullYear(), now.getMonth(), 0); endPrev.setHours(23,59,59,999); return { from: startPrev.toISOString(), to: endPrev.toISOString() }
        })() : rangeToFromTo(range)
        return { from, to }
      })()
      const res = await axiosInstance.get('/finance/income/by-source', { params })
      setSourceTotals(res.data || { deliveryFees: 0, listingCommission: 0, rentalFees: 0, manualIncome: 0, recurringIncome: 0, total: 0 })
    } catch { setSourceTotals({ deliveryFees: 0, listingCommission: 0, rentalFees: 0, manualIncome: 0, recurringIncome: 0, total: 0 }) }
  }

  const onFileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleCreate = async () => {
    try {
      setCreating(true)
      const payload = { ...form }
      if (!payload.amount || Number.isNaN(Number(payload.amount))) return
      payload.amount = Number(payload.amount)
      if (!payload.date) payload.date = new Date().toISOString()
      await axiosInstance.post('/finance/transactions', payload)
      setForm({ type: form.type, amount: '', date: '', category: '', description: '', source: '', receiptBase64: '' })
      if (form.type === 'INCOME') fetchTransactions('INCOME'); else fetchTransactions('EXPENSE')
      reloadSummary()
    } catch (_) {
      // silent
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id, type) => {
    try {
      await axiosInstance.delete(`/finance/transactions/${id}`)
      if (type === 'INCOME') fetchTransactions('INCOME'); else fetchTransactions('EXPENSE')
      reloadSummary()
    } catch (_) {}
  }

  // Reports data
  const fetchAllTransactions = async () => {
    setLoadingReports(true)
    try {
      const [inc, exp] = await Promise.all([
        axiosInstance.get('/finance/transactions', { params: { type: 'INCOME' } }),
        axiosInstance.get('/finance/transactions', { params: { type: 'EXPENSE' } }),
      ])
      setAllTransactions([...(inc.data||[]), ...(exp.data||[])])
    } catch { setAllTransactions([]) } finally { setLoadingReports(false) }
  }

  const buildMonthlyBuckets = () => {
    const now = new Date()
    const labels = []
    const incomeSeries = []
    const expenseSeries = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      labels.push(d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }))
      const monthIncome = allTransactions.filter(t => t.type==='INCOME' && new Date(t.date).getFullYear()===d.getFullYear() && new Date(t.date).getMonth()===d.getMonth()).reduce((s,t)=>s + Number(t.amount||0),0)
      const monthExpense = allTransactions.filter(t => t.type==='EXPENSE' && new Date(t.date).getFullYear()===d.getFullYear() && new Date(t.date).getMonth()===d.getMonth()).reduce((s,t)=>s + Number(t.amount||0),0)
      incomeSeries.push(monthIncome)
      expenseSeries.push(monthExpense)
    }
    return { labels, incomeSeries, expenseSeries }
  }

  const rangeToFromTo = (range) => {
    const now = new Date()
    // Today: start of calendar day -> now
    if (range === 'day') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return { from: startOfToday.toISOString(), to: new Date().toISOString() }
    }
    // This Week: Monday 00:00 -> now (ISO week with Monday as first day)
    if (range === 'week') {
      const day = now.getDay() || 7 // Sunday=0 -> 7
      const monday = new Date(now)
      monday.setDate(now.getDate() - (day - 1))
      monday.setHours(0,0,0,0)
      return { from: monday.toISOString(), to: new Date().toISOString() }
    }
    // This Month: first day of month 00:00 -> now
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: startOfMonth.toISOString(), to: new Date().toISOString() }
  }

  const fetchDriverPayouts = async (range, rate) => {
    try {
      const params = (() => {
        const base = { rateType: rate.type, rateValue: rate.value }
        if (!range) return base
        const { from, to } = range === 'lastMonth' ? (()=>{
          const now = new Date(); const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1); const endPrev = new Date(now.getFullYear(), now.getMonth(), 0); endPrev.setHours(23,59,59,999); return { from: startPrev.toISOString(), to: endPrev.toISOString() }
        })() : rangeToFromTo(range)
        return { ...base, from, to }
      })()
      const res = await axiosInstance.get('/finance/expenses/driver-payouts', { params })
      setDriverPayouts(res.data || { total: 0, count: 0, items: [] })
    } catch {}
  }

  const fetchFarmerPayouts = async (range) => {
    try {
      const params = (() => {
        if (!range) return {}
        const { from, to } = range === 'lastMonth' ? (()=>{
          const now = new Date(); const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1); const endPrev = new Date(now.getFullYear(), now.getMonth(), 0); endPrev.setHours(23,59,59,999); return { from: startPrev.toISOString(), to: endPrev.toISOString() }
        })() : rangeToFromTo(range)
        return { from, to }
      })()
      const res = await axiosInstance.get('/finance/expenses/farmer-payouts', { params })
      setFarmerPayouts(res.data || { total: 0, items: [], commissionPercent: 15 })
    } catch {}
  }

  const downloadCSV = () => {
    const headers = ['Date','Type','Category','Source','Description','Amount']
    const rows = allTransactions
      .sort((a,b)=>new Date(b.date)-new Date(a.date))
      .map(t=>[
        new Date(t.date).toISOString().slice(0,10),
        t.type,
        t.category||'',
        t.source||'',
        (t.description||'').replace(/\n/g,' '),
        String(t.type==='INCOME' ? Number(t.amount||0) : -Number(t.amount||0))
      ])
    const csv = [headers, ...rows].map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agrolink-finance-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPDF = async () => {
    try {
      const pdf = new jsPDF('p','mm','a4')
      // simple header with logo
      try {
        const tempDiv = document.createElement('div')
        tempDiv.style.position = 'absolute'; tempDiv.style.left = '-9999px'; tempDiv.style.top='-9999px'; tempDiv.style.width='60px'; tempDiv.style.height='60px'; tempDiv.style.display='flex'; tempDiv.style.alignItems='center'; tempDiv.style.justifyContent='center';
        tempDiv.innerHTML = `<img src="${logoImg}" style="max-width:100%;max-height:100%;object-fit:contain;" />`
        document.body.appendChild(tempDiv)
        const canvas = await html2canvas(tempDiv, { width:60, height:60, backgroundColor:null, scale:2 })
        document.body.removeChild(tempDiv)
        const logoDataURL = canvas.toDataURL('image/png')
        pdf.addImage(logoDataURL,'PNG',15,10,14,14)
      } catch {}
      pdf.setFont('helvetica','bold'); pdf.setFontSize(16); pdf.text('Finance Report', 35, 18)
      pdf.setFont('helvetica','normal'); pdf.setFontSize(10); pdf.text(`Generated on ${new Date().toLocaleString()}`, 35, 24)

      const tableRows = allTransactions.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(t=>[
        new Date(t.date).toLocaleDateString(), t.type, t.category||'—', t.source||'—', t.description||'—', (t.type==='INCOME'?'+':'-') + ' LKR ' + Number(t.amount||0).toLocaleString()
      ])
      autoTable(pdf, {
        head: [[ 'Date','Type','Category','Source','Description','Amount' ]],
        body: tableRows,
        startY: 32,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [34,197,94] },
        columnStyles: { 4: { cellWidth: 70 } }
      })
      pdf.save(`agrolink-finance-${new Date().toISOString().slice(0,10)}.pdf`)
    } catch {}
  }

  // Shared PDF header/footer to match Inventory PDFs exactly
  const drawFinancePdfHeader = async (pdf, title) => {
    // Top green and black bar (3/4 green, 1/4 black)
    pdf.setFillColor(13, 126, 121)
    pdf.rect(0, 0, 157.5, 8, 'F')
    pdf.setFillColor(0, 0, 0)
    pdf.rect(157.5, 0, 52.5, 8, 'F')

    // Spacer and main area
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 8, 210, 5, 'F')
    pdf.rect(0, 13, 210, 25, 'F')

    // Logo via html2canvas for consistent rendering
    try {
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '60px'
      tempDiv.style.height = '60px'
      tempDiv.style.display = 'flex'
      tempDiv.style.alignItems = 'center'
      tempDiv.style.justifyContent = 'center'
      tempDiv.innerHTML = `<img src="${logoImg}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />`
      document.body.appendChild(tempDiv)
      const canvas = await html2canvas(tempDiv, { width: 60, height: 60, backgroundColor: null, scale: 2 })
      document.body.removeChild(tempDiv)
      const logoDataURL = canvas.toDataURL('image/png')
      pdf.addImage(logoDataURL, 'PNG', 15, 13, 16, 16)
    } catch {}

    // Gradient brand text
    pdf.setFontSize(18); pdf.setFont('helvetica', 'bold')
    const startColor = { r: 0, g: 128, b: 111 }
    const endColor = { r: 139, g: 195, b: 75 }
    const text = 'AgroLink'
    const startX = 35
    const letterPositions = [0, 4, 7.5, 9.5, 12.8, 16.7, 18.3, 21.5]
    for (let i = 0; i < text.length; i++) {
      const progress = i / (text.length - 1)
      const r = Math.round(startColor.r + (endColor.r - startColor.r) * progress)
      const g = Math.round(startColor.g + (endColor.g - startColor.g) * progress)
      const b = Math.round(startColor.b + (endColor.b - startColor.b) * progress)
      pdf.setTextColor(r, g, b)
      pdf.text(text[i], startX + letterPositions[i], 23)
    }
    // Tagline
    pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 100, 100)
    pdf.text('Agricultural Technology Solutions', 35, 27)

    // Vertical separator line
    pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.5); pdf.line(120, 17, 120, 33)

    // Contact info right side
    pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(0, 0, 0)
    pdf.text('Phone:', 130, 21); pdf.setFont('helvetica', 'normal'); pdf.text('+94 71 920 7688', 145, 21)
    pdf.setFont('helvetica', 'bold'); pdf.text('Web:', 130, 25); pdf.setFont('helvetica', 'normal'); pdf.text('www.AgroLink.org', 145, 25)
    pdf.setFont('helvetica', 'bold'); pdf.text('Address:', 130, 29); pdf.setFont('helvetica', 'normal'); pdf.text('States Rd, Colombo 04, Sri Lanka', 145, 29)

    // Bottom separator
    pdf.setDrawColor(13, 126, 121); pdf.setLineWidth(1); pdf.line(20, 40, 190, 40)

    // Title + generated line
    pdf.setTextColor(0, 0, 0); pdf.setFontSize(18); pdf.setFont('helvetica', 'bold'); pdf.text(title, 20, 55)
    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 63)

    return 75
  }

  const drawFinancePdfFooter = (pdf) => {
    const pageCount = pdf.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      // Footer line
      pdf.setDrawColor(13, 126, 121); pdf.setLineWidth(1); pdf.line(20, 280, 190, 280)
      // Footer text
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 100, 100)
      pdf.text('AgroLink - Agricultural Technology Solutions', 20, 285)
      pdf.text(`Page ${i} of ${pageCount}`, 160, 285)
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 290)
    }
  }

  const exportOverviewPDF = async () => {
    try {
      const pdf = new jsPDF('p','mm','a4')
      const startY = await drawFinancePdfHeader(pdf, 'Finance Overview')

      // Summary calculations
      const orderIncome = Number(companyIncome.totalsByType.inventory||0) + Number(companyIncome.totalsByType.rental||0)
      const listingIncome = Number(companyIncome.totalsByType.listingCommission||0) + Number(companyIncome.totalsByType.listingPassThrough||0)
      const deliveryIncomeTotal = Number(deliveryIncome.total||0)
      const totalIncome = orderIncome + listingIncome + deliveryIncomeTotal
      const driverTotal = (driverPayouts.totalsByDriver||[]).reduce((s,d)=> s + (Number(d.deliveries||0)*Number(driverRate||300)), 0)
      const farmerTotal = Number(farmerPayouts.total||0)
      const totalExpenses = driverTotal + farmerTotal
      const netProfit = totalIncome - totalExpenses

      autoTable(pdf, {
        head: [[ 'Metric','Amount' ]],
        body: [
          ['Net Profit', `LKR ${Number(netProfit||0).toLocaleString()}`],
          ['Total Income', `LKR ${Number(totalIncome||0).toLocaleString()}`],
          ['Total Expenses', `LKR ${Number(totalExpenses||0).toLocaleString()}`],
        ],
        startY,
        styles: { font:'helvetica', fontSize:10 },
        headStyles: { fillColor: [34,197,94] }
      })

      // Income by Source
      autoTable(pdf, {
        head: [[ 'Income by Source','Amount' ]],
        body: [
          ['Inventory Sales Income', `LKR ${Number(companyIncome?.totalsByType?.inventory||0).toLocaleString()}`],
          ['Equipment Rental Income', `LKR ${Number(companyIncome?.totalsByType?.rental||0).toLocaleString()}`],
          ['Platform Listing Fees', `LKR ${Number((companyIncome?.totalsByType?.listingCommission||0) + (companyIncome?.totalsByType?.listingPassThrough||0)).toLocaleString()}`],
          ['Logistics & Delivery Income', `LKR ${Number(deliveryIncome?.total||0).toLocaleString()}`],
        ],
        startY: (pdf.lastAutoTable && pdf.lastAutoTable.finalY) ? (pdf.lastAutoTable.finalY + 8) : 32,
        styles: { font:'helvetica', fontSize:10 },
        headStyles: { fillColor: [17,24,39] }
      })

      // Expenses by Category
      autoTable(pdf, {
        head: [[ 'Expenses by Category','Amount' ]],
        body: [
          ['Driver Payments', `LKR ${Number(driverTotal||0).toLocaleString()}`],
          ['Farmer Payments', `LKR ${Number(farmerTotal||0).toLocaleString()}`],
        ],
        startY: (pdf.lastAutoTable && pdf.lastAutoTable.finalY) ? (pdf.lastAutoTable.finalY + 8) : 32,
        styles: { font:'helvetica', fontSize:10 },
        headStyles: { fillColor: [17,24,39] }
      })

      drawFinancePdfFooter(pdf)
      pdf.save(`AgroLink-Finance-Overview-${new Date().toISOString().slice(0,10)}.pdf`)
    } catch {}
  }

  const exportIncomePDF = async () => {
    try {
      const pdf = new jsPDF('p','mm','a4')
      const startY = await drawFinancePdfHeader(pdf, 'Income Report')

      // Summary
      autoTable(pdf, {
        head: [[ 'Metric','Amount' ]],
        body: [
          ['Orders Income • Inventory', `LKR ${Number(companyIncome?.totalsByType?.inventory||0).toLocaleString()}`],
          ['Orders Income • Rentals', `LKR ${Number(companyIncome?.totalsByType?.rental||0).toLocaleString()}`],
          ['Orders Income • Listings', `LKR ${Number((companyIncome?.totalsByType?.listingCommission||0) + (companyIncome?.totalsByType?.listingPassThrough||0)).toLocaleString()}`],
          ['Delivery Fees', `LKR ${Number(deliveryIncome?.total||0).toLocaleString()}`],
        ],
        startY,
        styles: { font:'helvetica', fontSize:10 },
        headStyles: { fillColor: [34,197,94] }
      })

      // Order-based Income Details
      const orderRows = (companyIncome.items||[])
        .slice()
        .sort((a,b)=> new Date(b.createdAt||b.date||0) - new Date(a.createdAt||a.date||0))
        .map(row => [
          row.orderNumber || row.orderId,
          row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—',
          String(row.itemType||'').toUpperCase(),
          row.title,
          row.quantity,
          `LKR ${Number(row.unitPrice||0).toLocaleString()}`,
          `LKR ${Number(row.lineTotal||0).toLocaleString()}`
        ])
      autoTable(pdf, {
        head: [[ 'Order','Created','Type','Item','Qty','Unit','Line Total' ]],
        body: orderRows,
        startY: (pdf.lastAutoTable && pdf.lastAutoTable.finalY) ? (pdf.lastAutoTable.finalY + 8) : startY,
        styles: { font:'helvetica', fontSize:9 },
        headStyles: { fillColor: [17,24,39] },
        columnStyles: { 3: { cellWidth: 60 } }
      })

      // Delivery Fee Income Details
      const deliveryRows = (deliveryIncome.items||[])
        .slice()
        .sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0))
        .map(row => [
          row.orderNumber || row.orderId,
          row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—',
          `LKR ${Number(row.deliveryFee||0).toLocaleString()}`
        ])
      autoTable(pdf, {
        head: [[ 'Order','Created','Delivery Fee' ]],
        body: deliveryRows,
        startY: (pdf.lastAutoTable && pdf.lastAutoTable.finalY) ? (pdf.lastAutoTable.finalY + 8) : startY,
        styles: { font:'helvetica', fontSize:9 },
        headStyles: { fillColor: [17,24,39] }
      })
      drawFinancePdfFooter(pdf)
      pdf.save(`AgroLink-Finance-Income-${new Date().toISOString().slice(0,10)}.pdf`)
    } catch {}
  }

  const exportExpensesPDF = async () => {
    try {
      const pdf = new jsPDF('p','mm','a4')
      const startY = await drawFinancePdfHeader(pdf, 'Expenses Report')

      const driverTotal = (driverPayouts.totalsByDriver||[]).reduce((s,d)=> s + (Number(d.deliveries||0)*Number(driverRate||300)), 0)
      const farmerTotal = Number(farmerPayouts.total||0)

      autoTable(pdf, {
        head: [[ 'Category','Amount' ]],
        body: [
          ['Driver Payments', `LKR ${Number(driverTotal||0).toLocaleString()}`],
          ['Farmer Payments', `LKR ${Number(farmerTotal||0).toLocaleString()}`],
        ],
        startY,
        styles: { font:'helvetica', fontSize:10 },
        headStyles: { fillColor: [34,197,94] }
      })

      const driverRows = (driverPayouts.totalsByDriver||[])
        .slice()
        .sort((a,b)=> Number(b.deliveries||0) - Number(a.deliveries||0))
        .map(d => [ d.driverName || d.driver || '—', Number(d.deliveries||0), `LKR ${Number((Number(d.deliveries||0)*Number(driverRate||300))||0).toLocaleString()}` ])
      autoTable(pdf, {
        head: [[ 'Driver','Deliveries','Payout' ]],
        body: driverRows,
        startY: (pdf.lastAutoTable && pdf.lastAutoTable.finalY) ? (pdf.lastAutoTable.finalY + 8) : startY,
        styles: { font:'helvetica', fontSize:9 },
        headStyles: { fillColor: [17,24,39] }
      })
      drawFinancePdfFooter(pdf)
      pdf.save(`AgroLink-Finance-Expenses-${new Date().toISOString().slice(0,10)}.pdf`)
    } catch {}
  }

  // Budgets
  const fetchBudgets = async () => {
    setLoadingBudgets(true)
    try {
      const res = await axiosInstance.get('/finance/budgets')
      setBudgets(res.data || [])
      const util = await axiosInstance.get('/finance/budgets/utilization')
      setUtilization(util.data || [])
    } catch { setBudgets([]) } finally { setLoadingBudgets(false) }
  }
  const createBudget = async () => {
    try {
      const payload = {
        ...budgetForm,
        amount: Number(budgetForm.amount || 0),
        alertThreshold: Number(budgetForm.alertThreshold || 0.8),
        categories: (budgetForm.categories || '').split(',').map(s=>s.trim()).filter(Boolean)
      }
      await axiosInstance.post('/finance/budgets', payload)
      setBudgetForm({ name: '', period: 'MONTHLY', amount: '', categories: '', alertThreshold: '0.8', notifyEmail: '' })
      fetchBudgets()
    } catch {}
  }
  const deleteBudget = async (id) => { try { await axiosInstance.delete(`/finance/budgets/${id}`); fetchBudgets() } catch {} }

  // Goals
  const fetchGoals = async () => {
    setLoadingGoals(true)
    try { const res = await axiosInstance.get('/finance/goals'); setGoals(res.data || []) } catch { setGoals([]) } finally { setLoadingGoals(false) }
  }
  const createGoal = async () => {
    try {
      const payload = { ...goalForm, targetAmount: Number(goalForm.targetAmount || 0) }
      await axiosInstance.post('/finance/goals', payload)
      setGoalForm({ title: '', targetAmount: '', dueDate: '' })
      fetchGoals()
    } catch {}
  }
  const deleteGoal = async (id) => { try { await axiosInstance.delete(`/finance/goals/${id}`); fetchGoals() } catch {} }

  // Debts
  const fetchDebts = async () => {
    setLoadingDebts(true)
    try { const res = await axiosInstance.get('/finance/debts'); setDebts(res.data || []) } catch { setDebts([]) } finally { setLoadingDebts(false) }
  }
  const createDebt = async () => {
    try {
      const payload = { ...debtForm, principal: Number(debtForm.principal || 0), interestRate: Number(debtForm.interestRate || 0) }
      await axiosInstance.post('/finance/debts', payload)
      setDebtForm({ type: 'BORROWED', party: '', principal: '', interestRate: '', dueDate: '' })
      fetchDebts()
    } catch {}
  }
  const deleteDebt = async (id) => { try { await axiosInstance.delete(`/finance/debts/${id}`); fetchDebts() } catch {} }

  // Recurring
  const fetchRecurring = async () => {
    setLoadingRecurring(true)
    try { const res = await axiosInstance.get('/finance/recurring'); setRecurrings(res.data || []) } catch { setRecurrings([]) } finally { setLoadingRecurring(false) }
  }
  const createRecurring = async () => {
    try {
      const payload = { ...recurringForm, amount: Number(recurringForm.amount || 0) }
      await axiosInstance.post('/finance/recurring', payload)
      setRecurringForm({ title: '', type: 'EXPENSE', amount: '', cadence: 'MONTHLY', nextRunAt: '', category: '' })
      fetchRecurring()
    } catch {}
  }
  const deleteRecurring = async (id) => { try { await axiosInstance.delete(`/finance/recurring/${id}`); fetchRecurring() } catch {} }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-3xl font-semibold ml-2'>Finance Tracker</h1>
            <p className='text-sm text-gray-500 ml-2'>Monitor income, expenses, budgets and goals</p>
          </div>
          <div className='flex items-center gap-2'>
            <button className='px-3 py-2 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-2'><CalendarRange className='size-4' /> This Month</button>
            <button className='px-3 py-2 text-sm rounded-xl bg-primary-600 text-white hover:bg-green-700 inline-flex items-center gap-2'><FileDown className='size-4' /> Export</button>
          </div>
        </div>

        <div className='grid grid-cols-[240px,1fr] gap-6'>
          <AdminSidebar activePage='finance' />

          <div className='space-y-6'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
              <div className='px-4 pt-4'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                <div className='flex flex-wrap gap-2'>
                  {TABS.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      className={`px-3 py-2 rounded-lg text-sm border ${activeTab === t.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                  </div>
                  <div className='flex items-center gap-2'>
                    {activeTab === 'overview' && (
                      <button onClick={exportOverviewPDF} className='px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-900 inline-flex items-center gap-2'><FileDown className='size-4'/> Export PDF</button>
                    )}
                    {activeTab === 'income' && (
                      <button onClick={exportIncomePDF} className='px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-900 inline-flex items-center gap-2'><FileDown className='size-4'/> Export PDF</button>
                    )}
                    {activeTab === 'expenses' && (
                      <button onClick={exportExpensesPDF} className='px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-900 inline-flex items-center gap-2'><FileDown className='size-4'/> Export PDF</button>
                    )}
                  </div>
                </div>
              </div>
              <div className='px-4 pb-4'>
                <div className='border-t border-gray-100 mt-3 pt-4' />
                {activeTab === 'overview' && (
                  <div className='space-y-6'>
                    <div className='flex items-center gap-2'>
                      <button onClick={()=>setOverviewRange(r=> r==='lastMonth' ? '' : 'lastMonth')} className={`px-3 py-2 text-sm rounded-lg border ${overviewRange==='lastMonth'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>Last Month</button>
                      <button onClick={()=>setOverviewRange(r=> r==='month' ? '' : 'month')} className={`px-3 py-2 text-sm rounded-lg border ${overviewRange==='month'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>This Month</button>
                      <button onClick={()=>setOverviewRange(r=> r==='week' ? '' : 'week')} className={`px-3 py-2 text-sm rounded-lg border ${overviewRange==='week'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>This Week</button>
                      <button onClick={()=>setOverviewRange(r=> r==='day' ? '' : 'day')} className={`px-3 py-2 text-sm rounded-lg border ${overviewRange==='day'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>Today</button>
                    </div>
                    
                    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                      {(() => {
                        const orderIncome = Number(companyIncome.totalsByType.inventory||0) + Number(companyIncome.totalsByType.rental||0)
                        const listingIncome = Number(companyIncome.totalsByType.listingCommission||0) + Number(companyIncome.totalsByType.listingPassThrough||0)
                        const deliveryIncomeTotal = Number(deliveryIncome.total||0)
                        const totalIncome = orderIncome + listingIncome + deliveryIncomeTotal

                        const driverTotal = (driverPayouts.totalsByDriver||[]).reduce((s,d)=> s + (Number(d.deliveries||0)*300), 0)
                        const farmerTotal = Number(farmerPayouts.total||0)
                        const totalExpenses = driverTotal + farmerTotal

                        const netProfit = totalIncome - totalExpenses
                        return (
                          <>
                            <StatCard icon={Wallet} title='Net Profit' value={`LKR ${netProfit.toLocaleString()}`} trend='' positive={netProfit >= 0} />
                            <StatCard icon={TrendingUp} title='Total Income' value={`LKR ${totalIncome.toLocaleString()}`} trend='' positive />
                            <StatCard icon={Receipt} title='Total Expenses' value={`LKR ${totalExpenses.toLocaleString()}`} trend='' positive={false} />
                            <StatCard icon={Target} title='Savings Progress' value='—' trend='' positive />
                          </>
                        )
                      })()}
                    </div>
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                          <div className='flex items-center justify-between mb-2'>
                            <div className='flex items-center gap-2 text-gray-800 font-semibold'>
                              <PieChart className='size-5 text-gray-500' />
                              <span>Income by Source</span>
                            </div>
                          </div>
                          {(() => {
                            const labels = [
                              'Inventory Sales Income',
                              'Equipment Rental Income',
                              'Platform Listing Fees',
                              'Logistics & Delivery Income',
                            ]
                            const series = [
                              Number((companyIncome?.totalsByType?.inventory)||0),
                              Number((companyIncome?.totalsByType?.rental)||0),
                              Number((companyIncome?.totalsByType?.listingCommission)||0) + Number((companyIncome?.totalsByType?.listingPassThrough)||0),
                              Number((deliveryIncome?.total)||0),
                            ]
                            const hasData = series.some(v=>v>0)
                            return hasData ? (
                              <Chart type='donut' height={260} options={{
                                chart:{ toolbar:{ show:false }}, labels,
                                legend:{ show: true, position:'bottom' }, dataLabels:{ enabled:false },
                                colors:['#22c55e','#8b5cf6','#f59e0b','#3b82f6']
                              }} series={series} />
                            ) : (
                              <div className='text-sm text-gray-500'>No income in this range</div>
                            )
                          })()}
                        </div>
                        <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                          <div className='flex items-center justify-between mb-2'>
                            <div className='flex items-center gap-2 text-gray-800 font-semibold'>
                              <PieChart className='size-5 text-gray-500' />
                              <span>Expenses by Category</span>
                            </div>
                          </div>
                          {(() => {
                            const driverTotal = (driverPayouts.totalsByDriver||[]).reduce((s,d)=> s + (Number(d.deliveries||0)*300), 0)
                            const farmerTotal = Number(farmerPayouts.total||0)
                            const labels = ['Driver Payments','Farmer Payments']
                            const series = [driverTotal, farmerTotal]
                            const hasData = series.some(v=>Number(v)>0)
                            return hasData ? (
                              <Chart type='donut' height={260} options={{
                                chart:{ toolbar:{ show:false }}, labels,
                                legend:{ show: true, position:'bottom' }, dataLabels:{ enabled:false },
                                colors:['#ef4444', '#3b82f6']
                              }} series={series} />
                            ) : (
                              <div className='text-sm text-gray-500'>No expenses in this range</div>
                            )
                          })()}
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'income' && (
                  <div className='space-y-6'>
                    <div className='flex items-center gap-2'>
                      <button onClick={()=>setIncomeRange(r=> r==='lastMonth' ? '' : 'lastMonth')} className={`px-3 py-2 text-sm rounded-lg border ${incomeRange==='lastMonth'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>Last Month</button>
                      <button onClick={()=>setIncomeRange(r=> r==='month' ? '' : 'month')} className={`px-3 py-2 text-sm rounded-lg border ${incomeRange==='month'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>This Month</button>
                      <button onClick={()=>setIncomeRange(r=> r==='week' ? '' : 'week')} className={`px-3 py-2 text-sm rounded-lg border ${incomeRange==='week'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>This Week</button>
                      <button onClick={()=>setIncomeRange(r=> r==='day' ? '' : 'day')} className={`px-3 py-2 text-sm rounded-lg border ${incomeRange==='day'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>Today</button>
                    </div>
                    
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                      <div className='bg-white border border-gray-200 rounded-2xl p-4'>
                        <div className='text-xs text-gray-500'>Orders Income • Inventory</div>
                        <div className='text-xl font-semibold mt-1'>LKR {Number(companyIncome.totalsByType.inventory||0).toLocaleString()}</div>
                      </div>
                      <div className='bg-white border border-gray-200 rounded-2xl p-4'>
                        <div className='text-xs text-gray-500'>Orders Income • Rentals</div>
                        <div className='text-xl font-semibold mt-1'>LKR {Number(companyIncome.totalsByType.rental||0).toLocaleString()}</div>
                      </div>
                      <div className='bg-white border border-gray-200 rounded-2xl p-4'>
                        <div className='text-xs text-gray-500'>Orders Income • Listings</div>
                        <div className='text-xl font-semibold mt-1'>LKR {Number((companyIncome.totalsByType.listingCommission||0) + (companyIncome.totalsByType.listingPassThrough||0)).toLocaleString()}</div>
                      </div>
                      <div className='bg-white border border-gray-200 rounded-2xl p-4'>
                        <div className='text-xs text-gray-500'>Delivery Fees</div>
                        <div className='text-xl font-semibold mt-1'>LKR {Number(deliveryIncome.total||0).toLocaleString()}</div>
                      </div>
                    </div>
                    {/* removed charts from Income; moved to Overview */}
                    <div className='bg-white border border-gray-200 rounded-2xl'>
                      <div className='p-5'>
                        <SectionHeader
                          icon={TrendingUp}
                          title='Order-based Income Details'
                          action={
                            <div className='flex items-center gap-2'>
                              <button onClick={()=>setShowOrderIncomeDetails(v=>!v)} className='border rounded-md px-2 py-1.5 hover:bg-gray-50'>
                                <ChevronDown className={`size-4 transition-transform ${showOrderIncomeDetails ? '' : '-rotate-90'}`} />
                              </button>
                              <select
                                className='border rounded-md px-3 py-1.5 text-sm'
                                value={incomeTypeFilter}
                                onChange={(e)=>setIncomeTypeFilter(e.target.value)}
                              >
                                <option value='all'>All Types</option>
                                <option value='inventory'>Inventory</option>
                                <option value='rental'>Rental</option>
                              </select>
                            </div>
                          }
                        />
                      </div>
                      {showOrderIncomeDetails && (
                      <div className='overflow-x-auto'>
                        <table className='min-w-full text-sm'>
                          <thead>
                            <tr className='text-left text-gray-500 border-t border-b'>
                              <th className='py-3 px-5'>Order</th>
                              <th className='py-3 px-5'>Created</th>
                              <th className='py-3 px-5'>Type</th>
                              <th className='py-3 px-5'>Item</th>
                              <th className='py-3 px-5'>Qty</th>
                              <th className='py-3 px-5'>Unit</th>
                              <th className='py-3 px-5'>Line Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {companyIncome.items.length === 0 ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={7}>No order income yet</td></tr>
                            ) : (companyIncome.items
                                  .slice()
                                  .sort((a,b)=> new Date(b.createdAt||b.date||0) - new Date(a.createdAt||a.date||0))
                                  .filter(row => {
                                    if (incomeTypeFilter === 'all') return row.itemType !== 'listing'
                                    return row.itemType === incomeTypeFilter
                                  })
                                  .map((row, idx) => (
                              <tr key={idx} className='border-b last:border-b-0'>
                                <td className='py-3 px-5 text-gray-700'>{row.orderNumber || row.orderId}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
                                <td className='py-3 px-5 text-gray-700 capitalize'>{row.itemType}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.title}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.quantity}</td>
                                <td className='py-3 px-5 text-gray-700'>LKR {Number(row.unitPrice||0).toLocaleString()}</td>
                                <td className='py-3 px-5 font-medium text-green-600'>LKR {Number(row.lineTotal||0).toLocaleString()}</td>
                              </tr>
                            )))}
                          </tbody>
                        </table>
                      </div>
                      )}
                    </div>

                    {/* Income by Source donut moved to Overview */}

                    {/* Listing Income Details (moved out of Order-based table) */}
                    <div className='bg-white border border-gray-200 rounded-2xl'>
                      <div className='p-5 flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <SectionHeader icon={TrendingUp} title='Listing Income Details' />
                        </div>
                        <div>
                          <button onClick={()=>setShowListingIncome(v=>!v)} className='border rounded-md px-2 py-1.5 hover:bg-gray-50'>
                            <ChevronDown className={`size-4 transition-transform ${showListingIncome ? '' : '-rotate-90'}`} />
                          </button>
                        </div>
                      </div>
                      {showListingIncome && (
                      <div className='overflow-x-auto'>
                        <table className='min-w-full text-sm'>
                          <thead>
                            <tr className='text-left text-gray-500 border-t border-b'>
                              <th className='py-3 px-5'>Order</th>
                              <th className='py-3 px-5'>Created</th>
                              <th className='py-3 px-5'>Item</th>
                              <th className='py-3 px-5'>Qty</th>
                              <th className='py-3 px-5'>Unit</th>
                              <th className='py-3 px-5'>Line Total</th>
                              <th className='py-3 px-5'>Total<br />Commission</th>
                            </tr>
                          </thead>
                          <tbody>
                            {companyIncome.items.filter(r=>r.itemType==='listing').length === 0 ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={7}>No listing income yet</td></tr>
                            ) : (companyIncome.items
                                  .slice()
                                  .filter(r=>r.itemType==='listing')
                                  .sort((a,b)=> new Date(b.createdAt||b.date||0) - new Date(a.createdAt||a.date||0))
                                  .map((row, idx) => (
                              <tr key={idx} className='border-b last:border-b-0'>
                                <td className='py-3 px-5 text-gray-700'>{row.orderNumber || row.orderId}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.title}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.quantity}</td>
                                <td className='py-3 px-5 text-gray-700'>LKR {Number(row.unitPrice||0).toLocaleString()}</td>
                                <td className='py-3 px-5 font-medium text-green-600'>LKR {Number(row.lineTotal||0).toLocaleString()}</td>
                                <td className='py-3 px-5 text-gray-700'>{`LKR ${Number(row.listingCommission||0).toLocaleString()}`}</td>
                              </tr>
                            )))}
                          </tbody>
                        </table>
                      </div>
                      )}
                    </div>

                    {/* Delivery Fee Income Details */}
                    <div className='bg-white border border-gray-200 rounded-2xl'>
                      <div className='p-5 flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <SectionHeader icon={TrendingUp} title='Delivery Fee Income Details' />
                        </div>
                        <div>
                          <button onClick={()=>setShowDeliveryIncomeDetails(v=>!v)} className='border rounded-md px-2 py-1.5 hover:bg-gray-50'>
                            <ChevronDown className={`size-4 transition-transform ${showDeliveryIncomeDetails ? '' : '-rotate-90'}`} />
                          </button>
                        </div>
                      </div>
                      {showDeliveryIncomeDetails && (
                      <div className='overflow-x-auto'>
                        <table className='min-w-full text-sm'>
                          <thead>
                            <tr className='text-left text-gray-500 border-t border-b'>
                              <th className='py-3 px-5'>Order</th>
                              <th className='py-3 px-5'>Created</th>
                              <th className='py-3 px-5'>Delivery Fee</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deliveryIncome.items.length === 0 ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={3}>No delivery fees</td></tr>
                            ) : deliveryIncome.items
                                  .slice()
                                  .sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0))
                                  .map((row, idx) => (
                              <tr key={idx} className='border-b last:border-b-0'>
                                <td className='py-3 px-5 text-gray-700'>{row.orderNumber || row.orderId}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
                                <td className='py-3 px-5 font-medium text-green-600'>LKR {Number(row.deliveryFee||0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      )}
                    </div>
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <SectionHeader icon={TrendingUp} title='Add Income' />
                      <div className='grid grid-cols-1 md:grid-cols-6 gap-3 text-sm'>
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Amount' type='number' value={form.amount} onChange={e=>setForm(f=>({...f, amount:e.target.value, type:'INCOME'}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Date' type='date' value={form.date?.slice(0,10) || ''} onChange={e=>setForm(f=>({...f, date:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Category' value={form.category} onChange={e=>setForm(f=>({...f, category:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Source' value={form.source} onChange={e=>setForm(f=>({...f, source:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Description' value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-1' type='file' accept='image/*' onChange={async e=>{ const file=e.target.files?.[0]; if(file){ const b64 = await onFileToBase64(file); setForm(f=>({...f, receiptBase64:b64})) }}} />
                      </div>
                      <div className='mt-3'>
                        <button disabled={creating} onClick={handleCreate} className='px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-green-700 disabled:opacity-50'>Save Income</button>
                      </div>
                    </div>
                    <div className='bg-white border border-gray-200 rounded-2xl'>
                      <div className='p-5 flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <SectionHeader icon={TrendingUp} title='Income Records' />
                        </div>
                        <div>
                          <button onClick={()=>setShowIncomeRecords(v=>!v)} className='border rounded-md px-2 py-1.5 hover:bg-gray-50'>
                            <ChevronDown className={`size-4 transition-transform ${showIncomeRecords ? '' : '-rotate-90'}`} />
                          </button>
                        </div>
                      </div>
                      {showIncomeRecords && (
                      <div className='overflow-x-auto'>
                        <table className='min-w-full text-sm'>
                          <thead>
                            <tr className='text-left text-gray-500 border-t border-b'>
                              <th className='py-3 px-5'>Date</th>
                              <th className='py-3 px-5'>Category</th>
                              <th className='py-3 px-5'>Source</th>
                              <th className='py-3 px-5'>Description</th>
                              <th className='py-3 px-5'>Amount</th>
                              <th className='py-3 px-5 text-right'>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingIncome ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={6}>Loading…</td></tr>
                            ) : incomeItems.length === 0 ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={6}>No income records yet</td></tr>
                            ) : incomeItems.map((row) => (
                              <tr key={row._id} className='border-b last:border-b-0'>
                                <td className='py-3 px-5 text-gray-700'>{new Date(row.date).toLocaleDateString()}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.category || '—'}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.source || '—'}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.description || '—'}</td>
                                <td className='py-3 px-5 font-medium text-green-700'>+ LKR {Number(row.amount||0).toLocaleString()}</td>
                                <td className='py-3 px-5 text-right'>
                                  <div className='inline-flex items-center gap-2'>
                                    <button onClick={()=>setSelectedIncome(row)} className='text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50'>Info</button>
                                    <button onClick={()=>handleDelete(row._id,'INCOME')} className='text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50'>Delete</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'expenses' && (
                  <div className='space-y-6'>
                    <div className='flex items-center gap-2'>
                      <button onClick={()=>{ const v = (driverRange==='lastMonth' && farmerRange==='lastMonth') ? '' : 'lastMonth'; setDriverRange(v); setFarmerRange(v) }} className={`px-3 py-2 text-sm rounded-lg border ${driverRange==='lastMonth' && farmerRange==='lastMonth' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>Last Month</button>
                      <button onClick={()=>{ const v = (driverRange==='month' && farmerRange==='month') ? '' : 'month'; setDriverRange(v); setFarmerRange(v) }} className={`px-3 py-2 text-sm rounded-lg border ${driverRange==='month' && farmerRange==='month' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>This Month</button>
                      <button onClick={()=>{ const v = (driverRange==='week' && farmerRange==='week') ? '' : 'week'; setDriverRange(v); setFarmerRange(v) }} className={`px-3 py-2 text-sm rounded-lg border ${driverRange==='week' && farmerRange==='week' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>This Week</button>
                      <button onClick={()=>{ const v = (driverRange==='day' && farmerRange==='day') ? '' : 'day'; setDriverRange(v); setFarmerRange(v) }} className={`px-3 py-2 text-sm rounded-lg border ${driverRange==='day' && farmerRange==='day' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>Today</button>
                    </div>
                    
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <StatCard icon={Receipt} title='Driver Payments' value={`LKR ${((driverPayouts.totalsByDriver||[]).reduce((s,d)=> s + (Number(d.deliveries||0)*300), 0)).toLocaleString()}`} trend='' positive={false} />
                      <StatCard icon={Wallet} title='Farmer Payments' value={`LKR ${Number(farmerPayouts.total||0).toLocaleString()}`} trend='' positive={false} />
                    </div>

                    {/* Farmer payouts (moved above driver payments) */}
                    <div className='bg-white border border-gray-200 rounded-2xl'>
                      <div className='p-5 flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <SectionHeader icon={Receipt} title='Farmer Payments (after commission)' />
                        </div>
                        <div className='flex items-center gap-2'>
                          <select className='border rounded-md px-2 py-1.5 text-sm' value={farmerRange} onChange={e=>setFarmerRange(e.target.value)}>
                            <option value='day'>Last 24h</option>
                            <option value='week'>Last 7 days</option>
                            <option value='month'>This Month</option>
                          </select>
                          <button onClick={()=>setShowFarmerPayments(v=>!v)} className='border rounded-md px-2 py-1.5 hover:bg-gray-50'>
                            <ChevronDown className={`size-4 transition-transform ${showFarmerPayments ? '' : '-rotate-90'}`} />
                          </button>
                        </div>
                      </div>
                      {showFarmerPayments && (
                      <div className='overflow-x-auto'>
                        <table className='min-w-full text-sm'>
                          <thead>
                            <tr className='text-left text-gray-500 border-t border-b'>
                              <th className='py-3 px-5'>Order</th>
                              <th className='py-3 px-5'>Farmer</th>
                              <th className='py-3 px-5'>Item</th>
                              <th className='py-3 px-5'>Qty</th>
                              <th className='py-3 px-5'>Unit</th>
                              <th className='py-3 px-5'>Line Total</th>
                              <th className='py-3 px-5'>Payout</th>
                            </tr>
                          </thead>
                          <tbody>
                            {farmerPayouts.items.length === 0 ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={8}>No payouts</td></tr>
                            ) : farmerPayouts.items
                                .slice()
                                .sort((a,b)=> new Date(b.createdAt||b.date||0) - new Date(a.createdAt||a.date||0))
                                .map((r, i) => (
                              <tr key={i} className='border-b last:border-b-0'>
                                <td className='py-3 px-5 text-gray-700'>
                                  <div>{r.orderNumber || r.orderId}</div>
                                  <div className='text-xs text-gray-500'>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</div>
                                </td>
                                <td className='py-3 px-5 text-gray-700'>
                                  <div>{r.farmerName || '—'}</div>
                                  {r.farmerEmail ? (
                                    <div className='text-xs text-gray-500'>{r.farmerEmail}</div>
                                  ) : null}
                                </td>
                                <td className='py-3 px-5 text-gray-700'>{r.title}</td>
                                <td className='py-3 px-5 text-gray-700'>{r.quantity}</td>
                                <td className='py-3 px-5 text-gray-700'>LKR {Number(r.unitPrice||0).toLocaleString()}</td>
                                <td className='py-3 px-5 text-gray-700'>
                                  <div>LKR {Number(r.lineTotal||0).toLocaleString()}</div>
                                  {(() => {
                                    const commission = Number(r.lineTotal||0) - Number(r.payout||0)
                                    return commission > 0 ? (
                                      <div className='text-xs text-green-700'>- LKR {commission.toLocaleString()}</div>
                                    ) : null
                                  })()}
                                </td>
                                <td className='py-3 px-5 font-medium text-red-700'>LKR {Number(r.payout||0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      )}
                    </div>

                    {/* Driver payouts */}
                    <div className='bg-white border border-gray-200 rounded-2xl'>
                      <div className='p-5 flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <SectionHeader icon={Receipt} title='Driver Payments' />
                        </div>
                        <div className='flex items-center gap-2'>
                          <select className='border rounded-md px-2 py-1.5 text-sm' value={driverRange} onChange={e=>setDriverRange(e.target.value)}>
                            <option value='day'>Last 24h</option>
                            <option value='week'>Last 7 days</option>
                            <option value='month'>This Month</option>
                          </select>
                          <button onClick={()=>setShowDriverPayments(v=>!v)} className='border rounded-md px-2 py-1.5 hover:bg-gray-50'>
                            <ChevronDown className={`size-4 transition-transform ${showDriverPayments ? '' : '-rotate-90'}`} />
                          </button>
                        </div>
                      </div>
                      
                      {showDriverPayments && (
                      <div className='overflow-x-auto'>
                        <table className='min-w-full text-sm'>
                          <thead>
                            <tr className='text-left text-gray-500 border-t border-b'>
                              <th className='py-3 px-5'>Driver</th>
                              <th className='py-3 px-5'>Completed Orders</th>
                              <th className='py-3 px-5'>Payout per Delivery</th>
                              <th className='py-3 px-5'>Total Payout</th>
                              <th className='py-3 px-5'>Paid</th>
                            </tr>
                          </thead>
                          <tbody>
                            {driverPayouts.totalsByDriver?.length === 0 ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={5}>No payouts</td></tr>
                            ) : driverPayouts.totalsByDriver.map((d, i) => (
                              <tr key={i} className='border-b last:border-b-0'>
                                <td className='py-3 px-5 text-gray-700'>
                                  <div className='font-medium'>{d.driverName || '—'}</div>
                                  {d.driverEmail && <div className='text-xs text-gray-500'>{d.driverEmail}</div>}
                                </td>
                                <td className='py-3 px-5 text-gray-700'>{d.deliveries}</td>
                                <td className='py-3 px-5 text-gray-700'>LKR 300</td>
                                <td className='py-3 px-5 font-medium text-red-700'>LKR {(Number(d.deliveries||0)*300).toLocaleString()}</td>
                                <td className='py-3 px-5 text-gray-700'>
                                  <input type='checkbox' checked={Boolean(driverPaid[d.driverId])} onChange={e=>setDriverPaid(p=>({ ...p, [d.driverId]: e.target.checked }))} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      )}
                    </div>

                    {/* Bar chart: deliveries completed by driver (moved outside the card) */}
                    <div className='p-5'>
                      <div className='bg-white rounded-xl border border-gray-200'>
                        <div className='p-4 text-sm font-medium text-gray-700'>Deliveries by Driver · {Number(driverPayouts.count||0)} completed</div>
                        <div className='px-4 pb-4'>
                          <Chart type='bar' height={260} options={{
                            chart:{ toolbar:{ show:false }},
                            grid:{ borderColor:'#eee' },
                            plotOptions:{ bar:{ columnWidth:'45%', borderRadius:4 }},
                            xaxis:{ categories: (driverPayouts.totalsByDriver||[]).map(d=>d.driverName||'—'), labels:{ style:{ colors:'#9ca3af' } } },
                            yaxis:{ labels:{ style:{ colors:'#9ca3af' } } },
                            colors:['#3b82f6']
                          }} series={[{ name:'Completed', data: (driverPayouts.totalsByDriver||[]).map(d=>Number(d.deliveries||0)) }]} />
                        </div>
                      </div>
                    </div>

                    
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <SectionHeader icon={Receipt} title='Log Expense' />
                      <div className='grid grid-cols-1 md:grid-cols-6 gap-3 text-sm'>
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Amount' type='number' value={form.amount} onChange={e=>setForm(f=>({...f, amount:e.target.value, type:'EXPENSE'}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Date' type='date' value={form.date?.slice(0,10) || ''} onChange={e=>setForm(f=>({...f, date:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Category' value={form.category} onChange={e=>setForm(f=>({...f, category:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-2' placeholder='Description' value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-1' type='file' accept='image/*' onChange={async e=>{ const file=e.target.files?.[0]; if(file){ const b64 = await onFileToBase64(file); setForm(f=>({...f, receiptBase64:b64})) }}} />
                      </div>
                      <div className='mt-3'>
                        <button disabled={creating} onClick={handleCreate} className='px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-50'>Save Expense</button>
                      </div>
                    </div>
                    <div className='bg-white border border-gray-200 rounded-2xl'>
                      <div className='p-5'>
                        <SectionHeader icon={Receipt} title='Expenses' />
                      </div>
                      <div className='overflow-x-auto'>
                        <table className='min-w-full text-sm'>
                          <thead>
                            <tr className='text-left text-gray-500 border-t border-b'>
                              <th className='py-3 px-5'>Date</th>
                              <th className='py-3 px-5'>Category</th>
                              <th className='py-3 px-5'>Description</th>
                              <th className='py-3 px-5'>Amount</th>
                              <th className='py-3 px-5 text-right'>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingExpenses ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={5}>Loading…</td></tr>
                            ) : expenseItems.length === 0 ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={5}>No expenses yet</td></tr>
                            ) : expenseItems.map((row) => (
                              <tr key={row._id} className='border-b last:border-b-0'>
                                <td className='py-3 px-5 text-gray-700'>{new Date(row.date).toLocaleDateString()}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.category || '—'}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.description || '—'}</td>
                                <td className='py-3 px-5 font-medium text-red-700'>- LKR {Number(row.amount||0).toLocaleString()}</td>
                                <td className='py-3 px-5 text-right'>
                                  <button onClick={()=>handleDelete(row._id,'EXPENSE')} className='text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50'>Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'budgets' && (
                  <div className='space-y-6'>
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <SectionHeader icon={Target} title='Create Budget' />
                      <div className='grid grid-cols-1 md:grid-cols-6 gap-3 text-sm'>
                        <input className='border rounded-md px-3 py-2 md:col-span-2' placeholder='Name' value={budgetForm.name} onChange={e=>setBudgetForm(f=>({...f, name:e.target.value}))} />
                        <select className='border rounded-md px-3 py-2 md:col-span-1' value={budgetForm.period} onChange={e=>setBudgetForm(f=>({...f, period:e.target.value}))}>
                          <option value='MONTHLY'>Monthly</option>
                          <option value='WEEKLY'>Weekly</option>
                        </select>
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Amount' type='number' value={budgetForm.amount} onChange={e=>setBudgetForm(f=>({...f, amount:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-2' placeholder='Categories (comma separated)' value={budgetForm.categories} onChange={e=>setBudgetForm(f=>({...f, categories:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Alert threshold (e.g. 0.8)' type='number' step='0.05' min='0' max='1' value={budgetForm.alertThreshold} onChange={e=>setBudgetForm(f=>({...f, alertThreshold:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-2' placeholder='Notify email (optional)' type='email' value={budgetForm.notifyEmail} onChange={e=>setBudgetForm(f=>({...f, notifyEmail:e.target.value}))} />
                      </div>
                      <div className='mt-3'>
                        <button onClick={createBudget} className='px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-green-700'>Save Budget</button>
                      </div>
                    </div>
                    <div className='bg-white border border-gray-200 rounded-2xl'>
                      <div className='p-5'>
                        <SectionHeader icon={Target} title='Budgets & Limits' />
                      </div>
                      <div className='overflow-x-auto'>
                        <table className='min-w-full text-sm'>
                          <thead>
                            <tr className='text-left text-gray-500 border-t border-b'>
                              <th className='py-3 px-5'>Name</th>
                              <th className='py-3 px-5'>Period</th>
                              <th className='py-3 px-5'>Amount</th>
                              <th className='py-3 px-5'>Categories</th>
                              <th className='py-3 px-5'>Utilization</th>
                              <th className='py-3 px-5 text-right'>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingBudgets ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={5}>Loading…</td></tr>
                            ) : budgets.length === 0 ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={5}>No budgets configured</td></tr>
                            ) : budgets.map(b => {
                              const util = utilization.find(u => u.id === b._id)
                              const ratio = util ? util.utilization : 0
                              const percent = Math.round(ratio * 100)
                              const nearLimit = util ? ratio >= (util.alertThreshold || 0.8) : false
                              return (
                              <tr key={b._id} className='border-b last:border-b-0'>
                                <td className='py-3 px-5 text-gray-700'>{b.name}</td>
                                <td className='py-3 px-5 text-gray-700'>{b.period}</td>
                                <td className='py-3 px-5 text-gray-900 font-medium'>LKR {Number(b.amount||0).toLocaleString()}</td>
                                <td className='py-3 px-5 text-gray-700'>{Array.isArray(b.categories)? b.categories.join(', ') : '—'}</td>
                                <td className='py-3 px-5'>
                                  <div className='w-40'>
                                    <div className={`h-2 rounded-full ${nearLimit ? 'bg-red-200' : 'bg-gray-200'}`}>
                                      <div className={`${nearLimit ? 'bg-red-600' : 'bg-green-600'} h-2 rounded-full`} style={{ width: `${Math.min(100, percent)}%` }} />
                                    </div>
                                    <div className={`text-xs mt-1 ${nearLimit ? 'text-red-700' : 'text-gray-600'}`}>{percent}% used{nearLimit ? ' • Near/over limit' : ''}</div>
                                  </div>
                                </td>
                                <td className='py-3 px-5 text-right'>
                                  <button onClick={()=>deleteBudget(b._id)} className='text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50'>Delete</button>
                                </td>
                              </tr>
                            )})}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'reports' && (
                  <div className='space-y-6'>
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <div className='text-sm text-gray-600'>No charts in Reports. Use Export tab for downloadable summaries.</div>
                    </div>
                  </div>
                )}
                {activeTab === 'goals' && (
                  <div className='space-y-6'>
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <SectionHeader icon={Target} title='Add Goal' />
                      <div className='grid grid-cols-1 md:grid-cols-5 gap-3 text-sm'>
                        <input className='border rounded-md px-3 py-2 md:col-span-2' placeholder='Title' value={goalForm.title} onChange={e=>setGoalForm(f=>({...f, title:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Target Amount' type='number' value={goalForm.targetAmount} onChange={e=>setGoalForm(f=>({...f, targetAmount:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-2' placeholder='Due Date' type='date' value={goalForm.dueDate?.slice(0,10) || ''} onChange={e=>setGoalForm(f=>({...f, dueDate:e.target.value}))} />
                      </div>
                      <div className='mt-3'>
                        <button onClick={createGoal} className='px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-green-700'>Save Goal</button>
                      </div>
                    </div>
                    <div className='bg-white border border-gray-200 rounded-2xl'>
                      <div className='p-5'>
                        <SectionHeader icon={Target} title='Savings & Goals' />
                      </div>
                      <div className='overflow-x-auto'>
                        <table className='min-w-full text-sm'>
                          <thead>
                            <tr className='text-left text-gray-500 border-t border-b'>
                              <th className='py-3 px-5'>Title</th>
                              <th className='py-3 px-5'>Target</th>
                              <th className='py-3 px-5'>Current</th>
                              <th className='py-3 px-5'>Due</th>
                              <th className='py-3 px-5 text-right'>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingGoals ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={5}>Loading…</td></tr>
                            ) : goals.length === 0 ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={5}>No goals yet</td></tr>
                            ) : goals.map(g => (
                              <tr key={g._id} className='border-b last:border-b-0'>
                                <td className='py-3 px-5 text-gray-700'>{g.title}</td>
                                <td className='py-3 px-5 text-gray-900 font-medium'>LKR {Number(g.targetAmount||0).toLocaleString()}</td>
                                <td className='py-3 px-5 text-gray-700'>LKR {Number(g.currentAmount||0).toLocaleString()}</td>
                                <td className='py-3 px-5 text-gray-700'>{g.dueDate ? new Date(g.dueDate).toLocaleDateString() : '—'}</td>
                                <td className='py-3 px-5 text-right'>
                                  <button onClick={()=>deleteGoal(g._id)} className='text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50'>Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'debts' && (
                  <div className='space-y-6'>
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <SectionHeader icon={Wallet} title='Record Debt/Loan' />
                      <div className='grid grid-cols-1 md:grid-cols-6 gap-3 text-sm'>
                        <select className='border rounded-md px-3 py-2 md:col-span-1' value={debtForm.type} onChange={e=>setDebtForm(f=>({...f, type:e.target.value}))}>
                          <option value='BORROWED'>Borrowed</option>
                          <option value='LENT'>Lent</option>
                        </select>
                        <input className='border rounded-md px-3 py-2 md:col-span-2' placeholder='Party' value={debtForm.party} onChange={e=>setDebtForm(f=>({...f, party:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Principal' type='number' value={debtForm.principal} onChange={e=>setDebtForm(f=>({...f, principal:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Interest %' type='number' value={debtForm.interestRate} onChange={e=>setDebtForm(f=>({...f, interestRate:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Due Date' type='date' value={debtForm.dueDate?.slice(0,10) || ''} onChange={e=>setDebtForm(f=>({...f, dueDate:e.target.value}))} />
                      </div>
                      <div className='mt-3'>
                        <button onClick={createDebt} className='px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-green-700'>Save Debt</button>
                      </div>
                    </div>
                    <div className='bg-white border border-gray-200 rounded-2xl'>
                      <div className='p-5'>
                        <SectionHeader icon={Wallet} title='Debts & Loans' />
                      </div>
                      <div className='overflow-x-auto'>
                        <table className='min-w-full text-sm'>
                          <thead>
                            <tr className='text-left text-gray-500 border-t border-b'>
                              <th className='py-3 px-5'>Type</th>
                              <th className='py-3 px-5'>Party</th>
                              <th className='py-3 px-5'>Principal</th>
                              <th className='py-3 px-5'>Interest %</th>
                              <th className='py-3 px-5'>Due</th>
                              <th className='py-3 px-5 text-right'>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingDebts ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={6}>Loading…</td></tr>
                            ) : debts.length === 0 ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={6}>No debts</td></tr>
                            ) : debts.map(d => (
                              <tr key={d._id} className='border-b last:border-b-0'>
                                <td className='py-3 px-5 text-gray-700'>{d.type}</td>
                                <td className='py-3 px-5 text-gray-700'>{d.party}</td>
                                <td className='py-3 px-5 text-gray-900 font-medium'>LKR {Number(d.principal||0).toLocaleString()}</td>
                                <td className='py-3 px-5 text-gray-700'>{Number(d.interestRate||0)}%</td>
                                <td className='py-3 px-5 text-gray-700'>{d.dueDate ? new Date(d.dueDate).toLocaleDateString() : '—'}</td>
                                <td className='py-3 px-5 text-right'>
                                  <button onClick={()=>deleteDebt(d._id)} className='text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50'>Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'recurring' && (
                  <div className='space-y-6'>
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <SectionHeader icon={Repeat} title='Add Recurring' />
                      <div className='grid grid-cols-1 md:grid-cols-6 gap-3 text-sm'>
                        <input className='border rounded-md px-3 py-2 md:col-span-2' placeholder='Title' value={recurringForm.title} onChange={e=>setRecurringForm(f=>({...f, title:e.target.value}))} />
                        <select className='border rounded-md px-3 py-2 md:col-span-1' value={recurringForm.type} onChange={e=>setRecurringForm(f=>({...f, type:e.target.value}))}>
                          <option value='EXPENSE'>Expense</option>
                          <option value='INCOME'>Income</option>
                        </select>
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Amount' type='number' value={recurringForm.amount} onChange={e=>setRecurringForm(f=>({...f, amount:e.target.value}))} />
                        <select className='border rounded-md px-3 py-2 md:col-span-1' value={recurringForm.cadence} onChange={e=>setRecurringForm(f=>({...f, cadence:e.target.value}))}>
                          <option value='DAILY'>Daily</option>
                          <option value='WEEKLY'>Weekly</option>
                          <option value='MONTHLY'>Monthly</option>
                          <option value='YEARLY'>Yearly</option>
                        </select>
                        <input className='border rounded-md px-3 py-2 md:col-span-1' placeholder='Next Run' type='date' value={recurringForm.nextRunAt?.slice(0,10) || ''} onChange={e=>setRecurringForm(f=>({...f, nextRunAt:e.target.value}))} />
                        <input className='border rounded-md px-3 py-2 md:col-span-2' placeholder='Category' value={recurringForm.category} onChange={e=>setRecurringForm(f=>({...f, category:e.target.value}))} />
                      </div>
                      <div className='mt-3'>
                        <button onClick={createRecurring} className='px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-green-700'>Save Recurring</button>
                      </div>
                    </div>
                    <div className='bg-white border border-gray-200 rounded-2xl'>
                      <div className='p-5'>
                        <SectionHeader icon={Repeat} title='Recurring Transactions' />
                      </div>
                      <div className='overflow-x-auto'>
                        <table className='min-w-full text-sm'>
                          <thead>
                            <tr className='text-left text-gray-500 border-t border-b'>
                              <th className='py-3 px-5'>Title</th>
                              <th className='py-3 px-5'>Type</th>
                              <th className='py-3 px-5'>Amount</th>
                              <th className='py-3 px-5'>Cadence</th>
                              <th className='py-3 px-5'>Next</th>
                              <th className='py-3 px-5'>Category</th>
                              <th className='py-3 px-5 text-right'>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingRecurring ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={7}>Loading…</td></tr>
                            ) : recurrings.length === 0 ? (
                              <tr><td className='py-4 px-5 text-gray-500' colSpan={7}>No recurring items</td></tr>
                            ) : recurrings.map(r => (
                              <tr key={r._id} className='border-b last:border-b-0'>
                                <td className='py-3 px-5 text-gray-700'>{r.title}</td>
                                <td className='py-3 px-5 text-gray-700'>{r.type}</td>
                                <td className='py-3 px-5 text-gray-900 font-medium'>LKR {Number(r.amount||0).toLocaleString()}</td>
                                <td className='py-3 px-5 text-gray-700'>{r.cadence}</td>
                                <td className='py-3 px-5 text-gray-700'>{r.nextRunAt ? new Date(r.nextRunAt).toLocaleDateString() : '—'}</td>
                                <td className='py-3 px-5 text-gray-700'>{r.category || '—'}</td>
                                <td className='py-3 px-5 text-right'>
                                  <button onClick={()=>deleteRecurring(r._id)} className='text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50'>Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'export' && (
                  <div className='space-y-6'>
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <SectionHeader icon={FileDown} title='Export & Backup' action={<></>} />
                      <div className='flex items-center gap-2'>
                        <button onClick={downloadCSV} className='px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-900'><FileDown className='inline w-4 h-4 mr-1'/> Export CSV</button>
                        <button onClick={downloadPDF} className='px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-900'><FileDown className='inline w-4 h-4 mr-1'/> Export</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Income info modal */}
      {selectedIncome && (
        <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
          <div className='bg-white rounded-xl border border-gray-200 w-full max-w-2xl p-5'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-lg font-semibold'>Income Details</h3>
              <button onClick={()=>setSelectedIncome(null)} className='text-gray-500'>Close</button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div>
                <div className='text-gray-500'>Date</div>
                <div className='font-medium'>{selectedIncome.date ? new Date(selectedIncome.date).toLocaleString() : '—'}</div>
              </div>
              <div>
                <div className='text-gray-500'>Amount</div>
                <div className='font-medium text-green-700'>LKR {Number(selectedIncome.amount||0).toLocaleString()}</div>
              </div>
              <div>
                <div className='text-gray-500'>Category</div>
                <div className='font-medium'>{selectedIncome.category || '—'}</div>
              </div>
              <div>
                <div className='text-gray-500'>Source</div>
                <div className='font-medium'>{selectedIncome.source || '—'}</div>
              </div>
              <div className='md:col-span-2'>
                <div className='text-gray-500'>Description</div>
                <div className='font-medium'>{selectedIncome.description || '—'}</div>
              </div>
              <div className='md:col-span-2'>
                <div className='text-gray-500 mb-2'>Receipt</div>
                {selectedIncome.receiptUrl ? (
                  <img src={selectedIncome.receiptUrl} alt='receipt' className='w-full max-h-96 object-contain rounded-lg border' />
                ) : (
                  <div className='text-gray-500'>No receipt attached</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Income info modal
// Place modal at end of component render above default export

export default AdminFinance



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
  const [companyIncome, setCompanyIncome] = React.useState({ totalsByType: { inventory: 0, rental: 0, listing: 0 }, totalIncome: 0, items: [] })
  const [incomeRange, setIncomeRange] = React.useState('month') // 'day' | 'week' | 'month'
  const [incomeTypeFilter, setIncomeTypeFilter] = React.useState('all') // 'all' | 'inventory' | 'rental' | 'listing'
  const [showOrderIncomeDetails, setShowOrderIncomeDetails] = React.useState(true)
  const [overviewIncomeTx, setOverviewIncomeTx] = React.useState([])
  const [overviewExpenseTx, setOverviewExpenseTx] = React.useState([])
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
  const [driverRange, setDriverRange] = React.useState('month')
  const [farmerRange, setFarmerRange] = React.useState('month')
  const [driverPayouts, setDriverPayouts] = React.useState({ total: 0, count: 0, items: [], totalsByDriver: [] })
  const [driverPaid, setDriverPaid] = React.useState({})
  const [showDriverPayments, setShowDriverPayments] = React.useState(true)
  const [farmerPayouts, setFarmerPayouts] = React.useState({ total: 0, items: [], commissionPercent: 15 })
  const [driverRate, setDriverRate] = React.useState({ type: 'flat', value: '0' })
  const [showFarmerPayments, setShowFarmerPayments] = React.useState(true)

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
    if (activeTab === 'income') fetchCompanyIncome(incomeRange)
    if (activeTab === 'expenses') fetchTransactions('EXPENSE')
    if (activeTab === 'expenses') { fetchDriverPayouts(driverRange, driverRate); fetchFarmerPayouts(farmerRange) }
    if (activeTab === 'overview') {
      axiosInstance.get('/finance/transactions', { params: { type: 'INCOME' } }).then(r=>setOverviewIncomeTx(r.data||[])).catch(()=>setOverviewIncomeTx([]))
      axiosInstance.get('/finance/transactions', { params: { type: 'EXPENSE' } }).then(r=>setOverviewExpenseTx(r.data||[])).catch(()=>setOverviewExpenseTx([]))
    }
    if (activeTab === 'reports' || activeTab === 'export') fetchAllTransactions()
  }, [activeTab])

  React.useEffect(() => { if (activeTab === 'expenses') fetchDriverPayouts(driverRange, driverRate) }, [driverRange, driverRate])
  React.useEffect(() => { if (activeTab === 'expenses') fetchFarmerPayouts(farmerRange) }, [farmerRange])

  React.useEffect(() => {
    if (activeTab === 'income') fetchCompanyIncome(incomeRange)
  }, [incomeRange])
  const fetchCompanyIncome = async (range = 'month') => {
    try {
      // compute from/to
      let from = null
      let to = new Date().toISOString()
      const now = new Date()
      if (range === 'day') {
        const d = new Date(now)
        d.setDate(now.getDate() - 1)
        from = d.toISOString()
      } else if (range === 'week') {
        const d = new Date(now)
        d.setDate(now.getDate() - 7)
        from = d.toISOString()
      } else {
        const d = new Date(now.getFullYear(), now.getMonth(), 1)
        from = d.toISOString()
      }
      const res = await axiosInstance.get('/finance/income/orders', { params: { from, to } })
      setCompanyIncome(res.data || { totalsByType: { inventory: 0, rental: 0, listing: 0 }, totalIncome: 0, items: [] })
    } catch {}
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
    let from
    if (range === 'day') { const d = new Date(now); d.setDate(now.getDate() - 1); from = d.toISOString() }
    else if (range === 'week') { const d = new Date(now); d.setDate(now.getDate() - 7); from = d.toISOString() }
    else { const d = new Date(now.getFullYear(), now.getMonth(), 1); from = d.toISOString() }
    return { from, to: new Date().toISOString() }
  }

  const fetchDriverPayouts = async (range, rate) => {
    try {
      const { from, to } = rangeToFromTo(range)
      const res = await axiosInstance.get('/finance/expenses/driver-payouts', { params: { from, to, rateType: rate.type, rateValue: rate.value } })
      setDriverPayouts(res.data || { total: 0, count: 0, items: [] })
    } catch {}
  }

  const fetchFarmerPayouts = async (range) => {
    try {
      const { from, to } = rangeToFromTo(range)
      const res = await axiosInstance.get('/finance/expenses/farmer-payouts', { params: { from, to } })
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
              </div>
              <div className='px-4 pb-4'>
                <div className='border-t border-gray-100 mt-3 pt-4' />
                {activeTab === 'overview' && (
                  <div className='space-y-6'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                      <StatCard icon={Wallet} title='Total Balance' value={loadingSummary ? '—' : `LKR ${summary.balance.toLocaleString()}`} trend='' positive={summary.balance >= 0} />
                      <StatCard icon={TrendingUp} title='Income' value={loadingSummary ? '—' : `LKR ${summary.income.toLocaleString()}`} trend='' positive />
                      <StatCard icon={Receipt} title='Expenses' value={loadingSummary ? '—' : `LKR ${summary.expenses.toLocaleString()}`} trend='' positive={false} />
                      <StatCard icon={Target} title='Savings Progress' value='—' trend='' positive />
                    </div>
                    <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
                      <div className='lg:col-span-3 space-y-6'>
                        <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                          <div className='flex items-center justify-between mb-2'>
                            <div className='flex items-center gap-2 text-gray-800 font-semibold'>
                              <BarChart3 className='size-5 text-gray-500' />
                              <span>Income vs Expenses (last 6 months)</span>
                            </div>
                          </div>
                          {(() => {
                            const now = new Date()
                            const labels = []
                            const incomeSeries = []
                            const expenseSeries = []
                            for (let i = 5; i >= 0; i--) {
                              const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                              labels.push(d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }))
                              const monthIncome = (overviewIncomeTx||[]).filter(t => new Date(t.date).getFullYear()===d.getFullYear() && new Date(t.date).getMonth()===d.getMonth()).reduce((s,t)=>s+Number(t.amount||0),0)
                              const monthExpense = (overviewExpenseTx||[]).filter(t => new Date(t.date).getFullYear()===d.getFullYear() && new Date(t.date).getMonth()===d.getMonth()).reduce((s,t)=>s+Number(t.amount||0),0)
                              incomeSeries.push(monthIncome)
                              expenseSeries.push(monthExpense)
                            }
                            return (
                              <Chart type='bar' height={260} options={{
                                chart:{ toolbar:{ show:false }},
                                plotOptions:{ bar:{ columnWidth:'40%', borderRadius:4 }},
                                grid:{ borderColor:'#eee' },
                                xaxis:{ categories: labels, labels:{ style:{ colors:'#9ca3af' } } },
                                yaxis:{ labels:{ style:{ colors:'#9ca3af' } } },
                                colors:['#22c55e','#ef4444'], legend:{ position:'top' }
                              }} series={[ { name:'Income', data: incomeSeries }, { name:'Expenses', data: expenseSeries } ]} />
                            )
                          })()}
                        </div>
                        <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                          <div className='flex items-center justify-between mb-2'>
                            <div className='flex items-center gap-2 text-gray-800 font-semibold'>
                              <LineChart className='size-5 text-gray-500' />
                              <span>Monthly Balance Trend</span>
                            </div>
                          </div>
                          {(() => {
                            const now = new Date()
                            const labels = []
                            const values = []
                            for (let i = 5; i >= 0; i--) {
                              const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                              labels.push(d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }))
                              const inc = (overviewIncomeTx||[]).filter(t => new Date(t.date).getFullYear()===d.getFullYear() && new Date(t.date).getMonth()===d.getMonth()).reduce((s,t)=>s+Number(t.amount||0),0)
                              const exp = (overviewExpenseTx||[]).filter(t => new Date(t.date).getFullYear()===d.getFullYear() && new Date(t.date).getMonth()===d.getMonth()).reduce((s,t)=>s+Number(t.amount||0),0)
                              values.push(inc - exp)
                            }
                            return (
                              <Chart type='line' height={260} options={{
                                chart:{ toolbar:{ show:false }},
                                stroke:{ width:3, curve:'smooth' },
                                grid:{ borderColor:'#eee' },
                                xaxis:{ categories: labels, labels:{ style:{ colors:'#9ca3af' } } },
                                yaxis:{ labels:{ style:{ colors:'#9ca3af' } } },
                                colors:['#111827'], legend:{ show:false }
                              }} series={[ { name:'Balance', data: values } ]} />
                            )
                          })()}
                        </div>
                      </div>
                      <div className='lg:col-span-2 space-y-6'>
                        <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                          <div className='flex items-center justify-between mb-2'>
                            <div className='flex items-center gap-2 text-gray-800 font-semibold'>
                              <PieChart className='size-5 text-gray-500' />
                              <span>Expense Categories (this month)</span>
                            </div>
                          </div>
                          {(() => {
                            const now = new Date()
                            const start = new Date(now.getFullYear(), now.getMonth(), 1)
                            const catMap = new Map()
                            for (const t of (overviewExpenseTx||[])) {
                              const dt = new Date(t.date)
                              if (dt < start) continue
                              const key = t.category || 'Other'
                              catMap.set(key, (catMap.get(key)||0) + Number(t.amount||0))
                            }
                            const labels = Array.from(catMap.keys())
                            const series = labels.map(l=>catMap.get(l))
                            return labels.length === 0 ? (
                              <div className='text-sm text-gray-500'>No expenses this month</div>
                            ) : (
                              <Chart type='donut' height={260} options={{
                                chart:{ toolbar:{ show:false }}, labels,
                                legend:{ show:false }, dataLabels:{ enabled:false },
                                colors:['#8b5cf6', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#14b8a6', '#eab308']
                              }} series={series} />
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'income' && (
                  <div className='space-y-6'>
                    <div className='flex items-center gap-2'>
                      <button onClick={()=>setIncomeRange('day')} className={`px-3 py-2 text-sm rounded-lg border ${incomeRange==='day'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>Last 24h</button>
                      <button onClick={()=>setIncomeRange('week')} className={`px-3 py-2 text-sm rounded-lg border ${incomeRange==='week'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>Last 7 days</button>
                      <button onClick={()=>setIncomeRange('month')} className={`px-3 py-2 text-sm rounded-lg border ${incomeRange==='month'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>This Month</button>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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
                        <div className='text-xl font-semibold mt-1'>LKR {Number(companyIncome.totalsByType.listing||0).toLocaleString()}</div>
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
                                <option value='listing'>Listing</option>
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
                                  .filter(row => incomeTypeFilter === 'all' ? true : row.itemType === incomeTypeFilter)
                                  .map((row, idx) => (
                              <tr key={idx} className='border-b last:border-b-0'>
                                <td className='py-3 px-5 text-gray-700'>{row.orderNumber || row.orderId}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
                                <td className='py-3 px-5 text-gray-700 capitalize'>{row.itemType}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.title}</td>
                                <td className='py-3 px-5 text-gray-700'>{row.quantity}</td>
                                <td className='py-3 px-5 text-gray-700'>LKR {Number(row.unitPrice||0).toLocaleString()}</td>
                                <td className='py-3 px-5 font-medium text-green-700'>LKR {Number(row.lineTotal||0).toLocaleString()}</td>
                              </tr>
                            )))}
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
                      <div className='p-5'>
                        <SectionHeader icon={TrendingUp} title='Income Records' />
                      </div>
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
                    </div>
                  </div>
                )}
                {activeTab === 'expenses' && (
                  <div className='space-y-6'>
                    <div className='flex items-center gap-2'>
                      <button onClick={()=>{ setDriverRange('day'); setFarmerRange('day') }} className={`px-3 py-2 text-sm rounded-lg border ${driverRange==='day' && farmerRange==='day' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>Last 24h</button>
                      <button onClick={()=>{ setDriverRange('week'); setFarmerRange('week') }} className={`px-3 py-2 text-sm rounded-lg border ${driverRange==='week' && farmerRange==='week' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>Last 7 days</button>
                      <button onClick={()=>{ setDriverRange('month'); setFarmerRange('month') }} className={`px-3 py-2 text-sm rounded-lg border ${driverRange==='month' && farmerRange==='month' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>This Month</button>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <StatCard icon={Receipt} title='Driver Payments' value={`LKR ${((driverPayouts.totalsByDriver||[]).reduce((s,d)=> s + (Number(d.deliveries||0)*300), 0)).toLocaleString()}`} trend='' positive={false} />
                      <StatCard icon={Wallet} title='Farmer Payments' value={`LKR ${Number(farmerPayouts.total||0).toLocaleString()}`} trend='' positive={false} />
                    </div>
                    {/* Driver payouts */}
                    <div className='bg-white border border-gray-200 rounded-2xl'>
                      <div className='p-5 flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <SectionHeader icon={Receipt} title='Driver Payments' />
                        </div>
                        <div>
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

                      {/* Bar chart: deliveries completed by driver */}
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
                    </div>

                    {/* Farmer payouts */}
                    <div className='bg-white border border-gray-200 rounded-2xl'>
                      <div className='p-5 flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <SectionHeader icon={Receipt} title='Farmer Payments (after commission)' />
                          <div className='text-sm text-gray-600'>Total: <span className='font-semibold'>LKR {Number(farmerPayouts.total||0).toLocaleString()}</span></div>
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
                              <th className='py-3 px-5'>Date</th>
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
                                <td className='py-3 px-5 text-gray-700'>{r.orderNumber || r.orderId}</td>
                                <td className='py-3 px-5 text-gray-700'>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                                <td className='py-3 px-5 text-gray-700'>{r.farmerName || '—'}</td>
                                <td className='py-3 px-5 text-gray-700'>{r.title}</td>
                                <td className='py-3 px-5 text-gray-700'>{r.quantity}</td>
                                <td className='py-3 px-5 text-gray-700'>LKR {Number(r.unitPrice||0).toLocaleString()}</td>
                                <td className='py-3 px-5 text-gray-700'>LKR {Number(r.lineTotal||0).toLocaleString()}</td>
                                <td className='py-3 px-5 font-medium text-red-700'>LKR {Number(r.payout||0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      )}
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
                      <div className='flex items-center justify-between mb-4'>
                        <div className='flex items-center gap-2 text-gray-800 font-semibold'>
                          <BarChart3 className='size-5 text-gray-500' />
                          <span>Income vs Expenses (last 6 months)</span>
                        </div>
                      </div>
                      {loadingReports ? (
                        <div className='h-56 grid place-items-center text-gray-500'>Loading…</div>
                      ) : (
                        <Chart type='bar' height={260} options={{
                          chart:{ toolbar:{ show:false }},
                          plotOptions:{ bar:{ columnWidth:'40%', borderRadius:4 }},
                          grid:{ borderColor:'#eee' },
                          xaxis:{ categories: buildMonthlyBuckets().labels, labels:{ style:{ colors:'#9ca3af' } } },
                          yaxis:{ labels:{ style:{ colors:'#9ca3af' } } },
                          colors:['#22c55e','#ef4444'],
                          legend:{ position:'top' }
                        }} series={[
                          { name:'Income', data: buildMonthlyBuckets().incomeSeries },
                          { name:'Expenses', data: buildMonthlyBuckets().expenseSeries },
                        ]} />
                      )}
                    </div>
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <div className='flex items-center justify-between mb-4'>
                        <div className='flex items-center gap-2 text-gray-800 font-semibold'>
                          <LineChart className='size-5 text-gray-500' />
                          <span>Balance Trend</span>
                        </div>
                      </div>
                      {loadingReports ? (
                        <div className='h-56 grid place-items-center text-gray-500'>Loading…</div>
                      ) : (
                        <Chart type='line' height={260} options={{
                          chart:{ toolbar:{ show:false }},
                          stroke:{ width:3, curve:'smooth' },
                          grid:{ borderColor:'#eee' },
                          xaxis:{ categories: buildMonthlyBuckets().labels, labels:{ style:{ colors:'#9ca3af' } } },
                          yaxis:{ labels:{ style:{ colors:'#9ca3af' } } },
                          colors:['#111827'], legend:{ show:false }
                        }} series={[{ name:'Balance', data: buildMonthlyBuckets().incomeSeries.map((v,i)=>v - buildMonthlyBuckets().expenseSeries[i]) }]} />
                      )}
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



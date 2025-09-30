import React from 'react'
import AdminSidebar from '../components/AdminSidebar'
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, CalendarRange, PieChart, BarChart3, LineChart, Receipt, Target, Repeat, FileDown } from 'lucide-react'

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
  { key: 'budgets', label: 'Budgets' },
  { key: 'reports', label: 'Reports' },
  { key: 'goals', label: 'Savings & Goals' },
  { key: 'debts', label: 'Debts & Loans' },
  { key: 'recurring', label: 'Recurring' },
  { key: 'export', label: 'Export' },
]

const AdminFinance = () => {
  const [activeTab, setActiveTab] = React.useState('overview')

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
                      <StatCard icon={Wallet} title='Total Balance' value='$12,450.78' trend='+4.1% MoM' positive />
                      <StatCard icon={TrendingUp} title='Income' value='$6,200.00' trend='+2.3% MoM' positive />
                      <StatCard icon={Receipt} title='Expenses' value='$3,980.50' trend='-1.4% MoM' positive={false} />
                      <StatCard icon={Target} title='Savings Progress' value='62%' trend='+$450 this month' positive />
                    </div>
                    <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
                      <div className='lg:col-span-3 space-y-6'>
                        <PlaceholderChart title='Income vs Expenses' icon={BarChart3} />
                        <PlaceholderChart title='Monthly Trend' icon={LineChart} />
                      </div>
                      <div className='lg:col-span-2 space-y-6'>
                        <PlaceholderChart title='Expense Categories' icon={PieChart} />
                        <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                          <SectionHeader icon={Repeat} title='Recurring Transactions' action={<button className='text-xs px-2 py-1 rounded-lg bg-gray-900 text-white'>Manage</button>} />
                          <div className='divide-y'>
                            {[
                              { title: 'Rent', amount: '$900', cadence: 'Monthly', next: 'Oct 01' },
                              { title: 'Internet', amount: '$45', cadence: 'Monthly', next: 'Oct 03' },
                              { title: 'Gym', amount: '$25', cadence: 'Monthly', next: 'Oct 10' },
                            ].map((t) => (
                              <div key={t.title} className='py-3 flex items-center justify-between text-sm'>
                                <div className='text-gray-700'>{t.title} <span className='text-gray-400'>• {t.cadence}</span></div>
                                <div className='text-gray-900 font-medium'>{t.amount} <span className='text-gray-400 font-normal'>on {t.next}</span></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'income' && (
                  <div className='space-y-6'>
                    <PlaceholderChart title='Income by Source' icon={BarChart3} />
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <SectionHeader icon={TrendingUp} title='Income Records' action={<button className='text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50'>Add Income</button>} />
                      <div className='text-sm text-gray-500'>No income records yet</div>
                    </div>
                  </div>
                )}
                {activeTab === 'expenses' && (
                  <div className='space-y-6'>
                    <PlaceholderChart title='Expense Breakdown' icon={PieChart} />
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <SectionHeader icon={Receipt} title='Expenses' action={<button className='text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50'>Log Expense</button>} />
                      <div className='text-sm text-gray-500'>No expenses yet</div>
                    </div>
                  </div>
                )}
                {activeTab === 'budgets' && (
                  <div className='space-y-6'>
                    <PlaceholderChart title='Budget Utilization' icon={LineChart} />
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <SectionHeader icon={Target} title='Budgets & Limits' action={<button className='text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50'>Create Budget</button>} />
                      <div className='text-sm text-gray-500'>No budgets configured</div>
                    </div>
                  </div>
                )}
                {activeTab === 'reports' && (
                  <div className='space-y-6'>
                    <PlaceholderChart title='Income vs Expenses' icon={BarChart3} />
                    <PlaceholderChart title='Trends Over Time' icon={LineChart} />
                  </div>
                )}
                {activeTab === 'goals' && (
                  <div className='space-y-6'>
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <SectionHeader icon={Target} title='Savings & Goals' action={<button className='text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50'>Add Goal</button>} />
                      <div className='text-sm text-gray-500'>No goals yet</div>
                    </div>
                  </div>
                )}
                {activeTab === 'debts' && (
                  <div className='space-y-6'>
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <SectionHeader icon={Wallet} title='Debts & Loans' action={<button className='text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50'>Record Loan</button>} />
                      <div className='text-sm text-gray-500'>No debt records</div>
                    </div>
                  </div>
                )}
                {activeTab === 'recurring' && (
                  <div className='space-y-6'>
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <SectionHeader icon={Repeat} title='Recurring Transactions' action={<button className='text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50'>Add Recurring</button>} />
                      <div className='text-sm text-gray-500'>No recurring items</div>
                    </div>
                  </div>
                )}
                {activeTab === 'export' && (
                  <div className='space-y-6'>
                    <div className='bg-white border border-gray-200 rounded-2xl p-5'>
                      <SectionHeader icon={FileDown} title='Export & Backup' action={<></>} />
                      <div className='flex items-center gap-2'>
                        <button className='px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-green-700'>Export CSV</button>
                        <button className='px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50'>Export PDF</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminFinance



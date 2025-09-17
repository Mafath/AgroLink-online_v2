import React from 'react'
import Chart from 'react-apexcharts'

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

const AdminDashboard = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
      {/* Top bar */}
      <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-semibold ml-2'>Admin Dashboard</h1>
          <div className='relative hidden sm:block'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>🔍</span>
            <input className='bg-white border border-gray-200 rounded-full h-9 pl-9 pr-3 w-72 text-sm outline-none' placeholder='Search' />
          </div>
        </div>

        <div className='grid grid-cols-[240px,1fr] gap-6'>
          {/* Sidebar */}
          <div className='bg-white rounded-xl border border-gray-200 p-2'>
            <nav className='space-y-1 text-gray-700 text-sm'>
              <div className='px-3 py-2 rounded-lg bg-green-100 text-green-700'>Dashboards</div>
              <a href='/admin/users' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Users & Roles</a>
              <a href='/admin/inventory' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Inventory</a>
              <a href='/admin/rentals' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Rentals</a>
              <a href='/admin/drivers' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Driver Management</a>
              <a href='/admin/logistics' className='block px-3 py-2 rounded-lg hover:bg-gray-50'>Logistics</a>
            </nav>
      </div>

          {/* Main content */}
          <div className='space-y-6'>
            {/* Top cards row: 1-1-2 */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                    <div>
                    <div className='text-sm text-gray-600'>Ratings</div>
                    <div className='text-2xl font-semibold mt-1'>13k <span className='text-green-600 text-xs align-middle'>+15.6%</span></div>
                    <div className='mt-3'>
                      <span className='text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full'>Year of 2025</span>
                    </div>
                  </div>
                  <div className='w-24 h-24 bg-violet-100 rounded-lg' />
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4 flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-gray-600'>Sessions</div>
                    <div className='text-2xl font-semibold mt-1'>24.5k <span className='text-rose-500 text-xs align-middle'>-20%</span></div>
                    <div className='mt-3 text-xs text-gray-600'>Last Week</div>
                  </div>
                  <div className='w-24 h-24 bg-gray-100 rounded-lg' />
                </div>
              </Card>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium'>Transactions</div>
                  <div className='text-xs text-gray-500 mt-1'>Total 48.5% Growth this month</div>
                  <div className='grid grid-cols-3 gap-3 mt-4'>
                    {[{t:'Sales',v:'245k'},{t:'Users',v:'12.5k'},{t:'Product',v:'1.54k'}].map((x,i)=>(
                      <div key={i} className='bg-gray-50 rounded-lg p-3'>
                        <div className='text-xs text-gray-500'>{x.t}</div>
                        <div className='text-lg font-semibold mt-1'>{x.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Middle cards: 1-1-2 */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-1'><div className='p-4'><div className='text-sm text-gray-700 font-medium mb-2'>Total Sales</div><div className='rounded-lg border border-dashed'><LineChart /></div></div></Card>
              <Card className='col-span-1'><div className='p-4'><div className='text-sm text-gray-700 font-medium mb-2'>Revenue Report</div><div className='rounded-lg border border-dashed'><BarChart /></div></div></Card>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Sales Overview</div>
                    <div className='grid grid-cols-[1fr,240px] gap-4'>
                    <div className='grid place-items-center'>
                      <div className='rounded-lg border border-dashed w-full max-w-[220px]'><DonutChart /></div>
                    </div>
                    <div className='text-sm'>
                      <div className='flex items-center gap-3 mb-3'>
                        <span className='w-9 h-9 rounded-lg bg-violet-100 grid place-items-center text-violet-600'>📄</span>
                        <div>
                          <div className='text-xs text-gray-500'>Number of Sales</div>
                          <div className='font-semibold text-base'>$86,400</div>
                        </div>
                      </div>
                      <div className='border-t border-gray-200 my-3'></div>
                      <div className='grid grid-cols-2 gap-x-8 gap-y-4'>
                        <div>
                          <div className='flex items-center gap-2 text-gray-700'><span className='w-2 h-2 rounded-full bg-violet-500'></span>Apparel</div>
                          <div className='text-xs text-gray-500 mt-0.5'>$12,150</div>
                        </div>
                        <div>
                          <div className='flex items-center gap-2 text-gray-700'><span className='w-2 h-2 rounded-full bg-violet-300'></span>Electronics</div>
                          <div className='text-xs text-gray-500 mt-0.5'>$24,900</div>
                        </div>
                        <div>
                          <div className='flex items-center gap-2 text-gray-700'><span className='w-2 h-2 rounded-full bg-violet-200'></span>FMCG</div>
                          <div className='text-xs text-gray-500 mt-0.5'>$12,750</div>
                        </div>
                        <div>
                          <div className='flex items-center gap-2 text-gray-700'><span className='w-2 h-2 rounded-full bg-violet-400'></span>Other Sales</div>
                          <div className='text-xs text-gray-500 mt-0.5'>$50,200</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Bottom row: 2-1-1 */}
            <div className='grid grid-cols-4 gap-6'>
              <Card className='col-span-2'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Activity Timeline</div>
                  <div className='space-y-5 text-sm'>
                    {[
                      ['12 Invoices have been paid','Invoices have been paid to the company','12 min ago'],
                      ['Client Meeting','Project meeting with john @10:15am','45 min ago'],
                    ].map((t,i)=> (
                      <div key={i} className='grid grid-cols-[16px,1fr,100px] gap-3 items-start'>
                        <span className={`w-3 h-3 rounded-full mt-1 ${i===0?'bg-violet-500':'bg-green-500'}`} />
                        <div>
                          <div className='font-medium'>{t[0]}</div>
                          <div className='text-gray-500'>{t[1]}</div>
                        </div>
                        <div className='text-gray-500 text-xs text-right'>{t[2]}</div>
                </div>
              ))}
                  </div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4'>
                  <div className='text-sm text-gray-700 font-medium mb-2'>Weekly Sales</div>
                  <div className='rounded-lg border border-dashed'><BarChart /></div>
                </div>
              </Card>
              <Card className='col-span-1'>
                <div className='p-4'>
                  <div className='text-2xl font-semibold'>42.5k</div>
                  <div className='mt-2 rounded-lg border border-dashed'><Sparkline /></div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard



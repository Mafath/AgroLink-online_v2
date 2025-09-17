import React, { useState } from 'react'
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

const AdminInventory = () => {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [rentalForm, setRentalForm] = useState({
    productName: '',
    description: '',
    rentalPerDay: '',
    rentalPerWeek: '',
    images: [],
    totalQty: '',
  })

  const handleSubmitRental = (e) => {
    e.preventDefault()
    // For now, just close the modal. Hook to API later.
    setIsAddOpen(false)
    setRentalForm({ productName: '', description: '', rentalPerDay: '', rentalPerWeek: '', images: [], totalQty: '' })
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-semibold ml-2'>Inventory</h1>
          <div className='relative hidden sm:block'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>🔍</span>
            <input className='bg-white border border-gray-200 rounded-full h-9 pl-9 pr-3 w-72 text-sm outline-none' placeholder='Search' />
          </div>
        </div>

        <div className='grid grid-cols-[240px,1fr] gap-6'>
          {/* Sidebar */}
          <div className='bg-white rounded-xl border border-gray-200 p-2'>
            <div className='space-y-1'>
              {[
                'Dashboards',
                'CRM',
                'Analytics',
                'eCommerce',
                'Academy',
                'Logistics',
                'Front Pages',
                'Apps & Pages',
                'Email',
                'Chat',
                'Calendar',
                'Kanban',
                'Invoice',
                'User',
                'Roles & Permissions',
                'Pages',
              ].map((item, i) => (
                <div key={i} className={`px-3 py-2 rounded-lg ${item==='CRM' ? 'bg-violet-100 text-violet-700' : 'hover:bg-gray-50 text-gray-700'}`}>{item}</div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className='space-y-6'>
            {/* Rentals table */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
              <div className='px-4 py-3 border-b border-gray-100 flex items-center justify-between'>
                <div>
                  <div className='text-sm font-medium text-gray-700'>Rental Items</div>
                  <div className='text-xs text-gray-500 mt-0.5'>Initially empty</div>
                </div>
                <button className='btn-primary whitespace-nowrap' onClick={() => setIsAddOpen(true)}>Add Rental Item +</button>
              </div>
              <div className='overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead>
                    <tr className='text-left text-gray-500'>
                      <th className='py-3 px-4'>Product name</th>
                      <th className='py-3 px-4'>Rental / Day</th>
                      <th className='py-3 px-4'>Rental / Week</th>
                      <th className='py-3 px-4'>Images</th>
                      <th className='py-3 px-4'>Total Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className='py-10 text-center text-gray-400' colSpan={6}>No data yet</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
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
              <div>
                <label className='form-label'>Rental / Week</label>
                <input type='number' min='0' step='0.01' className='input-field' value={rentalForm.rentalPerWeek} onChange={(e)=>setRentalForm(f=>({...f, rentalPerWeek:e.target.value}))} required />
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

export default AdminInventory



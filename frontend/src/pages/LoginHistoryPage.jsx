import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosInstance } from '../lib/axios'
import { Clock, Monitor, Smartphone, ArrowLeft, RefreshCw, MapPin, CheckCircle, XCircle, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const LoginHistoryPage = () => {
  const navigate = useNavigate()
  const [loginHistory, setLoginHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadLoginHistory = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    
    try {
      const res = await axiosInstance.get('/auth/login-history')
      setLoginHistory(res.data)
    } catch (error) {
      console.error('Error loading login history:', error)
      toast.error('Failed to load login history')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadLoginHistory()
  }, [])

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const getDeviceIcon = (deviceType) => {
    return deviceType === 'mobile' ? Smartphone : Monitor
  }

  const getStatusIcon = (success) => {
    return success ? CheckCircle : XCircle
  }

  const getStatusColor = (success) => {
    return success ? 'text-green-600' : 'text-red-600'
  }

  const getStatusBg = (success) => {
    return success ? 'bg-green-100' : 'bg-red-100'
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-violet-100 py-8'>
      <div className='max-w-6xl mx-auto px-4'>
        {/* Header */}
        <div className='mb-8'>
          <button
            onClick={() => navigate('/profile?tab=security')}
            className='inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group'
          >
            <ArrowLeft className='w-4 h-4 group-hover:-translate-x-1 transition-transform' />
            Back to Security Center
          </button>
          
          <div className='bg-white rounded-3xl shadow-xl border border-gray-100 p-8'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='p-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg'>
                <Clock className='w-8 h-8 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Login History</h1>
                <p className='text-gray-600 mt-1'>Monitor your account access and security</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          {/* Security Stats Sidebar */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-8'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-3 bg-purple-100 rounded-xl'>
                  <ShieldCheck className='w-6 h-6 text-purple-600' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900'>Security Overview</h3>
              </div>
              <div className='space-y-4'>
                <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <CheckCircle className='w-5 h-5 text-green-600' />
                    <span className='text-sm font-medium text-green-800'>Recent Logins</span>
                  </div>
                  <p className='text-2xl font-bold text-green-700'>3</p>
                  <p className='text-xs text-green-600'>Last 7 days</p>
                </div>
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Monitor className='w-5 h-5 text-blue-600' />
                    <span className='text-sm font-medium text-blue-800'>Devices</span>
                  </div>
                  <p className='text-2xl font-bold text-blue-700'>2</p>
                  <p className='text-xs text-blue-600'>Active devices</p>
                </div>
                <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <MapPin className='w-5 h-5 text-orange-600' />
                    <span className='text-sm font-medium text-orange-800'>Locations</span>
                  </div>
                  <p className='text-2xl font-bold text-orange-700'>2</p>
                  <p className='text-xs text-orange-600'>Different cities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Login History */}
          <div className='lg:col-span-3'>
            <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-8'>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h3 className='text-xl font-semibold text-gray-900'>Recent Login Activity</h3>
                  <p className='text-gray-600'>Monitor your account access and security</p>
                </div>
                <button
                  onClick={() => loadLoginHistory(true)}
                  disabled={refreshing}
                  className='flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors'
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

          {/* Content */}
          <div className='p-6'>
            {loading ? (
              <div className='text-center py-12'>
                <div className='inline-flex items-center gap-2 text-gray-500'>
                  <RefreshCw className='w-5 h-5 animate-spin' />
                  Loading login history...
                </div>
              </div>
            ) : loginHistory.length === 0 ? (
              <div className='text-center py-12'>
                <Clock className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>No Login History</h3>
                <p className='text-gray-500'>No login attempts found in your history.</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {loginHistory.map((login, index) => {
                  const DeviceIcon = getDeviceIcon(login.deviceType)
                  const StatusIcon = getStatusIcon(login.success)
                  
                  return (
                    <div
                      key={index}
                      className='bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                          {/* Device Icon */}
                          <div className='p-2 bg-white rounded-lg border border-gray-200'>
                            <DeviceIcon className='w-5 h-5 text-gray-600' />
                          </div>
                          
                          {/* Device Info */}
                          <div>
                            <div className='font-medium text-gray-900'>
                              {login.deviceName || 'Unknown Device'}
                            </div>
                            <div className='flex items-center gap-2 text-sm text-gray-600'>
                              <MapPin className='w-4 h-4' />
                              {login.location || 'Unknown Location'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Status and Time */}
                        <div className='text-right'>
                          <div className='flex items-center gap-2 mb-1'>
                            <div className={`p-1 rounded-full ${getStatusBg(login.success)}`}>
                              <StatusIcon className={`w-4 h-4 ${getStatusColor(login.success)}`} />
                            </div>
                            <span className={`text-sm font-medium ${getStatusColor(login.success)}`}>
                              {login.success ? 'Successful' : 'Failed'}
                            </span>
                          </div>
                          <div className='text-sm text-gray-500'>
                            {formatDate(login.timestamp)}
                          </div>
                          <div className='text-xs text-gray-400'>
                            {formatTime(login.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className='mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <ShieldCheck className='w-5 h-5 text-blue-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900'>Security Tips</h3>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600'>
            <div className='space-y-2'>
              <p className='font-medium text-gray-800'>Monitor Your Account</p>
              <ul className='space-y-1'>
                <li>• Check for unfamiliar login attempts</li>
                <li>• Look for logins from unexpected locations</li>
                <li>• Report suspicious activity immediately</li>
              </ul>
            </div>
            <div className='space-y-2'>
              <p className='font-medium text-gray-800'>Keep Your Account Secure</p>
              <ul className='space-y-1'>
                <li>• Use strong, unique passwords</li>
                <li>• Enable two-factor authentication</li>
                <li>• Log out from shared devices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginHistoryPage

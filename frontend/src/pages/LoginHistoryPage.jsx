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
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 py-8'>
      <div className='max-w-4xl mx-auto px-4'>
        {/* Header */}
        <div className='text-center mb-8'>
          <button
            onClick={() => navigate('/profile')}
            className='inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            Back to Profile
          </button>
          
          <div className='inline-flex items-center gap-3 mb-4'>
            <div className='p-3 bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl'>
              <Clock className='w-8 h-8 text-purple-600' />
            </div>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Login History</h1>
              <p className='text-gray-600'>View your recent login attempts and sessions</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className='bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden'>
          {/* Header with Refresh */}
          <div className='bg-gradient-to-r from-purple-50 to-violet-50 px-6 py-4 border-b border-purple-100'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-purple-100 rounded-lg'>
                  <ShieldCheck className='w-5 h-5 text-purple-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900'>Recent Activity</h3>
                  <p className='text-sm text-gray-600'>Monitor your account access</p>
                </div>
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

        {/* Security Tips */}
        <div className='mt-8 bg-white rounded-xl p-6 border border-gray-200'>
          <h3 className='font-semibold text-gray-900 mb-4'>Security Tips</h3>
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

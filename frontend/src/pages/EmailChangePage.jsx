import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosInstance } from '../lib/axios'
import { Mail, MailCheck, Eye, EyeOff, ArrowLeft, CheckCircle, XCircle, ShieldCheck, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const EmailChangePage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    newEmail: '',
    currentPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [currentUser, setCurrentUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axiosInstance.get('/auth/me')
        console.log('Current user data:', response.data) // Debug log
        setCurrentUser(response.data)
      } catch (error) {
        console.error('Error fetching user data:', error)
        toast.error('Failed to load user data')
      } finally {
        setUserLoading(false)
      }
    }

    fetchCurrentUser()
  }, [])

  // Email validation function
  const validateEmail = (email) => {
    const trimmed = email.trim()
    
    // Only validate format if email is not empty
    if (trimmed) {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
      if (!emailRegex.test(trimmed)) {
        return 'Please enter a valid email address'
      }
    }
    
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Validate email before submission
    const emailError = validateEmail(formData.newEmail)
    if (emailError) {
      setErrors({ newEmail: emailError })
      setLoading(false)
      return
    }
    
    setErrors({})

    try {
      const response = await axiosInstance.post('/auth/change-email', {
        newEmail: formData.newEmail,
        currentPassword: formData.currentPassword
      })
      
      toast.success('Verification email sent to your new address. Your current email remains active until verification.')
      setFormData({ newEmail: '', currentPassword: '' })
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to change email'
      setErrors({ general: message })
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear errors when user starts typing (don't validate while typing)
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, newEmail: true }))
    const emailError = validateEmail(formData.newEmail)
    setErrors(prev => ({ ...prev, newEmail: emailError }))
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8'>
      <div className='max-w-4xl mx-auto px-4'>
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
              <div className='p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg'>
                <Mail className='w-8 h-8 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Email Management</h1>
                <p className='text-gray-600 mt-1'>Update your email address and manage verification</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Current Email Info */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-8'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-3 bg-green-100 rounded-xl'>
                  <MailCheck className='w-6 h-6 text-green-600' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900'>Current Email</h3>
              </div>
              <div className='space-y-3'>
                <div className='p-3 bg-gray-50 rounded-lg'>
                  <p className='text-sm text-gray-600 mb-1'>Email Address</p>
                  {userLoading ? (
                    <div className='flex items-center gap-2'>
                      <div className='w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin'></div>
                      <span className='text-gray-500'>Loading...</span>
                    </div>
                  ) : (
                    <div>
                      <p className='font-medium text-gray-900'>{currentUser?.email || 'Not available'}</p>
                      {currentUser?.pendingEmail && (
                        <div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg'>
                          <p className='text-xs text-yellow-800 font-medium'>Pending Change:</p>
                          <p className='text-sm text-yellow-700'>{currentUser.pendingEmail}</p>
                          <p className='text-xs text-yellow-600 mt-1'>
                            Check your new email for verification instructions
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  {userLoading ? (
                    <div className='w-20 h-6 bg-gray-200 rounded-full animate-pulse'></div>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      currentUser?.isEmailVerified 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {currentUser?.isEmailVerified ? (
                        <>
                          <CheckCircle className='w-4 h-4' />
                          Verified
                        </>
                      ) : (
                        <>
                          <XCircle className='w-4 h-4' />
                          Unverified
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className='text-xs text-gray-500 bg-blue-50 p-3 rounded-lg'>
                  <p className='font-medium text-blue-800 mb-1'>Security Note</p>
                  <p>
                    {userLoading ? 'Loading...' : 
                     currentUser?.isEmailVerified 
                       ? 'Your email is verified and secure. Changing it will require verification at the new address.'
                       : 'Your email is not yet verified. You can still change it, but verification will be required at the new address.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Email Change Form */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-8'>

              <div className='mb-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>Change Email Address</h3>
                <p className='text-gray-600'>Enter your new email address and current password to proceed.</p>
              </div>

              <form onSubmit={handleSubmit} className='space-y-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    New Email Address
                  </label>
                  <input
                    type='email'
                    name='newEmail'
                    value={formData.newEmail}
                    onChange={handleInputChange}
                    onBlur={handleEmailBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      touched.newEmail && errors.newEmail
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder='Enter your new email address'
                    required
                  />
                  {touched.newEmail && errors.newEmail && (
                    <div className='flex items-center gap-2 text-red-600 text-sm mt-1'>
                      <XCircle className='w-4 h-4' />
                      {errors.newEmail}
                    </div>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Current Password
                  </label>
                  <div className='relative'>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name='currentPassword'
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                      placeholder='Enter your current password'
                      required
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                    >
                      {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <div className='flex items-center gap-2 text-red-600 text-sm mt-1'>
                      <XCircle className='w-4 h-4' />
                      {errors.currentPassword}
                    </div>
                  )}
                </div>

                {errors.general && (
                  <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                    <div className='flex items-center gap-2 text-red-800'>
                      <XCircle className='w-5 h-5' />
                      <span className='font-medium'>Error</span>
                    </div>
                    <p className='text-red-700 text-sm mt-1'>{errors.general}</p>
                  </div>
                )}

                {/* Security Notice */}
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <div className='flex items-start gap-3'>
                    <ShieldCheck className='w-5 h-5 text-blue-600 mt-0.5' />
                    <div className='text-sm text-blue-800'>
                      <p className='font-medium mb-1'>Security Notice</p>
                      <p>After changing your email, you'll receive a verification link at your new email address. You must verify the new email to complete the change.</p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type='submit'
                  disabled={loading || (touched.newEmail && errors.newEmail) || !formData.newEmail.trim() || !formData.currentPassword.trim()}
                  className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none'
                >
                  {loading ? 'Sending Verification...' : 'Change Email Address'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className='mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='p-2 bg-yellow-100 rounded-lg'>
              <HelpCircle className='w-5 h-5 text-yellow-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900'>Need Help?</h3>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600'>
            <div className='space-y-2'>
              <p className='font-medium text-gray-800'>Email Access</p>
              <p>Make sure you have access to the new email address before changing.</p>
            </div>
            <div className='space-y-2'>
              <p className='font-medium text-gray-800'>Verification</p>
              <p>Check your spam folder if you don't receive the verification email.</p>
            </div>
            <div className='space-y-2'>
              <p className='font-medium text-gray-800'>Support</p>
              <p>Contact support if you're having trouble with the verification process.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailChangePage
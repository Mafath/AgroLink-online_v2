import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosInstance } from '../lib/axios'
import { Mail, MailCheck, Eye, EyeOff, ArrowLeft, CheckCircle, XCircle, ShieldCheck } from 'lucide-react'
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      await axiosInstance.post('/auth/change-email', {
        newEmail: formData.newEmail,
        currentPassword: formData.currentPassword
      })
      
      toast.success('Verification email sent to new address')
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
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8'>
      <div className='max-w-2xl mx-auto px-4'>
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
            <div className='p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl'>
              <Mail className='w-8 h-8 text-blue-600' />
            </div>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Email Management</h1>
              <p className='text-gray-600'>Change your email address securely</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className='bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden'>
          {/* Current Email Display */}
          <div className='bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <MailCheck className='w-5 h-5 text-blue-600' />
              </div>
              <div>
                <h3 className='font-semibold text-gray-900'>Current Email</h3>
                <p className='text-sm text-gray-600'>Your verified email address</p>
              </div>
            </div>
            <div className='mt-3 flex items-center gap-2 text-sm'>
              <span className='text-gray-600'>user@example.com</span>
              <span className='inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs'>
                <CheckCircle className='w-3 h-3' />
                Verified
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className='p-6 space-y-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                New Email Address
              </label>
              <input
                type='email'
                name='newEmail'
                value={formData.newEmail}
                onChange={handleInputChange}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                placeholder='Enter your new email address'
                required
              />
              {errors.newEmail && (
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
              disabled={loading}
              className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none'
            >
              {loading ? 'Sending Verification...' : 'Change Email Address'}
            </button>
          </form>
        </div>

        {/* Help Section */}
        <div className='mt-8 bg-white rounded-xl p-6 border border-gray-200'>
          <h3 className='font-semibold text-gray-900 mb-3'>Need Help?</h3>
          <div className='space-y-2 text-sm text-gray-600'>
            <p>• Make sure you have access to the new email address</p>
            <p>• Check your spam folder if you don't receive the verification email</p>
            <p>• Contact support if you're having trouble with the verification process</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailChangePage
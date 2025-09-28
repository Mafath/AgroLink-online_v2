import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosInstance } from '../lib/axios'
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, XCircle, ShieldCheck, Key } from 'lucide-react'
import toast from 'react-hot-toast'

const PasswordChangePage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (password.length >= 12) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    return strength
  }

  const getStrengthLabel = (strength) => {
    if (strength <= 2) return { label: 'Weak', color: 'text-red-600' }
    if (strength <= 4) return { label: 'Medium', color: 'text-yellow-600' }
    return { label: 'Strong', color: 'text-green-600' }
  }

  const getStrengthColor = (strength) => {
    if (strength <= 2) return 'bg-red-400'
    if (strength <= 4) return 'bg-yellow-400'
    return 'bg-green-400'
  }

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.newPassword))
  }, [formData.newPassword])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' })
      setLoading(false)
      return
    }

    if (passwordStrength < 3) {
      setErrors({ newPassword: 'Password is too weak. Please choose a stronger password.' })
      setLoading(false)
      return
    }

    try {
      await axiosInstance.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
      
      toast.success('Password changed successfully')
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to change password'
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

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8'>
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
            <div className='p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl'>
              <Lock className='w-8 h-8 text-green-600' />
            </div>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Password Security</h1>
              <p className='text-gray-600'>Update your password for better security</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className='bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden'>
          {/* Security Info */}
          <div className='bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-green-100 rounded-lg'>
                <ShieldCheck className='w-5 h-5 text-green-600' />
              </div>
              <div>
                <h3 className='font-semibold text-gray-900'>Password Requirements</h3>
                <p className='text-sm text-gray-600'>Choose a strong, unique password</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className='p-6 space-y-6'>
            {/* Current Password */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Current Password
              </label>
              <div className='relative'>
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name='currentPassword'
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200'
                  placeholder='Enter your current password'
                  required
                />
                <button
                  type='button'
                  onClick={() => togglePasswordVisibility('current')}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                >
                  {showPasswords.current ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                </button>
              </div>
              {errors.currentPassword && (
                <div className='flex items-center gap-2 text-red-600 text-sm mt-1'>
                  <XCircle className='w-4 h-4' />
                  {errors.currentPassword}
                </div>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                New Password
              </label>
              <div className='relative'>
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name='newPassword'
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200'
                  placeholder='Enter your new password'
                  required
                />
                <button
                  type='button'
                  onClick={() => togglePasswordVisibility('new')}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                >
                  {showPasswords.new ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className='mt-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm text-gray-600'>Password Strength</span>
                    <span className={`text-sm font-medium ${getStrengthLabel(passwordStrength).color}`}>
                      {getStrengthLabel(passwordStrength).label}
                    </span>
                  </div>
                  <div className='flex gap-1'>
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <div
                        key={level}
                        className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                          level <= passwordStrength
                            ? getStrengthColor(passwordStrength)
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {errors.newPassword && (
                <div className='flex items-center gap-2 text-red-600 text-sm mt-1'>
                  <XCircle className='w-4 h-4' />
                  {errors.newPassword}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Confirm New Password
              </label>
              <div className='relative'>
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200'
                  placeholder='Confirm your new password'
                  required
                />
                <button
                  type='button'
                  onClick={() => togglePasswordVisibility('confirm')}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                >
                  {showPasswords.confirm ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className='flex items-center gap-2 text-red-600 text-sm mt-1'>
                  <XCircle className='w-4 h-4' />
                  {errors.confirmPassword}
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

            {/* Password Tips */}
            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
              <div className='flex items-start gap-3'>
                <Key className='w-5 h-5 text-green-600 mt-0.5' />
                <div className='text-sm text-green-800'>
                  <p className='font-medium mb-2'>Password Tips</p>
                  <ul className='space-y-1 text-green-700'>
                    <li>• Use at least 8 characters (12+ recommended)</li>
                    <li>• Include uppercase and lowercase letters</li>
                    <li>• Add numbers and special characters</li>
                    <li>• Avoid common words or personal information</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={loading || passwordStrength < 3}
              className='w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none'
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <div className='mt-8 bg-white rounded-xl p-6 border border-gray-200'>
          <h3 className='font-semibold text-gray-900 mb-3'>Security Notice</h3>
          <div className='space-y-2 text-sm text-gray-600'>
            <p>• After changing your password, you'll be logged out of all devices</p>
            <p>• You'll need to log in again with your new password</p>
            <p>• Make sure to update your password in any password managers</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PasswordChangePage

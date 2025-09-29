import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosInstance } from '../lib/axios'
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, XCircle, ShieldCheck, Key, CheckCircle2, Circle } from 'lucide-react'
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
  const [touched, setTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  })

  // Password criteria validation (same as signup page)
  const passwordCriteria = useMemo(() => {
    const pwd = formData.newPassword || ""
    return {
      length: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      symbol: /[^A-Za-z0-9]/.test(pwd),
    }
  }, [formData.newPassword])

  const allPasswordCriteriaMet = useMemo(() => {
    return passwordCriteria.length && passwordCriteria.upper && passwordCriteria.lower && passwordCriteria.number && passwordCriteria.symbol
  }, [passwordCriteria])


  // Validation functions (same as signup page)
  const validatePassword = (password) => {
    if (!password) return "Password is required"
    if (password.length < 8) return "Password must be at least 8 characters"
    return ""
  }

  // Enhanced validation for password strength requirements
  const validatePasswordStrength = (password) => {
    if (!password) return "Password is required"
    if (password.length < 8) return "Password must be at least 8 characters"
    
    // Check individual criteria
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter (A-Z)"
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter (a-z)"
    if (!/[0-9]/.test(password)) return "Password must contain at least one number (0-9)"
    if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one symbol (!@#$% etc.)"
    
    return ""
  }

  const validateAll = (data) => {
    return {
      currentPassword: data.currentPassword ? "" : "Current password is required",
      newPassword: validatePasswordStrength(data.newPassword),
      confirmPassword: data.confirmPassword !== data.newPassword ? "Passwords do not match" : ""
    }
  }

  const isFormValid = useMemo(() => {
    const v = validateAll(formData)
    return !v.currentPassword && !v.newPassword && !v.confirmPassword && allPasswordCriteriaMet
  }, [formData, allPasswordCriteriaMet])


  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    // Validation using the same logic as signup page
    const v = validateAll(formData)
    setErrors(v)
    setTouched({ currentPassword: true, newPassword: true, confirmPassword: true })
    
    if (!isFormValid) {
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

  const handleBlur = (field) => (e) => {
    setTouched((t) => ({ ...t, [field]: true }))
    if (field === "newPassword") {
      setErrors((er) => ({ ...er, newPassword: validatePasswordStrength(e.target.value) }))
    } else if (field === "confirmPassword") {
      setErrors((er) => ({ ...er, confirmPassword: e.target.value !== formData.newPassword ? "Passwords do not match" : "" }))
    } else if (field === "currentPassword") {
      setErrors((er) => ({ ...er, currentPassword: e.target.value ? "" : "Current password is required" }))
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 py-8'>
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
              <div className='p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg'>
                <Lock className='w-8 h-8 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Password Security</h1>
                <p className='text-gray-600 mt-1'>Update your password and security settings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Password Tips Sidebar */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-8'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-3 bg-green-100 rounded-xl'>
                  <ShieldCheck className='w-6 h-6 text-green-600' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900'>Password Tips</h3>
              </div>
              <div className='space-y-4'>
                <div className='space-y-3'>
                  <div className='flex items-start gap-3'>
                    <div className='w-2 h-2 bg-green-500 rounded-full mt-2'></div>
                    <div>
                      <p className='text-sm font-medium text-gray-800'>Use at least 8 characters</p>
                      <p className='text-xs text-gray-600'>12+ characters recommended</p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <div className='w-2 h-2 bg-green-500 rounded-full mt-2'></div>
                    <div>
                      <p className='text-sm font-medium text-gray-800'>Mix uppercase & lowercase</p>
                      <p className='text-xs text-gray-600'>Include both letter cases</p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <div className='w-2 h-2 bg-green-500 rounded-full mt-2'></div>
                    <div>
                      <p className='text-sm font-medium text-gray-800'>Add numbers & symbols</p>
                      <p className='text-xs text-gray-600'>Special characters increase security</p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <div className='w-2 h-2 bg-orange-500 rounded-full mt-2'></div>
                    <div>
                      <p className='text-sm font-medium text-gray-800'>Avoid common words</p>
                      <p className='text-xs text-gray-600'>Don't use personal information</p>
                    </div>
                  </div>
                </div>
                <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
                  <p className='text-xs text-green-800 font-medium mb-1'>Security Note</p>
                  <p className='text-xs text-green-700'>After changing your password, you'll be logged out of all devices and need to log in again.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Password Change Form */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-8'>

              <div className='mb-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>Change Password</h3>
                <p className='text-gray-600'>Enter your current password and choose a new secure password.</p>
              </div>

              <form onSubmit={handleSubmit} className='space-y-6'>
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
                  onBlur={handleBlur('currentPassword')}
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
              {touched.currentPassword && errors.currentPassword && (
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
                  onBlur={handleBlur('newPassword')}
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
              
              
              {touched.newPassword && errors.newPassword && (
                <div className='flex items-center gap-2 text-red-600 text-sm mt-1'>
                  <XCircle className='w-4 h-4' />
                  {errors.newPassword}
                </div>
              )}
              
              {/* Password Requirements Checklist (same as signup page) */}
              {formData.newPassword && (
                <div className='mt-3 space-y-1'>
                  {[{
                    key: 'length',
                    label: 'At least 8 characters'
                  }, {
                    key: 'upper',
                    label: 'At least one uppercase letter (A-Z)'
                  }, {
                    key: 'lower',
                    label: 'At least one lowercase letter (a-z)'
                  }, {
                    key: 'number',
                    label: 'At least one number (0-9)'
                  }, {
                    key: 'symbol',
                    label: 'At least one symbol (!@#$% etc.)'
                  }].map((item) => {
                    const ok = passwordCriteria[item.key]
                    return (
                      <div key={item.key} className={`flex items-center text-xs ${ok ? 'text-green-600' : 'text-gray-500'}`}>
                        {ok ? <CheckCircle2 className='w-3.5 h-3.5 mr-2' /> : <Circle className='w-3.5 h-3.5 mr-2' />}
                        <span>{item.label}</span>
                      </div>
                    )
                  })}
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
                  onBlur={handleBlur('confirmPassword')}
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
              {touched.confirmPassword && errors.confirmPassword && (
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
              disabled={loading}
              className='w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none'
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className='mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='p-2 bg-yellow-100 rounded-lg'>
              <ShieldCheck className='w-5 h-5 text-yellow-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900'>Security Notice</h3>
          </div>
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

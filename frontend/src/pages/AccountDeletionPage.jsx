import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosInstance } from '../lib/axios'
import { AlertTriangle, Trash2, ArrowLeft, ShieldCheck, XCircle, CheckCircle, Lock } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

const AccountDeletionPage = () => {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [formData, setFormData] = useState({
    confirmation: '',
    currentPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    if (formData.confirmation !== 'DELETE') {
      setErrors({ confirmation: 'Please type "DELETE" to confirm' })
      setLoading(false)
      return
    }

    if (!formData.currentPassword) {
      setErrors({ currentPassword: 'Current password is required' })
      setLoading(false)
      return
    }

    try {
      await axiosInstance.delete('/auth/delete-account', {
        data: {
          currentPassword: formData.currentPassword
        }
      })
      
      toast.success('Account deleted successfully')
      await logout()
      navigate('/')
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to delete account'
      setErrors({ general: message })
      // Removed toast.error to show only inline error
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

  const dataToBeDeleted = [
    'Your profile and personal information',
    'All your listings and products',
    'Your order history and transactions',
    'Your activity and notification history',
    'Your cart and saved items',
    'All associated data and preferences'
  ]

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 py-8'>
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
              <div className='p-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg'>
                <AlertTriangle className='w-8 h-8 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Account Deletion</h1>
                <p className='text-gray-600 mt-1'>Permanently delete your account and all associated data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Card */}
        <div className='bg-white rounded-2xl shadow-xl border border-red-200 overflow-hidden mb-6'>
          <div className='bg-gradient-to-r from-red-50 to-rose-50 px-6 py-4 border-b border-red-100'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-red-100 rounded-lg'>
                <AlertTriangle className='w-5 h-5 text-red-600' />
              </div>
              <div>
                <h3 className='font-semibold text-red-900'>Warning: This Action Cannot Be Undone</h3>
                <p className='text-sm text-red-700'>Please read carefully before proceeding</p>
              </div>
            </div>
          </div>

          <div className='p-6'>
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
              <h4 className='font-medium text-red-900 mb-3'>What will be permanently deleted:</h4>
              <ul className='space-y-2 text-sm text-red-800'>
                {dataToBeDeleted.map((item, index) => (
                  <li key={index} className='flex items-center gap-2'>
                    <Trash2 className='w-4 h-4 text-red-600' />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
              <h4 className='font-medium text-yellow-900 mb-2'>Important Considerations:</h4>
              <ul className='space-y-1 text-sm text-yellow-800'>
                <li>• This action is irreversible and cannot be undone</li>
                <li>• You will lose access to all your data immediately</li>
                <li>• Any ongoing orders or transactions will be cancelled</li>
                <li>• You will need to create a new account to use our services again</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Deletion Form */}
        <div className='bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden'>
          <div className='bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-gray-100 rounded-lg'>
                <Lock className='w-5 h-5 text-gray-600' />
              </div>
              <div>
                <h3 className='font-semibold text-gray-900'>Confirm Account Deletion</h3>
                <p className='text-sm text-gray-600'>Enter your password to proceed</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='p-6 space-y-6'>
            {/* Confirmation Input */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Type "DELETE" to confirm
              </label>
              <input
                type='text'
                name='confirmation'
                value={formData.confirmation}
                onChange={handleInputChange}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200'
                placeholder='Type DELETE to confirm'
                required
              />
              {errors.confirmation && (
                <div className='flex items-center gap-2 text-red-600 text-sm mt-1'>
                  <XCircle className='w-4 h-4' />
                  {errors.confirmation}
                </div>
              )}
            </div>

            {/* Current Password */}
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
                  className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200'
                  placeholder='Enter your current password'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                >
                  {showPassword ? <XCircle className='w-5 h-5' /> : <CheckCircle className='w-5 h-5' />}
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

            {/* Final Warning */}
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <div className='flex items-start gap-3'>
                <AlertTriangle className='w-5 h-5 text-red-600 mt-0.5' />
                <div className='text-sm text-red-800'>
                  <p className='font-medium mb-1'>Final Warning</p>
                  <p>By clicking "Delete Account", you acknowledge that this action is permanent and cannot be undone. All your data will be immediately and permanently deleted.</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={loading || formData.confirmation !== 'DELETE' || !formData.currentPassword}
              className='w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 px-6 rounded-lg font-medium hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none'
            >
              {loading ? 'Deleting Account...' : 'Delete Account Permanently'}
            </button>
          </form>
        </div>

        {/* Alternative Options */}
        <div className='mt-8 bg-white rounded-xl p-6 border border-gray-200'>
          <h3 className='font-semibold text-gray-900 mb-4'>Before You Delete</h3>
          <div className='space-y-3 text-sm text-gray-600'>
            <p>Consider these alternatives before permanently deleting your account:</p>
            <ul className='space-y-2 ml-4'>
              <li>• <strong>Deactivate temporarily:</strong> Contact support to temporarily disable your account</li>
              <li>• <strong>Export your data:</strong> Download your data before deletion</li>
              <li>• <strong>Update privacy settings:</strong> Adjust what information is visible</li>
              <li>• <strong>Contact support:</strong> If you're having issues, we're here to help</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountDeletionPage

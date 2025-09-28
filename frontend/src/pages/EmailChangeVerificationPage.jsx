import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../lib/axios'
import { CheckCircle, XCircle, Mail, ArrowLeft, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const EmailChangeVerificationPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (token) {
      verifyEmailChange()
    } else {
      setError('Invalid verification link')
      setLoading(false)
    }
  }, [token])

  const verifyEmailChange = async () => {
    try {
      const response = await axiosInstance.get(`/auth/verify-email-change/${token}`)
      setSuccess(true)
      setResult(response.data)
      toast.success('Email successfully changed and verified!')
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to verify email change'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-8'>
        <div className='max-w-2xl mx-auto px-4'>
          <div className='bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center'>
            <div className='inline-flex items-center gap-3 mb-4'>
              <Clock className='w-8 h-8 text-blue-600 animate-spin' />
              <h1 className='text-2xl font-bold text-gray-900'>Verifying Email Change</h1>
            </div>
            <p className='text-gray-600'>Please wait while we verify your email change...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8'>
      <div className='max-w-2xl mx-auto px-4'>
        {/* Header */}
        <div className='mb-8'>
          <button
            onClick={() => navigate('/profile?tab=security')}
            className='inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group'
          >
            <ArrowLeft className='w-4 h-4 group-hover:-translate-x-1 transition-transform' />
            Back to Security Center
          </button>
        </div>

        {/* Result Card */}
        <div className='bg-white rounded-3xl shadow-xl border border-gray-100 p-8'>
          {success ? (
            <div className='text-center'>
              <div className='inline-flex items-center gap-4 mb-6'>
                <div className='p-4 bg-green-100 rounded-2xl'>
                  <CheckCircle className='w-8 h-8 text-green-600' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900'>Email Successfully Changed!</h1>
                  <p className='text-gray-600 mt-1'>Your email address has been updated and verified</p>
                </div>
              </div>

              {result && (
                <div className='bg-green-50 border border-green-200 rounded-2xl p-6 mb-6'>
                  <div className='space-y-3'>
                    <div className='flex items-center gap-3'>
                      <Mail className='w-5 h-5 text-green-600' />
                      <span className='font-medium text-green-800'>Email Change Details</span>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                      <div>
                        <p className='text-gray-600 mb-1'>Previous Email</p>
                        <p className='font-medium text-gray-900'>{result.oldEmail}</p>
                      </div>
                      <div>
                        <p className='text-gray-600 mb-1'>New Email</p>
                        <p className='font-medium text-green-700'>{result.newEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className='space-y-4'>
                <p className='text-gray-600'>
                  Your email address has been successfully changed and verified. 
                  You can now use your new email address to log in.
                </p>
                
                <button
                  onClick={() => navigate('/profile?tab=security')}
                  className='inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105'
                >
                  <CheckCircle className='w-5 h-5' />
                  Continue to Profile
                </button>
              </div>
            </div>
          ) : (
            <div className='text-center'>
              <div className='inline-flex items-center gap-4 mb-6'>
                <div className='p-4 bg-red-100 rounded-2xl'>
                  <XCircle className='w-8 h-8 text-red-600' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900'>Verification Failed</h1>
                  <p className='text-gray-600 mt-1'>Unable to verify your email change</p>
                </div>
              </div>

              <div className='bg-red-50 border border-red-200 rounded-2xl p-6 mb-6'>
                <div className='flex items-center gap-3 mb-3'>
                  <XCircle className='w-5 h-5 text-red-600' />
                  <span className='font-medium text-red-800'>Error Details</span>
                </div>
                <p className='text-red-700 text-sm'>{error}</p>
              </div>

              <div className='space-y-4'>
                <p className='text-gray-600'>
                  The verification link may be invalid, expired, or already used. 
                  Please try changing your email again.
                </p>
                
                <div className='flex gap-3 justify-center'>
                  <button
                    onClick={() => navigate('/profile?tab=security')}
                    className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    Back to Security
                  </button>
                  <button
                    onClick={() => navigate('/security/email')}
                    className='px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200'
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmailChangeVerificationPage

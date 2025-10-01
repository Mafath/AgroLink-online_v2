import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { axiosInstance } from '../lib/axios'
import { Mail, CheckCircle, XCircle, Loader, ArrowLeft } from 'lucide-react'

const EmailVerificationStatusPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [message, setMessage] = useState('')
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

  // Check if email was passed from signup or login redirect
  useEffect(() => {
    // Check URL query parameters first
    const urlParams = new URLSearchParams(location.search)
    const emailFromUrl = urlParams.get('email')
    
    if (emailFromUrl) {
      setEmail(emailFromUrl)
      setMessage('Please verify your email before logging in.')
      setStatus('error')
    } else if (location.state?.email) {
      // Fallback to location state
      setEmail(location.state.email)
      if (location.state.message) {
        setMessage(location.state.message)
        setStatus('success')
      }
    }
  }, [location.state, location.search])

  const checkVerificationStatus = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address')
      setStatus('error')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await axiosInstance.get(`/email-verification/status/${email}`)
      
      if (response.data.success) {
        setStatus('success')
        setIsEmailVerified(response.data.isEmailVerified)
        setUserInfo(response.data)
        
        if (response.data.isEmailVerified) {
          setMessage('Your email is verified! You can now log in.')
        } else {
          setMessage('Your email is not verified yet.')
        }
      } else {
        setStatus('error')
        setMessage(response.data.message || 'Failed to check verification status')
      }
    } catch (error) {
      setStatus('error')
      setMessage(error.response?.data?.message || 'Failed to check verification status')
    }
  }

  const resendVerificationEmail = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address')
      setStatus('error')
      return
    }

    setStatus('loading')
    setMessage('Sending verification email...')

    try {
      const response = await axiosInstance.post('/email-verification/resend', { email })
      
      if (response.data.success) {
        setStatus('success')
        setMessage('Verification email sent successfully! Please check your inbox.')
      } else {
        setStatus('error')
        setMessage(response.data.message || 'Failed to send verification email')
      }
    } catch (error) {
      setStatus('error')
      setMessage(error.response?.data?.message || 'Failed to send verification email')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-700 text-emerald-700 rounded-full transition-colors hover:bg-emerald-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-xs">Back</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Mail className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verification</h1>
          <p className="text-gray-600">Check your verification status or resend verification email</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email address"
            />
          </div>

          <button
            onClick={checkVerificationStatus}
            disabled={status === 'loading'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {status === 'loading' ? (
              <Loader className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            Check Status
          </button>

          {status === 'success' && userInfo && !isEmailVerified && (
            <button
              onClick={resendVerificationEmail}
              disabled={status === 'loading'}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {status === 'loading' ? (
                <Loader className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              Resend Verification Email
            </button>
          )}

          {status === 'success' && isEmailVerified && (
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Login
            </button>
          )}
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-lg ${
            status === 'success' 
              ? (isEmailVerified 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-yellow-50 border border-yellow-200 text-yellow-800')
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {status === 'success' ? (
                isEmailVerified ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 mr-2" />
                )
              ) : (
                <XCircle className="w-5 h-5 mr-2" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          </div>
        )}

        {status === 'success' && userInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Account Information</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Name:</strong> {userInfo.fullName || 'Not provided'}</p>
              <p><strong>Email:</strong> {userInfo.email}</p>
              <p><strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  isEmailVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isEmailVerified ? 'Verified' : 'Not Verified'}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmailVerificationStatusPage

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../lib/axios'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

const EmailVerificationPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')
  const verificationStarted = useRef(false) // Prevent multiple verification attempts

  useEffect(() => {
    // Prevent multiple verification attempts (React StrictMode issue)
    if (verificationStarted.current) {
      console.log('Verification already started, skipping...')
      return
    }
    
    verificationStarted.current = true
    
    const verifyEmail = async () => {
      console.log('Verification token:', token) // Debug log
      
      if (!token) {
        setStatus('error')
        setMessage('No verification token provided')
        return
      }

      try {
        console.log('Sending verification request for token:', token) // Debug log
        const response = await axiosInstance.get(`/email-verification/verify/${token}`)
        console.log('Verification response:', response.data) // Debug log
        
        if (response.data.success) {
          setStatus('success')
          if (response.data.message === 'Email is already verified') {
            setMessage('Your email is already verified! You can now use all features of AgroLink.')
          } else {
            setMessage('Email verified successfully! You can now use all features of AgroLink.')
          }
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(response.data.message || 'Verification failed')
        }
      } catch (error) {
        console.error('Verification error:', error) // Debug log
        setStatus('error')
        
        // Handle specific error cases
        if (error.response?.data?.action === 'request_new_email') {
          setMessage('This verification link is no longer valid. Please request a new verification email.')
        } else {
          setMessage(error.response?.data?.message || 'Verification failed. Please try again.')
        }
      }
    }

    verifyEmail()
  }, [token, navigate])

  const handleResendEmail = async () => {
    try {
      // Redirect to email verification status page where they can request a resend
      navigate('/email-verification-status')
    } catch (error) {
      console.error('Error redirecting to verification status:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-6">
              <Loader className="w-16 h-16 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Verifying Email...</h1>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Verified!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">
                You will be redirected to the login page in a few seconds...
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <XCircle className="w-16 h-16 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Request New Verification Email
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default EmailVerificationPage

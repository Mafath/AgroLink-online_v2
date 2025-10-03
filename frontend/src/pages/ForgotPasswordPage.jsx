import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Logo from "../assets/AgroLink_logo3-removebg-preview.png";
import { axiosInstance } from "../lib/axios";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email) => {
    const trimmed = email.trim();
    if (!trimmed) return "Email is required";
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(trimmed)) return "Enter a valid email address";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setEmailSent(true);
        toast.success(response.data.message, { id: 'forgot-password-success' });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage = error.response?.data?.error?.message || "Failed to send reset email";
      setError(errorMessage);
      toast.error(errorMessage, { id: 'forgot-password-error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    if (touched) {
      setError(validateEmail(value));
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center pt-0 pb-7 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 mt-7">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img src={Logo} alt="AgroLink logo" className="w-16 h-19 rounded-2xl object-cover" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
          </div>

          <div className="card text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-green-800">
                <Mail className="mx-auto h-12 w-12 mb-3 text-green-400" />
                <h3 className="text-lg font-medium mb-2">Email sent successfully!</h3>
                <p className="text-sm">
                  Click the link in your email to reset your password. The link will expire in 24 hours.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/login"
                className="btn-primary w-full flex justify-center items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
              
              <div className="text-sm text-gray-600">
                Didn't receive the email? Check your spam folder or try again.
              </div>
              
              <button
                onClick={() => setEmailSent(false)}
                className="text-primary-500 hover:text-primary-600 text-sm font-medium"
              >
                Send another email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center pt-0 pb-7 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 mt-7">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src={Logo} alt="AgroLink logo" className="w-16 h-19 rounded-2xl object-cover" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label">
                <Mail className="inline mr-2 h-4 w-4" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => setTouched(true)}
                  className="input-field"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              {touched && error && (
                <p className="mt-1 text-xs text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`btn-primary w-full flex justify-center items-center ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-primary-500 hover:text-primary-600 text-sm font-medium inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

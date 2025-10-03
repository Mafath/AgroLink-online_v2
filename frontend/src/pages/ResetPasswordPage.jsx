import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import Logo from "../assets/AgroLink_logo3-removebg-preview.png";
import { axiosInstance } from "../lib/axios";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password is weak";
    
    const pwd = password;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
    
    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      return "Password is weak";
    }
    
    return "";
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  };

  const passwordCriteria = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    symbol: /[^A-Za-z0-9]/.test(formData.password),
  };

  const isFormValid = 
    !validatePassword(formData.password) && 
    !validateConfirmPassword(formData.confirmPassword, formData.password) &&
    passwordCriteria.length && passwordCriteria.upper && passwordCriteria.lower && passwordCriteria.number && passwordCriteria.symbol;

  useEffect(() => {
    if (!token) {
      setTokenInvalid(true);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);
    
    setErrors({
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });
    setTouched({ password: true, confirmPassword: true });
    
    if (passwordError || confirmPasswordError) return;
    if (!isFormValid) return;

    setIsLoading(true);

    try {
      const response = await axiosInstance.post('/auth/reset-password', {
        token,
        password: formData.password
      });

      if (response.data.success) {
        setPasswordReset(true);
        toast.success("Password reset successfully!", { id: 'reset-success' });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      const errorMessage = error.response?.data?.error?.message || "Failed to reset password";
      
      if (error.response?.status === 400 && errorMessage.includes("expired")) {
        toast.error("Reset link has expired", { id: 'reset-error' });
        setTimeout(() => {
          navigate('/forgot-password');
        }, 2000);
        return;
      }
      
      if (error.response?.status === 400 && errorMessage.includes("invalid")) {
        toast.error("Invalid reset link", { id: 'reset-error' });
        setTimeout(() => {
          navigate('/forgot-password');
        }, 2000);
        return;
      }
      
      toast.error("Failed to reset password", { id: 'reset-error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, password: value });
    
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
    
    // Revalidate confirm password if it's been touched
    if (touched.confirmPassword) {
      setErrors(prev => ({ 
        ...prev, 
        confirmPassword: validateConfirmPassword(formData.confirmPassword, value) 
      }));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, confirmPassword: value });
    
    if (touched.confirmPassword) {
      setErrors(prev => ({ 
        ...prev, 
        confirmPassword: validateConfirmPassword(value, formData.password) 
      }));
    }
  };

  const handleBlur = (field) => (e) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (field === "password") {
      setErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }));
    } else if (field === "confirmPassword") {
      setErrors(prev => ({ 
        ...prev, 
        confirmPassword: validateConfirmPassword(e.target.value, formData.password) 
      }));
    }
  };

  const errorText = (text) => (
    <p className="mt-1 text-xs text-red-600">{text}</p>
  );

  if (tokenInvalid) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center pt-0 pb-7 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 mt-7">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img src={Logo} alt="AgroLink logo" className="w-16 h-19 rounded-2xl object-cover" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Invalid Reset Link</h2>
            <p className="mt-2 text-sm text-gray-600">
              The password reset link is invalid or missing.
            </p>
          </div>

          <div className="card text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-800">
                <Lock className="mx-auto h-12 w-12 mb-3 text-red-400" />
                <h3 className="text-lg font-medium mb-2">Unable to Reset Password</h3>
                <p className="text-sm">
                  Please request a new password reset link from the login page.
                </p>
              </div>
            </div>

            <Link
              to="/login"
              className="btn-primary w-full flex justify-center items-center"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center pt-0 pb-7 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 mt-7">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img src={Logo} alt="AgroLink logo" className="w-16 h-19 rounded-2xl object-cover" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Password Reset Successful!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </div>

          <div className="card text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-green-800">
                <CheckCircle className="mx-auto h-12 w-12 mb-3 text-green-400" />
                <h3 className="text-lg font-medium mb-2">All Set!</h3>
                <p className="text-sm">
                  You can now log in to your account with your new password.
                </p>
              </div>
            </div>

            <Link
              to="/login"
              className="btn-primary w-full flex justify-center items-center"
            >
              Login to Your Account
            </Link>
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
            Enter your new password below.
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div>
              <label className="form-label">
                <Lock className="inline mr-2 h-4 w-4" />
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handlePasswordChange}
                  onBlur={handleBlur("password")}
                  className="input-field pr-10"
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {touched.password && errors.password && errorText(errors.password)}
              
              {/* Password Requirements Checklist */}
              <div className="mt-2 space-y-1">
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
                  const ok = passwordCriteria[item.key];
                  return (
                    <div key={item.key} className={`flex items-center text-xs ${ok ? 'text-green-600' : 'text-gray-500'}`}>
                      {ok ? <CheckCircle className="w-3.5 h-3.5 mr-2" /> : <div className="w-3.5 h-3.5 mr-2 border border-gray-400 rounded-full"></div>}
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="form-label">
                <Lock className="inline mr-2 h-4 w-4" />
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onBlur={handleBlur("confirmPassword")}
                  className="input-field pr-10"
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && errorText(errors.confirmPassword)}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className={`btn-primary w-full flex justify-center items-center ${
                !isFormValid || isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-primary-500 hover:text-primary-600 text-sm font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

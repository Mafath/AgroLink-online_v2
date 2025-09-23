import { useMemo, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
// import Logo from "../assets/AgroLink logo3.png";
import Logo from "../assets/AgroLink_logo3-removebg-preview.png";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();

  const validateEmail = (email) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return "Email is required";
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(normalized)) return "Enter a valid email address";
    return "";
  };

  const validatePassword = (pwd) => {
    if (!pwd) return "Password is required";
    return "";
  };

  const validateAll = (data) => ({
    email: validateEmail(data.email),
    password: validatePassword(data.password),
  });

  const isFormValid = useMemo(() => {
    const v = validateAll(formData);
    return !v.email && !v.password;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validateAll(formData);
    setErrors(v);
    setTouched({ email: true, password: true });
    if (!isFormValid) return;

    login({
      ...formData,
      email: formData.email.trim().toLowerCase(),
    });
  };

  const handleBlur = (field) => (e) => {
    setTouched((t) => ({ ...t, [field]: true }));
    if (field === "email") {
      const normalized = e.target.value.trim().toLowerCase();
      setFormData((d) => ({ ...d, email: normalized }));
      setErrors((er) => ({ ...er, email: validateEmail(normalized) }));
    } else if (field === "password") {
      setErrors((er) => ({ ...er, password: validatePassword(e.target.value) }));
    }
  };

  const errorText = (text) => (
    <p className="mt-1 text-xs text-red-600">{text}</p>
  );

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center pt-0 pb-7 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 mt-7">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src={Logo} alt="AgroLink logo" className="w-16 h-19 rounded-2xl object-cover" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your AgroLink account</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="form-label">
                <Mail className="inline mr-2 h-4 w-4" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, email: value });
                    if (touched.email) {
                      setErrors((er) => ({ ...er, email: validateEmail(value) }));
                    }
                  }}
                  onBlur={handleBlur("email")}
                  className={`input-field`}
                  placeholder="Enter your email address"
                />
              </div>
              {touched.email && errors.email && errorText(errors.email)}
            </div>

            {/* Password Field */}
            <div>
              <label className="form-label">
                <Lock className="inline mr-2 h-4 w-4" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, password: value });
                    if (touched.password) {
                      setErrors((er) => ({ ...er, password: validatePassword(value) }));
                    }
                  }}
                  onBlur={handleBlur("password")}
                  className={`input-field pr-10`}
                  placeholder="Enter your password"
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
            </div>

            {/* Row: Remember/Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Remember me</label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-primary-500 hover:text-primary-600">Forgot password?</a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`btn-primary w-full flex justify-center items-center ${(!isFormValid || isLoggingIn) ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={isLoggingIn || !isFormValid}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google OAuth Button */}
          <div className="mt-6">
            <button
              onClick={() => toast.info('Google OAuth integration coming soon!')}
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>

        {/* Registration Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-medium text-primary-500 hover:text-primary-600 transition-colors">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
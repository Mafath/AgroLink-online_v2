import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";


const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "BUYER",
  });

  const { signup, isSigningUp } = useAuthStore();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 8) return toast.error("Password must be at least 8 characters");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = validateForm();
    if (success === true) {
      const result = await signup(formData);
      if (result?.success) navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">A</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">Join AgroLink and connect with the agricultural community</p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="form-label">I want to join as a</label>
              <div className="grid grid-cols-2 gap-3">
                {["FARMER", "BUYER"].map((role) => (
                  <label
                    key={role}
                    className={`relative flex cursor-pointer rounded-lg border p-4 ${
                      formData.role === role ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="sr-only"
                    />
                    <div className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900 capitalize">{role.toLowerCase()}</span>
                      <span className="block text-xs text-gray-500">
                        {role === 'FARMER'
                          ? 'Sell your agricultural products directly to buyers'
                          : 'Purchase fresh produce and products from farmers'}
                      </span>
                    </div>
                    {formData.role === role && (
                      <div className="absolute top-4 right-4 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Mail className="size-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`input-field pl-8`}
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Lock className="size-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`input-field pl-8 pr-10`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isSigningUp} className="btn-primary w-full flex justify-center items-center">
              {isSigningUp ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Terms */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-primary-500 hover:text-primary-600">Terms of Service</a>{' '}and{' '}
              <a href="#" className="text-primary-500 hover:text-primary-600">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-500 hover:text-primary-600 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default SignUpPage;
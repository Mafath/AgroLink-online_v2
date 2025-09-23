import { useMemo, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, User, CheckCircle2, Circle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiShield } from "react-icons/fi";
// import Logo from "../assets/AgroLink logo3.png";
import Logo from "../assets/AgroLink_logo3-removebg-preview.png";


const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "FARMER",
  });
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
  });
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();
  const navigate = useNavigate();

  const validateFullName = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return "Full name is required";
    if (trimmed.length < 2) return "Full name must be at least 2 characters";
    if (!/^[A-Za-z ]+$/.test(trimmed)) return "Use letters and spaces only";
    return "";
  };

  const validateEmail = (email) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return "Email is required";
    // RFC5322-like simple but robust regex
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(normalized)) return "Enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const passwordCriteria = useMemo(() => {
    const pwd = formData.password || "";
    return {
      length: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      symbol: /[^A-Za-z0-9]/.test(pwd),
    };
  }, [formData.password]);

  const allPasswordCriteriaMet = useMemo(() => {
    return passwordCriteria.length && passwordCriteria.upper && passwordCriteria.lower && passwordCriteria.number && passwordCriteria.symbol;
  }, [passwordCriteria]);

  const validateAll = (data) => {
    return {
      fullName: validateFullName(data.fullName),
      email: validateEmail(data.email),
      password: validatePassword(data.password),
    };
  };

  const isFormValid = useMemo(() => {
    const v = validateAll(formData);
    return !v.fullName && !v.email && !v.password && allPasswordCriteriaMet;
  }, [formData, allPasswordCriteriaMet]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const v = validateAll(formData);
    setErrors(v);
    setTouched({ fullName: true, email: true, password: true });
    if (!isFormValid) return;

    const result = await signup({
      ...formData,
      email: formData.email.trim().toLowerCase(),
      fullName: formData.fullName.trim(),
    });
    if (result?.success) navigate('/login');
  };

  const handleBlur = (field) => (e) => {
    setTouched((t) => ({ ...t, [field]: true }));
    if (field === "email") {
      const normalized = e.target.value.trim().toLowerCase();
      setFormData((d) => ({ ...d, email: normalized }));
      setErrors((er) => ({ ...er, email: validateEmail(normalized) }));
    } else if (field === "fullName") {
      setErrors((er) => ({ ...er, fullName: validateFullName(e.target.value) }));
    } else if (field === "password") {
      setErrors((er) => ({ ...er, password: validatePassword(e.target.value) }));
    }
  };

  const errorText = (text) => (
    <p className="mt-1 text-xs text-red-600">{text}</p>
  );

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center py-7 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src={Logo} alt="AgroLink logo" className="w-16 h-16 rounded-2xl object-cover" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">Join AgroLink and connect with the agricultural community</p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="form-label">
                <FiShield className="inline w-4 h-4 mr-2" />
                I want to join as a
              </label>
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

            {/* Full Name Field */}
            <div>
              <label className="form-label">
                <User className="inline mr-2 h-4 w-4" />
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, fullName: value });
                    if (touched.fullName) {
                      setErrors((er) => ({ ...er, fullName: validateFullName(value) }));
                    }
                  }}
                  onBlur={handleBlur("fullName")}
                  className={`input-field`}
                  placeholder="Enter your full name"
                />
              </div>
              {touched.fullName && errors.fullName && errorText(errors.fullName)}
            </div>

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
                  type={showPassword ? 'text' : 'password'}
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
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                      {ok ? <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> : <Circle className="w-3.5 h-3.5 mr-2" />}
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isSigningUp || !isFormValid} className={`btn-primary w-full flex justify-center items-center ${(!isFormValid || isSigningUp) ? 'opacity-70 cursor-not-allowed' : ''}`}>
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
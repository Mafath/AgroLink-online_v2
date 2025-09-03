import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User } from "lucide-react";
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
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format"); //no need to understand. Generated using AI
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
  <div className="min-h-screen grid text-sm mt-8">
  <div className="flex flex-col justify-center items-center p-4 sm:p-8">
    <div className="w-full max-w-md space-y-6">

      {/* LOGO */}
      <div className="text-center mb-6">
        <div className="flex flex-col items-center gap-1 group">
          <div
            className="size-10 rounded-lg bg-primary/10 flex items-center justify-center 
            group-hover:bg-primary/20 transition-colors"
          >
            <MessageSquare className="size-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold mt-1">Create Account</h1>
          <p className="text-base-content/60 text-xs">Get started with your free account</p>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ROLE INPUT (limited to FARMER/BUYER) */}
        <div className="">
          <label className="block mb-1 font-medium text-xs">Role</label>
          <select
            className="border rounded-md w-full h-10 text-sm px-2"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="BUYER">Buyer</option>
            <option value="FARMER">Farmer</option>
          </select>
        </div>

        {/* EMAIL INPUT */}
        <div className="">
          <label className="block mb-1 font-medium text-xs">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <Mail className="size-4 text-base-content/40" />
            </div>
            <input
              type="email"
              className="border rounded-md w-full pl-8 h-10 text-sm"
              placeholder="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        {/* PASSWORD INPUT */}
        <div className="">
          <label className="block mb-1 font-medium text-xs">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <Lock className="size-4 text-base-content/40" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              className="border rounded-md w-full pl-8 h-10 text-sm"
              // placeholder="••••••••"
              placeholder="password"  
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-2 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="size-4 text-base-content/40" />
              ) : (
                <Eye className="size-4 text-base-content/40" />
              )}
            </button>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white rounded-md w-full h-10 text-sm" disabled={isSigningUp}>
          {isSigningUp ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Loading...
            </div>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* SIGN IN LINK */}
      <div className="text-center">
        <p className="text-base-content/60 text-xs">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-600 hover:underline text-sm">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  </div>


  </div>

  );
};
export default SignUpPage;
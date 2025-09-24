// here we can have bunch of different states and functions that we can use in our components
import { create } from "zustand";
import { axiosInstance, setAccessToken, clearAccessToken } from "../lib/axios.js";
import { clearUserCart } from "../lib/cartUtils.js";
import toast from "react-hot-toast";


// create function takes a callaback function as the 1st argument where we would like to return an object. 
// This object will be our initial state.
export const useAuthStore = create((set) => ({ //useAuthStore: A hook that you can use in your components to access the store's state and methods.
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,


  isCheckingAuth: true, // set true to block routes until check completes


  checkAuth: async() => {
    set({ isCheckingAuth: true });
    try {
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        set({ authUser: null, isCheckingAuth: false });
        return;
      }
      setAccessToken(token);
      const res = await axiosInstance.get('/auth/me');
      set({ authUser: res.data, isCheckingAuth: false });
    } catch (error) {
      clearAccessToken();
      sessionStorage.removeItem('accessToken');
      set({ authUser: null, isCheckingAuth: false });
    }
  },


  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      return { success: true, user: res.data };
    } catch (error) {
      const msg = error?.response?.data?.error?.message || "Signup failed";
      toast.error(msg);
      return { success: false };
    } finally {
      set({ isSigningUp: false });
    }
  },


  logout: async () => {
    try {
      const currentUser = useAuthStore.getState().authUser;
      await axiosInstance.post("/auth/logout");
      
      // Clear user-specific cart data
      if (currentUser) {
        const userId = currentUser._id || currentUser.id;
        clearUserCart(userId);
      }
      
      set({ authUser: null });
      clearAccessToken();
      sessionStorage.removeItem('accessToken');
      toast.success("Logged out successfully");
    } catch (error) {
      const msg = error?.response?.data?.error?.message || "Logout failed";
      toast.error(msg);
    }
  },


  login: async (data) => {
    // Prevent duplicate login attempts in StrictMode
    if (useAuthStore.getState().isLoggingIn) {
      return;
    }
    
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/signin", data);
      const { accessToken, user } = res.data;
      setAccessToken(accessToken);
      sessionStorage.setItem('accessToken', accessToken);
      // fetch full profile (including profilePic) from DB
      try {
        const meRes = await axiosInstance.get('/auth/me');
        set({ authUser: meRes.data });
      } catch {
        // fallback to minimal user from login response
        set({ authUser: user });
      }
      toast.success("Logged in successfully");
    } catch (error) {
      const errorData = error?.response?.data;
      const msg = errorData?.error?.message || "Login failed";
      
      // Handle email verification error specifically
      if (errorData?.requiresEmailVerification) {
        toast.error(msg);
        // Redirect to email verification status page with the user's email
        setTimeout(() => {
          window.location.href = `/email-verification-status?email=${encodeURIComponent(errorData.email)}`;
        }, 2000);
      } else {
        toast.error(msg);
      }
    } finally {
      set({ isLoggingIn: false });
    }
  },

}));
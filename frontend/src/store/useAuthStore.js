// here we can have bunch of different states and functions that we can use in our components
import { create } from "zustand";
import { axiosInstance, setAccessToken, clearAccessToken } from "../lib/axios.js";
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
        set({ authUser: null });
        return;
      }
      setAccessToken(token);
      const res = await axiosInstance.get('/auth/me');
      set({ authUser: res.data });
    } catch (error) {
      clearAccessToken();
      sessionStorage.removeItem('accessToken');
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },


  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      toast.success("Account created successfully. Please login.");
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
      await axiosInstance.post("/auth/logout");
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
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/signin", data);
      const { accessToken, user } = res.data;
      setAccessToken(accessToken);
      sessionStorage.setItem('accessToken', accessToken);
      set({ authUser: user });
      toast.success("Logged in successfully");
    } catch (error) {
      const msg = error?.response?.data?.error?.message || "Login failed";
      toast.error(msg);
    } finally {
      set({ isLoggingIn: false });
    }
  },

}));
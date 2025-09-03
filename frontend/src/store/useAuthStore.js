// here we can have bunch of different states and functions that we can use in our components
import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";


// create function takes a callaback function as the 1st argument where we would like to return an object. 
// This object will be our initial state.
export const useAuthStore = create((set) => ({ //useAuthStore: A hook that you can use in your components to access the store's state and methods.
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,


  isCheckingAuth: true, //loading state


  checkAuth: async() => {
    try {
      const res = await axiosInstance.get('/auth/check');
      set({authUser: res.data});
    } catch (error) {
      console.log("Error in checkAuth: ", error);
      set({authUser: null});
    } finally {
      set({isCheckingAuth: false});
    }
  },


  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);  //api me endpoint ekt call krnw, and we are passing the 'data' that user sents us
      // uda const res kynne api user data backend ekt ywwt psse, backend eken ena response eka
      set({ authUser: res.data });
      toast.success("Account created successfully");
    } catch (error) {
      toast.error(error.response.data.message); //this is how we can grab the message that we are sending from the signup
    } finally {
      set({ isSigningUp: false });
    }
  },


  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },


  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

}));
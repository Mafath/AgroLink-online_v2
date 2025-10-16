import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './firebase';
import { axiosInstance } from './axios';

// Configure Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Firebase Auth Service
export const firebaseAuthService = {
  // Sign in with Google (for existing users)
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get the ID token for backend verification
      const idToken = await user.getIdToken();
      
      // Send token to backend for verification and user creation/login
      const response = await axiosInstance.post('/auth/firebase', {
        idToken,
        email: user.email,
        fullName: user.displayName,
        profilePic: user.photoURL
      });
      
      return response.data;
    } catch (error) {
      console.error('Firebase sign-in error:', error);
      throw error;
    }
  },

  // Authenticate with Google without creating user (for signup flow)
  authenticateWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Firebase authentication error:', error);
      throw error;
    }
  },

  // Sign up with Google (for role selection)
  signUpWithGoogle: async (role = 'BUYER') => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get the ID token for backend verification
      const idToken = await user.getIdToken();
      
      // Send token to backend for verification and user creation/login
      const response = await axiosInstance.post('/auth/firebase', {
        idToken,
        email: user.email,
        fullName: user.displayName,
        profilePic: user.photoURL,
        role: role
      });
      
      return response.data;
    } catch (error) {
      console.error('Firebase sign-up error:', error);
      throw error;
    }
  },

  // Complete signup with role selection
  completeSignupWithRole: async (role) => {
    try {
      // Get current user's ID token
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      const idToken = await user.getIdToken();
      
      // Send token to backend for verification and user creation/login
      const response = await axiosInstance.post('/auth/firebase', {
        idToken,
        email: user.email,
        fullName: user.displayName,
        profilePic: user.photoURL,
        role: role
      });
      
      return response.data;
    } catch (error) {
      console.error('Firebase sign-up completion error:', error);
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      // Clear any backend session if needed
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Firebase sign-out error:', error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  }
};

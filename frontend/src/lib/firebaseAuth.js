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
  // Sign in with Google
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

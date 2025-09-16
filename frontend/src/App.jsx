import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import MyListings from './pages/MyListings';
import Marketplace from './pages/Marketplace';
import ProfilePage from './pages/ProfilePage';
import { useAuthStore } from './store/useAuthStore';
import { Loader } from "lucide-react";
import { Toaster } from 'react-hot-toast';

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  },[checkAuth]);

  console.log(authUser);

  if (isCheckingAuth && !authUser) return(
    <div className='flex items-center justify-center h-screen'>
      <Loader className='size-10 animate-spin' />
    </div>
  )

  return (
    <div className='min-h-screen flex flex-col'>

      <Navbar />
      <main className='flex-1 pt-20 min-h-[90vh]'>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={!authUser ? <SignupPage /> : <Navigate to="/" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/my-listings" element={authUser && authUser.role === 'FARMER' ? <MyListings /> : <Navigate to="/" />} />
        </Routes>
      </main>

      <Footer />
      <Toaster />
    </div>
  )
}

export default App
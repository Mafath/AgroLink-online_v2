import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MyOrders from './pages/MyOrders';
import AdminOrders from './pages/AdminOrders';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminDrivers from './pages/AdminDrivers';
import AdminLogistics from './pages/AdminLogistics';
import AdminRoles from './pages/AdminRoles';
import AdminInventory from './pages/AdminInventory';
import AdminListings from './pages/AdminListings';
import AdminRentals from './pages/AdminRentals';
import AdminHarvest from './pages/AdminHarvest';
import SignupPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import MyListings from './pages/MyListings';
import Marketplace from './pages/Marketplace';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import StripeStyleCheckout from './pages/StripeStyleCheckout';
import DeliveryTrackingPage from './pages/DeliveryTrackingPage';
import DebugPage from './pages/DebugPage';

import HarvestDashboard from './pages/HarvestDashboard';
import HarvestRequest from './pages/HarvestRequest';
import HarvestSchedule from './pages/HarvestSchedule';
import HarvestTrack from './pages/HarvestTrack';
import HarvestReport from './pages/HarvestReport';


import EmailVerificationPage from './pages/EmailVerificationPage';
import EmailVerificationStatusPage from './pages/EmailVerificationStatusPage';


{/* Delete after testing */}
import DeliveryPage from './pages/DeliveryPage';


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
      <main className='flex-1 pt-16 min-h-[90vh]'>
        <Routes>
         {/* ...existing code... */}
         <Route path="/my-orders" element={authUser ? <MyOrders /> : <Navigate to="/login" />} />
         <Route path="/admin/orders" element={authUser && authUser.role === 'ADMIN' ? <AdminOrders /> : <Navigate to="/" />} />
          <Route path="/" element={authUser ? (authUser.role === 'ADMIN' ? <AdminDashboard /> : authUser.role === 'DRIVER' ? <DriverDashboard /> : <HomePage />) : <HomePage />} />
          <Route path="/signup" element={!authUser ? <SignupPage /> : <Navigate to="/" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
          <Route path="/email-verification-status" element={<EmailVerificationStatusPage />} />
          <Route path="/driver" element={authUser && authUser.role === 'DRIVER' ? <DriverDashboard /> : <Navigate to="/" />} />
          <Route path="/settings" element={authUser ? <SettingsPage /> : <Navigate to="/login" />} />
          <Route path="/admin" element={authUser && authUser.role === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="/admin/users" element={authUser && authUser.role === 'ADMIN' ? <AdminUsers /> : <Navigate to="/" />} />
          <Route path="/admin/roles" element={authUser && authUser.role === 'ADMIN' ? <AdminRoles /> : <Navigate to="/" />} />
          <Route path="/admin/inventory" element={authUser && authUser.role === 'ADMIN' ? <AdminInventory /> : <Navigate to="/" />} />
          <Route path="/admin/listings" element={authUser && authUser.role === 'ADMIN' ? <AdminListings /> : <Navigate to="/" />} />
          <Route path="/admin/harvest" element={authUser && authUser.role === 'ADMIN' ? <AdminHarvest /> : <Navigate to="/" />} />
          <Route path="/admin/rentals" element={authUser && authUser.role === 'ADMIN' ? <AdminRentals /> : <Navigate to="/" />} />
          <Route path="/admin/drivers" element={authUser && authUser.role === 'ADMIN' ? <AdminDrivers /> : <Navigate to="/" />} />
          <Route path="/admin/logistics" element={authUser && authUser.role === 'ADMIN' ? <AdminLogistics /> : <Navigate to="/" />} />
          <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/marketplace" element={authUser ? <Marketplace /> : <Navigate to="/login" />} />
          <Route path="/delivery" element={authUser ? <DeliveryPage /> : <Navigate to="/login" />} />
          <Route path="/my-listings" element={authUser && authUser.role === 'FARMER' ? <MyListings /> : <Navigate to="/" />} />
              <Route path="/cart" element={authUser ? <CartPage /> : <Navigate to="/login" />} />
              <Route path="/stripe-checkout" element={authUser ? <StripeStyleCheckout /> : <Navigate to="/login" />} />
              <Route path="/delivery-tracking" element={authUser ? <DeliveryTrackingPage /> : <Navigate to="/login" />} />
              <Route path="/delivery-tracking/:orderId" element={authUser ? <DeliveryTrackingPage /> : <Navigate to="/login" />} />
              <Route path="/debug" element={authUser ? <DebugPage /> : <Navigate to="/login" />} />
         <Route path="/harvest-dashboard" element={authUser ? <HarvestDashboard /> : <Navigate to="/login" />} />
          <Route path="/harvest-request" element={authUser ? <HarvestRequest /> : <Navigate to="/login" />} />
          <Route path="/harvest-schedule" element={authUser ? <HarvestSchedule /> : <Navigate to="/login" />} />
          <Route path="/harvest-track" element={authUser ? <HarvestTrack /> : <Navigate to="/login" />} />
          <Route path="/harvest-report" element={authUser ? <HarvestReport /> : <Navigate to="/login" />} />

        </Routes>
      </main>

      <Footer />
      <Toaster 
        toastOptions={{
          duration: 5000, // 5 seconds instead of default 4 seconds
          success: {
            duration: 5000, // 6 seconds for success messages
          },
          error: {
            duration: 7000, // 7 seconds for error messages (more important)
          },
        }}
      />
    </div>
  )
}

export default App
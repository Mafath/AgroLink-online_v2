import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShoppingCart, User as UserIcon, Settings as SettingsIcon, LogOut } from 'lucide-react'
import defaultAvatar from '../assets/User Avatar.jpg'
import logoImg from '../assets/AgroLink logo3.png'

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authUser, logout } = useAuthStore();
  const userRole = String(authUser?.role || '').toUpperCase();
  const isAdmin = userRole === 'ADMIN';
  const isDriver = userRole === 'DRIVER';
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!isUserMenuOpen) return;
      const m = menuRef.current;
      const t = triggerRef.current;
      if (m && !m.contains(e.target) && t && !t.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isUserMenuOpen]);

  return (
    <nav className="bg-white shadow-soft border-b border-gray-100 fixed w-full top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img src={logoImg} alt="AgroLink logo" className="h-8 sm:h-10 w-auto" />
              <span className="text-xl font-bold text-gradient">AgroLink</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {authUser && !isAdmin && !isDriver && (
              <>
                <Link
                  to="/"
                  className={`${isActive('/') ? 'bg-black text-white' : 'text-gray-700 hover:text-primary-500'} text-sm font-medium px-3 py-1 rounded-full`}
                >
                  Home
                </Link>
                <Link
                  to="/marketplace"
                  className={`${isActive('/marketplace') ? 'bg-black text-white' : 'text-gray-700 hover:text-primary-500'} text-sm font-medium px-3 py-1 rounded-full`}
                >
                  Marketplace
                </Link>
                <Link
                  to="/my-listings"
                  className={`${isActive('/my-listings') ? 'bg-black text-white' : 'text-gray-700 hover:text-primary-500'} text-sm font-medium px-3 py-1 rounded-full`}
                >
                  My Listings
                </Link>
                <Link
                  to="/delivery-tracking"
                  className={`${isActive('/delivery-tracking') ? 'bg-black text-white' : 'text-gray-700 hover:text-primary-500'} text-sm font-medium px-3 py-1 rounded-full`}
                >
                  Delivery Tracking
                </Link>
              </>
            )}
          </div>

          {/* User menu and auth */}
          <div className="flex items-center space-x-4">
            {authUser ? (
              <div className="relative flex items-center gap-3">
                {!isAdmin && !isDriver && (
                  <button
                    onClick={() => handleNavigation('/cart')}
                    className="p-2 rounded-md hover:bg-gray-100 relative"
                    aria-label="Cart"
                    title="Cart"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {JSON.parse(localStorage.getItem('cart') || '[]').length}
                    </span>
                  </button>
                )}
                <button
                  ref={triggerRef}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-500 transition-colors"
                >
                  <img src={authUser.profilePic || defaultAvatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border" />
                  <span className="hidden sm:block text-sm font-medium">{authUser.fullName || authUser.email}</span>
                </button>

                {isUserMenuOpen && (
                  <div ref={menuRef} className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <button
                      onClick={() => handleNavigation('/profile')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 mr-2" />
                      Profile
                    </button>
                    <button
                      onClick={() => handleNavigation('/settings')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2 text-red-600" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary text-sm">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {!isDriver && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                {isMobileMenuOpen ? (
                  <span className="block h-6 w-6">✕</span>
                ) : (
                  <span className="block h-6 w-6">☰</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
            {isMobileMenuOpen && !isDriver && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
                  {authUser ? (
              <>
                      {!isAdmin && (
                        <>
                          <button onClick={() => handleNavigation('/')} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-500 hover:bg-gray-50 rounded-md transition-colors">Home</button>
                          <button onClick={() => handleNavigation('/marketplace')} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-500 hover:bg-gray-50 rounded-md transition-colors">Marketplace</button>
                          <button onClick={() => handleNavigation('/my-listings')} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-500 hover:bg-gray-50 rounded-md transition-colors">My Listings</button>
                          <button onClick={() => handleNavigation('/delivery-tracking')} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-500 hover:bg-gray-50 rounded-md transition-colors">Delivery Tracking</button>
                        </>
                      )}
                <button onClick={() => handleNavigation('/profile')} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-500 hover:bg-gray-50 rounded-md transition-colors">Profile</button>
                <button onClick={() => handleNavigation('/settings')} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-500 hover:bg-gray-50 rounded-md transition-colors">Settings</button>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-500 hover:bg-gray-50 rounded-md transition-colors">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-500 hover:bg-gray-50 rounded-md transition-colors">Login</Link>
                <Link to="/signup" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-500 hover:bg-gray-50 rounded-md transition-colors">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
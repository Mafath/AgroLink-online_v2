import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShoppingCart } from 'lucide-react'

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authUser, logout } = useAuthStore();
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

  return (
    <nav className="bg-white shadow-soft border-b border-gray-100 fixed w-full top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-gradient">AgroLink</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-16">
            {authUser && (
              <>
                <Link to="/" className="text-gray-700 hover:text-primary-500 text-sm font-medium">Home</Link>
                <Link to="/marketplace" className="text-gray-700 hover:text-primary-500 text-sm font-medium">Marketplace</Link>
                <Link to="/my-listings" className="text-gray-700 hover:text-primary-500 text-sm font-medium">My Listings</Link>
              </>
            )}
          </div>

          {/* User menu and auth */}
          <div className="flex items-center space-x-4">
            {authUser ? (
              <div className="relative flex items-center gap-3">
                <button
                  onClick={() => handleNavigation('/cart')}
                  className="p-2 rounded-md hover:bg-gray-100"
                  aria-label="Cart"
                  title="Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-500 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {authUser.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{authUser.fullName || authUser.email}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <button
                      onClick={() => handleNavigation('/profile')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => handleNavigation('/settings')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
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
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {authUser ? (
              <>
                <button onClick={() => handleNavigation('/')} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-500 hover:bg-gray-50 rounded-md transition-colors">Home</button>
                <button onClick={() => handleNavigation('/marketplace')} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-500 hover:bg-gray-50 rounded-md transition-colors">Marketplace</button>
                <button onClick={() => handleNavigation('/my-listings')} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-500 hover:bg-gray-50 rounded-md transition-colors">My Listings</button>
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
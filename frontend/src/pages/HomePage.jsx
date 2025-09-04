import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShoppingCart, Truck, TrendingUp, Users, MapPin, Star } from 'lucide-react';

const HomePage = () => {
  const { authUser } = useAuthStore();
  const isAuthenticated = Boolean(authUser);
  const user = authUser;

  const displayName = user?.email ? user.email.split('@')[0] : 'User';

  const getWelcomeMessage = () => {
    if (!isAuthenticated) {
      return {
        title: 'Welcome to AgroLink',
        subtitle: 'Connect farmers and buyers in a seamless digital marketplace',
      };
    }

    switch (user?.role) {
      case 'FARMER':
        return {
          title: `Welcome back, ${displayName}!`,
          subtitle: 'Ready to sell your products? Explore the marketplace and connect with buyers.',
        };
      case 'BUYER':
        return {
          title: `Welcome back, ${displayName}!`,
          subtitle: 'Discover fresh produce and agricultural products from local farmers.',
        };
      case 'ADMIN':
        return {
          title: `Welcome, Admin ${displayName}`,
          subtitle: 'Manage the platform and oversee operations.',
        };
      case 'DRIVER':
        return {
          title: `Welcome, Driver ${displayName}`,
          subtitle: 'Ready to deliver? Check your assigned routes and deliveries.',
        };
      default:
        return {
          title: `Welcome, ${displayName}!`,
          subtitle: 'Explore the AgroLink platform.',
        };
    }
  };

  const getRoleBasedActions = () => {
    if (!isAuthenticated) {
      return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup" className="bg-primary-500 hover:bg-primary-600 text-white rounded-md h-12 px-6 flex items-center justify-center text-center">
            Get Started
          </Link>
          <Link to="/login" className="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white rounded-md h-12 px-6 flex items-center justify-center text-center">
            Sign In
          </Link>
        </div>
      );
    }

    switch (user?.role) {
      case 'FARMER':
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/marketplace" className="bg-primary-500 hover:bg-primary-600 text-white rounded-md h-10 px-6 flex items-center justify-center text-center">
              <TrendingUp className="inline w-5 h-5 mr-2" />
              View Marketplace
            </Link>
            <Link to="/profile" className="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white rounded-md h-10 px-6 flex items-center justify-center text-center">
              Manage Profile
            </Link>
          </div>
        );
      case 'BUYER':
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/marketplace" className="bg-primary-500 hover:bg-primary-600 text-white rounded-md h-10 px-6 flex items-center justify-center text-center">
              <ShoppingCart className="inline w-5 h-5 mr-2" />
              Browse Products
            </Link>
            <Link to="/profile" className="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white rounded-md h-10 px-6 flex items-center justify-center text-center">
              View Profile
            </Link>
          </div>
        );
      case 'ADMIN':
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/admin" className="bg-primary-500 hover:bg-primary-600 text-white rounded-md h-10 px-6 flex items-center justify-center text-center">
              Admin Dashboard
            </Link>
            <Link to="/profile" className="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white rounded-md h-10 px-6 flex items-center justify-center text-center">
              Profile Settings
            </Link>
          </div>
        );
      case 'DRIVER':
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/driver" className="bg-primary-500 hover:bg-primary-600 text-white rounded-md h-10 px-6 flex items-center justify-center text-center">
              <Truck className="inline w-5 h-5 mr-2" />
              Driver Dashboard
            </Link>
            <Link to="/profile" className="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white rounded-md h-10 px-6 flex items-center justify-center text-center">
              Profile Settings
            </Link>
          </div>
        );
      default:
        return null;
    }
  };

  const { title, subtitle } = getWelcomeMessage();

  return (
    <div className="min-h-screen bg-base-100 mt-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-500 to-accent-500 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            {subtitle}
          </p>
          {getRoleBasedActions()}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose AgroLink?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform connects agricultural communities through technology, 
              making farming more profitable and food more accessible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Direct Connection */}
            <div className="bg-white rounded-xl shadow-md transition-shadow duration-200 p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Direct Connection
              </h3>
              <p className="text-gray-600">
                Connect directly with farmers and buyers, eliminating middlemen 
                and ensuring fair prices for everyone.
              </p>
            </div>

            {/* Quality Assurance */}
            <div className="bg-white rounded-xl shadow-md transition-shadow duration-200 p-6 text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Quality Assurance
              </h3>
              <p className="text-gray-600">
                Verified farmers and quality-checked products ensure you get 
                the best agricultural goods every time.
              </p>
            </div>

            {/* Efficient Delivery */}
            <div className="bg-white rounded-xl shadow-md transition-shadow duration-200 p-6 text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Efficient Delivery
              </h3>
              <p className="text-gray-600">
                Professional delivery network ensures your products reach 
                customers fresh and on time.
              </p>
            </div>

            {/* Market Insights */}
            <div className="bg-white rounded-xl shadow-md transition-shadow duration-200 p-6 text-center">
              <div className="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-info" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Market Insights
              </h3>
              <p className="text-gray-600">
                Real-time market data and trends help you make informed 
                decisions about pricing and production.
              </p>
            </div>

            {/* Local Focus */}
            <div className="bg-white rounded-xl shadow-md transition-shadow duration-200 p-6 text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Local Focus
              </h3>
              <p className="text-gray-600">
                Support local farmers and reduce food miles while enjoying 
                fresh, seasonal produce.
              </p>
            </div>

            {/* Secure Transactions */}
            <div className="bg-white rounded-xl shadow-md transition-shadow duration-200 p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Secure Transactions
              </h3>
              <p className="text-gray-600">
                Safe and secure payment processing with escrow protection 
                for both buyers and sellers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Join the Agricultural Revolution?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Whether you're a farmer looking to reach more customers or a buyer 
              seeking fresh, local produce, AgroLink is your gateway to success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-colors">
                Get Started Today
              </Link>
              <Link to="/login" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-4 px-8 rounded-lg transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-gray-600">Active Farmers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent-600 mb-2">1000+</div>
              <div className="text-gray-600">Happy Buyers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-success mb-2">50+</div>
              <div className="text-gray-600">Product Categories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-info mb-2">24/7</div>
              <div className="text-gray-600">Customer Support</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

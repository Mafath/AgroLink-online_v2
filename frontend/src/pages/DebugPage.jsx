import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import { User, Package, ShoppingCart, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DebugPage = () => {
  const { authUser, logout } = useAuthStore();
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState({});

  const runTest = async (testName, testFunction) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await testFunction();
      setTestResults(prev => ({ ...prev, [testName]: { success: true, data: result } }));
      toast.success(`${testName} test passed!`);
    } catch (error) {
      console.error(`${testName} test failed:`, error);
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { 
          success: false, 
          error: error.response?.data || error.message 
        } 
      }));
      toast.error(`${testName} test failed!`);
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const testAuth = async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  };

  const testListings = async () => {
    const response = await axiosInstance.get('/listings');
    return response.data;
  };

  const testOrders = async () => {
    const response = await axiosInstance.get('/orders');
    return response.data;
  };

  const testDeliveries = async () => {
    const response = await axiosInstance.get('/deliveries/me');
    return response.data;
  };

  const testInventory = async () => {
    const response = await axiosInstance.get('/inventory');
    return response.data;
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Debug Page</h1>
          <p className="mt-2 text-gray-600">Test API endpoints and authentication</p>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-primary-500" />
            Current User
          </h2>
          {authUser ? (
            <div className="space-y-2">
              <p><strong>Email:</strong> {authUser.email}</p>
              <p><strong>Role:</strong> {authUser.role}</p>
              <p><strong>ID:</strong> {authUser._id}</p>
              <p><strong>Token:</strong> {sessionStorage.getItem('accessToken') ? 'Present' : 'Missing'}</p>
              <button
                onClick={handleLogout}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <p className="text-gray-500">Not logged in</p>
          )}
        </div>

        {/* API Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth Test */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication Test</h3>
            <button
              onClick={() => runTest('auth', testAuth)}
              disabled={loading.auth}
              className="w-full btn-primary mb-4"
            >
              {loading.auth ? 'Testing...' : 'Test Auth Endpoint'}
            </button>
            {testResults.auth && (
              <div className={`p-3 rounded-lg ${testResults.auth.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <div className="flex items-center mb-2">
                  {testResults.auth.success ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                  <span className="font-medium">
                    {testResults.auth.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResults.auth.data || testResults.auth.error, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Listings Test */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Listings Test</h3>
            <button
              onClick={() => runTest('listings', testListings)}
              disabled={loading.listings}
              className="w-full btn-primary mb-4"
            >
              {loading.listings ? 'Testing...' : 'Test Listings Endpoint'}
            </button>
            {testResults.listings && (
              <div className={`p-3 rounded-lg ${testResults.listings.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <div className="flex items-center mb-2">
                  {testResults.listings.success ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                  <span className="font-medium">
                    {testResults.listings.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResults.listings.data || testResults.listings.error, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Orders Test */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Test</h3>
            <button
              onClick={() => runTest('orders', testOrders)}
              disabled={loading.orders}
              className="w-full btn-primary mb-4"
            >
              {loading.orders ? 'Testing...' : 'Test Orders Endpoint'}
            </button>
            {testResults.orders && (
              <div className={`p-3 rounded-lg ${testResults.orders.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <div className="flex items-center mb-2">
                  {testResults.orders.success ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                  <span className="font-medium">
                    {testResults.orders.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResults.orders.data || testResults.orders.error, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Deliveries Test */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deliveries Test</h3>
            <button
              onClick={() => runTest('deliveries', testDeliveries)}
              disabled={loading.deliveries}
              className="w-full btn-primary mb-4"
            >
              {loading.deliveries ? 'Testing...' : 'Test Deliveries Endpoint'}
            </button>
            {testResults.deliveries && (
              <div className={`p-3 rounded-lg ${testResults.deliveries.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <div className="flex items-center mb-2">
                  {testResults.deliveries.success ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                  <span className="font-medium">
                    {testResults.deliveries.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResults.deliveries.data || testResults.deliveries.error, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Inventory Test */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Test</h3>
            <button
              onClick={() => runTest('inventory', testInventory)}
              disabled={loading.inventory}
              className="w-full btn-primary mb-4"
            >
              {loading.inventory ? 'Testing...' : 'Test Inventory Endpoint'}
            </button>
            {testResults.inventory && (
              <div className={`p-3 rounded-lg ${testResults.inventory.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <div className="flex items-center mb-2">
                  {testResults.inventory.success ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                  <span className="font-medium">
                    {testResults.inventory.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResults.inventory.data || testResults.inventory.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Clear Results */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setTestResults({})}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
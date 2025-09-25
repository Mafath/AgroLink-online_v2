import React, { useState, useEffect } from "react";
import {
  Calendar,
  ClipboardList,
  TrendingUp,
  Bug,
  List,
  Activity,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";

const Card = ({ children, className = '', onClick }) => (
  <div 
    className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
)

const HarvestDashboard = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedTip, setExpandedTip] = useState(null);
  const [favoriteTips, setFavoriteTips] = useState(new Set());
  const [metrics, setMetrics] = useState({
    totalSchedules: 0,
    ongoingHarvests: 0,
    issuesReported: 0
  });
  const [loading, setLoading] = useState(true);

  // Navigation function
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Fetch real metrics data
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        
        // Fetch all harvest requests to get total schedules
        const harvestResponse = await axiosInstance.get('/harvest/requests');
        const allHarvests = harvestResponse.data?.requests || [];
        
        // Count different statuses
        const totalSchedules = allHarvests.length;
        const ongoingHarvests = allHarvests.filter(h => 
          h.status === 'ACCEPTED' || h.status === 'SCHEDULED' || h.status === 'IN_PROGRESS'
        ).length;
        
        // For issues reported, we'll use a placeholder since we don't have a reports API yet
        // You can replace this with actual API call when available
        const issuesReported = 0; // Placeholder - replace with actual API call
        
        setMetrics({
          totalSchedules,
          ongoingHarvests,
          issuesReported
        });
      } catch (error) {
        console.error('Failed to fetch harvest metrics:', error);
        // Set default values on error
        setMetrics({
          totalSchedules: 0,
          ongoingHarvests: 0,
          issuesReported: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const tips = [
    {
      id: 1,
      text: "Rotate crops to maintain soil health and prevent nutrient depletion.",
      category: "Soil Health",
      icon: "🌱",
      color: "bg-green-50 border-green-400",
      detailedInfo: "Crop rotation helps break pest and disease cycles, improves soil structure, and maintains nutrient balance. Plan a 3-4 year rotation cycle with different plant families.",
      helpful: 0
    },
    {
      id: 2,
      text: "Harvest early in the morning when temperatures are cooler to preserve freshness.",
      category: "Harvest Timing",
      icon: "🌅",
      color: "bg-orange-50 border-orange-400",
      detailedInfo: "Morning harvest (6-10 AM) ensures maximum freshness, better shelf life, and higher nutritional content. Avoid harvesting during hot midday hours.",
      helpful: 0
    },
    {
      id: 3,
      text: "Always clean and sanitize tools between uses to prevent disease spread.",
      category: "Equipment Care",
      icon: "🧽",
      color: "bg-blue-50 border-blue-400",
      detailedInfo: "Use 10% bleach solution or rubbing alcohol to disinfect tools. Clean between different crops and after working with diseased plants.",
      helpful: 0
    },
    {
      id: 4,
      text: "Use organic compost and natural fertilizers to improve soil fertility naturally.",
      category: "Soil Health",
      icon: "🍃",
      color: "bg-green-50 border-green-400",
      detailedInfo: "Compost adds beneficial microorganisms, improves water retention, and provides slow-release nutrients. Apply 2-3 inches annually.",
      helpful: 0
    },
    {
      id: 5,
      text: "Monitor weather patterns and soil moisture to optimize harvest timing.",
      category: "Weather",
      icon: "🌤️",
      color: "bg-yellow-50 border-yellow-400",
      detailedInfo: "Check soil moisture 6 inches deep. Harvest before heavy rains to prevent water damage and during dry periods for better storage.",
      helpful: 0
    },
    {
      id: 6,
      text: "Keep detailed records of planting dates, yields, and weather conditions.",
      category: "Record Keeping",
      icon: "📊",
      color: "bg-purple-50 border-purple-400",
      detailedInfo: "Track planting dates, harvest dates, yields, weather patterns, and any issues. This data helps improve future crop planning and identify patterns.",
      helpful: 0
    },
    {
      id: 7,
      text: "Test soil pH and nutrients before each planting season.",
      category: "Soil Health",
      icon: "🧪",
      color: "bg-green-50 border-green-400",
      detailedInfo: "Soil testing every 2-3 years helps determine exact nutrient needs and pH adjustments. Most crops prefer pH 6.0-7.0.",
      helpful: 0
    },
    {
      id: 8,
      text: "Use mulch to conserve water and suppress weeds naturally.",
      category: "Water Management",
      icon: "💧",
      color: "bg-cyan-50 border-cyan-400",
      detailedInfo: "Apply 2-4 inches of organic mulch around plants. This reduces water needs by 25-50% and prevents weed growth.",
      helpful: 0
    }
  ];

  // Get unique categories for filter
  const categories = ['All', ...new Set(tips.map(tip => tip.category))];

  // Filter tips based on selected category
  const filteredTips = selectedCategory === 'All' 
    ? tips 
    : tips.filter(tip => tip.category === selectedCategory);

  // Toggle favorite tip
  const toggleFavorite = (tipId) => {
    const newFavorites = new Set(favoriteTips);
    if (newFavorites.has(tipId)) {
      newFavorites.delete(tipId);
    } else {
      newFavorites.add(tipId);
    }
    setFavoriteTips(newFavorites);
  };

  // Toggle expanded tip
  const toggleExpanded = (tipId) => {
    setExpandedTip(expandedTip === tipId ? null : tipId);
  };

  const metricsData = [
    {
      label: "Total Schedules",
      value: metrics.totalSchedules,
      icon: <List size={24} />,
      color: "bg-pink-100",
      iconColor: "text-pink-600",
    },
    {
      label: "Ongoing Harvests",
      value: metrics.ongoingHarvests,
      icon: <Activity size={24} />,
      color: "bg-violet-100",
      iconColor: "text-violet-600",
    },
    {
      label: "Issues Reported",
      value: metrics.issuesReported,
      icon: <AlertCircle size={24} />,
      color: "bg-red-100",
      iconColor: "text-red-600",
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='mb-8'>
          <h1 className='text-3xl md:text-4xl font-bold text-black text-center mt-6 mb-6'>🌾 Track Your Harvests</h1>
        </div>

        {/* Summary Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          {loading ? (
            // Loading state
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='h-5 bg-gray-200 rounded w-24 mb-2 animate-pulse'></div>
                    <div className='h-8 bg-gray-200 rounded w-16 animate-pulse'></div>
                  </div>
                  <div className='w-16 h-16 bg-gray-200 rounded-full animate-pulse'></div>
                </div>
              </Card>
            ))
          ) : (
            // Real data
            metricsData.map((metric, i) => (
              <Card key={i} className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>{metric.label}</h3>
                    <p className='text-3xl font-bold text-green-600 mt-2'>{metric.value}</p>
                  </div>
                  <div className={`w-16 h-16 ${metric.color} rounded-full flex items-center justify-center`}>
                    <div className={metric.iconColor}>
                      {metric.icon}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Main Action Buttons */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <Card className='p-6 hover:shadow-lg transition-shadow cursor-pointer' onClick={() => handleNavigation("/harvest-request")}>
            <div className='text-center'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Calendar className='w-8 h-8 text-green-600' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Request Harvest</h3>
              <p className='text-sm text-gray-600'>Submit a new harvest schedule request</p>
            </div>
          </Card>

          <Card className='p-6 hover:shadow-lg transition-shadow cursor-pointer' onClick={() => handleNavigation("/harvest-schedule")}>
            <div className='text-center'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <ClipboardList className='w-8 h-8 text-blue-600' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>View Schedules</h3>
              <p className='text-sm text-gray-600'>Check your harvest schedules</p>
            </div>
          </Card>

          <Card className='p-6 hover:shadow-lg transition-shadow cursor-pointer' onClick={() => handleNavigation("/harvest-track")}>
            <div className='text-center'>
              <div className='w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <TrendingUp className='w-8 h-8 text-yellow-600' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Track Progress</h3>
              <p className='text-sm text-gray-600'>Update and monitor harvest progress</p>
            </div>
          </Card>

          <Card className='p-6 hover:shadow-lg transition-shadow cursor-pointer' onClick={() => handleNavigation("/harvest-report")}>
            <div className='text-center'>
              <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Bug className='w-8 h-8 text-red-600' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Report Issues</h3>
              <p className='text-sm text-gray-600'>Report crop diseases and problems</p>
            </div>
          </Card>
        </div>

        {/* Pro Tips Section */}
        <Card>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-semibold text-gray-900'>🌱 Pro Farming Tips</h2>
              <div className='flex items-center gap-3'>
                <span className='text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full'>
                  {filteredTips.length} of {tips.length} tips
                </span>
                {favoriteTips.size > 0 && (
                  <span className='text-sm text-red-500 bg-red-50 px-3 py-1 rounded-full'>
                    ❤️ {favoriteTips.size} favorites
                  </span>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className='mb-6'>
              <div className='flex flex-wrap gap-2'>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {filteredTips.map((tip) => (
                <div key={tip.id} className={`p-4 rounded-lg border-l-4 ${tip.color} hover:shadow-md transition-all duration-200 group`}>
                  <div className='flex items-start gap-3'>
                    <div className='text-2xl'>{tip.icon}</div>
                    <div className='flex-1'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded-full'>
                          {tip.category}
                        </span>
                        <button
                          onClick={() => toggleFavorite(tip.id)}
                          className={`text-lg transition-colors ${
                            favoriteTips.has(tip.id) ? 'text-red-500' : 'text-gray-300 hover:text-red-400'
                          }`}
                        >
                          {favoriteTips.has(tip.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                      <p className='text-sm text-gray-700 group-hover:text-gray-900 transition-colors mb-3'>
                        {tip.text}
                      </p>
                      
                      {/* Expandable detailed info */}
                      <div className='space-y-2'>
                        <button
                          onClick={() => toggleExpanded(tip.id)}
                          className='text-xs text-green-600 hover:text-green-700 font-medium transition-colors'
                        >
                          {expandedTip === tip.id ? 'Show Less' : 'Learn More'} ↓
                        </button>
                        
                        {expandedTip === tip.id && (
                          <div className='mt-2 p-3 bg-white rounded-lg border border-gray-200'>
                            <p className='text-xs text-gray-600 leading-relaxed'>
                              {tip.detailedInfo}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state for filtered results */}
            {filteredTips.length === 0 && (
              <div className='text-center py-8'>
                <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>No tips found</h3>
                <p className='text-gray-500 mb-4'>No tips available for the selected category.</p>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className='btn-primary px-4 py-2 rounded-md text-sm font-medium'
                >
                  View All Tips
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className='mt-6 flex items-center justify-between'>
              <div className='flex gap-3'>
                <button className='text-sm text-green-600 hover:text-green-700 font-medium transition-colors'>
                  📚 View All Tips →
                </button>
                {favoriteTips.size > 0 && (
                  <button className='text-sm text-red-600 hover:text-red-700 font-medium transition-colors'>
                    ❤️ View Favorites ({favoriteTips.size})
                  </button>
                )}
              </div>
              <button 
                onClick={() => setSelectedCategory('All')}
                className='text-sm text-gray-500 hover:text-gray-700 transition-colors'
              >
                Reset Filters
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HarvestDashboard;

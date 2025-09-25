import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
)

const HarvestSchedule = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get('/harvest/requests', { 
          params: { status: 'REQUEST_PENDING,ACCEPTED,SCHEDULED,IN_PROGRESS' } 
        });

        const mapped = (data?.requests || []).map((r) => ({
          id: r._id,
          cropType: r.crop || r.cropType || 'Unknown',
          expertName: r.expertName || '—',
          expectedYield: r.expectedYield || 0,
          harvestDate: r.harvestDate ? new Date(r.harvestDate).toISOString().slice(0,10) : 'Pending',
          scheduledDate: r.scheduledDate ? new Date(r.scheduledDate).toISOString().slice(0,10) : '—',
          status: r.status === 'REQUEST_PENDING' ? 'Request Pending' : 
                 r.status === 'ACCEPTED' || r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS' ? 'Ongoing' :
                 r.status === 'COMPLETED' ? 'Completed' : 'Unknown',
          // Additional fields from new comprehensive form
          farmSize: r.personalizedData?.farmSize || '—',
          variety: r.personalizedData?.variety || '—',
          soilType: r.personalizedData?.soilType || '—',
          harvestMethod: r.personalizedData?.harvestMethodPreference || '—',
          storageRequirements: r.personalizedData?.storageRequirements || '—',
          qualityStandards: r.personalizedData?.qualityStandards || '—',
          notes: r.notes || r.personalizedData?.notes || '',
        }));

        setSchedules(mapped);
      } catch (error) {
        console.error('Failed to load harvest schedules:', error);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Ongoing":
        return "bg-blue-100 text-blue-800";
      case "Request Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredSchedules = schedules
    .filter((s) => (filter === "All" ? true : s.status === filter))
    .filter(
      (s) =>
        s.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.expertName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.soilType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.harvestMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.notes.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button 
              onClick={() => navigate('/harvest-dashboard')}
              className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
              </svg>
              <span className='text-sm font-medium'>Back to Dashboard</span>
            </button>
            <div className='h-6 w-px bg-gray-300'></div>
            <div className='text-center'>
              <h1 className='text-4xl font-bold text-gray-900 mb-2'>🌾 My Harvest Schedules</h1>
              <p className='text-gray-600'>View and manage your harvest schedules</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className='mb-6'>
          <Card>
            <div className='p-4'>
              <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
                <div className='flex-1 max-w-md'>
                  <input
                    type='text'
                    placeholder='Search by crop, variety, soil type, method, or notes...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='input-field w-full'
                  />
                </div>
                <div className='flex gap-2'>
                  {["All", "Ongoing", "Completed", "Request Pending"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === status
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Schedule Cards */}
        {loading ? (
          <div className='text-center py-12'>
            <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
            <p className='text-gray-500 mt-2'>Loading schedules...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <Card>
            <div className='p-12 text-center'>
              <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>No schedules found</h3>
              <p className='text-gray-500 mb-4'>
                {filter === "All" 
                  ? "You haven't created any harvest schedules yet." 
                  : `No schedules found for "${filter}".`
                }
              </p>
              <button
                onClick={() => navigate('/harvest-request')}
                className='btn-primary px-6 py-2 rounded-md text-sm font-medium'
              >
                Create New Schedule
              </button>
            </div>
          </Card>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredSchedules.map((schedule) => (
              <Card key={schedule.id} className='p-6 hover:shadow-lg transition-shadow'>
                <div className='flex justify-between items-start mb-4'>
                  <h3 className='text-xl font-semibold text-gray-900'>{schedule.cropType}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(schedule.status)}`}>
                    {schedule.status}
                  </span>
                </div>

                <div className='space-y-3 mb-6'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500'>Expert:</span>
                    <span className='font-medium text-gray-900'>{schedule.expertName}</span>
                  </div>
                  
                  {/* Basic Information */}
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500'>Farm Size:</span>
                    <span className='font-medium text-gray-900'>{schedule.farmSize}</span>
                  </div>
                  
                  {schedule.variety !== '—' && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-500'>Variety:</span>
                      <span className='font-medium text-gray-900'>{schedule.variety}</span>
                    </div>
                  )}
                  
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500'>Harvest Date:</span>
                    <span className='font-medium text-gray-900'>{schedule.harvestDate}</span>
                  </div>
                  
                  {schedule.status === "Ongoing" && schedule.scheduledDate && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-500'>Scheduled Date:</span>
                      <span className='font-medium text-gray-900'>{schedule.scheduledDate}</span>
                    </div>
                  )}
                  
                  {/* Additional Details (collapsible) */}
                  <div className='border-t border-gray-200 pt-3 mt-3'>
                    <div className='text-xs text-gray-500 mb-2'>Additional Details:</div>
                    <div className='grid grid-cols-1 gap-2 text-xs'>
                      {schedule.soilType !== '—' && (
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>Soil:</span>
                          <span className='text-gray-700'>{schedule.soilType}</span>
                        </div>
                      )}
                      {schedule.harvestMethod !== '—' && (
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>Method:</span>
                          <span className='text-gray-700'>{schedule.harvestMethod}</span>
                        </div>
                      )}
                      {schedule.storageRequirements !== '—' && (
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>Storage:</span>
                          <span className='text-gray-700'>{schedule.storageRequirements}</span>
                        </div>
                      )}
                      {schedule.qualityStandards !== '—' && (
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>Quality:</span>
                          <span className='text-gray-700'>{schedule.qualityStandards}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Notes */}
                  {schedule.notes && (
                    <div className='border-t border-gray-200 pt-3 mt-3'>
                      <div className='text-xs text-gray-500 mb-1'>Notes:</div>
                      <p className='text-xs text-gray-600 bg-gray-50 p-2 rounded'>
                        {schedule.notes.length > 100 ? `${schedule.notes.substring(0, 100)}...` : schedule.notes}
                      </p>
                    </div>
                  )}
                </div>

                {schedule.status === "Ongoing" && (
                  <button
                    onClick={() => navigate("/harvest-track")}
                    className='w-full btn-primary py-2 px-4 rounded-md text-sm font-medium'
                  >
                    Track Progress
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HarvestSchedule;

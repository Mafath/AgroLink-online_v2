import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
)

const HarvestTrack = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOngoing = async () => {
      setLoading(true);
      try {
        const farmerRes = await axiosInstance.get('/harvest/requests', { params: { status: 'SCHEDULED' } });
        let items = farmerRes?.data?.requests || [];

        const mapped = (items || []).map(r => ({
          id: r._id,
          cropType: r.crop,
          expertName: r.expertName || '—',
          expectedYield: r.expectedYield || 0,
          harvestDate: r.harvestDate ? new Date(r.harvestDate).toISOString().slice(0,10) : '—',
          scheduledDate: r.scheduledDate ? new Date(r.scheduledDate).toISOString().slice(0,10) : '—',
          status: r.status === 'ACCEPTED' || r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS' ? 'Ongoing' : r.status,
          progress: r.tracking && r.tracking.length > 0 ? r.tracking[r.tracking.length - 1].progress : 0,
          notes: r.adminAdvice || '',
          farmerName: r.farmerName || r.farmer?.fullName || '—',
          tracking: r.tracking || [],
          expertId: r.expertId,
        }));
        setSchedules(mapped);
      } catch (error) {
        console.error('Failed to load harvest schedules:', error);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOngoing();
  }, []);

  const addProgressUpdate = async (id, progress, notes) => {
    try {
      await axiosInstance.post(`/harvest/${id}/update`, {
        progress: `${progress}% completed`,
        notes: notes
      });
      
      setSchedules((prev) =>
        prev.map((s) => 
          s.id === id 
            ? { 
                ...s, 
                progress: progress,
                tracking: [...(s.tracking || []), {
                  progress: `${progress}% completed`,
                  notes: notes,
                  updatedAt: new Date(),
                  updatedBy: 'current_user'
                }]
              } 
            : s
        )
      );
      toast.success('Progress updated successfully!');
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const markCompleted = async (id) => {
    try {
      await axiosInstance.post(`/harvest/${id}/status`, { status: 'COMPLETED' });
      
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: "COMPLETED", progress: 100 } : s
        )
      );
      toast.success('Harvest marked as completed!');
    } catch (error) {
      console.error('Failed to mark as completed:', error);
      toast.error('Failed to mark as completed');
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='flex items-center justify-between mb-8'>
          <button 
            onClick={() => navigate('/harvest-dashboard')}
            className='flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-700 text-emerald-700 rounded-full transition-colors hover:bg-emerald-50'
          >
            <ArrowLeft className='w-3.5 h-3.5' />
            <span className='text-xs'>Back</span>
          </button>
          <div className='text-center'>
            <h1 className='text-4xl font-bold text-gray-900 mb-2'>📊 Track Harvest Progress</h1>
            <p className='text-gray-600'>Monitor and update your ongoing harvest activities</p>
          </div>
          <div className='w-20'></div>
        </div>

        {loading ? (
          <div className='text-center py-12'>
            <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
            <p className='text-gray-500 mt-2'>Loading harvest schedules...</p>
          </div>
        ) : schedules.length === 0 ? (
          <Card>
            <div className='p-12 text-center'>
              <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>No ongoing harvests</h3>
              <p className='text-gray-500 mb-4'>You don't have any ongoing harvest schedules to track.</p>
              <button
                onClick={() => navigate('/harvest-request')}
                className='btn-primary px-6 py-2 rounded-md text-sm font-medium'
              >
                Create New Schedule
              </button>
            </div>
          </Card>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {schedules.map((schedule) => (
              <Card key={schedule.id} className='p-6'>
                <div className='flex justify-between items-start mb-4'>
                  <h3 className='text-xl font-semibold text-gray-900'>{schedule.cropType}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    schedule.status === "Ongoing"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {schedule.status}
                  </span>
                </div>

                <div className='space-y-3 mb-6'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500'>Farmer:</span>
                    <span className='font-medium text-gray-900'>{schedule.farmerName}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500'>Scheduled Date:</span>
                    <span className='font-medium text-gray-900'>{schedule.scheduledDate}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500'>Expected Yield:</span>
                    <span className='font-medium text-gray-900'>{schedule.expectedYield} kg</span>
                  </div>
                </div>

                {/* Expert Advice */}
                {schedule.notes && (
                  <div className='mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400'>
                    <p className='text-sm font-medium text-blue-900 mb-1'>💡 Expert Advice:</p>
                    <p className='text-sm text-blue-800'>{schedule.notes}</p>
                  </div>
                )}

                {/* Progress Bar */}
                <div className='mb-4'>
                  <div className='flex justify-between text-sm mb-2'>
                    <span className='text-gray-500'>Progress</span>
                    <span className='font-medium text-gray-900'>{schedule.progress}%</span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-3'>
                    <div
                      className='h-3 rounded-full transition-all duration-500 bg-green-500'
                      style={{ width: `${schedule.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Progress Tracking Form */}
                {schedule.status === "Ongoing" && (
                  <div className='space-y-4 mb-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Update Progress (%)</label>
                      <input
                        type='number'
                        min='0'
                        max='100'
                        placeholder='Enter progress percentage'
                        className='input-field w-full'
                        id={`progress-${schedule.id}`}
                      />
                    </div>
                    
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Add Notes/Updates</label>
                      <textarea
                        placeholder='Add progress notes, observations, or updates...'
                        rows='2'
                        className='input-field w-full'
                        id={`notes-${schedule.id}`}
                      />
                    </div>
                    
                    <button
                      onClick={() => {
                        const progressInput = document.getElementById(`progress-${schedule.id}`);
                        const notesInput = document.getElementById(`notes-${schedule.id}`);
                        const progress = Number(progressInput?.value || 0);
                        const notes = notesInput?.value || '';
                        if (progress >= 0 && progress <= 100) {
                          addProgressUpdate(schedule.id, progress, notes);
                          progressInput.value = '';
                          notesInput.value = '';
                        }
                      }}
                      className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium'
                    >
                      📝 Add Progress Update
                    </button>
                  </div>
                )}

                {/* Tracking History */}
                {schedule.tracking && schedule.tracking.length > 0 && (
                  <div className='mb-4'>
                    <p className='text-sm font-medium text-gray-700 mb-2'>📋 Recent Updates:</p>
                    <div className='max-h-32 overflow-y-auto space-y-2'>
                      {schedule.tracking.slice(-3).map((track, idx) => (
                        <div key={idx} className='text-xs p-2 bg-gray-50 rounded border-l-2 border-gray-300'>
                          <p className='font-medium text-gray-800'>{track.progress}</p>
                          {track.notes && <p className='text-gray-600 mt-1'>{track.notes}</p>}
                          <p className='text-gray-500 mt-1'>
                            {new Date(track.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {schedule.status === "Ongoing" ? (
                  <button
                    onClick={() => markCompleted(schedule.id)}
                    className='w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium'
                  >
                    ✅ Mark as Completed
                  </button>
                ) : schedule.status === "COMPLETED" ? (
                  <div className='text-center p-3 bg-green-50 rounded-lg border border-green-200'>
                    <p className='font-medium text-green-800'>🎉 Harvest Completed!</p>
                    <p className='text-sm text-green-600'>Great job on your harvest!</p>
                  </div>
                ) : (
                  <p className='font-medium text-center text-gray-500'>Status: {schedule.status}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HarvestTrack;
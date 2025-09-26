import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import { Calendar, MapPin, Users, Package, Clock, CheckCircle, AlertCircle, Play, Pause, RotateCcw, MessageSquare, Camera, FileText } from "lucide-react";
import toast from "react-hot-toast";

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
)

const HarvestTrack = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressUpdate, setProgressUpdate] = useState({ progress: '', notes: '', photos: [] });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [selectedScheduleForAbandon, setSelectedScheduleForAbandon] = useState(null);

  useEffect(() => {
    fetchSchedules();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchSchedules, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSchedules = async () => {
      setLoading(true);
      try {
      const { data } = await axiosInstance.get('/harvest/schedules');
      console.log('Fetched schedules data:', data);
      
      // Filter for ongoing schedules only (exclude cancelled/abandoned)
      const ongoingSchedules = (data.harvests || []).filter(schedule => 
        ['Published', 'In Progress'].includes(schedule.harvestSchedule?.scheduleStatus) &&
        schedule.status !== 'CANCELLED' &&
        schedule.harvestSchedule?.scheduleStatus !== 'Cancelled'
      );
      
      console.log('Ongoing schedules:', ongoingSchedules);
      setSchedules(ongoingSchedules);
      } catch (error) {
        console.error('Failed to load harvest schedules:', error);
      toast.error('Failed to load harvest schedules');
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

  const addProgressUpdate = async () => {
    if (!selectedSchedule || !progressUpdate.progress.trim()) return;

    try {
      await axiosInstance.post(`/harvest/${selectedSchedule._id}/update`, {
        progress: progressUpdate.progress,
        notes: progressUpdate.notes
      });

      toast.success('Progress update added successfully!');
      setShowProgressModal(false);
      setProgressUpdate({ progress: '', notes: '', photos: [] });
      fetchSchedules(); // Refresh the list
    } catch (error) {
      console.error('Failed to add progress update:', error);
      toast.error('Failed to add progress update');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedSchedule || !selectedPhase) return;

    try {
      console.log('=== STATUS UPDATE DEBUG ===');
      console.log('Selected Schedule:', selectedSchedule._id);
      console.log('Selected Phase:', selectedPhase);
      console.log('Status Update Data:', statusUpdate);
      console.log('Phase Index:', selectedPhase.index);
      console.log('Current Phase Status:', selectedPhase.status);
      console.log('New Status:', statusUpdate.status);
      console.log('========================');

      const response = await axiosInstance.put(`/harvest/${selectedSchedule._id}/schedule/status`, {
        phaseIndex: selectedPhase.index,
        status: statusUpdate.status,
        notes: statusUpdate.notes
      });

      console.log('Status update response:', response.data);
      toast.success('Status updated successfully!');
      setShowStatusModal(false);
      setStatusUpdate({ status: '', notes: '' });
      
      // Refresh the list to get updated data
      await fetchSchedules();
      console.log('Schedules refreshed after status update');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const openStatusModal = (schedule, phase, index) => {
    console.log('=== OPENING STATUS MODAL ===');
    console.log('Schedule:', schedule._id);
    console.log('Phase:', phase);
    console.log('Index:', index);
    console.log('Current Phase Status:', phase.status);
    console.log('==========================');
    
    setSelectedSchedule(schedule);
    setSelectedPhase({ ...phase, index });
    setStatusUpdate({ 
      status: phase.status, 
      notes: phase.notes || '' 
    });
    setShowStatusModal(true);
  };

  const handleAbandonHarvest = async () => {
    if (!selectedScheduleForAbandon) return;

    try {
      console.log('Abandoning harvest:', selectedScheduleForAbandon._id);
      
      await axiosInstance.delete(`/harvest/${selectedScheduleForAbandon._id}/abandon`);
      
      toast.success('Harvest process abandoned successfully');
      setShowAbandonModal(false);
      setSelectedScheduleForAbandon(null);
      
      // Refresh the schedules list
      await fetchSchedules();
    } catch (error) {
      console.error('Failed to abandon harvest:', error);
      toast.error('Failed to abandon harvest process');
    }
  };

  const openAbandonModal = (schedule) => {
    setSelectedScheduleForAbandon(schedule);
    setShowAbandonModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-gray-100 text-gray-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'In Progress': return <Play className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const calculateOverallProgress = (timeline) => {
    if (!timeline || timeline.length === 0) return 0;
    const completed = timeline.filter(phase => phase.status === 'Completed').length;
    return Math.round((completed / timeline.length) * 100);
  };

  const getCurrentPhase = (timeline) => {
    if (!timeline || timeline.length === 0) return null;
    return timeline.find(phase => phase.status === 'In Progress') || timeline[0];
  };

  const openProgressModal = (schedule) => {
    setSelectedSchedule(schedule);
    setProgressUpdate({ progress: '', notes: '', photos: [] });
    setShowProgressModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Harvest Track</h1>
          <p className="text-gray-600">Track progress and update status for your harvest schedules. Use HarvestSchedule page to view schedule details.</p>
        </div>

        {/* Schedules List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : schedules.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No ongoing harvests</h3>
            <p className="text-gray-600">You don't have any ongoing harvest schedules to track.</p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {schedules.map((schedule) => {
              const overallProgress = calculateOverallProgress(schedule.harvestSchedule?.timeline);
              const currentPhase = getCurrentPhase(schedule.harvestSchedule?.timeline);
              
              return (
                <Card key={schedule._id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {schedule.crop} - {schedule.harvestSchedule?.cropVariety || 'Standard'}
                      </h3>
                      <p className="text-gray-600">Farmer: {schedule.farmerName}</p>
                      <p className="text-gray-600">Agronomist: {schedule.expertName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                        Ongoing
                  </span>
                </div>
                  </div>

                  {/* Overall Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-sm font-medium text-gray-900">{overallProgress}%</span>
                  </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${overallProgress}%` }}
                      ></div>
                  </div>
                </div>

                  {/* Current Phase */}
                  {currentPhase && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-blue-900">Current Phase</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(currentPhase.status)}`}>
                          {getStatusIcon(currentPhase.status)}
                          {currentPhase.status}
                        </span>
                      </div>
                      <p className="text-blue-800 font-medium">{currentPhase.phase}</p>
                      <p className="text-blue-700 text-sm mt-1">
                        Activities: {currentPhase.activities?.join(', ') || 'No activities specified'}
                      </p>
                      {currentPhase.notes && (
                        <p className="text-blue-600 text-sm mt-1 italic">Notes: {currentPhase.notes}</p>
                      )}
                  </div>
                )}

                  {/* Timeline Progress */}
                  {schedule.harvestSchedule?.timeline && schedule.harvestSchedule.timeline.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Timeline Progress</h4>
                      <div className="space-y-3">
                        {schedule.harvestSchedule.timeline.map((phase, index) => {
                          console.log(`Phase ${index}:`, phase);
                          return (
                          <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${
                            phase.status === 'Completed' ? 'bg-green-50 border border-green-200' :
                            phase.status === 'In Progress' ? 'bg-blue-50 border border-blue-200' :
                            'bg-gray-50 border border-gray-200'
                          }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              phase.status === 'Completed' ? 'bg-green-500 text-white' :
                              phase.status === 'In Progress' ? 'bg-blue-500 text-white' :
                              'bg-gray-300 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className={`font-medium ${
                                  phase.status === 'Completed' ? 'text-green-800 line-through' : 'text-gray-900'
                                }`}>
                                  {phase.phase}
                                </h5>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(phase.status)}`}>
                                  {getStatusIcon(phase.status)}
                                  {phase.status}
                                </span>
                              </div>
                              <p className={`text-sm ${
                                phase.status === 'Completed' ? 'text-green-700 line-through' : 'text-gray-600'
                              }`}>
                                {phase.activities?.join(', ') || 'No activities specified'}
                                {phase.completedAt && ` • Completed: ${new Date(phase.completedAt).toLocaleDateString()}`}
                              </p>
                              {phase.notes && (
                                <p className={`text-sm mt-1 italic ${
                                  phase.status === 'Completed' ? 'text-green-600 line-through' : 'text-gray-500'
                                }`}>
                                  Notes: {phase.notes}
                                </p>
                              )}
                  </div>
                            <div className="ml-4 flex items-center gap-2">
                              {index > 0 && schedule.harvestSchedule.timeline[index - 1].status !== 'Completed' && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  🔒 Locked
                                </span>
                              )}
                              <button
                                onClick={() => openStatusModal(schedule, { ...phase, index }, index)}
                                disabled={index > 0 && schedule.harvestSchedule.timeline[index - 1].status !== 'Completed'}
                                className={`px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  index > 0 && schedule.harvestSchedule.timeline[index - 1].status !== 'Completed' 
                                    ? 'bg-gray-100 cursor-not-allowed opacity-50' 
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                Update Status
                              </button>
                  </div>
                </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recent Updates */}
                  {schedule.tracking && schedule.tracking.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Updates</h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {schedule.tracking.slice(-5).reverse().map((update, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{update.progress}</p>
                              {update.notes && (
                                <p className="text-sm text-gray-600 mt-1">{update.notes}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(update.updatedAt).toLocaleString()}
                                {update.agronomistName && ` • by ${update.agronomistName}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openProgressModal(schedule)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Add Progress Update
                    </button>
                    <button
                      onClick={() => navigate(`/harvest-schedule`)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <FileText className="w-4 h-4" />
                      View Schedule Details
                    </button>
                    <button
                      onClick={() => openAbandonModal(schedule)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Abandon
                    </button>
                  </div>
                </Card>
              );
            })}
                  </div>
                )}

        {/* Progress Update Modal */}
        {showProgressModal && selectedSchedule && (
          <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">Add Progress Update</h3>
              <p className="text-gray-600 mb-4">
                Update progress for: <strong>{selectedSchedule.crop}</strong>
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Progress Description</label>
                  <input
                    type="text"
                    value={progressUpdate.progress}
                    onChange={(e) => setProgressUpdate(prev => ({ ...prev, progress: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 50% of harvest completed"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                  <textarea
                    value={progressUpdate.notes}
                    onChange={(e) => setProgressUpdate(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Add any additional notes..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addProgressUpdate}
                  disabled={!progressUpdate.progress.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Update
                </button>
                        </div>
                    </div>
                  </div>
                )}

        {/* Status Update Modal */}
        {showStatusModal && selectedSchedule && selectedPhase && (
          <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">Update Phase Status</h3>
              <p className="text-gray-600 mb-4">
                Update status for: <strong>{selectedPhase.phase}</strong>
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={statusUpdate.status}
                    onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                  <textarea
                    value={statusUpdate.notes}
                    onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Add any notes about this phase..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Update Status
                  </button>
              </div>
                  </div>
          </div>
        )}

        {/* Abandon Confirmation Modal */}
        {showAbandonModal && selectedScheduleForAbandon && (
          <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-red-600">Abandon Harvest Process</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to abandon the harvest process for <strong>{selectedScheduleForAbandon.crop}</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone. The agronomist will be notified about this abandonment.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAbandonModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAbandonHarvest}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Abandon Harvest
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HarvestTrack;
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { axiosInstance } from '../lib/axios'
import { Clock, User, CheckCircle, AlertCircle, Calendar, FileText, MapPin, Sprout, RefreshCw, MessageSquare } from 'lucide-react'
import { toast } from 'react-hot-toast'

const AgronomistDashboard = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [assignedHarvests, setAssignedHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAssignedHarvests();
    // Set up auto-refresh every 30 seconds to see farmer updates
    const interval = setInterval(fetchAssignedHarvests, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAssignedHarvests = async () => {
    try {
      const response = await axiosInstance.get('/harvest/agronomist/assigned');
      setAssignedHarvests(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch assigned harvests:', error);
      toast.error('Failed to load assigned harvests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptHarvest = async (harvestId, action, notes = '') => {
    try {
      await axiosInstance.post(`/harvest/${harvestId}/accept`, { 
        action, 
        notes 
      });
      toast.success(`Assignment ${action}ed successfully`);
      fetchAssignedHarvests();
    } catch (error) {
      console.error(`Failed to ${action} harvest:`, error);
      toast.error(`Failed to ${action} assignment`);
    }
  };

  const handleAddNotes = async (harvestId, notes) => {
    try {
      await axiosInstance.post(`/harvest/${harvestId}/notes`, { notes });
      toast.success('Notes added successfully');
      fetchAssignedHarvests();
    } catch (error) {
      console.error('Failed to add notes:', error);
      toast.error('Failed to add notes');
    }
  };

  const handleHideHarvest = async (harvestId) => {
    try {
      await axiosInstance.delete(`/harvest/${harvestId}/hide`);
      toast.success('Harvest hidden from dashboard successfully');
      fetchAssignedHarvests();
    } catch (error) {
      console.error('Failed to hide harvest:', error);
      toast.error('Failed to hide harvest');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'REQUEST_PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'ASSIGNED':
        return <User className="w-5 h-5 text-blue-500" />;
      case 'ACCEPTED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'SCHEDULED':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'IN_PROGRESS':
        return <Sprout className="w-5 h-5 text-orange-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'CANCELLED':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'REQUEST_PENDING':
        return 'Request Pending';
      case 'ASSIGNED':
        return 'Assigned to You';
      case 'ACCEPTED':
        return 'Accepted';
      case 'SCHEDULED':
        return 'Scheduled';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'REQUEST_PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'SCHEDULED':
        return 'bg-purple-100 text-purple-800';
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredHarvests = assignedHarvests.filter(harvest => {
    if (statusFilter !== 'all' && harvest.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assigned harvests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none mx-0 w-full px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold">Agronomist Dashboard</h1>
            <p className="text-gray-600">Welcome back, {authUser?.fullName || 'Agronomist'}</p>
          </div>
          <button
            onClick={fetchAssignedHarvests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Availability toggle */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-3">
            <span className="text-sm text-gray-600">Availability : </span>
            <AvailabilityToggle />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {assignedHarvests.filter(h => h.status === 'ASSIGNED').length}
                </div>
                <div className="text-sm text-gray-600">Assigned</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {assignedHarvests.filter(h => h.status === 'ACCEPTED').length}
                </div>
                <div className="text-sm text-gray-600">Accepted</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Sprout className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {assignedHarvests.filter(h => h.status === 'IN_PROGRESS').length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {assignedHarvests.filter(h => h.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Statuses</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Harvests List */}
        <div className="space-y-4">
          {filteredHarvests.length === 0 ? (
            <div className="text-center py-12">
              <Sprout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No assigned harvests</h2>
              <p className="text-gray-600">You don't have any assigned harvest schedules yet.</p>
            </div>
          ) : (
            filteredHarvests.map((harvest) => (
              <HarvestCard
                key={harvest._id}
                harvest={harvest}
                onAccept={handleAcceptHarvest}
                onAddNotes={handleAddNotes}
                onHide={handleHideHarvest}
                getStatusIcon={getStatusIcon}
                getStatusText={getStatusText}
                getStatusColor={getStatusColor}
              />
            ))
          )}
        </div>
        <AvailabilityPrompt />
      </div>
    </div>
  )
}

const HarvestCard = ({ harvest, onAccept, onAddNotes, onHide, getStatusIcon, getStatusText, getStatusColor }) => {
  const navigate = useNavigate();
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState('');

  const handleAction = (action) => {
    if (action === 'accept' || action === 'reject') {
      onAccept(harvest._id, action, notes);
      setShowNotesModal(false);
      setNotes('');
    }
  };

  const handleAddNotes = () => {
    onAddNotes(harvest._id, notes);
    setShowNotesModal(false);
    setNotes('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border w-full max-w-6xl mx-auto">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {harvest.crop} Harvest
            </h3>
            <p className="text-xs text-gray-600">
              Farmer: {harvest.farmerName || 'Unknown'}
            </p>
            <p className="text-xs text-gray-600">
              Created: {new Date(harvest.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(harvest.status)}`}>
              {getStatusText(harvest.status)}
            </span>
            {(harvest.status === 'CANCELLED' || harvest.status === 'COMPLETED') && (
              <button
                onClick={() => onHide(harvest._id)}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                title={`Hide ${harvest.status === 'CANCELLED' ? 'cancelled' : 'completed'} harvest from dashboard`}
              >
                Hide
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Harvest Details */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center text-sm">
              <Sprout className="w-4 h-4 mr-2" />
              Harvest Details
            </h4>
            <div className="space-y-1 text-xs text-gray-600">
              <p><strong>Crop:</strong> {harvest.crop}</p>
              <p><strong>Expected Yield:</strong> {harvest.expectedYield || 'N/A'}</p>
              <p><strong>Harvest Date:</strong> {harvest.harvestDate ? new Date(harvest.harvestDate).toLocaleDateString() : 'N/A'}</p>
              {harvest.scheduledDate && (
                <p><strong>Scheduled Date:</strong> {new Date(harvest.scheduledDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Admin Advice */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center text-sm">
              <FileText className="w-4 h-4 mr-2" />
              Admin Advice
            </h4>
            <div className="space-y-1 text-xs text-gray-600">
              <p>{harvest.adminAdvice || 'No admin advice provided yet.'}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {harvest.notes && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Farmer Notes</h4>
            <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
              {harvest.notes}
            </div>
          </div>
        )}

        {/* Tracking History - Only show updates before harvest schedule creation */}
        {harvest.tracking && harvest.tracking.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Progress History</h4>
            <div className="space-y-1.5">
              {harvest.tracking
                .filter(track => {
                  // If harvest schedule exists, only show updates before it was created
                  if (harvest.harvestSchedule && harvest.harvestSchedule.createdAt) {
                    const scheduleCreatedAt = new Date(harvest.harvestSchedule.createdAt);
                    const trackUpdatedAt = new Date(track.updatedAt);
                    return trackUpdatedAt < scheduleCreatedAt;
                  }
                  // If no harvest schedule, show all updates
                  return true;
                })
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .map((track, index) => (
                  <div key={index} className="flex items-center space-x-3 text-xs">
                    {getStatusIcon('IN_PROGRESS')}
                    <span className="text-gray-600">{track.progress}</span>
                    <span className="text-gray-400">
                      {new Date(track.updatedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent Updates (same as HarvestTrack) */}
        {harvest.tracking && harvest.tracking.length > 0 && (
          <div className="mt-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Updates</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {harvest.tracking.slice(-5).reverse().map((update, index) => (
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

        {/* Harvest Schedule Timeline (for accepted harvests) */}
        {harvest.status === 'ACCEPTED' && harvest.harvestSchedule?.timeline && harvest.harvestSchedule.timeline.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Harvest Timeline Progress
            </h4>
            <div className="space-y-2">
              {harvest.harvestSchedule.timeline.map((phase, index) => (
                <div key={index} className={`flex items-center gap-3 p-2 rounded-lg text-xs ${
                  phase.status === 'Completed' ? 'bg-green-50 border border-green-200' :
                  phase.status === 'In Progress' ? 'bg-blue-50 border border-blue-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    phase.status === 'Completed' ? 'bg-green-500 text-white' :
                    phase.status === 'In Progress' ? 'bg-blue-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${
                        phase.status === 'Completed' ? 'text-green-800 line-through' : 'text-gray-900'
                      }`}>
                        {phase.phase}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        phase.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        phase.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {phase.status}
                      </span>
                    </div>
                    <p className={`text-gray-600 ${
                      phase.status === 'Completed' ? 'line-through' : ''
                    }`}>
                      {phase.activities?.join(', ') || 'No activities specified'}
                      {phase.completedAt && ` • Completed: ${new Date(phase.completedAt).toLocaleDateString()}`}
                    </p>
                    {phase.notes && (
                      <p className={`text-gray-500 mt-1 italic ${
                        phase.status === 'Completed' ? 'line-through' : ''
                      }`}>
                        Notes: {phase.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Farmer Updates (for accepted harvests) */}
        {harvest.status === 'ACCEPTED' && harvest.tracking && harvest.tracking.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm flex items-center">
              <User className="w-4 h-4 mr-2" />
              Recent Farmer Updates
            </h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {harvest.tracking
                .filter(track => track.updatedBy && track.updatedBy.toString() !== harvest.expertId?.toString())
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 3)
                .map((track, index) => (
                  <div key={index} className="flex items-start space-x-3 text-xs p-2 bg-blue-50 rounded">
                    <User className="w-3 h-3 mt-0.5 text-blue-600" />
                    <div className="flex-1">
                      <span className="text-blue-800 font-medium">{track.progress}</span>
                      {track.notes && (
                        <p className="text-blue-600 mt-1 italic">Note: {track.notes}</p>
                      )}
                      <span className="text-blue-500 text-xs">
                        {new Date(track.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex justify-end gap-2">
          {harvest.status === 'ASSIGNED' && (
            <>
              <button
                onClick={() => {
                  setActionType('accept');
                  setShowNotesModal(true);
                }}
                className="btn-primary"
              >
                Accept Assignment
              </button>
              <button
                onClick={() => {
                  setActionType('reject');
                  setShowNotesModal(true);
                }}
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200"
              >
                Reject Assignment
              </button>
            </>
          )}
          {/* Create Schedule button - only show for accepted assignments */}
          {harvest.status === 'ACCEPTED' && (
            <button
              onClick={() => navigate(`/create-schedule/${harvest._id}`)}
              className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200"
            >
              Create Schedule
            </button>
          )}
          {['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'].includes(harvest.status) && (
            <button
              onClick={() => {
                setActionType('notes');
                setShowNotesModal(true);
              }}
              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200"
            >
              Add Notes
            </button>
          )}
        </div>
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">
                {actionType === 'accept' && 'Accept Assignment'}
                {actionType === 'reject' && 'Reject Assignment'}
                {actionType === 'notes' && 'Add Notes'}
              </h2>
              <button onClick={() => setShowNotesModal(false)} className="text-gray-500">Close</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Notes (optional)</label>
                <textarea
                  className="input-field mt-1 w-full h-20"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes or comments..."
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  className="border px-3 py-2 rounded-md"
                  onClick={() => setShowNotesModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary px-3.5 h-9 rounded-full text-[13px] font-medium inline-flex items-center justify-center"
                  onClick={() => {
                    if (actionType === 'notes') {
                      handleAddNotes();
                    } else {
                      handleAction(actionType);
                    }
                  }}
                >
                  {actionType === 'accept' && 'Accept'}
                  {actionType === 'reject' && 'Reject'}
                  {actionType === 'notes' && 'Add Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AvailabilityToggle = () => {
  const { authUser, checkAuth } = useAuthStore();
  const current = String(authUser?.availability || 'AVAILABLE').toUpperCase();
  const [saving, setSaving] = useState(false);

  const next = current === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';

  const onToggle = async () => {
    setSaving(true);
    try {
      await axiosInstance.put('/auth/update-profile', { availability: next });
      await checkAuth();
    } finally {
      setSaving(false);
    }
  };

  return (
    <button onClick={onToggle} disabled={saving} className={`px-4 py-2 rounded-full text-sm font-medium ${current === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>
      {saving ? 'Saving…' : current === 'AVAILABLE' ? 'Available' : 'Unavailable'}
    </button>
  );
};

const AvailabilityPrompt = () => {
  const { authUser, checkAuth } = useAuthStore();
  const isAgronomist = String(authUser?.role || '').toUpperCase() === 'AGRONOMIST';
  const isUnavailable = String(authUser?.availability || 'UNAVAILABLE').toUpperCase() === 'UNAVAILABLE';
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAgronomist || !isUnavailable) return;
    const userId = authUser?.id || authUser?._id;
    const lastLogin = authUser?.lastLogin ? new Date(authUser.lastLogin).getTime() : null;
    if (!userId || !lastLogin) {
      if (!open) setOpen(true);
      return;
    }

    const flagKey = `availabilityPromptShown:${userId}:${lastLogin}`;
    const alreadyShown = sessionStorage.getItem(flagKey) === '1';
    if (!alreadyShown) {
      sessionStorage.setItem(flagKey, '1');
      setOpen(true);
    }
  }, [isAgronomist, isUnavailable, authUser?.id, authUser?._id, authUser?.lastLogin]);

  if (!open) return null;

  return (
    <div className='fixed inset-0 bg-black/40 grid place-items-center z-50'>
      <div className='bg-white rounded-lg w-full max-w-md p-4'>
        <div className='mb-2 text-lg font-semibold'>Set availability to Available?</div>
        <div className='text-sm text-gray-600 mb-4'>You are currently unavailable. Would you like to switch to Available so you can receive harvest assignments?</div>
        <div className='flex items-center justify-end gap-2'>
          <button className='border px-3 py-2 rounded-md' onClick={() => setOpen(false)}>Not now</button>
          <button
            className='btn-primary px-3.5 h-9 rounded-full text-[13px] font-medium inline-flex items-center justify-center'
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await axiosInstance.put('/auth/update-profile', { availability: 'AVAILABLE' });
                await checkAuth();
                setOpen(false);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Updating…' : 'Set Available'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default AgronomistDashboard;

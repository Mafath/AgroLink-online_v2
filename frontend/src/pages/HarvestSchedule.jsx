import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import { Calendar, MapPin, Users, Package, Clock, CheckCircle, AlertCircle, Play, Pause, RotateCcw, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

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
  // Removed status update functionality - this page is now read-only

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/harvest/schedules');
      // Filter out cancelled/abandoned harvests
      const activeSchedules = (data.harvests || []).filter(schedule => 
        schedule.status !== 'CANCELLED' && 
        schedule.harvestSchedule?.scheduleStatus !== 'Cancelled'
      );
      setSchedules(activeSchedules);
    } catch (error) {
      console.error('Failed to load harvest schedules:', error);
      toast.error('Failed to load harvest schedules');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // Status update functionality moved to HarvestTrack page

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-gray-100 text-gray-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Delayed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'In Progress': return <Play className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Delayed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesFilter = filter === "All" || 
      (filter === "Ongoing" && ['Published', 'In Progress'].includes(schedule.harvestSchedule?.scheduleStatus)) ||
      (filter === "Completed" && schedule.harvestSchedule?.scheduleStatus === 'Completed') ||
      (filter === "Draft" && schedule.harvestSchedule?.scheduleStatus === 'Draft');
    
    const matchesSearch = searchTerm === "" || 
      schedule.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.farmerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Status modal functionality moved to HarvestTrack page

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Harvest Schedules</h1>
          <p className="text-gray-600">View your harvest schedules created by agronomists. Use HarvestTrack page to update progress.</p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            {["All", "Ongoing", "Completed", "Draft"].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {filterOption}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search by crop or farmer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Schedules List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No harvest schedules found</h3>
            <p className="text-gray-600">No harvest schedules match your current filters.</p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredSchedules.map((schedule) => (
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
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      schedule.harvestSchedule?.scheduleStatus === 'Published' ? 'bg-blue-100 text-blue-700' :
                      schedule.harvestSchedule?.scheduleStatus === 'In Progress' ? 'bg-green-100 text-green-700' :
                      schedule.harvestSchedule?.scheduleStatus === 'Completed' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {schedule.harvestSchedule?.scheduleStatus === 'Published' ? 'Ongoing' :
                       schedule.harvestSchedule?.scheduleStatus || 'Draft'}
                    </span>
                  </div>
                </div>

                {/* Schedule Details */}
                {schedule.harvestSchedule && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{schedule.harvestSchedule.farmLocation?.address || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Harvest: {schedule.harvestSchedule.expectedHarvestDate ? 
                        new Date(schedule.harvestSchedule.expectedHarvestDate).toLocaleDateString() : 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="w-4 h-4" />
                      <span>Yield: {schedule.harvestSchedule.expectedYield?.quantity || 0} {schedule.harvestSchedule.expectedYield?.unit || 'kg'}</span>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {schedule.harvestSchedule?.timeline && schedule.harvestSchedule.timeline.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Harvest Timeline</h4>
                    <div className="space-y-3">
                      {schedule.harvestSchedule.timeline.map((phase, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-gray-900">{phase.phase}</h5>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(phase.status)}`}>
                                {getStatusIcon(phase.status)}
                                {phase.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              Activities: {phase.activities?.join(', ') || 'No activities specified'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Duration: {phase.duration} day{phase.duration !== 1 ? 's' : ''}
                              {phase.startDate && ` • Start: ${new Date(phase.startDate).toLocaleDateString()}`}
                              {phase.completedAt && ` • Completed: ${new Date(phase.completedAt).toLocaleDateString()}`}
                            </p>
                            {phase.notes && (
                              <p className="text-sm text-gray-500 mt-1 italic">Notes: {phase.notes}</p>
                            )}
                          </div>
                          <div className="ml-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(phase.status)}`}>
                              {getStatusIcon(phase.status)}
                              {phase.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quality Standards */}
                {schedule.harvestSchedule?.qualityStandards && (
                  <div className="mt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Quality Standards</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {schedule.harvestSchedule.qualityStandards.size && (
                        <div>
                          <span className="font-medium text-gray-700">Size:</span>
                          <p className="text-gray-600">{schedule.harvestSchedule.qualityStandards.size}</p>
                        </div>
                      )}
                      {schedule.harvestSchedule.qualityStandards.color && (
                        <div>
                          <span className="font-medium text-gray-700">Color:</span>
                          <p className="text-gray-600">{schedule.harvestSchedule.qualityStandards.color}</p>
                        </div>
                      )}
                      {schedule.harvestSchedule.qualityStandards.ripeness && (
                        <div>
                          <span className="font-medium text-gray-700">Ripeness:</span>
                          <p className="text-gray-600">{schedule.harvestSchedule.qualityStandards.ripeness}</p>
                        </div>
                      )}
                      {schedule.harvestSchedule.qualityStandards.packaging && (
                        <div>
                          <span className="font-medium text-gray-700">Packaging:</span>
                          <p className="text-gray-600">{schedule.harvestSchedule.qualityStandards.packaging}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => navigate('/harvest-track')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Track Progress
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Status update functionality moved to HarvestTrack page */}
      </div>
    </div>
  );
};

export default HarvestSchedule;
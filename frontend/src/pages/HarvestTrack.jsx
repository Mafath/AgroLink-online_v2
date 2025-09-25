// src/pages/HarvestTrack.jsx
import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom"; // ✅ added
import { axiosInstance } from "../lib/axios";

const HarvestTrack = () => {
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const fetchOngoing = async () => {
      try {
        // Try farmer scheduled
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
      } catch (_) {
        setSchedules([]);
      }
    };
    fetchOngoing();
  }, []);

  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate(); // ✅ added

  const handleUpdate = (id, field, value) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addProgressUpdate = async (id, progress, notes) => {
    try {
      await axiosInstance.post(`/harvest/${id}/update`, {
        progress: `${progress}% completed`,
        notes: notes
      });
      
      // Update local state
      setSchedules((prev) =>
        prev.map((s) => 
          s.id === id 
            ? { 
                ...s, 
                progress: progress,
                notes: notes,
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
    } catch (error) {
      console.error('Failed to update progress:', error);
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
    } catch (error) {
      console.error('Failed to mark as completed:', error);
    }
  };

  return (
    <div
      className={`min-h-screen px-6 py-12 transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* Header with toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📊 Track My Harvest Progress</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:scale-105 transition"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Back Button under the title */}
      <div className="mb-10">
        <button
          onClick={() => navigate("/harvest-dashboard")}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition"
        >
          ⬅ Back
        </button>
      </div>

      {/* Schedule cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className={`rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-shadow ${
              darkMode ? "bg-green-800 text-white" : "bg-green-100 text-gray-900"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{schedule.cropType}</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  schedule.status === "Ongoing"
                    ? darkMode
                      ? "bg-yellow-700 text-yellow-100"
                      : "bg-yellow-200 text-yellow-800"
                    : darkMode
                    ? "bg-green-700 text-green-100"
                    : "bg-green-200 text-green-800"
                }`}
              >
                {schedule.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm">
                <span className="font-medium">👨‍🌾 Farmer:</span> {schedule.farmerName}
              </p>
              <p className="text-sm">
                <span className="font-medium">📅 Scheduled Date:</span> {schedule.scheduledDate}
              </p>
              <p className="text-sm">
                <span className="font-medium">🌾 Expected Yield:</span> {schedule.expectedYield} kg
              </p>
            </div>

            {/* Expert Advice */}
            {schedule.notes && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">💡 Expert Advice:</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">{schedule.notes}</p>
              </div>
            )}


            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
              <div
                className="h-3 rounded-full transition-all duration-500 bg-green-500"
                style={{ width: `${schedule.progress}%` }}
              ></div>
            </div>
            <p className="text-sm mb-3">Progress: {schedule.progress}%</p>

            {/* Progress Tracking Form */}
            {schedule.status === "Ongoing" && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Update Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter progress percentage"
                    className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                      darkMode
                        ? "bg-gray-800 border border-green-600 text-white"
                        : "bg-white border border-green-300 text-gray-900"
                    }`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const progress = Number(e.target.value);
                        const notes = e.target.nextElementSibling?.value || '';
                        if (progress >= 0 && progress <= 100) {
                          addProgressUpdate(schedule.id, progress, notes);
                          e.target.value = '';
                          e.target.nextElementSibling.value = '';
                        }
                      }
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Add Notes/Updates</label>
                  <textarea
                    placeholder="Add progress notes, observations, or updates..."
                    rows="2"
                    className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                      darkMode
                        ? "bg-gray-800 border border-green-600 text-white"
                        : "bg-white border border-green-300 text-gray-900"
                    }`}
                  />
                </div>
                
                <button
                  onClick={() => {
                    const progressInput = document.querySelector(`input[placeholder="Enter progress percentage"]`);
                    const notesInput = document.querySelector(`textarea[placeholder="Add progress notes, observations, or updates..."]`);
                    const progress = Number(progressInput?.value || 0);
                    const notes = notesInput?.value || '';
                    if (progress >= 0 && progress <= 100) {
                      addProgressUpdate(schedule.id, progress, notes);
                      progressInput.value = '';
                      notesInput.value = '';
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  📝 Add Progress Update
                </button>
              </div>
            )}

            {/* Tracking History */}
            {schedule.tracking && schedule.tracking.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">📋 Progress History:</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {schedule.tracking.slice(-3).map((track, idx) => (
                    <div key={idx} className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      <p className="font-medium">{track.progress}</p>
                      {track.notes && <p className="text-gray-600 dark:text-gray-400">{track.notes}</p>}
                      <p className="text-gray-500 dark:text-gray-500">
                        {new Date(track.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {schedule.status === "Ongoing" ? (
              <div className="space-y-2">
                <button
                  onClick={() => markCompleted(schedule.id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  ✅ Mark as Completed
                </button>
              </div>
            ) : schedule.status === "COMPLETED" ? (
              <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <p className="font-medium text-green-800 dark:text-green-200">🎉 Harvest Completed!</p>
                <p className="text-sm text-green-600 dark:text-green-400">Great job on your harvest!</p>
              </div>
            ) : (
              <p className="font-medium text-center text-gray-500">Status: {schedule.status}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HarvestTrack;

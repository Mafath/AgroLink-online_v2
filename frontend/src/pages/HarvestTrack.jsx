// src/pages/HarvestTrack.jsx
import React, { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom"; // ✅ added

const HarvestTrack = () => {
  const [schedules, setSchedules] = useState([
    {
      id: 1,
      cropType: "Tomatoes",
      expertName: "Dr. John Doe",
      expectedYield: 200,
      harvestDate: "2025-09-25",
      status: "Ongoing",
      progress: 40,
      notes: "Irrigation completed last week",
    },
    {
      id: 2,
      cropType: "Cabbage",
      expertName: "Dr. Jane Smith",
      expectedYield: 180,
      harvestDate: "2025-09-30",
      status: "Ongoing",
      progress: 20,
      notes: "Fertilizer applied",
    },
  ]);

  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate(); // ✅ added

  const handleUpdate = (id, field, value) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const markCompleted = (id) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "Completed", progress: 100 } : s
      )
    );
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

            <p className="mb-1">
              <span className="font-medium">Expert:</span> {schedule.expertName}
            </p>
            <p className="mb-1">
              <span className="font-medium">Expected Yield:</span>{" "}
              {schedule.expectedYield} kg
            </p>
            <p className="mb-3">
              <span className="font-medium">Harvest Date:</span>{" "}
              {schedule.harvestDate}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
              <div
                className="h-3 rounded-full transition-all duration-500 bg-green-500"
                style={{ width: `${schedule.progress}%` }}
              ></div>
            </div>
            <p className="text-sm mb-3">Progress: {schedule.progress}%</p>

            {/* Notes */}
            <textarea
              value={schedule.notes}
              onChange={(e) => handleUpdate(schedule.id, "notes", e.target.value)}
              rows="2"
              className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm mb-3 ${
                darkMode
                  ? "bg-gray-800 border border-green-600 text-white"
                  : "bg-white border border-green-300 text-gray-900"
              }`}
            />

            {/* Update progress */}
            <input
              type="number"
              min="0"
              max="100"
              value={schedule.progress}
              onChange={(e) =>
                handleUpdate(schedule.id, "progress", Number(e.target.value))
              }
              className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm mb-3 ${
                darkMode
                  ? "bg-gray-800 border border-green-600 text-white"
                  : "bg-white border border-green-300 text-gray-900"
              }`}
            />

            {schedule.status === "Ongoing" ? (
              <button
                onClick={() => markCompleted(schedule.id)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Mark as Completed ✅
              </button>
            ) : (
              <p className="font-medium text-center">Harvest Completed 🎉</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HarvestTrack;

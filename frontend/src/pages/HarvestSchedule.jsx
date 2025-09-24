// src/pages/HarvestSchedule.jsx
import React, { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HarvestSchedule = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();  // ✅ already added

  const [schedules] = useState([
    {
      id: 1,
      cropType: "Tomatoes",
      expertName: "Dr. John Doe",
      expectedYield: 200,
      harvestDate: "2025-09-25",
      status: "Ongoing",
    },
    {
      id: 2,
      cropType: "Lettuce",
      expertName: "Dr. Jane Smith",
      expectedYield: 150,
      harvestDate: "2025-09-20",
      status: "Completed",
    },
    {
      id: 3,
      cropType: "Cabbage",
      expertName: "Dr. John Doe",
      expectedYield: 180,
      harvestDate: "Pending",
      status: "Request Pending",
    },
    {
      id: 4,
      cropType: "Carrots",
      expertName: "Dr. Alex Green",
      expectedYield: 220,
      harvestDate: "2025-09-28",
      status: "Completed",
    },
  ]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-800 text-white";
      case "Ongoing":
        return "bg-orange-500 text-white";
      case "Request Pending":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const filteredSchedules = schedules
    .filter((s) => (filter === "All" ? true : s.status === filter))
    .filter(
      (s) =>
        s.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.expertName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div
      className={`min-h-screen px-6 py-12 transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* Header with Dark/Light Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">🌾 My Harvest Schedules</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 dark:text-white hover:scale-105 transition"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/harvest-dashboard")}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition"
        >
          ⬅ Back
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center mb-4">
        <input
          type="text"
          placeholder="Search by crop or expert..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-1/2 px-4 py-2 border border-green-300 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-green-900 dark:text-white"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex justify-center mb-8 space-x-4">
        {["All", "Ongoing", "Completed", "Request Pending"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium shadow-md transition-colors ${
              filter === status
                ? "bg-green-700 text-white"
                : "bg-green-200 text-green-900 hover:bg-green-300"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Schedule Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchedules.map((schedule) => (
          <div
            key={schedule.id}
            className="bg-green-600 dark:bg-green-700 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-shadow text-white"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{schedule.cropType}</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                  schedule.status
                )}`}
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
            <p>
              <span className="font-medium">Harvest Date:</span>{" "}
              {schedule.harvestDate}
            </p>

            {schedule.status === "Ongoing" && (
              <button
                onClick={() => navigate("/harvest-track")} // ✅ Navigate to HarvestTrack
                className="mt-4 w-full bg-white text-green-700 font-semibold py-2 px-4 rounded-lg hover:bg-green-100 transition-colors"
              >
                Track Progress
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSchedules.length === 0 && (
        <p className="text-center text-gray-600 dark:text-gray-400 mt-8">
          No schedules found for <span className="font-semibold">{filter}</span>.
        </p>
      )}
    </div>
  );
};

export default HarvestSchedule;

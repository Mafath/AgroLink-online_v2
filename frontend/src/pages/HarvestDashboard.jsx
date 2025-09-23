import React, { useState } from "react";
import {
  Sun,
  Moon,
  Calendar,
  ClipboardList,
  TrendingUp,
  Bug,
  List,
  Activity,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate

// ✅ Correct Swiper imports for v11+
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { Navigation } from "swiper/modules";

// ✅ Swiper CSS imports
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const HarvestDashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate(); // ✅ Initialize navigate

  const tips = [
    "Rotate crops to maintain soil health.",
    "Harvest early in the morning to preserve freshness.",
    "Always clean tools to prevent spreading diseases.",
    "Use organic compost to improve soil fertility.",
    "Track weather patterns to optimize harvest timing.",
  ];

  const metrics = [
    {
      label: "Total Schedules",
      value: 5,
      icon: <List size={24} />,
      color: "bg-pink-100 dark:bg-pink-700",
    },
    {
      label: "Ongoing Harvests",
      value: 2,
      icon: <Activity size={24} />,
      color: "bg-violet-100 dark:bg-violet-700",
    },
    {
      label: "Issues Reported",
      value: 1,
      icon: <AlertCircle size={24} />,
      color: "bg-red-100 dark:bg-red-700",
    },
  ];

  const tipColors = [
    "bg-green-200 dark:bg-green-700",
    "bg-blue-200 dark:bg-blue-700",
    "bg-yellow-200 dark:bg-yellow-700",
    "bg-red-200 dark:bg-red-700",
    "bg-purple-200 dark:bg-purple-700",
  ];

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Navbar placeholder */}
      <div className="h-16 bg-green-700 flex items-center px-6 text-white font-semibold shadow-md">
        AgroLink - Harvest Dashboard
      </div>

      {/* Welcome Header and Dark/Light Toggle */}
      <div className="flex items-center justify-between mt-6 px-6">
        <div>
          <h1 className="text-4xl font-bold">🌾 Welcome to Harvest Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300 text-lg">
            Manage your harvest schedules and report crop issues
          </p>
        </div>
        <div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 dark:text-white hover:scale-105 transition"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-6 mt-8">
        {metrics.map((m, i) => (
          <div
            key={i}
            className={`rounded-2xl shadow-lg p-6 text-center flex flex-col items-center justify-center ${m.color}`}
          >
            <div className="mb-2">{m.icon}</div>
            <h2 className="text-2xl font-bold">{m.value}</h2>
            <p className="text-gray-700 dark:text-gray-300">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Main Buttons with navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6 mt-12">
        <button
          onClick={() => navigate("/harvest-request")}
          className="bg-green-600 text-white py-6 rounded-2xl shadow-lg hover:bg-green-700 transition flex flex-col items-center gap-2"
        >
          <Calendar size={28} />
          Request Harvest Schedule
        </button>
        <button
          onClick={() => navigate("/harvest-schedule")}
          className="bg-blue-600 text-white py-6 rounded-2xl shadow-lg hover:bg-blue-700 transition flex flex-col items-center gap-2"
        >
          <ClipboardList size={28} />
          View My Harvest Schedules
        </button>
        <button
          onClick={() => navigate("/harvest-track")}
          className="bg-yellow-500 text-white py-6 rounded-2xl shadow-lg hover:bg-yellow-600 transition flex flex-col items-center gap-2"
        >
          <TrendingUp size={28} />
          Update/Track Progress
        </button>
        <button
          onClick={() => navigate("/harvest-report")}
          className="bg-red-600 text-white py-6 rounded-2xl shadow-lg hover:bg-red-700 transition flex flex-col items-center gap-2"
        >
          <Bug size={28} />
          Report Disease Problem
        </button>
      </div>

      {/* Pro Tips Section with Swiper */}
      <div className="mt-16 px-6 pb-16">
        <h2 className="text-xl font-semibold mb-6">🌱 Pro Farming Tips</h2>
        <Swiper
          modules={[Pagination, Navigation]}
          pagination={{ clickable: true }}
          navigation={true}
          spaceBetween={20}
          slidesPerView={1}
          className="rounded-2xl shadow-lg"
        >
          {tips.map((tip, i) => (
            <SwiperSlide key={i}>
              <div
                className={`p-8 rounded-2xl text-center shadow-lg h-40 flex items-center justify-center ${
                  tipColors[i % tipColors.length]
                }`}
              >
                <p className="text-lg font-medium">{tip}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default HarvestDashboard;

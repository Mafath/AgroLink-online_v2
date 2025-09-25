// src/pages/HarvestRequest.jsx
import React, { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const HarvestRequest = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    farmerName: "",
    cropType: "",
    expectedYield: "",
    harvestDate: "",
    notes: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        farmerName: formData.farmerName,
        cropType: formData.cropType,
        expectedYield: Number(formData.expectedYield),
        harvestDate: formData.harvestDate,
        notes: formData.notes,
      };
      const { data } = await axiosInstance.post("/harvest/request", payload);
      console.log("Harvest Request Submitted:", data);
      toast.success("Harvest schedule requested successfully!");
      navigate("/harvest-schedule");
    } catch (error) {
      console.error("Harvest request failed:", error);
      const message = error?.response?.data?.error?.message || "Failed to submit harvest request";
      toast.error(message);
    }
  };

  return (
    <div
      className={`flex flex-col min-h-screen px-4 py-12 transition-colors duration-300 ${
        darkMode
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-r from-green-50 to-green-100 text-gray-900"
      }`}
    >
      {/* Header with Dark/Light Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">🌱 Request Harvest Schedule</h2>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 dark:text-white hover:scale-105 transition"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Back Button moved under the title */}
      <div className="mb-10">
        <button
          onClick={() => navigate("/harvest-dashboard")}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition"
        >
          ⬅ Back
        </button>
      </div>

      {/* Form container with green background */}
      <div className="bg-green-100 dark:bg-green-800 shadow-lg hover:shadow-2xl transition-shadow rounded-2xl p-8 w-full max-w-2xl mx-auto">
        {/* Divider / Section Header */}
        <hr className="my-4 border-green-200 dark:border-green-600" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Farmer Details
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Farmer Name
            </label>
            <input
              type="text"
              name="farmerName"
              value={formData.farmerName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-green-300 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Crop Type
            </label>
            <input
              type="text"
              name="cropType"
              value={formData.cropType}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-green-300 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              required
            />
          </div>

          <hr className="my-4 border-green-200 dark:border-green-600" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Harvest Details
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expected Yield (kg)
            </label>
            <input
              type="number"
              name="expectedYield"
              value={formData.expectedYield}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-green-300 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Preferred Harvest Date
            </label>
            <input
              type="date"
              name="harvestDate"
              value={formData.harvestDate}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-green-300 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-green-300 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Request Schedule
          </button>
        </form>
      </div>
    </div>
  );
};

export default HarvestRequest;

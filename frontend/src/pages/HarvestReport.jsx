// src/pages/HarvestReport.jsx
import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom"; // ✅ added

const HarvestReport = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    image: null,
    description: "",
  });
  const [reports, setReports] = useState([
    {
      id: 1,
      image: null,
      description: "Leaves turning yellow, possible nutrient deficiency",
      status: "Replied",
      reply: "Apply nitrogen-rich fertilizer twice a week.",
    },
    {
      id: 2,
      image: null,
      description: "Brown spots on tomatoes",
      status: "Pending",
      reply: "",
    },
  ]);

  const navigate = useNavigate(); // ✅ added

  // Apply dark mode to <html> for Tailwind dark classes
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [darkMode]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setFormData({ ...formData, image: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description || !formData.image) {
      alert("Please provide both an image and a description.");
      return;
    }

    const newReport = {
      id: reports.length + 1,
      image: URL.createObjectURL(formData.image),
      description: formData.description,
      status: "Pending",
      reply: "",
    };

    setReports([newReport, ...reports]);
    setFormData({ image: null, description: "" });
    alert("Report submitted successfully!");

    // Simulate expert reply after 5 seconds
    setTimeout(() => {
      setReports((prevReports) =>
        prevReports.map((r) =>
          r.id === newReport.id
            ? {
                ...r,
                status: "Replied",
                reply: "Expert advice: Monitor the crop and apply recommended treatment.",
              }
            : r
        )
      );
    }, 5000);
  };

  return (
    <div className={`min-h-screen px-6 py-12 transition-colors duration-300 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
      {/* Header with Dark/Light Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1 className={`${darkMode ? "text-white" : "text-black"} text-3xl font-bold`}>
          📝 Report Crop Issue
        </h1>
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
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition"
        >
          ⬅ Back
        </button>
      </div>

      {/* Report Form */}
      <div className={`bg-green-100 dark:bg-green-800 rounded-2xl shadow-lg p-6 max-w-2xl mx-auto mb-12`}>
        <h2 className={`${darkMode ? "text-white" : "text-black"} text-2xl font-bold mb-4`}>
          Submit a New Report
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
              Upload Image
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="w-full text-gray-700 dark:text-gray-200"
              required
            />
            {formData.image && (
              <img
                src={URL.createObjectURL(formData.image)}
                alt="Preview"
                className="mt-2 rounded-lg max-h-48 object-cover"
              />
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-green-900 dark:text-white"
              placeholder="Describe the issue..."
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Submit Report
          </button>
        </form>
      </div>

      {/* Reports List */}
      <h2 className={`${darkMode ? "text-white" : "text-black"} text-2xl font-semibold mb-6 text-center`}>
        Previous Reports
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-green-50 dark:bg-green-900 rounded-2xl shadow-lg p-6 transition-shadow hover:shadow-2xl"
          >
            {report.image && (
              <img
                src={report.image}
                alt="Report"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <p className="text-gray-800 dark:text-gray-100 mb-2">
              <span className="font-medium">Description:</span> {report.description}
            </p>
            <p
              className={`px-3 py-1 rounded-full text-sm font-medium mb-2 inline-block ${
                report.status === "Pending"
                  ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100"
                  : "bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100"
              }`}
            >
              {report.status}
            </p>
            {report.status === "Replied" && (
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                <span className="font-medium">Expert Reply:</span> {report.reply}
              </p>
            )}
          </div>
        ))}
        {reports.length === 0 && (
          <p className="text-center text-gray-600 dark:text-gray-400 col-span-full">
            No reports submitted yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default HarvestReport;

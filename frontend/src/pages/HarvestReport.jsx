import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Camera, Send, ArrowLeft, MessageSquare, Calendar } from 'lucide-react';
import { axiosInstance } from '../lib/axios';

const HarvestReport = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    images: [],
    problem: "",
    crop: "",
    priority: "medium",
    agronomistId: ""
  });
  const [reports, setReports] = useState([]);
  const [agronomists, setAgronomists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingToReport, setReplyingToReport] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchReports();
    fetchAgronomists();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/harvest-reports/farmer/reports');
      setReports(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgronomists = async () => {
    try {
      // Use the new public endpoint to get agronomists
      const response = await axiosInstance.get('/auth/agronomists');
      setAgronomists(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch agronomists:', error);
      toast.error('Failed to load agronomists');
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "images") {
      const fileList = Array.from(files);
      setFormData({ ...formData, [name]: fileList });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.problem || !formData.images.length || !formData.crop || !formData.agronomistId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      // Convert images to base64
      const imagePromises = formData.images.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const base64Images = await Promise.all(imagePromises);

      // Submit the report
      const reportData = {
        crop: formData.crop,
        problem: formData.problem,
        priority: formData.priority,
        agronomistId: formData.agronomistId,
        images: base64Images
      };

      const response = await axiosInstance.post('/harvest-reports', reportData);
      
      toast.success("Report submitted successfully!");
      setFormData({ images: [], problem: "", crop: "", priority: "medium", agronomistId: "" });
      
      // Refresh the reports list
      fetchReports();
      
    } catch (error) {
      console.error('Failed to submit report:', error);
      const errorMessage = error?.response?.data?.error?.message || 'Failed to submit report. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFarmerReply = async (reportId) => {
    if (!replyMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      await axiosInstance.put(`/harvest-reports/${reportId}/farmer-reply`, {
        message: replyMessage.trim()
      });
      
      toast.success("Message sent successfully!");
      setReplyMessage('');
      setReplyingToReport(null);
      fetchReports(); // Refresh the reports list
      
    } catch (error) {
      console.error('Failed to send reply:', error);
      const errorMessage = error?.response?.data?.error?.message || 'Failed to send message. Please try again.';
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'resolved': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/harvest-dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Crop Problem Reports</h1>
          <p className="mt-2 text-gray-600">Report crop diseases and problems to get expert advice</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Submit New Report Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Camera className="mr-2 h-5 w-5 text-green-600" />
              Submit New Report
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Agronomist Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Agronomist *
                </label>
                <select
                  name="agronomistId"
                  value={formData.agronomistId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose an agronomist...</option>
                  {agronomists.map(agronomist => (
                    <option key={agronomist._id} value={agronomist._id}>
                      {agronomist.fullName} - {agronomist.expertise}
                    </option>
                  ))}
                </select>
                {agronomists.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">No agronomists available</p>
                )}
              </div>

              {/* Crop Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Type *
                </label>
                <input
                  type="text"
                  name="crop"
                  value={formData.crop}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Tomatoes, Corn, Wheat..."
                  required
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Problem Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Problem Description *
                </label>
                <textarea
                  name="problem"
                  value={formData.problem}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Describe the crop problem in detail..."
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images *
                </label>
                <input
                  type="file"
                  name="images"
                  onChange={handleChange}
                  multiple
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                {formData.images.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {formData.images.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Report
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Reports History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-green-600" />
              Your Reports
            </h2>

            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reports yet</h3>
                <p className="mt-1 text-sm text-gray-500">Submit your first crop problem report above.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {reports.map((report) => (
                  <div key={report._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{report.crop}</h3>
                        <p className="text-sm text-gray-600">To: {report.agronomist?.fullName}</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(report.priority)}`}>
                          {report.priority}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">{report.problem}</p>
                    
                    {report.images && report.images.length > 0 && (
                      <div className="flex space-x-2 mb-3">
                        {report.images.slice(0, 3).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Report image ${index + 1}`}
                            className="w-12 h-12 object-cover rounded border"
                          />
                        ))}
                        {report.images.length > 3 && (
                          <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                            <span className="text-xs text-gray-500">+{report.images.length - 3}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Conversation Thread */}
                    {report.conversation && report.conversation.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Conversation</h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {report.conversation
                            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                            .map((message, index) => (
                            <div key={index} className={`flex ${message.sender === 'farmer' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                                message.sender === 'farmer' 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-green-50 border border-green-200 text-green-800'
                              }`}>
                                <p className="text-sm">{message.message}</p>
                                <p className={`text-xs mt-1 ${
                                  message.sender === 'farmer' ? 'text-blue-100' : 'text-green-600'
                                }`}>
                                  {message.sender === 'farmer' ? 'You' : message.senderId?.fullName || 'Agronomist'} • {new Date(message.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legacy reply display (for backward compatibility) */}
                    {report.reply && (!report.conversation || report.conversation.length === 0) && (
                      <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                        <p className="text-sm font-medium text-green-800 mb-1">Expert Reply:</p>
                        <p className="text-sm text-green-700">{report.reply}</p>
                      </div>
                    )}

                    {/* Reply Button for farmers */}
                    {report.status === 'replied' && (
                      <div className="mt-3">
                        <button
                          onClick={() => setReplyingToReport(report._id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Reply to Expert
                        </button>
                      </div>
                    )}

                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      {replyingToReport && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Reply to Expert</h2>
              <button 
                onClick={() => {
                  setReplyingToReport(null);
                  setReplyMessage('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ask a follow-up question or provide additional information..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setReplyingToReport(null);
                    setReplyMessage('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleFarmerReply(replyingToReport)}
                  disabled={!replyMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HarvestReport;

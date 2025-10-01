import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { axiosInstance } from '../lib/axios'
import { Clock, User, CheckCircle, AlertCircle, Calendar, FileText, MapPin, Sprout, RefreshCw, MessageSquare, Bug, Reply, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import jsPDF from 'jspdf'

const AgronomistDashboard = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [assignedHarvests, setAssignedHarvests] = useState([]);
  const [harvestReports, setHarvestReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('harvests'); // 'harvests' or 'reports'

  useEffect(() => {
    fetchAssignedHarvests();
    fetchHarvestReports();
    // Set up auto-refresh every 30 seconds to see farmer updates
    const interval = setInterval(() => {
      fetchAssignedHarvests();
      fetchHarvestReports();
    }, 30000);
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

  const fetchHarvestReports = async () => {
    try {
      const response = await axiosInstance.get('/harvest-reports/agronomist/reports');
      setHarvestReports(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch harvest reports:', error);
      toast.error('Failed to load harvest reports');
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

  const handleReplyToReport = async (reportId, reply) => {
    try {
      await axiosInstance.put(`/harvest-reports/${reportId}/reply`, { reply });
      toast.success('Reply submitted successfully');
      fetchHarvestReports();
    } catch (error) {
      console.error('Failed to reply to report:', error);
      toast.error('Failed to submit reply');
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      await axiosInstance.put(`/harvest-reports/${reportId}/resolve`);
      toast.success('Report marked as resolved');
      fetchHarvestReports();
    } catch (error) {
      console.error('Failed to resolve report:', error);
      toast.error('Failed to resolve report');
    }
  };

  const handleDownloadPDF = () => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Helper function to add text with word wrapping
      const addText = (text, fontSize = 10, isBold = false, color = [0, 0, 0]) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(color[0], color[1], color[2]);
        
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * (fontSize * 0.4) + 5;
        
        // Check if we need a new page
        if (yPosition > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPosition = 20;
        }
      };
      
      // Helper function to add a line separator
      const addLine = () => {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      };
      
      // Title
      addText('AGRONOMIST WORK SUMMARY REPORT', 16, true, [0, 0, 0]);
      addLine();
      
      // Header Information
      const currentDate = new Date().toLocaleDateString();
      const agronomistName = authUser?.fullName || 'Agronomist';
      const expertise = authUser?.expertise || 'General Agriculture';
      
      addText(`Agronomist: ${agronomistName}`, 12, true);
      addText(`Expertise: ${expertise}`, 12);
      addText(`Report Date: ${currentDate}`, 12);
      addText(`Generated: ${new Date().toLocaleString()}`, 12);
      addLine();
      
      // Calculate statistics
      const harvestStats = {
        total: assignedHarvests.length,
        assigned: assignedHarvests.filter(h => h.status === 'ASSIGNED').length,
        accepted: assignedHarvests.filter(h => h.status === 'ACCEPTED').length,
        completed: assignedHarvests.filter(h => h.status === 'COMPLETED').length,
        cancelled: assignedHarvests.filter(h => h.status === 'CANCELLED').length
      };

      const reportStats = {
        total: harvestReports.length,
        assigned: harvestReports.filter(r => r.status === 'assigned').length,
        replied: harvestReports.filter(r => r.status === 'replied').length,
        resolved: harvestReports.filter(r => r.status === 'resolved').length,
        urgent: harvestReports.filter(r => r.priority === 'urgent').length
      };
      
      // Harvest Schedules Summary
      addText('HARVEST SCHEDULES SUMMARY', 14, true, [0, 100, 0]);
      addText(`Total Harvest Schedules: ${harvestStats.total}`, 12, true);
      addText(`• Assigned: ${harvestStats.assigned}`, 10);
      addText(`• Accepted: ${harvestStats.accepted}`, 10);
      addText(`• Completed: ${harvestStats.completed}`, 10);
      addText(`• Cancelled: ${harvestStats.cancelled}`, 10);
      
      const successRate = harvestStats.total > 0 ? ((harvestStats.completed / harvestStats.total) * 100).toFixed(1) : 0;
      addText(`Success Rate: ${successRate}%`, 12, true, [0, 150, 0]);
      addLine();
      
      // Detailed Harvest Schedules
      if (assignedHarvests.length > 0) {
        addText('DETAILED HARVEST SCHEDULES:', 12, true);
        assignedHarvests.forEach((harvest, index) => {
          addText(`${index + 1}. ${harvest.crop} Harvest`, 11, true);
          addText(`   Farmer: ${harvest.farmerName || 'Unknown'}`, 10);
          addText(`   Status: ${harvest.status}`, 10);
          addText(`   Expected Yield: ${harvest.expectedYield || 'Not specified'} kg`, 10);
          addText(`   Farm Size: ${harvest.personalizedData?.farmSize || 'Not specified'}`, 10);
          addText(`   Created: ${harvest.createdAt ? new Date(harvest.createdAt).toLocaleDateString() : 'Unknown'}`, 10);
          if (harvest.notes) {
            addText(`   Notes: ${harvest.notes}`, 10);
          }
          yPosition += 5; // Extra space between items
        });
      } else {
        addText('No harvest schedules assigned yet.', 10, false, [100, 100, 100]);
      }
      addLine();
      
      // Crop Reports Summary
      addText('CROP REPORTS SUMMARY', 14, true, [0, 100, 0]);
      addText(`Total Crop Reports: ${reportStats.total}`, 12, true);
      addText(`• Assigned: ${reportStats.assigned}`, 10);
      addText(`• Replied: ${reportStats.replied}`, 10);
      addText(`• Resolved: ${reportStats.resolved}`, 10);
      addText(`• Urgent Priority: ${reportStats.urgent}`, 10);
      
      const responseRate = reportStats.total > 0 ? ((reportStats.replied / reportStats.total) * 100).toFixed(1) : 0;
      const resolutionRate = reportStats.total > 0 ? ((reportStats.resolved / reportStats.total) * 100).toFixed(1) : 0;
      addText(`Response Rate: ${responseRate}%`, 12, true, [0, 150, 0]);
      addText(`Resolution Rate: ${resolutionRate}%`, 12, true, [0, 150, 0]);
      addLine();
      
      // Detailed Crop Reports
      if (harvestReports.length > 0) {
        addText('DETAILED CROP REPORTS:', 12, true);
        harvestReports.forEach((report, index) => {
          addText(`${index + 1}. ${report.crop} Problem Report`, 11, true);
          addText(`   Farmer: ${report.farmer?.fullName || 'Unknown'}`, 10);
          addText(`   Status: ${report.status}`, 10);
          addText(`   Priority: ${report.priority}`, 10);
          addText(`   Problem: ${report.problem}`, 10);
          if (report.reply) {
            addText(`   Response: ${report.reply}`, 10);
          } else {
            addText(`   Response: No response yet`, 10, false, [150, 0, 0]);
          }
          addText(`   Created: ${report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Unknown'}`, 10);
          if (report.repliedAt) {
            addText(`   Replied: ${new Date(report.repliedAt).toLocaleDateString()}`, 10);
          }
          yPosition += 5; // Extra space between items
        });
      } else {
        addText('No crop reports assigned yet.', 10, false, [100, 100, 100]);
      }
      addLine();
      
      // Performance Insights
      addText('PERFORMANCE INSIGHTS', 14, true, [0, 100, 0]);
      
      // Most Common Crop Issues
      const cropIssues = getMostCommonCropIssues();
      addText('Most Common Crop Issues:', 12, true);
      addText(cropIssues, 10);
      
      // Most Common Harvest Challenges
      const harvestChallenges = getMostCommonHarvestChallenges();
      addText('Most Common Harvest Challenges:', 12, true);
      addText(harvestChallenges, 10);
      
      // Average Response Time
      const avgResponseTime = calculateAverageResponseTime();
      addText(`Average Response Time: ${avgResponseTime}`, 12, true);
      
      // Recommendations
      addText('Recommendations:', 12, true);
      addText('• Continue providing expert advice on crop problems', 10);
      addText('• Maintain high response rates for urgent issues', 10);
      addText('• Focus on completing harvest schedules on time', 10);
      addText('• Document best practices for future reference', 10);
      addLine();
      
      // Footer
      addText('This report was generated automatically by the AgroLink system.', 8, false, [100, 100, 100]);
      addText('For questions or support, please contact the system administrator.', 8, false, [100, 100, 100]);
      
      // Save the PDF
      const fileName = `Agronomist_Summary_${authUser?.fullName?.replace(/\s+/g, '_') || 'Agronomist'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF summary downloaded successfully!');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF summary');
    }
  };


  const getMostCommonCropIssues = () => {
    const issues = harvestReports.map(r => r.crop).filter(Boolean);
    const counts = issues.reduce((acc, crop) => {
      acc[crop] = (acc[crop] || 0) + 1;
      return acc;
    }, {});
    
    const sorted = Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    return sorted.length > 0 
      ? sorted.map(([crop, count]) => `- ${crop}: ${count} reports`).join('\n')
      : 'No crop issues reported yet';
  };

  const getMostCommonHarvestChallenges = () => {
    const challenges = assignedHarvests.map(h => h.crop).filter(Boolean);
    const counts = challenges.reduce((acc, crop) => {
      acc[crop] = (acc[crop] || 0) + 1;
      return acc;
    }, {});
    
    const sorted = Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    return sorted.length > 0 
      ? sorted.map(([crop, count]) => `- ${crop}: ${count} schedules`).join('\n')
      : 'No harvest challenges yet';
  };

  const calculateAverageResponseTime = () => {
    const reportsWithReplies = harvestReports.filter(r => r.repliedAt && r.createdAt);
    if (reportsWithReplies.length === 0) return 'No responses yet';
    
    const totalTime = reportsWithReplies.reduce((sum, r) => {
      const created = new Date(r.createdAt);
      const replied = new Date(r.repliedAt);
      return sum + (replied - created);
    }, 0);
    
    const avgTimeMs = totalTime / reportsWithReplies.length;
    const avgHours = avgTimeMs / (1000 * 60 * 60);
    
    if (avgHours < 24) {
      return `${avgHours.toFixed(1)} hours`;
    } else {
      return `${(avgHours / 24).toFixed(1)} days`;
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
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Download className="w-4 h-4" />
              Download Summary
            </button>
            <button
              onClick={() => {
                fetchAssignedHarvests();
                fetchHarvestReports();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('harvests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'harvests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4" />
                  Harvest Schedules ({assignedHarvests.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Crop Reports ({harvestReports.length})
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Availability toggle */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-3">
            <span className="text-sm text-gray-600">Availability : </span>
            <AvailabilityToggle />
          </div>
        </div>


        {/* Content based on active tab */}
        {activeTab === 'harvests' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          </>
        ) : (
          <>
            {/* Harvest Reports Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bug className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {harvestReports.filter(r => r.status === 'assigned').length}
                    </div>
                    <div className="text-sm text-gray-600">Assigned</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Reply className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {harvestReports.filter(r => r.status === 'replied').length}
                    </div>
                    <div className="text-sm text-gray-600">Replied</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {harvestReports.filter(r => r.status === 'resolved').length}
                    </div>
                    <div className="text-sm text-gray-600">Resolved</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {harvestReports.filter(r => r.priority === 'urgent').length}
                    </div>
                    <div className="text-sm text-gray-600">Urgent</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Harvest Reports List */}
            <div className="space-y-4">
              {harvestReports.length === 0 ? (
                <div className="text-center py-12">
                  <Bug className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">No crop reports</h2>
                  <p className="text-gray-600">You don't have any assigned crop problem reports yet.</p>
                </div>
              ) : (
                harvestReports.map((report) => (
                  <HarvestReportCard
                    key={report._id}
                    report={report}
                    onReply={handleReplyToReport}
                    onResolve={handleResolveReport}
                  />
                ))
              )}
            </div>
          </>
        )}
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

const HarvestReportCard = ({ report, onReply, onResolve }) => {
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [reply, setReply] = useState('');

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

  const handleReply = () => {
    if (reply.trim()) {
      onReply(report._id, reply.trim());
      setReply('');
      setShowReplyModal(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{report.crop}</h3>
          <p className="text-sm text-gray-600">From: {report.farmer?.fullName || 'Unknown Farmer'}</p>
          <p className="text-xs text-gray-500">
            Submitted: {new Date(report.createdAt).toLocaleDateString()}
          </p>
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

      {/* Problem Description */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Problem Description</h4>
        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{report.problem}</p>
      </div>

      {/* Images */}
      {report.images && report.images.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {report.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Report image ${index + 1}`}
                className="w-full h-24 object-cover rounded border"
              />
            ))}
          </div>
        </div>
      )}

      {/* Conversation Thread */}
      {report.conversation && report.conversation.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Conversation</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {report.conversation
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((message, index) => (
              <div key={index} className={`flex ${message.sender === 'agronomist' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  message.sender === 'agronomist' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'agronomist' ? 'text-green-100' : 'text-blue-600'
                  }`}>
                    {message.sender === 'agronomist' ? 'You' : message.senderId?.fullName || 'Farmer'} • {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy reply display (for backward compatibility) */}
      {report.reply && (!report.conversation || report.conversation.length === 0) && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Your Reply</h4>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800">{report.reply}</p>
            {report.repliedAt && (
              <p className="text-xs text-green-600 mt-2">
                Replied: {new Date(report.repliedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {report.status === 'assigned' && (
          <button
            onClick={() => setShowReplyModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Reply className="w-4 h-4" />
            Reply
          </button>
        )}
        {report.status === 'replied' && (
          <button
            onClick={() => onResolve(report._id)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Mark as Resolved
          </button>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Reply to Report</h2>
              <button 
                onClick={() => setShowReplyModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Expert Advice
                </label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide your expert advice and recommendations..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={!reply.trim()}
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

export default AgronomistDashboard;

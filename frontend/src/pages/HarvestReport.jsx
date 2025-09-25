import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
)

const HarvestReport = () => {
  const navigate = useNavigate();
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
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-none mx-0 w-full px-8 py-6'>
        {/* Top bar */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button 
              onClick={() => navigate('/harvest-dashboard')}
              className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
              </svg>
              <span className='text-sm font-medium'>Back to Dashboard</span>
            </button>
            <div className='h-6 w-px bg-gray-300'></div>
            <div className='text-center'>
              <h1 className='text-4xl font-bold text-gray-900 mb-2'>📝 Report Crop Issue</h1>
              <p className='text-gray-600'>Report crop diseases and get expert advice</p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Report Form */}
          <div className='lg:col-span-1'>
            <Card>
              <div className='p-6'>
                <h2 className='text-xl font-semibold text-gray-900 mb-4'>Submit New Report</h2>
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Upload Image
                    </label>
                    <input
                      type='file'
                      name='image'
                      accept='image/*'
                      onChange={handleChange}
                      className='input-field w-full'
                      required
                    />
                    {formData.image && (
                      <img
                        src={URL.createObjectURL(formData.image)}
                        alt='Preview'
                        className='mt-3 rounded-lg max-h-48 object-cover w-full'
                      />
                    )}
                  </div>
                  
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Description
                    </label>
                    <textarea
                      name='description'
                      value={formData.description}
                      onChange={handleChange}
                      rows='4'
                      className='input-field w-full'
                      placeholder='Describe the crop issue, symptoms, or problem you are experiencing...'
                      required
                    />
                  </div>
                  
                  <button
                    type='submit'
                    className='w-full btn-primary py-2 px-4 rounded-md text-sm font-medium'
                  >
                    Submit Report
                  </button>
                </form>
              </div>
            </Card>
          </div>

          {/* Reports List */}
          <div className='lg:col-span-2'>
            <Card>
              <div className='p-6'>
                <h2 className='text-xl font-semibold text-gray-900 mb-4'>Previous Reports</h2>
                {reports.length === 0 ? (
                  <div className='text-center py-8'>
                    <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                      <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                      </svg>
                    </div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>No reports yet</h3>
                    <p className='text-gray-500'>Submit your first crop issue report to get started.</p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {reports.map((report) => (
                      <div key={report.id} className='border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow'>
                        <div className='flex items-start justify-between mb-3'>
                          <div className='flex-1'>
                            <p className='text-gray-900 font-medium mb-2'>{report.description}</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              report.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}>
                              {report.status}
                            </span>
                          </div>
                          {report.image && (
                            <img
                              src={report.image}
                              alt='Report'
                              className='w-20 h-20 object-cover rounded-lg ml-4'
                            />
                          )}
                        </div>
                        
                        {report.status === "Replied" && report.reply && (
                          <div className='mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400'>
                            <p className='text-sm font-medium text-blue-900 mb-1'>💡 Expert Reply:</p>
                            <p className='text-sm text-blue-800'>{report.reply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HarvestReport;

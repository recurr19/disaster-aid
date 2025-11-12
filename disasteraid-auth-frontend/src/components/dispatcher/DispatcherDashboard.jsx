import { useState, useEffect } from 'react';
import { Package, Upload, CheckCircle, Clock, MapPin, Users, FileText } from 'lucide-react';
import API from '../../api/axios';

const DispatcherDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  // Removed unused selectedTicket state (not referenced in UI rendering)
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const res = await API.get('/dispatcher/my-tickets');
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      alert('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setUploadFiles(Array.from(e.target.files));
  };

  const handleUploadProof = async (ticketId) => {
    if (uploadFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      uploadFiles.forEach(file => {
        formData.append('files[]', file);
      });

      await API.post(`/dispatcher/upload-proof/${ticketId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

  alert('Delivery proof uploaded successfully!');
  setUploadFiles([]);
      fetchMyTickets();
    } catch (err) {
      console.error('Error uploading proof:', err);
      alert('Failed to upload delivery proof');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dispatcher Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">View and manage your assigned deliveries</p>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">{tickets.length} Assigned Tickets</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Assignments Yet</h3>
            <p className="text-gray-600">You don't have any tickets assigned to you at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl font-bold text-gray-900">#{ticket.ticketId}</span>
                        {ticket.isSOS && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                            🚨 SOS
                          </span>
                        )}
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          ticket.status === 'completed' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Dispatched: {new Date(ticket.dispatchedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">Assigned by</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {ticket.assignedTo?.organizationName || 'NGO'}
                      </p>
                    </div>
                  </div>

                  {/* Ticket Details Grid */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        <Users className="w-4 h-4 inline mr-1" />
                        Contact Person
                      </p>
                      <p className="font-semibold">{ticket.name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-600">{ticket.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Location
                      </p>
                      <p className="text-sm">{ticket.address}</p>
                      {ticket.landmark && <p className="text-xs text-gray-500">Landmark: {ticket.landmark}</p>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Help Types</p>
                      <div className="flex flex-wrap gap-1">
                        {ticket.helpTypes?.map((type, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Beneficiaries</p>
                      <p className="text-sm">
                        Adults: {ticket.adults || 0} | Children: {ticket.children || 0} | Elderly: {ticket.elderly || 0}
                      </p>
                    </div>
                  </div>

                  {ticket.description && (
                    <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Description
                      </p>
                      <p className="text-sm text-gray-800">{ticket.description}</p>
                    </div>
                  )}

                  {/* Delivery Proof Section */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Upload className="w-5 h-5 mr-2 text-blue-600" />
                      Delivery Proof
                    </h4>
                    
                    {ticket.deliveryProof && ticket.deliveryProof.length > 0 ? (
                      <div className="mb-4">
                        <p className="text-sm text-green-600 font-medium mb-2">
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          {ticket.deliveryProof.length} file(s) uploaded
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {ticket.deliveryProof.map((file, idx) => (
                            <div key={idx} className="p-2 bg-gray-100 rounded text-xs">
                              <p className="truncate font-medium">{file.originalname}</p>
                              <p className="text-gray-500">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-3">No delivery proof uploaded yet</p>
                    )}

                    {ticket.status !== 'completed' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Photos/Documents
                          </label>
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {uploadFiles.length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              {uploadFiles.length} file(s) selected
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleUploadProof(ticket._id)}
                          disabled={uploading || uploadFiles.length === 0}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{uploading ? 'Uploading...' : 'Upload Proof'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatcherDashboard;

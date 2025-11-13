import { useState, useEffect, useContext } from 'react';
import { Package, Upload, CheckCircle, Clock, MapPin, Users, FileText, AlertTriangle, User, Paperclip, Baby, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import AppHeader from '../common/AppHeader';
import { AuthContext } from '../../context/AuthContext';

const DispatcherDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  // Removed unused selectedTicket state (not referenced in UI rendering)
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <AppHeader
        title="Dispatcher Dashboard"
        subtitle="View and manage your assigned deliveries"
        onLogout={handleLogout}
        rightSlot={(
          <div className="flex items-center space-x-3">
            {user?.name && (
              <div className="hidden sm:flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
                <User className="w-3 h-3 mr-1" />
                {user.name}
              </div>
            )}
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-100">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-900 text-sm">{tickets.length} Assigned</span>
            </div>
          </div>
        )}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tickets.length === 0 ? (
          <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 p-12 text-center">
            <div className="p-4 bg-gradient-to-br from-gray-100 to-slate-100 rounded-2xl inline-block mb-4">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Assignments Yet</h3>
            <p className="text-gray-600">You don't have any tickets assigned to you at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 overflow-hidden hover:shadow-2xl transition-all">
                <div className="p-6">
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">#{ticket.ticketId}</span>
                        {ticket.isSOS && (
                          <span className="px-3 py-1 bg-gradient-to-r from-red-100 to-rose-100 border border-red-200 text-red-800 text-xs font-bold rounded-full shadow-sm flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> SOS
                          </span>
                        )}
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                          ticket.status === 'completed' ? 'bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 text-green-800' :
                          ticket.status === 'in-progress' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 text-yellow-800' :
                          'bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 text-blue-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Dispatched: {new Date(ticket.dispatchedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right glass-card bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur p-3 rounded-xl border border-blue-200">
                      <p className="text-xs font-medium text-blue-700 mb-1">Assigned by</p>
                      <p className="text-lg font-bold text-blue-900">
                        {ticket.assignedTo?.organizationName || 'NGO'}
                      </p>
                    </div>
                  </div>

                  {/* Ticket Details Grid */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4 p-5 glass-card bg-gradient-to-br from-gray-50/80 to-slate-50/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 rounded-xl border border-gray-200">
                    <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <Users className="w-4 h-4 text-blue-600" />
                        Contact Person
                      </p>
                      <p className="font-bold text-gray-900">{ticket.name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-600">{ticket.phone}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-green-600" />
                        Location
                      </p>
                      <p className="text-sm text-gray-900">{ticket.address}</p>
                      {ticket.landmark && (
                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {ticket.landmark}
                        </p>
                      )}
                    </div>
                    <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Help Types</p>
                      <div className="flex flex-wrap gap-2">
                        {ticket.helpTypes?.map((type, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg font-medium">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Beneficiaries</p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-900">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {ticket.adults || 0} Adults
                        </span>
                        <span className="flex items-center gap-1">
                          <Baby className="w-3 h-3" /> {ticket.children || 0} Children
                        </span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> {ticket.elderly || 0} Elderly
                        </span>
                      </div>
                    </div>
                  </div>

                  {ticket.description && (
                    <div className="mb-4 p-4 glass-card bg-gradient-to-r from-yellow-50/80 to-amber-50/80 backdrop-blur border-l-4 border-yellow-500 rounded-xl">
                      <p className="text-sm font-bold text-yellow-900 mb-2 flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        Description
                      </p>
                      <p className="text-sm text-yellow-800">{ticket.description}</p>
                    </div>
                  )}

                  {/* Delivery Proof Section */}
                  <div className="border-t border-gray-200 pt-5 mt-4">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl">
                        <Upload className="w-5 h-5 text-indigo-600" />
                      </div>
                      Delivery Proof
                    </h4>
                    
                    {ticket.deliveryProof && ticket.deliveryProof.length > 0 ? (
                      <div className="mb-4">
                        <p className="text-sm text-green-700 font-semibold mb-3 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {ticket.deliveryProof.length} file(s) uploaded
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {ticket.deliveryProof.map((file, idx) => (
                            <div key={idx} className="glass-card bg-gradient-to-br from-green-50 to-emerald-50 backdrop-blur p-3 rounded-xl border border-green-200 text-xs">
                              <p className="truncate font-semibold text-green-900">{file.originalname}</p>
                              <p className="text-green-600 mt-1">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-4 italic">No delivery proof uploaded yet</p>
                    )}

                    {ticket.status !== 'completed' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-3">
                            Upload Photos/Documents
                          </label>
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-600 file:to-indigo-600 file:text-white hover:file:from-blue-700 hover:file:to-indigo-700 file:shadow-lg file:cursor-pointer"
                          />
                          {uploadFiles.length > 0 && (
                            <p className="text-sm text-blue-600 font-medium mt-2 flex items-center gap-1">
                              <Paperclip className="w-4 h-4" /> {uploadFiles.length} file(s) selected
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleUploadProof(ticket._id)}
                          disabled={uploading || uploadFiles.length === 0}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all"
                        >
                          <Upload className="w-5 h-5" />
                          <span>{uploading ? 'Uploading...' : 'Upload Delivery Proof'}</span>
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

import { useState, useEffect, useContext } from 'react';
import { Package, Upload, CheckCircle, Clock, MapPin, Users, FileText, AlertTriangle, User, Paperclip, Baby, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import AppHeader from '../common/AppHeader';
import { AuthContext } from '../../context/AuthContext';
import { updateTicketStatus } from '../../api/tracker';
import { uploadDeliveryProof } from '../../api/dispatcher';
import { connectRealtime } from '../../api/realtime';

const DispatcherDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  // Removed unused selectedTicket state (not referenced in UI rendering)
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [dispatcherId, setDispatcherId] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDispatcherProfile();
    fetchMyTickets();
  }, []);

  const fetchDispatcherProfile = async () => {
    try {
      const res = await API.get('/auth/profile');
      if (res.data.dispatcherProfile) {
        setDispatcherId(res.data.dispatcherProfile._id);
      }
    } catch (err) {
      console.error('Error fetching dispatcher profile:', err);
    }
  };

  // WebSocket real-time updates
  useEffect(() => {
    if (!dispatcherId) return;

    const socket = connectRealtime(dispatcherId, 'dispatcher');

    const handleTicketAssigned = (data) => {
      console.log('🚚 New ticket assigned to dispatcher:', data);
      fetchMyTickets(); // Refresh ticket list
    };

    const handleTicketStatusUpdate = (data) => {
      console.log('📝 Ticket status updated:', data);
      // Update the specific ticket in state
      setTickets(prev => 
        prev.map(t => 
          t.ticketId === data.ticketNumber 
            ? { ...t, status: data.newStatus }
            : t
        )
      );
    };

    const handleTicketClosed = (data) => {
      console.log('🔒 Ticket closed:', data);
      // Update the ticket status to closed
      setTickets(prev => 
        prev.map(t => 
          t.ticketId === data.ticketNumber 
            ? { ...t, status: 'closed' }
            : t
        )
      );
    };

    const handleProofUploaded = (data) => {
      console.log('📸 Delivery proof uploaded:', data);
      fetchMyTickets(); // Refresh to get updated proof
    };

    socket.on('dispatcher:ticket:assigned', handleTicketAssigned);
    socket.on('ngo:ticket:status:updated', handleTicketStatusUpdate);
    socket.on('ngo:ticket:closed', handleTicketClosed);
    socket.on('dispatcher:proof:uploaded', handleProofUploaded);

    return () => {
      socket.off('dispatcher:ticket:assigned', handleTicketAssigned);
      socket.off('ngo:ticket:status:updated', handleTicketStatusUpdate);
      socket.off('ngo:ticket:closed', handleTicketClosed);
      socket.off('dispatcher:proof:uploaded', handleProofUploaded);
    };
  }, [dispatcherId]);

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

      await uploadDeliveryProof(ticketId, uploadFiles);

      setUploadSuccess(`Delivery proof uploaded successfully! (${uploadFiles.length} file${uploadFiles.length > 1 ? 's' : ''})`);
      setUploadFiles([]);
      fetchMyTickets();
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (err) {
      console.error('Error uploading proof:', err);
      const message = err?.response?.data?.message || 'Failed to upload delivery proof';
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    if (!ticketId || !newStatus) return;

    try {
      setUpdatingTicketId(ticketId);
      await updateTicketStatus(ticketId, newStatus, `Dispatcher updated status to ${newStatus}`);

      setTickets(prev =>
        prev.map(t =>
          t.ticketId === ticketId
            ? { ...t, status: newStatus }
            : t
        )
      );
    } catch (err) {
      console.error('Error updating ticket status from dispatcher:', err);
      alert('Failed to update delivery status');
    } finally {
      setUpdatingTicketId(null);
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
        {/* Success Message */}
        {uploadSuccess && (
          <div className="mb-6 glass-card bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur border border-green-200 rounded-xl shadow-lg p-4 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-900">{uploadSuccess}</p>
                <p className="text-xs text-green-700">The NGO has been notified and can now close the ticket.</p>
              </div>
            </div>
            <button 
              onClick={() => setUploadSuccess(null)}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 p-12 text-center">
            <div className="p-4 bg-gradient-to-br from-gray-100 to-slate-100 rounded-2xl inline-block mb-4">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Assignments Yet</h3>
            <p className="text-gray-600">You don't have any tickets assigned to you at the moment.</p>
          </div>
        ) : (
          <div>
            {/* Tab Navigation */}
            <div className="mb-6 glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'active'
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  Active Deliveries
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === 'active'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tickets.filter(t => t.status !== 'closed').length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'completed'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-b-2 border-green-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  Completed Deliveries
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === 'completed'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tickets.filter(t => t.status === 'closed').length}
                  </span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
          <div className="space-y-8">{
            activeTab === 'active' ? (
            /* Active Tickets */
            tickets.filter(t => t.status !== 'closed').length > 0 ? (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-600" />
                  Active Deliveries ({tickets.filter(t => t.status !== 'closed').length})
                </h2>
                <div className="grid gap-6">
                  {tickets.filter(t => t.status !== 'closed').map((ticket) => (
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
                        {(() => {
                          const s = ticket.status;
                          let label = s;
                          if (s === 'dispatched') label = 'Dispatched';
                          else if (s === 'in_progress' || s === 'in-progress') label = 'On the way';
                          else if (s === 'fulfilled') label = 'Reached location';
                          else if (s === 'completed') label = 'Delivered';

                          const cls =
                            s === 'completed' || s === 'fulfilled'
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 text-green-800'
                              : (s === 'in-progress' || s === 'in_progress')
                              ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 text-yellow-800'
                              : 'bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 text-blue-800';

                          return (
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${cls}`}>
                              {label}
                            </span>
                          );
                        })()}
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
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      Delivery Status
                    </h4>

                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500" /> Victim Location
                      </p>
                      {(ticket.address || ticket.landmark || (ticket.locationGeo?.coordinates && ticket.locationGeo.coordinates.length === 2)) ? (
                        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm h-40">
                          <iframe
                            title={`map-${ticket._id}`}
                            className="w-full h-full border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            src={
                              ticket.address || ticket.landmark
                                ? `https://www.google.com/maps?q=${encodeURIComponent(
                                    `${ticket.address || ''} ${ticket.landmark || ''}`.trim()
                                  )}&output=embed`
                                : `https://www.google.com/maps?q=${ticket.locationGeo.coordinates[1]},${ticket.locationGeo.coordinates[0]}&output=embed`
                            }
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic mb-4">
                          No location information available.
                        </p>
                      )}
                      {ticket.locationGeo?.coordinates && ticket.locationGeo.coordinates.length === 2 && (
                        <div className="mt-2 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                          <span>Lat: {ticket.locationGeo.coordinates[1].toFixed(6)}</span>
                          <span className="mx-2">|</span>
                          <span>Lng: {ticket.locationGeo.coordinates[0].toFixed(6)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-6 flex flex-wrap gap-3">
                      {[
                        { key: 'dispatched',  label: 'Dispatched' },
                        { key: 'in_progress', label: 'On the way' },
                        { key: 'fulfilled',   label: 'Reached location' },
                        { key: 'completed',   label: 'Delivered' },
                      ].map((option) => {
                        const isActive =
                          ticket.status === option.key ||
                          (option.key === 'in_progress' && ticket.status === 'in-progress');
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => handleUpdateStatus(ticket.ticketId, option.key)}
                            disabled={updatingTicketId === ticket.ticketId}
                            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors flex items-center gap-2 ${
                              isActive
                                ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                                : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                            } ${
                              updatingTicketId === ticket.ticketId
                                ? 'opacity-70 cursor-wait'
                                : ''
                            }`}
                          >
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl">
                        <Upload className="w-5 h-5 text-indigo-600" />
                      </div>
                      Delivery Proof
                    </h4>
                    
                    <div className="mt-2 glass-card bg-white/80 backdrop-blur rounded-xl border border-gray-200 p-4 space-y-4">
                      {ticket.deliveryProof && ticket.deliveryProof.length > 0 ? (
                        <div>
                          <p className="text-sm text-green-700 font-semibold mb-3 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            {ticket.deliveryProof.length} file(s) uploaded
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {ticket.deliveryProof.map((file, idx) => (
                              <div
                                key={idx}
                                className="glass-card bg-gradient-to-br from-green-50 to-emerald-50 backdrop-blur p-3 rounded-xl border border-green-200 text-xs"
                              >
                                <p className="truncate font-semibold text-green-900">{file.originalname}</p>
                                <p className="text-green-600 mt-1">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No delivery proof uploaded yet
                        </p>
                      )}

                      <div className="pt-2 border-t border-dashed border-gray-200 mt-2 space-y-3">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Upload Photos/Documents
                          </label>
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-600 file:to-indigo-600 file:text-white hover:file:from-blue-700 hover:file:to-indigo-700 file:shadow-md file:cursor-pointer"
                          />
                          {uploadFiles.length > 0 && (
                            <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                              <Paperclip className="w-3 h-3" /> {uploadFiles.length} file(s) selected
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleUploadProof(ticket._id)}
                          disabled={uploading || uploadFiles.length === 0}
                          className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all text-sm"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{uploading ? 'Uploading...' : 'Upload Delivery Proof'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
                </div>
              </div>
            ) : (
              <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 p-12 text-center">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl inline-block mb-4">
                  <Package className="w-16 h-16 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Active Deliveries</h3>
                <p className="text-gray-600">All your assigned tickets have been completed.</p>
              </div>
            )
            ) : (
            /* Completed Tickets */
            tickets.filter(t => t.status === 'closed').length > 0 ? (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Completed Deliveries ({tickets.filter(t => t.status === 'closed').length})
                </h2>
                <div className="grid gap-6">
                  {tickets.filter(t => t.status === 'closed').map((ticket) => (
                    <div key={ticket._id} className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-gray-200 overflow-hidden opacity-75">
                      <div className="p-6">
                        {/* Ticket Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">#{ticket.ticketId}</span>
                              <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 text-green-800 text-xs font-semibold rounded-full shadow-sm">
                                Closed
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Completed: {new Date(ticket.updatedAt || ticket.dispatchedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Ticket Details */}
                        <div className="grid md:grid-cols-2 gap-4 p-5 glass-card bg-gradient-to-br from-gray-50/80 to-slate-50/80 backdrop-blur rounded-xl border border-gray-200">
                          <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              <Users className="w-4 h-4 text-blue-600" />
                              Contact Person
                            </p>
                            <p className="font-bold text-gray-900">{ticket.name || 'Anonymous'}</p>
                          </div>
                          <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-green-600" />
                              Location
                            </p>
                            <p className="text-sm text-gray-900">{ticket.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 p-12 text-center">
                <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl inline-block mb-4">
                  <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Completed Deliveries</h3>
                <p className="text-gray-600">Completed tickets will appear here.</p>
              </div>
            )
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatcherDashboard;

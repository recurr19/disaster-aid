import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, Clock, CheckCircle, Package, RefreshCw, Search, ArrowLeft } from 'lucide-react';
import API from '../api/axios';
import { AnimatedBackground } from '../components/common/AnimatedBackground';
import { Logo } from '../components/common/Logo';

const TrackSOS = () => {
  const [sosRequests, setSOSRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTicketId, setSearchTicketId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSOSRequests();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSOSRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSOSRequests = async () => {
    try {
      setLoading(true);
      const res = await API.get('/tracker/sos/public');
      if (res.data && res.data.success) {
        setSOSRequests(res.data.tickets || []);
      }
    } catch (err) {
      console.error('Error fetching SOS requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTicket = async (e) => {
    e.preventDefault();
    if (!searchTicketId.trim()) return;

    try {
      setSearchLoading(true);
      const res = await API.get(`/tracker/${searchTicketId.trim()}`);
      if (res.data && res.data.success) {
        setSearchResult(res.data.ticket);
      }
    } catch (err) {
      alert('Ticket not found or error occurred');
      setSearchResult(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Active' },
      matched: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Matched' },
      in_progress: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'In Progress' },
      fulfilled: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Fulfilled' },
      closed: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Closed' }
    };
    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground variant="mesh" />
      
      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md shadow-lg border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <Logo variant="default" onClick={() => navigate('/')} className="cursor-pointer" />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 rounded-lg shadow-md transition-all"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Track SOS Requests</h1>
          <p className="text-gray-600">Monitor active emergency requests in real-time</p>
        </div>

        {/* Search by Ticket ID */}
        <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Specific Ticket
          </h2>
          <form onSubmit={handleSearchTicket} className="flex gap-3">
            <input
              type="text"
              value={searchTicketId}
              onChange={(e) => setSearchTicketId(e.target.value)}
              placeholder="Enter Ticket ID (e.g., TKT-123456)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-pink-700 transition-all shadow-md disabled:opacity-50"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResult && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Ticket: {searchResult.ticketId}</h3>
                  {searchResult.isSOS && (
                    <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-red-600 rounded mt-1">
                      🚨 SOS
                    </span>
                  )}
                </div>
                {getStatusBadge(searchResult.status)}
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Help Types:</strong> {searchResult.helpTypes?.join(', ')}</p>
                <p><strong>Location:</strong> {searchResult.address || searchResult.landmark || 'N/A'}</p>
                <p><strong>Submitted:</strong> {formatDate(searchResult.createdAt)}</p>
                {searchResult.assignedTo && (
                  <p><strong>Assigned NGO:</strong> {searchResult.assignedTo.organizationName}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SOS List Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Active SOS Requests ({sosRequests.length})
          </h2>
          <button
            onClick={fetchSOSRequests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && sosRequests.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading SOS requests...</p>
          </div>
        )}

        {/* No SOS Requests */}
        {!loading && sosRequests.length === 0 && (
          <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 p-12 text-center">
            <div className="p-4 bg-green-100 rounded-full inline-block mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Active SOS Requests</h3>
            <p className="text-gray-600">All emergency requests have been handled. Great work!</p>
          </div>
        )}

        {/* SOS Requests Grid */}
        {sosRequests.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sosRequests.map((ticket) => (
              <div
                key={ticket.ticketId}
                className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 overflow-hidden hover:shadow-2xl transition-all"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-red-500 to-rose-600 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      SOS EMERGENCY
                    </span>
                    <span className="px-2 py-1 bg-white/20 backdrop-blur rounded text-xs font-mono">
                      {ticket.ticketId}
                    </span>
                  </div>
                  <p className="text-xs opacity-90">
                    Priority: {ticket.triageLevel?.toUpperCase() || 'HIGH'}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Help Needed:</p>
                    <div className="flex flex-wrap gap-1">
                      {ticket.helpTypes?.map((type, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Location:
                    </p>
                    <p className="text-sm text-gray-900">
                      {ticket.address || ticket.landmark || 'Location pending'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Submitted:
                    </p>
                    <p className="text-sm text-gray-900">{formatDate(ticket.createdAt)}</p>
                  </div>

                  {ticket.totalBeneficiaries > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">People affected:</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {ticket.totalBeneficiaries} people
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Status:</p>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(ticket.status)}
                      {ticket.assignedTo && (
                        <div className="flex items-center gap-1 text-xs text-green-700">
                          <Package className="w-3 h-3" />
                          <span>Assigned</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {ticket.assignedTo && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-800">
                        <strong>NGO:</strong> {ticket.assignedTo.organizationName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-12 py-6 text-center text-gray-600 text-sm">
        <p>DisasterAid - Emergency Response System</p>
        <p className="mt-2">Data updates every 30 seconds</p>
      </footer>
    </div>
  );
};

export default TrackSOS;

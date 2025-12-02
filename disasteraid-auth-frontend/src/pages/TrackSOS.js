import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../api/axios';
import { AnimatedBackground } from '../components/common/AnimatedBackground';
import { Logo } from '../components/common/Logo';
import RequestCard from '../components/common/RequestCard';

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
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-red-100 to-rose-100 rounded-full mb-4 shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
            Track SOS Requests
          </h1>
          <p className="text-gray-600 text-lg">Monitor active emergency requests in real-time</p>
        </motion.div>

        {/* Search by Ticket ID */}
        <motion.div 
          className="bg-white/90 backdrop-blur-lg supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Search Specific Ticket
          </h2>
          <form onSubmit={handleSearchTicket} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchTicketId}
              onChange={(e) => setSearchTicketId(e.target.value)}
              placeholder="Enter Ticket ID (e.g., DA-123456)"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-semibold rounded-xl hover:from-rose-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Search Result */}
          {searchResult && (
            <motion.div 
              className="mt-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <RequestCard 
                ticket={searchResult} 
                variant="detailed"
                actions={
                  <button
                    onClick={() => setSearchResult(null)}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Clear Search
                  </button>
                }
                showActions={true}
              />
            </motion.div>
          )}
        </motion.div>

        {/* SOS List Header */}
        <motion.div 
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span>
              Active SOS Requests 
              <span className="ml-2 px-3 py-1 text-lg font-bold text-red-700 bg-red-100 rounded-full">
                {sosRequests.length}
              </span>
            </span>
          </h2>
          <button
            onClick={fetchSOSRequests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white backdrop-blur-lg rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : 'text-gray-600'}`} />
            <span className="hidden sm:inline text-sm font-medium text-gray-700">Refresh</span>
          </button>
        </motion.div>

        {/* Loading State */}
        {loading && sosRequests.length === 0 && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-red-600 mx-auto mb-4"></div>
              <AlertTriangle className="w-6 h-6 text-red-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-600 text-lg font-medium">Loading SOS requests...</p>
          </motion.div>
        )}

        {/* No SOS Requests */}
        {!loading && sosRequests.length === 0 && (
          <motion.div 
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl border-2 border-green-200 p-12 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-full inline-block mb-4 shadow-lg">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Active SOS Requests</h3>
            <p className="text-gray-600 text-lg">All emergency requests have been handled. Great work!</p>
          </motion.div>
        )}

        {/* SOS Requests Grid */}
        {sosRequests.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sosRequests.map((ticket, index) => (
              <RequestCard
                key={ticket.ticketId}
                ticket={ticket}
                variant="compact"
                onClick={() => {
                  // Handle click - could open modal or navigate
                  console.log('Clicked ticket:', ticket.ticketId);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-12 py-6 text-center text-gray-600 text-sm bg-white/40 backdrop-blur-sm">
        <p className="font-semibold text-gray-800">DisasterAid - Emergency Response System</p>
        <p className="mt-2">Data updates every 30 seconds automatically</p>
      </footer>
    </div>
  );
};

export default TrackSOS;

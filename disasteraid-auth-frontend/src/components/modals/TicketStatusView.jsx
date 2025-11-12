import { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, Clock, CheckCircle2, User, Phone, MapPin, Users, Package, Heart, FileText, Battery, Wifi, Calendar, Truck, CheckCircle } from 'lucide-react';
import { getTrackerStatus } from '../../api/tracker';

const TicketStatusView = ({ ticket, onClose }) => {
  const [statusHistory, setStatusHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStatusHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTrackerStatus(ticket.ticketId);
      setStatusHistory(data);
    } catch (err) {
      console.error('Failed to load status history:', err);
      setError('Failed to load status updates');
    } finally {
      setLoading(false);
    }
  }, [ticket?.ticketId]);

  useEffect(() => {
    if (ticket?.ticketId) {
      loadStatusHistory();
    }
  }, [ticket?.ticketId, loadStatusHistory]);

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'active': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'matched': 'bg-blue-100 text-blue-800 border-blue-300',
      'in-progress': 'bg-purple-100 text-purple-800 border-purple-300',
      'completed': 'bg-green-100 text-green-800 border-green-300',
      'closed': 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />;
      case 'matched':
      case 'in-progress':
        return <AlertTriangle className="w-4 h-4" />;
      case 'completed':
      case 'closed':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getBatteryColor = (level) => {
    if (level >= 60) return 'text-green-600';
    if (level >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getNetworkColor = (strength) => {
    if (strength >= 60) return 'text-green-600';
    if (strength >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPeople = (ticket?.adults || 0) + (ticket?.children || 0) + (ticket?.elderly || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {ticket?.isSOS && <AlertTriangle className="w-6 h-6 text-red-600" />}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Ticket Details
              </h2>
              <p className="text-sm text-gray-500">ID: {ticket?.ticketId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Current Status */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white rounded-full p-2">
                  {getStatusIcon(ticket?.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Current Status</p>
                  <p className="text-xl font-bold text-gray-900 capitalize">{ticket?.status || 'Unknown'}</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full border text-sm font-semibold ${getStatusBadgeClass(ticket?.status)}`}>
                {ticket?.isSOS && '🚨 '}
                {ticket?.status?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Contact Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <User className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">{ticket?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{ticket?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm font-medium text-gray-900">{ticket?.address || 'N/A'}</p>
                  </div>
                  {ticket?.landmark && (
                    <div>
                      <p className="text-xs text-gray-500">Landmark</p>
                      <p className="text-sm font-medium text-gray-900">{ticket?.landmark}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> People Count
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{ticket?.adults || 0}</p>
                    <p className="text-xs text-gray-500">Adults</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{ticket?.children || 0}</p>
                    <p className="text-xs text-gray-500">Children</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{ticket?.elderly || 0}</p>
                    <p className="text-xs text-gray-500">Elderly</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="text-center">
                    <span className="text-sm text-gray-600">Total: </span>
                    <span className="text-lg font-bold text-gray-900">{totalPeople} {totalPeople === 1 ? 'Person' : 'People'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Help Needed
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ticket?.helpTypes?.length > 0 ? (
                    ticket.helpTypes.map((type, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {type}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No help types specified</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" /> Medical Needs
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ticket?.medicalNeeds?.length > 0 ? (
                    ticket.medicalNeeds.map((need, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                      >
                        {need}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No medical needs specified</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Description
                </h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {ticket?.description || 'No description provided'}
                </p>
              </div>

              {/* Device Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Device Status at Submission</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Battery className={`w-5 h-5 ${getBatteryColor(ticket?.batteryLevel)}`} />
                    <div>
                      <p className="text-xs text-gray-500">Battery</p>
                      <p className="text-sm font-semibold">{ticket?.batteryLevel || 0}%</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Wifi className={`w-5 h-5 ${getNetworkColor(ticket?.networkStrength)}`} />
                    <div>
                      <p className="text-xs text-gray-500">Network</p>
                      <p className="text-sm font-semibold">{ticket?.networkStrength || 0}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Created At
                </h3>
                <p className="text-sm text-gray-900">{ticket?.createdAt ? formatDate(ticket.createdAt) : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Status History */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Status History
            </h3>
            {loading ? (
              <p className="text-sm text-gray-500">Loading status updates...</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : statusHistory?.updates?.length > 0 ? (
              <div className="space-y-3">
                {statusHistory.updates.map((update, index) => (
                  <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-200 last:border-0">
                    <div className={`mt-1 rounded-full p-1 ${getStatusBadgeClass(update.status)}`}>
                      {getStatusIcon(update.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 capitalize">{update.status}</p>
                        <p className="text-xs text-gray-500">{formatDate(update.timestamp)}</p>
                      </div>
                      {update.note && (
                        <p className="text-sm text-gray-600 mt-1">{update.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No status updates available</p>
            )}
          </div>

          {ticket?.filesCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                📎 <strong>{ticket.deliveryProofCount || ticket.filesCount}</strong> file{(ticket.deliveryProofCount || ticket.filesCount) !== 1 ? 's' : ''} related to this ticket
              </p>
            </div>
          )}

          {/* NGO Assignment */}
          {ticket?.assignedTo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Assigned NGO
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-green-700">Organization</p>
                  <p className="text-sm font-semibold text-green-900">{ticket.assignedTo.name}</p>
                </div>
                {ticket.assignedTo.phone && (
                  <div>
                    <p className="text-xs text-green-700">Contact</p>
                    <p className="text-sm font-semibold text-green-900">{ticket.assignedTo.phone}</p>
                  </div>
                )}
                {ticket.assignedTo.location && (
                  <div>
                    <p className="text-xs text-green-700">Location</p>
                    <p className="text-sm font-semibold text-green-900">{ticket.assignedTo.location}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dispatcher Assignment */}
          {ticket?.isDispatched && ticket?.dispatchedTo && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Dispatched
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-purple-700">Dispatcher ID</p>
                  <p className="text-sm font-mono font-semibold text-purple-900">{ticket.dispatchedTo.dispatcherId}</p>
                </div>
                <div>
                  <p className="text-xs text-purple-700">Name</p>
                  <p className="text-sm font-semibold text-purple-900">{ticket.dispatchedTo.name}</p>
                </div>
                {ticket.dispatchedAt && (
                  <div>
                    <p className="text-xs text-purple-700">Dispatched At</p>
                    <p className="text-sm font-semibold text-purple-900">{formatDate(ticket.dispatchedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery Proof */}
          {ticket?.deliveryProofCount > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Delivery Proof
              </h3>
              <p className="text-sm text-emerald-800">
                ✅ <strong>{ticket.deliveryProofCount}</strong> proof file{ticket.deliveryProofCount !== 1 ? 's' : ''} uploaded by dispatcher
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={loadStatusHistory}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Status'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketStatusView;
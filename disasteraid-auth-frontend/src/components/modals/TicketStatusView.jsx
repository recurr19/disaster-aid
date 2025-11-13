import { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, Clock, User, Phone, MapPin, Users, Package, Heart, FileText, Battery, Wifi, Calendar, Truck, CheckCircle, Target, ClipboardList, Rocket, CheckSquare, Lock, ArrowRight, Paperclip } from 'lucide-react';
import { getTrackerStatus } from '../../api/tracker';
import { connectRealtime } from '../../api/realtime';
import DispatcherTrackingMap from '../maps/DispatcherTrackingMap';

const TicketStatusView = ({ ticket, onClose }) => {
  const [statusHistory, setStatusHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStatusHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTrackerStatus(ticket.ticketId);
      setStatusHistory(data);
    } catch (err) {
      console.error('Failed to load status history:', err);
      setStatusHistory(null);
    } finally {
      setLoading(false);
    }
  }, [ticket?.ticketId]);

  useEffect(() => {
    if (ticket?.ticketId) {
      loadStatusHistory();
    }
  }, [ticket?.ticketId, loadStatusHistory]);

  // Real-time status updates
  useEffect(() => {
    if (!ticket?.ticketId) return;
    
    const s = connectRealtime();
    const channel = `ticket:update:${ticket.ticketId}`;
    
    const handleStatusUpdate = (data) => {
      console.log('Real-time status update:', data);
      loadStatusHistory(); // Refresh status history when updates come in
    };
    
    s.on(channel, handleStatusUpdate);
    
    return () => {
      s.off(channel, handleStatusUpdate);
    };
  }, [ticket?.ticketId, loadStatusHistory]);

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'active': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'matched': 'bg-blue-100 text-blue-800 border-blue-300',
      'triaged': 'bg-purple-100 text-purple-800 border-purple-300',
      'in_progress': 'bg-orange-100 text-orange-800 border-orange-300',
      'fulfilled': 'bg-green-100 text-green-800 border-green-300',
      'closed': 'bg-gray-100 text-gray-800 border-gray-300',
      'completed': 'bg-green-100 text-green-800 border-green-300',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />;
      case 'matched':
        return <Target className="w-4 h-4" />;
      case 'triaged':
        return <ClipboardList className="w-4 h-4" />;
      case 'in_progress':
        return <Rocket className="w-4 h-4" />;
      case 'fulfilled':
        return <CheckSquare className="w-4 h-4" />;
      case 'closed':
      case 'completed':
        return <Lock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusWorkflowSteps = () => {
    return [
      { key: 'active', label: 'Request Created', icon: Clock, color: 'yellow' },
      { key: 'matched', label: 'NGO Assigned', icon: Target, color: 'blue' },
      { key: 'triaged', label: 'Triaged', icon: ClipboardList, color: 'purple' },
      { key: 'in_progress', label: 'In Progress', icon: Rocket, color: 'orange' },
      { key: 'fulfilled', label: 'Fulfilled', icon: CheckSquare, color: 'green' },
      { key: 'closed', label: 'Closed', icon: Lock, color: 'gray' }
    ];
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

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
                  <p className="text-xl font-bold text-gray-900">{formatStatus(ticket?.status)}</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 ${getStatusBadgeClass(ticket?.status)}`}>
                {ticket?.isSOS && <AlertTriangle className="w-4 h-4" />}
                {formatStatus(ticket?.status)}
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

          {/* Status Workflow Map */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" /> Assignment Progress Map
            </h3>
            
            {/* Workflow Steps */}
            <div className="mb-6">
              <div className="flex items-center justify-between relative">
                {getStatusWorkflowSteps().map((step, index) => {
                  const IconComponent = step.icon;
                  const isCompleted = statusHistory?.ticket?.status === step.key || 
                    (statusHistory?.ticket?.assignmentHistory || []).some(h => h.note?.toLowerCase().includes(step.key));
                  const isCurrent = ticket?.status === step.key;
                  
                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCurrent 
                          ? `bg-${step.color}-500 border-${step.color}-500 text-white shadow-lg scale-110`
                          : isCompleted 
                            ? `bg-${step.color}-100 border-${step.color}-400 text-${step.color}-700`
                            : 'bg-gray-100 border-gray-300 text-gray-400'
                      }`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="mt-2 text-center">
                        <p className={`text-xs font-medium ${
                          isCurrent ? `text-${step.color}-700 font-bold` : 
                          isCompleted ? `text-${step.color}-600` : 'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                      {index < getStatusWorkflowSteps().length - 1 && (
                        <ArrowRight className={`absolute top-5 left-16 w-4 h-4 ${
                          isCompleted ? 'text-blue-400' : 'text-gray-300'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Status Banner */}
            <div className={`p-4 rounded-lg border-2 ${getStatusBadgeClass(ticket?.status)} border-dashed`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-full p-2">
                    {getStatusIcon(ticket?.status)}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{formatStatus(ticket?.status)}</p>
                    <p className="text-sm opacity-80">Current Status</p>
                  </div>
                </div>
                {statusHistory?.ticket?.assignedTo && (
                  <div className="text-right">
                    <p className="font-semibold">{statusHistory.ticket.assignedTo.organizationName}</p>
                    <p className="text-sm opacity-80">Assigned NGO</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status History Timeline */}
            {statusHistory?.ticket?.assignmentHistory?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Detailed Timeline
                </h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {statusHistory.ticket.assignmentHistory.map((update, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className={`mt-0.5 rounded-full p-2 ${getStatusBadgeClass(ticket?.status)}`}>
                        <Clock className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{update.note || 'Status updated'}</p>
                          <p className="text-xs text-gray-500">{formatDate(update.assignedAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                <p className="text-sm text-blue-600 mt-2">Updating status...</p>
              </div>
            )}
          </div>

          {/* Live Dispatcher Tracking Map */}
          {(ticket?.status === 'in_progress' || ticket?.status === 'triaged' || ticket?.isDispatched) && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-600" /> Live Dispatcher Tracking
              </h3>
              <DispatcherTrackingMap ticket={ticket} statusHistory={statusHistory} />
            </div>
          )}

          {ticket?.filesCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <Paperclip className="w-4 h-4" /> <strong>{ticket.deliveryProofCount || ticket.filesCount}</strong> file{(ticket.deliveryProofCount || ticket.filesCount) !== 1 ? 's' : ''} related to this ticket
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
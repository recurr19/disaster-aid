import { motion } from 'framer-motion';
import { AlertTriangle, MapPin, Clock, Users, Package, Heart, Battery, Wifi, Calendar, CheckCircle, Target, ClipboardList, Rocket, CheckSquare, Lock } from 'lucide-react';

/**
 * RequestCard - Reusable component for displaying ticket/request information
 * Used in: SOS Tracker, Citizen Dashboard, NGO Dashboard
 */
const RequestCard = ({ 
  ticket, 
  onClick, 
  variant = 'default', // 'default' | 'compact' | 'detailed'
  showActions = false,
  actions = null,
  className = ''
}) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock,
        label: 'Active' 
      },
      matched: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: Target,
        label: 'Matched' 
      },
      triaged: {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: ClipboardList,
        label: 'Triaged'
      },
      in_progress: { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        icon: Rocket,
        label: 'In Progress' 
      },
      fulfilled: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckSquare,
        label: 'Fulfilled' 
      },
      completed: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle,
        label: 'Completed' 
      },
      closed: { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: Lock,
        label: 'Closed' 
      }
    };
    return statusConfig[status] || statusConfig.active;
  };

  const getTriageColor = (level) => {
    const colors = {
      critical: 'bg-red-600',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return colors[level] || colors.medium;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const statusInfo = getStatusBadge(ticket.status);
  const StatusIcon = statusInfo.icon;
  const totalBeneficiaries = ticket.totalBeneficiaries || 
    ((ticket.adults || 0) + (ticket.children || 0) + (ticket.elderly || 0));

  // Compact variant (for lists/grids)
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClick}
        className={`group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-200 hover:border-blue-300 ${className}`}
      >
        {/* Header with status */}
  <div className={`p-4 ${ticket.isSOS ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              {ticket.isSOS && <AlertTriangle className="w-4 h-4 animate-pulse" />}
              <span className="text-sm font-semibold">
                {ticket.isSOS ? 'SOS EMERGENCY' : 'Request'}
              </span>
            </div>
            <span className="px-2 py-1 bg-white/20 backdrop-blur rounded text-xs font-mono">
              {ticket.ticketId}
            </span>
          </div>
          {ticket.triageLevel && (
            <div className="mt-2 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getTriageColor(ticket.triageLevel)}`} />
              <span className="text-xs text-white/90">
                {ticket.triageLevel.toUpperCase()} PRIORITY
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${statusInfo.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{statusInfo.label}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(ticket.createdAt)}
            </div>
          </div>

          {/* Help Types */}
          {ticket.helpTypes && ticket.helpTypes.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-1.5">Help Needed:</p>
              <div className="flex flex-wrap gap-1">
                {ticket.helpTypes.slice(0, 4).map((type, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 rounded border border-rose-200"
                  >
                    {type}
                  </span>
                ))}
                {ticket.helpTypes.length > 4 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                    +{ticket.helpTypes.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {(ticket.address || ticket.landmark) && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 line-clamp-2">
                {ticket.address || ticket.landmark}
              </p>
            </div>
          )}

          {/* Beneficiaries */}
          {totalBeneficiaries > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">
                {totalBeneficiaries} {totalBeneficiaries === 1 ? 'person' : 'people'}
              </span>
            </div>
          )}

          {/* Assigned NGO */}
          {ticket.assignedTo && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <Package className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">
                Assigned to: <span className="font-semibold text-green-700">
                  {ticket.assignedTo.organizationName || 'NGO'}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && actions && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            {actions}
          </div>
        )}
      </motion.div>
    );
  }

  // Detailed variant (for detailed views)
  if (variant === 'detailed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 ${className}`}
      >
        {/* Hero Header */}
  <div className={`p-6 ${ticket.isSOS ? 'bg-gradient-to-br from-red-600 via-rose-600 to-red-700' : 'bg-gradient-to-br from-rose-600 via-red-600 to-rose-700'}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {ticket.isSOS && (
                <div className="bg-white/20 backdrop-blur p-3 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {ticket.isSOS ? '🚨 EMERGENCY REQUEST' : 'Assistance Request'}
                </h3>
                <p className="text-white/80 text-sm font-mono">{ticket.ticketId}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg border-2 ${statusInfo.color} bg-white`}>
              <div className="flex items-center gap-2">
                <StatusIcon className="w-5 h-5" />
                <span className="font-semibold">{statusInfo.label}</span>
              </div>
            </div>
          </div>

          {/* Priority and Time */}
          <div className="flex items-center gap-4 text-white/90">
            {ticket.triageLevel && (
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getTriageColor(ticket.triageLevel)} shadow-lg`} />
                <span className="text-sm font-semibold">{ticket.triageLevel.toUpperCase()} PRIORITY</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-6 space-y-6">
          {/* Help Types Section */}
          {ticket.helpTypes && ticket.helpTypes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Required Assistance
              </h4>
              <div className="flex flex-wrap gap-2">
                {ticket.helpTypes.map((type, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 rounded-lg border border-rose-200"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location & People Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {(ticket.address || ticket.landmark) && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Location</p>
                    <p className="text-sm text-gray-900">{ticket.address || ticket.landmark}</p>
                  </div>
                </div>
              </div>
            )}

            {totalBeneficiaries > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Beneficiaries</p>
                    <p className="text-sm text-gray-900">
                      {totalBeneficiaries} {totalBeneficiaries === 1 ? 'person' : 'people'}
                    </p>
                    {(ticket.adults > 0 || ticket.children > 0 || ticket.elderly > 0) && (
                      <p className="text-xs text-gray-600 mt-1">
                        {ticket.adults > 0 && `${ticket.adults} adults`}
                        {ticket.children > 0 && ` • ${ticket.children} children`}
                        {ticket.elderly > 0 && ` • ${ticket.elderly} elderly`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {ticket.description && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Description
              </h4>
              <p className="text-sm text-amber-900 leading-relaxed">{ticket.description}</p>
            </div>
          )}

          {/* Device Status (if available) */}
          {(ticket.batteryLevel || ticket.networkStrength) && (
            <div className="grid grid-cols-2 gap-3">
              {ticket.batteryLevel !== undefined && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <Battery className={`w-4 h-4 ${ticket.batteryLevel < 20 ? 'text-red-600' : 'text-green-600'}`} />
                  <span className="text-sm text-gray-700">Battery: {ticket.batteryLevel}%</span>
                </div>
              )}
              {ticket.networkStrength !== undefined && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <Wifi className={`w-4 h-4 ${ticket.networkStrength < 30 ? 'text-red-600' : 'text-green-600'}`} />
                  <span className="text-sm text-gray-700">Network: {ticket.networkStrength}%</span>
                </div>
              )}
            </div>
          )}

          {/* Assigned NGO */}
          {ticket.assignedTo && (
            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 p-2.5 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-0.5">Assigned Organization</p>
                  <p className="text-base font-bold text-green-900">
                    {ticket.assignedTo.organizationName || 'Relief Organization'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && actions && (
            <div className="pt-4 border-t border-gray-200">
              {actions}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-200 hover:border-blue-300 ${className}`}
    >
      {/* Card content similar to compact but with more spacing */}
  <div className={`p-5 ${ticket.isSOS ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
        <div className="flex items-center justify-between text-white mb-2">
          <div className="flex items-center gap-2">
            {ticket.isSOS && <AlertTriangle className="w-5 h-5 animate-pulse" />}
            <span className="text-sm font-semibold">
              {ticket.isSOS ? 'SOS EMERGENCY' : 'Assistance Request'}
            </span>
          </div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-lg text-xs font-mono">
            {ticket.ticketId}
          </span>
        </div>
        {ticket.triageLevel && (
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${getTriageColor(ticket.triageLevel)}`} />
            <span className="text-xs text-white/90 font-medium">
              {ticket.triageLevel.toUpperCase()} PRIORITY
            </span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${statusInfo.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span>{statusInfo.label}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {formatDate(ticket.createdAt)}
          </div>
        </div>

        {ticket.helpTypes && ticket.helpTypes.length > 0 && (
          <div>
            <p className="text-xs text-gray-600 mb-2">Required Help:</p>
            <div className="flex flex-wrap gap-1.5">
              {ticket.helpTypes.slice(0, 5).map((type, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-700 rounded-md border border-rose-200"
                >
                  {type}
                </span>
              ))}
              {ticket.helpTypes.length > 5 && (
                <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">
                  +{ticket.helpTypes.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {(ticket.address || ticket.landmark) && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
            <p className="text-sm text-gray-700 line-clamp-2">
              {ticket.address || ticket.landmark}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {totalBeneficiaries > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">
                {totalBeneficiaries} {totalBeneficiaries === 1 ? 'person' : 'people'}
              </span>
            </div>
          )}
          
          {ticket.assignedTo && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-semibold">
                {ticket.assignedTo.organizationName}
              </span>
            </div>
          )}
        </div>

        {showActions && actions && (
          <div className="pt-3 border-t border-gray-100">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RequestCard;

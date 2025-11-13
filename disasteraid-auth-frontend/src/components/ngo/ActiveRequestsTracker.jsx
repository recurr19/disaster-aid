import { Truck, MapPin, Send, ClipboardList, Rocket, CheckSquare, Lock, Target, FileText, Package, Clock, Settings } from "lucide-react";
import { useState } from "react";
import "./ActiveRequestsTracker.css";

export default function ActiveRequestsTracker({ requests, onStatusUpdate, onDispatch, dispatchers }) {
  const [expanded, setExpanded] = useState(null);

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'matched': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'triaged': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'fulfilled': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'matched': return <Target className="w-3 h-3" />;
      case 'triaged': return <ClipboardList className="w-3 h-3" />;
      case 'in_progress': return <Rocket className="w-3 h-3" />;
      case 'fulfilled': return <CheckSquare className="w-3 h-3" />;
      case 'closed': return <Lock className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  if (requests.length === 0) {
    return (
      <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 text-center p-12">
        <div className="p-4 bg-gradient-to-br from-gray-100 to-slate-100 rounded-2xl inline-block mb-4">
          <MapPin className="w-12 h-12 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">No Active Assignments</p>
        <p className="text-sm text-gray-500 mt-2">Accepted assignments will appear here for tracking</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <div key={r.id} className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 p-6 cursor-pointer hover:shadow-2xl transition-all" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{r.citizenName}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                {r.helpType}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full text-xs font-bold border-2 flex items-center gap-2 ${getStatusColor(r.status || 'matched')}`}>
              {getStatusIcon(r.status || 'matched')}
              {formatStatus(r.status || 'matched')}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white/60 backdrop-blur p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location
              </p>
              <p className="text-sm font-medium text-gray-900">{r.location}</p>
            </div>
            {r.acceptedAt && (
              <div className="bg-white/60 backdrop-blur p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Accepted At
                </p>
                <p className="text-sm font-medium text-gray-900">{r.acceptedAt}</p>
              </div>
            )}
          </div>
          
          {r.isDispatched && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 font-semibold">
                <Truck className="w-4 h-4" />
                Dispatched to Field Team
              </div>
            </div>
          )}

          {expanded === r.id && (
            <div className="mt-6 space-y-4 border-t border-gray-200 pt-4" onClick={(e) => e.stopPropagation()}>
              {!r.isDispatched && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200">
                  <h4 className="text-sm font-bold mb-3 text-indigo-900 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Assign to Field Dispatcher
                  </h4>
                  {dispatchers && dispatchers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dispatchers.map((dispatcher) => (
                        <button
                          key={dispatcher._id}
                          className="px-4 py-3 text-sm font-medium rounded-lg border-2 border-indigo-200 bg-white/80 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDispatch(r.ticketObjectId || r.id, dispatcher._id);
                          }}
                        >
                          <Send className="w-4 h-4" />
                          {dispatcher.name.split(' - ')[1] || dispatcher.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 font-medium">No dispatchers available</p>
                      <p className="text-xs text-yellow-600 mt-1">Add dispatchers in the "Dispatchers" tab</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-bold mb-4 text-gray-900 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Update Assignment Status
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    className="px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2" 
                    onClick={(e) => { e.stopPropagation(); onStatusUpdate(r.id, "triaged", "Assignment triaged and reviewed"); }}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Triaged
                  </button>
                  <button 
                    className="px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2" 
                    onClick={(e) => { e.stopPropagation(); onStatusUpdate(r.id, "in_progress", "Team dispatched to location"); }}
                  >
                    <Rocket className="w-4 h-4" />
                    In Progress
                  </button>
                  <button 
                    className="px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2" 
                    onClick={(e) => { e.stopPropagation(); onStatusUpdate(r.id, "fulfilled", "Aid delivered successfully"); }}
                  >
                    <CheckSquare className="w-4 h-4" />
                    Fulfilled
                  </button>
                  <button 
                    className="px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 shadow-sm hover:shadow-md flex items-center justify-center gap-2" 
                    onClick={(e) => { e.stopPropagation(); onStatusUpdate(r.id, "closed", "Assignment completed and closed"); }}
                  >
                    <Lock className="w-4 h-4" />
                    Closed
                  </button>
                </div>
                <div className="mt-4 p-3 bg-white/80 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 flex items-center gap-2">
                    <Target className="w-3 h-3" />
                    Current Status: <span className="font-bold text-gray-900">{formatStatus(r.status || 'matched')}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

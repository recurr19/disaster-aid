import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Request } from '../types';
import { AlertTriangle, MapPin, Users, Phone, Clock, Tag } from 'lucide-react';

export default function SOSQueue() {
  const [sosRequests, setSOSRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  useEffect(() => {
    loadSOSRequests();

    const channel = supabase
      .channel('sos-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, loadSOSRequests)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSOSRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('is_sos', true)
        .in('status', ['new', 'triaged'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSOSRequests(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading SOS requests:', error);
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    await supabase
      .from('requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    await supabase.from('activity_logs').insert({
      action_type: 'status_update',
      entity_type: 'request',
      entity_id: requestId,
      performed_by: 'Authority Control',
      details: { old_status: selectedRequest?.status, new_status: newStatus },
    });

    loadSOSRequests();
    setSelectedRequest(null);
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTimeElapsed = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SoS Priority Queue</h2>
          <p className="text-sm text-gray-600 mt-1">
            {sosRequests.length} urgent request{sosRequests.length !== 1 ? 's' : ''} requiring immediate attention
          </p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-sm font-semibold text-red-700">High Priority</span>
        </div>
      </div>

      {sosRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active SoS Requests</h3>
          <p className="text-gray-600">All urgent requests have been addressed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sosRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow-sm border-2 border-red-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getPriorityBadgeColor(request.priority_level)}`}>
                      {request.priority_level}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold uppercase">
                      {request.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {getTimeElapsed(request.created_at)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{request.reporter_name}</p>
                      <p className="text-xs text-gray-600">
                        {request.num_adults + request.num_children + request.num_elderly} people affected
                        {request.special_needs && ` • ${request.special_needs}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-900">{request.location_address}</p>
                      {request.location_landmark && (
                        <p className="text-xs text-gray-600">Near {request.location_landmark}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {request.need_categories.map((category) => (
                        <span key={category} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-sm text-gray-900">{request.reporter_contact}</p>
                  </div>

                  {request.sos_keywords && request.sos_keywords.length > 0 && (
                    <div className="pt-3 border-t border-red-100">
                      <p className="text-xs font-semibold text-red-700 mb-1">SoS Triggers:</p>
                      <div className="flex flex-wrap gap-1">
                        {request.sos_keywords.map((keyword, idx) => (
                          <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">SoS Request Details</h3>
                  <p className="text-sm text-gray-600 mt-1">ID: {selectedRequest.id.slice(0, 8)}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Reporter</label>
                <p className="text-gray-900">{selectedRequest.reporter_name}</p>
                <p className="text-sm text-gray-600">{selectedRequest.reporter_contact}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Location</label>
                <p className="text-gray-900">{selectedRequest.location_address}</p>
                {selectedRequest.location_landmark && (
                  <p className="text-sm text-gray-600">Landmark: {selectedRequest.location_landmark}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Beneficiaries</label>
                <p className="text-gray-900">
                  Adults: {selectedRequest.num_adults} • Children: {selectedRequest.num_children} • Elderly: {selectedRequest.num_elderly}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Needs</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedRequest.need_categories.map((category) => (
                    <span key={category} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Additional Notes</label>
                  <p className="text-gray-900">{selectedRequest.notes}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => updateRequestStatus(selectedRequest.id, 'triaged')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Mark as Triaged
                </button>
                <button
                  onClick={() => updateRequestStatus(selectedRequest.id, 'assigned')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Assign Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

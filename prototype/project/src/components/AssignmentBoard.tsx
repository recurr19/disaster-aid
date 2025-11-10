import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Assignment, Request, Offer } from '../types';
import { Clock, CheckCircle, Navigation, User, Package } from 'lucide-react';

interface AssignmentWithDetails extends Assignment {
  request?: Request;
  offer?: Offer;
}

export default function AssignmentBoard() {
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadAssignments();

    const channel = supabase
      .channel('assignments-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, loadAssignments)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const loadAssignments = async () => {
    try {
      let query = supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: assignmentsData, error } = await query;
      if (error) throw error;

      const assignmentsWithDetails = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          const [requestRes, offerRes] = await Promise.all([
            supabase.from('requests').select('*').eq('id', assignment.request_id).maybeSingle(),
            supabase.from('offers').select('*').eq('id', assignment.offer_id).maybeSingle(),
          ]);

          return {
            ...assignment,
            request: requestRes.data || undefined,
            offer: offerRes.data || undefined,
          };
        })
      );

      setAssignments(assignmentsWithDetails);
      setLoading(false);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, newStatus: string) => {
    const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    await supabase.from('assignments').update(updates).eq('id', assignmentId);
    loadAssignments();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'en_route': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'arrived': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Assignments' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'en_route', label: 'En Route' },
    { value: 'arrived', label: 'Arrived' },
    { value: 'completed', label: 'Completed' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assignment Tracking Board</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor all request-to-offer assignments and their progress
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Found</h3>
          <p className="text-gray-600">Assignments will appear here once created</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(assignment.status)}`}>
                    {assignment.status.replace('_', ' ')}
                  </span>
                  {assignment.eta_minutes && assignment.status !== 'completed' && (
                    <span className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      ETA: {assignment.eta_minutes}min
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(assignment.created_at).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Request Details
                  </h4>
                  {assignment.request ? (
                    <div className="pl-6 space-y-1">
                      <p className="text-sm text-gray-900 font-medium">{assignment.request.reporter_name}</p>
                      <p className="text-sm text-gray-600">{assignment.request.location_address}</p>
                      <p className="text-sm text-gray-600">
                        {assignment.request.num_adults + assignment.request.num_children + assignment.request.num_elderly} people
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {assignment.request.need_categories.map((cat) => (
                          <span key={cat} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 pl-6">Request details unavailable</p>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Assigned Provider
                  </h4>
                  {assignment.offer ? (
                    <div className="pl-6 space-y-1">
                      <p className="text-sm text-gray-900 font-medium">{assignment.offer.organization_name}</p>
                      <p className="text-sm text-gray-600">{assignment.offer.contact_person}</p>
                      <p className="text-sm text-gray-600">{assignment.offer.contact_number}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {assignment.offer.categories.map((cat) => (
                          <span key={cat} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 pl-6">Offer details unavailable</p>
                  )}
                </div>
              </div>

              {assignment.team_notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600"><span className="font-semibold">Notes:</span> {assignment.team_notes}</p>
                </div>
              )}

              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                {assignment.status === 'assigned' && (
                  <button
                    onClick={() => updateAssignmentStatus(assignment.id, 'en_route')}
                    className="flex items-center px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm font-medium"
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Mark En Route
                  </button>
                )}
                {assignment.status === 'en_route' && (
                  <button
                    onClick={() => updateAssignmentStatus(assignment.id, 'arrived')}
                    className="flex items-center px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark Arrived
                  </button>
                )}
                {assignment.status === 'arrived' && (
                  <button
                    onClick={() => updateAssignmentStatus(assignment.id, 'completed')}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

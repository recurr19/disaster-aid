import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthorityTeam } from '../types';
import { Users, MapPin, Phone, Shield, Clock, AlertCircle } from 'lucide-react';

export default function ResourceAllocation() {
  const [teams, setTeams] = useState<AuthorityTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<AuthorityTeam | null>(null);

  useEffect(() => {
    loadTeams();

    const channel = supabase
      .channel('resource-allocation')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'authority_teams' }, loadTeams)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('authority_teams')
        .select('*')
        .order('team_name');

      if (error) throw error;
      setTeams(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading teams:', error);
      setLoading(false);
    }
  };

  const updateTeamStatus = async (teamId: string, newStatus: string) => {
    await supabase
      .from('authority_teams')
      .update({ status: newStatus })
      .eq('id', teamId);

    await supabase.from('activity_logs').insert({
      action_type: 'team_status_update',
      entity_type: 'authority_team',
      entity_id: teamId,
      performed_by: 'Authority Control',
      details: { new_status: newStatus },
    });

    loadTeams();
    setSelectedTeam(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700 border-green-300';
      case 'deployed': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'offline': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTeamTypeColor = (type: string) => {
    switch (type) {
      case 'rescue': return 'bg-red-100 text-red-700';
      case 'medical': return 'bg-purple-100 text-purple-700';
      case 'distribution': return 'bg-blue-100 text-blue-700';
      case 'transport': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const availableTeams = teams.filter(t => t.status === 'available');
  const deployedTeams = teams.filter(t => t.status === 'deployed');
  const offlineTeams = teams.filter(t => t.status === 'offline');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Resource Allocation & Team Deployment</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage and deploy authority teams across different zones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Available Teams</p>
              <p className="text-3xl font-bold text-gray-900">{availableTeams.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Deployed Teams</p>
              <p className="text-3xl font-bold text-gray-900">{deployedTeams.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Offline Teams</p>
              <p className="text-3xl font-bold text-gray-900">{offlineTeams.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.length === 0 ? (
          <div className="col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Teams Available</h3>
            <p className="text-gray-600">Authority teams will appear here</p>
          </div>
        ) : (
          teams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedTeam(team)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{team.team_name}</h3>
                    <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${getTeamTypeColor(team.team_type)}`}>
                      {team.team_type}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getStatusColor(team.status)}`}>
                  {team.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{team.team_size} members</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{team.assigned_zone}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{team.contact_number}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(team.shift_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(team.shift_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {team.capabilities && team.capabilities.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Capabilities</p>
                    <div className="flex flex-wrap gap-1">
                      {team.capabilities.map((capability) => (
                        <span key={capability} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTeam.team_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">Update team deployment status</p>
                </div>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Current Status</label>
                <p className="text-gray-900 capitalize">{selectedTeam.status}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Team Details</label>
                <p className="text-gray-900">
                  {selectedTeam.team_size} members • {selectedTeam.team_type}
                </p>
                <p className="text-sm text-gray-600">{selectedTeam.assigned_zone}</p>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-2">
                <label className="text-sm font-semibold text-gray-700 block mb-3">Change Status</label>

                {selectedTeam.status !== 'available' && (
                  <button
                    onClick={() => updateTeamStatus(selectedTeam.id, 'available')}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-left flex items-center justify-between"
                  >
                    <span>Mark as Available</span>
                    <Shield className="w-5 h-5" />
                  </button>
                )}

                {selectedTeam.status !== 'deployed' && (
                  <button
                    onClick={() => updateTeamStatus(selectedTeam.id, 'deployed')}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-left flex items-center justify-between"
                  >
                    <span>Deploy Team</span>
                    <Users className="w-5 h-5" />
                  </button>
                )}

                {selectedTeam.status !== 'offline' && (
                  <button
                    onClick={() => updateTeamStatus(selectedTeam.id, 'offline')}
                    className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium text-left flex items-center justify-between"
                  >
                    <span>Mark as Offline</span>
                    <AlertCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

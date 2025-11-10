import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CrisisMetrics, CrisisAlert } from '../types';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Users, MapPin, Package } from 'lucide-react';

export default function CrisisOverview() {
  const [metrics, setMetrics] = useState<CrisisMetrics | null>(null);
  const [alerts, setAlerts] = useState<CrisisAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('crisis-overview')
      .on('postgres_changes', { event: '*', schema: 'public' }, loadData)
      .subscribe();

    const interval = setInterval(loadData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      const [requestsRes, assignmentsRes, sheltersRes, teamsRes, alertsRes] = await Promise.all([
        supabase.from('requests').select('*'),
        supabase.from('assignments').select('*').eq('status', 'assigned'),
        supabase.from('shelters').select('*'),
        supabase.from('authority_teams').select('*').eq('status', 'available'),
        supabase.from('crisis_alerts').select('*').eq('is_acknowledged', false).order('created_at', { ascending: false }).limit(5),
      ]);

      const requests = requestsRes.data || [];
      const assignments = assignmentsRes.data || [];
      const shelters = sheltersRes.data || [];
      const teams = teamsRes.data || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const unmetRequests = requests.filter(r => r.status === 'new' || r.status === 'triaged');
      const sosRequests = requests.filter(r => r.is_sos && (r.status === 'new' || r.status === 'triaged'));
      const fulfilledToday = requests.filter(r => {
        if (r.status !== 'fulfilled') return false;
        const updatedDate = new Date(r.updated_at);
        return updatedDate >= today;
      });

      const categoryBreakdown: Record<string, number> = {};
      unmetRequests.forEach(req => {
        req.need_categories.forEach((cat: string) => {
          categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
        });
      });

      const totalCapacity = shelters.reduce((sum, s) => sum + s.total_capacity, 0);
      const totalOccupancy = shelters.reduce((sum, s) => sum + s.current_occupancy, 0);
      const shelterOccupancyPercent = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

      setMetrics({
        totalRequests: requests.length,
        unmetRequests: unmetRequests.length,
        sosRequests: sosRequests.length,
        activeAssignments: assignments.length,
        fulfilledToday: fulfilledToday.length,
        shelterOccupancy: Math.round(shelterOccupancyPercent),
        availableTeams: teams.length,
        categoryBreakdown,
        zoneBreakdown: {},
      });

      setAlerts(alertsRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading crisis overview:', error);
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    await supabase
      .from('crisis_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_by: 'Authority Control',
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests"
          value={metrics?.totalRequests || 0}
          icon={Users}
          color="blue"
          subtitle={`${metrics?.unmetRequests || 0} unmet`}
        />
        <MetricCard
          title="SoS Urgent"
          value={metrics?.sosRequests || 0}
          icon={AlertCircle}
          color="red"
          subtitle="Requires immediate action"
          trend={metrics?.sosRequests && metrics.sosRequests > 10 ? 'up' : undefined}
        />
        <MetricCard
          title="Active Assignments"
          value={metrics?.activeAssignments || 0}
          icon={Clock}
          color="orange"
          subtitle="In progress"
        />
        <MetricCard
          title="Fulfilled Today"
          value={metrics?.fulfilledToday || 0}
          icon={CheckCircle}
          color="green"
          subtitle="Completed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Shelter Occupancy"
          value={`${metrics?.shelterOccupancy || 0}%`}
          icon={MapPin}
          color="purple"
          subtitle={metrics?.shelterOccupancy && metrics.shelterOccupancy > 80 ? 'Near capacity' : 'Available'}
        />
        <MetricCard
          title="Available Teams"
          value={metrics?.availableTeams || 0}
          icon={Users}
          color="teal"
          subtitle="Ready to deploy"
        />
        <MetricCard
          title="Unmet Requests"
          value={metrics?.unmetRequests || 0}
          icon={Package}
          color="gray"
          subtitle="Awaiting assignment"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Categories Breakdown</h3>
          <div className="space-y-3">
            {metrics?.categoryBreakdown && Object.entries(metrics.categoryBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${(count / (metrics?.unmetRequests || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
            <span className="text-xs text-gray-500">{alerts.length} unacknowledged</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No active alerts</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-500'
                      : alert.severity === 'warning'
                      ? 'bg-orange-50 border-orange-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`text-xs font-semibold uppercase ${
                            alert.severity === 'critical'
                              ? 'text-red-700'
                              : alert.severity === 'warning'
                              ? 'text-orange-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        {alert.zone && (
                          <span className="text-xs text-gray-500">Zone: {alert.zone}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 font-medium mb-1">{alert.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="ml-3 px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  trend?: 'up' | 'down';
}

function MetricCard({ title, value, icon: Icon, color, subtitle, trend }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    teal: 'bg-teal-100 text-teal-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`text-sm ${trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

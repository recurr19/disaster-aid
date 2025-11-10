import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import CrisisOverview from './CrisisOverview';
import SOSQueue from './SOSQueue';
import AssignmentBoard from './AssignmentBoard';
import ShelterManagement from './ShelterManagement';
import ResourceAllocation from './ResourceAllocation';
import AutomatedBriefs from './AutomatedBriefs';
import { AlertTriangle, Activity, Users, Building2, TrendingUp, FileText } from 'lucide-react';

type TabType = 'overview' | 'sos' | 'assignments' | 'shelters' | 'resources' | 'briefs';

export default function AuthorityDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [criticalAlertsCount, setCriticalAlertsCount] = useState(0);
  const [sosCount, setSOSCount] = useState(0);

  useEffect(() => {
    loadCriticalCounts();

    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crisis_alerts' }, loadCriticalCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, loadCriticalCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCriticalCounts = async () => {
    const { data: alerts } = await supabase
      .from('crisis_alerts')
      .select('id')
      .eq('severity', 'critical')
      .eq('is_acknowledged', false);

    const { data: sosRequests } = await supabase
      .from('requests')
      .select('id')
      .eq('is_sos', true)
      .in('status', ['new', 'triaged']);

    setCriticalAlertsCount(alerts?.length || 0);
    setSOSCount(sosRequests?.length || 0);
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Crisis Overview', icon: Activity },
    { id: 'sos' as TabType, label: 'SoS Queue', icon: AlertTriangle, badge: sosCount },
    { id: 'assignments' as TabType, label: 'Assignments', icon: Users },
    { id: 'shelters' as TabType, label: 'Shelters & Supplies', icon: Building2 },
    { id: 'resources' as TabType, label: 'Resource Allocation', icon: TrendingUp },
    { id: 'briefs' as TabType, label: 'Automated Briefs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DisasterAid Authority Control</h1>
                <p className="text-xs text-gray-500">Crisis Relief Coordination Platform</p>
              </div>
            </div>

            {criticalAlertsCount > 0 && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-semibold text-red-700">
                  {criticalAlertsCount} Critical Alert{criticalAlertsCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && <CrisisOverview />}
        {activeTab === 'sos' && <SOSQueue />}
        {activeTab === 'assignments' && <AssignmentBoard />}
        {activeTab === 'shelters' && <ShelterManagement />}
        {activeTab === 'resources' && <ResourceAllocation />}
        {activeTab === 'briefs' && <AutomatedBriefs />}
      </main>
    </div>
  );
}

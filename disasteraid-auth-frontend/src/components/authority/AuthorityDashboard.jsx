import React, { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Users, Building2, TrendingUp, FileText, LogOut } from 'lucide-react';
import CrisisOverview from './CrisisOverview';
import SOSQueue from './SOSQueue';
import AssignmentBoard from './AssignmentBoard';
import ShelterManagement from './ShelterManagement';
import ResourceAllocation from './ResourceAllocation';
import AutomatedBriefs from './AutomatedBriefs';
import Heatmap from './Heatmap';
import './authority.css';

const TABS = [
  { id: 'overview', label: 'Crisis Overview', icon: Activity },
  { id: 'sos', label: 'SoS Queue', icon: AlertTriangle },
  { id: 'assignments', label: 'Assignments', icon: Users },
  { id: 'shelters', label: 'Shelters & Supplies', icon: Building2 },
  { id: 'resources', label: 'Resource Allocation', icon: TrendingUp },
  { id: 'heatmap', label: 'Heatmap', icon: Activity },
  { id: 'briefs', label: 'Automated Briefs', icon: FileText },
];

const AuthorityDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [criticalAlertsCount, setCriticalAlertsCount] = useState(0);
  const [sosCount, setSOSCount] = useState(0);

  // No DB fetch for now. Use static/demo values to mimic prototype counts.
  useEffect(() => {
    setCriticalAlertsCount(2);
    setSOSCount(5);
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  return (
    <div className="container-main">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DisasterAid</h1>
              <p className="text-sm text-gray-500">Crisis Relief Platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 rounded-full bg-green-600"></div>
              <span className="text-sm font-medium">Online</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="nav-bar">
        <div className="nav-inner">
          <div className="tabs-scroll">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const badge = tab.id === 'sos' ? sosCount : undefined;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-button ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && <CrisisOverview />}
        {activeTab === 'sos' && <SOSQueue />}
        {activeTab === 'assignments' && <AssignmentBoard />}
        {activeTab === 'shelters' && <ShelterManagement />}
        {activeTab === 'resources' && <ResourceAllocation />}
  {activeTab === 'heatmap' && <Heatmap />}
        {activeTab === 'briefs' && <AutomatedBriefs />}
      </main>
    </div>
  );
};

export default AuthorityDashboard;

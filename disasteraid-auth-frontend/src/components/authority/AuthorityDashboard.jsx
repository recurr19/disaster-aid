import React, { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Users, Building2, TrendingUp, FileText, LogOut } from 'lucide-react';
import CrisisOverview from './CrisisOverview';
import SOSQueue from './SOSQueue';
import AssignmentBoard from './AssignmentsList';
import ShelterManagement from './ShelterManagement';
import ResourceAllocation from './ResourceAllocation';
import AutomatedBriefs from './AutomatedBriefs';
import Heatmap from './Heatmap';
import './authority.css';
import API from '../../api/axios';

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
  const [sosCount, setSOSCount] = useState(0);
  const [mapData, setMapData] = useState(null);
  const [heatPoints, setHeatPoints] = useState([]);
  const [loadingMap, setLoadingMap] = useState(false);

  // Fetch map data from backend (tickets + overlays)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingMap(true);
        const res = await API.get('/authority/map');
        if (!active) return;
        if (res.data?.success) {
          const ticketsFC = res.data.tickets || { type: 'FeatureCollection', features: [] };
          const overlays = res.data.overlays || {};
          setMapData({ tickets: ticketsFC, overlays });
          const points = (ticketsFC.features || []).map(f => {
            const coords = f.geometry?.coordinates;
            if (!coords || coords.length < 2) return null;
            const [lng, lat] = coords;
            return { lat, lng, intensity: f.properties?.isSOS ? 0.95 : 0.4, props: f.properties };
          }).filter(Boolean);
          setHeatPoints(points);
          setSOSCount((ticketsFC.features || []).filter(f => f.properties?.isSOS).length);
        }
      } catch (e) {
        console.error('AuthorityDashboard: map load failed', e);
      } finally {
        active && setLoadingMap(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // No DB fetch for now. Use static/demo values to mimic prototype counts.
  useEffect(() => {
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
        {activeTab === 'overview' && <CrisisOverview mapData={mapData} loading={loadingMap} />}
        {activeTab === 'sos' && <SOSQueue tickets={(mapData && mapData.tickets) ? mapData.tickets : null} />}
        {activeTab === 'assignments' && <AssignmentBoard onAssigned={() => {
          // refresh map data after an assignment is made
          (async () => {
            try {
              const res = await API.get('/authority/map');
              if (res.data && res.data.success) {
                const ticketsFC = res.data.tickets || { type: 'FeatureCollection', features: [] };
                const overlays = res.data.overlays || {};
                setMapData({ tickets: ticketsFC, overlays });

                const points = (ticketsFC.features || []).map(f => {
                  const coords = f.geometry && f.geometry.coordinates;
                  if (!coords || coords.length < 2) return null;
                  const lng = coords[0];
                  const lat = coords[1];
                  const intensity = f.properties && f.properties.isSOS ? 0.95 : 0.4;
                  return { lat, lng, intensity, props: f.properties };
                }).filter(Boolean);
                setHeatPoints(points);

                const sosCountLocal = (ticketsFC.features || []).filter(f => f.properties && f.properties.isSOS).length;
                setSOSCount(sosCountLocal);
              }
            } catch (e) {
              console.error('Failed to refresh authority map after assignment:', e);
            }
          })();
        }} />}
        {activeTab === 'shelters' && <ShelterManagement overlays={(mapData && mapData.overlays) ? mapData.overlays : null} />}
        {activeTab === 'resources' && <ResourceAllocation />}
        {activeTab === 'heatmap' && <Heatmap points={heatPoints} overlays={(mapData && mapData.overlays) ? mapData.overlays : null} />}
        {activeTab === 'briefs' && <AutomatedBriefs mapData={mapData} />}
      </main>
    </div>
  );
};

export default AuthorityDashboard;

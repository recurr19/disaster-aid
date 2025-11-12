import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Activity, Users, Building2, TrendingUp, FileText } from 'lucide-react';
import CrisisOverview from './CrisisOverview';
import SOSQueue from './SOSQueue';
import AssignmentBoard from './AssignmentsList';
import ShelterManagement from './ShelterManagement';
import ResourceAllocation from './ResourceAllocation';
import AutomatedBriefs from './AutomatedBriefs';
import Heatmap from './Heatmap';
import './authority.css';
import AppHeader from '../common/AppHeader';
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

  // Function to refresh map data (tickets + overlays)
  const refreshMapData = useCallback(async () => {
    try {
      setLoadingMap(true);
      const res = await API.get('/authority/map');
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
      setLoadingMap(false);
    }
  }, []);

  // Fetch map data from backend (tickets + overlays)
  useEffect(() => {
    refreshMapData();
  }, [refreshMapData]);

  // No DB fetch for now. Use static/demo values to mimic prototype counts.
  useEffect(() => {
    setSOSCount(5);
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  return (
    <div className="container-main authority-dashboard-root">
      <AppHeader
        title={"Authority Command"}
        subtitle={"Real-time coordination & oversight"}
        onLogout={handleLogout}
        rightSlot={(
          <div className="flex items-center space-x-2 text-green-600 px-3 py-1 rounded-full bg-green-50 border border-green-100">
            <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide">ONLINE</span>
          </div>
        )}
      />

      <nav className="nav-bar bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 border-b border-white/40 shadow-sm">
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
                  className={`nav-button ${isActive ? 'active' : ''} relative group`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
                      {badge}
                    </span>
                  )}
                  <span className="absolute inset-0 rounded-lg ring-2 ring-rose-500/0 group-hover:ring-rose-500/40 transition" />
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Context bar */}
        <div className="flex flex-wrap gap-3 items-center text-sm">
          <div className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-medium shadow-sm">SOS: {sosCount}</div>
          <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium shadow-sm">Tickets: {heatPoints.length}</div>
          {mapData?.overlays && (
            <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium shadow-sm">Overlays: {Object.keys(mapData.overlays).length}</div>
          )}
        </div>
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
        {activeTab === 'shelters' && <ShelterManagement overlays={(mapData && mapData.overlays) ? mapData.overlays : null} onOverlayChange={refreshMapData} />}
        {activeTab === 'resources' && <ResourceAllocation />}
        {activeTab === 'heatmap' && <Heatmap points={heatPoints} overlays={(mapData && mapData.overlays) ? mapData.overlays : null} />}
        {activeTab === 'briefs' && <AutomatedBriefs mapData={mapData} />}
      </main>
    </div>
  );
};

export default AuthorityDashboard;

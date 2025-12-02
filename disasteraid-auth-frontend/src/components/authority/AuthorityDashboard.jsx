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
import { connectRealtime } from '../../api/realtime';

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
      // Prefer the authority-specific combined endpoint (tickets + overlays)
      try {
        const res = await API.get('/authority/map');
        if (res.data?.success) {
          const ticketsFC = res.data.tickets || { type: 'FeatureCollection', features: [] };
          const overlays = res.data.overlays || {};
          // Keep the full tickets FeatureCollection in `mapData` so lists (SOS/Assignments)
          // can show closed tickets as well. For map/heat calculations we compute activeFeatures
          // separately (tickets that are not closed/resolved/canceled).
          const allFeatures = (ticketsFC.features || []);
          const activeFeatures = allFeatures.filter(f => {
            const status = f.properties && f.properties.status ? String(f.properties.status).toLowerCase() : '';
            return status !== 'closed' && status !== 'resolved' && status !== 'canceled';
          });
          const newMapData = { tickets: { type: 'FeatureCollection', features: allFeatures }, overlays };
          setMapData(newMapData);
          const points = activeFeatures.map(f => {
            const coords = f.geometry?.coordinates;
            if (!coords || coords.length < 2) return null;
            const [lng, lat] = coords;
            return { lat, lng, intensity: f.properties?.isSOS ? 0.95 : 0.4, props: f.properties };
          }).filter(Boolean);
          setHeatPoints(points);
          setSOSCount(activeFeatures.filter(f => f.properties?.isSOS).length);
          // If authority endpoint returned data, use it and return early
          if (allFeatures.length > 0) return newMapData;
        }
      } catch (err) {
        // If '/authority/map' fails (403 when not an authority, network, etc.), we'll fallback below
        console.warn('Authority /map fetch failed, falling back to /tickets:', err?.message || err);
      }

      // Fallback: fetch tickets like other dashboards do. This helps when the current user
      // isn't authorized for the authority-specific endpoint or when overlays are not available.
      try {
        const resTickets = await API.get('/tickets');
          if (resTickets.data && resTickets.data.success) {
          const tickets = resTickets.data.tickets || [];
          const features = tickets.map(t => {
            // tickets from /tickets are not GeoJSON; convert if they have location fields
            const coords = t.locationGeo?.coordinates || (t.longitude && t.latitude ? [t.longitude, t.latitude] : null);
            const geometry = coords ? { type: 'Point', coordinates: coords } : null;
            return {
              type: 'Feature',
              geometry,
              properties: {
                ticketId: t.ticketId,
                status: t.status,
                isSOS: !!t.isSOS,
                helpTypes: t.helpTypes,
                createdAt: t.createdAt,
                assignedTo: t.assignedTo
              }
            };
          }).filter(f => f.geometry && Array.isArray(f.geometry.coordinates));
          // Keep full list of features in mapData so downstream lists can show closed tickets
          const ticketsFC = { type: 'FeatureCollection', features };
          const newMapData = { tickets: ticketsFC, overlays: {} };
          setMapData(newMapData);
          const activeFeatures = features.filter(f => {
            const status = f.properties && f.properties.status ? String(f.properties.status).toLowerCase() : '';
            return status !== 'closed' && status !== 'resolved' && status !== 'canceled';
          });
          const points = activeFeatures.map(f => {
            const [lng, lat] = f.geometry.coordinates;
            return { lat, lng, intensity: f.properties?.isSOS ? 0.95 : 0.4, props: f.properties };
          });
          setHeatPoints(points);
          setSOSCount(points.filter(p => p.props?.isSOS).length);
          return newMapData;
        }
      } catch (err) {
        console.warn('Fallback /tickets fetch failed:', err?.message || err);
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

  // Realtime + polling: auto-refresh map data when relevant events occur
  useEffect(() => {
    const s = connectRealtime();
    const refresh = () => {
      try { refreshMapData(); } catch (e) { console.warn('refreshMapData failed on realtime event', e); }
    };

    // Listen to common events emitted by the backend
    s.on('connect', refresh);
    s.on('ticket:created', refresh);
    s.on('ticket:updated', refresh);
    s.on('ticket:closed', refresh);
    s.on('ticket:status:updated', refresh);
    s.on('assignment:accepted', refresh);
    s.on('assignment:proposed', refresh);
    s.on('overlays:changed', refresh);

    // Polling fallback for environments where realtime may not reach us
    const intervalId = setInterval(() => {
      refreshMapData();
    }, 30000); // every 30s

    return () => {
      try {
        s.off('connect', refresh);
        s.off('ticket:created', refresh);
        s.off('ticket:updated', refresh);
        s.off('ticket:closed', refresh);
        s.off('ticket:status:updated', refresh);
        s.off('assignment:accepted', refresh);
        s.off('assignment:proposed', refresh);
        s.off('overlays:changed', refresh);
      } catch (e) { /* ignore */ }
      clearInterval(intervalId);
    };
  }, [refreshMapData]);

  // Remove demo override of SOS count so real data is used

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
        {activeTab === 'assignments' && <AssignmentBoard tickets={(mapData && mapData.tickets) ? mapData.tickets : null} onAssigned={() => {
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
        {activeTab === 'shelters' && (
          <ShelterManagement
            overlays={(mapData && mapData.overlays) ? mapData.overlays : null}
            onOverlayChange={refreshMapData}
            onLocalAddOverlay={(overlay) => {
              // merge overlay into parent mapData immediately for instant visibility
              setMapData(prev => {
                try {
                  const next = prev ? { ...prev } : { tickets: { type: 'FeatureCollection', features: [] }, overlays: {} };
                  next.overlays = { ...(next.overlays || {}) };
                  const key = overlay.type === 'blockedRoute' ? 'blockedRoutes' : (overlay.type === 'medicalCamp' ? 'medicalCamps' : (overlay.type === 'depot' ? 'depots' : (overlay.type === 'shelter' ? 'shelters' : 'advisories')));
                  next.overlays[key] = Array.isArray(next.overlays[key]) ? [...next.overlays[key]] : [];
                  // avoid duplicates
                  if (!next.overlays[key].some(o => o._id === overlay._id)) next.overlays[key].push(overlay);
                  return next;
                } catch (e) {
                  return prev;
                }
              });
            }}
          />
        )}
        {activeTab === 'resources' && <ResourceAllocation />}
        {activeTab === 'heatmap' && <Heatmap points={heatPoints} overlays={(mapData && mapData.overlays) ? mapData.overlays : null} />}
        {activeTab === 'briefs' && <AutomatedBriefs mapData={mapData} />}
      </main>
    </div>
  );
};

export default AuthorityDashboard;

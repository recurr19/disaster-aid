import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './authority.css';
import API from '../../api/axios';

const Heatmap = ({ points = [] }) => {
  const mapRef = useRef(null);
  const heatRef = useRef(null);
  const [heatAvailable, setHeatAvailable] = useState(false);
  const [mapData, setMapData] = useState(null);
  const [layers, setLayers] = useState({
    shelters: true,
    medicalCamps: true,
    depots: true,
    blockedRoutes: true,
    advisories: true
  });

  useEffect(() => {
    // Try to dynamically load leaflet.heat if available in node_modules
    // This is optional — if not present, we keep a plain map and later the plugin can be added.
    let cancelled = false;
    const tryLoad = async () => {
      try {
        // dynamic import may fail if package not installed; that's fine
        const heat = await import('leaflet.heat');
        if (!cancelled && L && L.heatLayer) {
          setHeatAvailable(true);
        }
      } catch (err) {
        // plugin not present; heatmap won't be used now
        setHeatAvailable(false);
      }
    };
    tryLoad();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchMap() {
      try {
        const res = await API.get('/authority/map', { signal: controller.signal });
        setMapData(res.data);
      } catch (e) {
        // ignore for now
      }
    }
    fetchMap();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // If heat plugin available, (re)create heat layer
    if (heatAvailable && L && L.heatLayer) {
      // remove existing
      if (heatRef.current) {
        try { heatRef.current.remove(); } catch (e) {}
      }
      const latlngs = (points || []).map(p => [p.lat, p.lng, p.intensity || 0.5]);
      heatRef.current = L.heatLayer(latlngs, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
    }
    // If no plugin, do nothing — map remains blank until data integrated
  }, [heatAvailable, points]);

  // Default center (India) and zoom
  const center = [22.5937, 78.9629];

  // derive points from mapData tickets
  const apiPoints = (mapData?.tickets?.features || []).map(f => {
    const [lng, lat] = f.geometry.coordinates || [];
    const props = f.properties || {};
    return {
      lat, lng,
      intensity: props.isSOS ? 1.0 : 0.6,
      label: `${props.ticketId} — ${props.status}${props.assignedTo?.organizationName ? ' • ' + props.assignedTo.organizationName : ''}`
    };
  });

  const displayPoints = (points && points.length) ? points : apiPoints;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Service Heatmap</h2>
      <p className="text-sm text-gray-600 mb-3">Interactive map — live tickets and overlay layers.</p>
      <div className="flex flex-wrap gap-3 mb-4">
        {[
          { key: 'shelters', label: 'Shelters' },
          { key: 'medicalCamps', label: 'Medical Camps' },
          { key: 'depots', label: 'Depots' },
          { key: 'blockedRoutes', label: 'Blocked Routes' },
          { key: 'advisories', label: 'Advisories' }
        ].map(opt => (
          <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={layers[opt.key]}
              onChange={(e) => setLayers(prev => ({ ...prev, [opt.key]: e.target.checked }))}
            />
            {opt.label}
          </label>
        ))}
      </div>

      <div style={{ height: 480, borderRadius: 12, overflow: 'hidden' }}>
        <MapContainer
          center={center}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Tickets as circles if heat plugin is not present */}
          {!heatAvailable && displayPoints.map((p, idx) => (
            <CircleMarker key={idx} center={[p.lat, p.lng]} radius={12} pathOptions={{ color: 'rgba(220,38,38,0.8)', fillColor: 'rgba(220,38,38,0.35)', fillOpacity: 0.6 }}>
              <Popup>
                <div>
                  <strong>{p.label || `Point ${idx + 1}`}</strong>
                  <div>Intensity: {p.intensity ?? '—'}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Overlays rendering */}
          {mapData?.overlays && (
            <>
              {layers.shelters && (mapData.overlays.shelters || []).map(o => {
                if (o.geometry?.type === 'Point') {
                  const [lng, lat] = o.geometry.coordinates || [];
                  return (
                    <CircleMarker key={o._id} center={[lat, lng]} radius={10} pathOptions={{ color: '#2563eb', fillColor: '#93c5fd', fillOpacity: 0.7 }}>
                      <Popup>
                        <div>
                          <strong>Shelter: {o.name}</strong>
                          <div>Status: {o.status || '—'}</div>
                          {'capacity' in o ? <div>Capacity: {o.capacity}</div> : null}
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                }
                return null;
              })}

              {layers.medicalCamps && (mapData.overlays.medicalCamps || []).map(o => {
                if (o.geometry?.type === 'Point') {
                  const [lng, lat] = o.geometry.coordinates || [];
                  return (
                    <CircleMarker key={o._id} center={[lat, lng]} radius={10} pathOptions={{ color: '#16a34a', fillColor: '#86efac', fillOpacity: 0.7 }}>
                      <Popup>
                        <div>
                          <strong>Medical Camp: {o.name}</strong>
                          <div>Status: {o.status || '—'}</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                }
                return null;
              })}

              {layers.depots && (mapData.overlays.depots || []).map(o => {
                if (o.geometry?.type === 'Point') {
                  const [lng, lat] = o.geometry.coordinates || [];
                  return (
                    <CircleMarker key={o._id} center={[lat, lng]} radius={10} pathOptions={{ color: '#7c3aed', fillColor: '#c4b5fd', fillOpacity: 0.7 }}>
                      <Popup>
                        <div>
                          <strong>Depot: {o.name}</strong>
                          <div>Status: {o.status || '—'}</div>
                          {'capacity' in o ? <div>Capacity: {o.capacity}</div> : null}
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                }
                return null;
              })}

              {layers.blockedRoutes && (mapData.overlays.blockedRoutes || []).map(o => {
                if (o.geometry?.type === 'LineString') {
                  const latlngs = (o.geometry.coordinates || []).map(([lng, lat]) => [lat, lng]);
                  return (
                    <Polyline key={o._id} positions={latlngs} pathOptions={{ color: '#dc2626', weight: 5, opacity: 0.9 }} />
                  );
                }
                if (o.geometry?.type === 'Point') {
                  const [lng, lat] = o.geometry.coordinates || [];
                  return (
                    <CircleMarker key={o._id} center={[lat, lng]} radius={10} pathOptions={{ color: '#dc2626', fillColor: '#fecaca', fillOpacity: 0.8 }}>
                      <Popup>
                        <div>
                          <strong>Blocked Route: {o.name}</strong>
                          <div>Status: {o.status || 'blocked'}</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                }
                return null;
              })}

              {layers.advisories && (mapData.overlays.advisories || []).map(o => {
                if (o.geometry?.type === 'Point') {
                  const [lng, lat] = o.geometry.coordinates || [];
                  return (
                    <CircleMarker key={o._id} center={[lat, lng]} radius={8} pathOptions={{ color: '#f59e0b', fillColor: '#fde68a', fillOpacity: 0.9 }}>
                      <Popup>
                        <div>
                          <strong>Advisory: {o.name}</strong>
                          <div>{o.status || 'active'}</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                }
                return null;
              })}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default Heatmap;

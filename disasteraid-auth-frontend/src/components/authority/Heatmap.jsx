import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './authority.css';

const Heatmap = ({ points = [] }) => {
  const mapRef = useRef(null);
  const heatRef = useRef(null);
  const [heatAvailable, setHeatAvailable] = useState(false);

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

  // demo/sample points (centers across India)
  const samplePoints = [
    { lat: 28.7041, lng: 77.1025, intensity: 0.8, label: 'Delhi' },
    { lat: 19.07598, lng: 72.87766, intensity: 0.6, label: 'Mumbai' },
    { lat: 13.0827, lng: 80.2707, intensity: 0.5, label: 'Chennai' },
    { lat: 22.5726, lng: 88.3639, intensity: 0.7, label: 'Kolkata' },
    { lat: 12.9716, lng: 77.5946, intensity: 0.4, label: 'Bengaluru' },
  ];

  const displayPoints = (points && points.length) ? points : samplePoints;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Heatmap</h2>
      <p className="text-sm text-gray-600 mb-4">Interactive map — heat overlay will appear when points are provided.</p>

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
          {/* If heat plugin is not present, show simple circle markers as fallback demo */}
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
        </MapContainer>
      </div>
    </div>
  );
};

export default Heatmap;

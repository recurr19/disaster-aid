import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import './StatusMap.css';

const DISASTER_TYPES = ['Flood', 'Cyclone', 'Earthquake', 'Landslide', 'Drought', 'Industrial'];
const SERVICE_TYPES = ['Food', 'Shelter', 'Medical', 'Rescue', 'Logistics', 'Supplies'];

// Demo dataset; replace with API data later
const demoIncidents = [
  { id: 'inc-1', name: 'Assam Floods', type: 'Flood', lat: 26.2, lng: 91.7, severity: 0.8 },
  { id: 'inc-2', name: 'Odisha Cyclone', type: 'Cyclone', lat: 20.3, lng: 85.8, severity: 0.7 },
  { id: 'inc-3', name: 'Himalayan Landslide', type: 'Landslide', lat: 30.1, lng: 79.0, severity: 0.6 },
  { id: 'inc-4', name: 'Gujarat Industrial Incident', type: 'Industrial', lat: 22.3, lng: 70.8, severity: 0.5 }
];

const demoNgoActivities = [
  { id: 'ngo-1', org: 'ReliefAid', services: ['Food', 'Shelter'], lat: 26.1, lng: 91.75, activeTickets: 42 },
  { id: 'ngo-2', org: 'MediCare', services: ['Medical', 'Supplies'], lat: 20.4, lng: 86.0, activeTickets: 31 },
  { id: 'ngo-3', org: 'RescueOps', services: ['Rescue', 'Logistics'], lat: 19.2, lng: 72.9, activeTickets: 15 }
];

function latLngToPercent(lat, lng) {
  // Very rough bounding box for India for a background image overlay projection
  // lat: 8..37.5 ; lng: 68..97.5
  const latMin = 8;
  const latMax = 37.5;
  const lngMin = 68;
  const lngMax = 97.5;
  const y = 100 - ((lat - latMin) / (latMax - latMin)) * 100; // invert Y for CSS top
  const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
  return { top: `${y}%`, left: `${x}%` };
}

const StatusMap = () => {
  const [selectedDisasters, setSelectedDisasters] = useState(DISASTER_TYPES);
  const [selectedServices, setSelectedServices] = useState(SERVICE_TYPES);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const filteredIncidents = useMemo(
    () => demoIncidents.filter((i) => selectedDisasters.includes(i.type)),
    [selectedDisasters]
  );

  const filteredNgoActivities = useMemo(
    () =>
      demoNgoActivities.filter((a) => a.services.some((s) => selectedServices.includes(s))),
    [selectedServices]
  );

  const toggleFilter = (list, setList, value) => {
    setList((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    function resize() {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    const POINTS = 70;
    const MAX_SPEED = 0.25;
    const CONNECT_DIST = 180 * dpr;
    const nodes = Array.from({ length: POINTS }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() * 2 - 1) * MAX_SPEED * dpr,
      vy: (Math.random() * 2 - 1) * MAX_SPEED * dpr,
      r: (2 + Math.random() * 2) * dpr
    }));

    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // draw connections first
      ctx.lineWidth = 1 * dpr;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < CONNECT_DIST) {
            const alpha = 1 - dist / CONNECT_DIST;
            ctx.strokeStyle = `rgba(220,38,38,${0.08 + alpha * 0.12})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // update + draw points
      for (const p of nodes) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.fillStyle = 'rgba(220,38,38,0.5)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(step);
    }
    animationId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="statusmap-shell">
      <canvas ref={canvasRef} className="network-canvas" />
      <div className="statusmap-header">
        <div className="header-icon"><AlertTriangle className="w-6 h-6 text-white" /></div>
        <div>
          <h1>Relief Status Map</h1>
          <p>Live view of disasters and NGO operations across India</p>
        </div>
      </div>

      <div className="statusmap-page">
        <div className="filters-panel card">
        <h3>Disaster Types</h3>
        <div className="chip-row">
          {DISASTER_TYPES.map((t) => (
            <button
              key={t}
              className={`chip ${selectedDisasters.includes(t) ? 'chip-on' : ''}`}
              onClick={() => toggleFilter(selectedDisasters, setSelectedDisasters, t)}
            >
              {t}
            </button>
          ))}
        </div>
        <h3>NGO Service Types</h3>
        <div className="chip-row">
          {SERVICE_TYPES.map((t) => (
            <button
              key={t}
              className={`chip ${selectedServices.includes(t) ? 'chip-on' : ''}`}
              onClick={() => toggleFilter(selectedServices, setSelectedServices, t)}
            >
              {t}
            </button>
          ))}
        </div>
        </div>

        <div className="map-card card">
          <LeafletMap
            incidents={filteredIncidents}
            activities={filteredNgoActivities}
            onSelect={setSelectedFeature}
          />
        </div>

        <div className="details-panel card">
          {!selectedFeature && (
            <div className="placeholder">
              <h4>Status Map</h4>
              <p>
                Click the markers to view incident or NGO details.
              </p>
            </div>
          )}

          {selectedFeature?.kind === 'incident' && (
            <div>
              <h4>{selectedFeature.data.name}</h4>
              <p><strong>Type:</strong> {selectedFeature.data.type}</p>
              <p><strong>Severity (0-1):</strong> {selectedFeature.data.severity}</p>
              <div className="help-section">
                <p>
                  NGOs near this incident are highlighted. Use service filters to refine.
                </p>
              </div>
            </div>
          )}

          {selectedFeature?.kind === 'ngo' && (
            <div>
              <h4>{selectedFeature.data.org}</h4>
              <p><strong>Services:</strong> {selectedFeature.data.services.join(', ')}</p>
              <p><strong>Active Tickets:</strong> {selectedFeature.data.activeTickets}</p>
              <div className="help-section">
                <p>
                  This NGO operates in the selected area. Explore nearby incidents for alignment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusMap;

function LeafletMap({ incidents, activities, onSelect }) {
  const mapRef = useRef(null);
  const layerRef = useRef({ incidents: [], activities: [] });
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const L = window.L;
    const map = L.map(containerRef.current, {
      center: [22.5, 80], // India approx center
      zoom: 5,
      minZoom: 4,
      maxZoom: 12
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    mapRef.current = map;
  }, []);

  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!map) return;

    // clear previous
    layerRef.current.incidents.forEach((m) => m.remove());
    layerRef.current.activities.forEach((m) => m.remove());
    layerRef.current = { incidents: [], activities: [] };

    // add incidents (red circles)
    const newIncidentLayers = incidents.map((i) => {
      const circle = L.circleMarker([i.lat, i.lng], {
        radius: 8 + Math.round((i.severity || 0.5) * 6),
        color: '#ef4444',
        weight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.6
      })
        .addTo(map)
        .bindTooltip(`${i.name} (${i.type})`)
        .on('click', () => onSelect({ kind: 'incident', data: i }));
      return circle;
    });

    // add NGO activities (blue markers)
    const newActivityLayers = activities.map((a) => {
      const marker = L.circleMarker([a.lat, a.lng], {
        radius: 7,
        color: '#3b82f6',
        weight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.6
      })
        .addTo(map)
        .bindTooltip(`${a.org} (${a.services.join(', ')})`)
        .on('click', () => onSelect({ kind: 'ngo', data: a }));
      return marker;
    });

    layerRef.current = { incidents: newIncidentLayers, activities: newActivityLayers };
  }, [incidents, activities, onSelect]);

  return <div className="map-stage" ref={containerRef} />;
}



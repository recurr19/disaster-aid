import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, MapPin } from 'lucide-react';
import API from '../api/axios';
import { getTrackerStatus } from '../api/tracker';

const HELP_TYPES = ['Food','Water','Shelter','Medical','Rescue','Sanitation','Baby Supplies','Transportation','Power/Charging'];
const MEDICAL_NEEDS = ['insulin','dialysis','wheelchair','oxygen','medication','infant care','elderly care','mental health'];

export default function RequestFormPublic() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    language: 'en',
    preferredContact: 'call',
    address: '',
    landmark: '',
    adults: 1,
    children: 0,
    elderly: 0,
    helpTypes: [],
    medicalNeeds: [],
    description: '',
    isSOS: false,
  });
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [networkStrength, setNetworkStrength] = useState(100);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [tracker, setTracker] = useState({ loading: false, data: null });
  const trackerTimerRef = useRef(null);
  const socketRef = useRef(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Leaflet map and polygon state
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersRef = useRef([]);
  const polygonRef = useRef(null);
  const polygonPointsRef = useRef([]); // [{lat,lng}]

  useEffect(() => {
    // battery API (optional)
    if (navigator.getBattery) {
      navigator.getBattery().then(batt => {
        const update = () => setBatteryLevel(Math.round((batt.level || 1) * 100));
        update();
        batt.addEventListener('levelchange', update);
      }).catch(() => {});
    }
    // network info (optional)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection && typeof connection.downlink === 'number') {
      // downlink in Mbps (rough proxy 0..100)
      setNetworkStrength(Math.max(1, Math.min(100, Math.round((connection.downlink / 100) * 100))));
    }
  }, []);

  // Initialize socket.io
  useEffect(() => {
    if (!socketRef.current && window.io) {
      socketRef.current = window.io('http://localhost:5001', { transports: ['websocket'] });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const L = window.L;
    const map = L.map(containerRef.current, { center: [20.59, 78.96], zoom: 5 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // click to add polygon point
    map.on('click', (e) => {
      const L = window.L;
      const { lat, lng } = e.latlng;
      polygonPointsRef.current.push({ lat, lng });
      const m = L.circleMarker([lat, lng], { radius: 5, color: '#ef4444' }).addTo(map);
      markersRef.current.push(m);
      redrawPolygon();
    });

    mapRef.current = map;
  }, []);

  const redrawPolygon = () => {
    const L = window.L;
    const map = mapRef.current;
    if (!map) return;
    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }
    if (polygonPointsRef.current.length >= 3) {
      polygonRef.current = L.polygon(polygonPointsRef.current, { color: '#ef4444', weight: 2, fillOpacity: 0.1 }).addTo(map);
    }
  };

  // Tracker polling
  const startTracker = (tid) => {
    if (!tid) return;
    if (trackerTimerRef.current) clearInterval(trackerTimerRef.current);
    setTracker({ loading: true, data: null });
    const fetchOnce = async () => {
      try {
        const data = await getTrackerStatus(tid);
        setTracker({ loading: false, data });
      } catch (e) {
        // ignore transient errors
      }
    };
    fetchOnce();
    trackerTimerRef.current = setInterval(fetchOnce, 5000);

    // Subscribe to realtime updates for faster activation
    if (socketRef.current) {
      const s = socketRef.current;
      const updateEvt = `ticket:update:${tid}`;
      const onUpdate = () => fetchOnce();
      const onAccepted = (p) => { if (p?.ticketId === tid) fetchOnce(); };
      const onProposals = (p) => { if (p?.ticketId === tid) fetchOnce(); };
      s.on(updateEvt, onUpdate);
      s.on('assignment:accepted', onAccepted);
      s.on('ticket:proposals', onProposals);
      // cleanup previous handlers on re-subscribe
      return () => {
        s.off(updateEvt, onUpdate);
        s.off('assignment:accepted', onAccepted);
        s.off('ticket:proposals', onProposals);
      };
    }
  };
  useEffect(() => () => { if (trackerTimerRef.current) clearInterval(trackerTimerRef.current); }, []);

  const renderStatus = () => {
    const a = tracker.data?.assignments || [];
    const accepted = a.find(x => x.status === 'accepted');
    const proposedCount = a.filter(x => x.status === 'proposed').length;
    const distanceKm = accepted?.distanceKm ?? null;
    const eta = accepted?.etaMinutes ?? null;
    const steps = [
      { key: 'proposed', label: 'Proposed', done: proposedCount > 0 || !!accepted },
      { key: 'accepted', label: 'Accepted', done: !!accepted },
      { key: 'in_progress', label: 'En route', done: tracker.data?.ticket?.status === 'in_progress' || tracker.data?.ticket?.status === 'matched' },
      { key: 'arrived', label: 'Arrived', done: false },
      { key: 'fulfilled', label: 'Fulfilled', done: tracker.data?.ticket?.status === 'completed' }
    ];
    return (
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Live Status</h3>
          <span className="text-xs text-gray-500">Ticket {tracker.data?.ticket?.ticketId}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {steps.map((s, i) => (
            <div key={s.key} className={`flex items-center gap-2 ${i>0?'ml-1':''}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${s.done?'bg-emerald-500':'bg-gray-300'}`} />
              <span className={`${s.done?'text-emerald-700':'text-gray-600'}`}>{s.label}</span>
              {i < steps.length-1 && <span className="text-gray-400">→</span>}
            </div>
          ))}
        </div>
        {accepted && (
          <div className="mt-2 text-sm text-gray-700">
            <div>Assigned NGO: <span className="font-medium">{accepted.ngo?.organizationName || accepted.ngo?.id || 'NGO'}</span></div>
            <div>
              {distanceKm != null && <span>Distance: {Math.round(distanceKm*10)/10} km</span>}
              {eta != null && <span className="ml-3">ETA: {eta} min</span>}
            </div>
          </div>
        )}
      </div>
    );
  };

  const resetPolygon = () => {
    const map = mapRef.current;
    if (!map) return;
    polygonPointsRef.current = [];
    if (polygonRef.current) { polygonRef.current.remove(); polygonRef.current = null; }
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
  };

  const closePolygonIfNeeded = (ring) => {
    if (ring.length < 3) return ring;
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]]);
    return ring;
  };

  const setMyLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        const map = mapRef.current;
        if (map) {
          map.setView([lat, lng], 14);
          window.L.circleMarker([lat, lng], { radius: 6, color: '#22c55e' }).addTo(map);
        }
      },
      () => alert('Unable to get location. Please try again or enter address/landmark.'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const handleNumber = (name, delta) => setForm(prev => ({ ...prev, [name]: Math.max(0, (parseInt(prev[name] || 0) || 0) + delta) }));
  const toggleArray = (name, value) => setForm(prev => ({
    ...prev,
    [name]: prev[name].includes(value) ? prev[name].filter(v => v !== value) : [...prev[name], value]
  }));

  const onFiles = (e) => setFiles(Array.from(e.target.files || []));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const fd = new FormData();
      Object.entries({ ...form }).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach(it => fd.append(k + '[]', it));
        else fd.append(k, v);
      });
      if (coords.lat != null && coords.lng != null) {
        fd.append('latitude', coords.lat);
        fd.append('longitude', coords.lng);
      }
      fd.append('batteryLevel', batteryLevel);
      fd.append('networkStrength', networkStrength);
      files.forEach(f => fd.append('files[]', f));

      // polygon -> GeoJSON polygon
      if (polygonPointsRef.current.length >= 3) {
        const ring = polygonPointsRef.current.map(p => [p.lng, p.lat]);
        const closed = closePolygonIfNeeded(ring);
        const coverage = { type: 'Polygon', coordinates: [closed] };
        fd.append('coverageArea', JSON.stringify(coverage));
      }

      const res = await API.post('/tickets/public', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.status === 201 && res.data?.ticketId) {
        setTicketId(res.data.ticketId);
        startTracker(res.data.ticketId);
        setSuccessMsg(`Request submitted. Ticket ID: ${res.data.ticketId}`);
        // reset minimal fields
        setForm({
          name: '', phone: '', language: 'en', preferredContact: 'call', address: '', landmark: '',
          adults: 1, children: 0, elderly: 0, helpTypes: [], medicalNeeds: [], description: '', isSOS: false
        });
        setFiles([]);
        setCoords({ lat: null, lng: null });
        resetPolygon();
      } else {
        setSuccessMsg('');
        alert('Failed to submit. Please try again.');
      }
    } catch (err) {
      console.error('Submit error', err);
      setSuccessMsg('');
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h1 className="text-xl font-semibold">Urgent Request Aid</h1>
        </div>

        {successMsg && (
          <div className="mb-4 border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-2 rounded text-sm">
            {successMsg}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-md border border-slate-200 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Name</label>
                <input name="name" value={form.name} onChange={handleInput} className="w-full border border-slate-300 rounded px-2 py-2" required />
              </div>
              <div>
                <label className="text-sm">Phone</label>
                <input name="phone" value={form.phone} onChange={handleInput} className="w-full border border-slate-300 rounded px-2 py-2" required />
              </div>
              <div>
                <label className="text-sm">Language</label>
                <input name="language" value={form.language} onChange={handleInput} className="w-full border border-slate-300 rounded px-2 py-2" />
              </div>
              <div>
                <label className="text-sm">Preferred Contact</label>
                <select name="preferredContact" value={form.preferredContact} onChange={handleInput} className="w-full border border-slate-300 rounded px-2 py-2">
                  <option value="call">Call</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm">Address</label>
              <input name="address" value={form.address} onChange={handleInput} className="w-full border border-slate-300 rounded px-2 py-2" />
            </div>
            <div>
              <label className="text-sm">Landmark</label>
              <input name="landmark" value={form.landmark} onChange={handleInput} className="w-full border border-slate-300 rounded px-2 py-2" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {['adults','children','elderly'].map(f => (
                <div key={f}>
                  <label className="text-sm capitalize">{f}</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleNumber(f, -1)} className="px-2 border border-slate-300 rounded">-</button>
                    <input value={form[f]} onChange={(e)=>setForm(p=>({...p,[f]: Math.max(0, parseInt(e.target.value)||0)}))} className="w-full border border-slate-300 rounded px-2 py-2" />
                    <button type="button" onClick={() => handleNumber(f, +1)} className="px-2 border border-slate-300 rounded">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="text-sm">Need Categories</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {HELP_TYPES.map(h => (
                  <button type="button" key={h} onClick={()=>toggleArray('helpTypes', h.toLowerCase())}
                    className={`px-3 py-1 rounded border border-slate-300 ${form.helpTypes.includes(h.toLowerCase()) ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm">Medical Needs</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {MEDICAL_NEEDS.map(m => (
                  <button type="button" key={m} onClick={()=>toggleArray('medicalNeeds', m)}
                    className={`px-3 py-1 rounded border border-slate-300 ${form.medicalNeeds.includes(m) ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm">Description</label>
              <textarea name="description" value={form.description} onChange={handleInput} className="w-full border border-slate-300 rounded px-2 py-2" rows={3} />
            </div>

            <div className="flex items-center gap-2">
              <input id="sos" type="checkbox" checked={form.isSOS} onChange={(e)=>setForm(p=>({...p,isSOS:e.target.checked}))} />
              <label htmlFor="sos" className="text-sm font-medium text-red-600">Mark as SOS (life-threatening / trapped / medical critical)</label>
            </div>

            <div>
              <label className="text-sm">Evidence (photos/audio/video)</label>
              <input type="file" multiple onChange={onFiles} className="w-full text-sm" />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={setMyLocation} className="inline-flex items-center gap-1 px-3 py-2 border border-slate-300 rounded">
                <MapPin className="w-4 h-4" /> Use My Location
              </button>
              {coords.lat != null && (
                <span className="text-xs text-gray-600 self-center">Lat {coords.lat.toFixed(5)}, Lng {coords.lng.toFixed(5)}</span>
              )}
            </div>

            <button disabled={submitting} className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-md">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>

            {ticketId && (
              <p className="text-sm text-emerald-700">Ticket created: {ticketId}</p>
            )}
          </form>

          <div className="space-y-3">
            <div className="bg-white rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Group Coverage Area (optional)</h3>
                <button onClick={resetPolygon} className="text-xs underline">Reset</button>
              </div>
              <div ref={containerRef} className="w-full h-[420px] rounded overflow-hidden border" />
              <p className="text-xs text-gray-600 mt-2">Tap/click on the map to add polygon points outlining the affected area. Use Reset to clear.</p>
            </div>

            <div className="bg-white rounded-md border border-slate-200 p-3 text-sm text-gray-700">
              <p>Battery: {batteryLevel}% · Network: {networkStrength}% (used for SOS triage)</p>
              <p className="mt-1">We will auto-match nearby verified NGOs and notify you by your preferred contact.</p>
            </div>
          </div>
        </div>
      </div>
      {ticketId && (
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          {tracker.loading && <div className="text-sm text-gray-600">Loading status…</div>}
          {tracker.data && renderStatus()}
        </div>
      )}
    </div>
  );
}

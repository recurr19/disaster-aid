import React, { useEffect, useState, useRef, useCallback } from 'react';
import './authority.css';
import { listOverlays, createOverlay, deleteOverlay } from '../../api/authority';
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents, useMap } from 'react-leaflet';

const ShelterManagement = ({ overlays = null }) => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    type: 'shelter',
    name: '',
    status: 'open',
    capacity: '',
    latitude: '',
    longitude: '',
    city: '',
    state: ''
  });
  const [loading, setLoading] = useState(false);
  const [drawMode, setDrawMode] = useState(false); // when true, clicks add polygon points
  const [polygonPoints, setPolygonPoints] = useState([]); // array of [lat,lng]
  const [pointMarker, setPointMarker] = useState(null); // [lat,lng]
  const [areaFocused, setAreaFocused] = useState(false);
  const [areaBounds, setAreaBounds] = useState(null); // [[south,west],[north,east]] or null
  const [focusedMarker, setFocusedMarker] = useState(null); // [lat, lng]
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [lastGeocodeResult, setLastGeocodeResult] = useState(null);
  const [uiWarning, setUiWarning] = useState(null);
  const [lastPlace, setLastPlace] = useState(null);
  const mapRef = useRef(null);
  const [mapLogs, setMapLogs] = useState([]);
  const pushMapLog = (msg) => setMapLogs(prev => [...prev, `${new Date().toISOString()} ${msg}`].slice(-50));

  const load = useCallback(async () => {
    if (overlays) {
      // flatten overlays into list format similar to API response
      const list = [];
      ['shelters','medicalCamps','depots','blockedRoutes','advisories'].forEach(k => {
        const arr = overlays[k] || [];
        arr.forEach(a => list.push(a));
      });
      setItems(list);
      return;
    }

    try {
      const res = await listOverlays();
      setItems(res.items || []);
    } catch (e) {
      setItems([]);
    }
  }, [overlays]);

  useEffect(() => { load(); }, [load]);

  // Convenience: default map center (India)
  const defaultCenter = [22.5937, 78.9629];

  const MapClickHandler = ({ mode }) => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        if (!areaFocused) {
          // allow pick but surface a UI warning so operator understands the scope
          setUiWarning('Map not focused — your pick may be outside the intended area. Use Find Area to scope.');
        } else {
          setUiWarning(null);
        }
        if (mode === 'blockedRoute') {
          // add point to polygon
          setPolygonPoints(prev => [...prev, [lat, lng]]);
        } else if (mode === 'point') {
          setPointMarker([lat, lng]);
          setForm(f => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
        }
      }
    });
    return null;
  };

  // MapController: runs inside the map context and performs reliable movements
  const MapController = ({ areaBounds, focusedMarker, onFocused, onLog }) => {
    const map = useMap();
    const lastAppliedRef = useRef({ boundsKey: null, markerKey: null });
    useEffect(() => {
      if (!map) return;
      const run = async () => {
        try {
          // expose map instance for outside debugging
          try { mapRef.current = map; } catch (e) { /* ignore */ }
          const log = (m) => { try { console.debug(m); onLog && onLog(m); } catch (e) { /* ignore */ } };
          log('MapController: methods ' + JSON.stringify({ hasSetView: !!map.setView, hasFlyTo: !!map.flyTo, hasFlyToBounds: !!map.flyToBounds, hasPanTo: !!map.panTo }));
          // avoid reapplying same bounds/marker repeatedly
          const boundsKey = areaBounds ? JSON.stringify(areaBounds) : null;
          const markerKey = focusedMarker ? JSON.stringify(focusedMarker) : null;
          if (boundsKey === lastAppliedRef.current.boundsKey && markerKey === lastAppliedRef.current.markerKey) {
            log('MapController: bounds/marker unchanged, skipping');
            return;
          }

          if (areaBounds) {
            const center = [(areaBounds[0][0] + areaBounds[1][0]) / 2, (areaBounds[0][1] + areaBounds[1][1]) / 2];
            try { map.invalidateSize(); } catch (e) { /* ignore */ }
            // explicit stronger moves
            try { map.setView(center, 13); log('MapController setView ' + JSON.stringify({ center, zoom: 13 })); } catch (e) { console.warn('MapController setView failed', e); onLog && onLog('WARN: MapController setView failed: ' + e.message); }
            try { await new Promise(r => setTimeout(r, 120)); } catch (e) { /* ignore */ }
            try { map.flyTo(center, 13, { animate: true, duration: 0.6 }); log('MapController flyTo center ' + JSON.stringify({ center, zoom: 13 })); } catch (e) { console.warn('MapController flyTo center failed', e); onLog && onLog('WARN: MapController flyTo center failed: ' + e.message); }
            try { await new Promise(r => setTimeout(r, 200)); } catch (e) { /* ignore */ }
            try { map.flyToBounds(areaBounds, { animate: true, duration: 0.8 }); log('MapController flyToBounds ' + JSON.stringify(areaBounds)); } catch (e) { console.warn('MapController flyToBounds failed', e); onLog && onLog('WARN: MapController flyToBounds failed: ' + e.message); }
            try { await new Promise(r => setTimeout(r, 300)); } catch (e) { /* ignore */ }
            try { log('MapController final center/zoom ' + JSON.stringify({ center: map.getCenter(), zoom: map.getZoom() })); } catch (e) { /* ignore */ }
            // mark applied
            lastAppliedRef.current.boundsKey = boundsKey;
            lastAppliedRef.current.markerKey = markerKey;
          } else if (focusedMarker) {
            try { map.invalidateSize(); } catch (e) { /* ignore */ }
            try { map.setView(focusedMarker, 13); log('MapController setView focusedMarker ' + JSON.stringify(focusedMarker)); } catch (e) { console.warn('MapController setView focused failed: ' + e.message); }
            try { await new Promise(r => setTimeout(r, 120)); } catch (e) { /* ignore */ }
            try { map.flyTo(focusedMarker, 13, { animate: true, duration: 0.6 }); log('MapController flyTo focusedMarker ' + JSON.stringify(focusedMarker)); } catch (e) { console.warn('MapController flyTo focused failed: ' + e.message); }
            try { log('MapController final center/zoom ' + JSON.stringify({ center: map.getCenter(), zoom: map.getZoom() })); } catch (e) { /* ignore */ }
            lastAppliedRef.current.boundsKey = boundsKey;
            lastAppliedRef.current.markerKey = markerKey;
          }
          onFocused && onFocused();
        } catch (err) {
          try { console.warn('MapController run failed', err); } catch (e) { /* ignore */ }
          try { onLog && onLog('WARN: MapController run failed: ' + (err && err.message ? err.message : String(err))); } catch (e) { /* ignore */ }
        }
      };
      run();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, areaBounds, focusedMarker]);
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let geometry = null;
      if (form.type === 'blockedRoute' && polygonPoints.length > 0) {
        const coords = polygonPoints.map(p => [p[1], p[0]]);
        geometry = { type: 'Polygon', coordinates: [coords] };
      } else {
        const lng = pointMarker ? pointMarker[1] : (form.longitude ? Number(form.longitude) : null);
        const lat = pointMarker ? pointMarker[0] : (form.latitude ? Number(form.latitude) : null);
        if (lat != null && lng != null) {
          geometry = { type: 'Point', coordinates: [Number(lng), Number(lat)] };
        }
      }

      const payload = {
        type: form.type,
        name: form.name,
        status: form.status,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        properties: {
          city: form.city || undefined,
          state: form.state || undefined
        },
        geometry
      };
      if (!geometry) {
        setLoading(false);
        return;
      }
      await createOverlay(payload);
      setForm({ ...form, name: '', capacity: '', latitude: '', longitude: '' });
      setPolygonPoints([]); setPointMarker(null);
      await load();
    } catch (e) {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    await deleteOverlay(id);
    await load();
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Shelters & Resources</h2>
      <p className="text-sm text-gray-600 mb-4">Manage map overlays: shelters, medical camps, depots, blocked routes, advisories.</p>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6">
        <select className="input-field md:col-span-2" value={form.type} onChange={(e) => {
          const t = e.target.value;
          setForm({ ...form, type: t });
          // reset drawing states
          setPolygonPoints([]); setPointMarker(null); setDrawMode(false);
        }}>
          <option value="shelter">Shelter</option>
          <option value="medicalCamp">Medical Camp</option>
          <option value="depot">Supply Depot</option>
          <option value="blockedRoute">Blocked Route</option>
          <option value="advisory">Advisory</option>
        </select>
        <input className="input-field md:col-span-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input-field" placeholder="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
        <input className="input-field" placeholder="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
        <input className="input-field md:col-span-2" placeholder="City (optional)" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input className="input-field md:col-span-2" placeholder="State (optional)" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
        <input className="input-field md:col-span-2" placeholder="Capacity (optional)" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        <select className="input-field md:col-span-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="md:col-span-2 flex items-center gap-2">
          <button type="button" className="button-secondary" onClick={() => {
            // toggle draw mode only for blockedRoute
            if (form.type === 'blockedRoute') setDrawMode(d => !d);
          }}>{form.type === 'blockedRoute' ? (drawMode ? 'Stop Drawing' : 'Start Draw') : 'Map Pick'}</button>
          <button type="button" className="button-secondary" onClick={() => { setPolygonPoints([]); setPointMarker(null); }}>{'Clear'}</button>
          <button className="button-primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Overlay'}</button>
        </div>
      </form>
      {/* Map for picking point or drawing polygon */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">Search by Pincode or City,State to focus the map area before picking locations. Then click the map to place a point or draw a blocked route (Start Draw → click vertices). Click Clear to reset.</div>
        <div className="mb-3 flex gap-2">
          <input placeholder="Pincode or City, State" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field md:col-span-3" />
          <button type="button" className="button-primary" onClick={async () => {
            if (!searchQuery) return alert('Enter pincode or city, state');
            try {
              setSearching(true);
              // Use Nominatim to geocode the query
              const q = encodeURIComponent(searchQuery + ' India');
              const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
              const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
              const data = await resp.json();
              setLastGeocodeResult({ ok: true, payload: data });
              if (data && data.length > 0) {
                const place = data[0];
                // boundingbox: [south, north, west, east]
                if (mapRef.current) {
                  setLastPlace(place);
                  try {
                    console.debug('Nominatim place', place);
                    const doFly = async () => {
                      try {
                        let center = null;
                        if (place.boundingbox) {
                          const south = parseFloat(place.boundingbox[0]);
                          const north = parseFloat(place.boundingbox[1]);
                          const west = parseFloat(place.boundingbox[2]);
                          const east = parseFloat(place.boundingbox[3]);
                          const bounds = [[south, west], [north, east]];
                          setAreaBounds(bounds);
                          center = [(south + north) / 2, (west + east) / 2];
                          // ensure map recenters first so user sees immediate movement
                          try { mapRef.current.setView(center, 11); console.debug('setView ok', center, 11); } catch (e) { console.warn('setView failed', e); }
                          // small wait then try setZoom explicitly
                          await new Promise(r => setTimeout(r, 120));
                          try { mapRef.current.setZoom(11); console.debug('setZoom ok', 11); } catch (e) { console.warn('setZoom failed', e); }
                          await new Promise(r => setTimeout(r, 120));
                          // then try to fit bounds for best framing
                          try { mapRef.current.flyToBounds(bounds, { animate: true, duration: 0.8 }); console.debug('flyToBounds ok', bounds); } catch (e) { console.warn('flyToBounds failed', e); }
                        } else if (place.lat && place.lon) {
                          const lat = parseFloat(place.lat);
                          const lon = parseFloat(place.lon);
                          center = [lat, lon];
                          setAreaBounds([[lat - 0.02, lon - 0.02], [lat + 0.02, lon + 0.02]]);
                          try { mapRef.current.setView(center, 12); console.debug('setView ok', center, 12); } catch (e) { console.warn('setView failed', e); }
                          await new Promise(r => setTimeout(r, 120));
                          try { mapRef.current.setZoom(12); console.debug('setZoom ok', 12); } catch (e) { console.warn('setZoom failed', e); }
                        }
                        if (center) {
                          // show a temporary marker so the user sees the focus
                          setFocusedMarker(center);
                          setTimeout(() => setFocusedMarker(null), 4000);
                        }
                        // give tiles time to refresh and recalc layout
                        setTimeout(() => {
                          try { mapRef.current.invalidateSize(); } catch (e) { /* ignore */ }
                        }, 300);
                        setAreaFocused(true);
                      } catch (err) {
                        console.warn('doFly failed', err);
                        // last-resort fallback: pan to lat/lon if available
                        if (place.lat && place.lon) {
                          try { mapRef.current.panTo([parseFloat(place.lat), parseFloat(place.lon)]); console.debug('panTo ok'); setAreaFocused(true); } catch (ex) { console.warn('fallback panTo failed', ex); }
                        }
                      }
                    };
                    // If map is not fully ready, schedule fly after readiness
                    if (typeof mapRef.current.whenReady === 'function') {
                      mapRef.current.whenReady(() => { doFly(); });
                    } else {
                      // fallback small timeout
                      setTimeout(() => { doFly(); }, 150);
                    }
                    // fill city/state from place.address when available
                    const addr = place.address || {};
                    const city = addr.city || addr.town || addr.village || addr.county || '';
                    const state = addr.state || addr.region || '';
                    setForm(f => ({ ...f, city: city || f.city, state: state || f.state }));
                    // show user confirmation
                    // eslint-disable-next-line no-restricted-globals
                    // do not show confirm unnecessarily; set a visual indicator below
                  } catch (e) {
                    console.error('map focus failed', e);
                    alert('Failed to focus area on map');
                  }
                }
              } else {
                setLastGeocodeResult({ ok: false, message: 'Location not found', payload: data });
                setUiWarning('Location not found — try a broader query (city, state)');
                alert('Location not found');
              }
            } catch (e) {
              console.error('Search failed', e);
              setLastGeocodeResult({ ok: false, message: e.message });
              setUiWarning('Search failed — see debug panel');
              alert('Search failed — see console or debug panel');
            } finally {
              setSearching(false);
            }
          }}>{searching ? 'Searching...' : 'Find Area'}</button>
          <button type="button" className="button-secondary" onClick={() => {
            if (!lastPlace) return alert('Run Find Area first');
            try {
              const place = lastPlace;
              if (place.boundingbox && mapRef.current) {
                const south = parseFloat(place.boundingbox[0]);
                const north = parseFloat(place.boundingbox[1]);
                const west = parseFloat(place.boundingbox[2]);
                const east = parseFloat(place.boundingbox[3]);
                const bounds = [[south, west], [north, east]];
                try { mapRef.current.setView([(south + north) / 2, (west + east) / 2], 13); } catch (e) { console.warn(e); }
                try { mapRef.current.flyToBounds(bounds, { animate: true, duration: 0.6 }); } catch (e) { console.warn(e); }
                setAreaBounds(bounds); setAreaFocused(true);
              } else if (place.lat && place.lon && mapRef.current) {
                const lat = parseFloat(place.lat); const lon = parseFloat(place.lon);
                try { mapRef.current.setView([lat, lon], 13); } catch (e) { console.warn(e); }
                setAreaBounds([[lat - 0.02, lon - 0.02], [lat + 0.02, lon + 0.02]]);
                setAreaFocused(true);
              }
            } catch (e) {
              console.warn('force focus failed', e);
              alert('Force focus failed — see console');
            }
          }}>{'Force Focus'}</button>
          <button type="button" className="button-secondary" onClick={() => { setAreaFocused(false); setPolygonPoints([]); setPointMarker(null); }}>{'Reset Area'}</button>
        </div>
        <div style={{ height: 300 }} className="rounded overflow-hidden">
          <MapContainer center={defaultCenter} zoom={5} style={{ height: '100%', width: '100%' }} whenCreated={(m) => { mapRef.current = m }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler mode={form.type === 'blockedRoute' && drawMode ? 'blockedRoute' : (form.type === 'blockedRoute' ? 'none' : 'point')} />
            <MapController areaBounds={areaBounds} focusedMarker={focusedMarker} onFocused={() => { setUiWarning(null); }} onLog={pushMapLog} />
            {/* show focused area rectangle when available */}
            {areaBounds && (
              <>
                <Polygon positions={[[areaBounds[0][0], areaBounds[0][1]],[areaBounds[0][0], areaBounds[1][1]],[areaBounds[1][0], areaBounds[1][1]],[areaBounds[1][0], areaBounds[0][1]]]} pathOptions={{ color: 'blue', dashArray: '4', weight: 2, fillOpacity: 0.05 }} />
              </>
            )}
            {/* show polygon points if drawing or existing */}
            {polygonPoints.length > 0 && (
              <Polygon positions={polygonPoints} pathOptions={{ color: 'red', fillOpacity: 0.2 }} />
            )}
            {pointMarker && (
              <Marker position={pointMarker} />
            )}
            {focusedMarker && (
              <Marker position={focusedMarker}>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
      {/* debug panel for geocode (visible while investigating) */}
      <div className="mb-3">
        {uiWarning && <div className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded">{uiWarning}</div>}
        {lastGeocodeResult && (
          <details className="mt-2 text-xs text-gray-600">
            <summary className="cursor-pointer">Geocode debug (click to expand)</summary>
            <pre className="whitespace-pre-wrap">{JSON.stringify(lastGeocodeResult, null, 2)}</pre>
          </details>
        )}
        {mapLogs.length > 0 && (
          <details className="mt-2 text-xs text-gray-600">
            <summary className="cursor-pointer">Map logs (click to expand)</summary>
            <pre className="whitespace-pre-wrap">{mapLogs.join('\n')}</pre>
          </details>
        )}
      </div>
      {/* area focused badge */}
      {areaFocused && (
        <div className="mb-4">
          <div className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded">Area focused {form.city || ''}{form.state ? `, ${form.state}` : ''}</div>
          <button className="button-secondary ml-3" onClick={() => { setAreaFocused(false); setAreaBounds(null); }}>{'Clear Focus'}</button>
        </div>
      )}
      <div className="list-grid">
        {(items || []).map(item => (
          <div key={item._id} className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{item.name}</div>
              <span className="badge-status pending">{item.type}</span>
            </div>
            <div className="text-sm text-gray-700">
              <div>Status: {item.status || '—'} {typeof item.capacity === 'number' ? `• Capacity: ${item.capacity}` : ''}</div>
              {item.properties?.city && <div>City: {item.properties.city}</div>}
              {item.properties?.state && <div>State: {item.properties.state}</div>}
              {item.geometry?.type === 'Point' && item.geometry?.coordinates && (
                <div>Coords: {item.geometry.coordinates[1]?.toFixed(5)}, {item.geometry.coordinates[0]?.toFixed(5)}</div>
              )}
              {item.geometry?.type === 'Polygon' && Array.isArray(item.geometry.coordinates) && (
                <div className="text-xs text-gray-500">Blocked area: polygon with {item.geometry.coordinates[0].length} vertices</div>
              )}
            </div>
            <div className="mt-3">
              <button className="button-secondary" onClick={() => onDelete(item._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShelterManagement;

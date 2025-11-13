import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import './authority.css';
import { listOverlays, createOverlay, deleteOverlay } from '../../api/authority';
import { MapContainer, TileLayer, Marker, CircleMarker, Polygon, Popup, useMapEvents, useMap } from 'react-leaflet';

const ShelterManagement = ({ overlays = null, onOverlayChange = null }) => {
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
  const [quickAddMode, setQuickAddMode] = useState(false); // when true, clicking map auto-adds overlay
  const [areaFocused, setAreaFocused] = useState(false);
  const [areaBounds, setAreaBounds] = useState(null); // [[south,west],[north,east]] or null
  const [focusedMarker, setFocusedMarker] = useState(null); // [lat, lng]
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [lastGeocodeResult, setLastGeocodeResult] = useState(null);
  const [uiWarning, setUiWarning] = useState(null);
  const [lastPlace, setLastPlace] = useState(null);
  const mapRef = useRef(null);
  const formRef = useRef(form);
  const [mapLogs, setMapLogs] = useState([]);
  const pushMapLog = (msg) => setMapLogs(prev => [...prev, `${new Date().toISOString()} ${msg}`].slice(-50));
  
  // Keep formRef in sync with form state
  useEffect(() => {
    formRef.current = form;
  }, [form]);
  
  // Memoize callbacks to prevent infinite loops
  const handleMapFocused = useCallback(() => {
    setUiWarning(null);
  }, []);

  const load = useCallback(async () => {
    // Always fetch from API to get fresh data
    try {
      const res = await listOverlays();
      setItems(res.items || []);
    } catch (e) {
      // Fallback to overlays prop if API fails
      if (overlays) {
        const list = [];
        ['shelters','medicalCamps','depots','blockedRoutes','advisories'].forEach(k => {
          const arr = overlays[k] || [];
          arr.forEach(a => list.push(a));
        });
        setItems(list);
      } else {
        setItems([]);
      }
    }
  }, [overlays]);

  useEffect(() => { load(); }, [load]);

  // Convenience: default map center (India)
  const defaultCenter = [22.5937, 78.9629];

  // Quick add overlay function - creates overlay immediately on map click
  const quickAddOverlay = useCallback(async (lat, lng) => {
    const currentForm = formRef.current;
    if (!currentForm.type || currentForm.type === 'blockedRoute') return; // blockedRoute needs polygon drawing
    
    try {
      setLoading(true);
      const geometry = { type: 'Point', coordinates: [Number(lng), Number(lat)] };
      
      // Generate default name if not provided
      const defaultName = currentForm.name || `${currentForm.type} at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      
      const payload = {
        type: currentForm.type,
        name: defaultName,
        status: currentForm.status || 'open',
        capacity: currentForm.capacity ? Number(currentForm.capacity) : undefined,
        properties: {
          city: currentForm.city || undefined,
          state: currentForm.state || undefined
        },
        geometry
      };
      
      // Create overlay
      const result = await createOverlay(payload);
      
      // Optimistic update - add to local state immediately for instant feedback
      let newItem = null;
      if (result && (result.item || result.overlay)) {
        newItem = result.item || result.overlay;
      } else if (result && result._id) {
        // If API returns the created item directly
        newItem = result;
      } else {
        // Construct temporary item from payload for instant feedback
        newItem = {
          ...payload,
          _id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
      }
      if (newItem) {
        setItems(prev => [...prev, newItem]);
      }
      
      // Keep form type and status, but clear location-specific fields
      setForm(f => ({ ...f, latitude: '', longitude: '' }));
      setPointMarker(null);
      
      // Notify parent to refresh - it will update both maps efficiently
      if (onOverlayChange) {
        // Don't await - let it run in background while UI updates instantly
        onOverlayChange().then(() => {
          // Refresh local state after parent updates to ensure sync
          load();
        }).catch(() => {
          // If parent refresh fails, still refresh local state
          load();
        });
      } else {
        // If no parent callback, just refresh local
        await load();
      }
    } catch (e) {
      console.error('Quick add failed', e);
      alert('Failed to add overlay');
      // Reload on error to sync state
      await load();
    } finally {
      setLoading(false);
    }
  }, [load, onOverlayChange]);

  const MapClickHandler = ({ mode, quickAdd }) => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        if (!areaFocused) {
          // allow pick but surface a UI warning so operator understands the scope
          setUiWarning('Map not focused — your pick may be outside the intended area. Use Find Area to scope.');
        } else {
          setUiWarning(null);
        }
        
        if (quickAdd && mode === 'point') {
          // Quick add mode - immediately create overlay
          quickAddOverlay(lat, lng);
        } else if (mode === 'blockedRoute') {
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
    const isRunningRef = useRef(false);
    
    useEffect(() => {
      if (!map) return;
      if (isRunningRef.current) return; // Prevent concurrent runs
      
      const run = async () => {
        try {
          isRunningRef.current = true;
          // expose map instance for outside debugging
          try { mapRef.current = map; } catch (e) { /* ignore */ }
          
          // avoid reapplying same bounds/marker repeatedly
          const boundsKey = areaBounds ? JSON.stringify(areaBounds) : null;
          const markerKey = focusedMarker ? JSON.stringify(focusedMarker) : null;
          
          // If both are null and we've already applied null, don't do anything (prevent zoom out)
          if (!boundsKey && !markerKey) {
            if (lastAppliedRef.current.boundsKey === null && lastAppliedRef.current.markerKey === null) {
              isRunningRef.current = false;
              return;
            }
            // If we had bounds/marker before and now both are null, just update ref but don't move map
            lastAppliedRef.current.boundsKey = null;
            lastAppliedRef.current.markerKey = null;
            isRunningRef.current = false;
            return;
          }
          
          if (boundsKey === lastAppliedRef.current.boundsKey && markerKey === lastAppliedRef.current.markerKey) {
            isRunningRef.current = false;
            return;
          }

          if (areaBounds) {
            const center = [(areaBounds[0][0] + areaBounds[1][0]) / 2, (areaBounds[0][1] + areaBounds[1][1]) / 2];
            try { map.invalidateSize(); } catch (e) { /* ignore */ }
            // Use setView with maxZoom to prevent zooming out too far
            const currentZoom = map.getZoom();
            const targetZoom = Math.max(13, currentZoom); // Don't zoom out, only zoom in if needed
            try { map.setView(center, targetZoom); } catch (e) { console.warn('MapController setView failed', e); }
            try { await new Promise(r => setTimeout(r, 100)); } catch (e) { /* ignore */ }
            try { map.flyToBounds(areaBounds, { animate: true, duration: 0.6, maxZoom: 15 }); } catch (e) { console.warn('MapController flyToBounds failed', e); }
            // mark applied
            lastAppliedRef.current.boundsKey = boundsKey;
            lastAppliedRef.current.markerKey = markerKey;
          } else if (focusedMarker) {
            try { map.invalidateSize(); } catch (e) { /* ignore */ }
            const currentZoom = map.getZoom();
            const targetZoom = Math.max(13, currentZoom); // Don't zoom out, only zoom in if needed
            try { map.setView(focusedMarker, targetZoom, { animate: true }); } catch (e) { console.warn('MapController setView focused failed: ' + e.message); }
            lastAppliedRef.current.boundsKey = boundsKey;
            lastAppliedRef.current.markerKey = markerKey;
          }
          
          // Call onFocused only once after movement completes
          if (onFocused && (areaBounds || focusedMarker)) {
            setTimeout(() => {
              try { onFocused(); } catch (e) { /* ignore */ }
            }, 400);
          }
        } catch (err) {
          try { console.warn('MapController run failed', err); } catch (e) { /* ignore */ }
        } finally {
          isRunningRef.current = false;
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
      
      // Create overlay
      const result = await createOverlay(payload);
      
      // Optimistic update - add to local state immediately for instant feedback
      let newItem = null;
      if (result && (result.item || result.overlay)) {
        newItem = result.item || result.overlay;
      } else if (result && result._id) {
        // If API returns the created item directly
        newItem = result;
      } else {
        // Construct temporary item from payload for instant feedback
        newItem = {
          ...payload,
          _id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
      }
      if (newItem) {
        setItems(prev => [...prev, newItem]);
      }
      
      // Clear form
      setForm({ ...form, name: '', capacity: '', latitude: '', longitude: '' });
      setPolygonPoints([]); 
      setPointMarker(null);
      
      // Notify parent to refresh - it will update both maps efficiently
      if (onOverlayChange) {
        // Don't await - let it run in background while UI updates instantly
        onOverlayChange().then(() => {
          // Refresh local state after parent updates to ensure sync
          load();
        }).catch(() => {
          // If parent refresh fails, still refresh local state
          load();
        });
      } else {
        // If no parent callback, just refresh local
        await load();
      }
    } catch (e) {
      console.error('Failed to add overlay', e);
      // Reload on error to sync state
      await load();
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    await deleteOverlay(id);
    await load();
    // Notify parent to refresh map data
    if (onOverlayChange) {
      onOverlayChange();
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Shelters & Resources</h2>
      <p className="text-sm text-gray-600 mb-4">Manage map overlays: shelters, medical camps, depots, blocked routes, advisories.</p>

      {/* Quick Add Mode Indicator */}
      {quickAddMode && form.type && form.type !== 'blockedRoute' && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-green-800">
                Quick Add Mode: Click anywhere on the map to add {form.type}
              </span>
            </div>
            <button 
              type="button" 
              className="text-sm text-green-700 hover:text-green-900 underline"
              onClick={() => setQuickAddMode(false)}
            >
              Disable
            </button>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6">
        <select className="input-field md:col-span-2" value={form.type} onChange={(e) => {
          const t = e.target.value;
          setForm({ ...form, type: t });
          // reset drawing states
          setPolygonPoints([]); setPointMarker(null); setDrawMode(false);
          // Auto-enable quick add for point-based types
          if (t !== 'blockedRoute') {
            setQuickAddMode(true);
          } else {
            setQuickAddMode(false);
          }
        }}>
          <option value="shelter">Shelter</option>
          <option value="medicalCamp">Medical Camp</option>
          <option value="depot">Supply Depot</option>
          <option value="blockedRoute">Blocked Route</option>
          <option value="advisory">Advisory</option>
        </select>
        <input className="input-field md:col-span-2" placeholder="Name (optional - auto-generated if empty)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
        <div className="md:col-span-6 flex items-center gap-2 flex-wrap">
          {form.type !== 'blockedRoute' && (
            <button 
              type="button" 
              className={`button-secondary ${quickAddMode ? 'bg-green-100 text-green-800 border-green-300' : ''}`}
              onClick={() => setQuickAddMode(!quickAddMode)}
            >
              {quickAddMode ? '✓ Quick Add ON' : 'Quick Add OFF'}
            </button>
          )}
          {form.type === 'blockedRoute' && (
            <button type="button" className="button-secondary" onClick={() => {
              setDrawMode(d => !d);
            }}>{drawMode ? 'Stop Drawing' : 'Start Draw'}</button>
          )}
          <button type="button" className="button-secondary" onClick={() => { 
            setPolygonPoints([]); 
            setPointMarker(null); 
          }}>{'Clear'}</button>
          <button className="button-primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Overlay (Manual)'}</button>
        </div>
      </form>
      {/* Map for picking point or drawing polygon */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          {quickAddMode && form.type !== 'blockedRoute' ? (
            <>Quick Add Mode is ON - Click anywhere on the map to add {form.type}. Use "Find Area" to focus the map first.</>
          ) : (
            <>Search by Pincode or City,State to focus the map area before picking locations. Then click the map to place a point or draw a blocked route (Start Draw → click vertices). Click Clear to reset.</>
          )}
        </div>
        <div className="mb-3 flex gap-2">
          <input placeholder="Pincode or City, State" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field md:col-span-3" />
          <button type="button" className="button-primary" onClick={async () => {
            if (!searchQuery) return alert('Enter pincode or city, state');
            try {
              setSearching(true);
              setUiWarning(null);
              // Use Nominatim to geocode the query
              const q = encodeURIComponent(searchQuery + ' India');
              const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
              const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
              const data = await resp.json();
              setLastGeocodeResult({ ok: true, payload: data });
              if (data && data.length > 0) {
                const place = data[0];
                setLastPlace(place);
                
                // Calculate bounds and center - let MapController handle the map movement
                let bounds = null;
                let center = null;
                
                if (place.boundingbox) {
                  const south = parseFloat(place.boundingbox[0]);
                  const north = parseFloat(place.boundingbox[1]);
                  const west = parseFloat(place.boundingbox[2]);
                  const east = parseFloat(place.boundingbox[3]);
                  bounds = [[south, west], [north, east]];
                  center = [(south + north) / 2, (west + east) / 2];
                } else if (place.lat && place.lon) {
                  const lat = parseFloat(place.lat);
                  const lon = parseFloat(place.lon);
                  center = [lat, lon];
                  bounds = [[lat - 0.02, lon - 0.02], [lat + 0.02, lon + 0.02]];
                }
                
                if (bounds && center) {
                  // Set bounds - MapController will handle the map movement
                  setAreaBounds(bounds);
                  // Show temporary marker
                  setFocusedMarker(center);
                  // Clear marker after animation completes
                  setTimeout(() => {
                    setFocusedMarker(null);
                  }, 3000);
                  setAreaFocused(true);
                  
                  // Fill city/state from place.address when available
                  const addr = place.address || {};
                  const city = addr.city || addr.town || addr.village || addr.county || '';
                  const state = addr.state || addr.region || '';
                  setForm(f => ({ ...f, city: city || f.city, state: state || f.state }));
                } else {
                  setLastGeocodeResult({ ok: false, message: 'Invalid location data', payload: data });
                  setUiWarning('Invalid location data — try a different query');
                  alert('Invalid location data');
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
              let bounds = null;
              let center = null;
              
              if (place.boundingbox) {
                const south = parseFloat(place.boundingbox[0]);
                const north = parseFloat(place.boundingbox[1]);
                const west = parseFloat(place.boundingbox[2]);
                const east = parseFloat(place.boundingbox[3]);
                bounds = [[south, west], [north, east]];
                center = [(south + north) / 2, (west + east) / 2];
              } else if (place.lat && place.lon) {
                const lat = parseFloat(place.lat);
                const lon = parseFloat(place.lon);
                center = [lat, lon];
                bounds = [[lat - 0.02, lon - 0.02], [lat + 0.02, lon + 0.02]];
              }
              
              if (bounds && center) {
                setAreaBounds(bounds);
                setFocusedMarker(center);
                setTimeout(() => setFocusedMarker(null), 3000);
                setAreaFocused(true);
              }
            } catch (e) {
              console.warn('force focus failed', e);
              alert('Force focus failed — see console');
            }
          }}>{'Force Focus'}</button>
          <button type="button" className="button-secondary" onClick={() => { 
            setAreaFocused(false); 
            setAreaBounds(null);
            setFocusedMarker(null);
            setPolygonPoints([]); 
            setPointMarker(null); 
          }}>{'Reset Area'}</button>
        </div>
        <div style={{ height: 300 }} className="rounded overflow-hidden">
          <MapContainer center={defaultCenter} zoom={5} style={{ height: '100%', width: '100%' }} whenCreated={(m) => { mapRef.current = m }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler 
              mode={form.type === 'blockedRoute' && drawMode ? 'blockedRoute' : (form.type === 'blockedRoute' ? 'none' : 'point')} 
              quickAdd={quickAddMode && form.type !== 'blockedRoute'}
            />
            <MapController areaBounds={areaBounds} focusedMarker={focusedMarker} onFocused={handleMapFocused} onLog={pushMapLog} />
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
            {/* Show existing overlays on map - using CircleMarker to match Heatmap */}
            {items.map(item => {
              if (item.geometry?.type === 'Point' && item.geometry?.coordinates) {
                const [lng, lat] = item.geometry.coordinates;
                // Color scheme matching Heatmap component
                const colorMap = {
                  shelter: { color: '#2563eb', fillColor: '#93c5fd' },
                  medicalCamp: { color: '#16a34a', fillColor: '#86efac' },
                  depot: { color: '#7c3aed', fillColor: '#c4b5fd' },
                  blockedRoute: { color: '#dc2626', fillColor: '#fecaca' },
                  advisory: { color: '#f59e0b', fillColor: '#fde68a' }
                };
                const colors = colorMap[item.type] || { color: '#6b7280', fillColor: '#d1d5db' };
                return (
                  <CircleMarker 
                    key={item._id} 
                    center={[lat, lng]} 
                    radius={10} 
                    pathOptions={{ 
                      color: colors.color, 
                      fillColor: colors.fillColor, 
                      fillOpacity: 0.7 
                    }}
                  >
                    <Popup>
                      <div>
                        <strong>{item.name}</strong>
                        <div>Type: {item.type}</div>
                        <div>Status: {item.status || '—'}</div>
                        {typeof item.capacity === 'number' && <div>Capacity: {item.capacity}</div>}
                        {item.properties?.city && <div>City: {item.properties.city}</div>}
                        {item.properties?.state && <div>State: {item.properties.state}</div>}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              } else if (item.geometry?.type === 'Polygon' && item.geometry?.coordinates) {
                const ring = item.geometry.coordinates[0] || [];
                const latlngs = ring.map(([lng, lat]) => [lat, lng]);
                return (
                  <Polygon key={item._id} positions={latlngs} pathOptions={{ color: '#dc2626', fillOpacity: 0.15 }}>
                    <Popup>
                      <div>
                        <strong>{item.name}</strong>
                        <div>Type: {item.type}</div>
                        <div>Status: {item.status || 'blocked'}</div>
                      </div>
                    </Popup>
                  </Polygon>
                );
              }
              return null;
            })}
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

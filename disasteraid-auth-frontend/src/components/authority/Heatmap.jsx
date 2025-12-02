import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, CircleMarker, Popup, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './authority.css';
import API from '../../api/axios';

const Heatmap = ({ points = [], overlays = null }) => {
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
        await import('leaflet.heat'); // dynamic import may fail if package not installed; that's fine
        if (!cancelled && L && L.heatLayer) {
          setHeatAvailable(true);
        }
      } catch (err) {
        setHeatAvailable(false); // plugin not present; heatmap won't be used now
      }
    };
    tryLoad();
    return () => { cancelled = true; };
  }, []);

  // Fetch map data only if overlays not provided by parent
  useEffect(() => {
    // If parent provided a non-empty overlays object, don't fetch here.
    if (overlays && Object.keys(overlays).length > 0) return; // parent provided overlays

    const controller = new AbortController();
    async function fetchMap() {
      try {
        // Prefer authority-specific combined endpoint (tickets + overlays)
        try {
          const res = await API.get('/authority/map', { signal: controller.signal });
          if (res.data && res.data.success) {
            setMapData(res.data);
            return;
          }
        } catch (err) {
          // /authority/map may fail if user isn't authorized; fallthrough to tickets
        }

        // Fallback to tickets endpoint (convert to GeoJSON FeatureCollection)
        try {
          const resTickets = await API.get('/tickets', { signal: controller.signal });
          if (resTickets.data && resTickets.data.success) {
            const tickets = resTickets.data.tickets || [];
            const features = tickets.map(t => {
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

            const ticketsFC = { type: 'FeatureCollection', features };
            setMapData({ tickets: ticketsFC, overlays: {} });
            return;
          }
        } catch (err) {
          // ignore
        }
      } catch (e) {
        // ignore
      }
    }
    fetchMap();
    return () => controller.abort();
  }, [overlays]);

  const heatLatLngs = useMemo(() => (points || []).map(p => [p.lat, p.lng, p.intensity || 0.5]), [points]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!heatAvailable || !L?.heatLayer) return;
    if (heatRef.current) {
      try { heatRef.current.remove(); } catch (e) { }
    }
    heatRef.current = L.heatLayer(heatLatLngs, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
  }, [heatAvailable, heatLatLngs]);

  // Default center (India) and zoom
  const center = [22.5937, 78.9629];

  // derive points from either passed prop, or mapData tickets
  const apiPoints = useMemo(() => (mapData?.tickets?.features || []).map(f => {
    const [lng, lat] = f.geometry.coordinates || [];
    const props = f.properties || {};
    return {
      lat, lng,
      intensity: props.isSOS ? 1.0 : 0.6,
      label: `${props.ticketId} — ${props.status}${props.assignedTo?.organizationName ? ' • ' + props.assignedTo.organizationName : ''}`
    };
  }), [mapData]);

  const displayPoints = (points && points.length) ? points : (apiPoints.length ? apiPoints : []);

  // helper to safely obtain an overlay list for a given key
  const getOverlayList = (key) => {
    // Debug logs to trace data flow
    // console.log(`Heatmap getOverlayList(${key}):`, { 
    //   hasOverlaysProp: !!overlays, 
    //   propValue: overlays ? overlays[key] : 'N/A',
    //   hasMapData: !!mapData,
    //   mapDataValue: mapData?.overlays ? mapData.overlays[key] : 'N/A' 
    // });

    if (overlays && Array.isArray(overlays[key])) return overlays[key];
    if (mapData && mapData.overlays && Array.isArray(mapData.overlays[key])) return mapData.overlays[key];
    return [];
  };

  const createDotIcon = (color = '#2563eb', size = 12) => L.divIcon({
    className: '',
    html: `<span class="resource-dot" style="--dot-color:${color};width:${size}px;height:${size}px"><span class="resource-core"></span></span>`,
    iconSize: [size, size],
    iconAnchor: [Math.round(size / 2), Math.round(size / 2)]
  });

  // === Zone aggregation for disaster-prone area marking ===
  // Combine tickets from parent/props and from API (mapData) to ensure we include all tickets
  const allTicketPoints = useMemo(() => {
    const list = [];
    // from mapData GeoJSON features (authority/map)
    if (mapData && mapData.tickets && Array.isArray(mapData.tickets.features)) {
      mapData.tickets.features.forEach((f) => {
        const coords = f.geometry?.coordinates || [];
        if (!coords || coords.length < 2) return;
        const [lng, lat] = coords;
        const props = f.properties || {};
        list.push({ lat, lng, isSOS: !!props.isSOS, status: props.status || 'unknown', ticketId: props.ticketId || null });
      });
    }

    // from explicit points prop (passed from parent)
    if (points && Array.isArray(points)) {
      points.forEach((p, i) => {
        if (p.lat == null || p.lng == null) return;
        list.push({ lat: p.lat, lng: p.lng, isSOS: !!p.intensity && p.intensity > 0.8, status: p.props?.status || 'unknown', ticketId: p.props?.ticketId || `prop-${i}` });
      });
    }

    // de-duplicate by ticketId or coords
    const seen = new Map();
    const out = [];
    list.forEach(pt => {
      const key = pt.ticketId ? `id:${pt.ticketId}` : `c:${pt.lat.toFixed(6)}_${pt.lng.toFixed(6)}`;
      if (!seen.has(key)) {
        seen.set(key, true);
        out.push(pt);
      }
    });
    return out;
  }, [mapData, points]);

  // Create grid aggregation for zones
  const zoneConfig = useMemo(() => {
    const cellSize = 0.2; // degrees (~22km) — adjust for desired granularity
    const dangerThreshold = 5; // >= count -> danger
    const cautiousThreshold = 2; // >= count -> cautious

    const cells = new Map();
    allTicketPoints.forEach(p => {
      if (p.lat == null || p.lng == null) return;
      const keyX = Math.floor(p.lat / cellSize);
      const keyY = Math.floor(p.lng / cellSize);
      const key = `${keyX}_${keyY}`;
      const cell = cells.get(key) || { count: 0, latSum: 0, lngSum: 0, keyX, keyY };
      cell.count += 1;
      cell.latSum += p.lat;
      cell.lngSum += p.lng;
      cells.set(key, cell);
    });

    const zones = [];
    for (const [k, cell] of cells.entries()) {
      const centerLat = cell.latSum / cell.count;
      const centerLng = cell.lngSum / cell.count;
      let zone = 'safe';
      let color = '#16a34a';
      if (cell.count >= dangerThreshold) { zone = 'danger'; color = '#dc2626'; }
      else if (cell.count >= cautiousThreshold) { zone = 'cautious'; color = '#f97316'; }
      zones.push({ key: k, count: cell.count, lat: centerLat, lng: centerLng, zone, color });
    }

    return { cellSize, zones, dangerThreshold, cautiousThreshold };
  }, [allTicketPoints]);

  // distance helper (Haversine) - returns km
  const distanceKm = (a, b) => {
    if (!a || !b) return Infinity;
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // Earth radius km
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const aa = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  };

  // For each ticket point compute local counts within radii for frequency-based opacity
  const ticketLocalCounts = useMemo(() => {
    const pts = allTicketPoints || [];
    const out = pts.map(p => {
      const center = { lat: p.lat, lng: p.lng };
      let c7 = 0, c10 = 0, c20 = 0;
      for (const q of pts) {
        const d = distanceKm(center, { lat: q.lat, lng: q.lng });
        if (d <= 7) c7++;
        if (d <= 10) c10++;
        if (d <= 20) c20++;
      }
      return { ...p, c7, c10, c20 };
    });
    return out;
  }, [allTicketPoints]);

  // Attempt to compute merged zone polygons using turf (dynamic import).
  const [mergedZones, setMergedZones] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (!allTicketPoints || allTicketPoints.length === 0) {
      setMergedZones(null);
      return;
    }

    (async () => {
      try {
        const turf = await import('@turf/turf');

        // helper to union an array of polygons (returns null if none)
        const unionAll = (arr) => {
          if (!arr || arr.length === 0) return null;
          return arr.reduce((acc, geom) => {
            if (!acc) return geom;
            try {
              return turf.union(acc, geom);
            } catch (e) {
              // if union fails for a pair, try to continue
              return acc;
            }
          }, null);
        };

        // Build buffers for each radius
        const pts = allTicketPoints.map(p => turf.point([p.lng, p.lat]));
        const buffers7 = pts.map(pt => turf.buffer(pt, 7, { units: 'kilometers' }));
        const buffers10 = pts.map(pt => turf.buffer(pt, 10, { units: 'kilometers' }));
        const buffers20 = pts.map(pt => turf.buffer(pt, 20, { units: 'kilometers' }));

        const union7 = unionAll(buffers7);
        const union10 = unionAll(buffers10);
        const union20 = unionAll(buffers20);

        const cautious = (union10 && union7) ? turf.difference(union10, union7) : (union10 || null);
        const outOfDanger = (union20 && union10) ? turf.difference(union20, union10) : (union20 || null);

        if (!cancelled) setMergedZones({ danger: union7 || null, cautious: cautious || null, outOfDanger: outOfDanger || null });
      } catch (e) {
        // turf not available or failed - just skip merged zones
        if (!cancelled) setMergedZones(null);
      }
    })();

    return () => { cancelled = true; };
  }, [allTicketPoints]);

  // helper to convert GeoJSON Polygon / MultiPolygon to Leaflet positions
  const geojsonToLatLngs = (feature) => {
    if (!feature || !feature.geometry) return [];
    const { type, coordinates } = feature.geometry;
    if (!coordinates) return [];
    if (type === 'Polygon') {
      // coordinates: [ [ [lng, lat], ... ] ]
      return coordinates.map(ring => ring.map(([lng, lat]) => [lat, lng]));
    }
    if (type === 'MultiPolygon') {
      // coordinates: [ [ [ [lng, lat], ... ] ], ... ]
      return coordinates.flatMap(poly => poly.map(ring => ring.map(([lng, lat]) => [lat, lng])));
    }
    return [];
  };

  return (
    <div>
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

      <div style={{ height: 820, borderRadius: 12, overflow: 'hidden' }}>
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
          {(overlays || mapData?.overlays) && (
            <>
              {layers.shelters && getOverlayList('shelters').map(o => {
                if (o.geometry?.type === 'Point') {
                  const [lng, lat] = o.geometry.coordinates || [];
                  return (
                    <Marker key={o._id} position={[lat, lng]} icon={createDotIcon('#2563eb', 12)}>
                      <Popup>
                        <div>
                          <strong>Shelter: {o.name}</strong>
                          <div>Status: {o.status || '—'}</div>
                          {'capacity' in o ? <div>Capacity: {o.capacity}</div> : null}
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}

              {layers.medicalCamps && getOverlayList('medicalCamps').map(o => {
                if (o.geometry?.type === 'Point') {
                  const [lng, lat] = o.geometry.coordinates || [];
                  return (
                    <Marker key={o._id} position={[lat, lng]} icon={createDotIcon('#16a34a', 12)}>
                      <Popup>
                        <div>
                          <strong>Medical Camp: {o.name}</strong>
                          <div>Status: {o.status || '—'}</div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}

              {layers.depots && getOverlayList('depots').map(o => {
                if (o.geometry?.type === 'Point') {
                  const [lng, lat] = o.geometry.coordinates || [];
                  return (
                    <Marker key={o._id} position={[lat, lng]} icon={createDotIcon('#7c3aed', 12)}>
                      <Popup>
                        <div>
                          <strong>Depot: {o.name}</strong>
                          <div>Status: {o.status || '—'}</div>
                          {'capacity' in o ? <div>Capacity: {o.capacity}</div> : null}
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}

              {layers.blockedRoutes && getOverlayList('blockedRoutes').map(o => {
                if (o.geometry?.type === 'LineString') {
                  const latlngs = (o.geometry.coordinates || []).map(([lng, lat]) => [lat, lng]);
                  return (
                    <Polyline key={o._id} positions={latlngs} pathOptions={{ color: '#dc2626', weight: 5, opacity: 0.9 }} />
                  );
                }
                if (o.geometry?.type === 'Polygon') {
                  // geometry.coordinates is [ [ [lng,lat], ... ] ]
                  const ring = (o.geometry.coordinates && o.geometry.coordinates[0]) || [];
                  const latlngs = ring.map(([lng, lat]) => [lat, lng]);
                  return (
                    <Polygon key={o._id} pathOptions={{ color: '#dc2626', fillOpacity: 0.15 }} positions={latlngs} />
                  );
                }
                if (o.geometry?.type === 'Point') {
                  const [lng, lat] = o.geometry.coordinates || [];
                  return (
                    <Marker key={o._id} position={[lat, lng]} icon={createDotIcon('#dc2626', 12)}>
                      <Popup>
                        <div>
                          <strong>Blocked Route: {o.name}</strong>
                          <div>Status: {o.status || 'blocked'}</div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}

              {layers.advisories && getOverlayList('advisories').map(o => {
                if (o.geometry?.type === 'Point') {
                  const [lng, lat] = o.geometry.coordinates || [];
                  return (
                    <Marker key={o._id} position={[lat, lng]} icon={createDotIcon('#f59e0b', 10)}>
                      <Popup>
                        <div>
                          <strong>Advisory: {o.name}</strong>
                          <div>{o.status || 'active'}</div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}
            </>
          )}

          {/* Disaster zones derived from ticket density */}
          {/* If turf merged polygons are available, render them (unioned buffers). Otherwise fallback to per-ticket circles. */}
          {mergedZones ? (
            <>
              {mergedZones.outOfDanger && geojsonToLatLngs(mergedZones.outOfDanger).map((ring, i) => (
                <Polygon key={`out-${i}`} positions={ring} pathOptions={{ color: '#1e3a8a', fillColor: '#3b82f6', fillOpacity: 0.20, weight: 0 }} />
              ))}
              {mergedZones.cautious && geojsonToLatLngs(mergedZones.cautious).map((ring, i) => (
                <Polygon key={`caut-${i}`} positions={ring} pathOptions={{ color: '#b45309', fillColor: '#f59e0b', fillOpacity: 0.28, weight: 0 }} />
              ))}
              {mergedZones.danger && geojsonToLatLngs(mergedZones.danger).map((ring, i) => (
                <Polygon key={`dang-${i}`} positions={ring} pathOptions={{ color: '#7f1d1d', fillColor: '#b91c1c', fillOpacity: 0.35, weight: 0 }} />
              ))}
            </>
          ) : (
            ticketLocalCounts && ticketLocalCounts.map((t, idx) => {
              // Render outer -> inner so inner color overrides (20km, 10km, 7km)
              const opacity20 = Math.min(0.06 + (t.c20 || 0) * 0.02, 0.28);
              const opacity10 = Math.min(0.08 + (t.c10 || 0) * 0.03, 0.36);
              const opacity7 = Math.min(0.12 + (t.c7 || 0) * 0.04, 0.6);
              return (
                <React.Fragment key={`zone-${idx}-${t.lat}-${t.lng}`}>
                  <Circle center={[t.lat, t.lng]} radius={20000} pathOptions={{ color: '#1e3a8a', fillColor: '#3b82f6', fillOpacity: opacity20, weight: 0 }} />
                  <Circle center={[t.lat, t.lng]} radius={10000} pathOptions={{ color: '#b45309', fillColor: '#f59e0b', fillOpacity: opacity10, weight: 0 }} />
                  <Circle center={[t.lat, t.lng]} radius={7000} pathOptions={{ color: '#7f1d1d', fillColor: '#b91c1c', fillOpacity: opacity7, weight: 0 }} />
                </React.Fragment>
              );
            })
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default Heatmap;

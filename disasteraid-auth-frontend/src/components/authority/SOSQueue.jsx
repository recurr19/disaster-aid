import React, { useEffect, useState } from 'react';
import './authority.css';
import API from '../../api/axios';
import { getTrackerStatus } from '../../api/tracker';
// Render minimal inline details for SOS cards (fetch coords on expand if missing)

const SOSQueue = ({ tickets }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loadingMap, setLoadingMap] = useState({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        let sosList = [];

        // If parent provided tickets (FeatureCollection or array), use that to avoid fetching
        if (tickets) {
          const features = tickets.type === 'FeatureCollection' ? (tickets.features || []) : (Array.isArray(tickets) ? tickets : []);
          sosList = features.filter(f => f.properties && f.properties.isSOS).map(f => {
            const p = f.properties || {};
            const reported = p.totalBeneficiaries || ((p.adults || 0) + (p.children || 0) + (p.elderly || 0)) || (p.helpTypes ? p.helpTypes.length : 0);
            return {
              id: p.ticketId,
              location: (p.assignedTo && p.assignedTo.location) || p.address || 'Unknown area',
              people: reported || '—',
              status: p.status || 'new',
              raw: { ...p, createdAt: p.createdAt }
            };
          });
        } else {
          // Fallback: fetch full tickets list (only when no parent data available)
          const res = await API.get('/tickets');
          if (!mounted) return;
          if (res.data && res.data.success) {
            const all = res.data.tickets || [];
            const sos = all.filter(t => t.isSOS);
            sosList = sos.map(t => {
              const reported = t.totalBeneficiaries || ((t.adults || 0) + (t.children || 0) + (t.elderly || 0)) || (t.helpTypes ? t.helpTypes.length : 0);
              return ({
                id: t.ticketId,
                location: (t.assignedTo && t.assignedTo.location) || t.address || 'Unknown area',
                people: reported || '—',
                status: t.status || 'new',
                raw: t
              });
            });
          }
        }

        // Sort: active/open/new first, matched/assigned middle, closed last
        const rank = s => {
          const st = (s || '').toString().toLowerCase();
          if (['new','active','open'].includes(st)) return 0;
          if (['matched','assigned','accepted'].includes(st)) return 1;
          return 2;
        };
        sosList.sort((a,b) => {
          const r = rank(a.status) - rank(b.status);
          if (r !== 0) return r;
          // recent first
          return new Date((b.raw && b.raw.createdAt) || 0) - new Date((a.raw && a.raw.createdAt) || 0);
        });

        setItems(sosList);
        // Eagerly fetch detailed status (assignments, assignmentHistory, coords) for SOS items
        (async () => {
          for (const it of sosList) {
            try {
              // Only fetch if assignments or assignmentHistory or locationGeo missing
              const needs = !(it.raw && (it.raw.assignments || it.raw.assignmentHistory || (it.raw.locationGeo && it.raw.locationGeo.coordinates && it.raw.locationGeo.coordinates.length > 0)));
              if (!needs) continue;
              setLoadingMap(m => ({ ...m, [it.id]: true }));
              const res = await getTrackerStatus(it.id);
              if (res && res.success && res.ticket) {
                setItems(prev => prev.map(p => p.id === it.id ? ({ ...p, raw: { ...p.raw, ...res.ticket, assignments: res.assignments || p.raw?.assignments }, status: (res.ticket.status || p.status) }) : p));
              }
            } catch (e) {
              console.warn('Failed prefetch tracker for', it.id, e);
            } finally {
              setLoadingMap(m => ({ ...m, [it.id]: false }));
              // small pause between requests to avoid spiky load
              await new Promise(r => setTimeout(r, 75));
            }
          }
        })();
      } catch (e) {
        console.error('Failed to load tickets for SOSQueue', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [tickets]);

  const renderBadge = (status) => {
    const st = (status || '').toString().toLowerCase();
    let cls = 'badge-status';
    if (['new','active','open'].includes(st)) cls += ' active';
    else if (['matched','assigned','accepted'].includes(st)) cls += ' matched';
    else if (['closed','resolved','canceled','fulfilled','completed'].includes(st)) cls += ' closed';
    const label = status === 'new' ? 'New' : status || 'unknown';
    return <span className={cls}>{label}</span>;
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">SoS Queue</h2>
      <p className="text-sm text-gray-600 mb-4">Active SOS requests awaiting triage.</p>
      {loading && <div>Loading...</div>}
      <div className="space-y-4">
          {items.map(item => {
          const isOpen = selected === item.id;
          const toggle = async () => {
            const willOpen = !isOpen;
            setSelected(willOpen ? item.id : null);
            if (willOpen) {
              // if coordinates are missing, attempt to fetch tracker status for this ticket
              const hasCoords = item.raw && item.raw.locationGeo && item.raw.locationGeo.coordinates && item.raw.locationGeo.coordinates.length > 0;
                  if (!hasCoords) {
                try {
                  setLoadingMap(m => ({ ...m, [item.id]: true }));
                  const res = await getTrackerStatus(item.id);
                  if (res && res.success && res.ticket) {
                    // merge ticket data into items (include assignments returned separately)
                    setItems(prev => prev.map(it => it.id === item.id ? ({ ...it, raw: { ...it.raw, ...res.ticket, assignments: res.assignments || it.raw?.assignments }, status: (res.ticket.status || it.status) }) : it));
                  }
                } catch (e) {
                  console.error('Failed to fetch tracker status for', item.id, e);
                } finally {
                  setLoadingMap(m => ({ ...m, [item.id]: false }));
                }
              }
            }
          };
          return (
            <div key={item.id} className={`sos-card ${isOpen ? 'open' : ''}`}>
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                className="sos-card-header"
                onClick={toggle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle();
                  }
                }}
              >
                <div className="sos-card-meta">
                  <div>
                    <p className="sos-card-title">{item.id}</p>
                    <p className="sos-card-sub">{item.raw && item.raw.createdAt ? `${new Date(item.raw.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, ${new Date(item.raw.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : ''}</p>
                  </div>
                  <div className="sos-card-right" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                      <div className={item.raw && item.raw.assignedTo ? 'text-sm font-medium' : 'text-sm text-gray-500'} style={{whiteSpace: 'nowrap'}}>
                        {item.raw && item.raw.assignedTo ? (item.raw.assignedTo.organizationName || item.raw.assignedTo.name) : 'Unassigned'}
                      </div>
                    </div>
                    {renderBadge(item.status)}
                  </div>
                </div>
                {/* intentionally not showing description snippet to avoid default/urgent message */}
              </div>

                {isOpen && (
                <div className="sos-card-body">
                  {loadingMap[item.id] ? (
                    <div>Loading coordinates...</div>
                  ) : (
                    <div className="sos-minimal-detail">
                      <div><strong>Ticket ID:</strong> {item.id}</div>
                      <div><strong>Status:</strong> {item.status}</div>
                      <div>
                        <strong>Created:</strong>{' '}
                        {item.raw && item.raw.createdAt ? `${new Date(item.raw.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, ${new Date(item.raw.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : '—'}
                      </div>
                      <div>
                        <strong>Geo location:</strong>{' '}
                        {item.raw && item.raw.locationGeo && item.raw.locationGeo.coordinates ? `[${item.raw.locationGeo.coordinates.join(', ')}]` : '—'}
                      </div>

                      <div className="mt-3">
                        <h4 className="font-medium">Assigned To</h4>
                        {item.raw && item.raw.assignedTo ? (
                          <div>
                            <div className="font-medium">{item.raw.assignedTo.organizationName || item.raw.assignedTo.name}</div>
                            <div className="text-xs text-gray-500">{item.raw.assignedTo.phone || ''} {item.raw.assignedTo.location ? `• ${item.raw.assignedTo.location}` : ''}</div>
                          </div>
                        ) : (
                          <div className="text-gray-500">Unassigned</div>
                        )}
                      </div>

                      <div className="mt-3">
                        <h4 className="font-medium">Assignment History</h4>
                        {Array.isArray(item.raw && item.raw.assignmentHistory) && item.raw.assignmentHistory.length > 0 ? (
                          <ul className="text-sm">
                            {item.raw.assignmentHistory.map((h, idx) => (
                              <li key={idx} className="py-1 border-b">{h.assignedAt ? `${new Date(h.assignedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, ${new Date(h.assignedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : '—'} — {h.note || h.status || 'Update'}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-gray-500">No assignment history.</div>
                        )}
                      </div>

                      <div className="mt-3">
                        <h4 className="font-medium">Proposed Matches</h4>
                        {Array.isArray(item.raw && item.raw.assignments) && item.raw.assignments.length > 0 ? (
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs text-gray-500"><th>NGO</th><th>Score</th><th>ETA</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                              {item.raw.assignments.map(a => (
                                <tr key={a.assignmentId || `${a.ngo?.id || a.ngo?.organizationName}-${a.score || ''}`} className="border-t">
                                  <td className="py-2">{a.ngo?.organizationName || a.ngo?.name || 'Unknown'}</td>
                                  <td className="py-2">{a.score != null ? Math.round(a.score) : '-'}</td>
                                  <td className="py-2">{a.etaMinutes != null ? `${a.etaMinutes} min` : '-'}</td>
                                  <td className="py-2">{a.status || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-sm text-gray-500">No proposals found.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SOSQueue;

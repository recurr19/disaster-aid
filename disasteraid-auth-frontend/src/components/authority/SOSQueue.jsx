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
        // Fetch full tickets so we can show reporter info and status
        const res = await API.get('/tickets');
        if (!mounted) return;
        if (res.data && res.data.success) {
          const all = res.data.tickets || [];
          // Filter SoS tickets
          const sos = all.filter(t => t.isSOS);
          // Map to items
          const mapped = sos.map(t => ({
            id: t.ticketId,
            location: (t.assignedTo && t.assignedTo.location) || t.address || 'Unknown area',
            people: (t.helpTypes || []).length || '—',
            status: t.status || 'new',
            raw: t
          }));
          // Sort: active/open/new first, matched/assigned middle, closed last
          const rank = s => {
            const st = (s || '').toString().toLowerCase();
            if (['new','active','open'].includes(st)) return 0;
            if (['matched','assigned','accepted'].includes(st)) return 1;
            return 2;
          };
          mapped.sort((a,b) => {
            const r = rank(a.status) - rank(b.status);
            if (r !== 0) return r;
            // recent first
            return new Date(b.raw.createdAt) - new Date(a.raw.createdAt);
          });
          setItems(mapped);
        }
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
    <div className="card">
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
                    // merge ticket data into items
                    setItems(prev => prev.map(it => it.id === item.id ? ({ ...it, raw: { ...it.raw, ...res.ticket } }) : it));
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
                    <p className="sos-card-sub">{item.people} reported • {item.status}</p>
                  </div>
                  <div className="sos-card-right">
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
                        {item.raw && item.raw.createdAt ? new Date(item.raw.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}{' '}
                        {item.raw && item.raw.createdAt ? new Date(item.raw.createdAt).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                      <div>
                        <strong>Geo location:</strong>{' '}
                        {item.raw && item.raw.locationGeo && item.raw.locationGeo.coordinates ? `[${item.raw.locationGeo.coordinates.join(', ')}]` : '—'}
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

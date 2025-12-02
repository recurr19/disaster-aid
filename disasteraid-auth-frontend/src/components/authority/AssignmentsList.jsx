import React, { useEffect, useState } from 'react';
import './authority.css';
import { getMapData } from '../../api/authority';
import TicketDetail from './TicketDetail';
import { prefetchMany, getCachedTracker } from '../../utils/trackerCache';

const AssignmentsList = ({ tickets }) => {
  const [loading, setLoading] = useState(false);
  const [localTickets, setLocalTickets] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const statusCategory = (st) => {
    const s = String(st || '').toLowerCase();
    if (['new', 'active', 'open'].includes(s)) return 0; // active
    if (['matched', 'assigned', 'accepted'].includes(s)) return 1; // matched
    if (['closed', 'resolved', 'canceled', 'fulfilled', 'completed'].includes(s)) return 3; // closed
    return 2; // others
  };

  const sortTickets = (feats) => {
    return feats.slice().sort((a, b) => {
      const pa = (a.properties || {});
      const pb = (b.properties || {});
      const ca = statusCategory(pa.status);
      const cb = statusCategory(pb.status);
      if (ca !== cb) return ca - cb;
      // secondary: newer first
      const da = new Date(pa.createdAt || 0).getTime();
      const db = new Date(pb.createdAt || 0).getTime();
      return db - da;
    });
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        // If parent provided tickets (FeatureCollection), use it to avoid refetch
        if (tickets) {
          const features = tickets.type === 'FeatureCollection' ? (tickets.features || []) : (Array.isArray(tickets) ? tickets : []);
          const feats = features.filter(f => !(f.properties && f.properties.isSOS));
          setLocalTickets(sortTickets(feats));
          // Prefetch tracker details for these tickets in background for snappier open
          try {
            const ids = feats.map(f => (f.properties || {}).ticketId).filter(Boolean).filter(id => !getCachedTracker(id));
            if (ids.length > 0) prefetchMany(ids, { delayMs: 60 });
          } catch (e) { /* ignore */ }
          return;
        }

        const res = await getMapData();
        if (!mounted) return;
        if (res && res.success && res.tickets && res.tickets.type === 'FeatureCollection') {
            // Exclude SoS tickets from assignments list
            const feats = (res.tickets.features || []).filter(f => !(f.properties && f.properties.isSOS));
            setLocalTickets(sortTickets(feats));
            // Prefetch tracker details for these tickets in background for snappier open
            try {
              const ids = feats.map(f => (f.properties || {}).ticketId).filter(Boolean).filter(id => !getCachedTracker(id));
              if (ids.length > 0) prefetchMany(ids, { delayMs: 60 });
            } catch (e) { /* ignore */ }
        } else {
          setLocalTickets([]);
        }
      } catch (e) {
        console.error('Failed to load authority map / tickets', e);
        setError('Failed to load tickets');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [tickets]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignments — Ticket Status</h2>
      <p className="text-sm text-gray-600 mb-4">List of tickets with current assignment and status.</p>

      {loading && <div>Loading tickets...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && localTickets.length === 0 && (
        <div className="text-sm text-gray-500">No tickets with geo data available.</div>
      )}

      {!loading && localTickets.length > 0 && (
        <div className="space-y-4">
          {localTickets.map(f => {
            const p = f.properties || {};
            const assigned = p.assignedTo || null;
            const isOpen = selectedTicketId === p.ticketId;
            const toggle = () => setSelectedTicketId(prev => prev === p.ticketId ? null : p.ticketId);
            const st = p.status || 'unknown';
            const stl = String(st).toLowerCase();
            let cls = 'badge-status';
            if (['new','active','open'].includes(stl)) cls += ' active';
            else if (['matched','assigned','accepted'].includes(stl)) cls += ' matched';
            else if (['closed','resolved','canceled','fulfilled','completed'].includes(stl)) cls += ' closed';

            return (
              <div key={p.ticketId} className={`sos-card ${isOpen ? 'open' : ''}`}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  className="sos-card-header"
                  onClick={toggle}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
                >
                  <div className="sos-card-meta">
                    <div>
                      <p className="sos-card-title">{p.ticketId}</p>
                      <p className="sos-card-sub">{p.createdAt ? `${new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, ${new Date(p.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : '-'}</p>
                    </div>
                    <div className="sos-card-right" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                        <div className={assigned ? 'text-sm font-medium' : 'text-sm text-gray-500'}>
                          {assigned ? (assigned.organizationName || assigned.name) : 'Unassigned'}
                        </div>
                      </div>
                      <span className={cls}>{st}</span>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="sos-card-body">
                    <TicketDetail ticketId={p.ticketId} onClose={() => setSelectedTicketId(null)} showIsSOS={false} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssignmentsList;

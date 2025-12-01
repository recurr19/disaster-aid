import React, { useEffect, useState } from 'react';
import './authority.css';
import { getMapData } from '../../api/authority';
import TicketDetail from './TicketDetail';

const AssignmentsList = () => {
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getMapData();
        if (!mounted) return;
        if (res && res.success && res.tickets && res.tickets.type === 'FeatureCollection') {
            // Exclude SoS tickets from assignments list
            const feats = (res.tickets.features || []).filter(f => !(f.properties && f.properties.isSOS));
            setTickets(feats);
        } else {
          setTickets([]);
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
  }, []);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignments — Ticket Status</h2>
      <p className="text-sm text-gray-600 mb-4">List of tickets with current assignment and status.</p>

      {loading && <div>Loading tickets...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && tickets.length === 0 && (
        <div className="text-sm text-gray-500">No tickets with geo data available.</div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="space-y-4">
          {tickets.map(f => {
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
                      <p className="sos-card-sub">{p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</p>
                    </div>
                    <div className="sos-card-right">
                      <span className={cls}>{st}</span>
                      <div style={{marginLeft: '0.5rem'}}>
                        {assigned ? <div className="text-sm font-medium">{assigned.organizationName}</div> : <div className="text-sm text-gray-500">Unassigned</div>}
                      </div>
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

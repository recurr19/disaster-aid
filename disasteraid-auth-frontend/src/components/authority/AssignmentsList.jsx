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
          setTickets(res.tickets.features || []);
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
        <div className="overflow-auto max-h-[60vh]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="pb-2">Ticket</th>
                <th className="pb-2">Created</th>
                <th className="pb-2">Help Types</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Assigned NGO</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(f => {
                const p = f.properties || {};
                const assigned = p.assignedTo || null;
                return (
                  <tr key={p.ticketId} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTicketId(prev => prev === p.ticketId ? null : p.ticketId)}>
                    <td className="py-2 font-medium text-blue-700 underline">{p.ticketId}</td>
                    <td className="py-2 text-xs text-gray-600">{p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</td>
                    <td className="py-2">{(p.helpTypes || []).join(', ') || '-'}</td>
                    <td className="py-2">{p.status || 'unknown'}</td>
                    <td className="py-2">{assigned ? <div><div className="font-medium">{assigned.organizationName}</div><div className="text-xs text-gray-500">{assigned.phone} • {assigned.location}</div></div> : <span className="text-gray-500">Unassigned</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {selectedTicketId && <TicketDetail ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />}
    </div>
  );
};

export default AssignmentsList;

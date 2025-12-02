import React, { useEffect, useState } from 'react';
import './authority.css';
import { getTickets, getMatchesForTicket, assignBestNGO } from '../../api/ticket';
import { getTrackerStatus } from '../../api/tracker';

const AssignmentBoard = ({ onAssigned }) => {
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);

  const statusCategory = (st) => {
    const s = String(st || '').toLowerCase();
    if (['new', 'active', 'open', 'in_progress'].includes(s)) return 0; // active
    if (['matched', 'assigned', 'accepted'].includes(s)) return 1; // matched
    if (['closed', 'resolved', 'canceled', 'fulfilled', 'completed'].includes(s)) return 3; // closed
    return 2; // others
  };

  const sortTickets = (arr) => {
    if (!Array.isArray(arr)) return arr || [];
    return arr.slice().sort((a, b) => {
      const sa = statusCategory(a.status);
      const sb = statusCategory(b.status);
      if (sa !== sb) return sa - sb;
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da;
    });
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoadingTickets(true);
        const res = await getTickets({});
        if (!mounted) return;
        if (res && res.success) {
          setTickets(sortTickets(res.tickets || []));
        } else if (res && res.tickets) {
          setTickets(sortTickets(res.tickets || []));
        }
      } catch (e) {
        console.error('Failed to load tickets', e);
        setError('Failed to load tickets');
      } finally {
        if (mounted) setLoadingTickets(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const selectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setMatches([]);
    setError(null);
    try {
      // load tracker status (assigned NGO + ticket status)
      const tracker = await getTrackerStatus(ticket.ticketId);
      if (tracker && tracker.success && tracker.ticket) {
        // enrich selected ticket with tracker info
        setSelectedTicket(prev => ({ ...ticket, status: tracker.ticket.status, assignedTo: tracker.ticket.assignedTo }));
      }
      setLoadingMatches(true);
      const res = await getMatchesForTicket(ticket.ticketId);
      if (res && res.success) {
        setMatches(res.assignments || []);
      } else {
        setMatches([]);
      }
    } catch (e) {
      console.error('Failed to load matches', e);
      setError('Failed to load matches for this ticket');
    } finally {
      setLoadingMatches(false);
    }
  };

  const doAssignBest = async () => {
    if (!selectedTicket) return;
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Assign best available NGO to this ticket?')) return;
    try {
      setAssigning(true);
      const res = await assignBestNGO(selectedTicket.ticketId);
      if (res && res.success) {
        // refresh matches/status
        await selectTicket(selectedTicket);
        if (onAssigned) onAssigned();
        alert('Assigned best NGO successfully');
      } else {
        alert((res && res.message) || 'Assignment failed');
      }
    } catch (e) {
      console.error('Assign failed', e);
      alert('Assignment failed due to network error');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Board</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1">
          <div className="mb-2 font-medium">Recent Tickets</div>
          <div className="overflow-auto max-h-96">
            {loadingTickets && <div className="p-4">Loading tickets...</div>}
            {!loadingTickets && tickets.length === 0 && (
              <div className="p-4 text-sm text-gray-500">No tickets found</div>
            )}
            <ul>
              {tickets.map(t => (
                <li key={t.id} className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${selectedTicket && selectedTicket.id === t.id ? 'bg-gray-100' : ''}`} onClick={() => selectTicket(t)}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{t.title || t.helpTypes?.join(', ') || t.ticketId}</div>
                    <div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${t.status === 'matched' ? 'bg-green-100 text-green-800' : t.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>
                        {t.status || 'unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{`${new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, ${new Date(t.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}</div>
                  <div className="text-sm text-gray-700">{t.summary}</div>
                  <div className="text-xs text-gray-600 mt-1">Assigned: {t.assignedTo ? <span className="text-green-700 font-medium">{t.assignedTo.organizationName}</span> : <span className="text-gray-500">Unassigned</span>}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-medium">Selected Ticket</div>
              <div className="text-sm text-gray-600">{selectedTicket ? `${selectedTicket.ticketId} • ${selectedTicket.title || selectedTicket.helpTypes?.join(', ')}` : 'Select a ticket to view matches'}</div>
              {selectedTicket && (
                <div className="mt-2 text-sm text-gray-700">
                  <div>Status: <strong className="text-gray-900">{selectedTicket.status || 'unknown'}</strong></div>
                  <div>Assigned: {selectedTicket.assignedTo ? <span className="text-green-700 font-medium">{selectedTicket.assignedTo.organizationName} • {selectedTicket.assignedTo.phone}</span> : <span className="text-gray-500">Unassigned</span>}</div>
                </div>
              )}
            </div>
            <div>
              <button onClick={doAssignBest} disabled={!selectedTicket || assigning} className="button-primary">
                {assigning ? 'Assigning...' : 'Assign Best NGO'}
              </button>
            </div>
          </div>

          <div className="p-3 border rounded">
            {error && <div className="text-red-600 mb-2">{error}</div>}

            {loadingMatches && <div>Loading matches...</div>}

            {!loadingMatches && selectedTicket && matches.length === 0 && (
              <div className="text-sm text-gray-500">No proposed assignments found for this ticket.</div>
            )}

            {!loadingMatches && matches.length > 0 && (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="pb-2">NGO</th>
                    <th className="pb-2">Score</th>
                    <th className="pb-2">ETA</th>
                    <th className="pb-2">Distance (km)</th>
                    <th className="pb-2">Matched Types</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map(m => (
                    <tr key={m.assignmentId} className={`border-t ${selectedTicket && selectedTicket.assignedTo && m.ngo && selectedTicket.assignedTo.id === m.ngo.id ? 'bg-green-50' : ''}`}>
                      <td className="py-2">
                        <div className="font-medium">{m.ngo?.organizationName || 'Unknown NGO'}</div>
                        <div className="text-xs text-gray-500">{m.ngo?.phone || ''} • {m.ngo?.location || ''}</div>
                      </td>
                      <td className="py-2">{m.score != null ? Math.round(m.score) : '-'}</td>
                      <td className="py-2">{m.etaMinutes != null ? `${m.etaMinutes} min` : '-'}</td>
                      <td className="py-2">{m.distanceKm != null ? m.distanceKm.toFixed(1) : '-'}</td>
                      <td className="py-2">{m.matchedHelpTypes?.join(', ') || '-'}</td>
                      <td className="py-2">{selectedTicket && selectedTicket.assignedTo && m.ngo && selectedTicket.assignedTo.id === m.ngo.id ? <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded">Assigned</span> : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentBoard;

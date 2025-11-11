import React, { useEffect, useState } from 'react';
import './authority.css';
import { getTrackerStatus } from '../../api/tracker';

const TicketDetail = ({ ticketId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticketId) return;
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getTrackerStatus(ticketId);
        if (!mounted) return;
        if (res && res.success) setData(res);
        else setError('Failed to load ticket status');
      } catch (e) {
        console.error('getTrackerStatus failed', e);
        setError('Failed to load ticket status');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [ticketId]);

  if (!ticketId) return null;

  return (
    <div className="ticket-detail-modal">
      <div className="ticket-detail-card card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Ticket Details — {ticketId}</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Close</button>
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {data && data.ticket && (
          <div>
            <div className="mb-3">
              <div><strong>Ticket ID:</strong> {data.ticket.ticketId}</div>
              <div><strong>Status:</strong> {data.ticket.status}</div>
              <div><strong>Is SOS:</strong> {data.ticket.isSOS ? 'Yes' : 'No'}</div>
              <div><strong>Created:</strong> {new Date(data.ticket.createdAt).toLocaleString()}</div>
            </div>
            <div className="mb-3">
              <h4 className="font-medium">Reporter & Location</h4>
              <div><strong>Name:</strong> {data.ticket.name || '—'}</div>
              <div><strong>Phone:</strong> {data.ticket.phone || '—'}</div>
              <div><strong>Address:</strong> {data.ticket.address || '—'}</div>
              <div><strong>Landmark:</strong> {data.ticket.landmark || '—'}</div>
              {data.ticket.locationGeo && data.ticket.locationGeo.coordinates && (
                <div className="text-xs text-gray-500">Geo: {data.ticket.locationGeo.coordinates.join(', ')}</div>
              )}
            </div>

            <div className="mb-3">
              <h4 className="font-medium">Assigned To</h4>
              {data.ticket.assignedTo ? (
                <div>
                  <div className="font-medium">{data.ticket.assignedTo.organizationName}</div>
                  <div className="text-xs text-gray-500">{data.ticket.assignedTo.phone} • {data.ticket.assignedTo.location}</div>
                </div>
              ) : (
                <div className="text-gray-500">Unassigned</div>
              )}
            </div>

            <div className="mb-3">
              <h4 className="font-medium">Assignment History</h4>
              {Array.isArray(data.ticket.assignmentHistory) && data.ticket.assignmentHistory.length > 0 ? (
                <ul className="text-sm">
                  {data.ticket.assignmentHistory.map((h, idx) => (
                    <li key={idx} className="py-1 border-b">{new Date(h.assignedAt).toLocaleString()} — {h.note || 'Update'}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">No assignment history.</div>
              )}
            </div>

            <div className="mb-3">
              <h4 className="font-medium">Proposed Matches</h4>
              {Array.isArray(data.assignments) && data.assignments.length > 0 ? (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500"><th>NGO</th><th>Score</th><th>ETA</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.assignments.map(a => (
                      <tr key={a.assignmentId} className="border-t">
                        <td className="py-2">{a.ngo?.organizationName || 'Unknown'}</td>
                        <td className="py-2">{a.score != null ? Math.round(a.score) : '-'}</td>
                        <td className="py-2">{a.etaMinutes != null ? `${a.etaMinutes} min` : '-'}</td>
                        <td className="py-2">{a.status}</td>
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
    </div>
  );
};

export default TicketDetail;

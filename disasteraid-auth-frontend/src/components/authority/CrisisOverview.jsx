import React from 'react';
import './authority.css';

const CrisisOverview = ({ mapData, loading }) => {
  const features = mapData && mapData.tickets && mapData.tickets.features ? mapData.tickets.features : [];

  // Total Tickets: all tickets that are not closed/resolved/canceled (both SOS and normal)
  const total = features.filter(f => {
    const s = f.properties && f.properties.status ? String(f.properties.status).toLowerCase() : '';
    return !['closed','resolved','canceled'].includes(s);
  }).length;

  // Active Tickets: non-SOS tickets that are not closed/resolved/canceled
  const active = features.filter(f => {
    const s = f.properties && f.properties.status ? String(f.properties.status).toLowerCase() : '';
    const isClosed = ['closed','resolved','canceled'].includes(s);
    const isSOS = !!(f.properties && f.properties.isSOS);
    return !isClosed && !isSOS;
  }).length;

  // Resolved Today: tickets (SOS or normal) that were closed today.
  // Prefer explicit `closedAt` if available, otherwise fall back to createdAt (best-effort).
  const resolvedToday = features.filter(f => {
    if (!f.properties) return false;
    const s = f.properties.status ? String(f.properties.status).toLowerCase() : '';
    if (s !== 'closed') return false;
    const closedAt = f.properties.closedAt || f.properties.updatedAt || f.properties.modifiedAt || f.properties.createdAt;
    if (!closedAt) return false;
    const d = new Date(closedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  // Active SoS tickets: SOS tickets that are not closed/resolved/canceled
  const activeSoS = features.filter(f => {
    const isSOS = !!(f.properties && f.properties.isSOS);
    const s = f.properties && f.properties.status ? String(f.properties.status).toLowerCase() : '';
    const isClosed = ['closed','resolved','canceled'].includes(s);
    return isSOS && !isClosed;
  }).length;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Crisis Overview</h2>
      <p className="text-sm text-gray-600">Summary information and recent alerts will appear here.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border-l-4 border-gray-300">
          <p className="text-sm text-gray-700">Total Tickets</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? '…' : total}</p>
        </div>
        <div className="p-4 bg-white rounded-lg border-l-4 border-amber-400">
          <p className="text-sm text-amber-800">Active Tickets</p>
          <p className="text-2xl font-bold text-amber-600">{loading ? '…' : active}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <p className="text-sm text-green-800">Resolved Today</p>
          <p className="text-2xl font-bold text-green-600">{loading ? '…' : resolvedToday}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-800">Active SoS Tickets</p>
          <p className="text-2xl font-bold text-yellow-600">{loading ? '…' : activeSoS}</p>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">Total tracked tickets: {total}</div>
    </div>
  );
};

export default CrisisOverview;

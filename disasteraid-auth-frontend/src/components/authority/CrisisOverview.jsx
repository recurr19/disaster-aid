import React from 'react';
import './authority.css';

const CrisisOverview = ({ mapData, loading }) => {
  const features = mapData && mapData.tickets && mapData.tickets.features ? mapData.tickets.features : [];

  const total = features.length;
  const sos = features.filter(f => f.properties && f.properties.isSOS).length;
  const critical = features.filter(f => f.properties && f.properties.status === 'critical').length;
  const resolvedToday = features.filter(f => {
    if (!f.properties || !f.properties.createdAt) return false;
    const created = new Date(f.properties.createdAt);
    const now = new Date();
    return created.toDateString() === now.toDateString() && f.properties.status === 'closed';
  }).length;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Crisis Overview</h2>
      <p className="text-sm text-gray-600">Summary information and recent alerts will appear here.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
          <p className="text-sm text-red-800">Critical Alerts</p>
          <p className="text-2xl font-bold text-red-600">{loading ? '…' : critical}</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-800">Active SOS</p>
          <p className="text-2xl font-bold text-yellow-600">{loading ? '…' : sos}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <p className="text-sm text-green-800">Resolved Today</p>
          <p className="text-2xl font-bold text-green-600">{loading ? '…' : resolvedToday}</p>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">Total tracked tickets: {total}</div>
    </div>
  );
};

export default CrisisOverview;

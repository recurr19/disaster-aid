import React from 'react';
import './authority.css';

const SOSQueue = () => {
  const sample = [
    { id: 'SOS-001', location: 'Zone A', people: 4 },
    { id: 'SOS-002', location: 'Zone B', people: 2 },
    { id: 'SOS-003', location: 'Zone C', people: 6 },
  ];

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">SoS Queue</h2>
      <p className="text-sm text-gray-600 mb-4">Active SOS requests awaiting triage.</p>
      <ul className="divide-y divide-gray-100">
        {sample.map(item => (
          <li key={item.id} className="py-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{item.id} — {item.location}</p>
              <p className="text-sm text-gray-500">{item.people} people reported</p>
            </div>
            <div>
              <span className="badge-status active">New</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SOSQueue;

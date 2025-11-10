import React from 'react';
import './authority.css';

const CrisisOverview = () => {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Crisis Overview</h2>
      <p className="text-sm text-gray-600">Summary information and recent alerts will appear here.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
          <p className="text-sm text-red-800">Critical Alerts</p>
          <p className="text-2xl font-bold text-red-600">2</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-800">High Priority</p>
          <p className="text-2xl font-bold text-yellow-600">8</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <p className="text-sm text-green-800">Resolved Today</p>
          <p className="text-2xl font-bold text-green-600">12</p>
        </div>
      </div>
    </div>
  );
};

export default CrisisOverview;

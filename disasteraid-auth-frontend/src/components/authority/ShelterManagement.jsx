import React from 'react';
import './authority.css';

const ShelterManagement = () => {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Shelters & Supplies</h2>
      <p className="text-sm text-gray-600">Overview of shelter capacity and supply levels.</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-blue-800">Open Shelters</p>
          <p className="text-2xl font-bold text-blue-600">14</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-800">Available Beds</p>
          <p className="text-2xl font-bold text-yellow-600">320</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <p className="text-sm text-green-800">Supplies (critical)</p>
          <p className="text-2xl font-bold text-green-600">Adequate</p>
        </div>
      </div>
    </div>
  );
};

export default ShelterManagement;

import React from 'react';
import './authority.css';

const ResourceAllocation = () => {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Resource Allocation</h2>
      <p className="text-sm text-gray-600">Allocate resources across affected zones.</p>
      <div className="mt-4">
        <p className="text-sm text-gray-500">No allocations yet. Use this panel to create new resource plans.</p>
        <div className="mt-4">
          <button className="button-primary">Create Allocation</button>
        </div>
      </div>
    </div>
  );
};

export default ResourceAllocation;

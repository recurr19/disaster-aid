import React from 'react';
import './authority.css';

const AssignmentBoard = () => {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Board</h2>
      <p className="text-sm text-gray-600">Teams, assignments and statuses will be managed here.</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <p className="font-medium">Team Alpha</p>
          <p className="text-sm text-gray-500">Status: En route</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="font-medium">Team Beta</p>
          <p className="text-sm text-gray-500">Status: Standby</p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentBoard;

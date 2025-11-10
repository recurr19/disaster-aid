import React from 'react';
import './authority.css';

const AutomatedBriefs = () => {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Automated Briefs</h2>
      <p className="text-sm text-gray-600">Generate quick situation briefings for stakeholders.</p>
      <div className="mt-4">
        <button className="button-primary">Generate Brief</button>
      </div>
    </div>
  );
};

export default AutomatedBriefs;

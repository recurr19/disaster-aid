import React from 'react';
import { Users, Plus, Minus } from 'lucide-react';
import { Input } from '../common';

/**
 * People counter component for tracking adults, children, and elderly
 */
const PeopleCounter = ({ adults, children, elderly, onNumberChange, onNumberInput }) => {
  const counterItems = [
    { label: 'Adults', value: adults, field: 'adults' },
    { label: 'Children', value: children, field: 'children' },
    { label: 'Elderly', value: elderly, field: 'elderly' }
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center mb-4">
        <Users className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Number of People</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {counterItems.map(({ label, value, field }) => (
          <div key={field} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <label className="text-gray-700 font-medium">{label}:</label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => onNumberChange(field, -1)}
                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-red-50 hover:border-red-500 transition-colors"
                disabled={value <= 0}
              >
                <Minus className="h-4 w-4 text-gray-600" />
              </button>
              <input
                type="number"
                value={value}
                onChange={(e) => onNumberInput(field, e.target.value)}
                className="w-16 text-center border border-gray-300 rounded-lg py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              <button
                type="button"
                onClick={() => onNumberChange(field, 1)}
                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-green-50 hover:border-green-500 transition-colors"
              >
                <Plus className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeopleCounter;

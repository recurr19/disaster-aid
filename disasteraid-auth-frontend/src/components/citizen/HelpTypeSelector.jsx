import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Help type selector component with checkboxes
 */
const HelpTypeSelector = ({ helpTypes, selectedTypes, onToggle, label = "Type of Help Required" }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center mb-4">
        <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {helpTypes.map((type) => (
          <label
            key={type}
            className={`
              flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all
              ${
                selectedTypes.includes(type)
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={() => onToggle(type)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="font-medium">{type}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default HelpTypeSelector;

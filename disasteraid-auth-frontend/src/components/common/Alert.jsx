import React from 'react';

const Alert = ({ type = 'info', title, children, icon: Icon, className = '' }) => {
  const types = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 ${types[type]} ${className}`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex-shrink-0 mt-0.5">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1">
          {title && <h4 className="font-bold mb-1">{title}</h4>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Alert;

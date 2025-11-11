import React from 'react';

const Card = ({ children, className = '', title, icon: Icon, ...props }) => {
  return (
    <div 
      className={`bg-white rounded-xl shadow-md p-6 transition-all duration-200 hover:shadow-lg ${className}`}
      {...props}
    >
      {(title || Icon) && (
        <div className="flex items-center gap-3 mb-4">
          {Icon && <Icon className="w-6 h-6 text-gray-700" />}
          {title && <h3 className="text-xl font-bold text-gray-900">{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;

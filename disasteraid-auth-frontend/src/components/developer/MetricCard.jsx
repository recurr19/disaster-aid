import React from 'react';

const Sparkline = ({ data = [], width = 120, height = 36, stroke = '#ef4444' }) => {
  if (!data || data.length === 0) return <svg width={width} height={height} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const len = data.length;
  const points = data.map((d, i) => {
    const x = (i / (len - 1 || 1)) * width;
    const y = height - ((d - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height}>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        points={points.join(' ')}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const MetricCard = ({ title, value, unit, delta, children, warning, description }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
            {delta !== undefined && (
              <span className={`text-sm font-medium ${delta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {delta > 0 ? `+${delta}` : delta}
              </span>
            )}
          </div>
          {warning && <p className="text-xs text-rose-600 mt-2">{warning}</p>}
        </div>
        <div className="flex-shrink-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;

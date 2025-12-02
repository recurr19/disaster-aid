import React from 'react';

const LineChart = ({ data = [], width = 300, height = 120, color = '#ef4444', label = 'Value' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }

  // Extract values
  const values = data.map(d => d.value || d.count || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  
  const len = values.length;
  const padding = 10;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // Create points for polyline
  const points = values.map((val, i) => {
    const x = padding + (i / (len - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((val - min) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  
  // Create area path (filled)
  const areaPoints = values.map((val, i) => {
    const x = padding + (i / (len - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((val - min) / range) * chartHeight;
    return { x, y };
  });
  
  const areaPath = [
    `M ${padding},${padding + chartHeight}`,
    ...areaPoints.map(p => `L ${p.x},${p.y}`),
    `L ${padding + chartWidth},${padding + chartHeight}`,
    'Z'
  ].join(' ');

  return (
    <div>
      <svg width={width} height={height}>
        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={padding} y2={padding + chartHeight} stroke="#e5e7eb" strokeWidth="1" />
        <line x1={padding} y1={padding + chartHeight} x2={padding + chartWidth} y2={padding + chartHeight} stroke="#e5e7eb" strokeWidth="1" />
        
        {/* Area fill */}
        <path d={areaPath} fill={color} fillOpacity="0.1" />
        
        {/* Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {areaPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} />
        ))}
      </svg>
      
      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-1 px-2">
        <span>Min: {min.toFixed(1)}</span>
        <span>Max: {max.toFixed(1)}</span>
        <span>Avg: {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)}</span>
      </div>
    </div>
  );
};

export default LineChart;

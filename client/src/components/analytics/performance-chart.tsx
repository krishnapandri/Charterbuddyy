import React from 'react';

interface PerformanceChartProps {
  data: {
    date: string;
    score: number;
  }[];
}

// Simple line chart for performance trend
export function PerformanceChart({ data }: PerformanceChartProps) {
  // If no data, show placeholder
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-neutral-400">No performance data available</p>
      </div>
    );
  }

  // Convert data to coordinates for SVG
  const chartHeight = 200;
  const chartWidth = 400;
  const maxScore = 100; // Assuming scores are percentages
  
  // Create points for polyline
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - (point.score / maxScore) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Create the chart
  return (
    <div className="h-64">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
        {/* Grid lines */}
        <line x1="0" y1="0" x2="0" y2={chartHeight} stroke="#E4E7EB" strokeWidth="1" />
        <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#E4E7EB" strokeWidth="1" />
        <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="#E4E7EB" strokeWidth="1" strokeDasharray="5,5" />
        <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="#E4E7EB" strokeWidth="1" strokeDasharray="5,5" />
        <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="#E4E7EB" strokeWidth="1" strokeDasharray="5,5" />
        
        {/* Line chart */}
        <polyline 
          fill="none" 
          stroke="#3949AB" 
          strokeWidth="3"
          points={points}
        />
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * chartWidth;
          const y = chartHeight - (point.score / maxScore) * chartHeight;
          return (
            <circle key={index} cx={x} cy={y} r="4" fill="#3949AB" />
          );
        })}
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-neutral-400 mt-2">
        {data.map((point, index) => (
          <div key={index}>{point.date}</div>
        ))}
      </div>
    </div>
  );
}

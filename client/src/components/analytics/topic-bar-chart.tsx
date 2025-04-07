import React from 'react';

interface TopicBarChartProps {
  data: {
    topic: string;
    shortName?: string;
    percentage: number;
  }[];
}

export function TopicBarChart({ data }: TopicBarChartProps) {
  // If no data, show placeholder
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-neutral-400">No topic data available</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <div className="flex items-end h-48 mt-4 space-x-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className={`w-full ${item.percentage >= 60 ? 'bg-primary-light' : 'bg-neutral-200'} rounded-t-sm chart-bar transition-all duration-500 ease-in-out`} 
              style={{ height: `${Math.max(item.percentage, 5)}%` }}
            ></div>
            <p className="mt-2 text-xs font-medium text-neutral-400 truncate w-full text-center">
              {item.shortName || item.topic}
            </p>
            <p className="text-xs font-bold">{item.percentage}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

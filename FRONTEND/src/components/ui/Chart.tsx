import React from 'react';

interface ChartData {
  month: string;
  value: number;
}

interface ChartProps {
  data: ChartData[];
}

const Chart: React.FC<ChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="h-64 flex items-end justify-between space-x-2 px-4">
      {data.map((item, index) => {
        const height = (item.value / maxValue) * 100;
        
        return (
          <div key={item.month} className="flex flex-col items-center space-y-2 flex-1">
            <div 
              className="bg-blue-500 rounded-t-lg w-full transition-all duration-500 hover:bg-blue-600"
              style={{ height: `${height}%` }}
            />
            <span className="text-xs text-slate-600 font-medium">{item.month}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Chart;
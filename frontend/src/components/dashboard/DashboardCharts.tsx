import React from 'react';

// 1. Multi-Segment Distribution Bar
export interface DistributionSegment {
  label: string;
  count: number;
  color: string; // Tailwind bg color class
  pct: number;
}

export const DistributionBar: React.FC<{
  title: string;
  segments: DistributionSegment[];
  totalLabel?: string;
}> = ({ title, segments, totalLabel }) => {
  const total = segments.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-800">{title}</span>
        <span className="text-slate-500 font-medium">
          {totalLabel || `${total} Total`}
        </span>
      </div>

      {/* Stacked Progress Bar */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{ width: `${seg.pct}%` }}
            className={`${seg.color} transition-all duration-500`}
            title={`${seg.label}: ${seg.count} (${seg.pct}%)`}
          />
        ))}
      </div>

      {/* Legend Chips */}
      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center space-x-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
            <span className="font-medium text-slate-700">{seg.label}:</span>
            <span className="font-semibold text-slate-900">{seg.count} ({seg.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. Circular / Radial Donut Gauge
export const CircularProgressGauge: React.FC<{
  percentage: number;
  title: string;
  subtitle: string;
  strokeColor?: string;
  size?: number;
}> = ({ percentage, title, subtitle, strokeColor = '#2563eb', size = 120 }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center space-x-4">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="text-slate-100"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={strokeColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-extrabold text-slate-900 leading-none">{percentage}%</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Rating</span>
        </div>
      </div>

      <div>
        <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
};

// 3. Bar Chart Component
export interface BarChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export const SimpleBarChart: React.FC<{
  data: BarChartDataPoint[];
  barColor?: string;
  secondaryColor?: string;
  height?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
}> = ({
  data,
  barColor = 'bg-blue-600',
  secondaryColor = 'bg-emerald-500',
  height = 140,
  primaryLabel = 'Inspected',
  secondaryLabel
}) => {
  const maxValue = Math.max(...data.map(d => Math.max(d.value, d.secondaryValue || 0)), 10);

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex items-center justify-end space-x-4 text-[11px] text-slate-500 pb-1">
        <div className="flex items-center space-x-1">
          <span className={`w-2.5 h-2.5 rounded ${barColor}`} />
          <span>{primaryLabel}</span>
        </div>
        {secondaryLabel && (
          <div className="flex items-center space-x-1">
            <span className={`w-2.5 h-2.5 rounded ${secondaryColor}`} />
            <span>{secondaryLabel}</span>
          </div>
        )}
      </div>

      {/* Chart Bars Grid */}
      <div className="flex items-end justify-between gap-2 pt-2 border-b border-slate-200" style={{ height }}>
        {data.map((item, index) => {
          const heightPct = Math.round((item.value / maxValue) * 100);
          const secHeightPct = item.secondaryValue ? Math.round((item.secondaryValue / maxValue) * 100) : 0;

          return (
            <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
              <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                {/* Primary Bar */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[20px] ${barColor} rounded-t transition-all duration-500 hover:opacity-85 relative`}
                >
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none transition z-10 font-mono">
                    {item.value}
                  </span>
                </div>

                {/* Optional Secondary Bar */}
                {secondaryLabel && (
                  <div
                    style={{ height: `${secHeightPct}%` }}
                    className={`w-full max-w-[20px] ${secondaryColor} rounded-t transition-all duration-500 hover:opacity-85`}
                  />
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-1">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 4. Smooth Area Trendline SVG Chart
export const TrendAreaChart: React.FC<{
  data: Array<{ label: string; value: number }>;
  strokeColor?: string;
  fillColor?: string;
  unit?: string;
}> = ({
  data,
  strokeColor = '#0284c7',
  fillColor = 'rgba(2, 132, 199, 0.12)',
  unit = '%'
}) => {
  const height = 120;
  const width = 360;
  const padding = 20;

  const minVal = Math.min(...data.map(d => d.value)) * 0.98;
  const maxVal = Math.max(...data.map(d => d.value)) * 1.01;
  const valRange = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.value - minVal) / valRange) * (height - 2 * padding);
    return { x, y, value: d.value, label: d.label };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="space-y-1">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
        {/* Subtle grid line */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {/* Gradient fill */}
        <path d={areaD} fill={fillColor} />

        {/* Trendline */}
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i} className="group">
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth="2.5"
              className="hover:r-5 transition"
            />
            <text
              x={p.x}
              y={p.y - 8}
              textAnchor="middle"
              className="text-[10px] font-bold fill-slate-700"
            >
              {p.value}{unit}
            </text>
            <text
              x={p.x}
              y={height - 5}
              textAnchor="middle"
              className="text-[10px] fill-slate-400"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

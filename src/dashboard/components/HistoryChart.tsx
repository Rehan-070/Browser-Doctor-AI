import React from 'react';

interface HistoryChartProps {
  history: { timestamp: number; score: number }[];
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ history }) => {
  // If history is empty, generate mock/preview entries to avoid blank charts
  const chartData = history && history.length > 1
    ? history
    : [
        { timestamp: Date.now() - 1000 * 60 * 60 * 5, score: 94 },
        { timestamp: Date.now() - 1000 * 60 * 60 * 4, score: 91 },
        { timestamp: Date.now() - 1000 * 60 * 60 * 3, score: 85 },
        { timestamp: Date.now() - 1000 * 60 * 60 * 2, score: 79 },
        { timestamp: Date.now() - 1000 * 60 * 60 * 1, score: 88 },
        { timestamp: Date.now(), score: 91 },
      ];

  const width = 500;
  const height = 180;
  const padding = 24;

  const minScore = 0;
  const maxScore = 100;

  // Convert points to SVG coords
  const points = chartData.map((d, index) => {
    const x = padding + (index / (chartData.length - 1)) * (width - padding * 2);
    // In SVG, y=0 is top, so we subtract score from maxScore
    const y = padding + ((maxScore - d.score) / (maxScore - minScore)) * (height - padding * 2);
    return { x, y, score: d.score, label: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
  });

  // SVG polyline/path builders
  const pathD = points.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // Closed path for fill area
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <div className="flex flex-col p-6 rounded-2xl glass-panel relative overflow-hidden h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white">Health Score History</h3>
          <p className="text-xs text-zinc-500">Hourly rating updates and changes</p>
        </div>
        {history && history.length <= 1 && (
          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium">
            Demo Mode
          </span>
        )}
      </div>

      <div className="relative flex-1 min-h-[140px] w-full">
        {points.length > 0 ? (
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {/* Grids */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#27272a" strokeWidth={1} strokeDasharray="3,3" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#27272a" strokeWidth={1} strokeDasharray="3,3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#27272a" strokeWidth={1} />

            {/* Gradient fill */}
            <defs>
              <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area */}
            {areaD && <path d={areaD} fill="url(#chartGlow)" />}

            {/* Polyline path */}
            {pathD && <path d={pathD} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}

            {/* Circles for points */}
            {points.map((p, i) => (
              <g key={i} className="group/dot">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  className="fill-emerald-500 stroke-zinc-950 stroke-2 cursor-pointer transition-all duration-200 hover:r-6"
                />
                {/* Score hover text */}
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  className="text-[9px] fill-zinc-400 font-bold opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none"
                >
                  {p.score}
                </text>
              </g>
            ))}
          </svg>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p className="text-xs">No health statistics recorded yet</p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-2 text-[10px] text-zinc-500 font-semibold px-2">
        {points.map((p, i) => (
          <span key={i}>{i === 0 || i === points.length - 1 ? p.label : ''}</span>
        ))}
      </div>
    </div>
  );
};

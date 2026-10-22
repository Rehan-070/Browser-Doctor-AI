import React from 'react';

interface ScoreRingProps {
  score: number;
  rating: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score, rating }) => {
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine colors based on score
  let strokeColor = 'stroke-emerald-500';
  let glowColor = 'shadow-emerald-500/20';
  let textColor = 'text-emerald-400';

  if (score < 50) {
    strokeColor = 'stroke-rose-500';
    glowColor = 'shadow-rose-500/20';
    textColor = 'text-rose-400';
  } else if (score < 70) {
    strokeColor = 'stroke-amber-500';
    glowColor = 'shadow-amber-500/20';
    textColor = 'text-amber-400';
  } else if (score < 90) {
    strokeColor = 'stroke-blue-500';
    glowColor = 'shadow-blue-500/20';
    textColor = 'text-blue-400';
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl glass-panel relative overflow-hidden group">
      {/* Background glow */}
      <div className={`absolute -inset-10 bg-gradient-to-r from-transparent to-transparent opacity-20 blur-xl transition-all group-hover:scale-110`} />

      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          {/* Base Ring */}
          <circle
            className="stroke-zinc-800"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Active Ring */}
          <circle
            className={`${strokeColor} transition-all duration-1000 ease-out`}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Text inside the ring */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tighter text-white">{score}</span>
          <span className="text-xs uppercase tracking-widest text-zinc-500 mt-1 font-semibold">Score</span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <h3 className={`text-lg font-bold tracking-tight ${textColor}`}>{rating}</h3>
        <p className="text-xs text-zinc-500 mt-0.5">Overall Browser Integrity</p>
      </div>
    </div>
  );
};

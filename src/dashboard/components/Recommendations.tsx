import React from 'react';
import { Recommendation } from '../../shared/types';
import { AlertCircle, Trash2, ShieldAlert, Sparkles, Sliders } from 'lucide-react';

interface RecommendationsProps {
  items: Recommendation[];
  onAction: (rec: Recommendation) => void;
}

export const Recommendations: React.FC<RecommendationsProps> = ({ items, onAction }) => {
  const getIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'duplicate':
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
      case 'inactive':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'heavy':
        return <Trash2 className="w-5 h-5 text-rose-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getBorderColor = (type: Recommendation['type']) => {
    switch (type) {
      case 'duplicate':
        return 'border-blue-500/10 hover:border-blue-500/25';
      case 'inactive':
        return 'border-amber-500/10 hover:border-amber-500/25';
      case 'heavy':
        return 'border-rose-500/10 hover:border-rose-500/25';
      default:
        return 'border-emerald-500/10 hover:border-emerald-500/25';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex items-center justify-between p-4 rounded-xl border bg-zinc-900/30 backdrop-blur-sm transition-all duration-300 ${getBorderColor(
            item.type
          )}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
              {getIcon(item.type)}
            </div>
            <div>
              <p className="text-sm text-zinc-200 font-medium leading-tight">{item.text}</p>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1 block">
                {item.type} recommendation
              </span>
            </div>
          </div>

          <button
            onClick={() => onAction(item)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 hover:scale-[1.02]"
          >
            {item.actionLabel === 'Check Settings' ? (
              <Sliders className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {item.actionLabel}
          </button>
        </div>
      ))}
    </div>
  );
};

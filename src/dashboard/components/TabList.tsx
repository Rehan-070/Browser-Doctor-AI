import React, { useState } from 'react';
import { TabInfo, ResourceTier } from '../../shared/types';
import { Trash2, ShieldAlert, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { RESOURCE_TIERS } from '../../shared/constants';

interface TabListProps {
  tabs: TabInfo[];
  onCloseTab: (tabId: number) => void;
  onSuspendTab: (tabId: number) => void;
}

type TabCategory = 'heavy' | 'duplicates' | 'inactive';

export const TabList: React.FC<TabListProps> = ({ tabs, onCloseTab, onSuspendTab }) => {
  const [activeCategory, setActiveCategory] = useState<TabCategory>('heavy');

  // Filter tabs by categories
  const heavyTabs = tabs.filter(
    t => t.resourceTier === RESOURCE_TIERS.HEAVY || t.resourceTier === RESOURCE_TIERS.VERY_HEAVY
  );

  const duplicateTabs = tabs.filter(t => t.isDuplicate);

  // Inactive for more than 15 minutes
  const inactiveTabs = tabs.filter(
    t => !t.active && t.inactiveDurationMs > 15 * 60 * 1000
  );

  const getTierBadgeColor = (tier: ResourceTier) => {
    switch (tier) {
      case RESOURCE_TIERS.VERY_HEAVY:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case RESOURCE_TIERS.HEAVY:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case RESOURCE_TIERS.MEDIUM:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case RESOURCE_TIERS.LIGHT:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700/30';
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m idle`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m idle`;
  };

  const getTabStatsLabel = (tab: TabInfo) => {
    if (!tab.stats) return 'No metrics reported';
    const s = tab.stats;
    return `DOM: ${s.domNodes} | Network: ${s.networkRequests} | Mutations: ${s.mutationCount}/sec`;
  };

  const getHostname = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname;
    } catch (_) {
      return 'unknown';
    }
  };

  const currentCategoryList = () => {
    switch (activeCategory) {
      case 'heavy':
        return heavyTabs;
      case 'duplicates':
        return duplicateTabs;
      case 'inactive':
        return inactiveTabs;
    }
  };

  const list = currentCategoryList();

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel overflow-hidden border border-zinc-800/40">
      {/* Category selector */}
      <div className="flex border-b border-zinc-800/40 bg-zinc-900/10">
        <button
          onClick={() => setActiveCategory('heavy')}
          className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 outline-none ${
            activeCategory === 'heavy'
              ? 'border-emerald-500 text-white bg-zinc-900/30'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Heavy Resource ({heavyTabs.length})
        </button>
        <button
          onClick={() => setActiveCategory('duplicates')}
          className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 outline-none ${
            activeCategory === 'duplicates'
              ? 'border-emerald-500 text-white bg-zinc-900/30'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Duplicates ({duplicateTabs.length})
        </button>
        <button
          onClick={() => setActiveCategory('inactive')}
          className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 outline-none ${
            activeCategory === 'inactive'
              ? 'border-emerald-500 text-white bg-zinc-900/30'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Inactive Idle ({inactiveTabs.length})
        </button>
      </div>

      {/* Tabs Container list */}
      <div className="flex-1 overflow-y-auto max-h-[360px] p-4 divide-y divide-zinc-900/40">
        {list.length > 0 ? (
          list.map(tab => (
            <div key={tab.id} className="flex items-center justify-between py-3.5 group/item transition-colors hover:bg-zinc-900/5 px-2 rounded-xl">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Favicon or fallback dot */}
                {tab.favIconUrl ? (
                  <img
                    src={tab.favIconUrl}
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-zinc-600 flex-shrink-0" />
                )}
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold truncate text-zinc-200 group-hover/item:text-white transition-colors leading-tight">
                      {tab.title || 'Untitled'}
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase font-mono">
                      {getHostname(tab.url)}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 font-medium truncate mt-0.5 max-w-sm">
                    {getTabStatsLabel(tab)}
                  </p>
                </div>
              </div>

              {/* Badges & Actions */}
              <div className="flex items-center gap-3">
                {/* Time or Tier badge */}
                {activeCategory === 'inactive' ? (
                  <span className="text-[10px] font-bold text-amber-400 px-2 py-0.5 bg-amber-400/5 border border-amber-500/10 rounded-full">
                    {formatDuration(tab.inactiveDurationMs)}
                  </span>
                ) : (
                  <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${getTierBadgeColor(tab.resourceTier)}`}>
                    {tab.resourceTier}
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Native Suspend tab (only if it has not been suspended yet) */}
                  {!tab.active && activeCategory === 'inactive' && (
                    <button
                      onClick={() => onSuspendTab(tab.id)}
                      title="Suspend Tab (Discard memory)"
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-all border border-transparent hover:border-zinc-700/50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {/* Close Tab */}
                  <button
                    onClick={() => onCloseTab(tab.id)}
                    title="Close Tab"
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-all border border-transparent hover:border-zinc-700/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
            <Sparkles className="w-8 h-8 text-zinc-600 mb-2 stroke-1" />
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">All Healthy</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px]">
              {activeCategory === 'heavy' && 'No heavy resource-consuming tabs detected.'}
              {activeCategory === 'duplicates' && 'No duplicate tabs found.'}
              {activeCategory === 'inactive' && 'No tabs are currently sitting idle.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

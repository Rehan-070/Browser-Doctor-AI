import React from 'react';
import { Settings, BubblePosition } from '../../shared/types';
import { Settings as SettingsIcon, Bell, Eye, EyeOff, Monitor, Compass, ShieldCheck } from 'lucide-react';

interface SettingsViewProps {
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSaveSettings }) => {
  const handleToggle = (key: keyof Settings) => {
    onSaveSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleSelect = (key: keyof Settings, value: any) => {
    onSaveSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="rounded-2xl glass-panel p-6 border border-zinc-800/40 divide-y divide-zinc-900/40">
      {/* Header */}
      <div className="flex items-center gap-2 pb-4 mb-4">
        <SettingsIcon className="w-5 h-5 text-emerald-400" />
        <div>
          <h3 className="text-sm font-bold text-white">Extension Settings</h3>
          <p className="text-xs text-zinc-500">Configure widgets, alerts, and thresholds</p>
        </div>
      </div>

      {/* Bubble position */}
      <div className="py-4">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
          Bubble Corner Position
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as BubblePosition[]).map(pos => (
            <button
              key={pos}
              onClick={() => handleSelect('bubblePosition', pos)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                settings.bubblePosition === pos
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                  : 'bg-zinc-900/20 border-zinc-800/30 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {pos.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bubble size */}
      <div className="py-4">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
          Bubble Widget Size
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['small', 'medium', 'large'] as const).map(sz => (
            <button
              key={sz}
              onClick={() => handleSelect('bubbleSize', sz)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center capitalize ${
                settings.bubbleSize === sz
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                  : 'bg-zinc-900/20 border-zinc-800/30 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Health threshold slider */}
      <div className="py-4">
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Health Alert Threshold
          </label>
          <span className="text-xs font-bold text-emerald-400">{settings.healthThreshold}%</span>
        </div>
        <input
          type="range"
          min="40"
          max="90"
          value={settings.healthThreshold}
          onChange={(e) => handleSelect('healthThreshold', parseInt(e.target.value))}
          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <p className="text-[10px] text-zinc-500 mt-1">
          Trigger system notification if overall health drops below this percentage.
        </p>
      </div>

      {/* Toggles */}
      <div className="py-4 flex flex-col gap-4">
        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Bell className="w-4 h-4 text-zinc-400 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-zinc-200 block">Push Notifications</span>
              <span className="text-[10px] text-zinc-500">Alert me about heavy tabs or low health scores</span>
            </div>
          </div>
          <button
            onClick={() => handleToggle('notificationsEnabled')}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
              settings.notificationsEnabled ? 'bg-emerald-500' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Startup Launch */}
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Monitor className="w-4 h-4 text-zinc-400 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-zinc-200 block">Auto-launch Dashboard</span>
              <span className="text-[10px] text-zinc-500">Open full-page performance view on browser startup</span>
            </div>
          </div>
          <button
            onClick={() => handleToggle('launchDashboardOnStartup')}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
              settings.launchDashboardOnStartup ? 'bg-emerald-500' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.launchDashboardOnStartup ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Auto Hide */}
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            {settings.autoHide ? (
              <EyeOff className="w-4 h-4 text-zinc-400 mt-0.5" />
            ) : (
              <Eye className="w-4 h-4 text-zinc-400 mt-0.5" />
            )}
            <div>
              <span className="text-xs font-bold text-zinc-200 block">Semi-Transparent Idle</span>
              <span className="text-[10px] text-zinc-500">Fade floating bubble when mouse is not hovering</span>
            </div>
          </div>
          <button
            onClick={() => handleToggle('autoHide')}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
              settings.autoHide ? 'bg-emerald-500' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.autoHide ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

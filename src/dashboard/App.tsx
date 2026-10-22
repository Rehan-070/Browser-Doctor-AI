import React, { useState, useEffect } from 'react';
import { BrowserHealthReport, Settings, Recommendation } from '../shared/types';
import { ScoreRing } from './components/ScoreRing';
import { TabList } from './components/TabList';
import { Recommendations } from './components/Recommendations';
import { SettingsView } from './components/SettingsView';
import { HistoryChart } from './components/HistoryChart';
import { 
  Activity, 
  Cpu, 
  Layers, 
  History, 
  Sliders, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Fingerprint, 
  LayoutGrid, 
  RefreshCw,
  FolderHeart
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tabs' | 'history' | 'settings'>('overview');
  const [report, setReport] = useState<BrowserHealthReport | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [history, setHistory] = useState<{ timestamp: number; score: number }[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optMessage, setOptMessage] = useState('');

  // Initial load
  useEffect(() => {
    refreshData();
    
    // Set up auto-refresh every 5 seconds while dashboard is open
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    chrome.runtime.sendMessage({ action: 'get_health_report' }, (response) => {
      if (response) {
        setReport(response.report);
        setSettings(response.settings);
      }
    });

    chrome.runtime.sendMessage({ action: 'get_history' }, (response) => {
      if (response && response.history) {
        setHistory(response.history);
      }
    });
  };

  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    chrome.runtime.sendMessage({ action: 'save_settings', payload: newSettings });
  };

  const handleCloseTab = (tabId: number) => {
    chrome.runtime.sendMessage({ action: 'close_tab', payload: { tabId } }, (response) => {
      if (response && response.report) {
        setReport(response.report);
      }
    });
  };

  const handleSuspendTab = (tabId: number) => {
    chrome.runtime.sendMessage({ action: 'suspend_inactive' }, (response) => {
      if (response && response.report) {
        setReport(response.report);
      }
    });
  };

  // Optimization sequence
  const handleCentralOptimize = () => {
    if (isOptimizing) return;
    setIsOptimizing(true);
    setOptMessage('Analyzing browser state...');

    setTimeout(() => {
      setOptMessage('Closing duplicate tabs...');
      chrome.runtime.sendMessage({ action: 'close_duplicates' }, (response) => {
        setTimeout(() => {
          setOptMessage('Suspending idle backgrounds...');
          chrome.runtime.sendMessage({ action: 'suspend_inactive' }, (resp) => {
            setTimeout(() => {
              setOptMessage('Optimization complete!');
              if (resp && resp.report) {
                setReport(resp.report);
              }
              setIsOptimizing(false);
              setOptMessage('');
            }, 1000);
          });
        }, 1000);
      });
    }, 800);
  };

  const handleRecommendationAction = (rec: Recommendation) => {
    if (rec.type === 'duplicate') {
      chrome.runtime.sendMessage({ action: 'close_duplicates' }, (resp) => {
        if (resp && resp.report) setReport(resp.report);
      });
    } else if (rec.type === 'inactive') {
      chrome.runtime.sendMessage({ action: 'suspend_inactive' }, (resp) => {
        if (resp && resp.report) setReport(resp.report);
      });
    } else if (rec.type === 'heavy' && rec.actionData?.tabId) {
      handleCloseTab(rec.actionData.tabId);
    } else if (rec.actionLabel === 'Check Settings') {
      setActiveTab('settings');
    }
  };

  // Helper stats
  const score = report?.score || 100;
  const rating = report?.performanceRating || 'Excellent';
  const heavyCount = report?.heavyTabsCount || 0;
  const duplicateCount = report?.duplicateTabsCount || 0;
  const inactiveCount = report?.inactiveTabsCount || 0;

  return (
    <div className="min-h-screen bg-zinc-950 flex selection:bg-emerald-500 selection:text-zinc-950">
      
      {/* Sidebar Nav */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col p-6 justify-between flex-shrink-0">
        <div className="flex flex-col gap-8">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-tight leading-tight">
                Browser Doctor
              </h1>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                AI Assistant
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border outline-none ${
                activeTab === 'overview'
                  ? 'bg-zinc-900/50 text-white border-zinc-800'
                  : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/20'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Overview
            </button>

            <button
              onClick={() => setActiveTab('tabs')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border outline-none ${
                activeTab === 'tabs'
                  ? 'bg-zinc-900/50 text-white border-zinc-800'
                  : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/20'
              }`}
            >
              <Layers className="w-4 h-4" />
              Tabs Inspection
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border outline-none ${
                activeTab === 'history'
                  ? 'bg-zinc-900/50 text-white border-zinc-800'
                  : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/20'
              }`}
            >
              <History className="w-4 h-4" />
              Performance Log
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border outline-none ${
                activeTab === 'settings'
                  ? 'bg-zinc-900/50 text-white border-zinc-800'
                  : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/20'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Settings
            </button>
          </nav>
        </div>

        {/* Footer status info */}
        <div className="flex flex-col gap-2 p-4 rounded-xl border border-zinc-900 bg-zinc-900/20">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Scanners Active
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            AI Engine compiles live page metrics and manages suspension.
          </p>
        </div>
      </aside>

      {/* Main workspace container */}
      <main className="flex-1 flex flex-col p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        {/* Navigation title banner */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              Workspace / {activeTab}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white capitalize mt-0.5">
              {activeTab === 'overview' ? 'Performance Summary' : activeTab === 'tabs' ? 'Tabs Analyzer' : activeTab === 'history' ? 'Performance History' : 'Configurations'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              className="p-2.5 rounded-xl border border-zinc-900 hover:border-zinc-850 hover:bg-zinc-900/30 text-zinc-400 hover:text-white transition-all outline-none"
              title="Sync Statistics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            {/* Quick Optimize button */}
            <button
              disabled={isOptimizing}
              onClick={handleCentralOptimize}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md outline-none ${
                isOptimizing
                  ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                  : 'bg-white hover:bg-zinc-200 text-zinc-950 hover:scale-[1.02]'
              }`}
            >
              <Cpu className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
              {isOptimizing ? optMessage : 'Optimize Browser'}
            </button>
          </div>
        </header>

        {/* Dynamic Views */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left section: Health Ring & Stats cards */}
            <div className="md:col-span-1 flex flex-col gap-6">
              <ScoreRing score={score} rating={rating} />
              
              {/* Stat breakdowns */}
              <div className="rounded-2xl glass-panel p-5 border border-zinc-800/40 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Aggregated Metrics
                </h3>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold">Heavy memory tabs</span>
                  <span className="text-zinc-200 font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">{heavyCount}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold">Duplicate URLs</span>
                  <span className="text-zinc-200 font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">{duplicateCount}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold">Inactive idle tabs</span>
                  <span className="text-zinc-200 font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">{inactiveCount}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold">Total active tabs</span>
                  <span className="text-zinc-200 font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">{report?.totalTabsCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Right section: Recommendations & Future Modules */}
            <div className="md:col-span-2 flex flex-col gap-6">
              
              {/* Recommendations list */}
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                  AI Diagnostics
                </h3>
                {report && report.recommendations.length > 0 ? (
                  <Recommendations 
                    items={report.recommendations} 
                    onAction={handleRecommendationAction} 
                  />
                ) : (
                  <div className="p-8 rounded-2xl glass-panel border-dashed border-zinc-800 text-center text-zinc-500">
                    <p className="text-xs">No diagnostics issues found.</p>
                  </div>
                )}
              </div>

              {/* Future Modules Section */}
              <div className="mt-2">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                  Future Diagnostic Modules
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Security */}
                  <div className="p-4 rounded-xl border border-zinc-900/60 bg-zinc-900/10 flex flex-col gap-2 relative opacity-60">
                    <div className="flex items-center justify-between">
                      <ShieldCheck className="w-4 h-4 text-zinc-400" />
                      <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                        <Lock className="w-2 h-2" /> Locked
                      </span>
                    </div>
                    <span className="text-xs font-bold text-zinc-200 mt-1">AI Scam Detector</span>
                    <span className="text-[10px] text-zinc-500 leading-tight">
                      Blocks malicious URLs and checks active tab phishing activity.
                    </span>
                  </div>

                  {/* Privacy */}
                  <div className="p-4 rounded-xl border border-zinc-900/60 bg-zinc-900/10 flex flex-col gap-2 relative opacity-60">
                    <div className="flex items-center justify-between">
                      <Fingerprint className="w-4 h-4 text-zinc-400" />
                      <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                        <Lock className="w-2 h-2" /> Locked
                      </span>
                    </div>
                    <span className="text-xs font-bold text-zinc-200 mt-1">Privacy Shield</span>
                    <span className="text-[10px] text-zinc-500 leading-tight">
                      Tracks third-party cookies and inspects tracking scripts.
                    </span>
                  </div>

                  {/* Extension Health */}
                  <div className="p-4 rounded-xl border border-zinc-900/60 bg-zinc-900/10 flex flex-col gap-2 relative opacity-60">
                    <div className="flex items-center justify-between">
                      <FolderHeart className="w-4 h-4 text-zinc-400" />
                      <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                        <Lock className="w-2 h-2" /> Locked
                      </span>
                    </div>
                    <span className="text-xs font-bold text-zinc-200 mt-1">Extension Doctor</span>
                    <span className="text-[10px] text-zinc-500 leading-tight">
                      Analyzes CPU usage of other installed background extensions.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'tabs' && report && (
          <div className="h-full">
            <TabList 
              tabs={tabsListWithDummyDetails(report)} 
              onCloseTab={handleCloseTab} 
              onSuspendTab={handleSuspendTab} 
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="grid grid-cols-1 gap-6">
            <HistoryChart history={history} />
          </div>
        )}

        {activeTab === 'settings' && settings && (
          <div className="max-w-xl">
            <SettingsView 
              settings={settings} 
              onSaveSettings={handleSaveSettings} 
            />
          </div>
        )}

      </main>
    </div>
  );
}

// Quick helper to fill out empty stats structures for better rendering
function tabsListWithDummyDetails(report: BrowserHealthReport): any[] {
  // We can query tabs and fill out stats if empty so TabList component shows something clean
  // But wait, the report returned has tabs list aggregated already in background, which is passed down.
  // Since Chrome query tab elements might not have stats (e.g. before content script updates),
  // we query tabs directly through background or just return what background has gathered.
  // In our actual implementation, the dashboard retrieves the aggregated report from the background,
  // which contains the full TabInfo array.
  // Let's inspect: the background script compiles a list of TabInfo including active, stats, lastActive, etc.
  // This list is already attached as part of the tabs list in the background!
  // Wait! In background.ts, did we return the tabs list as part of the report?
  // Let's check background.ts:
  // "const report = calculateHealthReport(tabs);"
  // In `healthEngine.ts`, calculateHealthReport returns:
  // `{ score, heavyTabsCount, duplicateTabsCount, inactiveTabsCount, totalTabsCount, performanceRating, memoryRating, recommendations }`
  // Ah! It does NOT include the raw tabs list itself in the report output.
  // That means we need to either include it in the report, or return it along with the report in background.ts!
  // Let's check background.ts:
  // `runHealthCheck().then(report => { sendResponse({ report, settings }); });`
  // Ah! Yes, we can update background.ts to return the tabs list along with the report!
  // Or, let's look at what we sent in background.ts:
  // `runHealthCheck` returns the report. But wait! We can easily get the tabs list by:
  // 1. Changing `runHealthCheck` to return both `report` and `tabs` or modifying `BrowserHealthReport` to include the `tabs` list!
  // Let's check `types.ts`:
  // ```typescript
  // export interface BrowserHealthReport {
  //   score: number;
  //   heavyTabsCount: number;
  //   ...
  //   recommendations: Recommendation[];
  // }
  // ```
  // Wait, if it doesn't contain the `tabs` array, how does the React dashboard get the tabs?
  // It wouldn't know!
  // That's an excellent catch! We must update the `BrowserHealthReport` interface and the calculation in `healthEngine.ts` to include the list of tabs, or return it from `runHealthCheck` in `background.ts`.
  // Let's check which is cleaner: including it inside the report is extremely clean and matches all constraints!
  // Let's check `healthEngine.ts` and `background.ts` to see what we wrote.
  // In `healthEngine.ts`, we did:
  // `export function calculateHealthReport(tabs: TabInfo[]): BrowserHealthReport`
  // We can edit the return type of `calculateHealthReport` to include `tabs: TabInfo[]`.
  // Wait, let's check `types.ts` again: we can modify `types.ts` to add `tabs: TabInfo[]` to `BrowserHealthReport`.
  // Or, we can just return it from background.ts inside `runHealthCheck` response: `sendResponse({ report, settings, tabs })`.
  // Yes! In background.ts, we did:
  // ```typescript
  // async function runHealthCheck(): Promise<BrowserHealthReport> {
  //   const tabs = await getTabList();
  //   const report = calculateHealthReport(tabs);
  //   ...
  //   return report;
  // }
  // ```
  // If we change it to return the tabs list, or include it in `BrowserHealthReport`, let's make a quick replacement.
  // Let's check: can we just append `tabs: TabInfo[]` to `BrowserHealthReport` and return it from `calculateHealthReport`?
  // Let's modify `types.ts` and `healthEngine.ts`.
  // Since we are currently building, let's write `App.tsx` first, assuming `report.tabs` has the tabs. We can also fetch tabs inside `App.tsx` or let `report` contain them.
  // Let's make sure `App.tsx` retrieves `report.tabs` directly:
  // `const tabs = report?.tabs || [];`
  // In `types.ts`, we will add `tabs?: TabInfo[]` to `BrowserHealthReport`.
  // Let's see how `tabsListWithDummyDetails` is called in `App.tsx`:
  // `tabsListWithDummyDetails(report)`
  // In `App.tsx` we can write:
  // ```typescript
  // function tabsListWithDummyDetails(report: BrowserHealthReport): any[] {
  //   return report.tabs || [];
  // }
  // ```
  // That is super simple! Let's write `App.tsx` now.
  // Wait, let's look at the implementation of `tabsListWithDummyDetails` in our code:
  // ```typescript
  // function tabsListWithDummyDetails(report: BrowserHealthReport): any[] {
  //   return (report as any).tabs || [];
  // }
  // ```
  // Yes, that works perfectly and is extremely clean.
  return (report as any)?.tabs || [];
}

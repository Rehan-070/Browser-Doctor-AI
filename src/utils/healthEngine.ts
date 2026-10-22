import { TabStats, TabInfo, Recommendation, BrowserHealthReport, ResourceTier } from '../shared/types';
import { RESOURCE_TIERS } from '../shared/constants';

/**
 * Estimates the resource usage tier of a tab based on metrics reported by the content script.
 */
export function estimateResourceTier(stats?: TabStats): ResourceTier {
  if (!stats) return RESOURCE_TIERS.LIGHT;

  // Resource score logic based on DOM complexity and activity
  const domScore = (stats.domNodes / 1000) * 10;
  const mediaScore = stats.images * 2 + stats.videos * 15;
  const devScore = stats.canvas * 15 + stats.webgl * 30 + stats.iframes * 10;
  const scriptScore = stats.scripts * 3 + stats.mutationCount * 0.5;
  const netScore = stats.networkRequests * 1.5;

  const totalScore = domScore + mediaScore + devScore + scriptScore + netScore;

  if (totalScore < 30) return RESOURCE_TIERS.VERY_LIGHT;
  if (totalScore < 80) return RESOURCE_TIERS.LIGHT;
  if (totalScore < 180) return RESOURCE_TIERS.MEDIUM;
  if (totalScore < 350) return RESOURCE_TIERS.HEAVY;
  return RESOURCE_TIERS.VERY_HEAVY;
}

/**
 * Calculates the total browser health score (0-100) and compiles the full health report.
 */
export function calculateHealthReport(tabs: TabInfo[]): BrowserHealthReport {
  let score = 100;
  
  const totalTabs = tabs.length;
  let heavyTabsCount = 0;
  let duplicateTabsCount = 0;
  let inactiveTabsCount = 0;

  // 1. Deduct points for total tabs open (above a baseline of 5 tabs)
  if (totalTabs > 5) {
    const excessiveTabs = totalTabs - 5;
    score -= Math.min(excessiveTabs * 1.5, 25); // cap tab count penalty at 25 points
  }

  // Group by URL and Domain to calculate duplicates
  const urlCounts: { [key: string]: number } = {};
  tabs.forEach(t => {
    if (!t.url) return;
    try {
      const cleanUrl = t.url.split('#')[0]; // ignore hash fragments
      urlCounts[cleanUrl] = (urlCounts[cleanUrl] || 0) + 1;
    } catch (_) {}
  });

  // Mark tabs as duplicates and calculate penalty
  tabs.forEach(t => {
    if (!t.url) return;
    const cleanUrl = t.url.split('#')[0];
    if (urlCounts[cleanUrl] > 1) {
      t.isDuplicate = true;
    }
  });

  // Duplicate tabs count is the number of tabs that are duplicates but not the first occurrence
  const uniqueUrlsSeen = new Set<string>();
  tabs.forEach(t => {
    if (!t.url) return;
    const cleanUrl = t.url.split('#')[0];
    if (urlCounts[cleanUrl] > 1) {
      if (uniqueUrlsSeen.has(cleanUrl)) {
        duplicateTabsCount++;
      } else {
        uniqueUrlsSeen.add(cleanUrl);
      }
    }
  });

  score -= duplicateTabsCount * 4; // deduct 4 points per duplicate tab

  // 2. Inactive Tabs penalty
  // An inactive tab is a tab that has not been active for a while.
  // Deduct 1 point per inactive tab (above 5 inactive tabs).
  tabs.forEach(t => {
    // Check if inactive threshold exceeded (15 minutes)
    // and the tab is not currently active
    const fifteenMinutes = 15 * 60 * 1000;
    if (!t.active && t.inactiveDurationMs > fifteenMinutes) {
      inactiveTabsCount++;
    }
  });

  if (inactiveTabsCount > 5) {
    score -= Math.min((inactiveTabsCount - 5) * 1, 15); // cap at 15 points
  }

  // 3. Heavy Tab penalties
  tabs.forEach(t => {
    t.resourceTier = estimateResourceTier(t.stats);
    if (t.resourceTier === RESOURCE_TIERS.VERY_HEAVY) {
      heavyTabsCount++;
      score -= 6;
    } else if (t.resourceTier === RESOURCE_TIERS.HEAVY) {
      heavyTabsCount++;
      score -= 3;
    }
  });

  // Bound the health score between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Determine Ratings
  let performanceRating: BrowserHealthReport['performanceRating'] = 'Excellent';
  if (score < 50) performanceRating = 'Critical';
  else if (score < 70) performanceRating = 'Needs Attention';
  else if (score < 90) performanceRating = 'Good';

  let memoryRating: BrowserHealthReport['memoryRating'] = 'Good';
  const resourceWeight = tabs.reduce((acc, t) => {
    if (t.resourceTier === RESOURCE_TIERS.VERY_HEAVY) return acc + 4;
    if (t.resourceTier === RESOURCE_TIERS.HEAVY) return acc + 3;
    if (t.resourceTier === RESOURCE_TIERS.MEDIUM) return acc + 2;
    return acc + 1;
  }, 0);

  if (resourceWeight > 35) memoryRating = 'High';
  else if (resourceWeight > 18) memoryRating = 'Medium';

  // Generate actionable recommendations
  const recommendations: Recommendation[] = [];

  if (duplicateTabsCount > 0) {
    recommendations.push({
      id: 'duplicates',
      type: 'duplicate',
      text: `You have ${duplicateTabsCount} duplicate page${duplicateTabsCount > 1 ? 's' : ''} open.`,
      actionLabel: 'Close Duplicates',
    });
  }

  if (inactiveTabsCount > 2) {
    recommendations.push({
      id: 'inactive',
      type: 'inactive',
      text: `${inactiveTabsCount} tabs have been idle for a while and are wasting background memory.`,
      actionLabel: 'Suspend Idle Tabs',
    });
  }

  // Pick the single heaviest tab and recommend closing or optimizing
  const heavyTabsList = tabs
    .filter(t => t.resourceTier === RESOURCE_TIERS.HEAVY || t.resourceTier === RESOURCE_TIERS.VERY_HEAVY)
    .sort((a, b) => {
      const aScore = getStatsScore(a.stats);
      const bScore = getStatsScore(b.stats);
      return bScore - aScore;
    });

  if (heavyTabsList.length > 0) {
    const topHeavyTab = heavyTabsList[0];
    const hostname = getHostname(topHeavyTab.url);
    recommendations.push({
      id: `heavy-${topHeavyTab.id}`,
      type: 'heavy',
      text: `"${topHeavyTab.title.substring(0, 30)}..." (${hostname}) is consuming high resources.`,
      actionLabel: 'Close Tab',
      actionData: { tabId: topHeavyTab.id },
    });
  }

  // General tips
  if (totalTabs > 20) {
    recommendations.push({
      id: 'too-many-tabs',
      type: 'general',
      text: `With ${totalTabs} open tabs, Chrome is likely throttling performance. Consider grouping or cleaning up.`,
      actionLabel: 'Clean Up Tabs',
    });
  }

  if (score > 90 && recommendations.length === 0) {
    recommendations.push({
      id: 'perfect',
      type: 'general',
      text: 'Your browser health is excellent! No optimizations needed.',
      actionLabel: 'Check Settings',
    });
  }

  return {
    score,
    heavyTabsCount,
    duplicateTabsCount,
    inactiveTabsCount,
    totalTabsCount: totalTabs,
    performanceRating,
    memoryRating,
    recommendations,
    tabs,
  };
}

function getStatsScore(stats?: TabStats): number {
  if (!stats) return 0;
  return stats.domNodes + stats.images * 10 + stats.videos * 50 + stats.canvas * 50 + stats.webgl * 100 + stats.iframes * 30 + stats.mutationCount * 2;
}

function getHostname(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    return url.hostname;
  } catch (_) {
    return 'unknown';
  }
}

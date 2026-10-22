import { Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  bubblePosition: 'top-right',
  bubbleSize: 'medium',
  theme: 'dark',
  autoHide: false,
  notificationsEnabled: true,
  healthThreshold: 70,
  launchDashboardOnStartup: false,
};

export const RESOURCE_TIERS = {
  VERY_LIGHT: 'Very Light' as const,
  LIGHT: 'Light' as const,
  MEDIUM: 'Medium' as const,
  HEAVY: 'Heavy' as const,
  VERY_HEAVY: 'Very Heavy' as const,
};

export const STORAGE_KEYS = {
  SETTINGS: 'browser_doctor_settings',
  HEALTH_HISTORY: 'browser_doctor_health_history',
  TAB_STATS: 'browser_doctor_tab_stats',
};

export const SCAN_INTERVAL_MS = 5000; // 5 seconds
export const INACTIVE_THRESHOLD_MS = 1000 * 60 * 15; // 15 minutes is inactive

export interface TabStats {
  domNodes: number;
  images: number;
  videos: number;
  canvas: number;
  webgl: number;
  iframes: number;
  scripts: number;
  mutationCount: number;
  networkRequests: number;
  timestamp: number;
}

export type ResourceTier = 'Very Light' | 'Light' | 'Medium' | 'Heavy' | 'Very Heavy';

export interface TabInfo {
  id: number;
  url: string;
  title: string;
  favIconUrl?: string;
  active: boolean;
  lastActive: number; // timestamp
  stats?: TabStats;
  resourceTier: ResourceTier;
  isDuplicate: boolean;
  inactiveDurationMs: number;
}

export interface Recommendation {
  id: string;
  type: 'duplicate' | 'inactive' | 'heavy' | 'general';
  text: string;
  actionLabel: string;
  actionData?: any;
}

export type BubblePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface Settings {
  bubblePosition: BubblePosition;
  bubbleSize: 'small' | 'medium' | 'large';
  theme: 'dark' | 'light' | 'system';
  autoHide: boolean;
  notificationsEnabled: boolean;
  healthThreshold: number; // threshold to trigger alerts (e.g., below 70)
  launchDashboardOnStartup: boolean;
}

export interface BrowserHealthReport {
  score: number;
  heavyTabsCount: number;
  duplicateTabsCount: number;
  inactiveTabsCount: number;
  totalTabsCount: number;
  performanceRating: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical';
  memoryRating: 'Good' | 'Medium' | 'High';
  recommendations: Recommendation[];
  tabs: TabInfo[];
}

export interface ExtensionMessage {
  action: string;
  payload?: any;
}

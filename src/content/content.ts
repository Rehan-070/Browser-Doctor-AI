import { TabStats, Settings, BrowserHealthReport, BubblePosition } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';

// We import CSS styles as a raw string so we can easily inject them into the Shadow DOM.
// In Vite, we can use a custom import modifier or write a loader, but since we are writing
// a programmatic build, we can easily embed or read it.
// To keep content script bundling simple, we will inline the CSS here or inject a link.
// Since we want zero external dependency problems, inlining the CSS contents as a string is the most robust way!
// Let's copy the styles we just wrote directly into a const.
const BUBBLE_CSS = `
:host {
  all: initial;
  font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
  z-index: 999999999;
  position: fixed;
  user-select: none;
}
.doctor-bubble {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 15, 18, 0.85);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 6px 12px;
  border-radius: 9999px;
  color: #f4f4f5;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  cursor: grab;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, background-color 0.2s ease, border-color 0.2s ease;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  opacity: 0.65;
  transform: scale(0.96);
}
.doctor-bubble:active {
  cursor: grabbing;
}
.doctor-bubble.hovered,
.doctor-bubble:hover {
  opacity: 1;
  transform: scale(1.04);
  background: rgba(20, 20, 25, 0.95);
  border-color: rgba(255, 255, 255, 0.15);
}
.doctor-bubble.dragging {
  cursor: grabbing;
  opacity: 0.95;
  transform: scale(1.02);
  transition: none;
}
.doctor-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: relative;
}
.doctor-indicator::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  animation: pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}
.color-green { background-color: #10b981; }
.color-green::after { background-color: rgba(16, 185, 129, 0.4); }
.color-blue { background-color: #3b82f6; }
.color-blue::after { background-color: rgba(59, 130, 246, 0.4); }
.color-yellow { background-color: #eab308; }
.color-yellow::after { background-color: rgba(234, 179, 8, 0.4); }
.color-red { background-color: #ef4444; }
.color-red::after { background-color: rgba(239, 68, 68, 0.4); }
@keyframes pulse-ring {
  0% { transform: scale(0.7); opacity: 0.8; }
  80%, 100% { transform: scale(1.8); opacity: 0; }
}
.doctor-panel {
  position: absolute;
  width: 230px;
  background: rgba(20, 20, 25, 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  padding: 16px;
  color: #f4f4f5;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13px;
  transform: scale(0.95);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
  z-index: 100000;
}
.doctor-panel.active {
  transform: scale(1);
  opacity: 1;
  pointer-events: auto;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 8px;
}
.panel-title {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.01em;
}
.panel-score-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 13px;
}
.panel-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.panel-stat-item {
  display: flex;
  justify-content: space-between;
  color: #a1a1aa;
}
.panel-stat-value {
  color: #f4f4f5;
  font-weight: 500;
}
.panel-button {
  background: #ffffff;
  color: #09090b;
  border: none;
  border-radius: 8px;
  padding: 8px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.panel-button:hover {
  background: #e4e4e7;
}
.panel-button:active {
  transform: scale(0.98);
}
`;

// Runtime state
let currentSettings: Settings = { ...DEFAULT_SETTINGS };
let currentReport: BrowserHealthReport | null = null;
let mutationCounter = 0;
let mutationObserver: MutationObserver | null = null;

// DOM Elements inside Shadow Root
let hostElement: HTMLDivElement | null = null;
let shadow: ShadowRoot | null = null;
let bubbleElement: HTMLDivElement | null = null;
let panelElement: HTMLDivElement | null = null;
let indicatorElement: HTMLSpanElement | null = null;
let scoreTextElement: HTMLSpanElement | null = null;

// Initialize Content Script
function init() {
  // Prevent duplicate injections
  if (document.getElementById('browser-doctor-root')) return;

  setupMutationObserver();
  createUI();
  fetchInitialData();
  startMetricReporting();
  setupMessageListeners();
}

// Set up MutationObserver to track active page modifications
function setupMutationObserver() {
  mutationObserver = new MutationObserver((mutations) => {
    mutationCounter += mutations.length;
  });
  mutationObserver.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true
  });
}

// Generate the injected components inside Shadow DOM
function createUI() {
  hostElement = document.createElement('div');
  hostElement.id = 'browser-doctor-root';
  document.body.appendChild(hostElement);

  shadow = hostElement.attachShadow({ mode: 'closed' });

  // Stylesheet
  const style = document.createElement('style');
  style.textContent = BUBBLE_CSS;
  shadow.appendChild(style);

  // Bubble Pill
  bubbleElement = document.createElement('div');
  bubbleElement.className = 'doctor-bubble';
  bubbleElement.innerHTML = `
    <span class="doctor-indicator color-green" id="indicator"></span>
    <span id="score-text">--</span>
    <span>Health</span>
  `;
  shadow.appendChild(bubbleElement);

  // Mini Panel
  panelElement = document.createElement('div');
  panelElement.className = 'doctor-panel';
  updatePanelContent();
  shadow.appendChild(panelElement);

  // References
  indicatorElement = bubbleElement.querySelector('#indicator');
  scoreTextElement = bubbleElement.querySelector('#score-text');

  setupDragging();
  setupClickEvents();
}

// Fetch settings and health from background
function fetchInitialData() {
  chrome.runtime.sendMessage({ action: 'get_health_report' }, (response) => {
    if (response) {
      currentSettings = response.settings;
      currentReport = response.report;
      updateUI();
    }
  });
}

// Position layout mapping
const POSITION_STYLES = {
  'top-right': { top: '20px', right: '20px', bottom: 'auto', left: 'auto' },
  'top-left': { top: '20px', left: '20px', bottom: 'auto', right: 'auto' },
  'bottom-right': { bottom: '20px', right: '20px', top: 'auto', left: 'auto' },
  'bottom-left': { bottom: '20px', left: '20px', top: 'auto', right: 'auto' },
};

function updateUI() {
  if (!hostElement || !bubbleElement || !indicatorElement || !scoreTextElement) return;

  // Apply Bubble Size
  const size = currentSettings.bubbleSize;
  if (size === 'small') {
    bubbleElement.style.padding = '4px 8px';
    bubbleElement.style.fontSize = '11px';
  } else if (size === 'large') {
    bubbleElement.style.padding = '8px 16px';
    bubbleElement.style.fontSize = '15px';
  } else {
    bubbleElement.style.padding = '6px 12px';
    bubbleElement.style.fontSize = '13px';
  }

  // Set health details
  if (currentReport) {
    const score = currentReport.score;
    scoreTextElement.textContent = String(score);
    
    // Reset colors
    indicatorElement.className = 'doctor-indicator';
    let colorClass = 'color-green';
    if (score < 50) colorClass = 'color-red';
    else if (score < 70) colorClass = 'color-yellow';
    else if (score < 90) colorClass = 'color-blue';

    indicatorElement.classList.add(colorClass);
  }

  // Position
  applyPosition(currentSettings.bubblePosition);
  updatePanelContent();
}

function applyPosition(pos: BubblePosition) {
  if (!hostElement) return;
  const style = POSITION_STYLES[pos];
  
  hostElement.style.top = style.top;
  hostElement.style.bottom = style.bottom;
  hostElement.style.left = style.left;
  hostElement.style.right = style.right;
}

// Generate Mini Panel layout
function updatePanelContent() {
  if (!panelElement) return;

  const score = currentReport ? `${currentReport.score}/100` : '--';
  const heavyCount = currentReport ? currentReport.heavyTabsCount : 0;
  const duplicateCount = currentReport ? currentReport.duplicateTabsCount : 0;
  const inactiveCount = currentReport ? currentReport.inactiveTabsCount : 0;
  const perf = currentReport ? currentReport.performanceRating : 'Excellent';
  const memory = currentReport ? currentReport.memoryRating : 'Good';

  // Position of mini panel relative to the bubble
  // We want the panel to be placed below/above the bubble depending on the quadrant
  const pos = currentSettings.bubblePosition;
  if (pos.startsWith('top')) {
    panelElement.style.top = '40px';
    panelElement.style.bottom = 'auto';
  } else {
    panelElement.style.bottom = '40px';
    panelElement.style.top = 'auto';
  }

  if (pos.endsWith('right')) {
    panelElement.style.right = '0px';
    panelElement.style.left = 'auto';
  } else {
    panelElement.style.left = '0px';
    panelElement.style.right = 'auto';
  }

  panelElement.innerHTML = `
    <div class="panel-header">
      <span class="panel-title">Browser Health</span>
      <div class="panel-score-badge">
        <span class="doctor-indicator ${getIndicatorColorClass(currentReport?.score || 100)}"></span>
        <span>${score}</span>
      </div>
    </div>
    <div class="panel-stats">
      <div class="panel-stat-item">
        <span>Heavy Tabs</span>
        <span class="panel-stat-value">${heavyCount}</span>
      </div>
      <div class="panel-stat-item">
        <span>Duplicate Tabs</span>
        <span class="panel-stat-value">${duplicateCount}</span>
      </div>
      <div class="panel-stat-item">
        <span>Inactive Tabs</span>
        <span class="panel-stat-value">${inactiveCount}</span>
      </div>
      <div class="panel-stat-item">
        <span>Performance</span>
        <span class="panel-stat-value" style="color: ${getRatingColor(perf)}">${perf}</span>
      </div>
      <div class="panel-stat-item">
        <span>Memory</span>
        <span class="panel-stat-value">${memory}</span>
      </div>
    </div>
    <button class="panel-button" id="open-dashboard-btn">
      Open Dashboard →
    </button>
  `;

  // Bind Open Dashboard
  const btn = panelElement.querySelector('#open-dashboard-btn');
  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({ action: 'open_dashboard' });
    closePanel();
  });
}

function getIndicatorColorClass(score: number): string {
  if (score < 50) return 'color-red';
  if (score < 70) return 'color-yellow';
  if (score < 90) return 'color-blue';
  return 'color-green';
}

function getRatingColor(perf: string): string {
  if (perf === 'Critical') return '#ef4444';
  if (perf === 'Needs Attention') return '#eab308';
  if (perf === 'Good') return '#3b82f6';
  return '#10b981';
}

// Drag & Drop implementation for floating bubble
function setupDragging() {
  if (!bubbleElement || !hostElement) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  // Touch & Mouse triggers
  const onStart = (e: MouseEvent | TouchEvent) => {
    // Prevent panel toggle during drag
    isDragging = false; 
    
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

    startX = clientX;
    startY = clientY;

    // Get current bounding box
    const rect = hostElement!.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    // Set fixed sizing instead of quadrant absolute values during drag
    hostElement!.style.top = `${initialTop}px`;
    hostElement!.style.left = `${initialLeft}px`;
    hostElement!.style.bottom = 'auto';
    hostElement!.style.right = 'auto';

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  };

  const onMove = (e: MouseEvent | TouchEvent) => {
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    // Threshold drag triggers
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      if (!isDragging) {
        isDragging = true;
        bubbleElement!.classList.add('dragging');
        closePanel();
      }
    }

    if (isDragging) {
      if (e.cancelable) e.preventDefault();
      hostElement!.style.left = `${initialLeft + dx}px`;
      hostElement!.style.top = `${initialTop + dy}px`;
    }
  };

  const onEnd = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);

    if (isDragging) {
      isDragging = false;
      bubbleElement!.classList.remove('dragging');

      // Snap to closest corner
      const rect = hostElement!.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Distance to 4 corners
      const midX = rect.left + rect.width / 2;
      const midY = rect.top + rect.height / 2;

      let bestCorner: BubblePosition = 'top-right';
      let minDist = Infinity;

      const corners: { pos: BubblePosition; x: number; y: number }[] = [
        { pos: 'top-left', x: 0, y: 0 },
        { pos: 'top-right', x: viewportWidth, y: 0 },
        { pos: 'bottom-left', x: 0, y: viewportHeight },
        { pos: 'bottom-right', x: viewportWidth, y: viewportHeight }
      ];

      corners.forEach(c => {
        const d = Math.hypot(midX - c.x, midY - c.y);
        if (d < minDist) {
          minDist = d;
          bestCorner = c.pos;
        }
      });

      // Update corner settings
      currentSettings.bubblePosition = bestCorner;
      chrome.runtime.sendMessage({
        action: 'save_settings',
        payload: { bubblePosition: bestCorner }
      }, (response) => {
        if (response && response.settings) {
          currentSettings = response.settings;
          updateUI();
        }
      });
    }
  };

  bubbleElement.addEventListener('mousedown', onStart);
  bubbleElement.addEventListener('touchstart', onStart, { passive: true });
}

function setupClickEvents() {
  if (!bubbleElement || !panelElement) return;

  bubbleElement.addEventListener('click', (e) => {
    // If the click is actually drag cleanup, skip toggle
    const isDrag = bubbleElement!.classList.contains('dragging');
    if (isDrag) return;

    e.stopPropagation();
    togglePanel();
  });

  // Handle outside clicks to close panel
  document.addEventListener('click', (e) => {
    if (panelElement && panelElement.classList.contains('active')) {
      // Since mode is 'closed', click outside the custom host element means we should close
      // But we must also check if the click target is the host itself or contained in the shadow
      const path = e.composedPath();
      if (!path.includes(hostElement!)) {
        closePanel();
      }
    }
  });

  // Idle hover state handling
  let hoverTimeout: any;
  bubbleElement.addEventListener('mouseenter', () => {
    bubbleElement!.classList.add('hovered');
    clearTimeout(hoverTimeout);
  });
  bubbleElement.addEventListener('mouseleave', () => {
    hoverTimeout = setTimeout(() => {
      bubbleElement!.classList.remove('hovered');
    }, 1500); // remain slightly solid for a moment
  });
}

function togglePanel() {
  if (!panelElement) return;
  const isActive = panelElement.classList.contains('active');
  if (isActive) {
    closePanel();
  } else {
    // Fetch latest metrics when opening mini panel
    chrome.runtime.sendMessage({ action: 'get_health_report' }, (response) => {
      if (response) {
        currentReport = response.report;
        updatePanelContent();
        panelElement!.classList.add('active');
        bubbleElement!.classList.add('hovered');
      }
    });
  }
}

function closePanel() {
  panelElement?.classList.remove('active');
  bubbleElement?.classList.remove('hovered');
}

// Throttled stats gatherer
function startMetricReporting() {
  // Report initial statistics right after DOM completes
  setTimeout(reportStats, 1000);

  // Run periodic scans
  setInterval(reportStats, 5000);
}

// Inspect DOM to extract metrics
async function reportStats() {
  try {
    const domNodes = document.getElementsByTagName('*').length;
    const images = document.getElementsByTagName('img').length;
    const videos = document.getElementsByTagName('video').length;
    const canvas = document.getElementsByTagName('canvas').length;
    const iframes = document.getElementsByTagName('iframe').length;
    const scripts = document.getElementsByTagName('script').length;

    // Check WebGL context support
    let webgl = 0;
    try {
      const glCanvas = document.createElement('canvas');
      const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
      if (gl) webgl = 1;
    } catch (_) {}

    // Network stats
    let networkRequests = 0;
    try {
      networkRequests = window.performance.getEntriesByType('resource').length;
    } catch (_) {}

    // Read and reset mutation count
    const count = mutationCounter;
    mutationCounter = 0;

    const stats: TabStats = {
      domNodes,
      images,
      videos,
      canvas,
      webgl,
      iframes,
      scripts,
      mutationCount: count,
      networkRequests,
      timestamp: Date.now(),
    };

    // Send metrics to background worker
    chrome.runtime.sendMessage({
      action: 'report_stats',
      payload: stats
    }, (response) => {
      // Re-fetch report to keep the indicator updated
      if (response && response.success) {
        chrome.runtime.sendMessage({ action: 'get_health_report' }, (resp) => {
          if (resp) {
            currentReport = resp.report;
            updateUI();
          }
        });
      }
    });
  } catch (err) {
    console.error('Error reporting tab statistics:', err);
  }
}

// Background sync messages
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'settings_updated') {
      currentSettings = message.payload;
      updateUI();
      sendResponse({ success: true });
    }
  });
}

// Run initializer
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}

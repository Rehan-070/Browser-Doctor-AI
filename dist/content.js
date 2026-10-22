(function(){"use strict";const P={bubblePosition:"top-right",bubbleSize:"medium",theme:"dark",autoHide:!1,notificationsEnabled:!0,healthThreshold:70,launchDashboardOnStartup:!1},D=`
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
`;let b={...P},a=null,L=0,M=null,r=null,v=null,e=null,s=null,y=null,C=null;function S(){document.getElementById("browser-doctor-root")||(N(),$(),I(),U(),W())}function N(){M=new MutationObserver(t=>{L+=t.length}),M.observe(document.body||document.documentElement,{childList:!0,subtree:!0,attributes:!0})}function $(){r=document.createElement("div"),r.id="browser-doctor-root",document.body.appendChild(r),v=r.attachShadow({mode:"closed"});const t=document.createElement("style");t.textContent=D,v.appendChild(t),e=document.createElement("div"),e.className="doctor-bubble",e.innerHTML=`
    <span class="doctor-indicator color-green" id="indicator"></span>
    <span id="score-text">--</span>
    <span>Health</span>
  `,v.appendChild(e),s=document.createElement("div"),s.className="doctor-panel",k(),v.appendChild(s),y=e.querySelector("#indicator"),C=e.querySelector("#score-text"),R(),q()}function I(){chrome.runtime.sendMessage({action:"get_health_report"},t=>{t&&(b=t.settings,a=t.report,x())})}const O={"top-right":{top:"20px",right:"20px",bottom:"auto",left:"auto"},"top-left":{top:"20px",left:"20px",bottom:"auto",right:"auto"},"bottom-right":{bottom:"20px",right:"20px",top:"auto",left:"auto"},"bottom-left":{bottom:"20px",left:"20px",top:"auto",right:"auto"}};function x(){if(!r||!e||!y||!C)return;const t=b.bubbleSize;if(t==="small"?(e.style.padding="4px 8px",e.style.fontSize="11px"):t==="large"?(e.style.padding="8px 16px",e.style.fontSize="15px"):(e.style.padding="6px 12px",e.style.fontSize="13px"),a){const o=a.score;C.textContent=String(o),y.className="doctor-indicator";let i="color-green";o<50?i="color-red":o<70?i="color-yellow":o<90&&(i="color-blue"),y.classList.add(i)}Y(b.bubblePosition),k()}function Y(t){if(!r)return;const o=O[t];r.style.top=o.top,r.style.bottom=o.bottom,r.style.left=o.left,r.style.right=o.right}function k(){if(!s)return;const t=a?`${a.score}/100`:"--",o=a?a.heavyTabsCount:0,i=a?a.duplicateTabsCount:0,f=a?a.inactiveTabsCount:0,u=a?a.performanceRating:"Excellent",h=a?a.memoryRating:"Good",p=b.bubblePosition;p.startsWith("top")?(s.style.top="40px",s.style.bottom="auto"):(s.style.bottom="40px",s.style.top="auto"),p.endsWith("right")?(s.style.right="0px",s.style.left="auto"):(s.style.left="0px",s.style.right="auto"),s.innerHTML=`
    <div class="panel-header">
      <span class="panel-title">Browser Health</span>
      <div class="panel-score-badge">
        <span class="doctor-indicator ${H((a==null?void 0:a.score)||100)}"></span>
        <span>${t}</span>
      </div>
    </div>
    <div class="panel-stats">
      <div class="panel-stat-item">
        <span>Heavy Tabs</span>
        <span class="panel-stat-value">${o}</span>
      </div>
      <div class="panel-stat-item">
        <span>Duplicate Tabs</span>
        <span class="panel-stat-value">${i}</span>
      </div>
      <div class="panel-stat-item">
        <span>Inactive Tabs</span>
        <span class="panel-stat-value">${f}</span>
      </div>
      <div class="panel-stat-item">
        <span>Performance</span>
        <span class="panel-stat-value" style="color: ${X(u)}">${u}</span>
      </div>
      <div class="panel-stat-item">
        <span>Memory</span>
        <span class="panel-stat-value">${h}</span>
      </div>
    </div>
    <button class="panel-button" id="open-dashboard-btn">
      Open Dashboard →
    </button>
  `;const c=s.querySelector("#open-dashboard-btn");c==null||c.addEventListener("click",n=>{n.stopPropagation(),chrome.runtime.sendMessage({action:"open_dashboard"}),E()})}function H(t){return t<50?"color-red":t<70?"color-yellow":t<90?"color-blue":"color-green"}function X(t){return t==="Critical"?"#ef4444":t==="Needs Attention"?"#eab308":t==="Good"?"#3b82f6":"#10b981"}function R(){if(!e||!r)return;let t=!1,o=0,i=0,f=0,u=0;const h=n=>{t=!1;const g=n instanceof MouseEvent?n.clientX:n.touches[0].clientX,l=n instanceof MouseEvent?n.clientY:n.touches[0].clientY;o=g,i=l;const d=r.getBoundingClientRect();f=d.left,u=d.top,r.style.top=`${u}px`,r.style.left=`${f}px`,r.style.bottom="auto",r.style.right="auto",document.addEventListener("mousemove",p),document.addEventListener("mouseup",c),document.addEventListener("touchmove",p,{passive:!1}),document.addEventListener("touchend",c)},p=n=>{const g=n instanceof MouseEvent?n.clientX:n.touches[0].clientX,l=n instanceof MouseEvent?n.clientY:n.touches[0].clientY,d=g-o,w=l-i;(Math.abs(d)>5||Math.abs(w)>5)&&(t||(t=!0,e.classList.add("dragging"),E())),t&&(n.cancelable&&n.preventDefault(),r.style.left=`${f+d}px`,r.style.top=`${u+w}px`)},c=()=>{if(document.removeEventListener("mousemove",p),document.removeEventListener("mouseup",c),document.removeEventListener("touchmove",p),document.removeEventListener("touchend",c),t){t=!1,e.classList.remove("dragging");const n=r.getBoundingClientRect(),g=window.innerWidth,l=window.innerHeight,d=n.left+n.width/2,w=n.top+n.height/2;let T="top-right",_=1/0;[{pos:"top-left",x:0,y:0},{pos:"top-right",x:g,y:0},{pos:"bottom-left",x:0,y:l},{pos:"bottom-right",x:g,y:l}].forEach(m=>{const B=Math.hypot(d-m.x,w-m.y);B<_&&(_=B,T=m.pos)}),b.bubblePosition=T,chrome.runtime.sendMessage({action:"save_settings",payload:{bubblePosition:T}},m=>{m&&m.settings&&(b=m.settings,x())})}};e.addEventListener("mousedown",h),e.addEventListener("touchstart",h,{passive:!0})}function q(){if(!e||!s)return;e.addEventListener("click",o=>{e.classList.contains("dragging")||(o.stopPropagation(),A())}),document.addEventListener("click",o=>{s&&s.classList.contains("active")&&(o.composedPath().includes(r)||E())});let t;e.addEventListener("mouseenter",()=>{e.classList.add("hovered"),clearTimeout(t)}),e.addEventListener("mouseleave",()=>{t=setTimeout(()=>{e.classList.remove("hovered")},1500)})}function A(){if(!s)return;s.classList.contains("active")?E():chrome.runtime.sendMessage({action:"get_health_report"},o=>{o&&(a=o.report,k(),s.classList.add("active"),e.classList.add("hovered"))})}function E(){s==null||s.classList.remove("active"),e==null||e.classList.remove("hovered")}function U(){setTimeout(z,1e3),setInterval(z,5e3)}async function z(){try{const t=document.getElementsByTagName("*").length,o=document.getElementsByTagName("img").length,i=document.getElementsByTagName("video").length,f=document.getElementsByTagName("canvas").length,u=document.getElementsByTagName("iframe").length,h=document.getElementsByTagName("script").length;let p=0;try{const l=document.createElement("canvas");(l.getContext("webgl")||l.getContext("experimental-webgl"))&&(p=1)}catch{}let c=0;try{c=window.performance.getEntriesByType("resource").length}catch{}const n=L;L=0;const g={domNodes:t,images:o,videos:i,canvas:f,webgl:p,iframes:u,scripts:h,mutationCount:n,networkRequests:c,timestamp:Date.now()};chrome.runtime.sendMessage({action:"report_stats",payload:g},l=>{l&&l.success&&chrome.runtime.sendMessage({action:"get_health_report"},d=>{d&&(a=d.report,x())})})}catch(t){console.error("Error reporting tab statistics:",t)}}function W(){chrome.runtime.onMessage.addListener((t,o,i)=>{t.action==="settings_updated"&&(b=t.payload,x(),i({success:!0}))})}document.readyState==="complete"||document.readyState==="interactive"?S():document.addEventListener("DOMContentLoaded",S)})();

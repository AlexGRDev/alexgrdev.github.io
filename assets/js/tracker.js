/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   tracker.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/27 08:44:08 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/16 12:12:50 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const WORKER = "https://tfg-tracker.alexgaro2015-5ed.workers.dev";

const OS_MAP = [
  [/Android/i, ua => ({ os: "Android", version: (ua.match(/Android ([\d.]+)/i) || [])[1] || null, mobile: true, type: "android" })],
  [/iPhone/i, ua => ({ os: "iOS", version: ((ua.match(/OS ([\d_]+)/i) || [])[1] || "").replace(/_/g, "."), mobile: true, type: "ios" })],
  [/iPad|Mac.*Touch/i, ua => ({ os: "iPadOS", version: ((ua.match(/OS ([\d_]+)/i) || [])[1] || "").replace(/_/g, "."), mobile: false, type: "ios" })],
  [/Macintosh|Mac OS X/i, ua => ({ os: "macOS", version: ((ua.match(/Mac OS X ([\d_.]+)/i) || [])[1] || "").replace(/_/g, "."), mobile: false, type: "macos" })],
  [/Windows NT/i, ua => ({ os: "Windows", version: { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" }[(ua.match(/Windows NT ([\d.]+)/i) || [])[1]] || null, mobile: false, type: "windows" })],
  [/CrOS/i, () => ({ os: "ChromeOS", version: null, mobile: false, type: "chromeos" })],
  [/Linux/i, ua => ({ os: /Ubuntu/i.test(ua) ? "Ubuntu" : /Fedora/i.test(ua) ? "Fedora" : "Linux", version: null, mobile: false, type: "linux" })]
];

const BASELINES = {
  android: { fast: 30, slow: 150 }, ios: { fast: 5, slow: 25 }, macos: { fast: 4, slow: 20 },
  windows: { fast: 6, slow: 40 }, linux: { fast: 5, slow: 30 }, chromeos: { fast: 12, slow: 60 }, unknown: { fast: 8, slow: 60 }
};

const beh = {
  clicks: 0, rightClicks: 0, keystrokes: 0, totalMouseDist: 0,
  focusLost: 0, copyEvents: 0, pasteEvents: 0, maxScrollY: 0,
  _lx: null, _ly: null, start: Date.now()
};

["click", "contextmenu", "keydown", "copy", "paste", "blur", "scroll"].forEach(ev => {
  window.addEventListener(ev, () => {
    if (ev === "click") beh.clicks++;
    if (ev === "contextmenu") beh.rightClicks++;
    if (ev === "keydown") beh.keystrokes++;
    if (ev === "copy") beh.copyEvents++;
    if (ev === "paste") beh.pasteEvents++;
    if (ev === "blur") beh.focusLost++;
    if (ev === "scroll") beh.maxScrollY = Math.max(beh.maxScrollY, window.scrollY);
  });
});

window.addEventListener("mousemove", e => {
  if (beh._lx !== null) {
    const dx = e.clientX - beh._lx, dy = e.clientY - beh._ly;
    beh.totalMouseDist += Math.round(Math.sqrt(dx * dx + dy * dy));
  }
  beh._lx = e.clientX; beh._ly = e.clientY;
});

function detectOS(ua) {
  for (const [re, build] of OS_MAP) {
    if (re.test(ua) || (re === /iPad|Mac.*Touch/i && /Mac/i.test(ua) && navigator.maxTouchPoints > 1))
      return build(ua);
  }
  return { os: "Unknown", version: null, mobile: false, type: "unknown" };
}

function cpuBench(osType) {
  const bl = BASELINES[osType] || BASELINES.unknown;
  const t0 = performance.now();
  let x = 0;
  for (let i = 0; i < 1_000_000; i++) x += Math.sqrt(i);
  const ms = Math.round((performance.now() - t0) * 100) / 100;
  const score = Math.round(100 - ((Math.max(bl.fast, Math.min(bl.slow, ms)) - bl.fast) / (bl.slow - bl.fast)) * 100);
  const label = score >= 80 ? "excelente" : score >= 60 ? "bueno" : score >= 40 ? "normal" : score >= 20 ? "lento" : "muy lento";
  return { elapsed_ms: ms, score, rating: label, os_baseline_fast: bl.fast, os_baseline_slow: bl.slow };
}

function canvasFp() {
  try {
    const c = Object.assign(document.createElement("canvas"), { width: 280, height: 60 });
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#f00"; ctx.fillRect(0, 0, 10, 10);
    ctx.fillStyle = "rgba(0,0,200,.7)"; ctx.font = "14px Arial";
    ctx.fillText("TFG Browser Fingerprint", 2, 2);
    const url = c.toDataURL();
    let h = 0;
    for (let i = 0; i < url.length; i++) { h = ((h << 5) - h) + url.charCodeAt(i); h |= 0; }
    return (h >>> 0).toString(16).padStart(8, "0");
  } catch { return null; }
}

function audioFp() {
  return new Promise(res => {
    try {
      const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
      const osc = ctx.createOscillator();
      const comp = ctx.createDynamicsCompressor();
      osc.type = "triangle"; osc.frequency.value = 10000;
      osc.connect(comp); comp.connect(ctx.destination);
      osc.start(0); ctx.startRendering();
      ctx.oncomplete = e => {
        const d = e.renderedBuffer.getChannelData(0);
        let s = 0;
        for (let i = 0; i < d.length; i++) s += Math.abs(d[i]);
        res(s.toString().slice(0, 20));
      };
      setTimeout(() => res(null), 3000);
    } catch { res(null); }
  });
}

function webglFp() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    if (!gl) return null;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION), webgl2: !!c.getContext("webgl2")
    };
  } catch { return null; }
}

function localIpFp() {
  return new Promise(res => {
    try {
      const ips = new Set();
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("");
      pc.createOffer().then(o => pc.setLocalDescription(o));
      pc.onicecandidate = e => {
        const m = e?.candidate?.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (m) ips.add(m[1]);
      };
      setTimeout(() => { pc.close(); res([...ips]); }, 1500);
    } catch { res([]); }
  });
}

function incognitoFp() {
  return new Promise(res => {
    navigator.storage?.estimate()
      .then(({ quota }) => res({ likely: quota < 120 * 1024 * 1024, quota_mb: Math.round((quota || 0) / 1024 / 1024) }))
      .catch(() => res({ likely: false, quota_mb: null }));
  });
}

async function permissionsFp() {
  const names = ["geolocation", "notifications", "camera", "microphone", "clipboard-read", "clipboard-write"];
  const result = {};
  for (const name of names) {
    try { const s = await navigator.permissions.query({ name }); result[name] = s.state; }
    catch { result[name] = "unavailable"; }
  }
  return result;
}

function fontsFp() {
  const base = "monospace", test = "mmmmwwwwiiiiMMMWWWI";
  const c = document.createElement("canvas"), ctx = c.getContext("2d");
  ctx.font = `16px ${base}`;
  const bw = ctx.measureText(test).width;
  const list = [
    "Arial", "Arial Black", "Calibri", "Comic Sans MS", "Consolas", "Courier New", "Georgia",
    "Helvetica", "Impact", "Lucida Console", "Palatino Linotype", "Segoe UI", "Tahoma",
    "Times New Roman", "Trebuchet MS", "Verdana", "Menlo", "Monaco", "SF Mono", "Ubuntu",
    "DejaVu Sans", "Roboto", "Source Code Pro", "Fira Code", "JetBrains Mono", "Space Mono",
    "IBM Plex Mono", "Cascadia Code", "Hack", "Inconsolata"
  ];
  return list.filter(f => { ctx.font = `16px '${f}',${base}`; return ctx.measureText(test).width !== bw; });
}

function apiSupportFp() {
  const n = navigator, w = window;
  return {
    bluetooth: "bluetooth" in n, usb: "usb" in n, nfc: "nfc" in n,
    webXR: "xr" in n, webGPU: "gpu" in n, payments: "PaymentRequest" in w,
    credentials: "credentials" in n, serviceWorker: "serviceWorker" in n,
    webRTC: "RTCPeerConnection" in w, webGL: !!document.createElement("canvas").getContext("webgl"),
    webGL2: !!document.createElement("canvas").getContext("webgl2"),
    webAssembly: typeof WebAssembly !== "undefined", indexedDB: "indexedDB" in w,
    cacheAPI: "caches" in w, notif: "Notification" in w, wakeLock: "wakeLock" in n,
    vibration: "vibrate" in n, battery: "getBattery" in n, geolocation: "geolocation" in n,
    deviceOrientation: "DeviceOrientationEvent" in w, speechSynth: "speechSynthesis" in w,
    mediaDevices: "mediaDevices" in n, clipboard: !!n.clipboard, share: "share" in n,
    hid: "hid" in n, serial: "serial" in n, intersectionObs: "IntersectionObserver" in w,
    broadcastChannel: "BroadcastChannel" in w, eyeDropper: "EyeDropper" in w,
    compression: "CompressionStream" in w, screenCapture: !!(n.mediaDevices?.getDisplayMedia)
  };
}

function mediaPrefsFp() {
  const mq = q => window.matchMedia(q).matches;
  return {
    darkMode: mq("(prefers-color-scheme: dark)"),
    reducedMotion: mq("(prefers-reduced-motion: reduce)"),
    highContrast: mq("(prefers-contrast: high)"),
    colorGamut: mq("(color-gamut: p3)") ? "p3" : mq("(color-gamut: srgb)") ? "srgb" : "unknown",
    hover: mq("(hover: hover)"),
    pointer: mq("(pointer: fine)") ? "fine" : mq("(pointer: coarse)") ? "coarse" : "none",
    displayMode: mq("(display-mode: standalone)") ? "pwa" : "browser"
  };
}

function batteryFp() {
  return navigator.getBattery?.()
    .then(b => ({
      level: Math.round(b.level * 100), charging: b.charging,
      chargingTime: b.chargingTime === Infinity ? null : b.chargingTime,
      dischargingTime: b.dischargingTime === Infinity ? null : b.dischargingTime
    }))
    .catch(() => null) ?? Promise.resolve(null);
}

function getBehavior() {
  const totalH = document.documentElement.scrollHeight - window.innerHeight;
  return {
    timeOnPage: Math.round((Date.now() - beh.start) / 1000),
    scrollDepth: totalH > 0 ? Math.round((beh.maxScrollY / totalH) * 100) : 0,
    clicks: beh.clicks, rightClicks: beh.rightClicks, keystrokes: beh.keystrokes,
    totalMouseDist: beh.totalMouseDist, focusLost: beh.focusLost,
    copyEvents: beh.copyEvents, pasteEvents: beh.pasteEvents
  };
}

function buildBase(prefs, googleData, osInfo) {
  const consent = prefs.analytics && prefs.fingerprint ? "full"
    : prefs.analytics ? "analytics_only"
      : prefs.fingerprint ? "fingerprint_only" : "rejected";

  let sid = sessionStorage.getItem("tfg_session_id");
  if (!sid) { sid = crypto.randomUUID?.() ?? Date.now().toString(36); sessionStorage.setItem("tfg_session_id", sid); }

  return {
    google_id: googleData?.sub || "anonymous", google_name: googleData?.name || null,
    google_email: googleData?.email || null, google_picture: googleData?.picture || null,
    session_id: sid, timestamp: new Date().toISOString(), consent,
    page: {
      url: location.href, path: location.pathname, referrer: document.referrer || null,
      pageLoadTime: performance.timing ? Math.round(performance.timing.loadEventEnd - performance.timing.navigationStart) : null,
      domNodes: document.querySelectorAll("*").length
    },
    device: {
      os: osInfo.os, os_version: osInfo.version, os_type: osInfo.type,
      platform: navigator.platform, mobile: osInfo.mobile || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024),
      deviceMemory: navigator.deviceMemory || null, hardwareConcurrency: navigator.hardwareConcurrency || null
    },
    screen: {
      width: screen.width, height: screen.height, pixelRatio: window.devicePixelRatio,
      colorDepth: screen.colorDepth, orientation: screen.orientation?.type || null
    },
    network: {
      type: navigator.connection?.effectiveType || null, downlink: navigator.connection?.downlink || null,
      rtt: navigator.connection?.rtt || null, online: navigator.onLine
    },
    browser: {
      userAgent: navigator.userAgent, language: navigator.language,
      languages: [...(navigator.languages || [])],
      doNotTrack: navigator.doNotTrack, cookieEnabled: navigator.cookieEnabled
    }
  };
}

async function applyFingerprint(payload, osInfo) {
  const [audio, incognito, localIPs, battery, permissions] = await Promise.all([
    audioFp(), incognitoFp(), localIpFp(), batteryFp(), permissionsFp()
  ]);
  payload.device.cpuTiming = cpuBench(osInfo.type);
  payload.network.localIPs = localIPs;
  payload.fingerprint = {
    canvas: canvasFp(), audio, webgl: webglFp(), fonts: fontsFp(),
    incognito, battery, permissions,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: Intl.DateTimeFormat().resolvedOptions().locale,
    media: mediaPrefsFp(), apiSupport: apiSupportFp(),
    inputDevices: { touchPoints: navigator.maxTouchPoints || 0, touchSupport: "ontouchstart" in window }
  };
  payload.browser.automation = {
    webdriver: !!navigator.webdriver,
    headlessChrome: /HeadlessChrome/i.test(navigator.userAgent),
    selenium: !!(window.__selenium_evaluate || window.__selenium_unwrapped),
    phantomjs: !!(window.callPhantom || window._phantom),
    puppeteer: !!window.__pwInitScripts
  };
  payload.browser.plugins = [...(navigator.plugins || [])].map(p => ({ name: p.name, filename: p.filename }));
  payload.browser.apiSupport = payload.fingerprint.apiSupport;
}

async function buildPayload(prefs, googleData) {
  const osInfo = detectOS(navigator.userAgent);
  const payload = buildBase(prefs, googleData, osInfo);
  if (payload.consent === "rejected") return payload;
  if (prefs.analytics) {
    payload.behavior = getBehavior();
    payload.fingerprint = { media: mediaPrefsFp(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone };
  }
  if (prefs.fingerprint) await applyFingerprint(payload, osInfo);
  if (prefs.analytics) payload.behavior = getBehavior();
  return payload;
}

async function sendTracker(prefs) {
  try {
    const raw = localStorage.getItem("google_jwt");
    const data = raw ? JSON.parse(atob(raw.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) : null;
    const body = await buildPayload(prefs, data);
    fetch(WORKER, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => { });
  } catch (e) {
    console.warn("[tracker]", e);
  }
}

window.sendTracker = sendTracker;
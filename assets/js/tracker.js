/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   tracker.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/27 08:44:08 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/14 09:18:26 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

/* ────────────────────────────────────────────────────────────────────────── */
/* OS DETECTION — User-Agent parsing (más fiable que navigator.platform)      */
/* ────────────────────────────────────────────────────────────────────────── */

function detectOS(ua) {
  ua = ua || navigator.userAgent;

  // Android — ANTES de Linux para evitar falsos positivos
  if (/Android/i.test(ua)) {
    const v = ua.match(/Android\s([\d.]+)/i);
    return { os: "Android", version: v ? v[1] : null, mobile: true, type: "android" };
  }

  // iOS — iPhone
  if (/iPhone/i.test(ua)) {
    const v = ua.match(/OS\s([\d_]+)/i);
    return { os: "iOS", version: v ? v[1].replace(/_/g, ".") : null, mobile: true, type: "ios" };
  }

  // iPadOS (iPad con iPadOS 13+ puede reportarse como Mac en desktop mode)
  if (/iPad/i.test(ua) || (/Mac/i.test(ua) && navigator.maxTouchPoints > 1)) {
    const v = ua.match(/OS\s([\d_]+)/i);
    return { os: "iPadOS", version: v ? v[1].replace(/_/g, ".") : null, mobile: false, type: "ios" };
  }

  // macOS
  if (/Macintosh|Mac OS X/i.test(ua)) {
    const v = ua.match(/Mac OS X\s?([\d_]+)/i);
    const ver = v ? v[1].replace(/_/g, ".") : null;
    return { os: "macOS", version: ver, mobile: false, type: "macos" };
  }

  // Windows
  if (/Windows NT/i.test(ua)) {
    const v = ua.match(/Windows NT\s?([\d.]+)/i);
    const ntMap = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7", "6.0": "Vista", "5.1": "XP" };
    return { os: "Windows", version: ntMap[v ? v[1] : ""] || v?.[1] || null, mobile: false, type: "windows" };
  }

  // ChromeOS
  if (/CrOS/i.test(ua)) {
    return { os: "ChromeOS", version: null, mobile: false, type: "chromeos" };
  }

  // Linux desktop
  if (/Linux/i.test(ua)) {
    const distro = /Ubuntu/i.test(ua) ? "Ubuntu" : /Fedora/i.test(ua) ? "Fedora" : "Linux";
    return { os: distro, version: null, mobile: false, type: "linux" };
  }

  return { os: "Unknown", version: null, mobile: false, type: "unknown" };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* CPU BENCHMARK — calibrado por OS para dar scores comparables               */
/* ────────────────────────────────────────────────────────────────────────── */

function fp_cpu_timing(osType) {
  // Rangos de ms para 1M iteraciones sqrt, por plataforma típica
  // fast = dispositivo de gama alta, slow = gama baja/throttling
  const BASELINES = {
    android:  { fast: 30,  slow: 150 },  // Android varia muchísimo
    ios:      { fast: 5,   slow: 25  },  // iOS muy consistente y rápido
    macos:    { fast: 4,   slow: 20  },  // Apple Silicon y Intel reciente
    windows:  { fast: 6,   slow: 40  },  // PCs de gama media
    linux:    { fast: 5,   slow: 30  },  // Servidores y desktops
    chromeos: { fast: 12,  slow: 60  },  // Chromebooks limitados
    unknown:  { fast: 8,   slow: 60  }
  };

  const bl = BASELINES[osType] || BASELINES.unknown;
  const N  = 1_000_000;
  const t0 = performance.now();
  let x = 0;
  for (let i = 0; i < N; i++) x += Math.sqrt(i);
  const elapsed = performance.now() - t0;

  // Score 0-100 relativo a los rangos del OS detectado
  const clamped = Math.max(bl.fast, Math.min(bl.slow, elapsed));
  const score   = Math.round(100 - ((clamped - bl.fast) / (bl.slow - bl.fast)) * 100);

  const rating = score >= 80 ? "excelente"
               : score >= 60 ? "bueno"
               : score >= 40 ? "normal"
               : score >= 20 ? "lento"
               :               "muy lento";

  return {
    elapsed_ms:       Math.round(elapsed * 100) / 100,
    iterations:       N,
    score,
    rating,
    os_baseline_fast: bl.fast,
    os_baseline_slow: bl.slow
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* FINGERPRINTS                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function fp_timing_resolution() {
  const samples = [];
  let prev = performance.now();
  for (let i = 0; i < 100; i++) {
    const now = performance.now();
    if (now !== prev) { samples.push(now - prev); prev = now; }
  }
  return samples.length > 0 ? Math.min(...samples).toFixed(4) + "ms" : "unknown";
}

function fp_canvas() {
  try {
    const c = document.createElement("canvas");
    c.width = 280; c.height = 60;
    const ctx = c.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f00";      ctx.fillRect(0, 0, 10, 10);
    ctx.fillStyle = "rgba(0,0,200,0.7)";
    ctx.fillText("TFG Browser Fingerprint 🔍", 2, 2);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("TFG Browser Fingerprint 🔍", 4, 4);
    const url = c.toDataURL();
    let hash = 0;
    for (let i = 0; i < url.length; i++) { hash = ((hash << 5) - hash) + url.charCodeAt(i); hash |= 0; }
    return (hash >>> 0).toString(16).padStart(8, "0");
  } catch(_) { return null; }
}

function fp_audio() {
  return new Promise(resolve => {
    try {
      const ctx  = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
      const osc  = ctx.createOscillator();
      const comp = ctx.createDynamicsCompressor();
      osc.type = "triangle"; osc.frequency.value = 10000;
      osc.connect(comp); comp.connect(ctx.destination);
      osc.start(0); ctx.startRendering();
      ctx.oncomplete = e => {
        const data = e.renderedBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i]);
        resolve(sum.toString().slice(0, 20));
      };
      setTimeout(() => resolve(null), 3000);
    } catch(_) { resolve(null); }
  });
}

function fp_webgl() {
  try {
    const c  = document.createElement("canvas");
    const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    if (!gl) return null;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      vendor:   ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)   : gl.getParameter(gl.VENDOR),
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      version:  gl.getParameter(gl.VERSION),
      webgl2:   !!c.getContext("webgl2")
    };
  } catch(_) { return null; }
}

function fp_local_ip() {
  return new Promise(resolve => {
    try {
      const ips = new Set();
      const pc  = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("");
      pc.createOffer().then(o => pc.setLocalDescription(o));
      pc.onicecandidate = e => {
        if (!e?.candidate) return;
        const m = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (m) ips.add(m[1]);
      };
      setTimeout(() => { pc.close(); resolve([...ips]); }, 1500);
    } catch(_) { resolve([]); }
  });
}

function fp_incognito() {
  return new Promise(resolve => {
    try {
      navigator.storage.estimate().then(({ quota }) => {
        resolve({ likely: quota < 120 * 1024 * 1024, quota_mb: Math.round((quota || 0) / 1024 / 1024) });
      });
    } catch(_) { resolve({ likely: false, quota_mb: null }); }
  });
}

function fp_automation() {
  return {
    webdriver:      !!navigator.webdriver,
    headlessChrome: /HeadlessChrome/i.test(navigator.userAgent),
    selenium:       !!(window.__selenium_evaluate || window.__selenium_unwrapped),
    phantomjs:      !!(window.callPhantom || window._phantom),
    puppeteer:      !!window.__pwInitScripts
  };
}

async function fp_permissions() {
  const names = ["geolocation","notifications","camera","microphone","clipboard-read","clipboard-write"];
  const result = {};
  for (const name of names) {
    try { const s = await navigator.permissions.query({ name }); result[name] = s.state; }
    catch(_) { result[name] = "unavailable"; }
  }
  return result;
}

function fp_fonts() {
  const base = "monospace";
  const test = "mmmmwwwwiiiiMMMWWWI";
  const c    = document.createElement("canvas");
  const ctx  = c.getContext("2d");
  ctx.font   = `16px ${base}`;
  const baseW = ctx.measureText(test).width;
  const list = [
    "Arial","Arial Black","Calibri","Cambria","Comic Sans MS","Consolas","Courier New",
    "Georgia","Helvetica","Impact","Lucida Console","Microsoft Sans Serif","Palatino Linotype",
    "Segoe UI","Tahoma","Times New Roman","Trebuchet MS","Verdana","Wingdings",
    "Apple Chancery","Apple Color Emoji","Menlo","Monaco","SF Mono","SF Pro Display",
    "San Francisco","Osaka","Hiragino Kaku Gothic Pro","Ubuntu","Ubuntu Mono",
    "DejaVu Sans","Liberation Sans","Noto Sans","FreeMono","Roboto","Droid Sans",
    "Source Code Pro","Fira Code","JetBrains Mono","Hack","Inconsolata","Space Mono",
    "IBM Plex Mono","Cascadia Code","MesloLGS NF","MS Gothic","MS Mincho","Malgun Gothic"
  ];
  return list.filter(f => {
    ctx.font = `16px '${f}', ${base}`;
    return ctx.measureText(test).width !== baseW;
  });
}

function fp_input_devices() {
  return {
    touchPoints:  navigator.maxTouchPoints || 0,
    touchSupport: "ontouchstart" in window,
    pointerType:  window.PointerEvent ? "pointer" : "mouse",
    gamepad:      !!navigator.getGamepads
  };
}

function fp_media() {
  const mq = q => window.matchMedia(q).matches;
  return {
    darkMode:      mq("(prefers-color-scheme: dark)"),
    reducedMotion: mq("(prefers-reduced-motion: reduce)"),
    highContrast:  mq("(prefers-contrast: high)"),
    colorGamut:    mq("(color-gamut: p3)") ? "p3" : mq("(color-gamut: srgb)") ? "srgb" : "unknown",
    hover:         mq("(hover: hover)"),
    pointer:       mq("(pointer: fine)") ? "fine" : mq("(pointer: coarse)") ? "coarse" : "none",
    displayMode:   mq("(display-mode: standalone)") ? "pwa" : "browser"
  };
}

function fp_api_support() {
  return {
    bluetooth:        "bluetooth"        in navigator,
    usb:              "usb"              in navigator,
    nfc:              "nfc"              in navigator,
    webXR:            "xr"               in navigator,
    webGPU:           "gpu"              in navigator,
    payments:         "PaymentRequest"   in window,
    credentials:      "credentials"      in navigator,
    serviceWorker:    "serviceWorker"    in navigator,
    webRTC:           "RTCPeerConnection" in window,
    webGL:            !!document.createElement("canvas").getContext("webgl"),
    webGL2:           !!document.createElement("canvas").getContext("webgl2"),
    webAssembly:      typeof WebAssembly !== "undefined",
    sharedArrayBuffer:"SharedArrayBuffer" in window,
    intersectionObs:  "IntersectionObserver" in window,
    broadcastChannel: "BroadcastChannel" in window,
    indexedDB:        "indexedDB"        in window,
    cacheAPI:         "caches"           in window,
    notif:            "Notification"     in window,
    wakeLock:         "wakeLock"         in navigator,
    vibration:        "vibrate"          in navigator,
    battery:          "getBattery"       in navigator,
    geolocation:      "geolocation"      in navigator,
    deviceOrientation:"DeviceOrientationEvent" in window,
    speechSynth:      "speechSynthesis"  in window,
    mediaDevices:     "mediaDevices"     in navigator,
    screenCapture:    !!(navigator.mediaDevices?.getDisplayMedia),
    clipboard:        !!navigator.clipboard,
    share:            "share"            in navigator,
    fileSystemAccess: "showOpenFilePicker" in window,
    eyeDropper:       "EyeDropper"       in window,
    compression:      "CompressionStream" in window,
    webMidi:          "requestMIDIAccess" in navigator,
    hid:              "hid"              in navigator,
    serial:           "serial"           in navigator
  };
}

async function fp_memory() {
  const r = { jsHeapLimit: null, jsHeapTotal: null, jsHeapUsed: null, storageQuotaMB: null, storageUsedMB: null };
  if (performance.memory) {
    r.jsHeapLimit = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
    r.jsHeapTotal = Math.round(performance.memory.totalJSHeapSize  / 1024 / 1024);
    r.jsHeapUsed  = Math.round(performance.memory.usedJSHeapSize   / 1024 / 1024);
  }
  try {
    const est = await navigator.storage.estimate();
    r.storageQuotaMB = Math.round((est.quota || 0) / 1024 / 1024);
    r.storageUsedMB  = Math.round((est.usage  || 0) / 1024 / 1024);
  } catch(_) {}
  return r;
}

async function fp_battery() {
  try {
    const b = await navigator.getBattery();
    return {
      level:           Math.round(b.level * 100),
      charging:        b.charging,
      chargingTime:    b.chargingTime    === Infinity ? null : b.chargingTime,
      dischargingTime: b.dischargingTime === Infinity ? null : b.dischargingTime
    };
  } catch(_) { return null; }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* BEHAVIOR                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

const _beh = {
  clicks: 0, rightClicks: 0, keystrokes: 0,
  totalMouseDist: 0, focusLost: 0, copyEvents: 0, pasteEvents: 0,
  maxScrollY: 0, _lastX: null, _lastY: null, startTime: Date.now()
};
window.addEventListener("click",       () => _beh.clicks++);
window.addEventListener("contextmenu", () => _beh.rightClicks++);
window.addEventListener("keydown",     () => _beh.keystrokes++);
window.addEventListener("copy",        () => _beh.copyEvents++);
window.addEventListener("paste",       () => _beh.pasteEvents++);
window.addEventListener("blur",        () => _beh.focusLost++);
window.addEventListener("scroll",      () => { _beh.maxScrollY = Math.max(_beh.maxScrollY, window.scrollY); });
window.addEventListener("mousemove", e => {
  if (_beh._lastX !== null) {
    const dx = e.clientX - _beh._lastX, dy = e.clientY - _beh._lastY;
    _beh.totalMouseDist += Math.round(Math.sqrt(dx*dx + dy*dy));
  }
  _beh._lastX = e.clientX; _beh._lastY = e.clientY;
});

function getBehavior() {
  const totalH = document.documentElement.scrollHeight - window.innerHeight;
  return {
    timeOnPage:     Math.round((Date.now() - _beh.startTime) / 1000),
    scrollDepth:    totalH > 0 ? Math.round((_beh.maxScrollY / totalH) * 100) : 0,
    clicks:         _beh.clicks,
    rightClicks:    _beh.rightClicks,
    keystrokes:     _beh.keystrokes,
    totalMouseDist: _beh.totalMouseDist,
    focusLost:      _beh.focusLost,
    copyEvents:     _beh.copyEvents,
    pasteEvents:    _beh.pasteEvents
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* BUILD PAYLOAD                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

async function buildPayload(prefs, googleData) {
  const ua     = navigator.userAgent;
  const osInfo = detectOS(ua);

  const consent = prefs.analytics && prefs.fingerprint ? "full"
                : prefs.analytics    ? "analytics_only"
                : prefs.fingerprint  ? "fingerprint_only"
                :                      "rejected";

  // Generar o recuperar session_id
  let sessionId = sessionStorage.getItem("tfg_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
    sessionStorage.setItem("tfg_session_id", sessionId);
  }

  const payload = {
    google_id:     googleData?.sub      || "anonymous",
    google_name:   googleData?.name     || null,
    google_email:  googleData?.email    || null,
    google_picture:googleData?.picture  || null,
    session_id:    sessionId,
    timestamp:     new Date().toISOString(),
    consent,
    page: {
      url:          location.href,
      path:         location.pathname,
      referrer:     document.referrer || null,
      pageLoadTime: performance.timing
        ? Math.round(performance.timing.loadEventEnd - performance.timing.navigationStart)
        : null,
      domNodes:     document.querySelectorAll("*").length
    },
    device: {
      os:                  osInfo.os,
      os_version:          osInfo.version,
      os_type:             osInfo.type,
      platform:            navigator.platform,           // legacy, mantenemos para comparar
      mobile:              osInfo.mobile || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024),
      deviceMemory:        navigator.deviceMemory || null,
      hardwareConcurrency: navigator.hardwareConcurrency || null
    },
    screen: {
      width:       screen.width,
      height:      screen.height,
      pixelRatio:  window.devicePixelRatio,
      colorDepth:  screen.colorDepth,
      orientation: screen.orientation?.type || null
    },
    network: {
      type:     navigator.connection?.effectiveType || null,
      downlink: navigator.connection?.downlink      || null,
      rtt:      navigator.connection?.rtt           || null,
      online:   navigator.onLine
    },
    browser: {
      userAgent:     ua,
      language:      navigator.language,
      languages:     navigator.languages ? [...navigator.languages] : [],
      doNotTrack:    navigator.doNotTrack,
      cookieEnabled: navigator.cookieEnabled
    }
  };

  if (consent === "rejected") return payload;

  // Analytics
  if (prefs.analytics) {
    payload.behavior         = getBehavior();
    payload.browser.automation = fp_automation();
    payload.fingerprint = {
      media:        fp_media(),
      tz:           Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale:       Intl.DateTimeFormat().resolvedOptions().locale,
      inputDevices: fp_input_devices(),
      timingRes:    fp_timing_resolution()
    };
  }

  // Fingerprinting
  if (prefs.fingerprint) {
    const [audio, incognito, localIPs, memory, battery, permissions] = await Promise.all([
      fp_audio(), fp_incognito(), fp_local_ip(), fp_memory(), fp_battery(), fp_permissions()
    ]);

    const cpuTiming = fp_cpu_timing(osInfo.type);
    const fonts     = fp_fonts();
    const webgl     = fp_webgl();
    const apis      = fp_api_support();

    payload.device.cpuTiming = cpuTiming;
    payload.network.localIPs = localIPs;

    payload.fingerprint = {
      ...(payload.fingerprint || {}),
      canvas:      fp_canvas(),
      audio,
      webgl,
      fonts,
      incognito,
      memory,
      battery,
      permissions,
      tz:          Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale:      Intl.DateTimeFormat().resolvedOptions().locale,
      media:       fp_media(),
      inputDevices:fp_input_devices(),
      apiSupport:  apis,
      timingRes:   fp_timing_resolution()
    };

    payload.browser.automation = fp_automation();
    payload.browser.plugins    = Array.from(navigator.plugins || []).map(p => ({
      name: p.name, filename: p.filename, description: p.description
    }));
    payload.browser.apiSupport = apis;
  }

  if (prefs.analytics) payload.behavior = getBehavior();

  return payload;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* SEND                                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

const WORKER_URL = "https://tfg-tracker.alexgaro2015-5ed.workers.dev";

async function sendTracker(prefs) {
  try {
    let googleData = null;
    try { googleData = JSON.parse(sessionStorage.getItem("tfg_user") || "null"); } catch(_) {}
    const payload = await buildPayload(prefs, googleData);
    fetch(WORKER_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload)
    }).catch(() => {});
  } catch(err) {
    console.warn("[tracker] Error:", err);
  }
}

window.sendTracker = sendTracker;
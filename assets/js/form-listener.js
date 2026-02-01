const iframe = document.getElementById("tf-form");

setInterval(() => {
	try {
		const url = iframe.contentWindow.location.href;
		if (url.includes("formResponse")) {
			mostrarDatos();
		}
	} catch (e) { }
}, 400);

async function mostrarDatos() {
	const prefs = JSON.parse(localStorage.getItem("cookies-prefs")) || {};

	const data = {
		userAgent: navigator.userAgent,
		deviceMemory: navigator.deviceMemory || "unknown",
		cpuThreads: navigator.hardwareConcurrency || "unknown",
		jwt: localStorage.getItem("google_jwt"),
		prefs
	};

	document.getElementById("data-output").textContent = JSON.stringify(data, null, 2);
	document.getElementById("data-panel").classList.remove("hidden");
}
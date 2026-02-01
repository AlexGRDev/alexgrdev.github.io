document.addEventListener("DOMContentLoaded", () => {
	const banner = document.getElementById("cookie-banner");
	const modal = document.getElementById("cookie-modal");

	if (!localStorage.getItem("cookies-prefs")) {
		banner.classList.remove("hidden");
	} else {
		const prefs = JSON.parse(localStorage.getItem("cookies-prefs"));
		if (prefs.analytics && typeof sendTracker === "function") {
			sendTracker();
		}
	}
});

document.getElementById("cookie-settings").addEventListener("click", () => {
	document.getElementById("cookie-modal").classList.remove("hidden");
});

document.getElementById("cookie-close").addEventListener("click", () => {
	document.getElementById("cookie-modal").classList.add("hidden");
});

document.getElementById("cookie-reject").addEventListener("click", () => {

	const prefs = { analytics: false, google: false, accepted: true };
	localStorage.setItem("cookies-prefs", JSON.stringify(prefs));

	document.getElementById("cookie-banner").classList.add("hidden");
});

document.getElementById("cookie-accept").addEventListener("click", () => {

	const prefs = { analytics: true, google: true, accepted: true };
	localStorage.setItem("cookies-prefs", JSON.stringify(prefs));

	document.getElementById("cookie-banner").classList.add("hidden");
	document.getElementById("cookie-modal").classList.add("hidden");

	if (typeof sendTracker === "function") sendTracker();
});

document.getElementById("cookie-save").addEventListener("click", () => {

	const prefs = {
		analytics: document.getElementById("toggle-analytics").checked,
		google: document.getElementById("toggle-google").checked,
		accepted: true
	};

	localStorage.setItem("cookies-prefs", JSON.stringify(prefs));

	document.getElementById("cookie-banner").classList.add("hidden");
	document.getElementById("cookie-modal").classList.add("hidden");

	if (prefs.analytics && typeof sendTracker === "function") sendTracker();
});
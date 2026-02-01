const banner = document.getElementById("cookie-banner");

function acceptCookies() {
	localStorage.setItem("cookies-accepted", "true");
	banner.classList.add("hidden");
	sendTracker();
}

if (!localStorage.getItem("cookies-accepted")) {
	banner.classList.remove("hidden");
}

document.getElementById("cookie-accept").onclick = acceptCookies;
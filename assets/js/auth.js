const JWT_KEY = "google_jwt";
const LOGIN_URL = "/auth/login.html";
const VALID_ISS = ["accounts.google.com", "https://accounts.google.com"];

function decodeJwt(token) {
	try {
		const part = token.split(".")[1];
		const decoded = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
		return JSON.parse(decoded);
	} catch {
		return null;
	}
}

function isValid(payload) {
	const now = Math.floor(Date.now() / 1000);
	return payload
		&& VALID_ISS.includes(payload.iss)
		&& (!payload.exp || payload.exp >= now);
}

function redirectToLogin(reason) {
	const next = encodeURIComponent(location.pathname);
	location.replace(`${LOGIN_URL}?reason=${reason}&next=${next}`);
}

function guard() {
	const token = localStorage.getItem(JWT_KEY);
	const payload = token ? decodeJwt(token) : null;

	if (!payload) {
		return redirectToLogin("no_jwt");
	}
	if (!isValid(payload)) {
		localStorage.removeItem(JWT_KEY);
		return redirectToLogin("invalid_jwt");
	}
}

guard();
/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cookies.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/27 09:15:20 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/16 10:43:11 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */


const COOKIES_KEY = "cookies-accepted";
const PREFS_KEY   = "cookies-prefs";
const GA_ID       = "G-BBF4E4F72G";

/* ── Google Analytics — carga condicional ──────────────────────────────── */

function loadGA() {
	if (document.getElementById("ga-script")) return;
	const s = document.createElement("script");
	s.id    = "ga-script";
	s.async = true;
	s.src   = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
	document.head.appendChild(s);
	window.dataLayer = window.dataLayer || [];
	function gtag(){ dataLayer.push(arguments); }
	window.gtag = gtag;
	gtag("js", new Date());
	gtag("config", GA_ID, { anonymize_ip: true });
}

function denyGA() {
	if (window.gtag) {
		window.gtag("consent", "update", {
			analytics_storage: "denied",
			ad_storage:        "denied"
		});
	}
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function getBanner() { return document.getElementById("cookie-banner"); }
function getModal()  { return document.getElementById("cookie-modal"); }
function hideBanner(){ getBanner()?.classList.add("hidden"); }
function hideModal() { getModal()?.classList.add("hidden"); }
function showModal() { getModal()?.classList.remove("hidden"); }

function getPrefs() {
	try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); }
	catch (_) { return {}; }
}

function savePrefs(prefs) {
	localStorage.setItem(COOKIES_KEY, "true");
	localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/* ── Tracker ────────────────────────────────────────────────────────────── */

function callTracker(prefs) {
	let googleData = null;
	try {
		const jwt = localStorage.getItem("google_jwt");
		if (jwt) googleData = JSON.parse(atob(jwt.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));
	} catch (_) {}
	if (!googleData?.sub) return;
	const send = () => { if (typeof sendTracker === "function") sendTracker(prefs); };
	if (typeof sendTracker === "function") send();
	else window.addEventListener("load", send, { once: true });
}

/* ── Acciones ───────────────────────────────────────────────────────────── */

function onAcceptAll() {
	const prefs = { analytics: true, fingerprint: true };
	savePrefs(prefs); hideBanner(); loadGA(); callTracker(prefs);
}

function onReject() {
	const prefs = { analytics: false, fingerprint: false };
	savePrefs(prefs); hideBanner(); denyGA(); callTracker(prefs);
}

function onOpenConfig() {
	const saved = getPrefs();
	const chkA  = document.getElementById("cookie-analytics");
	const chkF  = document.getElementById("cookie-fingerprint");
	if (chkA) chkA.checked = saved.analytics  ?? true;
	if (chkF) chkF.checked = saved.fingerprint ?? true;
	showModal();
}

function onSavePrefs() {
	const chkA  = document.getElementById("cookie-analytics");
	const chkF  = document.getElementById("cookie-fingerprint");
	const prefs = { analytics: chkA?.checked ?? false, fingerprint: chkF?.checked ?? false };
	savePrefs(prefs); hideBanner(); hideModal();
	if (prefs.analytics) loadGA(); else denyGA();
	callTracker(prefs);
}

/* ── Init ───────────────────────────────────────────────────────────────── */

function initCookies() {
	const banner = getBanner();
	if (!banner) return;
	if (localStorage.getItem(COOKIES_KEY)) {
		const prefs = getPrefs();
		if (prefs.analytics) loadGA();
		callTracker(prefs);
		return;
	}
	banner.classList.remove("hidden");
	document.getElementById("cookie-accept")?.addEventListener("click", onAcceptAll);
	document.getElementById("cookie-reject")?.addEventListener("click", onReject);
	document.getElementById("cookie-config")?.addEventListener("click", onOpenConfig);
	document.getElementById("modal-save")?.addEventListener("click", onSavePrefs);
	document.getElementById("modal-cancel")?.addEventListener("click", hideModal);
	document.getElementById("modal-accept-all")?.addEventListener("click", () => { onAcceptAll(); hideModal(); });
	document.getElementById("modal-reject-all")?.addEventListener("click", () => { onReject(); hideModal(); });
	getModal()?.addEventListener("click", e => { if (e.target === getModal()) hideModal(); });
}

if (document.readyState === "loading")
	document.addEventListener("DOMContentLoaded", initCookies);
else
	initCookies();
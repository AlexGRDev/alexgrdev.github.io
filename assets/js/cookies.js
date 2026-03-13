/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cookies.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/27 09:15:20 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/13 16:23:13 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const COOKIES_KEY = "cookies-accepted";
const PREFS_KEY = "cookies-prefs";

function getBanner() { return document.getElementById("cookie-banner"); }
function getModal() { return document.getElementById("cookie-modal"); }
function hideBanner() { getBanner()?.classList.add("hidden"); }
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
function callTracker(prefs) {
	const send = () => {
		if (typeof sendTracker === "function")
			sendTracker(prefs);
		else
			console.warn("sendTracker() no disponible aún.");
	};

	if (typeof sendTracker === "function")
		send();
	else
		window.addEventListener("load", send, { once: true });
}

function onAcceptAll() {
	const prefs = { analytics: true, fingerprint: true };
	savePrefs(prefs);
	hideBanner();
	callTracker(prefs);
}

function onReject() {
	const prefs = { analytics: false, fingerprint: false };
	savePrefs(prefs);
	hideBanner();
	callTracker(prefs);
}

function onOpenConfig() {
	const saved = getPrefs();
	const chkA = document.getElementById("cookie-analytics");
	const chkF = document.getElementById("cookie-fingerprint");
	if (chkA) chkA.checked = saved.analytics ?? true;
	if (chkF) chkF.checked = saved.fingerprint ?? true;
	showModal();
}

function onSavePrefs() {
	const chkA = document.getElementById("cookie-analytics");
	const chkF = document.getElementById("cookie-fingerprint");
	const prefs = {
		analytics: chkA?.checked ?? false,
		fingerprint: chkF?.checked ?? false
	};
	savePrefs(prefs);
	hideBanner();
	hideModal();
	callTracker(prefs);
}

function initCookies() {
	const banner = getBanner();
	if (!banner) return;

	if (localStorage.getItem(COOKIES_KEY)) {
		callTracker(getPrefs());
		return;
	}
	banner.classList.remove("hidden");
	document.getElementById("cookie-accept")?.addEventListener("click", onAcceptAll);
	document.getElementById("cookie-reject")?.addEventListener("click", onReject);
	document.getElementById("cookie-config")?.addEventListener("click", onOpenConfig);
	document.getElementById("modal-save")?.addEventListener("click", onSavePrefs);
	document.getElementById("modal-cancel")?.addEventListener("click", hideModal);

	getModal()?.addEventListener("click", e => {
		if (e.target === getModal()) hideModal();
	});
}

if (document.readyState === "loading")
	document.addEventListener("DOMContentLoaded", initCookies);
else
	initCookies();
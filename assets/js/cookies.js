/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cookies.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/27 09:15:20 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/13 11:40:55 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const COOKIES_KEY = "cookies-accepted";
const PREFS_KEY   = "cookies-prefs";
const banner      = document.getElementById("cookie-banner");
const modal       = document.getElementById("cookie-modal");
const btnAccept   = document.getElementById("cookie-accept");
const btnReject   = document.getElementById("cookie-reject");
const btnConfig   = document.getElementById("cookie-config");
const btnModalSave   = document.getElementById("modal-save");
const btnModalCancel = document.getElementById("modal-cancel");
const chkAnalytics   = document.getElementById("cookie-analytics");
const chkFingerprint = document.getElementById("cookie-fingerprint");

function hideBanner() { banner?.classList.add("hidden"); }
function hideModal()  { modal?.classList.add("hidden");  }
function showModal()  { modal?.classList.remove("hidden"); }

function saveAndClose(prefs)
{
	localStorage.setItem(COOKIES_KEY, "true");
	localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
	hideBanner();
	hideModal();

	if (prefs.analytics || prefs.fingerprint)
	{
		if (typeof sendTracker === "function")
			sendTracker();
		else
			console.warn("sendTracker() no está definido aún.");
	}
}

function onAcceptAll()
{
	saveAndClose({ analytics: true, fingerprint: true });
}

function onReject()
{
	localStorage.setItem(COOKIES_KEY, "true");
	localStorage.setItem(PREFS_KEY, JSON.stringify({ analytics: false, fingerprint: false }));
	hideBanner();
}

function onOpenConfig()
{
	const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
	if (chkAnalytics)   chkAnalytics.checked   = saved.analytics   ?? true;
	if (chkFingerprint) chkFingerprint.checked = saved.fingerprint ?? true;
	showModal();
}

function onSavePrefs()
{
	saveAndClose({
		analytics:   chkAnalytics?.checked   ?? false,
		fingerprint: chkFingerprint?.checked ?? false
	});
}


window.addEventListener("DOMContentLoaded", () =>
{
	if (localStorage.getItem(COOKIES_KEY))
		return;

	banner?.classList.remove("hidden");
	btnAccept?.addEventListener("click", onAcceptAll);
	btnReject?.addEventListener("click", onReject);
	btnConfig?.addEventListener("click", onOpenConfig);
	btnModalSave?.addEventListener("click", onSavePrefs);
	btnModalCancel?.addEventListener("click", hideModal);
	modal?.addEventListener("click", (e) => {
		if (e.target === modal) hideModal();
	});
});
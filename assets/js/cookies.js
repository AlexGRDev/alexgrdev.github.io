/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cookies.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/27 09:15:20 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/16 12:12:37 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const STORAGE = { accepted: "cookies-accepted", prefs: "cookies-prefs" };
const GA_ID = "G-BBF4E4F72G";
const $ = id => document.getElementById(id);

const ga = {
	load() {
		if ($("ga-script")) return;
		const s = Object.assign(document.createElement("script"), {
			id: "ga-script", async: true,
			src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
		});
		document.head.appendChild(s);
		window.dataLayer = window.dataLayer || [];
		window.gtag = function () { dataLayer.push(arguments); };
		gtag("js", new Date());
		gtag("config", GA_ID, { anonymize_ip: true });
	},
	deny() {
		window.gtag?.("consent", "update", { analytics_storage: "denied", ad_storage: "denied" });
	}
};

const store = {
	get() {
		try { return JSON.parse(localStorage.getItem(STORAGE.prefs) || "{}"); }
		catch { return {}; }
	},
	save(data) {
		localStorage.setItem(STORAGE.accepted, "true");
		localStorage.setItem(STORAGE.prefs, JSON.stringify(data));
	},
	done: () => !!localStorage.getItem(STORAGE.accepted)
};

function fireTracker(data) {
	let user = null;
	try {
		const jwt = localStorage.getItem("google_jwt");
		if (jwt) user = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
	} catch { }
	if (!user?.sub) return;
	const run = () => typeof sendTracker === "function" && sendTracker(data);
	typeof sendTracker === "function" ? run() : window.addEventListener("load", run, { once: true });
}

const ui = {
	banner: () => $("cookie-banner"),
	modal: () => $("cookie-modal"),
	show(el) { el?.classList.remove("hidden"); },
	hide(el) { el?.classList.add("hidden"); }
};

function accept() {
	const data = { analytics: true, fingerprint: true };
	store.save(data);
	ui.hide(ui.banner());
	ga.load();
	fireTracker(data);
}

function reject() {
	const data = { analytics: false, fingerprint: false };
	store.save(data);
	ui.hide(ui.banner());
	ga.deny();
	fireTracker(data);
}

function openConfig() {
	const saved = store.get();
	const chkA = $("cookie-analytics");
	const chkF = $("cookie-fingerprint");
	if (chkA) chkA.checked = saved.analytics ?? true;
	if (chkF) chkF.checked = saved.fingerprint ?? true;
	ui.show(ui.modal());
}

function saveConfig() {
	const data = {
		analytics: $("cookie-analytics")?.checked ?? false,
		fingerprint: $("cookie-fingerprint")?.checked ?? false
	};
	store.save(data);
	ui.hide(ui.banner());
	ui.hide(ui.modal());
	data.analytics ? ga.load() : ga.deny();
	fireTracker(data);
}

function init() {
	if (!ui.banner()) return;
	if (store.done()) {
		const saved = store.get();
		if (saved.analytics) ga.load();
		fireTracker(saved);
		return;
	}
	ui.show(ui.banner());
	const on = (id, fn) => $(id)?.addEventListener("click", fn);
	on("cookie-accept", accept);
	on("cookie-reject", reject);
	on("cookie-config", openConfig);
	on("modal-save", saveConfig);
	on("modal-cancel", () => ui.hide(ui.modal()));
	on("modal-accept-all", () => { accept(); ui.hide(ui.modal()); });
	on("modal-reject-all", () => { reject(); ui.hide(ui.modal()); });
	ui.modal()?.addEventListener("click", e => { if (e.target === ui.modal()) ui.hide(ui.modal()); });
}

document.readyState === "loading"
	? document.addEventListener("DOMContentLoaded", init)
	: init();
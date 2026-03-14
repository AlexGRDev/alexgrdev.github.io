/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   report.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/13 10:57:57 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/14 09:38:42 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const ENDPOINT = "https://tfg-tracker.alexgaro2015-5ed.workers.dev";

/* ── 1. ENVIAR TRACKER PRIMERO ─────────────────────────────────────────────
   En thanks.html ya hay google_id en sessionStorage (viene del login).
   Enviamos el tracker y LUEGO intentamos leer el log.
   Si el tracker ya fue enviado antes (revisita), lo saltamos.
────────────────────────────────────────────────────────────────────────── */

async function sendTrackerIfNeeded() {
	// Solo enviamos si hay google_id real
	let googleData = null;
	try { googleData = JSON.parse(sessionStorage.getItem("tfg_user") || "null"); } catch(_) {}
	if (!googleData?.sub) return false;

	// Obtener prefs guardadas
	let prefs = { analytics: false, fingerprint: false };
	try { prefs = JSON.parse(localStorage.getItem("cookies-prefs") || "{}"); } catch(_) {}

	// sendTracker viene de tracker.js (cargado en thanks.html)
	if (typeof sendTracker !== "function") return false;

	await sendTracker(prefs);

	// Esperar un poco para que GitHub procese el PUT
	await new Promise(r => setTimeout(r, 3500));
	return true;
}

/* ── 2. FETCH CON REINTENTOS ───────────────────────────────────────────────
   El worker guarda en GitHub y puede tardar 1-3s en indexar.
   Reintentamos hasta 5 veces con backoff.
────────────────────────────────────────────────────────────────────────── */

async function fetchLog(google_id, maxRetries = 5) {
	for (let i = 0; i < maxRetries; i++) {
		try {
			const res = await fetch(`${ENDPOINT}?google_id=${encodeURIComponent(google_id)}`);
			if (res.ok) {
				const data = await res.json();
				if (data && !data.error) return data;
			}
		} catch(_) {}
		if (i < maxRetries - 1) {
			// Actualizar mensaje de carga
			const loading = document.querySelector(".rpt-loading");
			if (loading) loading.innerHTML = `<div class="rpt-spinner"></div>Esperando datos… (intento ${i + 2}/${maxRetries})`;
			await new Promise(r => setTimeout(r, 2000 + i * 1000));
		}
	}
	return null;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function decodeJWT(token) {
	if (!token) return null;
	try {
		const payload = token.split(".")[1];
		return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
	} catch(_) { return null; }
}

function el(tag, cls, content) {
	const e = document.createElement(tag);
	if (cls) e.className = cls;
	if (content != null) e.innerHTML = content;
	return e;
}

function row(label, value, highlight) {
	const r = el("div", highlight ? "rpt-row rpt-highlight" : "rpt-row");
	r.innerHTML = `<span class="rpt-label">${label}</span><span class="rpt-value">${
		value != null ? value : "<span class='rpt-null'>–</span>"
	}</span>`;
	return r;
}

function section(title, icon) {
	const s = el("div", "rpt-section");
	s.innerHTML = `<div class="rpt-section-title"><span>${icon}</span>${title}</div>`;
	return s;
}

function badge(text, type) { return `<span class="rpt-badge rpt-badge-${type}">${text}</span>`; }

function progressBar(value, max, color) {
	const pct = Math.min(100, Math.round((value / max) * 100));
	return `<div class="rpt-progress"><div class="rpt-bar" style="width:${pct}%;background:${color}"></div><span class="rpt-bar-label">${value}/${max}</span></div>`;
}

function maybe(condition, html) { return condition ? html : ""; }

function boolRow(label, value, trueLabel, falseLabel, trueType, falseType) {
	return row(label, value
		? badge(trueLabel || "Sí", trueType || "yellow")
		: badge(falseLabel || "No", falseType || "gray"));
}

function apiRow(label, supported) {
	return row(label, supported ? badge("✓", "green") : badge("✗", "red"));
}

/* ── Render ─────────────────────────────────────────────────────────────── */

async function renderReport() {
	const container = document.getElementById("data-output");
	if (!container) return;

	container.innerHTML = `<div class="rpt-loading"><div class="rpt-spinner"></div>Enviando datos del dispositivo…</div>`;

	// Obtener google_id
	const jwt       = localStorage.getItem("google_jwt");
	const decoded   = decodeJWT(jwt);
	const google_id = decoded?.sub;

	if (!google_id) {
		container.innerHTML = `<div class="rpt-loading">⚠️ No se encontró sesión de Google.</div>`;
		return;
	}

	// Enviar tracker primero
	await sendTrackerIfNeeded();

	container.innerHTML = `<div class="rpt-loading"><div class="rpt-spinner"></div>Consultando registros…</div>`;

	// Leer log con reintentos
	const log = await fetchLog(google_id);

	if (!log || log.error) {
		container.innerHTML = `<div class="rpt-loading">⚠️ No se encontró ningún registro para este usuario.</div>`;
		return;
	}

	container.innerHTML = "";

	/* ── HEADER ─────────────────────────────────────────────────── */
	const header  = el("div", "rpt-header");
	const topRow  = el("div", "rpt-header-top");

	if (log.google_picture) {
		const img = document.createElement("img");
		img.src = log.google_picture; img.className = "rpt-avatar"; img.alt = "";
		topRow.appendChild(img);
	} else topRow.appendChild(el("div", "rpt-avatar-ph", "👤"));

	const titleBlock = el("div");
	titleBlock.innerHTML = `
		<div class="rpt-eyebrow">Datos recopilados · TFG ITSALEXITO</div>
		<div class="rpt-name">${log.google_name || "Usuario Anónimo"}</div>
		<div class="rpt-email">${log.google_email || "Sin cuenta de Google vinculada"}</div>
	`;
	topRow.appendChild(titleBlock);
	header.appendChild(topRow);

	const net = log.network || {};
	const fp  = log.fingerprint || {};
	const mq  = fp.media || {};
	const bat = fp.battery;
	const dv  = log.device || {};

	const chips = el("div", "rpt-chips");
	chips.innerHTML = `
		${maybe(log.timestamp, `<div class="rpt-chip">🕐 <span>${new Date(log.timestamp).toLocaleString("es-ES")}</span></div>`)}
		${maybe(dv.os,         `<div class="rpt-chip">💻 <span>${dv.os}${dv.os_version ? " " + dv.os_version : ""}</span></div>`)}
		${maybe(fp.tz,         `<div class="rpt-chip">🌍 <span>${fp.tz}</span></div>`)}
		${maybe(log.browser?.language, `<div class="rpt-chip">💬 <span>${log.browser.language}</span></div>`)}
		${maybe(net.type,      `<div class="rpt-chip">📶 <span>${net.type}</span></div>`)}
		${maybe(bat,           `<div class="rpt-chip">${bat?.charging ? "⚡" : "🔋"} <span>${bat?.level}%</span></div>`)}
		${maybe(fp.incognito?.likely, `<div class="rpt-chip">🕵️ <span>Incógnito detectado</span></div>`)}
		${maybe(log.browser?.automation?.webdriver, `<div class="rpt-chip">🤖 <span>Bot/Automatización</span></div>`)}
		${maybe(net.localIPs?.length, `<div class="rpt-chip">🏠 <span>${net.localIPs?.[0]}</span></div>`)}
	`;
	header.appendChild(chips);
	container.appendChild(header);

	const body = el("div", "rpt-body");
	container.appendChild(body);

	/* ── 1. IDENTIDAD GOOGLE ────────────────────────────────────── */
	const sg = section("Identidad Google", "🔐");
	sg.appendChild(row("Google ID (sub)", log.google_id, true));
	sg.appendChild(row("Nombre",          log.google_name));
	sg.appendChild(row("Email",           log.google_email));
	sg.appendChild(row("Session ID",      log.session_id));
	sg.appendChild(row("Timestamp",       log.timestamp ? new Date(log.timestamp).toLocaleString("es-ES") : null));
	body.appendChild(sg);

	/* ── 2. SISTEMA OPERATIVO ───────────────────────────────────── */
	if (dv.os) {
		const so = section("Sistema operativo", "🖥️");
		so.appendChild(row("OS detectado",  `${badge(dv.os, "blue")}${dv.os_version ? " <span style='font-size:11px;color:#8b949e'>" + dv.os_version + "</span>" : ""}`, true));
		so.appendChild(row("Tipo",          dv.os_type));
		so.appendChild(row("Platform (legacy)", dv.platform));
		so.appendChild(boolRow("Móvil",     dv.mobile, "Sí", "No", "yellow", "blue"));
		if (dv.cpuTiming) {
			const ct = dv.cpuTiming;
			so.appendChild(row("Rendimiento CPU",
				`${progressBar(ct.score, 100, ct.score > 60 ? "#3fb950" : ct.score > 30 ? "#d29922" : "#f85149")}
				 &nbsp;<span style="font-size:11px;color:#8b949e">
				 Score ${ct.score}/100 · ${ct.elapsed_ms}ms · <b>${ct.rating}</b> para ${dv.os}
				 (referencia: ${ct.os_baseline_fast}–${ct.os_baseline_slow}ms)
				 </span>`));
		}
		so.appendChild(row("RAM aprox.", dv.deviceMemory ? progressBar(dv.deviceMemory, 32, "#58a6ff") + `&nbsp;<span style="font-size:11px;color:#8b949e">${dv.deviceMemory} GB</span>` : null));
		so.appendChild(row("Núcleos CPU", dv.hardwareConcurrency ? progressBar(dv.hardwareConcurrency, 16, "#3fb950") + `&nbsp;<span style="font-size:11px;color:#8b949e">${dv.hardwareConcurrency} lógicos</span>` : null));
		body.appendChild(so);
	}

	/* ── 3. PÁGINA ───────────────────────────────────────────────── */
	if (log.page) {
		const pg = log.page;
		const sp = section("Página visitada", "🔗");
		sp.appendChild(row("URL",     `<span style="font-size:10px;word-break:break-all">${pg.url}</span>`));
		sp.appendChild(row("Path",    pg.path));
		sp.appendChild(row("Referrer",pg.referrer));
		sp.appendChild(row("Carga DOM", pg.pageLoadTime ? `${pg.pageLoadTime} ms` : null));
		sp.appendChild(row("Nodos DOM", pg.domNodes));
		body.appendChild(sp);
	}

	/* ── 4. COMPORTAMIENTO ───────────────────────────────────────── */
	if (log.behavior) {
		const bh = log.behavior;
		const sb = section("Comportamiento en la página", "🖱️");
		sb.appendChild(row("Tiempo en página", bh.timeOnPage ? `${bh.timeOnPage}s` : null));
		sb.appendChild(row("Scroll máximo", bh.scrollDepth != null
			? progressBar(bh.scrollDepth, 100, "#ff3355") + `&nbsp;<span style="font-size:11px;color:#8b949e">${bh.scrollDepth}%</span>`
			: null));
		sb.appendChild(row("Clicks totales",   bh.clicks));
		sb.appendChild(row("Clicks derecho",   bh.rightClicks));
		sb.appendChild(row("Distancia ratón",  bh.totalMouseDist ? `${bh.totalMouseDist}px` : null));
		sb.appendChild(row("Teclas pulsadas",  bh.keystrokes));
		sb.appendChild(row("Eventos copy",     bh.copyEvents));
		sb.appendChild(row("Eventos paste",    bh.pasteEvents));
		sb.appendChild(row("Cambios pestaña",  bh.focusLost));
		body.appendChild(sb);
	}

	/* ── 5. PANTALLA ─────────────────────────────────────────────── */
	if (log.screen) {
		const sc = log.screen;
		const ss = section("Pantalla", "🖥️");
		ss.appendChild(row("Resolución",    `${sc.width} × ${sc.height} px`));
		ss.appendChild(row("Profundidad",   `${sc.colorDepth} bits`));
		ss.appendChild(row("Pixel ratio",   `${sc.pixelRatio}x`));
		ss.appendChild(row("Orientación",   sc.orientation));
		if (mq.colorGamut) ss.appendChild(row("Color gamut", badge(mq.colorGamut, mq.colorGamut === "p3" ? "green" : "gray")));
		if (mq.darkMode != null) ss.appendChild(boolRow("Modo oscuro", mq.darkMode, "Activo", "Inactivo", "blue", "gray"));
		if (mq.pointer) ss.appendChild(row("Puntero", badge(mq.pointer, "blue")));
		body.appendChild(ss);
	}

	/* ── 6. RED ──────────────────────────────────────────────────── */
	if (log.network) {
		const sn = section("Red", "📡");
		sn.appendChild(row("Tipo conexión",    net.type ? badge(net.type, "blue") : null));
		sn.appendChild(row("Velocidad bajada", net.downlink ? `${net.downlink} Mbps` : null));
		sn.appendChild(row("RTT latencia",     net.rtt ? `${net.rtt} ms` : null));
		sn.appendChild(boolRow("Online",       net.online, "Sí", "No", "green", "red"));
		sn.appendChild(boolRow("Ahorro datos", net.saveData, "Activo", "Inactivo", "yellow", "gray"));
		if (net.localIPs?.length)
			net.localIPs.forEach((ip, i) =>
				sn.appendChild(row(i === 0 ? "IPs locales (WebRTC)" : "", `<span class="rpt-hash">${ip}</span>`, i === 0)));
		body.appendChild(sn);
	}

	/* ── 7. NAVEGADOR ────────────────────────────────────────────── */
	if (log.browser) {
		const br  = log.browser;
		const sb2 = section("Navegador", "🌐");
		sb2.appendChild(row("User-Agent", `<span style="font-size:10px;line-height:1.6">${br.userAgent}</span>`));
		sb2.appendChild(row("Idiomas",    Array.isArray(br.languages) ? br.languages.join(", ") : br.language));
		sb2.appendChild(boolRow("Cookies", br.cookieEnabled, "Habilitadas", "Deshabilitadas", "green", "red"));
		sb2.appendChild(row("Do Not Track", br.doNotTrack === "1" ? badge("Activado", "yellow") : badge("Desactivado", "gray")));
		if (br.plugins?.length)
			sb2.appendChild(row("Plugins", `<span style="font-size:10px">${br.plugins.map(p => p.name).join(", ")}</span>`));
		body.appendChild(sb2);
	}

	/* ── 8. AUTOMATIZACIÓN ───────────────────────────────────────── */
	if (log.browser?.automation) {
		const au = log.browser.automation;
		const sa = section("Detección bot / automatización", "🤖");
		sa.appendChild(boolRow("WebDriver",     au.webdriver,      "⚠️ Detectado", "No detectado", "red", "green"));
		sa.appendChild(boolRow("PhantomJS",     au.phantomjs,      "⚠️ Detectado", "No detectado", "red", "green"));
		sa.appendChild(boolRow("Selenium",      au.selenium,       "⚠️ Detectado", "No detectado", "red", "green"));
		sa.appendChild(boolRow("Headless Chrome",au.headlessChrome,"⚠️ Detectado", "No detectado", "red", "green"));
		sa.appendChild(boolRow("Puppeteer",     au.puppeteer,      "⚠️ Detectado", "No detectado", "red", "green"));
		body.appendChild(sa);
	}

	/* ── 9. PERMISOS ─────────────────────────────────────────────── */
	if (fp.permissions && Object.keys(fp.permissions).length) {
		const permMeta = {
			geolocation:       { icon: "📍", label: "Geolocalización" },
			notifications:     { icon: "🔔", label: "Notificaciones" },
			camera:            { icon: "📷", label: "Cámara" },
			microphone:        { icon: "🎤", label: "Micrófono" },
			"clipboard-read":  { icon: "📋", label: "Portapapeles (leer)" },
			"clipboard-write": { icon: "📋", label: "Portapapeles (escribir)" }
		};
		const sp2     = section("Permisos del navegador", "🔒");
		const permGrid = el("div", "rpt-perm-grid");
		for (const [name, state] of Object.entries(fp.permissions)) {
			const cls   = state === "granted" ? "rpt-perm-granted" : state === "denied" ? "rpt-perm-denied" : "rpt-perm-prompt";
			const icon2 = state === "granted" ? "✓" : state === "denied" ? "✗" : "?";
			const item  = el("div", "rpt-perm-item");
			item.innerHTML = `
				<div class="rpt-perm-name">${permMeta[name]?.icon || ""} ${permMeta[name]?.label || name}</div>
				<div class="rpt-perm-state ${cls}">${icon2} ${state}</div>
			`;
			permGrid.appendChild(item);
		}
		sp2.appendChild(permGrid);
		body.appendChild(sp2);
	}

	/* ── 10. FINGERPRINT ─────────────────────────────────────────── */
	{
		const sf = section("Fingerprint del dispositivo", "🔎");
		if (fp.canvas) {
			const chunks  = fp.canvas.match(/.{1,8}/g) || [];
			const hashHtml = chunks.map((c, i) =>
				i % 2 === 0 ? `<span class="rpt-hash-hi">${c}</span>` : c
			).join(" ");
			sf.appendChild(row("Canvas hash", `<div class="rpt-hash">${hashHtml}</div>`, true));
		}
		if (fp.audio)
			sf.appendChild(row("Audio fingerprint",
				`<span style="color:#3fb950;letter-spacing:.05em">${parseFloat(fp.audio).toFixed(8)}</span>`));
		if (fp.webgl) {
			sf.appendChild(row("GPU Vendor",   fp.webgl.vendor));
			sf.appendChild(row("GPU Renderer", `<span style="font-size:11px">${fp.webgl.renderer}</span>`));
			sf.appendChild(row("WebGL",        fp.webgl.version));
			sf.appendChild(row("WebGL2",       fp.webgl.webgl2 ? badge("Soportado", "green") : badge("No", "gray")));
		}
		if (fp.tz)     sf.appendChild(row("Zona horaria", fp.tz));
		if (fp.locale) sf.appendChild(row("Locale",       fp.locale));
		if (fp.incognito)
			sf.appendChild(row("Modo incógnito", fp.incognito.likely
				? badge("Probable", "red")
				: badge("No detectado", "green")));
		body.appendChild(sf);
	}

	/* ── 11. APIs SOPORTADAS ─────────────────────────────────────── */
	const apis = fp.apiSupport || log.browser?.apiSupport;
	if (apis) {
		const sa2 = section("APIs del navegador soportadas", "⚙️");
		const groups = {
			"Hardware":    ["bluetooth","usb","nfc","hid","serial","vibration","battery","deviceOrientation"],
			"Gráficos":    ["webGL","webGL2","webXR","webGPU","webAssembly"],
			"Storage":     ["indexedDB","cacheAPI","serviceWorker","broadcastChannel"],
			"Comunicación":["webRTC","share","clipboard","mediaDevices","screenCapture"],
			"Misc":        ["payments","credentials","wakeLock","notif","geolocation","speechSynth","compression"]
		};
		for (const [groupName, keys] of Object.entries(groups)) {
			const row_g = el("div", "rpt-row");
			row_g.innerHTML = `
				<span class="rpt-label" style="color:#8b949e;font-size:10px">${groupName}</span>
				<span class="rpt-value" style="font-size:10px;display:flex;flex-wrap:wrap;gap:3px">
					${keys.map(k => `<span class="rpt-badge rpt-badge-${apis[k] ? "green" : "red"}" style="font-size:9px">${k}</span>`).join("")}
				</span>`;
			sa2.appendChild(row_g);
		}
		body.appendChild(sa2);
	}

	/* ── 12. BATERÍA ─────────────────────────────────────────────── */
	if (bat) {
		const sb3 = section("Batería", "🔋");
		sb3.appendChild(boolRow("Estado", bat.charging, "Cargando ⚡", "Descargando", "green", "yellow"));
		sb3.appendChild(row("Nivel", progressBar(bat.level, 100,
			bat.level > 50 ? "#3fb950" : bat.level > 20 ? "#d29922" : "#f85149")
			+ `&nbsp;<span style="font-size:11px;color:#8b949e">${bat.level}%</span>`));
		sb3.appendChild(row("Tiempo carga",    bat.chargingTime    === Infinity ? "∞" : bat.chargingTime    ? `${bat.chargingTime}s`    : null));
		sb3.appendChild(row("Tiempo descarga", bat.dischargingTime === Infinity ? "∞" : bat.dischargingTime ? `${bat.dischargingTime}s` : null));
		body.appendChild(sb3);
	}

	/* ── 13. FUENTES ─────────────────────────────────────────────── */
	if (fp.fonts?.length) {
		const sfo  = section(`Fuentes instaladas detectadas (${fp.fonts.length})`, "🔡");
		const pills = el("div", "rpt-font-pills");
		fp.fonts.forEach(f => pills.appendChild(el("div", "rpt-pill", f)));
		sfo.appendChild(pills);
		body.appendChild(sfo);
	}
}

renderReport();
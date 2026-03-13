/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   report.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/13 10:57:57 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/13 15:33:55 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const ENDPOINT = "https://tfg-tracker.alexgaro2015-5ed.workers.dev";

function decodeJWT(token) {
	if (!token) return null;
	try {
		const payload = token.split(".")[1];
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		return JSON.parse(atob(base64));
	}
	catch (_) { return null; }
}

async function fetchLog(google_id) {
	const res = await fetch(`${ENDPOINT}?google_id=${encodeURIComponent(google_id)}`);
	if (!res.ok) return null;
	return await res.json();
}

function el(tag, cls, content) {
	const e = document.createElement(tag);
	if (cls) e.className = cls;
	if (content != null) e.innerHTML = content;
	return e;
}

function row(label, value, highlight) {
	const r = el("div", highlight ? "rpt-row rpt-highlight" : "rpt-row");
	r.innerHTML = `<span class="rpt-label">${label}</span><span class="rpt-value">${value != null ? value : "<span class='rpt-null'>–</span>"
		}</span>`;
	return r;
}

function section(title, icon) {
	const s = el("div", "rpt-section");
	s.innerHTML = `<div class="rpt-section-title"><span>${icon}</span>${title}</div>`;
	return s;
}

function badge(text, type) {
	return `<span class="rpt-badge rpt-badge-${type}">${text}</span>`;
}

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

async function renderReport() {
	const container = document.getElementById("data-output");
	if (!container) return;

	container.innerHTML = `<div class="rpt-loading"><div class="rpt-spinner"></div>Consultando registros…</div>`;

	const jwt = localStorage.getItem("google_jwt");
	const decoded = decodeJWT(jwt);
	const google_id = decoded?.sub;

	if (!google_id) {
		container.innerHTML = `<div class="rpt-loading">⚠️ No se encontró sesión de Google.</div>`;
		return;
	}

	const log = await fetchLog(google_id);
	if (!log || log.error) {
		container.innerHTML = `<div class="rpt-loading">⚠️ No se encontró ningún registro para este usuario.</div>`;
		return;
	}

	container.innerHTML = "";

	/* ── HEADER ─────────────────────────────────────────────────── */
	const header = el("div", "rpt-header");
	const topRow = el("div", "rpt-header-top");

	if (log.google_picture) {
		const img = document.createElement("img");
		img.src = log.google_picture; img.className = "rpt-avatar"; img.alt = "";
		topRow.appendChild(img);
	}
	else topRow.appendChild(el("div", "rpt-avatar-ph", "👤"));

	const titleBlock = el("div");
	titleBlock.innerHTML = `
		<div class="rpt-eyebrow">Datos recopilados · TFG ITSALEXITO</div>
		<div class="rpt-name">${log.google_name || "Usuario Anónimo"}</div>
		<div class="rpt-email">${log.google_email || "Sin cuenta de Google vinculada"}</div>
	`;
	topRow.appendChild(titleBlock);
	header.appendChild(topRow);

	const net = log.network || {};
	const fp = log.fingerprint || {};
	const mq = fp.media || {};
	const bat = fp.battery;

	const chips = el("div", "rpt-chips");
	chips.innerHTML = `
		${maybe(log.timestamp, `<div class="rpt-chip">🕐 <span>${new Date(log.timestamp).toLocaleString("es-ES")}</span></div>`)}
		${maybe(fp.tz, `<div class="rpt-chip">🌍 <span>${fp.tz}</span></div>`)}
		${maybe(log.browser?.language, `<div class="rpt-chip">💬 <span>${log.browser.language}</span></div>`)}
		${maybe(net.type, `<div class="rpt-chip">📶 <span>${net.type}</span></div>`)}
		${maybe(bat, `<div class="rpt-chip">${bat?.charging ? "⚡" : "🔋"} <span>${bat?.level}%</span></div>`)}
		${maybe(log.page?.path, `<div class="rpt-chip">🔗 <span>${log.page.path}</span></div>`)}
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
	sg.appendChild(row("Nombre", log.google_name));
	sg.appendChild(row("Email", log.google_email));
	sg.appendChild(row("Session ID", log.session_id));
	sg.appendChild(row("Timestamp", log.timestamp ? new Date(log.timestamp).toLocaleString("es-ES") : null));
	body.appendChild(sg);

	/* ── 2. PÁGINA ───────────────────────────────────────────────── */
	if (log.page) {
		const pg = log.page;
		const sp = section("Página visitada", "🔗");
		sp.appendChild(row("URL", `<span style="font-size:10px;word-break:break-all">${pg.url}</span>`));
		sp.appendChild(row("Path", pg.path));
		sp.appendChild(row("Referrer", pg.referrer));
		sp.appendChild(row("Título", pg.title));
		sp.appendChild(row("Hash", pg.hash));
		sp.appendChild(row("Carga DOM", pg.pageLoadTime ? `${pg.pageLoadTime} ms` : null));
		sp.appendChild(row("Transferencia", pg.transferSize ? `${(pg.transferSize / 1024).toFixed(1)} KB` : null));
		sp.appendChild(row("Body comprimido", pg.encodedBodySize ? `${(pg.encodedBodySize / 1024).toFixed(1)} KB` : null));
		sp.appendChild(row("Body real", pg.decodedBodySize ? `${(pg.decodedBodySize / 1024).toFixed(1)} KB` : null));
		sp.appendChild(row("Nodos DOM", pg.domNodes));
		sp.appendChild(row("Scripts", pg.scripts));
		sp.appendChild(row("Hojas de estilo", pg.stylesheets));
		sp.appendChild(row("Imágenes", pg.images));
		if (Object.keys(pg.queryParams || {}).length)
			sp.appendChild(row("Query params", JSON.stringify(pg.queryParams)));
		body.appendChild(sp);
	}

	/* ── 3. COMPORTAMIENTO ───────────────────────────────────────── */
	if (log.behavior) {
		const bh = log.behavior;
		const sb = section("Comportamiento en la página", "🖱️");
		sb.appendChild(row("Tiempo en página", bh.timeOnPage ? `${bh.timeOnPage}s` : null));
		sb.appendChild(row("Scroll máximo", bh.scrollDepth != null
			? progressBar(bh.scrollDepth, 100, "#ff3355") + `&nbsp;<span style="font-size:11px;color:#8b949e">${bh.scrollDepth}%</span>`
			: null));
		sb.appendChild(row("Scroll Y máximo", bh.maxScrollY != null ? `${bh.maxScrollY}px` : null));
		sb.appendChild(row("Clicks totales", bh.clicks));
		sb.appendChild(row("Clicks derecho", bh.rightClicks));
		sb.appendChild(row("Movimientos ratón", bh.mouseMovements));
		sb.appendChild(row("Distancia ratón", bh.totalMouseDist ? `${bh.totalMouseDist}px` : null));
		sb.appendChild(row("Teclas pulsadas", bh.keystrokes));
		sb.appendChild(row("Eventos copy", bh.copyEvents));
		sb.appendChild(row("Eventos paste", bh.pasteEvents));
		sb.appendChild(row("Cambios de pestaña", bh.focusLost));
		body.appendChild(sb);
	}

	/* ── 4. DISPOSITIVO ──────────────────────────────────────────── */
	if (log.device) {
		const dv = log.device;
		const sd = section("Dispositivo", "💻");
		sd.appendChild(row("Plataforma", dv.platform));
		sd.appendChild(boolRow("Móvil", dv.mobile, "Sí", "No", "yellow", "blue"));
		sd.appendChild(row("Arquitectura", dv.architecture));
		sd.appendChild(row("Modelo", dv.model));
		if (dv.deviceMemory)
			sd.appendChild(row("RAM aprox.", progressBar(dv.deviceMemory, 32, "#58a6ff") + `&nbsp;<span style="font-size:11px;color:#8b949e">${dv.deviceMemory} GB</span>`));
		if (dv.hardwareConcurrency)
			sd.appendChild(row("Núcleos CPU", progressBar(dv.hardwareConcurrency, 16, "#3fb950") + `&nbsp;<span style="font-size:11px;color:#8b949e">${dv.hardwareConcurrency} lógicos</span>`));
		sd.appendChild(row("Touch points", dv.maxTouchPoints));
		if (dv.cpuTiming)
			sd.appendChild(row("Rendimiento CPU", `${dv.cpuTiming.score?.toLocaleString()} ops/ms &nbsp;<span style="font-size:11px;color:#8b949e">(${dv.cpuTiming.elapsed_ms}ms)</span>`));
		if (dv.timingResolution)
			sd.appendChild(row("Resolución timer", `${dv.timingResolution.min_resolution_ms?.toFixed(4)} ms`));
		body.appendChild(sd);
	}

	/* ── 5. PANTALLA ─────────────────────────────────────────────── */
	if (log.screen) {
		const sc = log.screen;
		const ss = section("Pantalla", "🖥️");
		ss.appendChild(row("Resolución total", `${sc.width} × ${sc.height} px`));
		ss.appendChild(row("Área disponible", `${sc.availWidth} × ${sc.availHeight} px`));
		ss.appendChild(row("Viewport", `${log.window?.innerWidth} × ${log.window?.innerHeight} px`));
		ss.appendChild(row("Ventana outer", `${log.window?.outerWidth} × ${log.window?.outerHeight} px`));
		ss.appendChild(row("Posición pantalla", `x:${log.window?.screenLeft} y:${log.window?.screenTop}`));
		ss.appendChild(row("Profundidad color", `${sc.colorDepth} bits`));
		ss.appendChild(row("Pixel ratio", `${sc.pixelRatio}x`));
		ss.appendChild(row("Orientación", sc.orientation));
		if (mq.colorGamut) ss.appendChild(row("Color gamut", badge(mq.colorGamut, mq.colorGamut === "p3" ? "green" : "gray")));
		if (mq.hdr != null) ss.appendChild(boolRow("HDR", mq.hdr, "Sí", "No", "green", "gray"));
		if (mq.darkMode != null) ss.appendChild(boolRow("Modo oscuro", mq.darkMode, "Activo", "Inactivo", "blue", "gray"));
		if (mq.pointer) ss.appendChild(row("Puntero", badge(mq.pointer, "blue")));
		if (mq.anyPointer) ss.appendChild(row("Any pointer", badge(mq.anyPointer, "blue")));
		if (mq.displayMode) ss.appendChild(row("Display mode", badge(mq.displayMode, "gray")));
		body.appendChild(ss);
	}

	/* ── 6. RED ──────────────────────────────────────────────────── */
	if (log.network) {
		const sn = section("Red", "📡");
		sn.appendChild(row("Tipo conexión", net.type ? badge(net.type, "blue") : null));
		sn.appendChild(row("Velocidad bajada", net.downlink ? `${net.downlink} Mbps` : null));
		sn.appendChild(row("Velocidad máx.", net.downlinkMax ? `${net.downlinkMax} Mbps` : null));
		sn.appendChild(row("RTT latencia", net.rtt ? `${net.rtt} ms` : null));
		sn.appendChild(boolRow("Online", net.online, "Sí", "No", "green", "red"));
		sn.appendChild(boolRow("Ahorro datos", net.saveData, "Activo", "Inactivo", "yellow", "gray"));
		if (net.localIPs?.length) {
			net.localIPs.forEach((ip, i) =>
				sn.appendChild(row(i === 0 ? "IPs locales (WebRTC)" : "", `<span class="rpt-hash">${ip}</span>`, i === 0)));
		}
		body.appendChild(sn);
	}

	/* ── 7. MEMORIA ──────────────────────────────────────────────── */
	if (log.memory) {
		const mem = log.memory;
		const sm = section("Memoria del sistema", "🧠");
		if (mem.deviceMemory) sm.appendChild(row("RAM dispositivo", `${mem.deviceMemory} GB`));
		if (mem.jsHeapSizeLimit) sm.appendChild(row("Heap JS límite", `${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(0)} MB`));
		if (mem.totalJSHeapSize) sm.appendChild(row("Heap JS total", `${(mem.totalJSHeapSize / 1024 / 1024).toFixed(0)} MB`));
		if (mem.usedJSHeapSize) sm.appendChild(row("Heap JS usado", `${(mem.usedJSHeapSize / 1024 / 1024).toFixed(0)} MB`));
		if (mem.storageQuota) sm.appendChild(row("Storage quota", `${(mem.storageQuota / 1024 / 1024 / 1024).toFixed(1)} GB`));
		if (mem.storageUsage) sm.appendChild(row("Storage usado", `${(mem.storageUsage / 1024 / 1024).toFixed(1)} MB`));
		body.appendChild(sm);
	}

	/* ── 8. NAVEGADOR ────────────────────────────────────────────── */
	if (log.browser) {
		const br = log.browser;
		const sb2 = section("Navegador", "🌐");
		sb2.appendChild(row("User-Agent", `<span style="font-size:10px;line-height:1.6">${br.userAgent}</span>`));
		sb2.appendChild(row("Idiomas", Array.isArray(br.languages) ? br.languages.join(", ") : br.language));
		sb2.appendChild(boolRow("Cookies", br.cookiesEnabled, "Habilitadas", "Deshabilitadas", "green", "red"));
		sb2.appendChild(row("Do Not Track", br.doNotTrack === "1" ? badge("Activado", "yellow") : badge("Desactivado", "gray")));
		sb2.appendChild(apiRow("localStorage", br.localStorage));
		sb2.appendChild(apiRow("sessionStorage", br.sessionStorage));
		sb2.appendChild(apiRow("IndexedDB", br.indexedDB));
		sb2.appendChild(apiRow("Service Worker", br.serviceWorker));
		sb2.appendChild(apiRow("WebRTC", br.webRTC));
		if (br.plugins?.length)
			sb2.appendChild(row("Plugins", `<span style="font-size:10px">${br.plugins.map(p => p.name).join(", ")}</span>`));
		body.appendChild(sb2);
	}

	/* ── 9. DETECCIÓN AUTOMATIZACIÓN ────────────────────────────── */
	if (log.browser?.automation) {
		const au = log.browser.automation;
		const sa = section("Detección bot / automatización", "🤖");
		sa.appendChild(boolRow("WebDriver", au.webdriver, "⚠️ Detectado", "No detectado", "red", "green"));
		sa.appendChild(boolRow("PhantomJS", au.phantomjs, "⚠️ Detectado", "No detectado", "red", "green"));
		sa.appendChild(boolRow("Selenium", au.selenium, "⚠️ Detectado", "No detectado", "red", "green"));
		sa.appendChild(boolRow("Headless Chrome", au.headlessChrome, "⚠️ Detectado", "No detectado", "red", "green"));
		sa.appendChild(boolRow("Puppeteer", au.puppeteer, "⚠️ Detectado", "No detectado", "red", "green"));
		sa.appendChild(boolRow("DOM Automation", au.domAutomation, "⚠️ Detectado", "No detectado", "red", "green"));
		sa.appendChild(row("Notificaciones", au.notificationPerms ? badge(au.notificationPerms, "blue") : null));
		body.appendChild(sa);
	}

	/* ── 10. CONTEXTO ────────────────────────────────────────────── */
	if (log.context) {
		const cx = log.context;
		const sc2 = section("Contexto de navegación", "🔭");
		sc2.appendChild(boolRow("En iframe", cx.isIframe, "Sí", "No", "red", "green"));
		sc2.appendChild(boolRow("Cross-origin", cx.isCrossOrigin, "Sí", "No", "red", "green"));
		sc2.appendChild(boolRow("PWA instalada", cx.isPWA, "Sí", "No", "blue", "gray"));
		sc2.appendChild(boolRow("Fullscreen", cx.isFullscreen, "Sí", "No", "yellow", "gray"));
		sc2.appendChild(boolRow("Pestaña activa", cx.hasFocus, "Sí", "No", "green", "gray"));
		sc2.appendChild(boolRow("Modo incógnito", fp.incognito?.likely, "Probable", "No detectado", "red", "green"));
		sc2.appendChild(row("Visibility state", cx.visibilityState ? badge(cx.visibilityState, "blue") : null));
		sc2.appendChild(row("Protocolo", cx.protocol));
		sc2.appendChild(boolRow("Localhost", cx.isLocalhost, "Sí", "No", "yellow", "gray"));
		sc2.appendChild(boolRow("PDF viewer", cx.pdfViewerEnabled, "Sí", "No", "green", "gray"));
		body.appendChild(sc2);
	}

	/* ── 11. INPUT ───────────────────────────────────────────────── */
	if (log.input) {
		const inp = log.input;
		const si = section("Dispositivos de entrada", "⌨️");
		si.appendChild(row("Touch points", inp.maxTouchPoints));
		si.appendChild(boolRow("Touch support", inp.touchSupport, "Sí", "No", "yellow", "gray"));
		si.appendChild(boolRow("Pointer events", inp.pointerSupport, "Sí", "No", "green", "gray"));
		si.appendChild(boolRow("Gamepad API", inp.gamepadSupport, "Sí", "No", "blue", "gray"));
		if (inp.gamepads?.length)
			inp.gamepads.forEach(g => si.appendChild(row("Gamepad", `${g.id} (${g.buttons} btns, ${g.axes} ejes)`)));
		body.appendChild(si);
	}

	/* ── 12. APIs SOPORTADAS ─────────────────────────────────────── */
	if (log.browser?.apiSupport) {
		const api = log.browser.apiSupport;
		const sa2 = section("APIs del navegador soportadas", "⚙️");

		const groups = {
			"Hardware": ["bluetooth", "usb", "serial", "nfc", "hid", "vibration", "battery", "deviceOrientation", "deviceMotion", "ambient", "gamepadSupport"],
			"Identidad / Pagos": ["credentials", "paymentRequest", "contacts", "eyeDropper"],
			"Gráficos": ["webGL", "webGL2", "canvas2D", "offscreenCanvas", "xr"],
			"Storage": ["indexedDB", "openDatabase", "cacheAPI", "storageEstimate", "persistStorage"],
			"Workers": ["workers", "serviceWorker", "sharedWorker", "broadcastChannel"],
			"Comunicación": ["webRTC", "webSocket", "share", "clipboard", "presentation", "ink"],
			"Seguridad": ["crypto", "subtleCrypto", "trustedTypes"],
			"Multimedia": ["mediaDevices", "speechSynthesis", "speechRecognition", "pushManager", "notifications"],
			"Misc": ["webAssembly", "networkInfo", "wakeLock", "barcodeDetector", "intersectionObs", "resizeObs", "mutationObs", "performanceObs"]
		};

		for (const [groupName, keys] of Object.entries(groups)) {
			const available = keys.filter(k => api[k]);
			const total = keys.length;
			const row_g = el("div", "rpt-row");
			row_g.innerHTML = `<span class="rpt-label" style="color:#8b949e;font-size:10px">${groupName}</span>
				<span class="rpt-value" style="font-size:10px;display:flex;flex-wrap:wrap;gap:3px">
					${keys.map(k => `<span class="rpt-badge rpt-badge-${api[k] ? "green" : "red"}" style="font-size:9px">${k}</span>`).join("")}
				</span>`;
			sa2.appendChild(row_g);
		}
		body.appendChild(sa2);
	}

	/* ── 13. CSS FEATURES ────────────────────────────────────────── */
	if (log.browser?.cssFeatures) {
		const css = log.browser.cssFeatures;
		const sc3 = section("Soporte CSS avanzado", "🎨");
		Object.entries(css).forEach(([k, v]) => sc3.appendChild(apiRow(k, v)));
		body.appendChild(sc3);
	}

	/* ── 14. PERMISOS ────────────────────────────────────────────── */
	if (fp.permissions && Object.keys(fp.permissions).length) {
		const permMeta = {
			geolocation: { icon: "📍", label: "Geolocalización" },
			notifications: { icon: "🔔", label: "Notificaciones" },
			camera: { icon: "📷", label: "Cámara" },
			microphone: { icon: "🎤", label: "Micrófono" },
			"clipboard-read": { icon: "📋", label: "Portapapeles (leer)" },
			"clipboard-write": { icon: "📋", label: "Portapapeles (escribir)" }
		};
		const sp2 = section("Permisos del navegador", "🔒");
		const permGrid = el("div", "rpt-perm-grid");
		for (const [name, state] of Object.entries(fp.permissions)) {
			const cls = state === "granted" ? "rpt-perm-granted" : state === "denied" ? "rpt-perm-denied" : "rpt-perm-prompt";
			const icon2 = state === "granted" ? "✓" : state === "denied" ? "✗" : "?";
			const item = el("div", "rpt-perm-item");
			item.innerHTML = `
				<div class="rpt-perm-name">${permMeta[name]?.icon || ""} ${permMeta[name]?.label || name}</div>
				<div class="rpt-perm-state ${cls}">${icon2} ${state}</div>
			`;
			permGrid.appendChild(item);
		}
		sp2.appendChild(permGrid);
		body.appendChild(sp2);
	}

	/* ── 15. FINGERPRINT ─────────────────────────────────────────── */
	{
		const sf = section("Fingerprint del dispositivo", "🔎");
		if (fp.canvas) {
			const chunks = fp.canvas.match(/.{1,8}/g) || [];
			const hashHtml = chunks.map((c, i) =>
				i % 2 === 0 ? `<span class="rpt-hash-hi">${c}</span>` : c
			).join(" ");
			sf.appendChild(row("Canvas hash", `<div class="rpt-hash">${hashHtml}</div>`, true));
		}
		if (fp.audio)
			sf.appendChild(row("Audio fingerprint",
				`<span style="color:#3fb950;letter-spacing:.05em">${parseFloat(fp.audio).toFixed(8)}</span>`));
		if (fp.webgl) {
			sf.appendChild(row("GPU Vendor", fp.webgl.vendor));
			sf.appendChild(row("GPU Renderer", `<span style="font-size:11px">${fp.webgl.renderer}</span>`));
			sf.appendChild(row("WebGL", fp.webgl.version));
			sf.appendChild(row("GLSL", fp.webgl.shadingVersion));
			sf.appendChild(row("Max texture", fp.webgl.maxTextureSize ? `${fp.webgl.maxTextureSize}px` : null));
			if (fp.webgl.webgl2) {
				sf.appendChild(row("WebGL2 MSAA", fp.webgl.webgl2.maxSamples));
				sf.appendChild(row("WebGL2 color attach.", fp.webgl.webgl2.maxColorAttachments));
			}
			if (fp.webgl.extensions?.length)
				sf.appendChild(row("Extensiones WebGL", `<span style="font-size:9px;line-height:1.8">${fp.webgl.extensions.join(", ")}</span>`));
		}
		if (fp.tz) sf.appendChild(row("Zona horaria", fp.tz));
		if (fp.locale) sf.appendChild(row("Locale", fp.locale));
		if (fp.calendar) sf.appendChild(row("Calendario", fp.calendar));
		if (fp.numberingSys) sf.appendChild(row("Numeración", fp.numberingSys));
		if (fp.incognito)
			sf.appendChild(row("Modo incógnito", fp.incognito.likely
				? badge(`Probable (${fp.incognito.method})`, "red")
				: badge("No detectado", "green")));
		body.appendChild(sf);
	}

	/* ── 16. VOCES (Speech Synthesis) ───────────────────────────── */
	if (log.browser?.voices?.length) {
		const sv = section(`Voces instaladas del sistema (${log.browser.voices.length})`, "🗣️");
		const grid = el("div", "rpt-font-pills");
		log.browser.voices.forEach(v => {
			const p = el("div", "rpt-pill", `${v.name} <span style="color:#8b949e;font-size:9px">${v.lang}</span>`);
			if (v.default) p.style.borderColor = "#ff2244";
			grid.appendChild(p);
		});
		sv.appendChild(grid);
		body.appendChild(sv);
	}

	/* ── 17. MOVIMIENTO (Giroscopio / Acelerómetro) ─────────────── */
	if (fp.motion?.motion) {
		const sm2 = section("Sensores de movimiento", "📱");
		sm2.appendChild(row("Aceleración X", fp.motion.accelerationX?.toFixed(4)));
		sm2.appendChild(row("Aceleración Y", fp.motion.accelerationY?.toFixed(4)));
		sm2.appendChild(row("Aceleración Z", fp.motion.accelerationZ?.toFixed(4)));
		sm2.appendChild(row("Rotación Alpha", fp.motion.rotationAlpha?.toFixed(4)));
		sm2.appendChild(row("Rotación Beta", fp.motion.rotationBeta?.toFixed(4)));
		sm2.appendChild(row("Rotación Gamma", fp.motion.rotationGamma?.toFixed(4)));
		sm2.appendChild(row("Intervalo", fp.motion.interval ? `${fp.motion.interval}ms` : null));
		body.appendChild(sm2);
	}

	/* ── 18. BATERÍA ─────────────────────────────────────────────── */
	if (bat) {
		const sb3 = section("Batería", "🔋");
		sb3.appendChild(boolRow("Estado", bat.charging, "Cargando ⚡", "Descargando", "green", "yellow"));
		sb3.appendChild(row("Nivel", progressBar(bat.level, 100,
			bat.level > 50 ? "#3fb950" : bat.level > 20 ? "#d29922" : "#f85149")
			+ `&nbsp;<span style="font-size:11px;color:#8b949e">${bat.level}%</span>`));
		sb3.appendChild(row("Tiempo carga", bat.chargingTime === Infinity ? "∞" : bat.chargingTime ? `${bat.chargingTime}s` : null));
		sb3.appendChild(row("Tiempo descarga", bat.dischargingTime === Infinity ? "∞" : bat.dischargingTime ? `${bat.dischargingTime}s` : null));
		body.appendChild(sb3);
	}

	/* ── 19. FUENTES ─────────────────────────────────────────────── */
	if (fp.fonts) {
		const sfo = section(`Fuentes instaladas detectadas (${fp.fonts.length})`, "🔡");
		const pills = el("div", "rpt-font-pills");
		(fp.fonts.length ? fp.fonts : ["Ninguna detectada"])
			.forEach(f => pills.appendChild(el("div", "rpt-pill", f)));
		sfo.appendChild(pills);
		body.appendChild(sfo);
	}
}

renderReport();
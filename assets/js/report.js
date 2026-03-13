/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   report.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/13 10:57:57 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/13 11:17:38 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const ENDPOINT = "https://tfg-tracker.alexgaro2015-5ed.workers.dev";

function decodeJWT(token)
{
	if (!token) return null;
	try
	{
		const payload = token.split(".")[1];
		const base64  = payload.replace(/-/g, "+").replace(/_/g, "/");
		return JSON.parse(atob(base64));
	}
	catch (_) { return null; }
}

async function fetchLog(google_id)
{
	const res = await fetch(`${ENDPOINT}?google_id=${encodeURIComponent(google_id)}`);
	if (!res.ok) return null;
	return await res.json();
}

function el(tag, cls, content)
{
	const e = document.createElement(tag);
	if (cls) e.className = cls;
	if (content !== undefined) e.innerHTML = content;
	return e;
}

function row(label, value, highlight)
{
	const r = el("div", "rpt-row" + (highlight ? " rpt-highlight" : null));
	r.innerHTML = `<span class="rpt-label">${label}</span><span class="rpt-value">${value ?? "<span class='rpt-null'>–</span>"}</span>`;
	return r;
}

function section(title, icon)
{
	const s = el("div", "rpt-section");
	s.innerHTML = `<div class="rpt-section-title"><span>${icon}</span>${title}</div>`;
	return s;
}

function badge(text, type)
{
	return `<span class="rpt-badge rpt-badge-${type}">${text}</span>`;
}

function progressBar(value, max, color)
{
	const pct = Math.min(100, Math.round((value / max) * 100));
	return `<div class="rpt-progress"><div class="rpt-bar" style="width:${pct}%;background:${color}"></div><span class="rpt-bar-label">${value}/${max}</span></div>`;
}

async function renderReport()
{
	const container = document.getElementById("data-output");
	if (!container) return;

	container.innerHTML = `<div class="rpt-loading"><div class="rpt-spinner"></div>Consultando registros…</div>`;
	const jwt     = localStorage.getItem("google_jwt");
	const decoded = decodeJWT(jwt);
	const google_id = decoded?.sub;

	if (!google_id)
	{
		container.innerHTML = `<div class="rpt-loading">⚠️ No se encontró sesión de Google. No hay datos que mostrar.</div>`;
		return;
	}
	const log = await fetchLog(google_id);

	if (!log || log.error)
	{
		container.innerHTML = `<div class="rpt-loading">⚠️ No se encontró ningún registro para este usuario.</div>`;
		return;
	}

	container.innerHTML = null;

	const header = el("div", "rpt-header");
	const topRow = el("div", "rpt-header-top");

	if (log.google_picture)
	{
		const img = document.createElement("img");
		img.src = log.google_picture; img.className = "rpt-avatar"; img.alt = null;
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

	const net     = log.network     || {};
	const battery = log.fingerprint?.battery;
	const mq      = log.fingerprint?.media || {};

	const chips = el("div", "rpt-chips");
	chips.innerHTML = `
		<div class="rpt-chip">🕐 <span>${log.timestamp ? new Date(log.timestamp).toLocaleString("es-ES") : null}</span></div>
		${log.fingerprint?.tz ? `<div class="rpt-chip">🌍 <span>${log.fingerprint.tz}</span></div>` : null}
		${log.browser?.language ? `<div class="rpt-chip">💬 <span>${log.browser.language}</span></div>` : null}
		${net.type  ? `<div class="rpt-chip">📶 <span>${net.type}</span></div>` : null}
		${battery   ? `<div class="rpt-chip">${battery.charging ? "⚡" : null} <span>${battery.level}%</span></div>` : null}
		${log.page?.url ? `<div class="rpt-chip">🔗 <span>${log.page.path || "/"}</span></div>` : null}
	`;
	header.appendChild(chips);
	container.appendChild(header);

	const body = el("div", "rpt-body");
	container.appendChild(body);
	const sg = section("Identidad Google", "🔐");
	sg.appendChild(row("Google ID (sub)", log.google_id, true));
	sg.appendChild(row("Nombre", log.google_name));
	sg.appendChild(row("Email", log.google_email));
	sg.appendChild(row("Session ID", log.session_id));
	sg.appendChild(row("Timestamp registro", log.timestamp ? new Date(log.timestamp).toLocaleString("es-ES") : null));
	body.appendChild(sg);
	if (log.page)
	{
		const sp = section("Página visitada", "🔗");
		sp.appendChild(row("URL completa", `<span style="font-size:10px;line-height:1.6;word-break:break-all">${log.page.url}</span>`));
		sp.appendChild(row("Path", log.page.path));
		sp.appendChild(row("Referrer", log.page.referrer));
		sp.appendChild(row("Título", log.page.title));
		sp.appendChild(row("Tiempo carga DOM", log.page.pageLoadTime ? `${log.page.pageLoadTime} ms` : null));
		if (Object.keys(log.page.queryParams || {}).length)
			sp.appendChild(row("Query params", JSON.stringify(log.page.queryParams)));
		body.appendChild(sp);
	}
	if (log.behavior)
	{
		const bh = log.behavior;
		const sb = section("Comportamiento en la página", "🖱️");
		sb.appendChild(row("Tiempo en página", bh.timeOnPage ? `${bh.timeOnPage}s` : null));
		sb.appendChild(row("Scroll máximo", bh.scrollDepth != null ? progressBar(bh.scrollDepth, 100, "#ff3355") + `&nbsp;<span style="font-size:11px;color:#8b949e">${bh.scrollDepth}%</span>` : null));
		sb.appendChild(row("Clicks totales", bh.clicks));
		sb.appendChild(row("Movimientos ratón", bh.mouseMovements));
		sb.appendChild(row("Cambios de pestaña", bh.focusLost));
		body.appendChild(sb);
	}
	if (log.device)
	{
		const dv = log.device;
		const sd = section("Dispositivo", "💻");
		sd.appendChild(row("Plataforma", dv.platform));
		sd.appendChild(row("Móvil", dv.mobile ? badge("Sí", "yellow") : badge("No", "blue")));
		if (dv.deviceMemory)
			sd.appendChild(row("Memoria RAM", progressBar(dv.deviceMemory, 32, "#58a6ff") + `&nbsp;<span style="font-size:11px;color:#8b949e">${dv.deviceMemory} GB</span>`));
		if (dv.hardwareConcurrency)
			sd.appendChild(row("Núcleos CPU", progressBar(dv.hardwareConcurrency, 16, "#3fb950") + `&nbsp;<span style="font-size:11px;color:#8b949e">${dv.hardwareConcurrency} lógicos</span>`));
		sd.appendChild(row("Touch points", dv.maxTouchPoints));
		if (dv.architecture) sd.appendChild(row("Arquitectura", dv.architecture));
		if (dv.model)        sd.appendChild(row("Modelo", dv.model));
		body.appendChild(sd);
	}
	if (log.screen)
	{
		const sc = log.screen;
		const ss = section("Pantalla", "🖥️");
		ss.appendChild(row("Resolución total", `${sc.width} × ${sc.height} px`));
		ss.appendChild(row("Área disponible", `${sc.availWidth} × ${sc.availHeight} px`));
		ss.appendChild(row("Viewport", `${log.window?.innerWidth} × ${log.window?.innerHeight} px`));
		ss.appendChild(row("Profundidad color", `${sc.colorDepth} bits`));
		ss.appendChild(row("Pixel ratio", `${sc.pixelRatio}x`));
		ss.appendChild(row("Orientación", sc.orientation));
		if (mq.colorGamut) ss.appendChild(row("Color gamut", badge(mq.colorGamut, mq.colorGamut === "p3" ? "green" : "gray")));
		if (mq.hdr        != null) ss.appendChild(row("HDR", mq.hdr ? badge("Sí", "green") : badge("No", "gray")));
		if (mq.darkMode   != null) ss.appendChild(row("Modo oscuro", mq.darkMode ? badge("Activo", "blue") : badge("Inactivo", "gray")));
		body.appendChild(ss);
	}
	if (log.browser)
	{
		const br = log.browser;
		const sb2 = section("Navegador", "🌐");
		sb2.appendChild(row("User-Agent", `<span style="font-size:10px;line-height:1.6">${br.userAgent}</span>`));
		sb2.appendChild(row("Idiomas", Array.isArray(br.languages) ? br.languages.join(", ") : br.language));
		sb2.appendChild(row("Cookies", br.cookiesEnabled ? badge("Habilitadas", "green") : badge("Deshabilitadas", "red"), true));
		sb2.appendChild(row("Do Not Track", br.doNotTrack === "1" ? badge("Activado", "yellow") : badge("Desactivado", "gray")));
		sb2.appendChild(row("localStorage", br.localStorage  ? badge("✓", "green") : badge("✗", "red")));
		sb2.appendChild(row("sessionStorage", br.sessionStorage ? badge("✓", "green") : badge("✗", "red")));
		sb2.appendChild(row("IndexedDB", br.indexedDB ? badge("✓", "green") : badge("✗", "red")));
		sb2.appendChild(row("Service Worker", br.serviceWorker ? badge("✓", "green") : badge("✗", "red")));
		sb2.appendChild(row("WebRTC", br.webRTC ? badge("✓ puede filtrar IP local", "yellow") : badge("✗", "gray")));
		if (br.plugins?.length)
			sb2.appendChild(row("Plugins", `<span style="font-size:10px">${br.plugins.map(p => p.name || p).join(", ")}</span>`));
		body.appendChild(sb2);
	}
	if (log.network)
	{
		const sn = section("Red", "📡");
		sn.appendChild(row("Tipo conexión", net.type ? badge(net.type, "blue") : null));
		sn.appendChild(row("Velocidad bajada", net.downlink ? `${net.downlink} Mbps` : null));
		sn.appendChild(row("RTT latencia", net.rtt ? `${net.rtt} ms` : null));
		sn.appendChild(row("Online", net.online ? badge("Sí", "green") : badge("No", "red")));
		sn.appendChild(row("Ahorro de datos", net.saveData ? badge("Activo", "yellow") : badge("Inactivo", "gray")));
		body.appendChild(sn);
	}
	const perms = log.fingerprint?.permissions;
	if (perms && Object.keys(perms).length)
	{
		const permMeta =
		{
			geolocation:      { icon: "📍", label: "Geolocalización" },
			notifications:    { icon: "🔔", label: "Notificaciones" },
			camera:           { icon: "📷", label: "Cámara" },
			microphone:       { icon: "🎤", label: "Micrófono" },
			"clipboard-read": { icon: "📋", label: "Portapapeles" }
		};
		const sp2 = section("Permisos del navegador", "🔒");
		const permGrid = el("div", "rpt-perm-grid");
		for (const [name, state] of Object.entries(perms))
		{
			const cls   = state === "granted" ? "rpt-perm-granted" : state === "denied" ? "rpt-perm-denied" : "rpt-perm-prompt";
			const icon2 = state === "granted" ? "✓" : state === "denied" ? "✗" : "?";
			const item  = el("div", "rpt-perm-item");
			item.innerHTML = `
				<div class="rpt-perm-name">${permMeta[name]?.icon || null} ${permMeta[name]?.label || name}</div>
				<div class="rpt-perm-state ${cls}">${icon2} ${state}</div>
			`;
			permGrid.appendChild(item);
		}
		sp2.appendChild(permGrid);
		body.appendChild(sp2);
	}
	const fp = log.fingerprint;
	if (fp)
	{
		const sf = section("Fingerprint del dispositivo", "🔎");
		if (fp.canvas)
		{
			const chunks   = fp.canvas.match(/.{1,8}/g) || [];
			const hashHtml = chunks.map((c, i) =>
				i % 2 === 0 ? `<span class="rpt-hash-hi">${c}</span>` : c
			).join(" ");
			sf.appendChild(row("Canvas hash", `<div class="rpt-hash">${hashHtml}</div>`, true));
		}
		if (fp.audio)
			sf.appendChild(row("Audio fingerprint", `<span style="color:#3fb950;letter-spacing:.05em">${parseFloat(fp.audio).toFixed(8)}</span>`));
		if (fp.webgl)
		{
			sf.appendChild(row("GPU Vendor",   fp.webgl.vendor));
			sf.appendChild(row("GPU Renderer", `<span style="font-size:11px">${fp.webgl.renderer}</span>`));
			sf.appendChild(row("WebGL",        fp.webgl.version));
		}
		if (fp.tz)     sf.appendChild(row("Zona horaria", fp.tz));
		if (fp.locale) sf.appendChild(row("Locale", fp.locale));
		body.appendChild(sf);
	}
	const fonts = fp?.fonts;
	if (fonts)
	{
		const sfo  = section(`Fuentes instaladas detectadas (${fonts.length})`, "🔡");
		const pills = el("div", "rpt-font-pills");
		(fonts.length ? fonts : ["Ninguna detectada"]).forEach(f => pills.appendChild(el("div", "rpt-pill", f)));
		sfo.appendChild(pills);
		body.appendChild(sfo);
	}
}

renderReport();
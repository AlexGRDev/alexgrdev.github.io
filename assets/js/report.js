/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   report.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/13 10:57:57 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/16 12:13:13 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const ENDPOINT = "https://tfg-tracker.alexgaro2015-5ed.workers.dev";

function decodeJwt(token) {
	try {
		return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
	} catch { return null; }
}

function mk(tag, cls, html) {
	const e = document.createElement(tag);
	if (cls) e.className = cls;
	if (html != null) e.innerHTML = html;
	return e;
}

function badge(text, type) {
	return `<span class="rpt-badge rpt-badge-${type}">${text}</span>`;
}

function bar(value, max, color) {
	const pct = Math.min(100, Math.round((value / max) * 100));
	return `<div class="rpt-progress"><div class="rpt-bar" style="width:${pct}%;background:${color}"></div><span class="rpt-bar-label">${value}/${max}</span></div>`;
}

function row(label, value, hi) {
	const cls = hi ? "rpt-row rpt-highlight" : "rpt-row";
	const val = value != null ? value : "<span class='rpt-null'>–</span>";
	return mk("div", cls, `<span class="rpt-label">${label}</span><span class="rpt-value">${val}</span>`);
}

function boolRow(label, value, yes, no, tyY, tyN) {
	return row(label, value ? badge(yes || "Sí", tyY || "yellow") : badge(no || "No", tyN || "gray"));
}

function section(title, icon) {
	const s = mk("div", "rpt-section");
	s.innerHTML = `<div class="rpt-section-title"><span>${icon}</span>${title}</div>`;
	return s;
}

function buildHeader(log) {
	const avi = log.google_picture
		? `<img class="rpt-avatar" src="${log.google_picture}" alt="">`
		: `<div class="rpt-avatar-ph">👤</div>`;
	const profile = mk("div", "rpt-profile", `${avi}
		<div>
			<div class="rpt-eyebrow">Datos recopilados · TFG ITSALEXITO</div>
			<div class="rpt-name">${log.google_name || "Usuario Anónimo"}</div>
			<div class="rpt-email">${log.google_email || "Sin cuenta vinculada"}</div>
		</div>`);
	const net = log.network || {}, fp = log.fingerprint || {}, dv = log.device || {}, bat = fp.battery;
	const chips = mk("div", "rpt-chips", `
		${log.timestamp ? `<div class="rpt-chip">🕐 <span>${new Date(log.timestamp).toLocaleString("es-ES")}</span></div>` : ""}
		${dv.os ? `<div class="rpt-chip">💻 <span>${dv.os}${dv.os_version ? " " + dv.os_version : ""}</span></div>` : ""}
		${fp.tz ? `<div class="rpt-chip">🌍 <span>${fp.tz}</span></div>` : ""}
		${net.type ? `<div class="rpt-chip">📶 <span>${net.type}</span></div>` : ""}
		${bat ? `<div class="rpt-chip">${bat.charging ? "⚡" : "🔋"} <span>${bat.level}%</span></div>` : ""}
		${fp.incognito?.likely ? `<div class="rpt-chip">🕵️ <span>Incógnito detectado</span></div>` : ""}
	`);
	return [profile, chips];
}

function buildSections(log) {
	const sections = [];
	const net = log.network || {};
	const fp = log.fingerprint || {};
	const dv = log.device || {};
	const bh = log.behavior || {};
	const br = log.browser || {};
	const sc = log.screen || {};
	const bat = fp.battery;

	const sg = section("Identidad Google", "🔐");
	sg.appendChild(row("Google ID", log.google_id, true));
	sg.appendChild(row("Nombre", log.google_name));
	sg.appendChild(row("Email", log.google_email));
	sg.appendChild(row("Timestamp", log.timestamp ? new Date(log.timestamp).toLocaleString("es-ES") : null));
	sections.push(sg);

	if (dv.os) {
		const so = section("Sistema operativo", "🖥️");
		so.appendChild(row("OS detectado", `${badge(dv.os, "blue")}${dv.os_version ? ` <span style="font-size:11px;color:#8b949e">${dv.os_version}</span>` : ""}`, true));
		so.appendChild(boolRow("Móvil", dv.mobile, "Sí", "No", "yellow", "blue"));
		if (dv.cpuTiming) {
			const ct = dv.cpuTiming;
			so.appendChild(row("CPU Score", `${bar(ct.score, 100, ct.score > 60 ? "#3fb950" : ct.score > 30 ? "#d29922" : "#f85149")} <span style="font-size:11px;color:#8b949e">Score ${ct.score}/100 · ${ct.elapsed_ms}ms · ${ct.rating}</span>`));
		}
		so.appendChild(row("RAM aprox.", dv.deviceMemory ? `${bar(dv.deviceMemory, 32, "#58a6ff")} <span style="font-size:11px;color:#8b949e">${dv.deviceMemory} GB</span>` : null));
		so.appendChild(row("Núcleos CPU", dv.hardwareConcurrency ? `${bar(dv.hardwareConcurrency, 16, "#3fb950")} <span style="font-size:11px;color:#8b949e">${dv.hardwareConcurrency} lógicos</span>` : null));
		sections.push(so);
	}

	if (sc.width) {
		const ss = section("Pantalla", "🖥️");
		ss.appendChild(row("Resolución", `${sc.width} × ${sc.height} px`));
		ss.appendChild(row("Pixel ratio", `${sc.pixelRatio}x`));
		ss.appendChild(row("Color depth", `${sc.colorDepth} bits`));
		const mq = fp.media || {};
		if (mq.darkMode != null) ss.appendChild(boolRow("Modo oscuro", mq.darkMode, "Activo", "Inactivo", "blue", "gray"));
		sections.push(ss);
	}

	if (net.type || net.online != null) {
		const sn = section("Red", "📡");
		sn.appendChild(row("Tipo", net.type ? badge(net.type, "blue") : null));
		sn.appendChild(row("Downlink", net.downlink ? `${net.downlink} Mbps` : null));
		sn.appendChild(row("RTT", net.rtt ? `${net.rtt} ms` : null));
		sn.appendChild(boolRow("Online", net.online, "Sí", "No", "green", "red"));
		if (net.localIPs?.length) net.localIPs.forEach((ip, i) => sn.appendChild(row(i === 0 ? "IPs locales" : "", `<span class="rpt-hash">${ip}</span>`, i === 0)));
		sections.push(sn);
	}

	if (bh.timeOnPage) {
		const sb = section("Comportamiento", "🖱️");
		sb.appendChild(row("Tiempo en página", `${bh.timeOnPage}s`));
		sb.appendChild(row("Scroll máximo", bh.scrollDepth != null ? `${bar(bh.scrollDepth, 100, "#ff3355")} <span style="font-size:11px;color:#8b949e">${bh.scrollDepth}%</span>` : null));
		sb.appendChild(row("Clicks", bh.clicks));
		sb.appendChild(row("Teclas pulsadas", bh.keystrokes));
		sb.appendChild(row("Distancia ratón", bh.totalMouseDist ? `${bh.totalMouseDist}px` : null));
		sections.push(sb);
	}

	if (br.userAgent) {
		const sbr = section("Navegador", "🌐");
		sbr.appendChild(row("User-Agent", `<span style="font-size:10px;line-height:1.6">${br.userAgent}</span>`));
		sbr.appendChild(row("Idiomas", (br.languages || []).join(", ") || br.language));
		sbr.appendChild(boolRow("Do Not Track", br.doNotTrack === "1", "Activado", "Desactivado", "yellow", "gray"));
		sections.push(sbr);
	}

	if (fp.canvas) {
		const sf = section("Fingerprint", "🔎");
		const chunks = (fp.canvas.match(/.{1,8}/g) || []).map((c, i) => i % 2 === 0 ? `<span class="rpt-hash-hi">${c}</span>` : c);
		sf.appendChild(row("Canvas hash", `<div class="rpt-hash">${chunks.join(" ")}</div>`, true));
		if (fp.audio) sf.appendChild(row("Audio FP", `<span style="color:#3fb950">${parseFloat(fp.audio).toFixed(8)}</span>`));
		if (fp.webgl) {
			sf.appendChild(row("GPU Vendor", fp.webgl.vendor));
			sf.appendChild(row("GPU Renderer", `<span style="font-size:11px">${fp.webgl.renderer}</span>`));
		}
		if (fp.tz) sf.appendChild(row("Timezone", fp.tz));
		if (fp.incognito) sf.appendChild(row("Incógnito", fp.incognito.likely ? badge("Probable", "red") : badge("No detectado", "green")));
		sections.push(sf);
	}

	if (fp.permissions && Object.keys(fp.permissions).length) {
		const sp = section("Permisos", "🔒");
		const grid = mk("div", "rpt-perm-grid");
		for (const [name, state] of Object.entries(fp.permissions)) {
			const cls = state === "granted" ? "rpt-perm-granted" : state === "denied" ? "rpt-perm-denied" : "rpt-perm-prompt";
			const ico = state === "granted" ? "✓" : state === "denied" ? "✗" : "?";
			grid.appendChild(mk("div", "rpt-perm-item", `<div class="rpt-perm-name">${name}</div><div class="rpt-perm-state ${cls}">${ico} ${state}</div>`));
		}
		sp.appendChild(grid); sections.push(sp);
	}

	if (bat) {
		const sb3 = section("Batería", "🔋");
		sb3.appendChild(boolRow("Estado", bat.charging, "Cargando ⚡", "Descargando", "green", "yellow"));
		sb3.appendChild(row("Nivel", `${bar(bat.level, 100, bat.level > 50 ? "#3fb950" : bat.level > 20 ? "#d29922" : "#f85149")} <span style="font-size:11px;color:#8b949e">${bat.level}%</span>`));
		sections.push(sb3);
	}

	if (fp.fonts?.length) {
		const sfo = section(`Fuentes detectadas (${fp.fonts.length})`, "🔡");
		const pills = mk("div", "rpt-font-pills");
		fp.fonts.forEach(f => pills.appendChild(mk("div", "rpt-pill", f)));
		sfo.appendChild(pills); sections.push(sfo);
	}

	return sections;
}

async function fetchLog(googleId) {
	for (let i = 0; i < 8; i++) {
		try {
			const res = await fetch(`${ENDPOINT}?google_id=${encodeURIComponent(googleId)}`);
			if (res.ok) {
				const data = await res.json();
				if (data && !data.error) return data;
			}
		} catch { }
		const el = document.querySelector(".rpt-loading");
		if (el) el.innerHTML = `<div class="rpt-spinner"></div>Esperando datos… (intento ${i + 2}/8)`;
		await new Promise(r => setTimeout(r, 3000 + i * 1000));
	}
	return null;
}

async function renderReport() {
	const out = document.getElementById("data-output");
	if (!out) return;
	out.innerHTML = `<div class="rpt-loading"><div class="rpt-spinner"></div>Enviando datos del dispositivo…</div>`;

	const jwt = localStorage.getItem("google_jwt");
	const decoded = decodeJwt(jwt);
	if (!decoded?.sub) { out.innerHTML = `<div class="rpt-loading">⚠ No se encontró sesión de Google.</div>`; return; }

	const stored = localStorage.getItem("cookies-prefs");
	const prefs = stored ? JSON.parse(stored) : { analytics: false, fingerprint: false };
	if (typeof sendTracker === "function") {
		await sendTracker(prefs);
		await new Promise(r => setTimeout(r, 6000));
	}

	out.innerHTML = `<div class="rpt-loading"><div class="rpt-spinner"></div>Consultando registros…</div>`;
	const log = await fetchLog(decoded.sub);
	if (!log || log.error) { out.innerHTML = `<div class="rpt-loading">⚠ No se encontró ningún registro.</div>`; return; }

	out.innerHTML = "";
	const [profile, chips] = buildHeader(log);
	out.appendChild(profile);
	out.appendChild(chips);

	const body = mk("div", "rpt-body");
	buildSections(log).forEach(s => body.appendChild(s));
	out.appendChild(body);
}

renderReport();
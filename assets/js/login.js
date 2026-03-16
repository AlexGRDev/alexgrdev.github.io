/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   login.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/27 09:13:44 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/16 12:12:15 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const WORKER = "https://tfg-tracker.alexgaro2015-5ed.workers.dev";

function handleGoogleLogin(resp) {
	const jwt = resp?.credential;
	if (!jwt) {
		alert("Error: no se pudo iniciar sesión con Google.");
		return;
	}
	localStorage.setItem("google_jwt", jwt);
	location.href = "/form/form.html";
}

async function fetchClientId() {
	const res = await fetch(WORKER);
	const data = await res.json();
	return data.client_id ?? null;
}

function renderButton(container, clientId) {
	google.accounts.id.initialize({ client_id: clientId, callback: handleGoogleLogin });
	google.accounts.id.renderButton(container, { theme: "filled_black", size: "large", shape: "rectangular" });
	google.accounts.id.prompt();
}

async function initLogin() {
	const container = document.getElementById("google-login");
	if (!container) return;

	const clientId = await fetchClientId().catch(() => null);
	if (!clientId) {
		container.innerHTML = "<p style='color:red'>Error cargando Google Login</p>";
		return;
	}
	renderButton(container, clientId);
}

window.onload = initLogin;
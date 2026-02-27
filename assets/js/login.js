/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   login.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/27 09:13:44 by agarcia2          #+#    #+#             */
/*   Updated: 2026/02/27 09:58:58 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const WORKER_URL = "https://tfg-tracker.alexgaro2015-5ed.workers.dev";

function handleGoogleLogin(resp)
{
	try
	{
		const jwt = resp?.credential;
		if (!jwt)
		{
			console.error("❌ No se recibió JWT de Google.");
			alert("Error: no se pudo iniciar sesión con Google.");
			return;
		}
		console.log("Google JWT recibido:", jwt);
		localStorage.setItem("google_jwt", jwt);
		window.location.href = "/form/form.html";
	}
	catch (err)
	{
		console.error("Error en handleGoogleLogin:", err);
		alert("⚠ Error procesando la respuesta de Google.");
	}
}

async function getClientIdFromWorker()
{
	try
	{
		const res = await fetch(WORKER_URL);
		if (!res.ok)
			throw new Error(`Error obteniendo client_id (${res.status})`);

		const data = await res.json();
		return data.client_id || null;
	}
	catch (err)
	{
		console.error("Cloudflare Worker error:", err);
		return null;
	}
}

window.onload = async () =>
{
	const container = document.getElementById("google-login");
	if (!container)
	{
		console.error("❌ No existe el contenedor #google-login");
		return;
	}
	const clientId = await getClientIdFromWorker();
	if (!clientId)
	{
		console.error("❌ No se pudo cargar el client_id de Google.");
		container.innerHTML =
			"<p style='color:red'>Error cargando Google Login</p>";
		return;
	}
	try
	{
		google.accounts.id.initialize({
			client_id: clientId,
			callback: handleGoogleLogin,
			auto_select: false
		});

		google.accounts.id.renderButton(container,
			{
				theme: "filled_black",
				size: "large",
				shape: "rectangular"
			}
		);

		google.accounts.id.prompt();
	}
	catch (err)
	{
		console.error("Error inicializando Google Identity:", err);
		container.innerHTML =
			"<p style='color:red'>No se pudo cargar Google Login</p>";
	}
};

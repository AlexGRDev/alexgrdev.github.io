/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   login.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/27 09:13:44 by agarcia2          #+#    #+#             */
/*   Updated: 2026/02/27 09:16:14 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

function handleGoogleLogin(resp)
{
	try
	{
		const jwt = resp?.credential;
		if (!jwt)
		{
			console.error("❌ No se recibió JWT de Google.");
			return;
		}
		console.log("Google JWT recibido:", jwt);

		localStorage.setItem("google_jwt", jwt);
		window.location.href = "/form/form.html";
	}
	catch (err)
	{
		console.error("Error en handleGoogleLogin:", err);
	}
}

async function getClientIdFromWorker()
{
	try
	{
		const res = await fetch(
			"https://tfg-tracker.alexgaro2015-5ed.workers.dev/client-id"
		);

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
	const clientId = await getClientIdFromWorker();

	if (!clientId)
	{
		console.error("❌ No se pudo cargar el client_id de Google.");
		return;
	}
	try
	{
		google.accounts.id.initialize({
			client_id: clientId,
			callback: handleGoogleLogin
		});

		google.accounts.id.renderButton(
			document.getElementById("google-login"),
			{
				theme: "filled_black",
				size: "large",
				width: 260
			}
		);

		google.accounts.id.prompt();
	}
	catch (err)
	{
		console.error("Error inicializando Google Identity:", err);
	}
};

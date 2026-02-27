/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cookies.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/27 09:15:20 by agarcia2          #+#    #+#             */
/*   Updated: 2026/02/27 09:15:21 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const g_banner = document.getElementById("cookie-banner");
const g_btn_accept = document.getElementById("cookie-accept");

function acceptCookies()
{
	try
	{
		localStorage.setItem("cookies-accepted", "true");

		if (g_banner)
			g_banner.classList.add("hidden");

		if (typeof sendTracker === "function")
			sendTracker();
		else
			console.warn("sendTracker() no está definido.");
	}
	catch (err)
	{
		console.error("Error al aceptar cookies:", err);
	}
}

function initCookieBanner()
{
	if (!g_banner || !g_btn_accept)
	{
		console.error("Cookie banner: faltan elementos HTML.");
		return;
	}

	const accepted = localStorage.getItem("cookies-accepted");

	if (!accepted)
		g_banner.classList.remove("hidden");

	g_btn_accept.onclick = acceptCookies;
}

window.addEventListener("DOMContentLoaded", initCookieBanner);
/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   form-listener.js                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/13 00:00:00 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/16 12:12:29 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const THANKS = "/form/thanks.html";
const POLL_MS = 500;

let booted = false;

function iframeUrl(iframe) {
	try { return iframe.contentWindow.location.href; }
	catch { return ""; }
}

function onLoad() {
	if (!booted) { booted = true; return; }
	location.href = THANKS;
}

function poll(iframe) {
	if (iframeUrl(iframe).includes("formResponse"))
		location.href = THANKS;
}

function init() {
	const iframe = document.getElementById("tf-form");
	if (!iframe) return;
	iframe.addEventListener("load", onLoad);
	setInterval(() => poll(iframe), POLL_MS);
}

init();
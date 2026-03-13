/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/13 11:29:03 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/13 11:29:23 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth-guard.js                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: agarcia2 <agarcia2@student.42barcelona.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/13 00:00:00 by agarcia2          #+#    #+#             */
/*   Updated: 2026/03/13 00:00:00 by agarcia2         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const AUTH_GUARD =
{
	LOGIN_URL:   "/login/index.html",
	JWT_KEY:     "google_jwt",
	MAX_AGE_MS:  3600 * 1000 
};

(function guard()
{
	const raw = localStorage.getItem(AUTH_GUARD.JWT_KEY);

	if (!raw)
		return redirect("no_jwt");
	try
	{
		const payload = raw.split(".")[1];
		const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
		const now = Math.floor(Date.now() / 1000);
		if (decoded.exp && decoded.exp < now)
		{
			localStorage.removeItem(AUTH_GUARD.JWT_KEY);
			return redirect("jwt_expired");
		}
		const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
		if (!validIssuers.includes(decoded.iss))
		{
			localStorage.removeItem(AUTH_GUARD.JWT_KEY);
			return redirect("invalid_issuer");
		}
	}
	catch (_)
	{
		localStorage.removeItem(AUTH_GUARD.JWT_KEY);
		return redirect("malformed_jwt");
	}
})();

function redirect(reason)
{
	const dest = `${AUTH_GUARD.LOGIN_URL}?reason=${reason}&next=${encodeURIComponent(location.pathname)}`;
	window.location.replace(dest);
}
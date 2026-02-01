function handleGoogleLogin(response) {
	console.log("Google JWT recibido:", response.credential);
	localStorage.setItem("google_jwt", response.credential);

	window.location.href = "/form/form.html";  // <- AHORA SÍ BRO 😭🔥
}

// Obtener client_id desde Cloudflare Worker
async function getClientIdFromWorker() {
	try {
		const res = await fetch("https://tfg-tracker.alexgaro2015.workers.dev/client-id");

		if (!res.ok) throw new Error("Error obteniendo client_id");

		const data = await res.json();
		return data.client_id;

	} catch (e) {
		console.error("Cloudflare Worker error:", e);
		return null;
	}
}

// INICIALIZAR
window.onload = async () => {
	const clientId = await getClientIdFromWorker();
	if (!clientId) return;

	google.accounts.id.initialize({
		client_id: clientId,
		callback: handleGoogleLogin,
	});

	google.accounts.id.renderButton(
		document.getElementById("google-login"),
		{ theme: "filled_black", size: "large" }
	);

	google.accounts.id.prompt();
};
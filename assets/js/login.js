// ==========================
// CALLBACK DEL LOGIN
// ==========================
function handleGoogleLogin(response) {
	console.log("Google JWT recibido:", response.credential);

	localStorage.setItem("google_jwt", response.credential);

	// Redirigir tras login
	window.location.href = "/auth/callback.html";
}

// ==========================
// Obtener client_id desde Cloudflare Worker
// ==========================
async function getClientIdFromWorker() {
	try {
		const res = await fetch(
			"https://tfg-tracker.alexgaro2015.workers.dev/client-id",
			{ method: "GET" }
		);

		if (!res.ok) throw new Error("Fallo al obtener client_id");

		const data = await res.json();
		return data.client_id;

	} catch (err) {
		console.error("Error Cloudflare:", err);
		return null;
	}
}

// ==========================
// Inicializar Google Login
// ==========================
window.onload = async () => {

	const clientId = await getClientIdFromWorker();

	if (!clientId) {
		console.error("ERROR: client_id no cargado");
		return;
	}

	google.accounts.id.initialize({
		client_id: clientId,
		callback: handleGoogleLogin
	});

	google.accounts.id.renderButton(
		document.getElementById("google-login"),
		{
			theme: "filled_black",
			size: "large"
		}
	);
};
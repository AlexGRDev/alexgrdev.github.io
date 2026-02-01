// 1. Callback de Google
function handleGoogleLogin(response) {
	console.log("JWT recibido:", response.credential);
	localStorage.setItem("google_jwt", response.credential);
	window.location.href = "/auth/callback.html";
}

// 2. Cargar client_id desde Cloudflare Worker
async function getClientId() {
	try {
		const res = await fetch("https://tfg-tracker.alexgaro2015.workers.dev/client-id");
		const data = await res.json();
		return data.client_id;
	} catch (err) {
		console.error("Error obteniendo client_id:", err);
		return null;
	}
}

// 3. Inicializar Google Login
window.onload = async () => {
	const clientId = await getClientId();

	if (!clientId) {
		console.error("No se pudo cargar el client_id");
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
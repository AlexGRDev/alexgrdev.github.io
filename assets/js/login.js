// ==========================
//   CALLBACK DEL LOGIN
// ==========================
function handleGoogleLogin(response) {
	console.log("Google JWT recibido:", response.credential);

	// Guardar JWT
	localStorage.setItem("google_jwt", response.credential);

	// Redirigir al formulario
	window.location.href =
		"https://docs.google.com/forms/d/e/1FAIpQLSfKIS-u1pOVuyH7Dtr1mEf1fixatu7qbIkue4Z877PbiAwJpw/viewform";
}

// ==========================
//  FUNCIÓN: obtener client_id desde Cloudflare
// ==========================
async function getClientIdFromWorker() {
	try {
		const res = await fetch("https://tfg-tracker.alexgaro2015.workers.dev/client-id");

		if (!res.ok) throw new Error("Error obteniendo client_id");

		const data = await res.json();
		return data.client_id;
	} catch (e) {
		console.error("Error Cloudflare:", e);
		return null;
	}
}

// ==========================
//    INICIALIZAR LOGIN
// ==========================
window.onload = async function () {
	const clientId = await getClientIdFromWorker();

	if (!clientId) {
		console.error("No se pudo cargar el client_id desde Cloudflare.");
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
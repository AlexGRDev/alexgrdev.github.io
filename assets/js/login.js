// ==========================
//     CALLBACK LOGIN
// ==========================
function handleGoogleLogin(response) {
	console.log("Google JWT recibido:", response.credential);

	localStorage.setItem("google_jwt", response.credential);

	// Redirigir al formulario
	window.location.href =
		"https://docs.google.com/forms/d/e/1FAIpQLSfKIS-u1pOVuyH7Dtr1mEf1fixatu7qbIkue4Z877PbiAwJpw/viewform";
}

// ==========================
//     CLIENT ID DESDE WORKER
// ==========================
async function getClientId() {
	try {
		const res = await fetch("https://tfg-tracker.alexgaro2015.workers.dev/client-id");
		if (!res.ok) throw new Error("No se pudo obtener client_id");

		return (await res.json()).client_id;
	} catch (err) {
		console.error("Error obteniendo client_id:", err);
		return null;
	}
}

// ==========================
//     INICIALIZACIÓN
// ==========================
window.onload = async () => {
	const clientId = await getClientId();
	if (!clientId) {
		console.error("Sin client_id → no se puede iniciar Google.");
		return;
	}

	// IA de Google
	google.accounts.id.initialize({
		client_id: clientId,
		callback: handleGoogleLogin
	});

	// Render si funciona
	try {
		google.accounts.id.renderButton(
			document.getElementById("google-login"),
			{
				theme: "filled_black",
				size: "large",
				width: 280
			}
		);
	} catch (e) {
		console.warn("El botón de Google no se pudo renderizar:", e);
	}

	// Botón manual que SIEMPRE funciona
	document.getElementById("manual-google-btn").addEventListener("click", () => {
		console.log("Forzando Google One Tap...");
		try {
			google.accounts.id.prompt();
		} catch (err) {
			console.error("Error al forzar prompt:", err);
			alert("Google no está disponible ahora mismo. Prueba más tarde.");
		}
	});
};
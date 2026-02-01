// ==========================
//   CALLBACK DEL LOGIN
// ==========================
function handleGoogleLogin(response) {
	console.log("Google JWT recibido:", response.credential);

	// Guardar JWT localmente
	localStorage.setItem("google_jwt", response.credential);

	// Redirigir al formulario
	window.location.href =
		"https://docs.google.com/forms/d/e/1FAIpQLSfKIS-u1pOVuyH7Dtr1mEf1fixatu7qbIkue4Z877PbiAwJpw/viewform";
}

// ==========================
//   Obtener CLIENT_ID del Worker
// ==========================
async function getClientId() {
	try {
		const res = await fetch("https://tfg-tracker.alexgaro2015.workers.dev/client-id");

		if (!res.ok) throw new Error("Worker devolvió error");

		const data = await res.json();
		console.log("Client ID obtenido:", data.client_id);
		return data.client_id;
	} catch (err) {
		console.error("No se pudo obtener el client_id:", err);
		return null;
	}
}

// ==========================
//   Esperar a que cargue Google
// ==========================
function waitForGoogle() {
	return new Promise(resolve => {
		let tries = 0;

		const check = setInterval(() => {
			if (window.google && google.accounts && google.accounts.id) {
				clearInterval(check);
				resolve(true);
			}

			tries++;
			if (tries > 20) { // 20 intentos = 2 segundos
				clearInterval(check);
				resolve(false);
			}
		}, 100);
	});
}

// ==========================
//   INICIALIZACIÓN DEL LOGIN
// ==========================
window.onload = async () => {
	console.log("Inicializando login de Google...");

	// 1. Esperar a que Google Identity cargue
	const googleLoaded = await waitForGoogle();

	if (!googleLoaded) {
		console.error("Google Identity NO se cargó.");
		alert("Google Login no está disponible ahora mismo. Inténtalo más tarde.");
		return;
	}

	// 2. Obtener el client_id desde Cloudflare
	const clientId = await getClientId();

	if (!clientId) {
		console.error("Falta el CLIENT_ID → No se puede continuar.");
		return;
	}

	// 3. Inicializar Google Auth
	google.accounts.id.initialize({
		client_id: clientId,
		callback: handleGoogleLogin
	});

	// 4. Renderizar botón clásico
	google.accounts.id.renderButton(
		document.getElementById("google-login"),
		{
			theme: "filled_black",
			size: "large",
			width: 280
		}
	);

	// 5. Botón manual (backup SIEMPRE funciona)
	document.getElementById("manual-google-btn").addEventListener("click", () => {
		console.log("Forzando Google prompt...");
		try {
			google.accounts.id.prompt();
		} catch (err) {
			console.error("No se pudo abrir Google Login:", err);
		}
	});
};
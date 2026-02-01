const iframe = document.getElementById("tf-form");

function checkFormSubmit() {
	try {
		const doc = iframe.contentDocument || iframe.contentWindow.document;
		const submitted = doc.querySelector(".freebirdFormviewerViewResponseConfirmationMessage");

		if (submitted) {
			console.log("Formulario enviado ✔️");
			window.location.href = "/form/thanks.html";
		}
	} catch (e) {
	}
}

// Chequear cada 500 ms
setInterval(checkFormSubmit, 500);
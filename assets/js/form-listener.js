const iframe = document.getElementById("tf-form");

setInterval(() => {
	try {
		const url = iframe.contentWindow.location.href;

		if (url.includes("formResponse")) {
			window.location.href = "/thanks.html";
		}

	} catch (e) { }
}, 400);
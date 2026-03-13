const iframe = document.getElementById("tf-form");
 
let firstLoad = true;
 
iframe.addEventListener("load", function () {
	if (firstLoad) {
		firstLoad = false;
		return;
	}
	window.location.href = "/form/thanks.html";
});
 
setInterval(function () {
	try {
		const url = iframe.contentWindow.location.href;
		if (url.includes("formResponse")) {
			window.location.href = "/form/thanks.html";
		}
	} catch (e) {
	}
}, 500);
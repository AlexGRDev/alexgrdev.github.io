function handleGoogleLogin(response) {
	console.log("Google JWT:", response.credential);
	localStorage.setItem("google_jwt", response.credential);

	window.location.href = "/auth/callback.html";
}

window.onload = () => {
	google.accounts.id.initialize({
		client_id: "543054701232-26jugrj35b8uemgobal3r01lph409c3b.apps.googleusercontent.com",
		callback: handleGoogleLogin
	});

	google.accounts.id.renderButton(
		document.getElementById("google-login"),
		{ theme: "filled_black", size: "large" }
	);
};
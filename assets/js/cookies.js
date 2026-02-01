document.addEventListener("DOMContentLoaded", () => {

	if (!localStorage.getItem("cookies-accepted")) {

		const banner = document.createElement("div");
		banner.id = "cookie-banner";
		banner.style = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #111;
            color: #fff;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 9999;
            border-top: 2px solid #0f0;
        `;

		banner.innerHTML = `
            <span>Este sitio utiliza cookies para análisis del TFG.</span>
            <button id="cookie-accept" style="
                background:#0f0;
                color:#000;
                padding:8px 14px;
                border:none;
                cursor:pointer;
                font-weight:bold;
            ">Aceptar</button>
        `;

		document.body.appendChild(banner);

		document.getElementById("cookie-accept").addEventListener("click", () => {
			localStorage.setItem("cookies-accepted", "true");
			banner.remove();
			sendTracker();
		});
	}
});
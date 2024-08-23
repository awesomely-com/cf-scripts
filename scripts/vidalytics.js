import { addStyles } from "../util";

// Change to 1024px to target both mobile & tablet devices
const IS_MOBILE = window.matchMedia("(max-width: 770px)").matches;

export default function onRenderVideo(options) {
	if (!options || typeof options !== "object") return;
	const { desktop, mobile, ctaElements } = options;

	const urlParams = new URLSearchParams(window.location.search);

	if (
		window.location.host === "app.funnel-preview.com" ||
		urlParams.get("debug") === "true"
	) {
		onAddDebugButton(ctaElements);
	}

	document.querySelector("#desktop_video>div").id = desktop.embedId;
	if (mobile) {
		document.querySelector("#mobile_video>div").id = mobile.embedId;
	}

	if (IS_MOBILE && mobile) {
		onLoadEmbedCode(mobile?.embedId);
		onShowVideoElement("mobile_video");
		initializePlayerAPI(mobile, ctaElements);
	} else {
		onLoadEmbedCode(desktop?.embedId);
		onShowVideoElement("desktop_video");
		initializePlayerAPI(desktop, ctaElements);
	}
}

function onLoadEmbedCode(embedId) {
	const key = embedId.replace("vidalytics_embed_", "");
	(function (v, i, d, a, l, y, t, c, s) {
		y = "_" + d.toLowerCase();
		c = d + "L";
		if (!v[d]) {
			v[d] = {};
		}
		if (!v[c]) {
			v[c] = {};
		}
		if (!v[y]) {
			v[y] = {};
		}
		var vl = "Loader",
			vli = v[y][vl],
			vsl = v[c][vl + "Script"],
			vlf = v[c][vl + "Loaded"],
			ve = "Embed";
		if (!vsl) {
			vsl = function (u, cb) {
				if (t) {
					cb();
					return;
				}
				s = i.createElement("script");
				s.type = "text/javascript";
				s.async = 1;
				s.src = u;
				if (s.readyState) {
					s.onreadystatechange = function () {
						if (s.readyState === "loaded" || s.readyState == "complete") {
							s.onreadystatechange = null;
							vlf = 1;
							cb();
						}
					};
				} else {
					s.onload = function () {
						vlf = 1;
						cb();
					};
				}
				i.getElementsByTagName("head")[0].appendChild(s);
			};
		}
		vsl(l + "loader.min.js", function () {
			if (!vli) {
				var vlc = v[c][vl];
				vli = new vlc();
			}
			vli.loadScript(l + "player.min.js", function () {
				var vec = v[d][ve];
				t = new vec();
				t.run(a);
			});
		});
	})(
		window,
		document,
		"Vidalytics",
		`vidalytics_embed_${key}`,
		`https://quick.vidalytics.com/embeds/Y_1586Xh/${key}/`
	);
}

function onShowVideoElement(selector) {
	const targetElement = document.getElementById(selector);
	targetElement.style.display = "block";
}

function onShowHiddenItems(elements) {
	if (!elements) return;
	for (const element of elements) {
		const [name, styles] = element;
		addStyles(document.querySelector(name), styles);
	}
}

function initializePlayerAPI(options, ctaElements) {
	!(function (v, a, p, i) {
		v.getVidalyticsPlayer = (n) => {
			(v[a] = v[a] || {}), (v[a][p] = v[a][p] || {});
			let d = (v[a][p][n] = v[a][p][n] || {});
			return new Promise((e) => {
				if (d[i]) return void e(d[i]);
				let t;
				Object.defineProperty(d, i, {
					get: () => t,
					set(i) {
						(t = i), e(i);
					},
				});
			});
		};
	})(window, "_vidalytics", "embeds", "player");

	getVidalyticsPlayer(options.embedId).then((player) => {
		if (!player) return;
		if (IS_MOBILE) {
			player.on("play", () => {
				onOpenFullscreenVideo(options);
			});
			player.on("pause", () => {
				onCloseFullscreenVideo(options);
			});
			player.on("ended", () => {
				onCloseFullscreenVideo(options);
			});
			player.on("unmute", () => {
				onOpenFullscreenVideo(options);
			});
		}
		let isCTATriggered = false;
		player.on("timeupdate", () => {
			if (isCTATriggered) return;
			const currentTime = Math.floor(player.currentTime());
			if (currentTime >= options?.ctaTime) {
				isCTATriggered = true;
				onShowHiddenItems(ctaElements);
			}
		});
	});
}

function onOpenFullscreenVideo({ elements }) {
	document
		.querySelector(elements?.row)
		.style.setProperty("padding", "0px", "important");
	document
		.querySelector(`${elements?.row} div.col-inner`)
		.style.setProperty("padding", "0px", "important");
	addStyles(document.querySelector(elements?.headerContainer), {
		display: "none",
	});
	addStyles(document.querySelector(elements?.bannerContainer), {
		display: "none",
	});
	addStyles(document.querySelector("#mobile_video"), {
		border: "none",
		borderRadius: "0",
		backgroundColor: "black",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		height: "100vh",
	});
	window.scroll({ top: 0 });
}

function onCloseFullscreenVideo({ elements }) {
	// Turn OFF Fullscreen
	document.querySelector(elements.headerContainer).style.display = null;
	document.querySelector(elements.row).style.padding = null;
	document
		.querySelector(`${elements?.row} div.col-inner`)
		.removeAttribute("style");
	document.querySelector("#mobile_video").removeAttribute("style");
}

function onAddDebugButton(ctaElements) {
	const button = document.createElement("button");
	button.innerText = "Show CTA";
	addStyles(button, {
		zIndex: 999,
		position: "fixed",
		right: "2rem",
		top: "2rem",
		backgroundColor: "yellow",
		padding: "2px 4px",
		borderRadius: "0.5rem",
		fontSize: "16px",
	});
	button.addEventListener("click", () => {
		onShowHiddenItems(ctaElements);
	});
	document.body.append(button);
}

import { addStyles } from "../util";

type CtaElement = [selector: string, styles: Partial<CSSStyleDeclaration>];

export type VslFailureType = "script_error" | "network_error" | "timeout";

export interface VslGuardOptions {
	embedId: string;
	ctaElements?: CtaElement[];
	onBlocked?: (detail: VslGuardEventDetail) => void;
	onLoaded?: (detail: VslGuardEventDetail) => void;
	/** Probe the player host if the player hasn't initialised by then. */
	probeAfterMs?: number;
	/** Give up and treat the player as blocked. */
	timeoutMs?: number;
	/** First-party collector; must not live on a commonly blocked host. */
	reportUrl?: string | false;
	message?: string;
}

export interface VslGuardEventDetail {
	embedId: string;
	videoId: string;
	page: string;
	status: "loaded" | "blocked" | "recovered";
	failureType?: VslFailureType;
	elapsedMs: number;
	retryCount: number;
}

const DEFAULT_REPORT_URL = "https://www.awesomely.com/api/track/vsl-player";
const DEFAULT_MESSAGE =
	"Your browser or network is blocking our video player. Turn off your ad/tracker blocker or VPN filter for this site, or try another browser or network.";
const PLAYER_HOST_PATTERN = /(^|\.)vidalytics\.com$/i;
const RETRY_KEY = "vsl_guard_retries";

export default function guardVsl(options: VslGuardOptions) {
	if (!options?.embedId || window !== window.top) return;

	const {
		embedId,
		ctaElements,
		onBlocked,
		onLoaded,
		probeAfterMs = 4_000,
		timeoutMs = 12_000,
		reportUrl = DEFAULT_REPORT_URL,
		message = DEFAULT_MESSAGE,
	} = options;

	const startedAt = performance.now();
	const videoId = embedId.replace("vidalytics_embed_", "");
	const retryCount = Number(sessionStorage.getItem(RETRY_KEY) ?? 0) || 0;
	let state: "pending" | "loaded" | "blocked" = "pending";

	const detail = (
		status: VslGuardEventDetail["status"],
		failureType?: VslFailureType,
	): VslGuardEventDetail => ({
		embedId,
		videoId,
		page: location.host + location.pathname,
		status,
		failureType,
		elapsedMs: Math.round(performance.now() - startedAt),
		retryCount,
	});

	const markBlocked = (failureType: VslFailureType) => {
		if (state !== "pending") return;
		// No container means this page/viewport doesn't render the embed; nothing to rescue.
		if (failureType !== "script_error" && !document.getElementById(embedId)) return;
		state = "blocked";
		cleanup();
		const d = detail("blocked", failureType);
		report("vsl_player_blocked", d, reportUrl);
		renderBlockedMessage(embedId, message);
		revealCta(ctaElements);
		onBlocked?.(d);
		waitForPlayer(embedId).then(() => {
			removeBlockedMessage(embedId);
			report("vsl_player_recovered", detail("recovered", failureType), reportUrl);
		});
	};

	const onResourceError = (event: Event) => {
		const target = event.target as HTMLScriptElement | null;
		if (target?.tagName !== "SCRIPT" || !target.src) return;
		try {
			if (PLAYER_HOST_PATTERN.test(new URL(target.src).hostname)) {
				markBlocked("script_error");
			}
		} catch {}
	};
	window.addEventListener("error", onResourceError, true);

	const probeTimer = window.setTimeout(() => {
		if (state !== "pending") return;
		fetch(`https://quick.vidalytics.com/embeds/Y_1586Xh/${videoId}/loader.min.js`, {
			mode: "no-cors",
			cache: "force-cache",
		}).catch(() => markBlocked("network_error"));
	}, probeAfterMs);

	const timeoutTimer = window.setTimeout(() => markBlocked("timeout"), timeoutMs);

	function cleanup() {
		window.removeEventListener("error", onResourceError, true);
		window.clearTimeout(probeTimer);
		window.clearTimeout(timeoutTimer);
	}

	waitForPlayer(embedId).then(() => {
		if (state !== "pending") return;
		state = "loaded";
		cleanup();
		sessionStorage.removeItem(RETRY_KEY);
		const d = detail("loaded");
		report("vsl_player_loaded", d, reportUrl);
		onLoaded?.(d);
	});
}

/** Polls instead of hooking `_vidalytics.embeds[id].player` so it never fights the page's own getVidalyticsPlayer shim. */
function waitForPlayer(embedId: string, intervalMs = 250): Promise<unknown> {
	return new Promise((resolve) => {
		const check = () => {
			const player = (window as any)._vidalytics?.embeds?.[embedId]?.player;
			if (player) return resolve(player);
			window.setTimeout(check, intervalMs);
		};
		check();
	});
}

function revealCta(ctaElements?: CtaElement[]) {
	if (!ctaElements) return;
	for (const [selector, styles] of ctaElements) {
		addStyles(document.querySelector(selector), styles);
	}
}

function report(event: string, detail: VslGuardEventDetail, reportUrl: string | false) {
	const payload = {
		event,
		vsl_page: detail.page,
		vsl_video_id: detail.videoId,
		vsl_status: detail.status,
		vsl_failure_type: detail.failureType ?? null,
		vsl_elapsed_ms: detail.elapsedMs,
		vsl_retry_count: detail.retryCount,
	};

	const w = window as any;
	w.dataLayer = w.dataLayer || [];
	w.dataLayer.push(payload);

	if (!reportUrl) return;
	const body = JSON.stringify({
		...payload,
		url: location.href,
		referrer: document.referrer,
		atclid: readAtclid(),
		viewport_width: window.innerWidth,
	});
	try {
		// text/plain keeps sendBeacon a CORS "simple" request (no preflight).
		const blob = new Blob([body], { type: "text/plain" });
		if (navigator.sendBeacon?.(reportUrl, blob)) return;
	} catch {}
	fetch(reportUrl, { method: "POST", body, keepalive: true, mode: "no-cors" }).catch(() => {});
}

function readAtclid(): string | null {
	try {
		return (
			new URLSearchParams(location.search).get("atclid") ||
			localStorage.getItem("ATCurrentAtclid") ||
			null
		);
	} catch {
		return null;
	}
}

const MESSAGE_ATTR = "data-vsl-guard-message";

function renderBlockedMessage(embedId: string, message: string) {
	const container = document.getElementById(embedId);
	if (!container || container.querySelector(`[${MESSAGE_ATTR}]`)) return;

	if (getComputedStyle(container).position === "static") {
		container.style.position = "relative";
	}

	const overlay = document.createElement("div");
	overlay.setAttribute(MESSAGE_ATTR, "");
	overlay.setAttribute("role", "alert");
	addStyles(overlay, {
		position: "absolute",
		inset: "0",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		gap: "14px",
		padding: "20px",
		background: "#111",
		color: "#fff",
		textAlign: "center",
		fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
		fontSize: "clamp(14px, 2.4vw, 18px)",
		lineHeight: "1.4",
		zIndex: "5",
	});

	const text = document.createElement("p");
	text.textContent = message;
	addStyles(text, { margin: "0", maxWidth: "560px" });

	const hint = document.createElement("p");
	hint.textContent = "You can still continue — the offer is below the video.";
	addStyles(hint, { margin: "0", opacity: "0.75", fontSize: "0.85em" });

	const retry = document.createElement("button");
	retry.type = "button";
	retry.textContent = "Retry video";
	addStyles(retry, {
		padding: "10px 22px",
		border: "0",
		borderRadius: "999px",
		background: "#f5c518",
		color: "#111",
		fontWeight: "700",
		fontSize: "16px",
		cursor: "pointer",
	});
	retry.addEventListener("click", () => {
		const n = Number(sessionStorage.getItem(RETRY_KEY) ?? 0) || 0;
		sessionStorage.setItem(RETRY_KEY, String(n + 1));
		location.reload();
	});

	overlay.append(text, retry, hint);
	container.append(overlay);
}

function removeBlockedMessage(embedId: string) {
	document.getElementById(embedId)?.querySelector(`[${MESSAGE_ATTR}]`)?.remove();
}

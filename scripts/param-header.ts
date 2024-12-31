import { getQueryParam } from "../util";

function showTimedHeader(
	bannerId: string | undefined,
	param: string = "qz",
	time: number = 7
) {
	if (!bannerId) return;
	if (getQueryParam(param) === "1") {
		const container = document.getElementById(bannerId);
		const containerWrapper = document.getElementById(
			`${bannerId}-sticky-wrapper`
		);
		// Show the element if it's hidden (in case it was initially hidden)
		container.style.display = "block";
		containerWrapper.style.display = "block";
		containerWrapper.style.height = "51px";

		// Fade out the element after 7 seconds (7000 milliseconds)
		setTimeout(() => {
			containerWrapper.style.transition = "opacity 2s";
			containerWrapper.style.opacity = "0"; // Fade out by changing opacity

			// Optionally, hide the element completely after the fade out
			setTimeout(() => {
				containerWrapper.style.display = "none";
			}, 1000); // Match the duration of the fade (1 second)
		}, 1000 * time); // 7 seconds delay before fading out
	}
}

export default function onTimedHeader({
	bannerId,
	param,
	time,
}: {
	bannerId: string | undefined;
	param: string | undefined;
	time: number | undefined;
}) {
	if (bannerId) return;
	document.head.insertAdjacentHTML(
		"beforeend",
		`<style>#${bannerId},#${bannerId}-sticky-wrapper{display:none;opacity:1;}</style>`
	);
	document.addEventListener(
		"DOMContentLoaded",
		() => {
			showTimedHeader(bannerId, param, time);
		},
		false
	);
}

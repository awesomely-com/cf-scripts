import type { CountdownElements } from "../types";
import {
	addStyles,
	formatCountdownString,
	getPacificMidnightTime,
} from "../util";

export default function isOfferClosed(elements: CountdownElements) {
	const urlParams = new URLSearchParams(window.location.search);
	const dateParam: string | null = urlParams.get("d");

	const { countdown, countdownContainer, banner } = elements;

	if (dateParam) {
		document.querySelector(banner)?.remove();
		document.head.insertAdjacentHTML(
			"beforeend",
			`<style>
				::backdrop {background: black;opacity: 0.75;}
				${countdown} {
					font-family: 'Open Sans', sans-serif;
					text-align: center;
					display: block;
					margin: 0 auto;
				}
				</style>`
		);

		const offerDate = getPacificMidnightTime(dateParam).getTime();
		let timeLeft = offerDate ? offerDate - new Date().getTime() : 0;

		if (timeLeft <= 0) {
			addStyles(document.querySelector(countdownContainer), {
				display: "none",
			});
			document.body.style.overflowY = "hidden";
			const modal = document.createElement("dialog");
			addStyles(modal, {
				border: "none",
				padding: "3.5rem",
				justifyContent: "center",
				alignItems: "center",
				textAlign: "center",
				flexDirection: "column",
				display: "flex",
				gap: "1rem",
				margin: "auto",
				fontSize: "1.65rem",
			});
			modal.innerHTML = `
            <h2 style="font-size: 3rem; font-weight: 600; margin: 0">This offer has expired.</h2>
			<p style="margin: 0">
			<a href="mailto:support@awesomely.com" style="color:coral;">support@awesomely.com</a><br />
			(877) 224-0445
			</p>
			<p style="margin: 0">
			<b>Monday - Friday</b><br />
			9:00am - 5:00pm ET
			</p>
			`;
			document.body.appendChild(modal);
			modal.showModal();
		} else {
			addStyles(document.querySelector(countdownContainer), {
				display: "block",
			});
			const interval = setInterval(() => {
				timeLeft = timeLeft - 1000;
				if (timeLeft <= 0) {
					if (interval) {
						clearInterval(interval);
						document.querySelector(countdown)?.remove();
					}
				} else {
					const countdownTime = {
						days: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
						hours: Math.floor(
							(timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
						),
						minutes: Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)),
						seconds: Math.floor((timeLeft % (1000 * 60)) / 1000),
					};

					document.querySelector(
						countdown
					).innerHTML = `OFFER ENDS IN <b>${formatCountdownString(
						countdownTime
					)}</b>`;
				}
			}, 1000);
		}
	}
}

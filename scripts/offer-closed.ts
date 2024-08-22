import type { CountdownElements } from "../types";
import {
	addStyles,
	formatCountdownString,
	getPacificMidnightTime,
} from "../util";

export default function isOfferClosed(elements: CountdownElements) {
	const urlParams = new URLSearchParams(window.location.search);
	const dateParam: string | null = urlParams.get("d");
	const utmSource: string | null = urlParams.get("utm_source");

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
				padding: "24px",
				justifyContent: "center",
				alignItems: "center",
				textAlign: "center",
				flexDirection: "column",
				display: "flex",
				margin: "auto",
				fontSize: "18px",
				borderRadius: "12px",
				color: "#475467",
			});
			modal.innerHTML = `
			<p style="color:#D92D20;font-weight:700;margin:0 0 4px 0;font-size:14px;">OOPS! YOU JUST MISSED IT!</p>
            <h2 style="font-size:24px;font-weight:700;margin:0;color:#101828">This offer has expired.</h2>
			${
				utmSource === `fandi`
					? ``
					: `<p style="margin:16px 0 0;">
			<a href="mailto:support@awesomely.com" style="color:#1570EF;">support@awesomely.com</a><br />
			(877) 224-0445
			</p>
			<p style="margin:0;">
			Monday - Friday<br />
			9:00am - 5:00pm ET
			</p>`
			}
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

import {
	addStyles,
	formatCountdownString,
	getPacificMidnightTime,
} from "../util";

export default function isOfferClosed(countdownId: string) {
	const urlParams = new URLSearchParams(window.location.search);
	const dateParam: string | null = urlParams.get("d");

	if (dateParam) {
		const offerDate = getPacificMidnightTime(dateParam).getTime();
		let timeLeft = offerDate ? offerDate - new Date().getTime() : 0;

		if (timeLeft <= 0) {
			document.head.insertAdjacentHTML(
				"beforeend",
				`<style>::backdrop {background: black;opacity: 0.75;}</style>`
			);
			const modal = document.createElement("dialog");
			addStyles(modal, {
				border: "none",
				padding: "1rem",
				justifyContent: "center",
				alignItems: "center",
				textAlign: "center",
				flexDirection: "column",
				maxWidth: "325px",
				display: "flex",
				gap: "1rem",
				margin: "auto",
				fontSize: "1.3rem",
			});
			modal.innerHTML = `
            <h2 style="font-size: 2rem; margin: 0">This offer has expired.</h2>
			<p style="margin: 0">
			<a href="mailto:support@awesomely.com">support@awesomely.com</a><br />
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
			const interval = setInterval(() => {
				timeLeft = timeLeft - 1000;
				if (timeLeft <= 0) {
					if (interval) {
						clearInterval(interval);
						document.querySelector(countdownId)?.remove();
					}
				} else {
					const countdown = {
						days: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
						hours: Math.floor(
							(timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
						),
						minutes: Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)),
						seconds: Math.floor((timeLeft % (1000 * 60)) / 1000),
					};

					document.querySelector(countdownId).innerHTML =
						formatCountdownString(countdown);
				}
			}, 1000);
		}
	}
}
import type { CountdownTimerReturn } from "./types";

export function addStyles(el: HTMLElement, styles: Object) {
	if (!el) return;
	Object.assign(el.style, styles);
}

export function getPacificMidnightTime(dateString: string) {
	const date = new Date(dateString);
	if (isNaN(date.getTime())) {
		throw new Error("Invalid date string");
	}

	// move it to the next day since we want to show the countdown until midnight
	// of the target date (start of next day)
	date.setUTCDate(date.getUTCDate() + 1);

	let isDaylightSaving = new Date()
		.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
		.includes("PDT");
	let pacificOffset = isDaylightSaving ? -8 : -7;

	date.setUTCMinutes(date.getUTCMinutes() + pacificOffset * 60 * -1);

	return date;
}

export function formatCountdownString(countdown: CountdownTimerReturn) {
	const { days, hours, minutes, seconds } = countdown;
	const parts = [
		days && `${days}D`,
		hours && `${hours}H`,
		minutes && `${minutes}M`,
		seconds && `${seconds}S`,
	].filter(Boolean);

	return parts.join(" : ");
}

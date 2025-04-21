export default function appendCurrentUrlParamsToLinks(): void {
	const currentParams = new URLSearchParams(window.location.search);

	if (!window.location.search) return;

	// Update anchor tags
	const anchors = document.querySelectorAll<HTMLAnchorElement>("a[href]");
	anchors.forEach((anchor) => {
		try {
			const url = new URL(anchor.href, window.location.origin);
			const linkParams = new URLSearchParams(url.search);

			currentParams.forEach((value, key) => {
				if (!linkParams.has(key)) {
					linkParams.append(key, value);
				}
			});

			url.search = linkParams.toString();
			anchor.href = url.toString();
		} catch (e) {
			console.warn("Invalid URL in anchor:", anchor.href);
		}
	});

	// Update elements with data-imagelink attribute
	const elements = document.querySelectorAll<HTMLElement>("[data-imagelink]");
	elements.forEach((el) => {
		try {
			const imagelink = el.getAttribute("data-imagelink");
			if (!imagelink) return;

			const url = new URL(imagelink, window.location.origin);
			const linkParams = new URLSearchParams(url.search);

			currentParams.forEach((value, key) => {
				if (!linkParams.has(key)) {
					linkParams.append(key, value);
				}
			});

			url.search = linkParams.toString();
			el.setAttribute("data-imagelink", url.toString());
		} catch (e) {
			console.warn(
				"Invalid data-imagelink URL:",
				el.getAttribute("data-imagelink")
			);
		}
	});
}

function appendQueryParamsToUrl(baseUrl: string): string {
	// Get the current URL
	const currentUrl = new URL(window.location.href);

	// Get the query parameters from the current URL
	const queryParams = currentUrl.searchParams;

	// Create a new URL object with the base URL
	const newUrl = new URL(baseUrl);

	// Append each query parameter to the new URL
	queryParams.forEach((value, key) => {
		newUrl.searchParams.append(key, value);
	});

	newUrl.searchParams.append("lpp", window.location.pathname.substring(1));
	newUrl.searchParams.append("from_adv", "1");

	// Return the new URL as a string
	return newUrl.toString();
}

export function quizRedirect(): void {
	// Get all elements with outcome redirects
	const outcomeElements = document.querySelectorAll<HTMLElement>(
		".cf_outcomes_action"
	);

	const defaultOutcomeElement = document.querySelector<HTMLElement>(
		".surveyHideNextButton"
	);

	const defaultBaseUrl = defaultOutcomeElement?.dataset.pageRedirectUrl;

	// Check if the base URL exists
	if (!defaultBaseUrl) {
		console.warn(
			"Element is missing data-page-redirect-url attribute:",
			defaultOutcomeElement
		);
	} else {
		defaultOutcomeElement.dataset.pageRedirectUrl =
			appendQueryParamsToUrl(defaultBaseUrl);
	}

	// Iterate over the elements and append query string parameters
	outcomeElements.forEach((element) => {
		// Get the base URL from the data attribute
		const baseUrl = element.dataset.pageRedirectUrl;

		// Check if the base URL exists
		if (!baseUrl) {
			console.warn(
				"Element is missing data-page-redirect-url attribute:",
				element
			);
			return; // Skip this element
		}

		const newUrl = appendQueryParamsToUrl(baseUrl);

		element.dataset.pageRedirectUrl = newUrl.toString();
	});
}

// Example usage:
// const baseUrl = "https://example.com/new-page";
// const newUrlWithParams = quizRedirect(baseUrl);

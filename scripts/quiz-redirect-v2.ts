export function quizRedirect(): void {
	// Get all elements with outcome redirects
	const elements = document.querySelectorAll<HTMLElement>(
		".cf_outcomes_action"
	);

	// Get the current URL
	const currentUrl = new URL(window.location.href);

	// Get the query parameters from the current URL
	const queryParams = currentUrl.searchParams;

	// Iterate over the elements and append query string parameters
	elements.forEach((element) => {
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

		// Create a new URL object with the base URL
		const newUrl = new URL(baseUrl);

		// Append each query parameter to the new URL
		queryParams.forEach((value, key) => {
			newUrl.searchParams.append(key, value);
		});

		// Update the data-page-redirect-url attribute with the new URL
		element.dataset.pageRedirectUrl = newUrl.toString();
	});
}

// Example usage:
// const baseUrl = "https://example.com/new-page";
// const newUrlWithParams = quizRedirect(baseUrl);

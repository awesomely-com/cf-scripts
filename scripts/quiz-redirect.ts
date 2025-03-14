interface DataItem {
	answerIds: string[]; // Array of IDs
	urlParams: [string, string][]; // Array of key-value pairs for URL params
	redirectUrl: string; // URL to redirect to
}

function handleClickWithDelay(
	redirectUrl: string,
	urlParams: [string, string][]
) {
	return function () {
		setTimeout(() => {
			// Get current URL parameters
			const currentUrlParams = new URLSearchParams(window.location.search);

			// Add the new URL parameters
			urlParams.forEach(([key, value]) => {
				currentUrlParams.set(key, value);
			});

			// Construct the final URL
			const finalUrl = `${redirectUrl}?${currentUrlParams.toString()}`;

			// Redirect to the final URL
			window.location.href = finalUrl;
		}, 1250); // 1.25 seconds delay
	};
}

export function applyOnClickBehavior(data: DataItem[]): void {
	data.forEach((item) => {
		// Iterate over each answerId in the array
		item.answerIds.forEach((id) => {
			// Find all elements with the matching data-answer-id
			const elements = document.querySelectorAll(`[data-answer-id="${id}"]`);

			// Add the onClick event with the delay to each matching element
			elements.forEach((element) => {
				element.addEventListener(
					"click",
					handleClickWithDelay(item.redirectUrl, item.urlParams)
				);
			});
		});
	});
}

// Example usage
/* const data: DataItem[] = [
  {
    answerIds: ["wOOmYSd6wqUmhiG", "N03Jx4NM1HtTNoX", "HpKV5AJ1Hs7UPt3", "HE4O285MYuCbkM8"],
    urlParams: [["qz", "1"]],
    redirectUrl: "https://www.automaticpaymentpools.com/appp-vsl-v1g",
  },
]; */

// applyOnClickBehavior(data);

(function (w, d, s, l, i) {
	w[l] = w[l] || [];
	w[l].push({
		"gtm.start": new Date().getTime(),
		event: "gtm.js",
	});
	var f = d.getElementsByTagName(s)[0],
		j = d.createElement(s),
		dl = l != "dataLayer" ? "&l=" + l : "";
	j.async = true;
	j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
	f.parentNode.insertBefore(j, f);
})(window, document, "script", "dataLayer", "GTM-WW2PQ95");

// Handles redirects at later points in the funnel based on split_test_variation_name
export function handleRedirectSplitTest(
	pageDataLayer = {},
	{ control, challenger }
) {
	if (!control || !challenger) return;
	const current_variation_name = localStorage.getItem(
		"split_test_variation_name"
	);

	if (challenger?.split_test_variation_name === current_variation_name) {
		window.location.replace(challenger?.redirectLink);
	} else {
		window.dataLayer.push(pageDataLayer);
	}
}

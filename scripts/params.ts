declare global {
    interface Window {
        slForUrls: string;
        AnyTrack?: (key: string) => string | undefined;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const paramNames: string[] = [
        "utm_medium",
        "utm_source",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "fbclid",
        "gclid",
        "wbraid",
        "cid",
        "affiliate",
        "utm_id",
        "utm_click_id",
        "cid",
        "click_id",
        "contactId",
        "lpp",
        "ef_transaction_id"
    ];

    function getURLParameter(name: string): string | null {
        return new URLSearchParams(window.location.search).get(name);
    }

    const params: { [key: string]: string } = {};

    // Add all tracking parameters
    paramNames.forEach((name) => {
        const value = getURLParameter(name);
        if (value && value !== "null") {
            params[name] = value;
        }
    });

    if (window.slForUrls) {
        params.sl = window.slForUrls;
    }

    // If lpp is not set, set it to the current page URL
    if (!params.lpp) {
        // First check local storage for the "LandingPagePath" key
        const landingPagePath = localStorage.getItem("LandingPagePath");
        if (landingPagePath) {
            params.lpp = landingPagePath;
        } else {
            params.lpp = window.location.pathname.substring(1);
        }
    }

    function buildQueryString(): string {
        const queryParams = new URLSearchParams();
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                queryParams.append(key, params[key]);
            }
        }
        return queryParams.toString();
    }

    // Check for window.AnyTrack('atclid') every second for up to 10 seconds
    function updateLinks() {
        // Update anchor tags
        document.querySelectorAll("a").forEach((anchor) => {
            const href = anchor.getAttribute("href");
            if (href) {
                try {
                    const url = new URL(href, window.location.origin);
                    // Remove any existing utm_content
                    url.searchParams.delete("utm_content");
                    const queryString = buildQueryString();
                    if (queryString) {
                        const existingParams = url.searchParams;
                        const newParams = new URLSearchParams(queryString);
                        newParams.forEach((value, key) => {
                            existingParams.append(key, value);
                        });
                        url.search = existingParams.toString();
                    }
                    anchor.setAttribute("href", url.toString());
                } catch (e) {
                    console.error("Invalid URL:", href);
                }
            }
        });

        // Update image links
        document.querySelectorAll("img[data-imagelink]").forEach((img) => {
            const dl = img.getAttribute("data-imagelink");
            if (dl) {
                try {
                    const url = new URL(dl, window.location.origin);
                    // Remove any existing utm_content
                    url.searchParams.delete("utm_content");
                    const queryString = buildQueryString();
                    if (queryString) {
                        const existingParams = url.searchParams;
                        const newParams = new URLSearchParams(queryString);
                        newParams.forEach((value, key) => {
                            existingParams.append(key, value);
                        });
                        url.search = existingParams.toString();
                    }
                    img.setAttribute("data-imagelink", url.toString());
                } catch (e) {
                    console.error("Invalid URL:", dl);
                }
            }
        });
    }

    (function checkAnyTrackAtclid() {
        let attempts = 0;
        const maxAttempts = 10;
        const interval = setInterval(() => {
            attempts++;
            let shouldUpdate = false;
            if (typeof window.AnyTrack === 'function') {
                const atclid = window.AnyTrack('atclid');
                if (atclid) {
                    params.atclid = atclid;
                    shouldUpdate = true;
                    clearInterval(interval);
                }
            }
            if (attempts >= maxAttempts) {
                shouldUpdate = true;
                clearInterval(interval);
            }
            if (shouldUpdate) {
                updateLinks();
            }
        }, 1000);
    })();
});

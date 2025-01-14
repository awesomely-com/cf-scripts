declare global {
    interface Window {
        slForUrls: string;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const paramNames: string[] = [
        'utm_medium', 'utm_source', 'utm_campaign', 'utm_term', 'fbclid',
        'gclid', 'wbraid', 'cid', 'affiliate', 'utm_id', 'utm_click_id', 'cid', 'click_id'
    ];

    function getURLParameter(name: string): string | null {
        return new URLSearchParams(window.location.search).get(name);
    }

    const params: { [key: string]: string } = {};

    // Add all tracking parameters
    paramNames.forEach((name) => {
        const value = getURLParameter(name);
        if (value && value !== 'null') {
            params[name] = value;
        }
    });

    // Check for utm_content separately
    const utmContent = getURLParameter('utm_content');
    if (utmContent && utmContent !== 'null') {
        params['utm_content'] = utmContent;
    }

    if (window.slForUrls) {
        params.sl = window.slForUrls;
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

    // Update anchor tags
    document.querySelectorAll('a').forEach((anchor) => {
        const href = anchor.getAttribute('href');
        if (href) {
            try {
                const url = new URL(href, window.location.origin);
                // We no longer delete utm_content as we want to preserve it if it exists in the URL
                const queryString = buildQueryString();
                if (queryString) {
                    const existingParams = url.searchParams;
                    const newParams = new URLSearchParams(queryString);
                    newParams.forEach((value, key) => {
                        // If it's utm_content, only add it if there isn't one already
                        if (key === 'utm_content' && !existingParams.has('utm_content')) {
                            existingParams.append(key, value);
                        } else if (key !== 'utm_content') {
                            existingParams.append(key, value);
                        }
                    });
                    url.search = existingParams.toString();
                }
                anchor.setAttribute('href', url.toString());
            } catch (e) {
                console.error('Invalid URL:', href);
            }
        }
    });

    // Update image links
    document.querySelectorAll('img[data-imagelink]').forEach((img) => {
        const dl = img.getAttribute('data-imagelink');
        if (dl) {
            try {
                const url = new URL(dl, window.location.origin);
                // We no longer delete utm_content as we want to preserve it if it exists in the URL
                const queryString = buildQueryString();
                if (queryString) {
                    const existingParams = url.searchParams;
                    const newParams = new URLSearchParams(queryString);
                    newParams.forEach((value, key) => {
                        // If it's utm_content, only add it if there isn't one already
                        if (key === 'utm_content' && !existingParams.has('utm_content')) {
                            existingParams.append(key, value);
                        } else if (key !== 'utm_content') {
                            existingParams.append(key, value);
                        }
                    });
                    url.search = existingParams.toString();
                }
                img.setAttribute('data-imagelink', url.toString());
            } catch (e) {
                console.error('Invalid URL:', dl);
            }
        }
    });
});

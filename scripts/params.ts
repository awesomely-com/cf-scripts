document.addEventListener("DOMContentLoaded", () => {
    // Configuration for parameter names
    const paramNames: string[] = [
        'utm_medium', 'utm_source', 'utm_campaign', 'utm_term', 'fbclid',
        'gclid', 'wbraid', 'cid', 'affiliate'
    ];

    // Function to get URL parameters
    function getURLParameter(name: string): string | null {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    // Get all relevant URL parameters
    const params: { [key: string]: string } = {};

    paramNames.forEach((name) => {
        const value = getURLParameter(name);
        if (value && value !== 'null') {
            params[name] = value;
        }
    });

    // Function to build query string
    function buildQueryString(): string {
        const queryParams = new URLSearchParams();

        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                queryParams.append(key, params[key]);
            }
        }

        return queryParams.toString();
    }

    // Update all anchor tags
    const anchors = document.querySelectorAll('a');

    anchors.forEach((anchor) => {
        const href = anchor.getAttribute('href');
        if (href) {
            try {
                const url = new URL(href, window.location.origin);
                const queryString = buildQueryString();
                if (queryString) {
                    const existingParams = url.searchParams;
                    const newParams = new URLSearchParams(queryString);
                    newParams.forEach((value, key) => {
                        existingParams.append(key, value);
                    });
                    url.search = existingParams.toString();
                    anchor.setAttribute('href', url.toString());
                }
            } catch (e) {
                console.error('Invalid URL:', href);
            }
        }
    });

    // Update all img tags with data-imagelink attribute
    const images = document.querySelectorAll('img[data-imagelink]');

    images.forEach((img) => {
        const dl = img.getAttribute('data-imagelink');
        if (dl) {
            try {
                const url = new URL(dl, window.location.origin);
                const queryString = buildQueryString();
                if (queryString) {
                    const existingParams = url.searchParams;
                    const newParams = new URLSearchParams(queryString);
                    newParams.forEach((value, key) => {
                        existingParams.append(key, value);
                    });
                    url.search = existingParams.toString();
                    img.setAttribute('data-imagelink', url.toString());
                }
            } catch (e) {
                console.error('Invalid URL:', dl);
            }
        }
    });
});

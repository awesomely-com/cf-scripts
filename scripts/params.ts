declare global {
    interface Window {
        vslForUrls: string;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const paramNames: string[] = [
        'utm_medium', 'utm_source', 'utm_campaign', 'utm_term', 'fbclid',
        'gclid', 'wbraid', 'cid', 'affiliate'
    ];

    function getURLParameter(name: string): string | null {
        return new URLSearchParams(window.location.search).get(name);
    }

    const params: { [key: string]: string } = {};

    paramNames.forEach((name) => {
        const value = getURLParameter(name);
        if (value && value !== 'null') {
            params[name] = value;
        }
    });

    if (window.vslForUrls) {
        params.vsl = window.vslForUrls;
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

    document.querySelectorAll('a').forEach((anchor) => {
        const href = anchor.getAttribute('href');
        if (href) {
            try {
                const url = new URL(href, window.location.origin);
                // Remove utm_content if it exists
                url.searchParams.delete('utm_content');
                
                const queryString = buildQueryString();
                if (queryString) {
                    const existingParams = url.searchParams;
                    const newParams = new URLSearchParams(queryString);
                    newParams.forEach((value, key) => {
                        existingParams.append(key, value);
                    });
                    url.search = existingParams.toString();
                }
                anchor.setAttribute('href', url.toString());
            } catch (e) {
                console.error('Invalid URL:', href);
            }
        }
    });

    document.querySelectorAll('img[data-imagelink]').forEach((img) => {
        const dl = img.getAttribute('data-imagelink');
        if (dl) {
            try {
                const url = new URL(dl, window.location.origin);
                // Remove utm_content if it exists
                url.searchParams.delete('utm_content');
                
                const queryString = buildQueryString();
                if (queryString) {
                    const existingParams = url.searchParams;
                    const newParams = new URLSearchParams(queryString);
                    newParams.forEach((value, key) => {
                        existingParams.append(key, value);
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
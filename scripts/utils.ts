export const isBrowser =
  typeof document !== "undefined" && typeof window !== "undefined";

export function getUrlParameter(name: string): string {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  const regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  const results = regex.exec(window.location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

export function queryStringToJSON(): Record<string, string> {
  const pairs = window.location.search.substring(1).split("&");
  return pairs.reduce((result: Record<string, string>, pair) => {
    if (!pair) return result;
    const [key, value] = pair.split("=");
    result[decodeURIComponent(key)] = decodeURIComponent(value || "");
    return result;
  }, {});
}

export function getPageSlugFromUrl(): string {
  // Log the original URL components for debugging
  console.log("URL debugging:", {
    fullUrl: window.location.href,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  });

  let path = window.location.pathname.replace(/^\/|\/$/g, "");
  if (!path) return "home";

  const lastSegment = path.split("/").pop() || "";
  let slug = lastSegment
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  console.log("Generated page slug:", slug || "home");
  return slug || "home";
}

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export function setCookie(name: string, value: string, days: number): void {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + value + expires + "; path=/";
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function deepMerge<T extends { [key: string]: any }>(
  target: T,
  source: Partial<T>
): T {
  const output = { ...target } as { [key: string]: any };

  if (!source) return output as T;

  Object.keys(source).forEach((key) => {
    const targetValue = output[key];
    const sourceValue = source[key as keyof T];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      // Merge arrays by concatenating and removing duplicates
      output[key] = [...new Set([...targetValue, ...sourceValue])];
    } else if (
      typeof targetValue === "object" &&
      targetValue !== null &&
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      !Array.isArray(targetValue) &&
      !Array.isArray(sourceValue)
    ) {
      // Recursively merge nested objects
      output[key] = deepMerge(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      // For primitive values or when source value is explicitly set, override
      output[key] = sourceValue;
    }
  });

  return output as T;
}

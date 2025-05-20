// Import utilities from shared utils file
import {
  isBrowser,
  getUrlParameter,
  getPageSlugFromUrl,
  deepMerge,
} from "./utils";
import KeapClient from "./keap-client";

// Interface definitions
interface Selectors {
  acceptButton: string;
  acceptButton2: string;
  acceptButtonProduct2: string;
  rejectButton: string;
  paymentContainer: string;
}

interface SessionConfig {
  expirationHours: number;
  storageKey: string;
}

interface KeapOTOConfig {
  selectors: Selectors;
  sessionConfig: SessionConfig;
}

interface OrderSession {
  sessionKey: string;
  urlFriendlySessionKey: string;
  contactId: string;
  timestamp?: number;
}

interface OTOState {
  keapContactId: string | null;
  orderId: string | null;
  sessionKey: string | null;
  urlFriendlySessionKey: string | null;
  acceptUrl: string | null;
  rejectUrl: string | null;
  existingPaymentMethodId: string | null;
  stepProducts: any[] | null;
  primaryProductId: number | null;
  secondaryProductId: number | null;
  contactId: string | null;
}

interface APIResponse {
  is_duplicate?: boolean;
  step?: {
    next_step_url?: string;
    rejected_step_url?: string;
    products?: any[];
  };
  order?: {
    id?: number;
    session_key?: string;
    url_friendly_session_key?: string;
  };
  contact?: {
    id?: number;
    keap_contact_id?: number;
  };
  payment?: {
    payment_method_id?: string;
    keap_payment_method_id?: string;
  };
  next_step_url?: string;
}

declare global {
  interface Window {
    KeapOTOConfig?: Partial<KeapOTOConfig>;
  }
}

class KeapOTOHandler {
  private config: KeapOTOConfig;
  private state: OTOState;
  private initialized: boolean = false;
  private keapClient: KeapClient;

  // Default configuration
  static defaultConfig = {
    selectors: {
      acceptButton: "#tmp_button-11126-188", // Primary accept button ID
      acceptButton2: "#tmp_button-79590-119", // Secondary accept button ID for first product
      acceptButtonProduct2: "#product-2-button", // Accept button ID for second product (optional)
      rejectButton: "#link-94268", // Reject button ID
      paymentContainer: "#payment-container", // Container for payment form
    },
    sessionConfig: {
      expirationHours: 2,
      storageKey: "orderSession",
    },
  };

  constructor() {
    this.config = deepMerge(
      KeapOTOHandler.defaultConfig,
      window.KeapOTOConfig || {}
    );
    this.state = {
      keapContactId: null,
      orderId: null,
      sessionKey: null,
      urlFriendlySessionKey: null,
      acceptUrl: null,
      rejectUrl: null,
      existingPaymentMethodId: null,
      stepProducts: null,
      primaryProductId: null,
      secondaryProductId: null,
      contactId: null,
    };
    this.keapClient = new KeapClient();
  }

  init(): void {
    // Set a flag to track initialization
    this.initialized = false;

    if (isBrowser) {
      document.addEventListener("DOMContentLoaded", () => {
        // Check for session key from URL first, then fall back to storage
        this.checkSessionKey();

        // Set up event handlers for buttons
        this.setupButtonHandlers();

        // Mark as initialized after all setup is complete
        this.initialized = true;
      });
    } else {
      console.log(
        "Not running in browser environment. Initialization skipped."
      );
    }
  }

  // Session Management Methods
  private isSessionExpired(timestamp: number): boolean {
    const expirationTime =
      this.config.sessionConfig.expirationHours * 60 * 60 * 1000; // hours to milliseconds
    const currentTime = new Date().getTime();
    return currentTime - timestamp > expirationTime;
  }

  private deleteExpiredSessionData(): void {
    try {
      localStorage.removeItem(this.config.sessionConfig.storageKey);
      sessionStorage.removeItem(this.config.sessionConfig.storageKey);
      console.log("Deleted expired order session from storage");
    } catch (e) {
      console.warn("Failed to delete expired order session from storage", e);
    }
  }

  private getOrderSession(): OrderSession | null {
    let sessionData = null;

    try {
      // Try localStorage first
      const localData = localStorage.getItem(
        this.config.sessionConfig.storageKey
      );
      if (localData) {
        sessionData = JSON.parse(localData);
      }

      // If not in localStorage or expired, try sessionStorage
      if (!sessionData || this.isSessionExpired(sessionData.timestamp || 0)) {
        const sessionDataStr = sessionStorage.getItem(
          this.config.sessionConfig.storageKey
        );
        if (sessionDataStr) {
          sessionData = JSON.parse(sessionDataStr);
        }
      }

      // If session exists but is expired, delete it and return null
      if (sessionData && this.isSessionExpired(sessionData.timestamp || 0)) {
        console.log("Order session expired", sessionData);
        this.deleteExpiredSessionData();
        return null;
      }

      return sessionData;
    } catch (e) {
      console.warn("Failed to retrieve order session from storage", e);
      return null;
    }
  }

  private saveOrderSession(sessionData: OrderSession): void {
    const storageData = {
      ...sessionData,
      timestamp: new Date().getTime(),
    };

    try {
      localStorage.setItem(
        this.config.sessionConfig.storageKey,
        JSON.stringify(storageData)
      );
      sessionStorage.setItem(
        this.config.sessionConfig.storageKey,
        JSON.stringify(storageData)
      );
      console.log("Order session saved to storage", storageData);
    } catch (e) {
      console.warn("Failed to save order session to storage", e);
    }
  }

  private checkSessionKey(): void {
    // Get the session key from URL first, then fall back to storage
    const urlSessionKey = getUrlParameter("session_key");
    const storedSession = this.getOrderSession();

    // Determine which session key to use
    this.state.sessionKey =
      urlSessionKey || (storedSession ? storedSession.sessionKey : null);
    this.state.contactId = storedSession ? storedSession.contactId : null;

    if (!this.state.sessionKey) {
      console.error(
        "No session key found. Upsell page requires a session key."
      );
      alert("Session not found. Please return to the main order page.");
      return;
    }

    // Get the page slug from the URL
    const pageSlug = getPageSlugFromUrl();

    // Initialize page with step/product information
    this.fetchPageData(pageSlug);
  }

  private async fetchPageData(pageSlug: string): Promise<void> {
    try {
      // Create payload for starting payments API session
      const payload = {
        page_slug: pageSlug,
        session_key: this.state.sessionKey || "",
        tracking_data: {},
      };

      // Use KeapClient to start the payments API session
      try {
        const response = await this.keapClient.makeRequest<APIResponse>(
          "/start-payments-api-session",
          "POST",
          payload
        );

        console.log("API Response:", response);

        // Handle duplicate order case
        if (response.is_duplicate === true) {
          console.warn("Duplicate order detected");

          // Redirect to next step if available
          if (response.step && response.step.next_step_url) {
            const nextUrl = response.step.next_step_url;
            const sessionKeyParam =
              response.order?.url_friendly_session_key ||
              this.state.sessionKey ||
              "";

            setTimeout(() => {
              window.location.href = `${nextUrl}?session_key=${sessionKeyParam}`;
            }, 3000);
          }
          return;
        }

        // Store relevant data in state
        this.updateState(response);
      } catch (error: any) {
        // Handle session expiration and other API errors
        if (error.status === 400 && error.message === "Session has expired") {
          console.log("Received expired session error from API");
          this.deleteExpiredSessionData();
        }
        throw error; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error("API request failed:", error);
    }
  }

  private updateState(data: APIResponse): void {
    // Update state with data from API response
    if (data.contact && data.contact.id) {
      this.state.keapContactId = data.contact.id.toString();
    }

    if (data.order) {
      this.state.orderId = data.order.id?.toString() || null;
      this.state.sessionKey = data.order.session_key || null;
      this.state.urlFriendlySessionKey =
        data.order.url_friendly_session_key || null;
    }

    if (data.step) {
      this.state.acceptUrl = data.step.next_step_url || null;
      this.state.rejectUrl = data.step.rejected_step_url || null;
    }

    // Check if we have a payment method ID from a previous payment
    if (data.payment && data.payment.payment_method_id) {
      this.state.existingPaymentMethodId =
        data.payment.keap_payment_method_id || null;
      console.log(
        "Found existing payment method ID:",
        this.state.existingPaymentMethodId
      );
    }

    // Store step products
    if (data.step && data.step.products) {
      this.state.stepProducts = data.step.products;

      // Find the primary product to display (position = "primary")
      const primaryProduct = this.state.stepProducts?.find(
        (product) => product.position === "primary"
      );

      // Find the secondary product to display (position = "secondary")
      const secondaryProduct = this.state.stepProducts?.find(
        (product) => product.position === "secondary"
      );

      // Store the product IDs for later use
      this.state.primaryProductId = primaryProduct ? primaryProduct.id : null;
      this.state.secondaryProductId = secondaryProduct
        ? secondaryProduct.id
        : null;
    }
  }

  // Button Handler Methods
  private setupButtonHandlers(): void {
    // Handle primary Accept button
    const acceptButton = document.getElementById(
      this.config.selectors.acceptButton
    );
    if (acceptButton) {
      // Add an event listener to the first a tag that's a child of the accept div
      const acceptButtonLink = acceptButton.querySelector("a");
      if (acceptButtonLink instanceof HTMLElement) {
        acceptButtonLink.addEventListener("click", (e) => {
          e.preventDefault();
          this.disableButton(acceptButton, acceptButtonLink);
          this.handleAcceptClick();
        });
      } else {
        console.error(
          "Primary accept button link not found within:",
          this.config.selectors.acceptButton
        );
      }
    } else {
      console.error(
        "Primary accept button with ID",
        this.config.selectors.acceptButton,
        "not found"
      );
    }

    // Handle secondary Accept button
    const acceptButton2 = document.getElementById(
      this.config.selectors.acceptButton2
    );
    if (acceptButton2) {
      // Add an event listener to the first a tag that's a child of the accept div
      const acceptButtonLink2 = acceptButton2.querySelector("a");
      if (acceptButtonLink2 instanceof HTMLElement) {
        acceptButtonLink2.addEventListener("click", (e) => {
          e.preventDefault();
          this.disableButton(acceptButton2, acceptButtonLink2);
          this.handleAcceptClick();
        });
      } else {
        console.error(
          "Secondary accept button link not found within:",
          this.config.selectors.acceptButton2
        );
      }
    } else {
      console.warn(
        "Secondary accept button with ID",
        this.config.selectors.acceptButton2,
        "not found - this is optional"
      );
    }

    // Handle second product Accept button (if it exists)
    const acceptButtonProduct2 = document.getElementById(
      this.config.selectors.acceptButtonProduct2
    );
    if (acceptButtonProduct2) {
      // Add an event listener to the first a tag that's a child of the accept div
      const acceptButtonProduct2Link = acceptButtonProduct2.querySelector("a");
      if (acceptButtonProduct2Link instanceof HTMLElement) {
        acceptButtonProduct2Link.addEventListener("click", (e) => {
          e.preventDefault();
          this.disableButton(acceptButtonProduct2, acceptButtonProduct2Link);
          this.handleProduct2AcceptClick();
        });
      } else {
        console.error(
          "Second product accept button link not found within:",
          this.config.selectors.acceptButtonProduct2
        );
      }
    } else {
      console.warn(
        "Second product accept button with ID",
        this.config.selectors.acceptButtonProduct2,
        "not found - this is optional"
      );
    }

    // Handle Reject button
    const rejectButton = document.getElementById(
      this.config.selectors.rejectButton
    );
    if (rejectButton) {
      rejectButton.addEventListener("click", () => {
        this.handleRejectClick();
      });
    } else {
      console.error(
        "Reject button with ID",
        this.config.selectors.rejectButton,
        "not found"
      );
    }
  }

  private handleAcceptClick(): void {
    // Process payment for the primary product
    this.processPayment(this.state.primaryProductId);
  }

  private handleProduct2AcceptClick(): void {
    // Process payment for the secondary product
    this.processPayment(this.state.secondaryProductId);
  }

  private handleRejectClick(): void {
    // Redirect to the rejected URL
    const sessionKeyParam = `?session_key=${
      this.state.urlFriendlySessionKey || ""
    }`;

    if (this.state.rejectUrl) {
      window.location.href = this.state.rejectUrl + sessionKeyParam;
    } else {
      console.warn("No reject URL found");
      // Fall back to accept URL if reject URL is not available
      if (this.state.acceptUrl) {
        window.location.href = this.state.acceptUrl + sessionKeyParam;
      } else {
        alert(
          "Error: Could not determine the next page. Please contact support."
        );
      }
    }
  }

  // Payment Processing Methods
  private processPayment(productId: number | null): void {
    if (!productId) {
      console.error("No product ID provided for payment processing");
      return;
    }

    // If we already have a payment method from a previous order, use it directly
    if (this.state.existingPaymentMethodId) {
      console.log(
        "Using existing payment method ID:",
        this.state.existingPaymentMethodId
      );
      this.processPaymentWithMethodId(
        this.state.existingPaymentMethodId,
        productId
      );
      return;
    }

    // If we don't have a payment method ID, show an error
    console.error("No payment method ID found for this session");
  }

  private async processPaymentWithMethodId(
    paymentMethodId: string,
    productId: number | null
  ): Promise<void> {
    const pageSlug = getPageSlugFromUrl();
    const selectedProductIds: number[] = [];

    // Add the selected product ID to the array
    if (productId !== null) {
      selectedProductIds.push(productId);
    } else {
      // Fallback to primary product if no specific product ID was provided
      if (this.state.primaryProductId !== null) {
        selectedProductIds.push(this.state.primaryProductId);
      } else if (
        this.state.stepProducts &&
        Array.isArray(this.state.stepProducts) &&
        this.state.stepProducts.length > 0
      ) {
        // Last resort fallback
        selectedProductIds.push(this.state.stepProducts[0].id);
      }
    }

    if (selectedProductIds.length === 0) {
      console.error("No products found to add to the order");
      return;
    }

    // Get the affiliate ID if present in the URL
    const affiliateId = getUrlParameter("affiliate");

    // Create payload for the order
    const payload: any = {
      contact_id: this.state.keapContactId,
      payment_method_id: paymentMethodId,
      session_key: this.state.sessionKey,
      page_slug: pageSlug,
      product_ids: selectedProductIds,
    };

    // Add affiliate ID if present
    if (affiliateId) {
      payload.affiliate_id = affiliateId;
    }

    try {
      // Use KeapClient to create and charge the order
      try {
        const response = await this.keapClient.createOrder(payload);
        console.log("Order created:", response);

        // Create a session key parameter string to reuse
        const sessionKeyParam = `?session_key=${
          this.state.urlFriendlySessionKey || ""
        }`;

        // Handle duplicate order
        if (response.is_duplicate === true) {
          console.warn("Duplicate order detected");

          // Redirect to next step
          if (response.next_step_url) {
            setTimeout(() => {
              window.location.href = response.next_step_url + sessionKeyParam;
            }, 3000);
          } else if (response.step && response.step.next_step_url) {
            setTimeout(() => {
              window.location.href =
                response.step.next_step_url + sessionKeyParam;
            }, 3000);
          }
          return;
        }

        // Find the next step URL
        let nextStepUrl: string | null = null;

        // First check direct next_step_url
        if (response.next_step_url) {
          nextStepUrl = response.next_step_url;
        }
        // Then check if there's a step object with next_step_url
        else if (response.step && response.step.next_step_url) {
          nextStepUrl = response.step.next_step_url;
        }
        // Fallback to acceptUrl from earlier API call
        else if (this.state.acceptUrl) {
          nextStepUrl = this.state.acceptUrl;
        }

        // Redirect after a short delay
        if (nextStepUrl) {
          setTimeout(() => {
            window.location.href = nextStepUrl + sessionKeyParam;
          }, 3000);
        } else {
          console.warn("No next step URL found");
        }
      } catch (error: any) {
        // Handle session expiration and other API errors
        if (error.status === 400) {
          if (error.message === "Session expired") {
            console.log("Session expired during payment process");
            this.deleteExpiredSessionData();
          }
        }
        throw error; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error("API request failed:", error);
    }
  }

  // UI Helper Methods
  private disableButton(buttonDiv: HTMLElement, buttonLink: HTMLElement): void {
    // Find the span with class elButtonMain and change its text
    const buttonTextSpan = buttonLink.querySelector(".elButtonMain");
    if (buttonTextSpan instanceof HTMLElement) {
      // Store original text in a data attribute for future reference if needed
      buttonLink.dataset.originalText = buttonTextSpan.textContent || "";
      buttonTextSpan.textContent = "Processing...";
    }

    // Store original background color for future reference
    buttonLink.dataset.originalBgColor = buttonLink.style.background;

    // Change the button color to grey
    buttonLink.style.background = "rgba(200, 200, 200, 0.7)";

    // Disable the button - make it non-clickable
    buttonDiv.style.pointerEvents = "none";
    buttonLink.style.pointerEvents = "none";

    // Change appearance to look disabled
    buttonLink.style.opacity = "0.7";
    buttonLink.style.cursor = "default";

    // Add a class so we can identify it as disabled
    buttonLink.classList.add("disabled");
  }
}

// Initialize the handler only in browser environment
if (isBrowser) {
  const keapOTO = new KeapOTOHandler();
  keapOTO.init();
} else {
  console.log(
    "Keap OTO script loaded in non-browser environment. DOM manipulation skipped."
  );
}

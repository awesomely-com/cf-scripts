// Check if we're in a browser environment
import {
  isBrowser,
  getUrlParameter,
  getPageSlugFromUrl,
  formatPrice,
} from "./utils";
import KeapClient from "./keap-client";

import "./floating-labels";

// Main Keap Funnel Handler Class
interface ContactFormFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Messages {
  success: string;
  error: string;
  errorDetails: string;
  duplicate: string;
}

interface Selectors {
  submitButton: string;
  orderButton: string;
  paymentMethod: string;
  formFields: ContactFormFields;
  orderTotal: string;
  orderBump: string;
  bumpCheckbox: string;
  messages: Messages;
  elementsToHide: string[];
  elementsToDisable: string[];
  elementsToShowAfterSubmit: string[];
}

interface SessionConfig {
  expirationHours: number;
  storageKey: string;
}

interface KeapFunnelConfig {
  selectors: Selectors;
  sessionConfig: SessionConfig;
}

interface KeapFunnelState {
  keapContactId: string | null;
  orderId: string | null;
  sessionKey: string | null;
  urlFriendlySessionKey: string | null;
  stepProducts: Product[] | null;
}

interface OrderSession {
  sessionKey: string;
  urlFriendlySessionKey: string;
  contactId: string;
  timestamp?: number;
}

interface ContactInformationSubmitPayload {
  page_slug: string;
  opt_in: boolean;
  opt_in_reason: string;
  tracking_data: Record<string, string>;
  sales_awesomely_external_key: any;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  session_key?: string;
  affiliate_id?: string;
}

interface Product {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  price: string;
  position: ProductPosition;
  price_override: string | null;
  step_id: number;
}

type ProductPosition = "primary" | "bump";

interface Step {
  id: number;
  funnel_id: number;
  name: string;
  slug: string;
  description: string | null;
  step_type: string;
  next_step_url: string;
  rejected_step_url: string | null;
  created_at: string;
  updated_at: string;
  products: Product[];
}

interface Page {
  id: number;
  name: string;
  slug: string;
}

interface Order {
  id: number;
  step_id: number;
  page_id: number;
  total_amount: string;
  status: string;
  session_key: string;
  url_friendly_session_key: string;
}

interface Contact {
  id: number;
  keap_contact_id: number;
}

interface StartSessionResponse {
  is_duplicate?: boolean;
  message: string;
  contact: Contact;
  order: Order;
  page: Page;
  step: Step;
}

interface UpdateContactPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

declare global {
  interface Window {
    KeapFunnelConfig?: Partial<KeapFunnelConfig>;
  }
}

class KeapFunnelHandler {
  private config: KeapFunnelConfig;
  private state: KeapFunnelState;
  private initialized: boolean = false;
  private keapClient: KeapClient;
  private handlePaymentMessage: (event: MessageEvent) => Promise<void> =
    async () => {};
  private paymentResponseTimeout: ReturnType<typeof setTimeout> | null = null;

  // Default configuration
  static defaultConfig = {
    selectors: {
      submitButton: "#tmp_button-35872",
      orderButton: "#tmp_button-23692",
      paymentMethod: "#keap-payment-method",
      formFields: {
        firstName: "#tmp_input-36893 input",
        lastName: "#input-32758 input",
        email: "#input-13475 input",
        phone: "#input-72924 input",
      },
      orderTotal: "#tmp_customjs-87590",
      orderBump:
        ".orderFormBump .sectioncontent div, .orderFormBump .sectioncontent input#bump-offer",
      bumpCheckbox: "#bump-offer",
      messages: {
        success: "#payment-success-message",
        error: "#payment-error-message",
        errorDetails: "#payment-error-details",
        duplicate: "#duplicate-payment-message",
      },
      elementsToHide: [
        "#tmp_button-35872", // Submit button
      ],
      elementsToDisable: [
        "#tmp_input-36893", // First Name input
        "#input-32758", // Last Name input
        "#input-13475", // Email input
        "#input-72924", // Phone input
      ],
      elementsToShowAfterSubmit: [
        "#headline-93357", // Billing Information headline
        "#tmp_image-96949", // credit card logos
        "#tmp_orb-35379", // order bump
        // "#tmp_ors-61891", // Order Summary - hidden permanently in CSS
        "#tmp_customjs-87590", // Order Summary Total (custom JS)
        "#tmp_button-78442", // Primary Submit button
        "#tmp_button-23692", // Order button
        "#img-11614", // secure checkout image
        "#headline-20568", // disclaimer headline
      ],
    },
    sessionConfig: {
      expirationHours: 2,
      storageKey: "orderSession",
    },
  };

  constructor() {
    this.config = {
      ...KeapFunnelHandler.defaultConfig,
      ...(window.KeapFunnelConfig || {}),
    } as KeapFunnelConfig;
    this.state = {
      keapContactId: null,
      orderId: null,
      sessionKey: null,
      urlFriendlySessionKey: null,
      stepProducts: null,
    };
    this.keapClient = new KeapClient();
  }

  init(): void {
    // Set a flag to track initialization
    this.initialized = false;

    document.addEventListener("DOMContentLoaded", () => {
      // First check for contact ID or session key in URL
      this.checkUrlSessionKey();

      // Show submit button if no contact ID is present (do this right after checking URL)
      this.showSubmitButtonIfNeeded();

      // Set up event listeners (submit button only if needed)
      this.setupEventListeners();

      // Hide elements until submission
      this.hideElementsUntilSubmission();

      // Mark as initialized after all setup is complete
      this.initialized = true;

      // Start or resume session based on contact ID or form data
      this.handleExistingSession();
    });
  }

  setupEventListeners(): void {
    this.setupOrderBumpListeners();

    // Only set up the submit button listener if we don't have a contact ID
    // This is for backward compatibility with the old flow
    if (!this.ensureContactId()) {
      this.setupSubmitButtonListener();
    }

    this.setupOrderButtonListener();
  }

  // Utility Methods
  // Session Management
  isSessionExpired(timestamp: number): boolean {
    const expirationTime =
      this.config.sessionConfig.expirationHours * 60 * 60 * 1000;
    return new Date().getTime() - timestamp > expirationTime;
  }

  saveOrderSession(sessionData: OrderSession): void {
    console.log("Saving order session to storage:", sessionData);
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
      console.log("Successfully saved session data");
    } catch (e) {
      console.warn("Failed to save order session to storage", e);
    }
  }

  getOrderSession(): any {
    // Just check if the form fields are populated
    const formData = this.getFormData();
    if (formData.firstName && formData.lastName && formData.email) {
      return formData;
    }
    return null;
  }

  deleteExpiredSessionData(): void {
    console.log("Deleting expired session data");
    try {
      localStorage.removeItem(this.config.sessionConfig.storageKey);
      sessionStorage.removeItem(this.config.sessionConfig.storageKey);
      console.log("Successfully deleted expired session data");
    } catch (e) {
      console.warn("Failed to delete expired session from storage", e);
    }
  }

  // Event Handlers
  setupOrderBumpListeners(): void {
    console.log("Setting up order bump listeners");

    // Instead of setting up click listeners on all elements, just listen for changes on the checkbox
    const bumpCheckbox = document.querySelector(
      this.config.selectors.bumpCheckbox
    ) as HTMLInputElement | null;

    if (bumpCheckbox) {
      console.log("Found bump checkbox, setting up change listener");

      // We don't need to toggle the checkbox, just listen for changes
      bumpCheckbox.addEventListener("change", (e) => {
        console.log(`Bump checkbox changed to: ${bumpCheckbox.checked}`);

        // Trigger a custom event that our product display can listen for
        const customEvent = new CustomEvent("bump-checkbox-changed", {
          detail: { checked: bumpCheckbox.checked },
          bubbles: true,
        });
        bumpCheckbox.dispatchEvent(customEvent);
      });
    } else {
      console.warn(
        "Bump checkbox not found:",
        this.config.selectors.bumpCheckbox
      );
    }
  }

  setupSubmitButtonListener(): void {
    console.log("Setting up submit button listener (legacy flow)");
    const submitButton = document.querySelector(
      this.config.selectors.submitButton
    );
    if (submitButton) {
      submitButton.addEventListener("click", (event) => {
        // Prevent the default form submission behavior
        event.preventDefault();
        this.handleContactInformationSubmit();
      });
    } else {
      console.warn("Submit button not found for legacy flow");
    }
  }

  setupOrderButtonListener(): void {
    const orderButton = document.querySelector(
      this.config.selectors.orderButton
    );
    if (orderButton instanceof HTMLElement) {
      orderButton.style.marginTop = "0";
      orderButton.style.marginBottom = "30px";
      orderButton.addEventListener("click", (event) => {
        // Prevent the default form submission behavior
        event.preventDefault();
        this.handleOrder();
      });
    }
  }

  // Button state management
  setButtonState(
    button: HTMLElement | null,
    isDisabled: boolean,
    text?: string
  ): void {
    console.log("Setting button state:", {
      button,
      isDisabled,
      text,
    });
    if (!button) return;

    const buttonLink = button.querySelector(".elButton") as HTMLElement | null;
    const buttonText = button.querySelector(
      ".elButtonMain"
    ) as HTMLElement | null;
    if (!buttonLink || !buttonText) return;

    if (isDisabled) {
      // Add data attribute to indicate submitting state
      button.dataset.state = "submitting";
      // Disable button
      button.style.pointerEvents = "none";
      buttonLink.style.setProperty("background-image", "none", "important");
      buttonLink.style.setProperty("background-color", "rgb(224, 224, 224)");
      buttonText.textContent = text || "Processing...";
    } else {
      // Reset data attribute
      button.dataset.state = "ready";
      // Restore original state
      button.style.pointerEvents = "auto";
      buttonLink.style.removeProperty("background-image");
      buttonLink.style.removeProperty("background-color");
      buttonText.textContent = text || "Continue";
    }
  }

  async handleContactInformationSubmit(): Promise<void> {
    console.log(
      "Handling contact information submission (can be triggered by button or directly)"
    );
    const submitButton = document.querySelector(
      this.config.selectors.submitButton
    ) as HTMLElement | null;

    // Update button state if it exists
    if (submitButton) {
      this.setButtonState(submitButton, true, "Processing...");
    }

    try {
      // Check if we have a contact_id already
      const contactId = this.ensureContactId();

      // If we have a contact_id, we can use a simplified session start
      if (contactId) {
        console.log(
          "Using contact_id for simplified session start:",
          contactId
        );
        try {
          const pageSlug = getPageSlugFromUrl();
          // This is all we need - contact ID and page slug
          const response = await this.keapClient.startSimpleSession(
            contactId,
            pageSlug
          );
          await this.handleContactInformationSubmitResponse(response);
          return;
        } catch (error) {
          console.warn(
            "Failed to start session with contact_id, falling back to standard flow:",
            error
          );
          // Continue with standard flow
        }
      }

      // Legacy flow - only used if no contact ID is available
      // Get form data for standard flow
      const formData = this.getFormData();
      console.log("Form data collected:", formData);

      // Validate required fields for starting a session (phone is not required here)
      if (!formData.firstName || !formData.lastName || !formData.email) {
        const missingFields = [];
        if (!formData.firstName) missingFields.push("First Name");
        if (!formData.lastName) missingFields.push("Last Name");
        if (!formData.email) missingFields.push("Email");

        const errorMessage = `Please fill in all required fields: ${missingFields.join(
          ", "
        )}`;
        console.error(errorMessage);

        // Show alert and reset button if it exists
        alert(errorMessage);
        if (submitButton) {
          this.setButtonState(submitButton, false, "Submit");
        }
        return;
      }

      // Get affiliate ID
      const affiliateId = getUrlParameter("affiliate") || undefined;

      // Standard flow - Create payload using the KeapClient
      const payload = this.keapClient.createContactInformationPayload(
        formData,
        this.state.sessionKey || undefined,
        this.getSalesAwesomelyExternalKey(),
        affiliateId
      );

      console.log("Submit payload created:", payload);

      // Call the API using the KeapClient
      const response = await this.keapClient.startSession(payload);

      await this.handleContactInformationSubmitResponse(response);
    } catch (error) {
      console.error("Submit failed:", error);
      alert(
        "There was an error processing your request. Please try again or contact support."
      );

      // Reset button if it exists
      if (submitButton) {
        this.setButtonState(submitButton, false, "Submit");
      }
    }
  }

  // Helper method to get contact_id from URL parameters
  getContactIdFromUrl(): string | null {
    const contactId = getUrlParameter("contactId");
    if (contactId) {
      console.log("Found contact_id in URL parameters:", contactId);
      return contactId;
    }
    return null;
  }

  getFormData(): {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } {
    const selectors = this.config.selectors.formFields;
    return {
      firstName:
        (document.querySelector(selectors.firstName) as HTMLInputElement)
          ?.value || "",
      lastName:
        (document.querySelector(selectors.lastName) as HTMLInputElement)
          ?.value || "",
      email:
        (document.querySelector(selectors.email) as HTMLInputElement)?.value ||
        "",
      phone:
        (document.querySelector(selectors.phone) as HTMLInputElement)?.value ||
        "",
    };
  }

  async handleContactInformationSubmitResponse(
    response: StartSessionResponse
  ): Promise<void> {
    if (response.is_duplicate) {
      this.handleDuplicateOrder(response);
      return;
    }

    this.updateState(response);
    this.saveOrderSession({
      sessionKey: this.state.sessionKey || "",
      urlFriendlySessionKey: this.state.urlFriendlySessionKey || "",
      contactId: this.state.keapContactId || "",
    });

    // The contact data is already in the response
    console.log("Session response received:", response);

    // Populate form fields with contact data from the response
    if (response.contact) {
      console.log("Populating form fields with contact data from response");
      this.populateFormFields(response.contact);
    }

    // Update product display with products from response
    if (response.step?.products && response.step.products.length > 0) {
      console.log(
        "Updating product display with products from response:",
        response.step.products
      );
      this.updateProductDisplay(response.step.products);
    } else {
      console.warn("No products found in response");
    }

    this.showElementsAfterSubmission();
    this.setupPaymentMethod();
    this.disableFormElements();
  }

  updateState(response: StartSessionResponse): void {
    // Handle both API responses and direct session data
    if (response.contact && response.order) {
      // Handle API response format
      this.state = {
        keapContactId: response.contact.keap_contact_id.toString(),
        orderId: response.order.id.toString(),
        sessionKey: response.order.session_key,
        urlFriendlySessionKey: response.order.url_friendly_session_key,
        stepProducts: response.step?.products || [],
      };

      console.log("Updated state with API response:", this.state);
    } else if (
      response.contact?.keap_contact_id &&
      response.order?.session_key
    ) {
      // Handle partial response format (simplified session start)
      this.state = {
        ...this.state,
        keapContactId: response.contact.keap_contact_id.toString(),
        sessionKey: response.order.session_key,
        urlFriendlySessionKey:
          response.order.url_friendly_session_key ||
          this.state.urlFriendlySessionKey,
        orderId: response.order.id?.toString() || this.state.orderId,
        stepProducts: response.step?.products || this.state.stepProducts,
      };

      console.log(
        "Updated state with simplified session response:",
        this.state
      );
    } else {
      // Handle direct session data format
      this.state = {
        ...this.state,
        keapContactId:
          response.contact?.keap_contact_id?.toString() ||
          this.state.keapContactId,
        sessionKey: response.order?.session_key || this.state.sessionKey,
        urlFriendlySessionKey:
          response.order?.url_friendly_session_key ||
          this.state.urlFriendlySessionKey,
      };

      console.log("Updated state with direct session data:", this.state);
    }
  }

  setupPaymentMethod(): void {
    const paymentMethod = document.querySelector(
      this.config.selectors.paymentMethod
    );
    if (paymentMethod) {
      paymentMethod.setAttribute("key", this.state.sessionKey || "");
      this.loadPaymentScript();
    }
  }

  loadPaymentScript(): void {
    const script = document.createElement("script");
    script.src = "https://payments.keap.page/lib/payment-method-embed.js";
    document.body.appendChild(script);
    this.setupIframePolling();
  }

  setupIframePolling(): void {
    const intervalId = setInterval(() => {
      const keapElement = document.querySelector(
        this.config.selectors.paymentMethod
      );
      if (keapElement?.shadowRoot) {
        const iframe = keapElement.shadowRoot.querySelector(
          "iframe#payment-method-iframe"
        ) as HTMLIFrameElement | null;
        const style = document.createElement("style");
        style.textContent = `
          #payment-method-iframe {
            width: var(--payment-method-iframe-width);
            margin: var(--payment-method-iframe-margin);
          }
        `;
        keapElement.shadowRoot.appendChild(style);
        if (iframe) {
          clearInterval(intervalId);
          const orderButton = document.querySelector(
            this.config.selectors.orderButton
          );
          if (orderButton instanceof HTMLElement) {
            orderButton.style.display = "block";
          }
        }
      }
    }, 100);
  }

  disableFormElements(): void {
    // Don't hide the submit button if there's no contact ID
    const contactId = this.ensureContactId();

    // Hide elements that should be hidden
    if (this.config.selectors.elementsToHide) {
      this.config.selectors.elementsToHide.forEach((selector: string) => {
        // Skip hiding the submit button if there's no contact ID
        if (!contactId && selector === this.config.selectors.submitButton) {
          console.log(
            "Skipping hiding submit button since no contact ID is present"
          );
          return;
        }

        const element = document.querySelector(selector);
        if (element instanceof HTMLElement) {
          element.style.display = "none";
        }
      });
    }
  }

  async checkUrlSessionKey() {
    // First check for contact_id in URL
    const contactId = this.getContactIdFromUrl();
    if (contactId) {
      console.log("Found contact_id in URL, storing for later use:", contactId);
      this.state.keapContactId = contactId;

      // We'll let handleExistingSession handle starting the session with this contact ID
      // It will be called after initialization is complete
    } else {
      console.log("No contact_id found in URL parameters");
    }

    // Then check for session_key in URL
    const sessionKey = getUrlParameter("session_key");
    if (!sessionKey) {
      console.log("No session_key found in URL parameters");
      return;
    }

    console.log("Found session key in URL:", sessionKey);

    try {
      // Use the KeapClient to check session validity
      const data = await this.keapClient.checkSessionValidity(sessionKey);

      if (data.expired) {
        console.log("Session key in URL is expired");
        this.deleteExpiredSessionData();
        this.removeSessionKeyFromUrl();
      } else if (data.valid) {
        console.log("Session key in URL is valid");
        this.saveOrderSession({
          sessionKey: data.session_key || "",
          urlFriendlySessionKey: data.url_friendly_session_key || "",
          contactId: data.contact_id || contactId || "",
        });

        // If we got a contact_id from the session validity check, store it
        if (data.contact_id) {
          console.log(
            "Got contact_id from session validity check:",
            data.contact_id
          );
          this.state.keapContactId = data.contact_id;
        }
      }
    } catch (error) {
      console.warn("Error checking session validity:", error);
      const existingSession = this.getOrderSession();
      if (
        existingSession &&
        existingSession.sessionKey === sessionKey &&
        this.isSessionExpired(existingSession.timestamp)
      ) {
        this.deleteExpiredSessionData();
      }
    }
  }

  removeSessionKeyFromUrl() {
    if (window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete("session_key");
      window.history.replaceState({}, document.title, url.toString());
    }
  }

  async handleExistingSession(): Promise<void> {
    // Check if we have a contact ID
    const contactId = this.ensureContactId();
    if (contactId) {
      console.log("Found contact ID, starting session directly:", contactId);
      try {
        const pageSlug = getPageSlugFromUrl();
        const response = await this.keapClient.startSimpleSession(
          contactId,
          pageSlug
        );

        // After starting the session, handle the response which will populate form fields
        await this.handleContactInformationSubmitResponse(response);
        return;
      } catch (error) {
        console.warn("Failed to start session with contact ID:", error);
      }
    }

    // Only fall back to form-based approach if we're supporting legacy flow
    // This is no longer the primary path - we prefer contact ID
    console.log("No contact ID found, legacy form-based approach not needed");
  }

  handleDuplicateOrder(response: any): void {
    console.warn("Duplicate order detected");
    const duplicateMessage = document.querySelector(
      this.config.selectors.messages.duplicate
    ) as HTMLElement | null;

    if (duplicateMessage) {
      duplicateMessage.style.display = "block";
    } else {
      alert(
        "You have already completed this order. Please continue to the next step."
      );
    }

    if (response.step?.next_step_url) {
      setTimeout(() => {
        window.location.href =
          response.step.next_step_url +
          "?session_key=" +
          (this.state.urlFriendlySessionKey || "");
      }, 3000);
    }
  }

  /**
   * Ensures we have a contact ID from state or URL
   * @returns The contact ID or null if not found
   */
  ensureContactId(): string | null {
    // First check if we already have it in state
    if (this.state.keapContactId) {
      return this.state.keapContactId;
    }

    // Then check if it's in the URL
    const contactId = this.getContactIdFromUrl();
    if (contactId) {
      // Store it in state for future use
      this.state.keapContactId = contactId;
      return contactId;
    }

    return null;
  }

  /**
   * Handles the order submission. This handles three operations at once:
   * 1. Updates the contact information
   * 2. Saves the payment method
   * 3. Creates the order
   *
   * Afterwards, it redirects to the next step.
   * @returns void
   */
  async handleOrder(): Promise<void> {
    console.log("Handling order submission");
    const orderButton = document.querySelector(
      this.config.selectors.orderButton
    ) as HTMLElement | null;
    this.setButtonState(orderButton, true);

    try {
      // 1. Update contact information if needed
      const formData = this.getFormData();

      // Validate contact information
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.phone
      ) {
        const missingFields = [];
        if (!formData.firstName) missingFields.push("First Name");
        if (!formData.lastName) missingFields.push("Last Name");
        if (!formData.email) missingFields.push("Email");
        if (!formData.phone) missingFields.push("Phone Number");

        const errorMessage = `Please fill in all required fields: ${missingFields.join(
          ", "
        )}`;
        console.error(errorMessage);
        this.handleOrderError(new Error(errorMessage), orderButton);
        return;
      }

      // Get contact ID from state or URL
      const contactId = this.ensureContactId();

      // Contact update is required - if we don't have a contact ID, we can't proceed
      if (!contactId) {
        const errorMessage =
          "Contact information is missing. Please refresh the page and try again.";
        console.error(errorMessage);
        this.handleOrderError(new Error(errorMessage), orderButton);
        return;
      }

      // Update contact information - this is a critical step
      console.log("Updating contact information for ID:", contactId);
      const contactUpdatePayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      };

      try {
        await this.keapClient.updateContact(contactId, contactUpdatePayload);
        console.log("Contact information updated successfully");
      } catch (contactUpdateError) {
        console.error(
          "Failed to update contact information:",
          contactUpdateError
        );
        // This is now a critical error that should block the order
        const errorMessage =
          "Failed to update contact information. Please try again.";
        this.handleOrderError(new Error(errorMessage), orderButton);
        return;
      }

      // Get selected products
      const selectedProductIds = this.getSelectedProducts();
      if (selectedProductIds.length === 0) {
        console.error("No products found to add to the order");
        this.handleOrderError(
          new Error(
            "No products found to add to the order. Please refresh the page and try again."
          ),
          orderButton
        );
        return;
      }

      console.log("Selected product IDs:", selectedProductIds);

      // 2. Set up the message handler before submitting the payment method
      this.setupPaymentMessageHandler(selectedProductIds, orderButton);

      // Submit the payment method (step 2 in documentation)
      const keapPaymentMethod = document.querySelector(
        this.config.selectors.paymentMethod
      ) as any;

      if (!keapPaymentMethod) {
        this.handleOrderError(
          new Error(
            "Payment method element not found. Please refresh the page and try again."
          ),
          orderButton
        );
        return;
      }

      if (!keapPaymentMethod.submit) {
        this.handleOrderError(
          new Error(
            "Payment method is not ready. Please refresh the page and try again."
          ),
          orderButton
        );
        return;
      }

      // Listen for errors from the payment iframe
      window.addEventListener(
        "error",
        (event) => {
          if (
            event.message &&
            event.message.includes("[Keap Payments] Error")
          ) {
            console.error("Payment method error:", event.message);
            this.handleOrderError(
              new Error(event.message.replace("[Keap Payments] Error: ", "")),
              orderButton
            );
          }
        },
        { once: true }
      );

      // Set a timeout to restore the button if no response is received
      if (this.paymentResponseTimeout) {
        clearTimeout(this.paymentResponseTimeout);
      }

      this.paymentResponseTimeout = setTimeout(() => {
        console.warn(
          "No payment response received after 5 seconds, restoring order button"
        );
        this.handleOrderError(
          new Error(
            "There was an error saving your payment method. Please check your payment details and try again."
          ),
          orderButton
        );
      }, 5000);

      console.log("Submitting payment method");
      keapPaymentMethod.submit();
      // Note: The payment method submission will trigger the message handler,
      // which will handle step 3 (creating the order) asynchronously
    } catch (error) {
      console.error("Order submission failed:", error);
      this.handleOrderError(error, orderButton);
    }
  }

  getSelectedProducts(): number[] {
    const selectedProductIds: number[] = [];

    if (this.state.stepProducts?.length) {
      // Always include the primary product
      const primaryProduct = this.state.stepProducts.find(
        (product: Product) => product?.position === "primary"
      );

      if (primaryProduct) {
        selectedProductIds.push(primaryProduct.id);
      } else if (this.state.stepProducts.length > 0) {
        // If no primary product, use the first product
        selectedProductIds.push(this.state.stepProducts[0].id);
      }

      // Check if bump product should be included
      const bumpProduct = this.state.stepProducts.find(
        (product: Product) => product?.position === "bump"
      );

      if (bumpProduct) {
        const bumpCheckbox = document.querySelector(
          "#bump-offer"
        ) as HTMLInputElement | null;
        if (bumpCheckbox?.checked) {
          console.log("Including bump product in order:", bumpProduct.id);
          selectedProductIds.push(bumpProduct.id);
        }
      }
    } else {
      // Fallback to looking for product-item elements
      const productItems = document.querySelectorAll(".product-item");
      let foundPrimary = false;

      productItems.forEach((item) => {
        if (
          item instanceof HTMLElement &&
          item.dataset.position === "primary" &&
          !foundPrimary &&
          item.dataset.productId
        ) {
          selectedProductIds.push(parseInt(item.dataset.productId));
          foundPrimary = true;
        }
      });

      if (selectedProductIds.length === 0 && productItems.length > 0) {
        const firstProduct = productItems[0];
        if (
          firstProduct instanceof HTMLElement &&
          firstProduct.dataset.productId &&
          !isNaN(parseInt(firstProduct.dataset.productId))
        ) {
          selectedProductIds.push(parseInt(firstProduct.dataset.productId));
        }
      }
    }

    console.log("Selected product IDs:", selectedProductIds);
    return selectedProductIds;
  }

  setupPaymentMessageHandler(
    selectedProductIds: number[],
    orderButton: HTMLElement | null
  ): void {
    console.log("Setting up payment message handler");

    // Remove any existing message listeners to prevent duplicates
    window.removeEventListener("message", this.handlePaymentMessage);

    // Create a handler function that we can reference for removal later
    this.handlePaymentMessage = async (event: MessageEvent) => {
      const data = event.data;

      // Check if this is a payment method message
      if (!data || typeof data !== "object" || !("success" in data)) {
        // Not a payment method message, ignore it
        return;
      }

      console.log("Payment message received:", data);

      // Clear the timeout since we received a response
      if (this.paymentResponseTimeout) {
        clearTimeout(this.paymentResponseTimeout);
        this.paymentResponseTimeout = null;
      }

      if (!data.success) {
        console.error("Payment method submission failed:", data);
        const errorMessage =
          data.error ||
          "Payment method submission failed. Please check your payment details and try again.";
        this.handleOrderError(new Error(errorMessage), orderButton);
        return;
      }

      // Remove the message listener to prevent multiple submissions
      window.removeEventListener("message", this.handlePaymentMessage);

      try {
        // Get affiliate ID
        const affiliateId = getUrlParameter("affiliate") || undefined;

        // Ensure we have a contact ID
        const contactId = this.ensureContactId();
        if (!contactId) {
          throw new Error(
            "Contact ID is missing. Please refresh the page and try again."
          );
        }

        const payload = {
          contact_id: contactId,
          payment_method_id: data.paymentMethodId,
          session_key:
            this.state.sessionKey || this.state.urlFriendlySessionKey || "",
          page_slug: getPageSlugFromUrl(),
          product_ids: selectedProductIds,
          affiliate_id: affiliateId,
        };

        console.log("Creating order with payload:", payload);

        // Use the KeapClient to create the order
        const response = await this.keapClient.createOrder(payload);

        await this.handleOrderResponse(response);
      } catch (error) {
        this.handleOrderError(error, orderButton);
      }
    };

    // Add the message listener
    window.addEventListener("message", this.handlePaymentMessage);
  }

  async handleOrderResponse(response: any): Promise<void> {
    console.log("Order creation response:", response);

    if (response.is_duplicate) {
      console.warn("Duplicate order detected:", response);
      this.handleDuplicateOrder(response);
      return;
    }

    const successMessage = document.querySelector(
      this.config.selectors.messages.success
    ) as HTMLElement | null;
    if (successMessage) {
      console.log("Showing success message");
      successMessage.style.display = "block";
    }

    if (response.step?.next_step_url) {
      console.log("Redirecting to next step:", response.step.next_step_url);
      setTimeout(() => {
        window.location.href =
          response.step.next_step_url +
          "?session_key=" +
          (this.state.urlFriendlySessionKey || "");
      }, 3000);
    } else {
      console.warn("No next step URL found in response:", response);
    }
  }

  handleOrderError(error: any, orderButton: HTMLElement | null): void {
    console.error("Order creation failed:", error);

    // Clear any existing timeout
    if (this.paymentResponseTimeout) {
      clearTimeout(this.paymentResponseTimeout);
      this.paymentResponseTimeout = null;
    }

    const errorMessage = document.querySelector(
      this.config.selectors.messages.error
    ) as HTMLElement | null;
    const errorDetails = document.querySelector(
      this.config.selectors.messages.errorDetails
    ) as HTMLElement | null;

    if (errorMessage) {
      console.log("Showing error message");
      errorMessage.style.display = "block";
    }

    if (errorDetails) {
      errorDetails.textContent = error.message || "Unknown error";
    } else {
      // If no error details element is found, show an alert
      alert(
        error.message || "An error occurred during checkout. Please try again."
      );
    }

    // Always reset the button state
    this.setButtonState(orderButton, false);
  }

  // ClickFunnels session methods
  getFunnelIdFromSession(): string | null {
    const storageKey = "clickfunnelsPurchaseSessions";
    let sessionData = this.getStorageData(storageKey);

    if (sessionData?.length > 0) {
      return sessionData[0].funnelId;
    }

    console.warn("No funnel ID found in session data");
    return null;
  }

  getSalesAwesomelyExternalKey(): any {
    const storageKey = "clickfunnelsPurchaseSessions";
    return this.getStorageData(storageKey);
  }

  getStorageData(key: string): any {
    console.log("Attempting to retrieve storage data for key:", key);
    try {
      const localData = localStorage.getItem(key);
      if (localData) {
        const parsed = JSON.parse(localData);
        console.log("Found data in localStorage:", parsed);
        return parsed;
      }
    } catch (e) {
      console.warn("Error accessing localStorage:", e);
    }

    try {
      const sessionData = sessionStorage.getItem(key);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        console.log("Found data in sessionStorage:", parsed);
        return parsed;
      }
    } catch (e) {
      console.warn("Error accessing sessionStorage:", e);
    }

    console.log("No storage data found for key:", key);
    return null;
  }

  hideFormElements(): void {
    // For backward compatibility, call the new method
    this.disableFormElements();
  }

  // Hide elements that should only be shown after form submission
  hideElementsUntilSubmission(): void {
    // Hide elements that should be shown after submission
    if (this.config.selectors.elementsToShowAfterSubmit) {
      this.config.selectors.elementsToShowAfterSubmit.forEach(
        (selector: string) => {
          const element = document.querySelector(selector);
          if (element) {
            // Add a class that can be targeted with CSS
            element.classList.add("hidden-until-submission");
          }
        }
      );
    }
  }

  // Show elements that were hidden until submission
  showElementsAfterSubmission(): void {
    if (this.config.selectors.elementsToShowAfterSubmit) {
      this.config.selectors.elementsToShowAfterSubmit.forEach(
        (selector: string) => {
          const element = document.querySelector(selector);
          if (element) {
            element.classList.remove("hidden-until-submission");
            element.classList.add("shown-after-submission");
          }
        }
      );
    }
  }

  // Add new method to update product display
  updateProductDisplay(products: Product[]): void {
    if (!isBrowser) return;

    console.log("Updating product display with products:", products);

    // Find the original product container
    const originalContainer = document.querySelector(
      "#tmp_ors-61891"
    ) as HTMLElement | null;
    if (!originalContainer) {
      console.warn("Original product container not found");
      return;
    }

    // Check if our custom container already exists
    let customContainer = document.querySelector(
      "#custom-product-display"
    ) as HTMLElement | null;

    // If it doesn't exist, create it
    if (!customContainer) {
      // Hide the original container
      originalContainer.style.display = "none";

      // Create our custom container
      customContainer = document.createElement("div");
      customContainer.id = "custom-product-display";
      customContainer.className =
        "de clearfix elOrderProductOptionsWrapper elMargin0";
      customContainer.style.marginTop = "30px";

      // Add the header
      customContainer.innerHTML = `
        <div class="elOrderProductOptions">
          <div class="clearfix elOrderProductOptinLabel">
            <div class="pull-left elOrderProductOptinItem">Item</div>
            <div class="pull-right elOrderProductOptinLabelPrice">Amount</div>
          </div>
          <div id="custom-products-list"></div>
        </div>
      `;

      // Insert after the original container
      originalContainer.parentNode?.insertBefore(
        customContainer,
        originalContainer.nextSibling
      );
    }

    // Get the products list container
    const productsList = document.querySelector("#custom-products-list");
    if (!productsList) {
      console.warn("Custom products list container not found");
      return;
    }

    // Clear existing products
    productsList.innerHTML = "";

    // Sort products to show primary first
    const sortedProducts = [...products].sort((a, b) => {
      if (a.position === "primary") return -1;
      if (b.position === "primary") return 1;
      return 0;
    });

    // Add primary product (always shown)
    const primaryProduct = sortedProducts.find(
      (product) => product.position === "primary"
    );
    if (primaryProduct) {
      const primaryPrice = parseFloat(primaryProduct.price);

      const primaryProductHTML = `
        <div class="clearfix elOrderProductOptinProducts">
          <div class="pull-left elOrderProductOptinProductName product-name" style="width: inherit;">
            ${primaryProduct.display_name}
          </div>
          <div class="pull-right elOrderProductOptinPrice product-price">
            ${formatPrice(primaryPrice)}
          </div>
        </div>
      `;
      productsList.innerHTML += primaryProductHTML;
    }

    // Add bump product if exists and checkbox is checked
    const bumpProduct = sortedProducts.find(
      (product) => product.position === "bump"
    );

    if (bumpProduct) {
      // Create a function to update the display based on checkbox state
      const updateBumpDisplay = (isChecked: boolean) => {
        const existingBumpElement = document.querySelector(".bump-product");
        const primaryPrice = primaryProduct
          ? parseFloat(primaryProduct.price)
          : 0;
        const bumpPrice = parseFloat(bumpProduct.price);

        console.log(`Updating bump display, checked: ${isChecked}`);

        if (isChecked) {
          // Add bump product if it doesn't exist
          if (!existingBumpElement) {
            const bumpProductHTML = `
              <div class="clearfix elOrderProductOptinProducts bump-product">
                <div class="pull-left elOrderProductOptinProductName product-name" style="width: inherit;">
                  ${bumpProduct.display_name}
                </div>
                <div class="pull-right elOrderProductOptinPrice product-price">
                  ${formatPrice(bumpPrice)}
                </div>
              </div>
            `;
            productsList.innerHTML += bumpProductHTML;
          }

          // Update total with primary + bump
          this.updateOrderTotal(primaryPrice, bumpPrice);
        } else {
          // Remove bump product if exists
          if (existingBumpElement) {
            existingBumpElement.remove();
          }

          // Update total with just primary product
          this.updateOrderTotal(primaryPrice, 0);
        }
      };

      // Get the bump checkbox
      const bumpCheckbox = document.querySelector(
        "#bump-offer"
      ) as HTMLInputElement | null;

      if (bumpCheckbox) {
        // Initial update based on current checkbox state
        updateBumpDisplay(bumpCheckbox.checked);

        // Listen for both standard change events and our custom event
        document.addEventListener("bump-checkbox-changed", (e: Event) => {
          const customEvent = e as CustomEvent;
          updateBumpDisplay(customEvent.detail.checked);
        });

        // Also listen for direct change events on the checkbox
        bumpCheckbox.addEventListener("change", () => {
          console.log(
            `Direct checkbox change detected: ${bumpCheckbox.checked}`
          );
          updateBumpDisplay(bumpCheckbox.checked);
        });
      }
    } else {
      // If no bump product, just update the total with primary product
      this.updateOrderTotal(
        primaryProduct ? parseFloat(primaryProduct.price) : 0,
        0
      );
    }
  }

  // Add method to update order total
  updateOrderTotal(primaryPrice: number, bumpPrice: number): void {
    console.log(
      `Updating order total: Primary: ${primaryPrice}, Bump: ${bumpPrice}`
    );
    const totalPrice = primaryPrice + bumpPrice;
    const formattedTotal = formatPrice(totalPrice);
    console.log(`Formatted total price: ${formattedTotal}`);

    // Update the original order-total element for compatibility with ClickFunnels
    const orderTotalElement = document.querySelector("#order-total");
    if (orderTotalElement) {
      console.log("Updating order-total element");
      orderTotalElement.textContent = formattedTotal;
    }

    // Find the original total element
    const originalTotalElement = document.querySelector(
      this.config.selectors.orderTotal
    ) as HTMLElement | null;

    // If the original total element exists, update its content
    if (originalTotalElement) {
      console.log("Updating original total element");

      // Look for an existing order-total span inside the original element
      const originalTotalValueElement =
        originalTotalElement.querySelector("#order-total");

      if (originalTotalValueElement) {
        console.log("Updating original total element's order-total");
        originalTotalValueElement.textContent = formattedTotal;
      } else {
        // If no order-total span exists, update the element directly
        originalTotalElement.innerHTML = `Total: <span id="order-total">${formattedTotal}</span>`;
      }

      // Make sure the element is visible
      originalTotalElement.style.display = "block";
    }
  }

  // Method to populate form fields with contact data
  populateFormFields(contact: any): void {
    if (!contact) {
      console.log("No contact data provided to populate form fields");
      return;
    }

    console.log("Populating form fields with contact data:", contact);

    const selectors = this.config.selectors.formFields;

    // Get the form field elements
    const firstNameField = document.querySelector(
      selectors.firstName
    ) as HTMLInputElement | null;
    const lastNameField = document.querySelector(
      selectors.lastName
    ) as HTMLInputElement | null;
    const emailField = document.querySelector(
      selectors.email
    ) as HTMLInputElement | null;
    const phoneField = document.querySelector(
      selectors.phone
    ) as HTMLInputElement | null;

    // Set the values if the fields exist and the data is available
    if (firstNameField && contact.first_name) {
      console.log("Setting first name:", contact.first_name);
      firstNameField.value = contact.first_name;
    }

    if (lastNameField && contact.last_name) {
      console.log("Setting last name:", contact.last_name);
      lastNameField.value = contact.last_name;
    }

    if (emailField && contact.email) {
      console.log("Setting email:", contact.email);
      emailField.value = contact.email;
    }

    if (phoneField && contact.phone) {
      console.log("Setting phone:", contact.phone);
      phoneField.value = contact.phone;
    }
  }

  // New method to show submit button if no contact ID is present
  showSubmitButtonIfNeeded(): void {
    const contactId = this.ensureContactId();
    if (!contactId) {
      console.log("No contact ID found, showing submit button");
      const submitButton = document.querySelector(
        this.config.selectors.submitButton
      ) as HTMLElement | null;

      if (submitButton) {
        // Make sure the button is visible
        submitButton.style.display = "block";

        // Also remove it from any hidden classes
        submitButton.classList.remove("hidden-until-submission");

        console.log("Submit button is now visible");
      } else {
        console.warn("Submit button not found to show");
      }
    } else {
      console.log("Contact ID found, submit button will remain hidden");
    }
  }
}

// Initialize the handler only in browser environment
if (isBrowser) {
  const keapFunnel = new KeapFunnelHandler();
  keapFunnel.init();
} else {
  console.log(
    "ClickFunnels script loaded in non-browser environment. DOM manipulation skipped."
  );
}

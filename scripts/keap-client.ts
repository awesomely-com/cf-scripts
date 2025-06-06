import { queryStringToJSON, getPageSlugFromUrl } from "./utils";

interface SessionPayload {
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
  contact_id?: string;
}

interface UpdateContactPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface CreateOrderPayload {
  contact_id: string;
  payment_method_id: string;
  session_key: string;
  page_slug: string;
  product_ids: number[];
  affiliate_id?: string;
}

export class KeapClient {
  private baseUrl = "https://funnels-api.awesomely.com/api/keap";

  /**
   * Get tracking data including URL parameters and localStorage data
   */
  private getTrackingData(): Record<string, string> {
    // Start with URL parameters
    const trackingData = queryStringToJSON();

    // Check for LandingPagePath in localStorage
    try {
      const landingPagePath = localStorage.getItem("LandingPagePath");
      if (landingPagePath) {
        console.log("Found LandingPagePath in localStorage:", landingPagePath);
        trackingData.landing_page_path = landingPagePath;
      }
    } catch (e) {
      console.warn("Error accessing localStorage:", e);
    }

    return trackingData;
  }

  /**
   * Make a request to the Keap API
   */
  async makeRequest<T>(
    endpoint: string,
    method: string,
    data?: any
  ): Promise<T> {
    console.log(`Making API request to ${endpoint}:`, {
      method,
      data,
    });

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      console.warn(`API request failed with status ${response.status}`);
      if (response.status === 400) {
        const errorData = await response.json();
        console.error("API error details:", errorData);
        if (errorData.message === "Session has expired") {
          // Session expired
          console.log("Session has expired");
        }
      }
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log(`API Response from ${endpoint}:`, responseData);
    return responseData as T;
  }

  /**
   * Check if a session is valid
   */
  async checkSessionValidity(sessionKey: string): Promise<{
    valid: boolean;
    expired: boolean;
    session_key?: string;
    url_friendly_session_key?: string;
    contact_id?: string;
  }> {
    return this.makeRequest(
      `/check-session-validity?session_key=${sessionKey}`,
      "GET"
    );
  }

  /**
   * Start a new payment session
   */
  async startSession(payload: SessionPayload): Promise<any> {
    return this.makeRequest("/start-payments-api-session", "POST", payload);
  }

  /**
   * Create a contact information submit payload
   */
  createContactInformationPayload(
    formData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    },
    sessionKey?: string,
    salesAwesomelyExternalKey?: any,
    affiliateId?: string
  ): SessionPayload {
    const payload: SessionPayload = {
      page_slug: getPageSlugFromUrl(),
      opt_in: true,
      opt_in_reason: "Opted in via order form",
      tracking_data: this.getTrackingData(),
      sales_awesomely_external_key: salesAwesomelyExternalKey,
    };

    if (!sessionKey) {
      // No session key found, include contact info
      const transformedFormData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      };
      console.log(
        "No session key found. Using form data:",
        transformedFormData
      );
      Object.assign(payload, transformedFormData);
    } else {
      // Session key found
      console.log("Session key found:", sessionKey);
      payload.session_key = sessionKey;
    }

    if (affiliateId) {
      payload.affiliate_id = affiliateId;
    }

    return payload;
  }

  /**
   * Update contact information
   */
  async updateContact(
    contactId: string,
    payload: UpdateContactPayload
  ): Promise<any> {
    return this.makeRequest(`/contacts/${contactId}`, "PUT", payload);
  }

  /**
   * Create and charge an order
   */
  async createOrder(payload: CreateOrderPayload): Promise<any> {
    return this.makeRequest("/create-and-charge-order", "POST", payload);
  }

  /**
   * Start a session with just a contact ID and page slug
   * This is a simplified version of startSession that doesn't require all contact information
   */
  async startSimpleSession(contactId: string, pageSlug: string): Promise<any> {
    const payload = {
      contact_id: contactId,
      page_slug: pageSlug,
      opt_in: true,
      opt_in_reason: "Opted in via order form",
      tracking_data: this.getTrackingData(),
    };

    console.log("Starting simple session with payload:", payload);
    return this.makeRequest("/start-payments-api-session", "POST", payload);
  }

  /**
   * Get contact data by ID
   * Fetches the contact information from the API
   */
  async getContactData(contactId: string): Promise<any> {
    console.log("Fetching contact data for ID:", contactId);
    return this.makeRequest(`/contacts/${contactId}`, "GET");
  }
}

export default KeapClient;

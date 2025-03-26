# ClickFunnels-Keap Integration Script

A JavaScript library for handling Keap payment integrations within ClickFunnels pages. This specifically covers the order-form.ts file that's heavily customized to work around the limitations of the Keap payment iframe and with our custom backend.

## Usage

This is meant to be applied to the order form page of the Awesomely Clickfunnels funnel. In almost all cases, this will be step 2 of the funnel, where step 1 should be the contact information form.

This also assumes that all product information and steps have been set up in the Awesomely Funnels database.

### Ensure page elements are present

The following page elements need to exist in order for the order form to load correctly.

1. Custom contact Information submit button `selectors.contactInformationSubmitButton`
2. Billing Information Header
3. Custom HTML for Keap iframe
4. Credit Card logo image
5. Custom HTML for displaying Order Total
6. Custom Order button `selectors.orderButton`

Note that if any IDs for these elements are changed, you will need to specify the new IDs in the KeapFunnelConfig object.

#### Notes on the removal of some legacy page elements

### Notes on traditional Page Elements that may exist in legacy CF order form pages

- Removed JS for order total, as this is now handled by our new custom script
- Removed old primary submit button, as we now have a custom order button with no action that will submit the form

### Import CSS

In the Custom CSS editor, import the following:

`@import url('https://cdn.jsdelivr.net/gh/awesomely-com/cf-scripts@latest/assets/order-form.css');`

This should be the first line of CSS in the Custom CSS editor, and any modifications can be added after that.

### Import JS

In the Footer Tracking code editor, enter the following as the first line of code:

`<script src="https://cdn.jsdelivr.net/gh/awesomely-com/cf-scripts@latest/dist/order-form.js"></script>`.

### Customizing

Many of the elements that need to be styled by CSS or modified by JS have unique IDs, and the defaults correspond to the original implementation of the APP funnel curing development. Some element IDs may be different for your order form. If so, you may customize the CSS by adding any modifications after the import. As for the JS, the script that loads will take into account anything that you want to specify in the KeapFunnelConfig object BEFORE loading the script.

```javascript
<script>
window.KeapFunnelConfig = {
  // customizations here. Refer to the KeapFunnelConfig object documentation above.
};
</script>
<script src="https://cdn.jsdelivr.net/gh/awesomely-com/cf-scripts@latest/dist/order-form.js"></script>
```

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) - Fast JavaScript runtime and package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd clickfunnels-js

# Install dependencies
bun install
```

## Development Workflow

This project is set up to make development easy while working with browser-specific code. The main script uses browser APIs like `document` and `window`, but includes checks to prevent errors when running in a Node.js-like environment.

### Available Scripts

- **Development Mode**:

  ```bash
  bun run dev
  ```

  Runs the TypeScript file directly with Bun in watch mode. This is great for development and testing the logic. The script will automatically restart when you make changes.

- **Bundle Watch Mode**:

  ```bash
  bun run bundle:watch
  ```

  Continuously builds your TypeScript file into a bundled JavaScript file in the `dist` directory whenever changes are detected. Use this when you want to see what the final bundled output will look like or test the bundled file in a browser.

- **Production Build**:
  ```bash
  bun run build
  ```
  Creates a one-time, minified production build of your TypeScript file. Run this when you're ready to create the final version for ClickFunnels.

## Features

- Contact ID-based session management with URL parameter support
- Automatic form field population when contact ID is present
- Session management with local/session storage
- Form submission handling with or without submit button
- Payment processing via Keap's payment iframe
- Order bump functionality
- Duplicate order detection
- URL session key management
- Error handling and user feedback

## Configuration

The script uses a default configuration that can be overridden:

```javascript
window.KeapFunnelConfig = {
  selectors: {
    contactInformationSubmitButton: "#tmp_button-35872",
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
    elementsToHideAfterSessionStart: [
      "#tmp_button-35872", // Submit button
    ],
    elementsToDisable: [
      "#tmp_input-36893", // First Name input
      "#input-32758", // Last Name input
      "#input-13475", // Email input
      "#input-72924", // Phone input
    ],
    elementsToShowAfterSessionStart: [
      "#headline-93357", // Billing Information headline
      "#tmp_image-96949", // credit card logos
      "#tmp_orb-35379", // order bump
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
```

---

## Implementation

The rest of the documentation will detail how the script works.

## Key Methods

- `init()`: Sets up event listeners, checks for contact ID or session key, and initializes the form
- `ensureContactId()`: Retrieves contact ID from state or URL parameters
- `handleContactInformationSubmit()`: Processes form submissions with or without a contact ID
- `handleOrder()`: Handles order creation and payment processing
- `populateFormFields()`: Automatically fills form fields with contact data when a contact ID is present
- `showSubmitButtonIfNeeded()`: Shows the submit button only when no contact ID is present
- `setupOrderBumpListeners()`: Configures order bump functionality
- `checkUrlSessionKey()`: Validates session keys and contact IDs from URLs
- `handleDuplicateOrder()`: Manages duplicate order scenarios

## Contact ID Flow

The script now prioritizes using a contact ID from URL parameters:

1. When a page loads with a `contactId` URL parameter, the script:

   - Stores the contact ID
   - Starts a session directly without requiring form submission
   - Populates form fields with contact data
   - Hides the submit button (not needed)
   - Shows payment elements immediately

2. When no contact ID is present:
   - The submit button remains visible
   - The user must fill out the form and submit it
   - The legacy form submission flow is used

## Session Management

The script manages sessions using both localStorage and sessionStorage with configurable expiration times. Sessions include:

- Contact ID
- Session key
- URL-friendly session key
- Timestamp

## Error Handling

Comprehensive error handling for:

- API failures
- Payment processing issues
- Duplicate orders
- Session expiration
- Storage access errors

## Dependencies

- Requires Keap's payment iframe script (`payment-method-embed.js`)
- Compatible with ClickFunnels' storage system

---

## Example Implementation: ODF

The below assumes that you are editing step 2, AKA the order form page, of the ODF funnel.

- Create a subheadline element directly above the contact information fields
  - Text: Contact Information
  - Top-margin: `15px`
  - Font-size: `18px`
  - Mobile font-size: `16px`
- Create a Button beneath the Conact Information fields
  - Button Text: `Continue`
- Change the “Payment Info” text to “Billing Information”
- Remove the Credit Card fields (not the credit card logo image)
- Set the top margin of the element with the credit card logo image to `0px`
- Between the Billing Information heading and the Credit Card logos, place a Custom JS/HTML element with the following code:
  - `<keap-payment-method id="keap-payment-method" />`
  - Set the top margin of this element to `0px`
- Remove the Billing Address heading
- Remove the Billing Address fields
- Select the Custom JS/HTML block below the list of order items (the one that usually has the text “Dynamically Updated”). It’ll have code where the first line is: `<div class="elOrderProductOptions">`. Paste in the following code in its entirety:

```html
<div class="elOrderProductOptions">
  <div class="clearfix elOrderProductOptinLabel ordertotalprice">
    <div class="pull-left elOrderProductOptinItem">Order Total</div>
    <div class="pull-right elOrderProductOptinLabelPrice">
      <span id="order-total" class="productTotal">$</span>
    </div>
  </div>
</div>
```

- Remove the existing form submit button (“Click to Continue”), as it is connected to the rest of the form - we will be using a custom submit function.
- Create a button element
  - Button Text: “Continue”
- Note the IDs of the following elements:
  - Billing Information headline: `#headline-55849`
  - Contact Information submit button: `#tmp_button-11004`
  - Order Button (last submit button on the page): `#tmp_button-42404`
- Open some text editor where you can save code temporarily and:
  - Open the Footer Tracking code portion and save the current JS to your text editor
  - Open the Custom CSS and save that as well
- Replace all the Footer Tracking code with the link to the external order form script
- Replace all the Custom CSS by importing the order form CSS
  - The buttons and some other elements may have a different look - use the CSS you saved in the editor to restore some of the styles. For instance, you may want to copy this code back in:

```css
.elButton {
  width: 100%;
  background-color: rgb(22, 168, 100);
  background-image: linear-gradient(
    20deg,
    rgba(22, 168, 100, 1) 0%,
    rgba(27, 199, 119, 1) 75%
  ) !important;
  box-shadow: 0 0 5px #ccc, 1px 5px 5px #ccc;
}

/* for some reason, the order button has margin-top of 0 that just won't go away, so we'll need to override it */
#tmp_button-42404 {
  margin-top: 30px !important;
}
```

- Try previewing it - you may see that some elements that should be hidden are incorrectly showing. We’ll need to configure the JS to hide them using the IDs you noted earlier. In the Footer Tracking code, add this JS **before** linking to the external order form script. Show below is the **entirety** of the footer tracking code:

```javascript
<script>
window.KeapFunnelConfig = {
  selectors: {
    contactInformationSubmitButton: "#tmp_button-11004",
    orderButton: "#tmp_button-42404",
    elementsToHideAfterSessionStart: [
      "#tmp_button-11004", // contact information submit button
    ],
    elementsToShowAfterSessionStart: [
      "#headline-55849", // billing information headline
      "#tmp_button-42404", // submit order button
      "#tmp_orb-35379", // order bump
    ]
  }
};
</script>

<script src="https://cdn.jsdelivr.net/gh/awesomely-com/cf-scripts@latest/dist/order-form.js"></script>
```

Some of the elements are already hidden/shown by default after the payment session starts, such as the Secure Checkout image, the legalise at the bottom, etc. because a lot of the order form pages share the same IDs for these elements since they were cloned from each other. However, you can reference the docs in case the IDs for these change and you want to specify them in the config directly.

This should complete the integration of the custom order form script for ODF.

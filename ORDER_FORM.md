# ClickFunnels-Keap Integration Script

A JavaScript library for handling Keap payment integrations within ClickFunnels pages. This specifically covers the order-form.ts file that's heavily customized to work around the limitations of the Keap payment iframe and with our custom backend.

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

## Using with ClickFunnels

1. Run the build command to create a minified JavaScript file:

   ```bash
   bun run build
   ```

2. The built file will be available at `dist/clickfunnels.js`

3. Copy the contents of this file and paste it into your ClickFunnels custom JavaScript section.

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
    submitButton: "#tmp_button-35872",
    orderButton: "#tmp_button-23692",
    paymentMethod: "#keap-payment-method",
    formFields: {
      firstName: "#tmp_input-36893 input",
      lastName: "#input-32758 input",
      email: "#input-13475 input",
      phone: "#input-72924 input",
    },
    // ... other selectors
  },
  sessionConfig: {
    expirationHours: 2,
    storageKey: "orderSession",
  },
};
```

## Usage

1. Include the script in your ClickFunnels page
2. Configure the selectors to match your page elements
3. Initialize the handler:

```javascript
const keapFunnel = new KeapFunnelHandler();
keapFunnel.init();
```

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

## Security

- Secure payment processing via Keap's iframe
- Session expiration handling
- No sensitive data storage in browser
- URL parameter sanitization

## Code Structure

- `src/clickfunnels.ts` - Main TypeScript file containing all the functionality
- `src/keap-client.ts` - Client for interacting with the Keap API
- `src/utils.ts` - Utility functions for browser detection, URL handling, etc.
- `src/floating-labels.ts` - Styling for form labels

## Browser Compatibility

The script is designed to work with modern browsers and includes checks to ensure it only runs in browser environments.

## Troubleshooting

If you encounter issues during development:

1. Make sure you have the latest version of Bun installed
2. Check that all browser-specific code is properly wrapped in environment checks
3. For production issues, test the bundled file in a browser before deploying to ClickFunnels
4. Check browser console logs for detailed error messages
5. Verify that the contact ID is being correctly passed in URL parameters when using the direct contact ID flow

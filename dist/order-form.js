var R=typeof document!=="undefined"&&typeof window!=="undefined";function q(j){j=j.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");let W=new RegExp("[\\?&]"+j+"=([^&#]*)").exec(window.location.search);return W===null?"":decodeURIComponent(W[1].replace(/\+/g," "))}function O(){return window.location.search.substring(1).split("&").reduce((Q,W)=>{if(!W)return Q;let[X,Y]=W.split("=");return Q[decodeURIComponent(X)]=decodeURIComponent(Y||""),Q},{})}function G(){console.log("URL debugging:",{fullUrl:window.location.href,protocol:window.location.protocol,hostname:window.location.hostname,pathname:window.location.pathname,search:window.location.search,hash:window.location.hash});let j=window.location.pathname.replace(/^\/|\/$/g,"");if(!j)return"home";let W=(j.split("/").pop()||"").replace(/[^a-zA-Z0-9]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");return console.log("Generated page slug:",W||"home"),W||"home"}function A(j){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(j)}class U{baseUrl="https://funnels-api.awesomely.com/api/keap";async makeRequest(j,Q,W){console.log(`Making API request to ${j}:`,{method:Q,data:W});let X=await fetch(`${this.baseUrl}${j}`,{method:Q,headers:{"Content-Type":"application/json"},body:W?JSON.stringify(W):void 0});if(!X.ok){if(console.warn(`API request failed with status ${X.status}`),X.status===400){let _=await X.json();if(console.error("API error details:",_),_.message==="Session has expired")console.log("Session has expired")}throw new Error(`API request failed: ${X.statusText}`)}let Y=await X.json();return console.log(`API Response from ${j}:`,Y),Y}async checkSessionValidity(j){return this.makeRequest(`/check-session-validity?session_key=${j}`,"GET")}async startSession(j){return this.makeRequest("/start-payments-api-session","POST",j)}createContactInformationPayload(j,Q,W,X){let Y={page_slug:G(),opt_in:!0,opt_in_reason:"Opted in via order form",tracking_data:O(),sales_awesomely_external_key:W};if(!Q){let _={first_name:j.firstName,last_name:j.lastName,email:j.email,phone:j.phone};console.log("No session key found. Using form data:",_),Object.assign(Y,_)}else console.log("Session key found:",Q),Y.session_key=Q;if(X)Y.affiliate_id=X;return Y}async updateContact(j,Q){return this.makeRequest(`/contacts/${j}`,"PUT",Q)}async createOrder(j){return this.makeRequest("/create-and-charge-order","POST",j)}async startSimpleSession(j,Q){let W={contact_id:j,page_slug:Q,opt_in:!0,opt_in_reason:"Opted in via order form",tracking_data:O()};return console.log("Starting simple session with payload:",W),this.makeRequest("/start-payments-api-session","POST",W)}async getContactData(j){return console.log("Fetching contact data for ID:",j),this.makeRequest(`/contacts/${j}`,"GET")}}var L=U;if(R)document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll(".elInputWrapper").forEach((j)=>{j.classList.add("input-container");let Q=j.querySelector("input");if(Q){Q.classList.add("input-field");let W=document.createElement("label");W.classList.add("floating-label"),W.textContent=Q.getAttribute("placeholder")||"",Q.setAttribute("placeholder"," "),Q.insertAdjacentElement("afterend",W)}})});class H{config;state;initialized=!1;keapClient;handlePaymentMessage=async()=>{};paymentResponseTimeout=null;static defaultConfig={selectors:{submitButton:"#tmp_button-35872",orderButton:"#tmp_button-23692",paymentMethod:"#keap-payment-method",formFields:{firstName:"#tmp_input-36893 input",lastName:"#input-32758 input",email:"#input-13475 input",phone:"#input-72924 input"},orderTotal:"#tmp_customjs-87590",orderBump:".orderFormBump .sectioncontent div, .orderFormBump .sectioncontent input#bump-offer",bumpCheckbox:"#bump-offer",messages:{success:"#payment-success-message",error:"#payment-error-message",errorDetails:"#payment-error-details",duplicate:"#duplicate-payment-message"},elementsToHide:["#tmp_button-35872"],elementsToDisable:["#tmp_input-36893","#input-32758","#input-13475","#input-72924"],elementsToShowAfterSubmit:["#headline-93357","#tmp_image-96949","#tmp_orb-35379","#tmp_customjs-87590","#tmp_button-78442","#tmp_button-23692","#img-11614","#headline-20568"]},sessionConfig:{expirationHours:2,storageKey:"orderSession"}};constructor(j={}){this.config={...H.defaultConfig,...j},this.state={keapContactId:null,orderId:null,sessionKey:null,urlFriendlySessionKey:null,stepProducts:null},this.keapClient=new L}init(){this.initialized=!1,document.addEventListener("DOMContentLoaded",()=>{this.checkUrlSessionKey(),this.showSubmitButtonIfNeeded(),this.setupEventListeners(),this.hideElementsUntilSubmission(),this.initialized=!0,this.handleExistingSession()})}setupEventListeners(){if(this.setupOrderBumpListeners(),!this.ensureContactId())this.setupSubmitButtonListener();this.setupOrderButtonListener()}isSessionExpired(j){let Q=this.config.sessionConfig.expirationHours*60*60*1000;return new Date().getTime()-j>Q}saveOrderSession(j){console.log("Saving order session to storage:",j);let Q={...j,timestamp:new Date().getTime()};try{localStorage.setItem(this.config.sessionConfig.storageKey,JSON.stringify(Q)),sessionStorage.setItem(this.config.sessionConfig.storageKey,JSON.stringify(Q)),console.log("Successfully saved session data")}catch(W){console.warn("Failed to save order session to storage",W)}}getOrderSession(){let j=this.getFormData();if(j.firstName&&j.lastName&&j.email)return j;return null}deleteExpiredSessionData(){console.log("Deleting expired session data");try{localStorage.removeItem(this.config.sessionConfig.storageKey),sessionStorage.removeItem(this.config.sessionConfig.storageKey),console.log("Successfully deleted expired session data")}catch(j){console.warn("Failed to delete expired session from storage",j)}}setupOrderBumpListeners(){console.log("Setting up order bump listeners");let j=document.querySelector(this.config.selectors.bumpCheckbox);if(j)console.log("Found bump checkbox, setting up change listener"),j.addEventListener("change",(Q)=>{console.log(`Bump checkbox changed to: ${j.checked}`);let W=new CustomEvent("bump-checkbox-changed",{detail:{checked:j.checked},bubbles:!0});j.dispatchEvent(W)});else console.warn("Bump checkbox not found:",this.config.selectors.bumpCheckbox)}setupSubmitButtonListener(){console.log("Setting up submit button listener (legacy flow)");let j=document.querySelector(this.config.selectors.submitButton);if(j)j.addEventListener("click",(Q)=>{Q.preventDefault(),this.handleContactInformationSubmit()});else console.warn("Submit button not found for legacy flow")}setupOrderButtonListener(){let j=document.querySelector(this.config.selectors.orderButton);if(j instanceof HTMLElement)j.style.marginTop="0",j.style.marginBottom="30px",j.addEventListener("click",(Q)=>{Q.preventDefault(),this.handleOrder()})}setButtonState(j,Q,W){if(console.log("Setting button state:",{button:j,isDisabled:Q,text:W}),!j)return;let X=j.querySelector(".elButton"),Y=j.querySelector(".elButtonMain");if(!X||!Y)return;if(Q)j.dataset.state="submitting",j.style.pointerEvents="none",X.style.setProperty("background-image","none","important"),X.style.setProperty("background-color","rgb(224, 224, 224)"),Y.textContent=W||"Processing...";else j.dataset.state="ready",j.style.pointerEvents="auto",X.style.removeProperty("background-image"),X.style.removeProperty("background-color"),Y.textContent=W||"Continue"}async handleContactInformationSubmit(){console.log("Handling contact information submission (can be triggered by button or directly)");let j=document.querySelector(this.config.selectors.submitButton);if(j)this.setButtonState(j,!0,"Processing...");try{let Q=this.ensureContactId();if(Q){console.log("Using contact_id for simplified session start:",Q);try{let Z=G(),$=await this.keapClient.startSimpleSession(Q,Z);await this.handleContactInformationSubmitResponse($);return}catch(Z){console.warn("Failed to start session with contact_id, falling back to standard flow:",Z)}}let W=this.getFormData();if(console.log("Form data collected:",W),!W.firstName||!W.lastName||!W.email){let Z=[];if(!W.firstName)Z.push("First Name");if(!W.lastName)Z.push("Last Name");if(!W.email)Z.push("Email");let $=`Please fill in all required fields: ${Z.join(", ")}`;if(console.error($),alert($),j)this.setButtonState(j,!1,"Submit");return}let X=q("affiliate")||void 0,Y=this.keapClient.createContactInformationPayload(W,this.state.sessionKey||void 0,this.getSalesAwesomelyExternalKey(),X);console.log("Submit payload created:",Y);let _=await this.keapClient.startSession(Y);await this.handleContactInformationSubmitResponse(_)}catch(Q){if(console.error("Submit failed:",Q),alert("There was an error processing your request. Please try again or contact support."),j)this.setButtonState(j,!1,"Submit")}}getContactIdFromUrl(){let j=q("contactId");if(j)return console.log("Found contact_id in URL parameters:",j),j;return null}getFormData(){let j=this.config.selectors.formFields;return{firstName:document.querySelector(j.firstName)?.value||"",lastName:document.querySelector(j.lastName)?.value||"",email:document.querySelector(j.email)?.value||"",phone:document.querySelector(j.phone)?.value||""}}async handleContactInformationSubmitResponse(j){if(j.is_duplicate){this.handleDuplicateOrder(j);return}if(this.updateState(j),this.saveOrderSession({sessionKey:this.state.sessionKey||"",urlFriendlySessionKey:this.state.urlFriendlySessionKey||"",contactId:this.state.keapContactId||""}),console.log("Session response received:",j),j.contact)console.log("Populating form fields with contact data from response"),this.populateFormFields(j.contact);if(j.step?.products&&j.step.products.length>0)console.log("Updating product display with products from response:",j.step.products),this.updateProductDisplay(j.step.products);else console.warn("No products found in response");this.showElementsAfterSubmission(),this.setupPaymentMethod(),this.disableFormElements()}updateState(j){if(j.contact&&j.order)this.state={keapContactId:j.contact.keap_contact_id.toString(),orderId:j.order.id.toString(),sessionKey:j.order.session_key,urlFriendlySessionKey:j.order.url_friendly_session_key,stepProducts:j.step?.products||[]},console.log("Updated state with API response:",this.state);else if(j.contact?.keap_contact_id&&j.order?.session_key)this.state={...this.state,keapContactId:j.contact.keap_contact_id.toString(),sessionKey:j.order.session_key,urlFriendlySessionKey:j.order.url_friendly_session_key||this.state.urlFriendlySessionKey,orderId:j.order.id?.toString()||this.state.orderId,stepProducts:j.step?.products||this.state.stepProducts},console.log("Updated state with simplified session response:",this.state);else this.state={...this.state,keapContactId:j.contact?.keap_contact_id?.toString()||this.state.keapContactId,sessionKey:j.order?.session_key||this.state.sessionKey,urlFriendlySessionKey:j.order?.url_friendly_session_key||this.state.urlFriendlySessionKey},console.log("Updated state with direct session data:",this.state)}setupPaymentMethod(){let j=document.querySelector(this.config.selectors.paymentMethod);if(j)j.setAttribute("key",this.state.sessionKey||""),this.loadPaymentScript()}loadPaymentScript(){let j=document.createElement("script");j.src="https://payments.keap.page/lib/payment-method-embed.js",document.body.appendChild(j),this.setupIframePolling()}setupIframePolling(){let j=setInterval(()=>{let Q=document.querySelector(this.config.selectors.paymentMethod);if(Q?.shadowRoot){let W=Q.shadowRoot.querySelector("iframe#payment-method-iframe"),X=document.createElement("style");if(X.textContent=`
          #payment-method-iframe {
            width: var(--payment-method-iframe-width);
            margin: var(--payment-method-iframe-margin);
          }
        `,Q.shadowRoot.appendChild(X),W){clearInterval(j);let Y=document.querySelector(this.config.selectors.orderButton);if(Y instanceof HTMLElement)Y.style.display="block"}}},100)}disableFormElements(){let j=this.ensureContactId();if(this.config.selectors.elementsToHide)this.config.selectors.elementsToHide.forEach((Q)=>{if(!j&&Q===this.config.selectors.submitButton){console.log("Skipping hiding submit button since no contact ID is present");return}let W=document.querySelector(Q);if(W instanceof HTMLElement)W.style.display="none"})}async checkUrlSessionKey(){let j=this.getContactIdFromUrl();if(j)console.log("Found contact_id in URL, storing for later use:",j),this.state.keapContactId=j;else console.log("No contact_id found in URL parameters");let Q=q("session_key");if(!Q){console.log("No session_key found in URL parameters");return}console.log("Found session key in URL:",Q);try{let W=await this.keapClient.checkSessionValidity(Q);if(W.expired)console.log("Session key in URL is expired"),this.deleteExpiredSessionData(),this.removeSessionKeyFromUrl();else if(W.valid){if(console.log("Session key in URL is valid"),this.saveOrderSession({sessionKey:W.session_key||"",urlFriendlySessionKey:W.url_friendly_session_key||"",contactId:W.contact_id||j||""}),W.contact_id)console.log("Got contact_id from session validity check:",W.contact_id),this.state.keapContactId=W.contact_id}}catch(W){console.warn("Error checking session validity:",W);let X=this.getOrderSession();if(X&&X.sessionKey===Q&&this.isSessionExpired(X.timestamp))this.deleteExpiredSessionData()}}removeSessionKeyFromUrl(){if(window.history&&window.history.replaceState){let j=new URL(window.location.href);j.searchParams.delete("session_key"),window.history.replaceState({},document.title,j.toString())}}async handleExistingSession(){let j=this.ensureContactId();if(j){console.log("Found contact ID, starting session directly:",j);try{let Q=G(),W=await this.keapClient.startSimpleSession(j,Q);await this.handleContactInformationSubmitResponse(W);return}catch(Q){console.warn("Failed to start session with contact ID:",Q)}}console.log("No contact ID found, legacy form-based approach not needed")}handleDuplicateOrder(j){console.warn("Duplicate order detected");let Q=document.querySelector(this.config.selectors.messages.duplicate);if(Q)Q.style.display="block";else alert("You have already completed this order. Please continue to the next step.");if(j.step?.next_step_url)setTimeout(()=>{window.location.href=j.step.next_step_url+"?session_key="+(this.state.urlFriendlySessionKey||"")},3000)}ensureContactId(){if(this.state.keapContactId)return this.state.keapContactId;let j=this.getContactIdFromUrl();if(j)return this.state.keapContactId=j,j;return null}async handleOrder(){console.log("Handling order submission");let j=document.querySelector(this.config.selectors.orderButton);this.setButtonState(j,!0);try{let Q=this.getFormData();if(!Q.firstName||!Q.lastName||!Q.email||!Q.phone){let Z=[];if(!Q.firstName)Z.push("First Name");if(!Q.lastName)Z.push("Last Name");if(!Q.email)Z.push("Email");if(!Q.phone)Z.push("Phone Number");let $=`Please fill in all required fields: ${Z.join(", ")}`;console.error($),this.handleOrderError(new Error($),j);return}let W=this.ensureContactId();if(!W){console.error("Contact information is missing. Please refresh the page and try again."),this.handleOrderError(new Error("Contact information is missing. Please refresh the page and try again."),j);return}console.log("Updating contact information for ID:",W);let X={first_name:Q.firstName,last_name:Q.lastName,email:Q.email,phone:Q.phone};try{await this.keapClient.updateContact(W,X),console.log("Contact information updated successfully")}catch(Z){console.error("Failed to update contact information:",Z);let $="Failed to update contact information. Please try again.";this.handleOrderError(new Error($),j);return}let Y=this.getSelectedProducts();if(Y.length===0){console.error("No products found to add to the order"),this.handleOrderError(new Error("No products found to add to the order. Please refresh the page and try again."),j);return}console.log("Selected product IDs:",Y),this.setupPaymentMessageHandler(Y,j);let _=document.querySelector(this.config.selectors.paymentMethod);if(!_){this.handleOrderError(new Error("Payment method element not found. Please refresh the page and try again."),j);return}if(!_.submit){this.handleOrderError(new Error("Payment method is not ready. Please refresh the page and try again."),j);return}if(window.addEventListener("error",(Z)=>{if(Z.message&&Z.message.includes("[Keap Payments] Error"))console.error("Payment method error:",Z.message),this.handleOrderError(new Error(Z.message.replace("[Keap Payments] Error: ","")),j)},{once:!0}),this.paymentResponseTimeout)clearTimeout(this.paymentResponseTimeout);this.paymentResponseTimeout=setTimeout(()=>{console.warn("No payment response received after 5 seconds, restoring order button"),this.handleOrderError(new Error("There was an error saving your payment method. Please check your payment details and try again."),j)},5000),console.log("Submitting payment method"),_.submit()}catch(Q){console.error("Order submission failed:",Q),this.handleOrderError(Q,j)}}getSelectedProducts(){let j=[];if(this.state.stepProducts?.length){let Q=this.state.stepProducts.find((X)=>X?.position==="primary");if(Q)j.push(Q.id);else if(this.state.stepProducts.length>0)j.push(this.state.stepProducts[0].id);let W=this.state.stepProducts.find((X)=>X?.position==="bump");if(W){if(document.querySelector("#bump-offer")?.checked)console.log("Including bump product in order:",W.id),j.push(W.id)}}else{let Q=document.querySelectorAll(".product-item"),W=!1;if(Q.forEach((X)=>{if(X instanceof HTMLElement&&X.dataset.position==="primary"&&!W&&X.dataset.productId)j.push(parseInt(X.dataset.productId)),W=!0}),j.length===0&&Q.length>0){let X=Q[0];if(X instanceof HTMLElement&&X.dataset.productId&&!isNaN(parseInt(X.dataset.productId)))j.push(parseInt(X.dataset.productId))}}return console.log("Selected product IDs:",j),j}setupPaymentMessageHandler(j,Q){console.log("Setting up payment message handler"),window.removeEventListener("message",this.handlePaymentMessage),this.handlePaymentMessage=async(W)=>{let X=W.data;if(!X||typeof X!=="object"||!("success"in X))return;if(console.log("Payment message received:",X),this.paymentResponseTimeout)clearTimeout(this.paymentResponseTimeout),this.paymentResponseTimeout=null;if(!X.success){console.error("Payment method submission failed:",X);let Y=X.error||"Payment method submission failed. Please check your payment details and try again.";this.handleOrderError(new Error(Y),Q);return}window.removeEventListener("message",this.handlePaymentMessage);try{let Y=q("affiliate")||void 0,_=this.ensureContactId();if(!_)throw new Error("Contact ID is missing. Please refresh the page and try again.");let Z={contact_id:_,payment_method_id:X.paymentMethodId,session_key:this.state.sessionKey||this.state.urlFriendlySessionKey||"",page_slug:G(),product_ids:j,affiliate_id:Y};console.log("Creating order with payload:",Z);let $=await this.keapClient.createOrder(Z);await this.handleOrderResponse($)}catch(Y){this.handleOrderError(Y,Q)}},window.addEventListener("message",this.handlePaymentMessage)}async handleOrderResponse(j){if(console.log("Order creation response:",j),j.is_duplicate){console.warn("Duplicate order detected:",j),this.handleDuplicateOrder(j);return}let Q=document.querySelector(this.config.selectors.messages.success);if(Q)console.log("Showing success message"),Q.style.display="block";if(j.step?.next_step_url)console.log("Redirecting to next step:",j.step.next_step_url),setTimeout(()=>{window.location.href=j.step.next_step_url+"?session_key="+(this.state.urlFriendlySessionKey||"")},3000);else console.warn("No next step URL found in response:",j)}handleOrderError(j,Q){if(console.error("Order creation failed:",j),this.paymentResponseTimeout)clearTimeout(this.paymentResponseTimeout),this.paymentResponseTimeout=null;let W=document.querySelector(this.config.selectors.messages.error),X=document.querySelector(this.config.selectors.messages.errorDetails);if(W)console.log("Showing error message"),W.style.display="block";if(X)X.textContent=j.message||"Unknown error";else alert(j.message||"An error occurred during checkout. Please try again.");this.setButtonState(Q,!1)}getFunnelIdFromSession(){let Q=this.getStorageData("clickfunnelsPurchaseSessions");if(Q?.length>0)return Q[0].funnelId;return console.warn("No funnel ID found in session data"),null}getSalesAwesomelyExternalKey(){return this.getStorageData("clickfunnelsPurchaseSessions")}getStorageData(j){console.log("Attempting to retrieve storage data for key:",j);try{let Q=localStorage.getItem(j);if(Q){let W=JSON.parse(Q);return console.log("Found data in localStorage:",W),W}}catch(Q){console.warn("Error accessing localStorage:",Q)}try{let Q=sessionStorage.getItem(j);if(Q){let W=JSON.parse(Q);return console.log("Found data in sessionStorage:",W),W}}catch(Q){console.warn("Error accessing sessionStorage:",Q)}return console.log("No storage data found for key:",j),null}hideFormElements(){this.disableFormElements()}hideElementsUntilSubmission(){if(this.config.selectors.elementsToShowAfterSubmit)this.config.selectors.elementsToShowAfterSubmit.forEach((j)=>{let Q=document.querySelector(j);if(Q)Q.classList.add("hidden-until-submission")})}showElementsAfterSubmission(){if(this.config.selectors.elementsToShowAfterSubmit)this.config.selectors.elementsToShowAfterSubmit.forEach((j)=>{let Q=document.querySelector(j);if(Q)Q.classList.remove("hidden-until-submission"),Q.classList.add("shown-after-submission")})}updateProductDisplay(j){if(!R)return;console.log("Updating product display with products:",j);let Q=document.querySelector("#tmp_ors-61891");if(!Q){console.warn("Original product container not found");return}let W=document.querySelector("#custom-product-display");if(!W)Q.style.display="none",W=document.createElement("div"),W.id="custom-product-display",W.className="de clearfix elOrderProductOptionsWrapper elMargin0",W.style.marginTop="30px",W.innerHTML=`
        <div class="elOrderProductOptions">
          <div class="clearfix elOrderProductOptinLabel">
            <div class="pull-left elOrderProductOptinItem">Item</div>
            <div class="pull-right elOrderProductOptinLabelPrice">Amount</div>
          </div>
          <div id="custom-products-list"></div>
        </div>
      `,Q.parentNode?.insertBefore(W,Q.nextSibling);let X=document.querySelector("#custom-products-list");if(!X){console.warn("Custom products list container not found");return}X.innerHTML="";let Y=[...j].sort(($,z)=>{if($.position==="primary")return-1;if(z.position==="primary")return 1;return 0}),_=Y.find(($)=>$.position==="primary");if(_){let $=parseFloat(_.price),z=`
        <div class="clearfix elOrderProductOptinProducts">
          <div class="pull-left elOrderProductOptinProductName product-name" style="width: inherit;">
            ${_.display_name}
          </div>
          <div class="pull-right elOrderProductOptinPrice product-price">
            ${A($)}
          </div>
        </div>
      `;X.innerHTML+=z}let Z=Y.find(($)=>$.position==="bump");if(Z){let $=(J)=>{let V=document.querySelector(".bump-product"),N=_?parseFloat(_.price):0,w=parseFloat(Z.price);if(console.log(`Updating bump display, checked: ${J}`),J){if(!V){let S=`
              <div class="clearfix elOrderProductOptinProducts bump-product">
                <div class="pull-left elOrderProductOptinProductName product-name" style="width: inherit;">
                  ${Z.display_name}
                </div>
                <div class="pull-right elOrderProductOptinPrice product-price">
                  ${A(w)}
                </div>
              </div>
            `;X.innerHTML+=S}this.updateOrderTotal(N,w)}else{if(V)V.remove();this.updateOrderTotal(N,0)}},z=document.querySelector("#bump-offer");if(z)$(z.checked),document.addEventListener("bump-checkbox-changed",(J)=>{$(J.detail.checked)}),z.addEventListener("change",()=>{console.log(`Direct checkbox change detected: ${z.checked}`),$(z.checked)})}else this.updateOrderTotal(_?parseFloat(_.price):0,0)}updateOrderTotal(j,Q){console.log(`Updating order total: Primary: ${j}, Bump: ${Q}`);let W=j+Q,X=A(W);console.log(`Formatted total price: ${X}`);let Y=document.querySelector("#order-total");if(Y)console.log("Updating order-total element"),Y.textContent=X;let _=document.querySelector(this.config.selectors.orderTotal);if(_){console.log("Updating original total element");let Z=_.querySelector("#order-total");if(Z)console.log("Updating original total element's order-total"),Z.textContent=X;else _.innerHTML=`Total: <span id="order-total">${X}</span>`;_.style.display="block"}}populateFormFields(j){if(!j){console.log("No contact data provided to populate form fields");return}console.log("Populating form fields with contact data:",j);let Q=this.config.selectors.formFields,W=document.querySelector(Q.firstName),X=document.querySelector(Q.lastName),Y=document.querySelector(Q.email),_=document.querySelector(Q.phone);if(W&&j.first_name)console.log("Setting first name:",j.first_name),W.value=j.first_name;if(X&&j.last_name)console.log("Setting last name:",j.last_name),X.value=j.last_name;if(Y&&j.email)console.log("Setting email:",j.email),Y.value=j.email;if(_&&j.phone)console.log("Setting phone:",j.phone),_.value=j.phone}showSubmitButtonIfNeeded(){if(!this.ensureContactId()){console.log("No contact ID found, showing submit button");let Q=document.querySelector(this.config.selectors.submitButton);if(Q)Q.style.display="block",Q.classList.remove("hidden-until-submission"),console.log("Submit button is now visible");else console.warn("Submit button not found to show")}else console.log("Contact ID found, submit button will remain hidden")}}if(R)new H().init();else console.log("ClickFunnels script loaded in non-browser environment. DOM manipulation skipped.");

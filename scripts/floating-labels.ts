import { isBrowser } from "./utils";

// Only run the DOM-related code in a browser environment
if (isBrowser) {
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".elInputWrapper").forEach((container) => {
      container.classList.add("input-container");
      const input = container.querySelector("input");
      if (input) {
        input.classList.add("input-field");
        const label = document.createElement("label");
        label.classList.add("floating-label");
        label.textContent = input.getAttribute("placeholder") || "";
        input.setAttribute("placeholder", " ");
        input.insertAdjacentElement("afterend", label);
      }
    });
  });
}

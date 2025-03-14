// scripts/quiz-redirect-v2.ts
function quizRedirect() {
  const elements = document.querySelectorAll(".cf_outcomes_action");
  const currentUrl = new URL(window.location.href);
  const queryParams = currentUrl.searchParams;
  elements.forEach((element) => {
    const baseUrl = element.dataset.pageRedirectUrl;
    if (!baseUrl) {
      console.warn("Element is missing data-page-redirect-url attribute:", element);
      return;
    }
    const newUrl = new URL(baseUrl);
    queryParams.forEach((value, key) => {
      newUrl.searchParams.append(key, value);
    });
    element.dataset.pageRedirectUrl = newUrl.toString();
  });
}
export {
  quizRedirect
};

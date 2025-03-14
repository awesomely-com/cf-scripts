// scripts/quiz-redirect-v2.1.ts
function appendQueryParamsToUrl(baseUrl) {
  const currentUrl = new URL(window.location.href);
  const queryParams = currentUrl.searchParams;
  const newUrl = new URL(baseUrl);
  queryParams.forEach((value, key) => {
    newUrl.searchParams.append(key, value);
  });
  return newUrl.toString();
}
function quizRedirect() {
  const outcomeElements = document.querySelectorAll(".cf_outcomes_action");
  const defaultOutcomeElement = document.querySelector(".surveyHideNextButton");
  const defaultBaseUrl = defaultOutcomeElement?.dataset.pageRedirectUrl;
  if (!defaultBaseUrl) {
    console.warn("Element is missing data-page-redirect-url attribute:", defaultOutcomeElement);
  } else {
    defaultOutcomeElement.dataset.pageRedirectUrl = appendQueryParamsToUrl(defaultBaseUrl);
  }
  outcomeElements.forEach((element) => {
    const baseUrl = element.dataset.pageRedirectUrl;
    if (!baseUrl) {
      console.warn("Element is missing data-page-redirect-url attribute:", element);
      return;
    }
    const newUrl = appendQueryParamsToUrl(baseUrl);
    element.dataset.pageRedirectUrl = newUrl.toString();
  });
}
export {
  quizRedirect
};

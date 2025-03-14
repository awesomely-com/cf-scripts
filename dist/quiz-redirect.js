// scripts/quiz-redirect.ts
function handleClickWithDelay(redirectUrl, urlParams) {
  return function() {
    setTimeout(() => {
      const currentUrlParams = new URLSearchParams(window.location.search);
      urlParams.forEach(([key, value]) => {
        currentUrlParams.set(key, value);
      });
      const finalUrl = `${redirectUrl}?${currentUrlParams.toString()}`;
      window.location.href = finalUrl;
    }, 1);
  };
}
function applyOnClickBehavior(data) {
  data.forEach((item) => {
    item.answerIds.forEach((id) => {
      const elements = document.querySelectorAll(`[data-answer-id="${id}"]`);
      elements.forEach((element) => {
        element.addEventListener("click", handleClickWithDelay(item.redirectUrl, item.urlParams));
      });
    });
  });
}
export {
  applyOnClickBehavior
};

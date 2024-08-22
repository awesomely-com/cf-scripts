// util.ts
function addStyles(el, styles) {
  if (!el)
    return;
  Object.assign(el.style, styles);
}
function getPacificMidnightTime(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date string");
  }
  date.setUTCDate(date.getUTCDate() + 1);
  let isDaylightSaving = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }).includes("PDT");
  let pacificOffset = isDaylightSaving ? -8 : -7;
  date.setUTCMinutes(date.getUTCMinutes() + pacificOffset * 60 * -1);
  return date;
}
function formatCountdownString(countdown) {
  const { days, hours, minutes, seconds } = countdown;
  const parts = [
    days && `${days}D`,
    hours && `${hours}H`,
    minutes && `${minutes}M`,
    seconds && `${seconds}S`
  ].filter(Boolean);
  return parts.join(" : ");
}

// scripts/offer-closed.ts
function isOfferClosed(elements) {
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get("d");
  const { countdown, countdownContainer, banner } = elements;
  if (dateParam) {
    document.querySelector(banner)?.remove();
    addStyles(document.querySelector(countdown), {
      display: "block"
    });
    const offerDate = getPacificMidnightTime(dateParam).getTime();
    let timeLeft = offerDate ? offerDate - new Date().getTime() : 0;
    if (timeLeft <= 0) {
      document.head.insertAdjacentHTML("beforeend", `<style>
				::backdrop {background: black;opacity: 0.75;}
				${countdown} {
					font-family: 'Open Sans', sans-serif;
					text-align: center;
					display: block;
					margin: 0 auto;
				}
				</style>`);
      const modal = document.createElement("dialog");
      addStyles(modal, {
        border: "none",
        padding: "1rem",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        flexDirection: "column",
        maxWidth: "325px",
        display: "flex",
        gap: "1rem",
        margin: "auto",
        fontSize: "1.3rem"
      });
      modal.innerHTML = `
            <h2 style="font-size: 2rem; margin: 0">This offer has expired.</h2>
			<p style="margin: 0">
			<a href="mailto:support@awesomely.com">support@awesomely.com</a><br />
			(877) 224-0445
			</p>
			<p style="margin: 0">
			<b>Monday - Friday</b><br />
			9:00am - 5:00pm ET
			</p>
			`;
      document.body.appendChild(modal);
      modal.showModal();
    } else {
      const interval = setInterval(() => {
        timeLeft = timeLeft - 1000;
        if (timeLeft <= 0) {
          if (interval) {
            clearInterval(interval);
            document.querySelector(countdown)?.remove();
          }
        } else {
          const countdownTime = {
            days: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
            hours: Math.floor(timeLeft % (1000 * 60 * 60 * 24) / (1000 * 60 * 60)),
            minutes: Math.floor(timeLeft % (1000 * 60 * 60) / (1000 * 60)),
            seconds: Math.floor(timeLeft % (1000 * 60) / 1000)
          };
          document.querySelector(countdown).innerHTML = `OFFER ENDS IN ${formatCountdownString(countdownTime)}`;
        }
      }, 1000);
    }
  }
}
export {
  isOfferClosed as default
};

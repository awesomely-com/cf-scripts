onTwoClickUpsell({ elementsToHide: [], elementsToShow: [], ctas: [] });

function onTwoClickUpsell({
	elementsToHide = [],
	elementsToShow = [],
	ctas = [],
}) {
	if ((!elementsToHide.length && !elementsToShow.length) || !ctas.length)
		return;
	const hideElements = elementsToHide.map((el) => document.querySelector(el));
	const showElements = elementsToShow.map((el) => document.querySelector(el));
	const modalBackdrop = document.querySelector(".modalBackdropWrapper");
	const modalClose = document.querySelector(".closeLPModal");
	modalBackdrop.addEventListener("click", () =>
		onCloseModal(showElements, hideElements)
	);
	modalClose.addEventListener("click", () =>
		onCloseModal(showElements, hideElements)
	);

	const ctaElements = ctas.map((cta) => document.querySelector(cta));
	ctaElements.forEach((el) => {
		el.addEventListener("click", () => {
			if (hideElements.length > 0) {
				for (const element of hideElements) {
					element.style.display = "none";
				}
			}
			if (showElements.length > 0) {
				for (const element of showElements) {
					element.style.display = "block";
				}
			}
		});
	});
	return;
}

function onCloseModal(elementsToHide = [], elementsToShow = []) {
	if (elementsToHide.length > 0) {
		for (const element of elementsToHide) {
			element.style.display = "none";
		}
	}
	if (elementsToShow.length > 0) {
		for (const element of elementsToShow) {
			element.style.display = "block";
		}
	}
}

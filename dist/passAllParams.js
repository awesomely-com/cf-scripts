(function C() {
	let A = new URLSearchParams(window.location.search);
	if (!window.location.search) return;
	document.querySelectorAll("a[href]").forEach((j) => {
		try {
			let f = new URL(j.href, window.location.origin),
				q = new URLSearchParams(f.search);
			A.forEach((x, z) => {
				if (!q.has(z)) q.append(z, x);
			}),
				(f.search = q.toString()),
				(j.href = f.toString());
		} catch (f) {
			console.warn("Invalid URL in anchor:", j.href);
		}
	}),
		document.querySelectorAll("[data-imagelink]").forEach((j) => {
			try {
				let f = j.getAttribute("data-imagelink");
				if (!f) return;
				let q = new URL(f, window.location.origin),
					x = new URLSearchParams(q.search);
				A.forEach((z, B) => {
					if (!x.has(B)) x.append(B, z);
				}),
					(q.search = x.toString()),
					j.setAttribute("data-imagelink", q.toString());
			} catch (f) {
				console.warn(
					"Invalid data-imagelink URL:",
					j.getAttribute("data-imagelink")
				);
			}
		});
})();

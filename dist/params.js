document.addEventListener("DOMContentLoaded",()=>{const G=["utm_medium","utm_source","utm_campaign","utm_term","utm_content","fbclid","gclid","wbraid","cid","affiliate","utm_id","utm_click_id","cid","click_id"];function H(w){return new URLSearchParams(window.location.search).get(w)}const A={};if(G.forEach((w)=>{const j=H(w);if(j&&j!=="null")A[w]=j}),window.slForUrls)A.sl=window.slForUrls;function F(){const w=new URLSearchParams;for(let j in A)if(A.hasOwnProperty(j))w.append(j,A[j]);return w.toString()}document.querySelectorAll("a").forEach((w)=>{const j=w.getAttribute("href");if(j)try{const z=new URL(j,window.location.origin);z.searchParams.delete("utm_content");const B=F();if(B){const C=z.searchParams;new URLSearchParams(B).forEach((D,E)=>{C.append(E,D)}),z.search=C.toString()}w.setAttribute("href",z.toString())}catch(z){console.error("Invalid URL:",j)}}),document.querySelectorAll("img[data-imagelink]").forEach((w)=>{const j=w.getAttribute("data-imagelink");if(j)try{const z=new URL(j,window.location.origin);z.searchParams.delete("utm_content");const B=F();if(B){const C=z.searchParams;new URLSearchParams(B).forEach((D,E)=>{C.append(E,D)}),z.search=C.toString()}w.setAttribute("data-imagelink",z.toString())}catch(z){console.error("Invalid URL:",j)}})});

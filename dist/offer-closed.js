function i(o,e){if(!o)return;Object.assign(o.style,e)}function s(o){const e=new Date(o);if(isNaN(e.getTime()))throw new Error("Invalid date string");e.setUTCDate(e.getUTCDate()+1);let n=new Date().toLocaleString("en-US",{timeZone:"America/Los_Angeles"}).includes("PDT")?-8:-7;return e.setUTCMinutes(e.getUTCMinutes()+n*60*-1),e}function d(o){const{days:e,hours:a,minutes:n,seconds:l}=o;return[e&&`${e}D`,a&&`${a}H`,n&&`${n}M`,l&&`${l}S`].filter(Boolean).join(" : ")}function u(o){const a=new URLSearchParams(window.location.search).get("d"),{countdown:n,countdownContainer:l,banner:m}=o;if(a){document.querySelector(m)?.remove(),document.head.insertAdjacentHTML("beforeend",`<style>
				::backdrop {background: black;opacity: 0.75;}
				${n} {
					font-family: 'Open Sans', sans-serif;
					text-align: center;
					display: block;
					margin: 0 auto;
				}
				</style>`);const c=s(a).getTime();let t=c?c-new Date().getTime():0;if(t<=0){i(document.querySelector(l),{display:"none"}),document.body.style.overflowY="hidden";const r=document.createElement("dialog");i(r,{border:"none",padding:"3.5rem",justifyContent:"center",alignItems:"center",textAlign:"center",flexDirection:"column",display:"flex",gap:"1rem",margin:"auto",fontSize:"1.65rem"}),r.innerHTML=`
            <h2 style="font-size: 3rem; font-weight: 600; margin: 0">This offer has expired.</h2>
			<p style="margin: 0">
			<a href="mailto:support@awesomely.com" style="color:coral;">support@awesomely.com</a><br />
			(877) 224-0445
			</p>
			<p style="margin: 0">
			<b>Monday - Friday</b><br />
			9:00am - 5:00pm ET
			</p>
			`,document.body.appendChild(r),r.showModal()}else{i(document.querySelector(l),{display:"block"});const r=setInterval(()=>{if(t=t-1000,t<=0){if(r)clearInterval(r),document.querySelector(n)?.remove()}else{const f={days:Math.floor(t/86400000),hours:Math.floor(t%86400000/3600000),minutes:Math.floor(t%3600000/60000),seconds:Math.floor(t%60000/1000)};document.querySelector(n).innerHTML=`OFFER ENDS IN <b>${d(f)}</b>`}},1000)}}}export{u as default};

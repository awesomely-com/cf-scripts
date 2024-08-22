function a(o,e){if(!o)return;Object.assign(o.style,e)}function s(o){const e=new Date(o);if(isNaN(e.getTime()))throw new Error("Invalid date string");e.setUTCDate(e.getUTCDate()+1);let i=new Date().toLocaleString("en-US",{timeZone:"America/Los_Angeles"}).includes("PDT")?-8:-7;return e.setUTCMinutes(e.getUTCMinutes()+i*60*-1),e}function d(o){const{days:e,hours:r,minutes:i,seconds:l}=o;return[e&&`${e}D`,r&&`${r}H`,i&&`${i}M`,l&&`${l}S`].filter(Boolean).join(" : ")}function f(o){const e=new URLSearchParams(window.location.search),r=e.get("d"),i=e.get("utm_source"),{countdown:l,countdownContainer:c,banner:p}=o;if(r){document.querySelector(p)?.remove(),document.head.insertAdjacentHTML("beforeend",`<style>
				::backdrop {background: black;opacity: 0.75;}
				${l} {
					font-family: 'Open Sans', sans-serif;
					text-align: center;
					display: block;
					margin: 0 auto;
				}
				</style>`);const m=s(r).getTime();let n=m?m-new Date().getTime():0;if(n<=0){a(document.querySelector(c),{display:"none"}),document.body.style.overflowY="hidden";const t=document.createElement("dialog");a(t,{border:"none",padding:"24px",justifyContent:"center",alignItems:"center",textAlign:"center",flexDirection:"column",display:"flex",margin:"auto",fontSize:"18px",borderRadius:"12px",color:"#475467"}),t.innerHTML=`
			<p style="color:#D92D20;font-weight:700;margin:0 0 4px 0;font-size:14px;">OOPS! YOU JUST MISSED IT!</p>
            <h2 style="font-size:24px;font-weight:700;margin:0;color:#101828">This offer has expired.</h2>
			${i==="fandi"?"":`<p style="margin:16px 0 0;">
			<a href="mailto:support@awesomely.com" style="color:#1570EF;">support@awesomely.com</a><br />
			(877) 224-0445
			</p>
			<p style="margin:0;">
			Monday - Friday<br />
			9:00am - 5:00pm ET
			</p>`}
			`,document.body.appendChild(t),t.showModal()}else{a(document.querySelector(c),{display:"block"});const t=setInterval(()=>{if(n=n-1000,n<=0){if(t)clearInterval(t),document.querySelector(l)?.remove()}else{const u={days:Math.floor(n/86400000),hours:Math.floor(n%86400000/3600000),minutes:Math.floor(n%3600000/60000),seconds:Math.floor(n%60000/1000)};document.querySelector(l).innerHTML=`OFFER ENDS IN <b>${d(u)}</b>`}},1000)}}}export{f as default};

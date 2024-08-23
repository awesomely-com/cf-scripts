function a(o,e){if(!o)return;Object.assign(o.style,e)}function s(o){const e=new Date(o);if(isNaN(e.getTime()))throw new Error("Invalid date string");e.setUTCDate(e.getUTCDate()+1);let l=new Date().toLocaleString("en-US",{timeZone:"America/Los_Angeles"}).includes("PDT")?-8:-7;return e.setUTCMinutes(e.getUTCMinutes()+l*60*-1),e}function d(o){const{days:e,hours:r,minutes:l,seconds:i}=o;return[e&&`${e}D`,r&&`${r}H`,l&&`${l}M`,i&&`${i}S`].filter(Boolean).join(" : ")}function u(o){const e=new URLSearchParams(window.location.search),r=e.get("d"),l=e.get("utm_source"),{countdown:i,countdownContainer:c,banner:p}=o;if(r){document.querySelector(p)?.remove(),document.head.insertAdjacentHTML("beforeend",`<style>
				::backdrop {background: black;opacity: 0.75;}
				${i} {
					font-family: 'Open Sans', sans-serif;
					text-align: center;
					display: block;
					margin: 0 auto;
				}
				</style>`);const m=s(r).getTime();let n=m?m-new Date().getTime():0;if(n<=0){a(document.querySelector(c),{display:"none"}),document.body.style.overflowY="hidden";const t=document.createElement("dialog");a(t,{border:"none",padding:"24px",justifyContent:"center",alignItems:"center",textAlign:"center",flexDirection:"column",display:"flex",margin:"auto",fontSize:"18px",borderRadius:"12px",color:"#475467"}),t.innerHTML=`
			<img src="../assets/offer-closed.png" alt="Sad Face" role="presentation" style="margin-bottom:16px;" />
			<p style="color:#D92D20;font-weight:700;margin:0 0 4px 0;font-size:14px;">OOPS! YOU JUST MISSED IT!</p>
            <h2 style="font-size:24px;font-weight:700;margin:0;color:#101828">This offer has expired.</h2>
			${l==="fandi"?"":`<p style="margin:16px 0 0;">
			<a href="mailto:support@awesomely.com" style="color:#1570EF;">support@awesomely.com</a><br />
			(877) 224-0445
			</p>
			<p style="margin:0;">
			Monday - Friday<br />
			9:00am - 5:00pm ET
			</p>`}
			`,document.body.appendChild(t),t.showModal()}else{a(document.querySelector(c),{display:"block"});const t=setInterval(()=>{if(n=n-1000,n<=0){if(t)clearInterval(t),document.querySelector(i)?.remove()}else{const f={days:Math.floor(n/86400000),hours:Math.floor(n%86400000/3600000),minutes:Math.floor(n%3600000/60000),seconds:Math.floor(n%60000/1000)};document.querySelector(i).innerHTML=`OFFER ENDS IN <b>${d(f)}</b>`}},1000)}}}export{u as default};

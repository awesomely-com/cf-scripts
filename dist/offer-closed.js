function a(o,e){if(!o)return;Object.assign(o.style,e)}function d(o){const e=new Date(o);if(isNaN(e.getTime()))throw new Error("Invalid date string");e.setUTCDate(e.getUTCDate()+1);let i=new Date().toLocaleString("en-US",{timeZone:"America/Los_Angeles"}).includes("PDT")?-8:-7;return e.setUTCMinutes(e.getUTCMinutes()+i*60*-1),e}function m(o){const{days:e,hours:r,minutes:i,seconds:l}=o;return[e&&`${e}D`,r&&`${r}H`,i&&`${i}M`,l&&`${l}S`].filter(Boolean).join(" : ")}function f(o){const e=new URLSearchParams(window.location.search),r=e.get("d"),i=e.get("utm_source"),{countdown:l,countdownContainer:s,banner:p}=o;if(r){document.querySelector(p)?.remove(),document.head.insertAdjacentHTML("beforeend",`<style>
				::backdrop {background: black;opacity: 0.75;}
				${l} {
					font-family: 'Open Sans', sans-serif;
					text-align: center;
					display: block;
					margin: 0 auto;
				}
				</style>`);const c=d(r).getTime();let t=c?c-new Date().getTime():0;if(t<=0){a(document.querySelector(s),{display:"none"}),document.body.style.overflowY="hidden";const n=document.createElement("dialog");a(n,{border:"none",padding:"24px",justifyContent:"center",alignItems:"center",textAlign:"center",flexDirection:"column",display:"flex",margin:"auto",fontSize:"18px",borderRadius:"12px",color:"#475467"}),n.innerHTML=`
			<div
				style="
					padding: 12px;
					border-radius: 10px;
					width: 24px;
					height: 24px;
					display: flex;
					justify-content: center;
					align-items: center;
					border: 1px #eaecf0 solid;
					margin-bottom: 16px;
					box-shadow: 0px 1px 2px 0px rgba(16, 24, 40, 0.05);
				"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
				>
					<path
						d="M16 16C16 16 14.5 14 12 14C9.5 14 8 16 8 16M17 9.24C16.605 9.725 16.065 10 15.5 10C14.935 10 14.41 9.725 14 9.24M10 9.24C9.605 9.725 9.065 10 8.5 10C7.935 10 7.41 9.725 7 9.24M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
						stroke="#475467"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</div>
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
			`,document.body.appendChild(n),n.showModal()}else{a(document.querySelector(s),{display:"block"});const n=setInterval(()=>{if(t=t-1000,t<=0){if(n)clearInterval(n),document.querySelector(l)?.remove()}else{const u={days:Math.floor(t/86400000),hours:Math.floor(t%86400000/3600000),minutes:Math.floor(t%3600000/60000),seconds:Math.floor(t%60000/1000)};document.querySelector(l).innerHTML=`OFFER ENDS IN <b>${m(u)}</b>`}},1000)}}}export{f as default};

function X(q,G){if(!q)return;Object.assign(q.style,G)}function V(q){const G=new Date(q);if(isNaN(G.getTime()))throw new Error("Invalid date string");G.setUTCDate(G.getUTCDate()+1);let J=new Date().toLocaleString("en-US",{timeZone:"America/Los_Angeles"}).includes("PDT")?-8:-7;return G.setUTCMinutes(G.getUTCMinutes()+J*60*-1),G}function f(q){const{days:G,hours:j,minutes:J,seconds:K}=q;return[G&&`${G}D`,j&&`${j}H`,J&&`${J}M`,K&&`${K}S`].filter(Boolean).join(" : ")}function M(q){const G=q.replace("vidalytics_embed_","");(function(j,J,K,U,Y,R,W,Q,N){if(R="_"+K.toLowerCase(),Q=K+"L",!j[K])j[K]={};if(!j[Q])j[Q]={};if(!j[R])j[R]={};var $="Loader",D=j[R][$],x=j[Q][$+"Script"],H=j[Q][$+"Loaded"],T="Embed";if(!x)x=function(z,Z){if(W){Z();return}if(N=J.createElement("script"),N.type="text/javascript",N.async=1,N.src=z,N.readyState)N.onreadystatechange=function(){if(N.readyState==="loaded"||N.readyState=="complete")N.onreadystatechange=null,H=1,Z()};else N.onload=function(){H=1,Z()};J.getElementsByTagName("head")[0].appendChild(N)};x(Y+"loader.min.js",function(){if(!D){var z=j[Q][$];D=new z}D.loadScript(Y+"player.min.js",function(){var Z=j[K][T];W=new Z,W.run(U)})})})(window,document,"Vidalytics",`vidalytics_embed_${G}`,`https://quick.vidalytics.com/embeds/Y_1586Xh/${G}/`)}function _(q){const G=document.getElementById(q);G.style.display="block"}function A(q){if(!q)return;for(let G of q){const[j,J]=G;X(document.querySelector(j),J)}}function B(q,G){(function(j,J,K,U){j.getVidalyticsPlayer=(Y)=>{j[J]=j[J]||{},j[J][K]=j[J][K]||{};let R=j[J][K][Y]=j[J][K][Y]||{};return new Promise((W)=>{if(R[U])return void W(R[U]);let Q;Object.defineProperty(R,U,{get:()=>Q,set(N){Q=N,W(N)}})})}})(window,"_vidalytics","embeds","player"),getVidalyticsPlayer(q.embedId).then((j)=>{if(!j)return;if(k)j.on("play",()=>{L(q)}),j.on("pause",()=>{P(q)}),j.on("ended",()=>{P(q)}),j.on("unmute",()=>{L(q)});let J=!1;j.on("timeupdate",()=>{if(J)return;if(Math.floor(j.currentTime())>=q?.ctaTime)J=!0,A(G)})})}function L({elements:q}){document.querySelector(q?.row).style.setProperty("padding","0px","important"),document.querySelector(`${q?.row} div.col-inner`).style.setProperty("padding","0px","important"),X(document.querySelector(q?.headerContainer),{display:"none"}),X(document.querySelector(q?.bannerContainer),{display:"none"}),X(document.querySelector("#mobile_video"),{border:"none",borderRadius:"0",backgroundColor:"black",display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}),window.scroll({top:0})}function P({elements:q}){document.querySelector(q.headerContainer).style.display=null,document.querySelector(q.row).style.padding=null,document.querySelector(`${q?.row} div.col-inner`).removeAttribute("style"),document.querySelector("#mobile_video").removeAttribute("style")}function O(q){const G=document.createElement("button");G.innerText="Show CTA",X(G,{zIndex:999,position:"fixed",right:"2rem",top:"2rem",backgroundColor:"yellow",padding:"2px 4px",borderRadius:"0.5rem",fontSize:"16px"}),G.addEventListener("click",()=>{A(q)}),document.body.append(G)}var k=window.matchMedia("(max-width: 770px)").matches;function w(q){if(!q||typeof q!=="object")return;const{desktop:G,mobile:j,ctaElements:J}=q;if(window.location.host==="app.funnel-preview.com")O(J);if(document.querySelector("#desktop_video>div").id=G.embedId,j)document.querySelector("#mobile_video>div").id=j.embedId;if(k&&j)M(j?.embedId),_("mobile_video"),B(j,J);else M(G?.embedId),_("desktop_video"),B(G,J)}export{w as default};

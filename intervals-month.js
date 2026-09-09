"use strict";
(function(){
const PLAN=window.ROAD703_PLAN||[],KEY="road703-intervals-api-key",$=s=>document.querySelector(s);
const key=()=>localStorage.getItem(KEY)||"";
const rows=a=>a.join("\n");
function bike(w){
 const t=w.title,d=w.details;
 if(t.includes("Easy A"))return rows(["-10m 150w 85rpm","","3x",`-${w.minutes===45?5:10}m 170w 88rpm`,`-1m 160w 95rpm`,"","6x","-30s 180w 100rpm","-1m30s 160w 85rpm","",`-${w.minutes===45?5:5}m 145w 85rpm`]);
 if(t.includes("Easy B"))return rows(["-10m 150w 85rpm","","4x",`-${w.minutes===45?'2m30s':'4m30s'} 165w 85rpm`,`-${w.minutes===45?'2m30s':'4m30s'} 175w 90rpm`,"","5x","-20s 185w 105rpm","-1m40s 160w 85rpm","",`-${w.minutes===45?5:4}m 145w 85rpm`]);
 if(w.id==="p25")return rows(["-12m 165w 85rpm","","4x","-3m 273w 78rpm","-3m 273w 92rpm","-4m 165w 85rpm","","-5m 145w 85rpm"]);
 if(t.includes("Q4 scarico"))return rows(["-12m 165w 85rpm","","2x","-10m 239-247w 90rpm","-4m 165w 85rpm","","-8m 145w 85rpm"]);
 if(t.includes("Q2 sweet spot"))return rows(["-12m 165w 85rpm","","4x","-8m 264w 90rpm","-4m 165w 85rpm","","-8m 145w 85rpm"]);
 if(t.includes("Q2 recuperi ridotti"))return rows(["-12m 165w 85rpm","","4x","-8m 264w 90rpm","-3m 165w 85rpm","","-8m 145w 85rpm"]);
 if(t.includes("Lungo outdoor")){const mid=Math.max(0,w.minutes-40);return rows(["-20m 165-180w 85rpm","",`-${mid}m 180-205w 87rpm`,"-15m 205-218w 88rpm","","-5m easy"])}
 throw new Error(w.id+" "+t);
}
function run(w){
 const t=w.title;
 if(t.includes("Easy aerobica")){const z2=w.minutes-13;return rows(["-8m Z1 Pace","",`- Z2 ${z2}m 5.00-5.20 ${z2}m 78-83% Pace`,"","- 5m Z1 Pace"])}
 if(t.includes("Easy + tecnica")){const z2=w.minutes===40?20:25,n=w.minutes===40?4:5;return rows(["- Z1 10m 5.20-5.40 10m 74-78% Pace","",`- Z2 ${z2}m 4.55-5.20 ${z2}m 78-85% Pace`,"",`${n}x`,"- Fast 20s RPE7 Pace","- 1m Z1 Pace","","- Easy 5m 5m Z1 Pace"])}
 if(t.includes("Salite brevi"))return rows(["- 15m Z1 HR","","10x ","- Hill 40s RPE7 HR90-95 0m40s 90-95% HR","- 2m 65-75% HR","","-10m Z1 HR"]);
 if(t.includes("Progressivo di scarico"))return rows(["- Z1 10m 5.20-5.40 10m 74-78% Pace","- Z2 15m 4.55-5.20 15m 78-85% Pace","- Z3 5m 4.35-4.45 5m 88-91% Pace","- Easy 10m 10m Z1 Pace"]);
 if(t.includes("Fartlek scala"))return rows(["-15m Z1 Pace","","-1m Z3 Pace","-30s Z1 Pace","-2m Z3 Pace","-1m Z1 Pace","-3m Z3 Pace","-1m30s Z1 Pace","-4m Z3 Pace","-2m Z1 Pace","-3m Z3 Pace","-1m30s Z1 Pace","-2m Z3 Pace","-1m Z1 Pace","-1m Z3 Pace","-30s Z1 Pace","","-10m Z1 Pace"]);
 if(t.includes("Salite lunghe introduttive"))return rows(["-15m Z1 HR","","5x","-2m 90-95% HR","-4m 65-75% HR","","-10m Z1 HR"]);
 throw new Error(w.id+" "+t);
}
function swim(w){
 if(w.title.includes("Tecnica + aerobico"))return rows(["300 risc","","8x","50 tecnica","15'' rec","","8x","100 aerobico 1:58-2:02","20'' rec","","4x","50 progressivo","","200 sciolto"]);
 if(w.title.includes("CSS/70.3"))return rows(["400 risc","","4x","50 tecnica","15'' rec","","10x","100 CSS 1:52-1:56","20'' rec","","200 sciolto"]);
 throw new Error(w.id+" "+w.title);
}
function text(w){return w.sport==="bike"?bike(w):w.sport==="run"?run(w):swim(w)}
async function syncMonth(){
 const s=$("#intervalsStatus"),b=$("#syncIntervalsMonth"),k=key();if(!k){s.textContent="API Key Intervals.icu mancante.";return}
 const start=(()=>{const d=new Date(),base=new Date('2026-08-24T12:00:00');return Math.max(1,Math.min(40,Math.floor((d-base)/604800000)+1))})(),end=Math.min(40,start+3),ws=PLAN.filter(w=>w.week>=start&&w.week<=end&&["bike","run","swim"].includes(w.sport));
 if(b)b.disabled=true;s.textContent=`Validazione S${start}-S${end}...`;
 try{const events=ws.map(w=>({category:"WORKOUT",start_date_local:w.date+"T00:00:00",name:"Road to 70.3 | "+w.title,type:w.sport==="run"?"Run":w.sport==="swim"?"Swim":"Ride",description:text(w),external_id:"road703-"+w.id}));const r=await fetch("https://intervals.icu/api/v1/athlete/0/events/bulk?upsert=true",{method:"POST",headers:{Authorization:"Basic "+btoa("API_KEY:"+k),Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(events)}),body=await r.text();if(!r.ok)throw new Error(`HTTP ${r.status}${body?" · "+body.slice(0,180):""}`);s.textContent=`Mese sincronizzato: S${start}-S${end}, ${events.length} allenamenti. Forza e riposo esclusi.`}catch(e){s.textContent="Sincronizzazione mese annullata: "+e.message}finally{if(b)b.disabled=false}
}
function init(){const b=$("#syncIntervalsMonth");if(b)b.onclick=syncMonth}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

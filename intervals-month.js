"use strict";
(function(){
  const PLAN=window.ROAD703_PLAN||[];
  const KEY="road703-intervals-api-key";
  const $=s=>document.querySelector(s);
  const lines=a=>a.join("\n");
  function bike(w){
    const t=w.title||"";
    if(t.includes("Easy A")) return lines(["-10m 150w 85rpm","","3x",`-${w.minutes===45?5:10}m 170w 88rpm`,"-1m 160w 95rpm","","6x","-30s 180w 100rpm","-1m30s 160w 85rpm","","-5m 145w 85rpm"]);
    if(t.includes("Easy B")) return lines(["-10m 150w 85rpm","","4x",`-${w.minutes===45?"2m30s":"4m30s"} 165w 85rpm`, `-${w.minutes===45?"2m30s":"4m30s"} 175w 90rpm`,"","5x","-20s 185w 105rpm","-1m40s 160w 85rpm","",`-${w.minutes===45?5:4}m 145w 85rpm`]);
    if(t.includes("Q1 progressione cadenza")) return lines(["-12m 165w 85rpm","","4x","-3m 273w 78rpm","-3m 273w 92rpm","-4m 165w 85rpm","","-5m 145w 85rpm"]);
    if(t.includes("Q4 scarico")) return lines(["-12m 165w 85rpm","","2x","-10m 239-247w 90rpm","-4m 165w 85rpm","","-8m 145w 85rpm"]);
    if(t.includes("Q2 sweet spot")) return lines(["-12m 165w 85rpm","","4x","-8m 264w 90rpm","-4m 165w 85rpm","","-8m 145w 85rpm"]);
    if(t.includes("Q2 recuperi ridotti")) return lines(["-12m 165w 85rpm","","4x","-8m 264w 90rpm","-3m 165w 85rpm","","-8m 145w 85rpm"]);
    if(t.includes("Lungo outdoor")){const middle=Math.max(0,w.minutes-40);return lines(["-20m 165-180w 85rpm","",`-${middle}m 180-205w 87rpm`,"-15m 205-218w 88rpm","","-5m easy"])}
    throw new Error(`${w.id} ${t}`);
  }
  function run(w){
    const t=w.title||"";
    if(t.includes("Easy aerobica")){const z2=w.minutes-13;return lines(["-8m Z1 Pace","",`- Z2 ${z2}m 5.00-5.20 ${z2}m 78-83% Pace`,"","- 5m Z1 Pace"])}
    if(t.includes("Easy + tecnica")){const z2=w.minutes===40?20:25,n=w.minutes===40?4:5;return lines(["- Z1 10m 5.20-5.40 10m 74-78% Pace","",`- Z2 ${z2}m 4.55-5.20 ${z2}m 78-85% Pace`,"",`${n}x`,"- Fast 20s RPE7 Pace","- 1m Z1 Pace","","- Easy 5m 5m Z1 Pace"])}
    if(t.includes("Salite brevi")) return lines(["- 15m Z1 HR","","10x ","- Hill 40s RPE7 HR90-95 0m40s 90-95% HR","- 2m 65-75% HR","","-10m Z1 HR"]);
    if(t.includes("Progressivo di scarico")) return lines(["- Z1 10m 5.20-5.40 10m 74-78% Pace","- Z2 15m 4.55-5.20 15m 78-85% Pace","- Z3 5m 4.35-4.45 5m 88-91% Pace","- Easy 10m 10m Z1 Pace"]);
    if(t.includes("Fartlek scala")) return lines(["-15m Z1 Pace","","-1m Z3 Pace","-30s Z1 Pace","-2m Z3 Pace","-1m Z1 Pace","-3m Z3 Pace","-1m30s Z1 Pace","-4m Z3 Pace","-2m Z1 Pace","-3m Z3 Pace","-1m30s Z1 Pace","-2m Z3 Pace","-1m Z1 Pace","-1m Z3 Pace","-30s Z1 Pace","","-10m Z1 Pace"]);
    if(t.includes("Salite lunghe introduttive")) return lines(["-15m Z1 HR","","5x","-2m 90-95% HR","-4m 65-75% HR","","-10m Z1 HR"]);
    throw new Error(`${w.id} ${t}`);
  }
  function swim(w){
    if((w.title||"").includes("Tecnica + aerobico")) return lines(["300 risc","","8x","50 tecnica","15'' rec","","8x","100 aerobico 1:58-2:02","20'' rec","","4x","50 progressivo","","200 sciolto"]);
    if((w.title||"").includes("CSS/70.3")) return lines(["400 risc","","4x","50 tecnica","15'' rec","","10x","100 CSS 1:52-1:56","20'' rec","","200 sciolto"]);
    throw new Error(`${w.id} ${w.title}`);
  }
  function workoutText(w){return w.sport==="bike"?bike(w):w.sport==="run"?run(w):swim(w)}
  async function syncMonth(){
    const status=$("#intervalsStatus"),button=$("#syncIntervalsMonth"),apiKey=localStorage.getItem(KEY)||"";
    if(!apiKey){if(status)status.textContent="API Key Intervals.icu mancante.";return}
    const base=new Date("2026-08-24T12:00:00"),today=new Date();
    const first=Math.max(1,Math.min(40,Math.floor((today-base)/604800000)+1)),last=Math.min(40,first+3);
    const workouts=PLAN.filter(w=>w.week>=first&&w.week<=last&&["bike","run","swim"].includes(w.sport));
    if(button)button.disabled=true;if(status)status.textContent=`Validazione settimane S${first}-S${last}...`;
    try{
      const events=workouts.map(w=>({category:"WORKOUT",start_date_local:w.date+"T00:00:00",name:"Road to 70.3 | "+w.title,type:w.sport==="run"?"Run":w.sport==="swim"?"Swim":"Ride",description:workoutText(w),external_id:"road703-"+w.id}));
      const response=await fetch("https://intervals.icu/api/v1/athlete/0/events/bulk?upsert=true",{method:"POST",headers:{Authorization:"Basic "+btoa("API_KEY:"+apiKey),Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(events)});
      const body=await response.text();if(!response.ok)throw new Error(`HTTP ${response.status}${body?" · "+body.slice(0,180):""}`);
      if(status)status.textContent=`Mese attivo sincronizzato: S${first}-S${last}, ${events.length} allenamenti. Forza e riposo esclusi.`;
    }catch(error){if(status)status.textContent="Sincronizzazione mese annullata: "+error.message}finally{if(button)button.disabled=false}
  }
  function init(){
    let button=$("#syncIntervalsMonth");
    if(!button){
      const anchor=$("#syncIntervalsWeek")||$("#syncIntervalsTest");
      if(anchor){
        button=document.createElement("button");
        button.id="syncIntervalsMonth";
        button.className="primary wide";
        button.textContent="Sincronizza mese attivo (settimana corrente + 3)";
        anchor.insertAdjacentElement("afterend",button);
      }
    }
    if(button)button.onclick=syncMonth;
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();

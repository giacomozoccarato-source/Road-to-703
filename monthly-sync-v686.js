"use strict";
(function(){
  const PLAN=window.ROAD703_PLAN||[];
  const $=s=>document.querySelector(s);
  const rows=a=>a.join("\n");
  const keyName="road703-intervals-api-key";

  function bikeText(w){
    const t=w.title||"";
    if(t.includes("Rulli facili | Easy A")) return rows(["-10m 150w 85rpm","","3x",`-${w.minutes===45?5:10}m 170w 88rpm`,"-1m 160w 95rpm","","6x","-30s 180w 100rpm","-1m30s 160w 85rpm","","-5m 145w 85rpm"]);
    if(t.includes("Rulli facili | Easy B")) return rows(["-10m 150w 85rpm","","4x",`-${w.minutes===45?"2m30s":"4m30s"} 165w 85rpm`,`-${w.minutes===45?"2m30s":"4m30s"} 175w 90rpm`,"","5x","-20s 185w 105rpm","-1m40s 160w 85rpm","",`-${w.minutes===45?5:4}m 145w 85rpm`]);
    if(t.includes("Q1 progressione cadenza")) return rows(["-12m 165w 85rpm","","4x","-3m 273w 78rpm","-3m 273w 92rpm","-4m 165w 85rpm","","-5m 145w 85rpm"]);
    if(t.includes("Q4 scarico")) return rows(["-12m 165w 85rpm","","2x","-10m 239-247w 90rpm","-4m 165w 85rpm","","-8m 145w 85rpm"]);
    if(t.includes("Q2 sweet spot")) return rows(["-12m 165w 85rpm","","4x","-8m 264w 90rpm","-4m 165w 85rpm","","-8m 145w 85rpm"]);
    if(t.includes("Q2 recuperi ridotti")) return rows(["-12m 165w 85rpm","","4x","-8m 264w 90rpm","-3m 165w 85rpm","","-8m 145w 85rpm"]);
    if(t.includes("Lungo outdoor")){const middle=Math.max(0,Number(w.minutes)-40);return rows(["-20m 165-180w 85rpm","",`-${middle}m 180-205w 87rpm`,"-15m 205-218w 88rpm","","-5m easy"])}
    throw new Error(`${w.id} ${t}`);
  }

  function runText(w){
    const t=w.title||"";
    if(t.includes("Easy aerobica")){const z2=Math.max(1,Number(w.minutes)-13);return rows(["-8m Z1 Pace","",`- Z2 ${z2}m 5.00-5.20 ${z2}m 78-83% Pace`,"","- 5m Z1 Pace"])}
    if(t.includes("Easy + tecnica")){const core=Math.max(1,Number(w.minutes)-20),reps=Number(w.minutes)<=40?4:5;return rows(["- Z1 10m 5.20-5.40 10m 74-78% Pace","",`- Z2 ${core}m 4.55-5.20 ${core}m 78-85% Pace`,"",`${reps}x`,"- Fast 20s RPE7 Pace","- 1m Z1 Pace","","- Easy 5m 5m Z1 Pace"])}
    if(t.includes("Salite brevi")) return rows(["- 15m Z1 HR","","10x","- Hill 40s RPE7 HR90-95 0m40s 90-95% HR","- 2m 65-75% HR","","-10m Z1 HR"]);
    if(t.includes("Progressivo")) return rows(["- Z1 10m 5.20-5.40 10m 74-78% Pace","- Z2 15m 4.55-5.20 15m 78-85% Pace","- Z3 5m 4.35-4.45 5m 88-91% Pace","- Easy 10m 10m Z1 Pace"]);
    if(t.includes("Fartlek breve Z3")) return rows(["-15m Z1 Pace","","8x","-2m Z3 Pace","-2m Z1 Pace","","-8m Z1 Pace"]);
    if(t.includes("Fartlek scala")) return rows(["-15m Z1 Pace","","-1m Z3 Pace","-30s Z1 Pace","-2m Z3 Pace","-1m Z1 Pace","-3m Z3 Pace","-1m30s Z1 Pace","-4m Z3 Pace","-2m Z1 Pace","-3m Z3 Pace","-1m30s Z1 Pace","-2m Z3 Pace","-1m Z1 Pace","-1m Z3 Pace","-30s Z1 Pace","","-10m Z1 Pace"]);
    if(t.includes("Salite lunghe introduttive")) return rows(["-15m Z1 HR","","5x","-2m 90-95% HR","-4m 65-75% HR","","-10m Z1 HR"]);
    throw new Error(`${w.id} ${t}`);
  }

  function swimText(w){
    const t=w.title||"";
    if(t.includes("Tecnica + aerobico")) return rows(["300 risc","","8x","50 tecnica","15'' rec","","8x","100 aerobico 1:58-2:02","20'' rec","","4x","50 progressivo","","200 sciolto"]);
    if(t.includes("CSS/70.3")) return rows(["400 risc","","4x","50 tecnica","15'' rec","","10x","100 CSS 1:52-1:56","20'' rec","","200 sciolto"]);
    throw new Error(`${w.id} ${t}`);
  }

  function workoutText(w){return w.sport==="bike"?bikeText(w):w.sport==="run"?runText(w):swimText(w)}
  function workoutType(w){return w.sport==="run"?"Run":w.sport==="swim"?"Swim":"Ride"}
  function monthLabel(value){const [y,m]=value.split("-");return new Intl.DateTimeFormat("it-IT",{month:"long",year:"numeric"}).format(new Date(Number(y),Number(m)-1,1))}

  async function syncSelectedMonth(){
    const status=$("#intervalsStatus"),button=$("#syncIntervalsMonth");
    const today=new Date(),planStart=new Date("2026-08-24T12:00:00"),cw=Math.max(1,Math.min(40,Math.floor((today-planStart)/604800000)+1)),lastWeek=Math.min(40,cw+3);
    const apiKey=($("#intervalsApiKey")?.value||localStorage.getItem(keyName)||"").trim();
    if(!apiKey){if(status)status.textContent="API Key Intervals.icu mancante.";return}
    const workouts=PLAN.filter(w=>w.week>=cw&&w.week<=lastWeek&&["bike","run","swim"].includes(w.sport));
    if(!workouts.length){if(status)status.textContent="Nessun allenamento nelle 4 settimane selezionate.";return}
    if(button)button.disabled=true;if(status)status.textContent=`Validazione settimane ${cw}-${lastWeek}...`;
    try{
      const events=workouts.map(w=>({category:"WORKOUT",start_date_local:w.date+"T00:00:00",name:"Road to 70.3 | "+w.title,type:workoutType(w),description:workoutText(w),external_id:"road703-"+w.id}));
      const response=await fetch("https://intervals.icu/api/v1/athlete/0/events/bulk?upsert=true",{method:"POST",headers:{Authorization:"Basic "+btoa("API_KEY:"+apiKey),Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(events)});
      const body=await response.text();if(!response.ok)throw new Error(`HTTP ${response.status}${body?" | "+body.slice(0,180):""}`);
      if(status)status.textContent=`Settimane ${cw}-${lastWeek} sincronizzate: ${events.length} allenamenti. Forza e riposo esclusi.`;
    }catch(error){if(status)status.textContent="Sincronizzazione 4 settimane annullata: "+error.message}finally{if(button)button.disabled=false}
  }
  function init(){
    const button=$("#syncIntervalsMonth");
    if(button)button.onclick=syncSelectedMonth;
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();

"use strict";
(function(){
  const PLAN=window.ROAD703_PLAN||[];
  const $=s=>document.querySelector(s);
  const KEY="road703-intervals-api-key";
  const API="https://intervals.icu/api/v1/athlete/0/events/bulk?upsert=true";
  const rows=a=>a.join("\n");

  function typeOf(w){return w.sport==="run"?"Run":w.sport==="swim"?"Swim":"Ride"}
  function monthLabel(v){const [y,m]=v.split("-");return new Intl.DateTimeFormat("it-IT",{month:"long",year:"numeric"}).format(new Date(+y,+m-1,1))}
  function bike(w){
    const t=w.title||"", d=w.details||"";
    if(t.includes("Easy A"))return rows(["-10m 150w 85rpm","","3x",`-${w.minutes===45?5:10}m 170w 88rpm`,"-1m 160w 95rpm","","6x","-30s 180w 100rpm","-1m30s 160w 85rpm","","-5m 145w 85rpm"]);
    if(t.includes("Easy B"))return rows(["-10m 150w 85rpm","","4x",`-${w.minutes===45?"2m30s":"4m30s"} 165w 85rpm`,`-${w.minutes===45?"2m30s":"4m30s"} 175w 90rpm`,"","5x","-20s 185w 105rpm","-1m40s 160w 85rpm","",`-${w.minutes===45?5:4}m 145w 85rpm`]);
    if(t.includes("Lungo outdoor")){const middle=Math.max(1,+w.minutes-40);return rows(["-20m 165-180w 85rpm",`-${middle}m 180-205w 87rpm`,"-15m 205-218w 88rpm","-5m easy"])}
    if(t.includes("Q1 progressione cadenza"))return rows(["-12m 165w 85rpm","","4x","-3m 273w 78rpm","-3m 273w 92rpm","-4m 165w 85rpm","","-5m 145w 85rpm"]);
    return d || `${w.minutes}m ${w.target||""}`;
  }
  function run(w){
    const t=w.title||"", d=w.details||"";
    if(t.includes("Easy aerobica")){const z2=Math.max(1,+w.minutes-13);return rows(["-8m Z1 Pace",`- Z2 ${z2}m 5.00-5.20 ${z2}m 78-83% Pace","-5m Z1 Pace"])}
    if(t.includes("Easy + tecnica")){const core=Math.max(1,+w.minutes-20),reps=+w.minutes<=40?4:5;return rows(["- Z1 10m 5.20-5.40 10m 74-78% Pace",`- Z2 ${core}m 4.55-5.20 ${core}m 78-85% Pace`,`${reps}x`,"- Fast 20s RPE7 Pace","-1m Z1 Pace","- Easy 5m 5m Z1 Pace"])}
    if(t.includes("Salite brevi"))return rows(["-15m Z1 HR","","10x","- Hill 40s RPE7 90-95% HR","-2m 65-75% HR","","-10m Z1 HR"]);
    if(t.includes("Progressivo"))return rows(["-10m Z1 Pace","-15m Z2 Pace","-5m Z3 Pace","-10m Z1 Pace"]);
    return d || `${w.minutes}m ${w.target||""}`;
  }
  function swim(w){return w.details||`${w.minutes}m ${w.target||"Nuoto"}`}
  function textOf(w){return w.sport==="bike"?bike(w):w.sport==="run"?run(w):swim(w)}
  function auth(){const key=($("#intervalsApiKey")?.value||localStorage.getItem(KEY)||"").trim();if(!key)throw new Error("API Key Intervals.icu mancante");return "Basic "+btoa("API_KEY:"+key)}
  function monthWorkouts(month){return PLAN.filter(w=>w.date&&w.date.startsWith(month)&&["bike","run","swim"].includes(w.sport))}
  function validate(ws){const errors=[];ws.forEach(w=>{if(!w.id||!w.date||!w.title)errors.push(`${w.id||"senza ID"}: dati mancanti`);try{if(!textOf(w).trim())errors.push(`${w.id}: descrizione vuota`)}catch(e){errors.push(`${w.id}: ${e.message}`)}});return errors}
  async function syncMonth(){
    const status=$("#intervalsStatus"),button=$("#syncIntervalsMonth"),month=$("#intervalsMonth")?.value;
    if(!month){status.textContent="Seleziona il mese.";return}
    const ws=monthWorkouts(month),errors=validate(ws);
    if(!ws.length){status.textContent="Nessun allenamento nel mese selezionato.";return}
    if(errors.length){status.textContent="Invio annullato. "+errors.join(" | ");return}
    button.disabled=true;status.textContent=`Invio ${monthLabel(month)}: ${ws.length} allenamenti...`;
    try{
      const events=ws.map(w=>({category:"WORKOUT",start_date_local:w.date+"T00:00:00",name:"Road to 70.3 | "+w.title,type:typeOf(w),description:textOf(w),external_id:"road703-"+w.id}));
      localStorage.setItem(KEY,$("#intervalsApiKey").value.trim());
      const r=await fetch(API,{method:"POST",headers:{Authorization:auth(),Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(events)});
      const body=await r.text();if(!r.ok)throw new Error(`HTTP ${r.status}${body?" · "+body.slice(0,240):""}`);
      status.textContent=`${monthLabel(month)} sincronizzato: ${events.length} allenamenti. Riposo e forza esclusi. Rilanciando, gli stessi external_id vengono aggiornati.`;
    }catch(e){status.textContent="Sincronizzazione non riuscita: "+e.message}
    finally{button.disabled=false}
  }
  function mount(){
    const host=$("#screen-import");if(!host||$("#intervalsPanel"))return;
    const months=[...new Set(PLAN.map(w=>w.date?.slice(0,7)).filter(Boolean))].sort();
    const now=new Date(),localMonth=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    const panel=document.createElement("div");panel.id="intervalsPanel";panel.className="panel syncPanel";
    panel.innerHTML='<div class="sectionHead"><div><small>INTERVALS.ICU</small><h2>Sincronizzazione mensile</h2></div></div><label class="fieldLabel">API Key<input id="intervalsApiKey" type="password" autocomplete="off"></label><label class="fieldLabel">Mese da sincronizzare<input id="intervalsMonth" type="month"></label><button id="syncIntervalsMonth" class="primary wide">Sincronizza mese selezionato</button><div id="intervalsStatus" class="note">Forza e riposo non vengono inviati. La sincronizzazione usa external_id stabili per aggiornare senza duplicare.</div>';
    host.appendChild(panel);
    $("#intervalsApiKey").value=localStorage.getItem(KEY)||"";
    const m=$("#intervalsMonth");m.min=months[0]||"";m.max=months.at(-1)||"";m.value=months.includes(localMonth)?localMonth:(months[0]||localMonth);
    $("#syncIntervalsMonth").onclick=syncMonth;
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();

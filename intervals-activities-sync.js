"use strict";
(function(){
 const KEY='road703-intervals-api-key', LAST='road703-intervals-activities-last-sync';
 const $=s=>document.querySelector(s);
 const iso=d=>d.toISOString().slice(0,10);
 const n=(v,...fallbacks)=>{for(const x of [v,...fallbacks]){const y=Number(x);if(Number.isFinite(y))return y}return null};
 function sport(v,x={}){const s=[v,x.type,x.sport_type,x.activity_type,x.category,x.name,x.title,x.source,x.device_name].filter(Boolean).join(' ').toLowerCase();if(/ride|cycling|ciclismo|bike|biking|virtual.?ride|indoor.?cycling|indoor.?bike|trainer|rulli|zwift|rouvy|mywhoosh|wahoo|tacx|mtb/.test(s))return'bike';if(/run|running|trail|corsa/.test(s))return'run';if(/swim|swimming|nuoto/.test(s))return'swim';if(/weight|strength|gym|workout|forza/.test(s))return'strength';const watts=n(x.average_watts,x.avg_power,x.average_power,x.weighted_average_watts,x.normalized_power,x.np,x.max_watts,x.max_power);if(watts!=null&&watts>0)return'bike';return'other'}
 function normalize(x){
  const sid=String(x.id??x.activity_id??x.external_id??'');
  const start=x.start_date_local||x.start_date||x.start_time||x.date||x.local_start_date;
  const date=String(start||'').slice(0,10);
  const seconds=n(x.moving_time,x.elapsed_time,x.duration,x.duration_seconds);
  const minutes=seconds!=null?(seconds>1000?seconds/60:seconds):n(x.minutes)||0;
  const meters=n(x.distance,x.distance_meters,x.distance_metres);
  const km=meters!=null?(meters>500?meters/1000:meters):n(x.distance_km)||0;
  const type=x.type||x.sport_type||x.activity_type||x.category;
  const rpe=n(x.icu_rpe,x.rpe,x.session_rpe);
  const load=n(x.icu_training_load,x.training_load,x.load);
  return{id:'intervals:'+sid,source:'intervals',sourceActivityId:sid,sourceExternalId:x.external_id||null,sourceProvider:x.source||x.device_name||null,sourceUpdatedAt:x.updated_at||x.last_modified||null,date,startTime:String(start||'').slice(11,19),sport:sport(type,x),title:x.name||x.title||'Attività Intervals',minutes:Math.round(minutes*10)/10,distanceKm:Math.round(km*1000)/1000,avgHr:n(x.average_heartrate,x.avg_hr,x.average_hr),maxHr:n(x.max_heartrate,x.max_hr),avgPower:n(x.average_watts,x.avg_power,x.average_power),normalizedPower:n(x.weighted_average_watts,x.normalized_power,x.np),maxPower:n(x.max_watts,x.max_power),rpe,load,intervalsLoad:load,rawIntervals:{type,source:x.source||null}};
 }
 async function fetchActivities(){
  const key=localStorage.getItem(KEY);if(!key)throw new Error('Salva prima la API Key Intervals.icu.');
  const now=new Date(),from=new Date(now);from.setDate(from.getDate()-30);
  /* V83: full 30-day rescan every time; deduplication is handled by activity id. */
  const url=`https://intervals.icu/api/v1/athlete/0/activities?oldest=${iso(from)}&newest=${iso(now)}`;
  const res=await fetch(url,{headers:{Authorization:'Basic '+btoa('API_KEY:'+key),Accept:'application/json'}});
  if(!res.ok){if(res.status===401)throw new Error('API Key Intervals non valida.');if(res.status===403)throw new Error('Intervals non consente la lettura delle attività.');if(res.status===429)throw new Error('Limite API Intervals raggiunto.');throw new Error(`Errore Intervals ${res.status}.`)}
  const body=await res.json();const arr=Array.isArray(body)?body:(body.activities||body.data||[]);const normalized=arr.map(normalize);window.ROAD703_INTERVALS_LAST_RAW={count:arr.length,types:[...new Set(arr.map(x=>String(x.type||x.sport_type||x.activity_type||x.category||'senza tipo')))],normalized:normalized.length,importable:normalized.filter(a=>a.sourceActivityId&&a.date&&a.sport!=='other').length};return normalized.filter(a=>a.sourceActivityId&&a.date&&a.sport!=='other');
 }
 function renderSummary(r){const el=$('#intervalsActivitiesStatus');if(!el)return;const raw=window.ROAD703_INTERVALS_LAST_RAW||{},rides=(r.details||[]).filter(x=>x.sport==='bike');window.ROAD703_INTERVALS_LAST_RESULT=r;el.innerHTML=`<b>Sincronizzazione completata</b><br>API Intervals: ${raw.count??r.received} attività · Importabili: ${raw.importable??r.received}<br>Tipi: ${(raw.types||[]).join(', ')||'nessuno'}<br>Ricevute: ${r.received} · Nuove: ${r.created} · Aggiornate: ${r.updated}<br>Associate: ${r.matched} · Da controllare: ${r.review} · Duplicate: ${r.duplicates}<br><b>Dettaglio bici (${rides.length})</b>${rides.length?rides.map(x=>`<br>${x.date} · ${x.title} · ${Math.round(x.minutes||0)} min · ${x.stored?'salvata':'NON salvata'} · ${x.matched?'associata a '+x.matched:'non associata'} · ${x.matchMethod||'nessun match'}`).join(''):'<br>Nessuna bici ricevuta.'}`}
 async function sync(){const b=$('#syncIntervalsActivities');if(b)b.disabled=true;const s=$('#intervalsActivitiesStatus');if(s)s.textContent='Lettura attività da Intervals.icu…';try{const items=await fetchActivities();if(!window.ROAD703_APP?.importIntervalsActivities)throw new Error('Modulo Road703 non disponibile.');const r=window.ROAD703_APP.importIntervalsActivities(items);localStorage.setItem(LAST,new Date().toISOString());renderSummary({...r,received:items.length})}catch(e){if(s)s.textContent='Sincronizzazione non completata: '+e.message}finally{if(b)b.disabled=false}}
 function init(){const b=$('#syncIntervalsActivities');if(b)b.onclick=sync;const l=$('#intervalsActivitiesLastSync');if(l){const v=localStorage.getItem(LAST);l.textContent=v?'Ultima sincronizzazione: '+new Date(v).toLocaleString('it-IT'):'Prima sincronizzazione: verranno letti gli ultimi 30 giorni.'}}
 window.ROAD703_INTERVALS_ACTIVITIES={sync,fetchActivities};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();

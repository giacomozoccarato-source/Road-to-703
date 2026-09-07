"use strict";
(function(){
const APP_VERSION=(window.ROAD703_CONFIG&&window.ROAD703_CONFIG.APP_VERSION)||"DEV";
const firebaseConfig={apiKey:"AIzaSyDJtvH6eTLoXyT3a7d-awm69o2BUImvQaY",authDomain:"road703-3235b.firebaseapp.com",projectId:"road703-3235b",storageBucket:"road703-3235b.firebasestorage.app",messagingSenderId:"208181077306",appId:"1:208181077306:web:f4da7d76e3408eda5d1c03"};
let user=null,unsubscribe=null,timer=null,applying=false,booting=true;
function emit(status,title,description){window.dispatchEvent(new CustomEvent("road703-sync-status",{detail:{status,title,description,loggedIn:!!user}}))}
try{firebase.initializeApp(firebaseConfig)}catch(e){if(!/already exists/i.test(String(e&&e.message)))throw e}
const auth=firebase.auth(),db=firebase.firestore(),provider=new firebase.auth.GoogleAuthProvider();
function ref(){return user?db.collection("users").doc(user.uid).collection("road703").doc("state"):null}
function parseCloud(x){if(!x)return{};if(typeof x.stateJson==="string"){try{return JSON.parse(x.stateJson)}catch(e){return{}}}return x.state||{}}
function uniq(x){const s=new Set();return(x||[]).filter(v=>{const k=JSON.stringify(v);if(s.has(k))return false;s.add(k);return true})}
function n(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(v\d+|debug|offline|garmin|csv|fit)\b/g,' ').replace(/\.[a-z0-9]{2,5}$/,'').replace(/[^a-z0-9]+/g,' ').trim()}
function hint(a){const t=n([a&&a.fileName,a&&a.title].filter(Boolean).join(' '));if(/(^| )(forza|strength|pesi|gym)( |$)/.test(t))return'strength';if(/(^| )(nuoto|swim|pool)( |$)/.test(t))return'swim';if(/(^| )(corsa|running|run)( |$)/.test(t))return'run';if(/(^| )(bici|bike|cycling|rulli|magneticdays)( |$)/.test(t))return'bike';return a.sport||'other'}
function akey(a){a.sport=hint(a);return[a.date||'',a.sport,n(a.fileName||a.title||''),Math.round((Number(a.minutes)||0)*10)/10].join('|')}
function dedupeActivities(xs){const m=new Map();(xs||[]).forEach(a=>{if(!a||!a.id)return;const k=akey(a),o=m.get(k),qa=Object.keys(a).length+(a.rpe?10:0),qo=o?Object.keys(o).length+(o.rpe?10:0):-1;if(!o||qa>qo)m.set(k,a)});return[...m.values()]}

function merge(c={},l={}){const d=new Set([...(c.deletedActivityIds||[]),...(l.deletedActivityIds||[])]),m=new Map();[...(c.activities||[]),...(l.activities||[])].forEach(a=>{if(a&&a.id&&!d.has(a.id))m.set(a.id,a)});const cp=new Map((c.plan||[]).map(x=>[x.id,x])),lp=new Map((l.plan||[]).map(x=>[x.id,x])),ids=new Set([...cp.keys(),...lp.keys()]);const plan=[...ids].map(id=>{const a=cp.get(id)||{},b=lp.get(id)||{};let o=b.actual&&m.has(b.actual)?{...a,...b}:a.actual&&m.has(a.actual)?{...b,...a}:{...a,...b};if(o.actual&&!m.has(o.actual)){delete o.actual;o.status="planned"}return o});return{activities:dedupeActivities([...m.values()]),deletedActivityIds:[...d],imports:uniq([...(c.imports||[]),...(l.imports||[])]),plan}}
async function saveNow(local){if(!user||applying||booting||!local)return;emit("syncing","Sincronizzazione...","Aggiornamento cloud.");await db.runTransaction(async tx=>{const r=ref(),s=await tx.get(r),cloud=s.exists?parseCloud(s.data()):{},merged=merge(cloud,local);tx.set(r,{stateJson:JSON.stringify(merged),updatedAt:firebase.firestore.FieldValue.serverTimestamp(),appVersion:APP_VERSION})});emit("synced","Dati sincronizzati",user.email||"")}
function queueSave(local){clearTimeout(timer);timer=setTimeout(()=>saveNow(local).catch(e=>emit("error","Errore sincronizzazione",String(e.message||e))),900)}
async function start(u){user=u;booting=true;emit("connecting","Collegamento...","Confronto dati.");const r=ref(),s=await r.get(),cloud=s.exists?parseCloud(s.data()):{};if(Array.isArray(cloud.activities))window.ROAD703_APP.applyRemoteState(cloud);booting=false;await saveNow(window.ROAD703_APP.getState());unsubscribe=r.onSnapshot(s=>{if(!s.exists||s.metadata.hasPendingWrites)return;const remote=parseCloud(s.data());if(!Array.isArray(remote.activities))return;applying=true;try{window.ROAD703_APP.applyRemoteState(remote);emit("synced","Dati sincronizzati",user.email||"")}finally{applying=false}},e=>emit("error","Errore sincronizzazione",String(e.message||e)))}
auth.onAuthStateChanged(u=>{if(unsubscribe){unsubscribe();unsubscribe=null}if(u)start(u).catch(e=>{booting=false;emit("error","Collegamento non riuscito",String(e.message||e))});else{user=null;booting=true;emit("offline","Cloud non collegato","Accedi con lo stesso account Google.")}});
window.ROAD703_FIREBASE={queueSave,login:()=>auth.signInWithPopup(provider),logout:()=>auth.signOut()};
})();

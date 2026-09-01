"use strict";
(function(){
const firebaseConfig={apiKey:"AIzaSyDJtvH6eTLoXyT3a7d-awm69o2BUImvQaY",authDomain:"road703-3235b.firebaseapp.com",projectId:"road703-3235b",storageBucket:"road703-3235b.firebasestorage.app",messagingSenderId:"208181077306",appId:"1:208181077306:web:f4da7d76e3408eda5d1c03"};
let user=null,unsubscribe=null,timer=null,applying=false;
function emit(status,title,description){window.dispatchEvent(new CustomEvent("road703-sync-status",{detail:{status,title,description,loggedIn:!!user}}))}
try{firebase.initializeApp(firebaseConfig)}catch(e){if(!/already exists/i.test(String(e&&e.message)))throw e}
const auth=firebase.auth(),db=firebase.firestore(),provider=new firebase.auth.GoogleAuthProvider();
try{db.enablePersistence({synchronizeTabs:true}).catch(()=>{})}catch(e){}
function ref(){return user?db.collection("users").doc(user.uid).collection("road703").doc("state"):null}
async function saveNow(state){if(!user||applying||!state)return;emit("syncing","Sincronizzazione...","Salvataggio delle modifiche nel cloud.");await ref().set({state,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),appVersion:"V46"});emit("synced","Dati sincronizzati",user.email||"Telefono e PC allineati.")}
function queueSave(state){clearTimeout(timer);timer=setTimeout(()=>saveNow(state).catch(e=>{console.error(e);emit("error","Errore sincronizzazione","I dati restano salvati sul dispositivo.")}),700)}
async function start(u){user=u;emit("connecting","Collegamento...","Recupero dei dati Road 70.3.");const r=ref(),snap=await r.get();if(!snap.exists){await saveNow(window.ROAD703_APP.getState())}unsubscribe=r.onSnapshot(s=>{if(!s.exists||s.metadata.hasPendingWrites)return;const remote=s.data().state;if(!remote)return;applying=true;try{window.ROAD703_APP.applyRemoteState(remote);emit("synced","Dati sincronizzati",user.email||"Telefono e PC allineati.")}catch(e){console.error(e);emit("error","Dati cloud non validi","La copia locale non è stata sostituita.")}finally{applying=false}},e=>{console.error(e);emit("error","Errore sincronizzazione","Controlla regole Firestore e connessione.")})}
auth.onAuthStateChanged(u=>{if(unsubscribe){unsubscribe();unsubscribe=null}if(u)start(u).catch(e=>{console.error(e);emit("error","Collegamento non riuscito",String(e.message||e))});else{user=null;emit("offline","Cloud non collegato","Accedi con lo stesso account Google su telefono e PC.")}});
window.ROAD703_FIREBASE={  
queueSave:()=>{},login:()=>auth.signInWithPopup(provider).catch(e=>{console.error(e);emit("error","Accesso non riuscito",String(e.message||e))}),logout:()=>auth.signOut()};
})();

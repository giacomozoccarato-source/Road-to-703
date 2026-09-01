"use strict";
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyDJtvH6eTLoXyT3a7d-awm69o2BUImvQaY",
    authDomain: "road703-3235b.firebaseapp.com",
    projectId: "road703-3235b",
    storageBucket: "road703-3235b.firebasestorage.app",
    messagingSenderId: "208181077306",
    appId: "1:208181077306:web:f4da7d76e3408eda5d1c03"
  };

  let user = null;
  let unsubscribe = null;
  let timer = null;
  let applying = false;
  let booting = true;

  function emit(status, title, description) {
    window.dispatchEvent(new CustomEvent("road703-sync-status", {
      detail: { status, title, description, loggedIn: !!user }
    }));
  }

  try {
    firebase.initializeApp(firebaseConfig);
  } catch (e) {
    if (!/already exists/i.test(String(e && e.message))) throw e;
  }

  const auth = firebase.auth();
  const db = firebase.firestore();
  const provider = new firebase.auth.GoogleAuthProvider();

  function ref() {
    return user
      ? db.collection("users").doc(user.uid).collection("road703").doc("state")
      : null;
  }

  function parseCloud(data) {
    if (!data) return {};
    if (typeof data.stateJson === "string") {
      try { return JSON.parse(data.stateJson); }
      catch (e) { console.error("stateJson non valido", e); return {}; }
    }
    return data.state || {};
  }

  function uniqueImports(list) {
    const seen = new Set();
    const out = [];
    (list || []).forEach(item => {
      const arr = Array.isArray(item) ? item.filter(Boolean) : [];
      const key = JSON.stringify(arr);
      if (!seen.has(key)) { seen.add(key); out.push(arr); }
    });
    return out;
  }

  function merge(cloud = {}, local = {}) {
    const activities = new Map();
    [...(cloud.activities || []), ...(local.activities || [])].forEach(a => {
      if (a && a.id) activities.set(a.id, a);
    });

    const cloudPlan = new Map((cloud.plan || []).map(x => [x.id, x]));
    const localPlan = new Map((local.plan || []).map(x => [x.id, x]));
    const ids = new Set([...cloudPlan.keys(), ...localPlan.keys()]);

    const plan = [...ids].map(id => {
      const c = cloudPlan.get(id) || {};
      const l = localPlan.get(id) || {};
      if (l.actual && activities.has(l.actual)) return { ...c, ...l };
      if (c.actual && activities.has(c.actual)) return { ...l, ...c };
      return { ...c, ...l };
    });

    return {
      activities: [...activities.values()],
      imports: uniqueImports([...(cloud.imports || []), ...(local.imports || [])]),
      plan
    };
  }

  async function saveNow(local) {
    if (!user || applying || booting || !local) return;

    emit("syncing", "Sincronizzazione sicura...", "Unione dei dati locali e cloud.");

    await db.runTransaction(async tx => {
      const r = ref();
      const snap = await tx.get(r);
      const cloud = snap.exists ? parseCloud(snap.data()) : {};
      const merged = merge(cloud, local);

      tx.set(r, {
        stateJson: JSON.stringify(merged),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        appVersion: "V48-json-safe"
      });
    });

    emit("synced", "Dati sincronizzati", user.email || "Telefono e PC allineati.");
  }

  function queueSave(local) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      saveNow(local).catch(e => {
        console.error(e);
        emit("error", "Errore sincronizzazione", String(e.message || e));
      });
    }, 900);
  }

  async function start(u) {
    user = u;
    booting = true;
    emit("connecting", "Collegamento...", "Confronto protetto dei dati.");

    const r = ref();
    const snap = await r.get();
    const cloud = snap.exists ? parseCloud(snap.data()) : {};

    if (Array.isArray(cloud.activities)) {
      window.ROAD703_APP.applyRemoteState(cloud);
    }

    booting = false;
    await saveNow(window.ROAD703_APP.getState());

    unsubscribe = r.onSnapshot(snapNow => {
      if (!snapNow.exists || snapNow.metadata.hasPendingWrites) return;
      const remote = parseCloud(snapNow.data());
      if (!Array.isArray(remote.activities)) return;

      applying = true;
      try {
        window.ROAD703_APP.applyRemoteState(remote);
        emit("synced", "Dati sincronizzati", user.email || "Telefono e PC allineati.");
      } catch (e) {
        console.error(e);
        emit("error", "Dati cloud non validi", "La copia locale non è stata cancellata.");
      } finally {
        applying = false;
      }
    }, e => {
      console.error(e);
      emit("error", "Errore sincronizzazione", String(e.message || e));
    });
  }

  auth.onAuthStateChanged(u => {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }

    if (u) {
      start(u).catch(e => {
        booting = false;
        console.error(e);
        emit("error", "Collegamento non riuscito", String(e.message || e));
      });
    } else {
      user = null;
      booting = true;
      emit("offline", "Cloud non collegato", "Accedi con lo stesso account Google su telefono e PC.");
    }
  });

  window.ROAD703_FIREBASE = {
    queueSave,
    login: () => auth.signInWithPopup(provider),
    logout: () => auth.signOut()
  };
})();

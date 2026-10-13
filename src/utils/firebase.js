import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { clearIndexedDbPersistence } from "firebase/firestore";
import { terminate } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0k6sHsXHYJ8tbVPpS9kzHIfBAuVYxQ4M",
  authDomain: "eris-ba22f.firebaseapp.com",
  projectId: "eris-ba22f",
  storageBucket: "eris-ba22f.firebasestorage.app",
  messagingSenderId: "1082097222103",
  appId: "1:1082097222103:web:983540a2a6b82f98688b92",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);





export async function resetLocalSync() {
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
    window.location.reload();
  } catch (e) {
    console.error("Reset local sync failed:", e);
    alert("Reset failed: " + e.message);
  }
}

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
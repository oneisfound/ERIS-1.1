import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
} from "firebase/auth";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function signUp(email, password, username, avatar) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: username });
  await setDoc(doc(db, "users", cred.user.uid), {
    email: email.toLowerCase(),
    username,
    avatar: avatar || null,
    createdAt: Date.now(),
  });
  return cred.user;
}

export async function logIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logOut() {
  await signOut(auth);
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}


export async function updateUsername(uid, newUsername) {
  await updateDoc(doc(db, "users", uid), { username: newUsername });
  if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: newUsername });
}

export async function updateUserAvatar(uid, newAvatar) {
  await updateDoc(doc(db, "users", uid), { avatar: newAvatar });
}

export async function updateUserEmail(newEmail) {
  await updateEmail(auth.currentUser, newEmail);
}
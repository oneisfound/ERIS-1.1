import { doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export async function loadWorkspace(uid) {
  const snap = await getDoc(doc(db, "users", uid, "data", "workspace"));
  return snap.exists() ? snap.data() : null;
}

export async function saveWorkspace(uid, data) {
  await setDoc(doc(db, "users", uid, "data", "workspace"), {
    ...data,
    updatedAt: Date.now(),
  });
}

// Look up a user by email so you can share "the way Notion does" — by typing an email.
// Requires users/{uid} docs to have an `email` field (auth.js's signUp already writes one).
export async function findUserByEmail(email) {
  console.log("findUserByEmail: start", email);
  const clean = email.trim().toLowerCase();
  const q = query(collection(db, "users"), where("email", "==", clean));
  console.log("findUserByEmail: about to query");
  const snap = await getDocs(q);
  console.log("findUserByEmail: got results", snap.size);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { uid: d.id, ...d.data() };
}

// FIX: this was imported by App.jsx (`buildShareBundle`) but never actually
// existed in this file — that's a big chunk of why sharing was broken.
// Walks a page's full sub-page tree, plus every database/spreadsheet any of
// those pages reference, and packages it all up for sharePage() so nothing
// referenced by the page gets left behind for the person you shared with.
export function buildShareBundle(rootPage, allPages, databases, spreadsheets) {
  const subPages = {};
  function collectChildren(pageId) {
    allPages
      .filter(p => p.parentId === pageId)
      .forEach(child => {
        subPages[child.id] = child;
        collectChildren(child.id);
      });
  }
  collectChildren(rootPage.id);

  const dbIds = new Set();
  const ssIds = new Set();
  function walkBlocks(blocks) {
    (blocks || []).forEach(b => {
      if (b.dbId) dbIds.add(b.dbId);
      if (b.ssId) ssIds.add(b.ssId);
      if (b.children?.length) walkBlocks(b.children);
      if (b.type === "columns" && b.cols) b.cols.forEach(c => walkBlocks(c.blocks));
    });
  }
  walkBlocks(rootPage.blocks);
  Object.values(subPages).forEach(p => walkBlocks(p.blocks));

  const bundleDatabases = {};
  dbIds.forEach(id => { if (databases[id]) bundleDatabases[id] = databases[id]; });
  const bundleSpreadsheets = {};
  ssIds.forEach(id => { if (spreadsheets[id]) bundleSpreadsheets[id] = spreadsheets[id]; });

  return {
    rootPage,
    subPages,
    databases: bundleDatabases,
    spreadsheets: bundleSpreadsheets,
  };
}

// The ONLY function that creates/shares a page. Takes a "bundle" containing the
// root page + every sub-page + every database/spreadsheet it references, so
// nothing gets left behind.
export async function sharePage(pageId, ownerId, targetUid, bundle) {
  const pageRef = doc(db, "sharedPages", pageId);
  const snap = await getDoc(pageRef);

  // Strip out any `undefined` values (Firestore rejects them outright and
  // throws — which is very likely why the doc was never actually created).
  const safeSubPages = JSON.parse(JSON.stringify(bundle.subPages || {}));
  const safeDatabases = JSON.parse(JSON.stringify(bundle.databases || {}));
  const safeSpreadsheets = JSON.parse(JSON.stringify(bundle.spreadsheets || {}));
  const safeBlocks = JSON.parse(JSON.stringify(bundle.rootPage.blocks || []));

  if (!snap.exists()) {
    await setDoc(pageRef, {
      ownerId,
      members: [ownerId, targetUid],
      title: bundle.rootPage.title || "Untitled",
      icon: bundle.rootPage.icon || null,
      cover: bundle.rootPage.cover || null,
      font: bundle.rootPage.font || null,
      color: bundle.rootPage.color || null,
      locked: bundle.rootPage.locked || false,
      content: { blocks: safeBlocks },
      subPages: safeSubPages,
      databases: safeDatabases,
      spreadsheets: safeSpreadsheets,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastEditedBy: ownerId,
    });
  } else {
    await updateDoc(pageRef, {
      members: arrayUnion(targetUid),
      updatedAt: Date.now(),
    });
  }
}

export function watchSharedPagesForUser(uid, callback) {
  const q = query(collection(db, "sharedPages"), where("members", "array-contains", uid));
  return onSnapshot(q, snap => {
    console.log("RAW onSnapshot docs for", uid, snap.docs.length, snap.docs.map(d=>d.id));
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// Push live edits (blocks, title, icon, cover, font, color, sub-pages, dbs...) up to Firestore.
export async function updateSharedPageContent(pageId, changes, editorUid) {
  await updateDoc(doc(db, "sharedPages", pageId), {
    ...changes,
    updatedAt: Date.now(),
    lastEditedBy: editorUid,
  });
}

// Leaving/removing yourself from a shared page. This NEVER deletes the doc for
// everyone else — it only removes you. If you were the owner, ownership just
// passes to whoever's left. The doc is only actually deleted once the LAST
// person leaves.
export async function removeSharedPageMember(pageId, uid) {
  const pageRef = doc(db, "sharedPages", pageId);
  const snap = await getDoc(pageRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const remaining = (data.members || []).filter(m => m !== uid);

  if (remaining.length === 0) {
    await deleteDoc(pageRef);
    return;
  }

  const updates = { members: arrayRemove(uid) };
  if (data.ownerId === uid) updates.ownerId = remaining[0];
  await updateDoc(pageRef, updates);
}

async function handleSharePageByEmail(email){
  if(!user) throw new Error("You need to be signed in to share");
  if(!activePage) throw new Error("Open a page first before sharing");
  const found=await findUserByEmail(email);
  if(!found) throw new Error("No account found with that email");
  if(found.uid===user.uid) throw new Error("That's your own account");
  const bundle=buildShareBundle(activePage,pages,databases,spreadsheets);
  try{
    await sharePage(activePage.id,user.uid,found.uid,bundle);
  }catch(e){
    console.error("sharePage failed:", e);
    throw e;
  }
  updatePage(activePage.id,{isShared:true,ownerId:user.uid});
}
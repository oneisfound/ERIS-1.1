// utils/richText.js

function escapeHtml(s) {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

export function renderMarkedHtml(text, marks) {
  const t = text ?? "";
  if (!marks || !marks.length) return escapeHtml(t).replace(/\n/g,"<br/>");
  const points = new Set([0, t.length]);
  marks.forEach(m => { points.add(Math.max(0,Math.min(m.start,t.length))); points.add(Math.max(0,Math.min(m.end,t.length))); });
  const sorted = [...points].sort((a,b)=>a-b);
  let html = "";
  for (let i=0;i<sorted.length-1;i++){
    const s=sorted[i], e=sorted[i+1];
    if (s>=e) continue;
    const segment = escapeHtml(t.slice(s,e)).replace(/\n/g,"<br/>");
    const active = marks.filter(m=>m.start<=s && m.end>=e);
    html += wrapSegment(segment, active);
  }
  return html;
}

function wrapSegment(escaped, active) {
  if (!active.length) return escaped;
  const styles = []; let isLink=false, href=null;
  active.forEach(m=>{
    if (m.type==="bold") styles.push("font-weight:700");
    if (m.type==="italic") styles.push("font-style:italic");
    if (m.type==="underline") styles.push("text-decoration-line:underline");
    if (m.type==="strike") styles.push("text-decoration-line:line-through");
    if (m.type==="code") styles.push("font-family:ui-monospace,monospace","background:rgba(135,131,120,0.15)","padding:2px 4px","border-radius:4px","font-size:0.9em");
    if (m.type==="color") styles.push(`color:${m.value}`);
    if (m.type==="highlight") styles.push(`background:${m.value}`);
    if (m.type==="link") { isLink=true; href=m.url; }
  });
  const styleAttr = styles.length ? ` style="${styles.join(";")}"` : "";
  if (isLink) return `<a href="${escapeHtml(href||"#")}" target="_blank" rel="noopener noreferrer"${styleAttr||' style="color:#2383e2;text-decoration:underline"'}>${escaped}</a>`;
  return `<span${styleAttr}>${escaped}</span>`;
}

// ---- NEW: shared walker that treats <br> as a 1-character position ----

function isBR(node) {
  return node && node.nodeType === 1 && node.tagName === "BR";
}

function createOffsetWalker(container) {
  return document.createTreeWalker(container, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
      if (isBR(node)) return NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_SKIP;
    }
  });
}

// A DOM range boundary can point at an ELEMENT (offset = child index),
// e.g. right after a <br>. This walks down to the actual text node or
// <br> that boundary corresponds to, so it matches what the walker above
// will visit.
function normalizeBoundary(node, offset) {
  if (node.nodeType === Node.TEXT_NODE) return { node, offset };
  const children = node.childNodes;
  if (offset >= children.length) {
    const last = children[children.length - 1];
    if (!last) return { node, offset: 0 };
    if (last.nodeType === Node.TEXT_NODE) return { node: last, offset: last.textContent.length };
    if (isBR(last)) return { node: last, offset: 1 };
    return normalizeBoundary(last, last.childNodes.length);
  }
  const child = children[offset];
  if (child.nodeType === Node.TEXT_NODE) return { node: child, offset: 0 };
  if (isBR(child)) return { node: child, offset: 0 };
  return normalizeBoundary(child, 0);
}

export function getSelectionOffsets(container) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount===0) return null;
  const range = sel.getRangeAt(0);
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) return null;
  const start = offsetWithin(container, range.startContainer, range.startOffset);
  const end = offsetWithin(container, range.endContainer, range.endOffset);
  return { start: Math.min(start,end), end: Math.max(start,end) };
}

function offsetWithin(container, node, nodeOffset) {
  const { node: n2, offset: o2 } = normalizeBoundary(node, nodeOffset);
  let total = 0;
  const walker = createOffsetWalker(container);
  let n;
  while ((n = walker.nextNode())) {
    if (n === n2) {
      if (isBR(n)) return total + (o2 > 0 ? 1 : 0);
      return total + o2;
    }
    total += isBR(n) ? 1 : n.textContent.length;
  }
  return total;
}

// Finds the (node, offset) DOM position for a given character offset,
// counting each <br> as 1 character. Used by both caret placement and
// range selection so they can never disagree.
function locatePosition(container, offset) {
  const walker = createOffsetWalker(container);
  let remaining = offset, n, last = null;
  while ((n = walker.nextNode())) {
    const len = isBR(n) ? 1 : n.textContent.length;
    if (remaining <= len) {
      if (isBR(n)) {
        const parent = n.parentNode;
        const idx = Array.prototype.indexOf.call(parent.childNodes, n) + 1;
        return { node: parent, offset: idx };
      }
      return { node: n, offset: remaining };
    }
    remaining -= len;
    last = n;
  }
  if (last) {
    if (isBR(last)) {
      const parent = last.parentNode;
      const idx = Array.prototype.indexOf.call(parent.childNodes, last) + 1;
      return { node: parent, offset: idx };
    }
    return { node: last, offset: last.textContent.length };
  }
  return { node: container, offset: container.childNodes.length };
}

export function setCaretAtOffset(container, offset) {
  const { node, offset: o } = locatePosition(container, offset);
  const sel = window.getSelection();
  const range = document.createRange();
  range.setStart(node, o);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

export function setSelectionRange(container, start, end) {
  const s = locatePosition(container, start);
  const e = locatePosition(container, end);
  const sel = window.getSelection();
  const range = document.createRange();
  range.setStart(s.node, s.offset);
  range.setEnd(e.node, e.offset);
  sel.removeAllRanges();
  sel.addRange(range);
}

function overlaps(m,start,end){ return m.start < end && m.end > start; }

function rangeCovered(sameType, start, end) {
  let cursor = start;
  const sorted=[...sameType].sort((a,b)=>a.start-b.start);
  for (const m of sorted) {
    if (m.start > cursor) return false;
    if (m.end > cursor) cursor = m.end;
    if (cursor >= end) return true;
  }
  return cursor >= end;
}

function mergeAdjacentSameType(marks) {
  const byType = {};
  marks.forEach(m=>{ (byType[m.type]=byType[m.type]||[]).push(m); });
  let out = [];
  Object.entries(byType).forEach(([type, arr])=>{
    if (type==="color"||type==="highlight"||type==="link") { out=out.concat(arr); return; }
    const sorted=[...arr].sort((a,b)=>a.start-b.start);
    const merged=[];
    for (const m of sorted) {
      const last = merged[merged.length-1];
      if (last && m.start<=last.end) last.end=Math.max(last.end,m.end);
      else merged.push({...m});
    }
    out=out.concat(merged);
  });
  return out;
}

// Detects text direction from the first "strong" (directionally meaningful) character.
// Arabic/Hebrew etc. → rtl, Latin/Greek/Cyrillic etc. → ltr, punctuation/numbers are skipped.
export function detectTextDirection(text) {
  if (!text) return "ltr";
  const rtlChar = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  const ltrChar = /[A-Za-z\u00C0-\u02FF\u0370-\u058F]/;
  for (const ch of text) {
    if (rtlChar.test(ch)) return "rtl";
    if (ltrChar.test(ch)) return "ltr";
  }
  return "ltr";
}

export function applyMark(marks, start, end, type, extra={}) {
  if (start>=end) return marks||[];
  const existing = marks || [];
  const sameType = existing.filter(m=>m.type===type);
  const fullyCovered = rangeCovered(sameType, start, end);
  let next = existing.filter(m=>m.type!==type || !overlaps(m,start,end));
  sameType.forEach(m=>{
    if (!overlaps(m,start,end)) { next.push(m); return; }
    if (m.start < start) next.push({...m, end:start});
    if (m.end > end) next.push({...m, start:end});
  });
  if (type==="color" || type==="highlight" || type==="link") {
  if ((type==="color" || type==="highlight") && !extra.value) {
    // Clearing: just drop existing marks in range, don't add a new one.
  } else {
    next.push({ type, start, end, ...extra });
  }
}
  else if (!fullyCovered) next.push({ type, start, end });
  return mergeAdjacentSameType(next.filter(m=>m.end>m.start));
}

export function shiftMarksForEdit(marks, oldText, newText) {
  if (!marks || !marks.length) return marks||[];
  const a=oldText||"", b=newText||"";
  let prefix=0; const maxPrefix=Math.min(a.length,b.length);
  while (prefix<maxPrefix && a[prefix]===b[prefix]) prefix++;
  let suffix=0; const maxSuffix=Math.min(a.length-prefix,b.length-prefix);
  while (suffix<maxSuffix && a[a.length-1-suffix]===b[b.length-1-suffix]) suffix++;
  const editStart=prefix, oldEditEnd=a.length-suffix, delta=b.length-a.length;
  return marks.map(m=>{
    let start=m.start, end=m.end;
    if (start>=oldEditEnd) start+=delta; else if (start>editStart) start=editStart;
    if (end>=oldEditEnd) end+=delta; else if (end>editStart) end=editStart;
    return {...m,start:Math.max(0,start),end:Math.min(b.length,end)};
  }).filter(m=>m.end>m.start);
}
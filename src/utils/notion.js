import {
  rid,
  headingLevel,
  newSimpleBlock,
  newBlock,
  newPage,
  newSpreadsheet,
  displayCell,
} from "./data";

import {
  DB_VIEW_LABELS,
} from "../data/constants";

import {
  getSpotifyEmbedUrl,
  spotifyDefaultHeight,
  getYouTubeEmbedUrl,
  getFigmaEmbedUrl,
  getMapsEmbedUrl,
  detectEmbedProvider,
} from "./embeds";

// ---- JSZip (loaded on demand, only needed for .zip Notion exports) --------
let _jszipLoading = null;
function loadJSZip() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (_jszipLoading) return _jszipLoading;
  _jszipLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    s.async = true;
    s.onload = () => resolve(window.JSZip);
    s.onerror = () => reject(new Error("Couldn't load zip support (jszip)."));
    document.body.appendChild(s);
  });
  return _jszipLoading;
}

function cleanText(s) {
  return (s || "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function mkBlock(type, txt) {
  const b = newBlock(type);
  b.text = txt || "";
  return b;
}

// ---- Notion HTML export -> ERIS blocks -------------------------------------
// Notion's own HTML export uses a fairly consistent markup (h1-h6, p,
// ul.bulleted-list / ol.numbered-list / ul.to-do-list, <details><summary>
// for toggles, <figure class="callout|image|table_of_contents">, <table
// class="simple-table">, <hr>, <blockquote>). We match those first for best
// fidelity, then fall back to generic tag handling for any other HTML.
async function listToBlocks(listEl, resolveImage) {
  const ordered = listEl.tagName.toLowerCase() === "ol";
  const out = [];
  for (const li of Array.from(listEl.children)) {
    if (li.tagName.toLowerCase() !== "li") continue;
    const nested = li.querySelector(":scope > ul, :scope > ol");
    const clone = li.cloneNode(true);
    if (nested) { const n2 = clone.querySelector(":scope > ul, :scope > ol"); if (n2) n2.remove(); }
    const block = mkBlock(ordered ? "numbered" : "bulleted", cleanText(clone.textContent));
    if (nested) block.children = await listToBlocks(nested, resolveImage);
    out.push(block);
  }
  return out;
}

async function tableToBlock(tableEl) {
  const rows = Array.from(tableEl.querySelectorAll("tr")).map(tr =>
    Array.from(tr.children).map(td => cleanText(td.textContent)));
  if (!rows.length) return mkBlock("paragraph", "");
  const cols = Math.max(...rows.map(r => r.length), 1);
  const ss = newSpreadsheet(rows.length, cols);
  ss.name = "Imported table";
  rows.forEach((r, ri) => { r.forEach((val, ci) => {
    if (ss.data[ri] && ss.columns[ci]) ss.data[ri].cells[ss.columns[ci].id] = val;
  }); });
  const b = newBlock("spreadsheet");
  b.ssId = ss.id;
  b.__importedSpreadsheet = ss; // picked up & moved into the spreadsheets store after import
  return b;
}

async function nodeToBlocks(node, resolveImage) {
  if (node.nodeType === 3) {
    const txt = cleanText(node.textContent);
    return txt ? [mkBlock("paragraph", txt)] : [];
  }
  if (node.nodeType !== 1) return [];
  const tag = node.tagName.toLowerCase();
  const cls = node.classList;
  const text = () => cleanText(node.textContent);

  switch (tag) {
    case "h1": return [mkBlock("heading1", text())];
    case "h2": return [mkBlock("heading2", text())];
    case "h3": return [mkBlock("heading3", text())];
    case "h4": case "h5": case "h6": return [mkBlock("heading4", text())];
    case "p": return [mkBlock("paragraph", text())];
    case "blockquote": return [mkBlock("quote", text())];
    case "hr": return [mkBlock("divider", "")];
    case "pre": {
      const codeEl = node.querySelector("code");
      return [mkBlock("paragraph", (codeEl || node).textContent.replace(/\r\n/g, "\n"))];
    }
    case "details": {
      const summary = node.querySelector(":scope > summary");
      const label = summary ? cleanText(summary.textContent) : "Toggle";
      const kids = Array.from(node.children).filter(c => c !== summary);
      const children = await nodesToBlocks(kids, resolveImage);
      const b = mkBlock("toggle", label);
      b.children = children;
      b.open = node.hasAttribute("open");
      return [b];
    }
    case "ul": case "ol": {
      if (cls.contains("to-do-list")) {
        const out = [];
        for (const li of Array.from(node.children)) {
          if (li.tagName.toLowerCase() !== "li") continue;
          const checked = !!li.querySelector(".checkbox-on") || !!li.querySelector("input[type=checkbox]:checked");
          const clone = li.cloneNode(true);
          clone.querySelectorAll(".checkbox, input").forEach(n => n.remove());
          out.push({ ...mkBlock("todo", cleanText(clone.textContent)), checked });
        }
        return out;
      }
      return await listToBlocks(node, resolveImage);
    }
    case "table": return [await tableToBlock(node)];
    case "figure": {
      if (cls.contains("callout")) {
        const kids = Array.from(node.children);
        const emoji = kids[0] ? cleanText(kids[0].textContent) : "💡";
        const rest = kids.slice(1).map(k => cleanText(k.textContent)).join(" ") || text();
        return [{ ...mkBlock("callout", rest), emoji: emoji || "💡" }];
      }
      const img = node.querySelector("img");
      if (cls.contains("image") || img) {
        if (!img) return [];
        const rawSrc = img.getAttribute("src");
        const src = resolveImage ? await resolveImage(rawSrc) : rawSrc;
        const b = newBlock("image");
        if (src) b.media = { dataUrl: src, name: (rawSrc || "image").split("/").pop() };
        return [b];
      }
      if (cls.contains("table_of_contents")) return [mkBlock("toc", "")];
      return await nodesToBlocks(Array.from(node.children), resolveImage);
    }
    case "img": {
      const rawSrc = node.getAttribute("src");
      const src = resolveImage ? await resolveImage(rawSrc) : rawSrc;
      const b = newBlock("image");
      if (src) b.media = { dataUrl: src, name: (rawSrc || "image").split("/").pop() };
      return [b];
    }
    case "iframe": {
      const src = node.getAttribute("src") || "";
      const b = newBlock("embed");
      b.url = src || null;
      return [b];
    }
    case "header": return [];
    case "div": {
      if (cls.contains("eris-columns")) {
        const colDivs = Array.from(node.children).filter(c => c.classList.contains("eris-column"));
        if (colDivs.length) {
          const cols = [];
          const colWidths = [];
          for (const cd of colDivs) {
            const kids = await nodesToBlocks(Array.from(cd.children), resolveImage);
            cols.push({ id: rid(), blocks: kids.length ? kids : [newSimpleBlock()] });
            colWidths.push(parseFloat(cd.getAttribute("data-width")) || Math.round(100 / colDivs.length));
          }
          const b = newBlock("columns");
          b.cols = cols; b.colWidths = colWidths;
          return [b];
        }
      }
      return await nodesToBlocks(Array.from(node.children), resolveImage);
    }
    case "section": case "article": case "main":
      return await nodesToBlocks(Array.from(node.children), resolveImage);
    default: {
      const t = text();
      return t ? [mkBlock("paragraph", t)] : [];
    }
  }
}
async function nodesToBlocks(nodes, resolveImage) {
  let out = [];
  for (const node of nodes) out = out.concat(await nodeToBlocks(node, resolveImage));
  return out;
}

function isNotionColumnList(node) {
  return Array.from(node.classList || []).some(name =>
    /(?:^|[-_])column[-_]list(?:[-_]|$)/i.test(name)
  );
}

function isNotionColumn(node) {
  return Array.from(node.classList || []).some(name =>
    /(?:^|[-_])column(?:[-_]|$)/i.test(name) && !/column[-_]list/i.test(name)
  );
}

async function notionColumnsToBlock(node, resolveImage) {
  const columnNodes = Array.from(node.children).filter(isNotionColumn);
  if (!columnNodes.length) return null;
  const colWidths = columnNodes.map(column => {
    const styleWidth = parseFloat(column.style.width || column.style.flexBasis);
    return Number.isFinite(styleWidth) ? styleWidth : 100 / columnNodes.length;
  });
  const cols = [];
  for (const column of columnNodes) {
    const blocks = await nodesToBlocks(Array.from(column.children), resolveImage);
    cols.push({ id: rid(), blocks: blocks.length ? blocks : [newSimpleBlock()] });
  }
  const block = newBlock("columns");
  block.cols = cols;
  block.colWidths = colWidths;
  return block;
}

// Best-effort icon/cover extraction for real Notion HTML exports (which
// encode these outside the normal block flow).
function extractIconAndCover(doc) {
  let icon = null, cover = null;

  // ── Cover ──────────────────────────────────────────────────────────────
  const coverSelectors = [
    '.page-cover img',
    'img.page-cover-image',
    '[class*="cover"] img',
  ];
  let coverImg = null;
  for (const sel of coverSelectors) {
    coverImg = doc.querySelector(sel);
    if (coverImg) break;
  }

  const coverDivSelectors = [
    'div.page-cover',
    'div.cover',
    '[class*="cover"]:not(img)',
  ];
  let coverDiv = null;
  for (const sel of coverDivSelectors) {
    coverDiv = doc.querySelector(sel);
    if (coverDiv) break;
  }

  if (coverImg) {
    cover = { kind: 'image', value: coverImg.getAttribute('src') };
  } else if (coverDiv) {
    const style = coverDiv.getAttribute('style') || '';
    const urlMatch = style.match(
      /background(?:-image)?:\s*url\(['"]?([^'")]+)['"]?\)/
    );
    if (urlMatch) {
      cover = { kind: 'image', value: urlMatch[1] };
    } else {
      const colorMatch = style.match(/background(?:-color)?:\s*([^;]+)/);
      if (colorMatch) cover = { kind: 'color', value: colorMatch[1].trim() };
    }
  }

  // ── Icon ───────────────────────────────────────────────────────────────
  const iconImgSelectors = [
    '.page-icon img',
    'img.page-icon',
    '[class*="icon"] img',
  ];
  let iconImg = null;
  for (const sel of iconImgSelectors) {
    iconImg = doc.querySelector(sel);
    if (iconImg) break;
  }

  if (iconImg) {
    icon = { kind: 'image', value: iconImg.getAttribute('src') };
  } else {
    const iconElSelectors = [
      '.page-icon',
      'span.icon',
      '[class*="icon"]',
    ];
    let iconEl = null;
    for (const sel of iconElSelectors) {
      const el = doc.querySelector(sel);
      // Must look like an emoji, not contain child elements that are icons
      if (el && !el.querySelector('img') && !el.querySelector('svg')) {
        iconEl = el;
        break;
      }
    }
    const txt = iconEl ? cleanText(iconEl.textContent) : '';
    if (txt) icon = { kind: 'emoji', value: txt };
  }

  return { icon, cover };
}


async function htmlToPageFallback(doc, resolveImage) {
  const titleEl =
    doc.querySelector('.page-title') ||
    doc.querySelector('article h1') ||
    doc.querySelector('h1') ||
    doc.querySelector('title');

  let title = titleEl ? cleanText(titleEl.textContent) : 'Imported page';
  const { icon, cover } = extractIconAndCover(doc);

  // Some exports prefix the title with the emoji icon — strip it
  let resolvedIcon = icon;
  if (!resolvedIcon) {
    const m = title.match(/^(\p{Extended_Pictographic}\uFE0F?)\s+(.*)$/u);
    if (m) {
      resolvedIcon = { kind: 'emoji', value: m[1] };
      title = m[2];
    }
  }

  // If still no icon, try to grab it from the <title> tag prefix
  if (!resolvedIcon) {
    const rawTitle = doc.querySelector('title')?.textContent || '';
    const m2 = rawTitle.match(/^(\p{Extended_Pictographic}\uFE0F?)\s/u);
    if (m2) resolvedIcon = { kind: 'emoji', value: m2[1] };
  }

  const body =
    doc.querySelector('.page-body') ||
    doc.querySelector('article') ||
    doc.body;

  const children = Array.from(body.children).filter(el => {
    const cls = el.classList;
    const tag = el.tagName.toLowerCase();
    return (
      !cls?.contains('page-title') &&
      !cls?.contains('page-cover') &&
      !cls?.contains('page-header') &&
      !cls?.contains('page-icon') &&
      tag !== 'header' &&
      tag !== 'script'
    );
  });

  const blocks = await nodesToBlocks(children, resolveImage);

  const page = newPage(null);
  page.title = title;
  if (resolvedIcon) page.icon = resolvedIcon;
  if (cover) page.cover = cover;
  page.blocks = blocks.length ? blocks : [newBlock('paragraph')];

  const spreadsheets = {};
  stripImportedSpreadsheets(page.blocks, spreadsheets);
  return { page, databases: {}, spreadsheets };
}

// Regenerates every id in an ERIS-exported page/database/spreadsheet bundle
// so it can be dropped into the current workspace without colliding with
// (or accidentally overwriting) anything already there.
function remapImportedPageData(data) {
  const dbIdMap = {};
  Object.keys(data.databases || {}).forEach(id => { dbIdMap[id] = rid(); });
  const ssIdMap = {};
  Object.keys(data.spreadsheets || {}).forEach(id => { ssIdMap[id] = rid(); });

  function walk(blocks) {
    return (blocks || []).map(b => {
      const nb = { ...b, id: rid() };
      if (nb.dbId && dbIdMap[nb.dbId]) nb.dbId = dbIdMap[nb.dbId];
      if (nb.ssId && ssIdMap[nb.ssId]) nb.ssId = ssIdMap[nb.ssId];
      if (nb.children?.length) nb.children = walk(nb.children);
      if (nb.cols) nb.cols = nb.cols.map(c => ({
        ...c, id: rid(), blocks: walk(c.blocks)
      }));
      return nb;
    });
  }

  const page = {
    ...data.page,
    id: rid(),
    parentId: null,
    blocks: walk(data.page.blocks || [])
  };

  const databases = {};
  Object.entries(data.databases || {}).forEach(([oldId, db]) => {
    const nid = dbIdMap[oldId];
    // Remap view IDs but PRESERVE type, name, and all view properties
    const viewIdMap = {};
    (db.views || []).forEach(v => { viewIdMap[v.id] = rid(); });
    const remappedViews = (db.views || []).map(v => ({
      ...v,                          // keep type, name, filters, sorts, etc.
      id: viewIdMap[v.id],
    }));
    const remappedActiveViewId = db.activeViewId
      ? (viewIdMap[db.activeViewId] || remappedViews[0]?.id)
      : remappedViews[0]?.id;

    databases[nid] = {
      ...db,
      id: nid,
      views: remappedViews,
      activeViewId: remappedActiveViewId,
    };
  });

  const spreadsheets = {};
  Object.entries(data.spreadsheets || {}).forEach(([oldId, ss]) => {
    const nid = ssIdMap[oldId];
    spreadsheets[nid] = { ...ss, id: nid };
  });

  return { page, databases, spreadsheets };
}

// Reads one HTML document and returns {page, databases, spreadsheets}. If it
// carries ERIS's own embedded data island (added by exportPageAsHtml), that
// is used directly for a fully lossless round-trip — exact database view
// (gallery/table/board/etc.), column widths, page icon and cover included.
// Otherwise falls back to best-effort parsing of the visible HTML, which is
// what handles a genuine Notion export.
async function htmlToImportResult(htmlText, resolveImage) {
  const doc = new DOMParser().parseFromString(htmlText, "text/html");
  const island = doc.getElementById("eris-data");
  if (island) {
    try {
      const data = JSON.parse(island.textContent);
      if (data && data.page) return remapImportedPageData(data);
    } catch { /* fall through to best-effort parsing below */ }
  }
  return await htmlToPageFallback(doc, resolveImage);
}

function markdownInlineText(value) {
  return cleanText(value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(`{1,3}|[*_~])/g, ""));
}

function splitDelimitedLine(line, delimiter = ",") {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') {
      cell += '"'; i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(cell.trim()); cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function csvToSpreadsheet(csvText, delimiter = ",") {
  const rows = csvText.replace(/^\uFEFF/, "").split(/\r?\n/).filter(row => row.trim() !== "")
    .map(row => splitDelimitedLine(row, delimiter));
  const width = Math.max(...rows.map(row => row.length), 1);
  const ss = newSpreadsheet(Math.max(rows.length - 1, 1), width);
  const headers = rows[0] || [];
  ss.name = "Imported CSV";
  ss.columns.forEach((column, index) => { column.name = headers[index] || `Column ${index + 1}`; });
  rows.slice(1).forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      const column = ss.columns[columnIndex];
      if (column && ss.data[rowIndex]) ss.data[rowIndex].cells[column.id] = value;
    });
  });
  return ss;
}

async function markdownToImportResult(markdown, fileName) {
  const lines = markdown.replace(/^\uFEFF/, "").split(/\r?\n/);
  const blocks = [];
  let title = fileName.replace(/\.md(own)?$/i, "").replace(/[-_]+/g, " ").trim() || "Imported page";
  let codeLines = null;
  let tableRows = [];
  const flushTable = () => {
    if (tableRows.length < 2) return;
    const ss = csvToSpreadsheet(tableRows.map(row => row.join(",")).join("\n"));
    const block = newBlock("spreadsheet");
    block.ssId = ss.id;
    block.__importedSpreadsheet = ss;
    blocks.push(block);
    tableRows = [];
  };
  const flushCode = () => {
    if (codeLines === null) return;
    blocks.push(mkBlock("paragraph", codeLines.join("\n")));
    codeLines = null;
  };

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (codeLines === null) codeLines = [];
      else flushCode();
      continue;
    }
    if (codeLines !== null) { codeLines.push(line); continue; }
    if (/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)) continue;
    const table = line.match(/^\s*\|(.+)\|\s*$/);
    if (table) { tableRows.push(splitDelimitedLine(table[1], "|")); continue; }
    flushTable();
    const heading = line.match(/^\s*(#{1,4})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const block = mkBlock(`heading${heading[1].length}`, markdownInlineText(heading[2]));
      blocks.push(block);
      if (heading[1].length === 1 && title === fileName.replace(/\.md(own)?$/i, "").replace(/[-_]+/g, " ").trim()) title = block.text;
      continue;
    }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) { blocks.push(mkBlock("divider", "")); continue; }
    const todo = line.match(/^\s*[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (todo) { blocks.push({ ...mkBlock("todo", markdownInlineText(todo[2])), checked: todo[1].toLowerCase() === "x" }); continue; }
    const bullet = line.match(/^\s*[-*+]\s+(.+)$/);
    if (bullet) { blocks.push(mkBlock("bulleted", markdownInlineText(bullet[1]))); continue; }
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (numbered) { blocks.push(mkBlock("numbered", markdownInlineText(numbered[1]))); continue; }
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) { blocks.push(mkBlock("quote", markdownInlineText(quote[1]))); continue; }
    if (line.trim()) blocks.push(mkBlock("paragraph", markdownInlineText(line)));
  }
  flushCode(); flushTable();
  const page = newPage(null);
  page.title = title;
  page.blocks = blocks.length ? blocks : [newBlock("paragraph")];
  const spreadsheets = {};
  stripImportedSpreadsheets(page.blocks, spreadsheets);
  return { page, databases: {}, spreadsheets };
}

function stripImportedSpreadsheets(blocks, out) {
  for (const b of blocks) {
    if (b.__importedSpreadsheet) { out[b.__importedSpreadsheet.id] = b.__importedSpreadsheet; delete b.__importedSpreadsheet; }
    if (b.children?.length) stripImportedSpreadsheets(b.children, out);
    if (b.cols) b.cols.forEach(c => stripImportedSpreadsheets(c.blocks, out));
  }
}

// Reads a single .html/.htm file, or a Notion .zip export (which may contain
// one page or an entire exported workspace's worth of pages + image assets).
// Returns {pages, databases, spreadsheets} ready to merge into app state.
async function parseNotionImport(file) {
  const isZip = /\.zip$/i.test(file.name) || file.type === "application/zip";
  const isMarkdown = /\.md(own)?$/i.test(file.name) || file.type === "text/markdown";
  const isCsv = /\.csv$/i.test(file.name) || file.type === "text/csv";
  if (isMarkdown || isCsv) {
    const text = await file.text();
    const result = isMarkdown
      ? await markdownToImportResult(text, file.name)
      : (() => {
          const ss = csvToSpreadsheet(text);
          const block = newBlock("spreadsheet");
          block.ssId = ss.id;
          const page = newPage(null);
          page.title = file.name.replace(/\.csv$/i, "").replace(/[-_]+/g, " ").trim() || "Imported CSV";
          page.blocks = [block];
          return { page, databases: {}, spreadsheets: { [ss.id]: ss } };
        })();
    if (isMarkdown) stripImportedSpreadsheets(result.page.blocks, result.spreadsheets);
    return { pages: [result.page], databases: result.databases, spreadsheets: result.spreadsheets };
  }
  if (!isZip) {
    const text = await file.text();
    const result = await htmlToImportResult(text, null);
    return { pages: [result.page], databases: result.databases || {}, spreadsheets: result.spreadsheets || {} };
  }
  const JSZip = await loadJSZip();
  if (!JSZip) throw new Error("Couldn't load zip support.");
  const zip = await JSZip.loadAsync(file);
  const htmlEntries = Object.values(zip.files).filter(f => !f.dir && /\.html?$/i.test(f.name));
  if (!htmlEntries.length) throw new Error("No HTML page found inside this zip.");
  const imageEntries = Object.values(zip.files).filter(f => !f.dir && /\.(png|jpe?g|gif|svg|webp)$/i.test(f.name));
  const imageCache = {};
  async function resolveImage(src) {
    if (!src) return null;
    if (src.startsWith("data:") || /^https?:\/\//i.test(src)) return src;
    const decoded = decodeURIComponent(src.split("?")[0]).replace(/^\.?\//, "");
    const base = decoded.split("/").pop();
    const entry = zip.files[decoded]
      || Object.values(zip.files).find(f => f.name.endsWith(decoded))
      || imageEntries.find(f => f.name.endsWith(base));
    if (!entry) return null;
    if (imageCache[entry.name]) return imageCache[entry.name];
    const base64 = await entry.async("base64");
    const ext = entry.name.split(".").pop().toLowerCase();
    const mime = ext === "svg" ? "image/svg+xml" : ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : "image/jpeg";
    const dataUrl = `data:${mime};base64,${base64}`;
    imageCache[entry.name] = dataUrl;
    return dataUrl;
  }
  const pages = [];
  let databases = {};
  let spreadsheets = {};
  for (const entry of htmlEntries) {
    const text = await entry.async("text");
    const result = await htmlToImportResult(text, resolveImage);
    pages.push(result.page);
    databases = { ...databases, ...(result.databases || {}) };
    spreadsheets = { ...spreadsheets, ...(result.spreadsheets || {}) };
  }
  return { pages, databases, spreadsheets };
}

// ---- ERIS blocks -> HTML (for "Export as HTML" / "Export as PDF") ---------
function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function nl2br(s) { return escapeHtml(s).replace(/\n/g, "<br>"); }

function collectDbAndSsIds(blocks, dbIds, ssIds) {
  for (const b of blocks || []) {
    if (b.dbId) dbIds.add(b.dbId);
    if (b.ssId) ssIds.add(b.ssId);
    if (b.children?.length) collectDbAndSsIds(b.children, dbIds, ssIds);
    if (b.cols) b.cols.forEach(c => collectDbAndSsIds(c.blocks, dbIds, ssIds));
  }
}

function cellDisplayText(row, prop) {
  const v = row.cells?.[prop.id];
  if (v == null || v === "") return "";
  if (prop.type === "checkbox") return v ? "✓" : "";
  if (Array.isArray(v)) return v.map(x => (x && typeof x === "object") ? (x.name ?? "") : x).join(", ");
  if (typeof v === "object") return v.name ?? "";
  return String(v);
}
function rowTitle(row, primaryProp) {
  if (row.pageData?.title) return row.pageData.title;
  return primaryProp ? (cellDisplayText(row, primaryProp) || "Untitled") : "Untitled";
}
// Renders a real (read-only) view of the database's current data as an HTML
// table for visible export/PDF — the exact view type (gallery/board/etc.) is
// preserved separately in the embedded data island for re-import into ERIS.
function renderDbTable(db) {
  if (!db) return `<p><em>[Database not available in this export]</em></p>`;

  const props = db.properties || [];
  const primary = props.find(p => p.isPrimary) || props[0];
  const activeView =
    (db.views || []).find(v => v.id === db.activeViewId) || db.views?.[0];
  const viewType = activeView?.type || 'table';
  const viewLabel = DB_VIEW_LABELS[viewType] || 'Table';

  let html = `<div class="eris-database">`;
  html += `<div class="db-meta">${escapeHtml(db.name || 'Database')} · ${escapeHtml(viewLabel)} view</div>`;

  // ── Gallery view ─────────────────────────────────────────────────────
  if (viewType === 'gallery') {
    html += `<div class="db-gallery">`;
    (db.rows || []).forEach(row => {
      const title = rowTitle(row, primary);
      const cover = row.pageData?.cover;
      const coverHtml = cover?.kind === 'image'
        ? `<div class="db-card-cover" style="background-image:url('${cover.value}')"></div>`
        : cover?.kind === 'color'
          ? `<div class="db-card-cover" style="background:${cover.value}"></div>`
          : `<div class="db-card-cover db-card-cover--empty"></div>`;

      const visProps = props.filter(p => !p.isPrimary).slice(0, 3);
      const propsHtml = visProps.map(p =>
        `<div class="db-card-prop">${escapeHtml(cellDisplayText(row, p))}</div>`
      ).join('');

      html += `<div class="db-card">${coverHtml}<div class="db-card-body"><div class="db-card-title">${escapeHtml(title)}</div>${propsHtml}</div></div>`;
    });
    html += `</div>`;

  // ── Board view ────────────────────────────────────────────────────────
  } else if (viewType === 'board') {
    const groupProp = props.find(p => p.type === 'select' && !p.isPrimary);
    const columns = groupProp
      ? [{ id: '__none__', name: 'No status', color: '#8a8a88' }, ...(groupProp.options || [])]
      : [{ id: '__none__', name: 'All', color: '#8a8a88' }];

    html += `<div class="db-board">`;
    columns.forEach(col => {
      const rows = groupProp
        ? (col.id === '__none__'
            ? (db.rows || []).filter(r => !r.cells[groupProp.id])
            : (db.rows || []).filter(r => r.cells[groupProp.id] === col.id))
        : (db.rows || []);

      html += `<div class="db-board-col">`;
      html += `<div class="db-board-col-header"><span class="db-board-col-dot" style="background:${escapeHtml(col.color)}"></span>${escapeHtml(col.name)}<span class="db-board-col-count">${rows.length}</span></div>`;
      rows.forEach(row => {
        html += `<div class="db-board-card"><div class="db-board-card-title">${escapeHtml(rowTitle(row, primary))}</div></div>`;
      });
      html += `</div>`;
    });
    html += `</div>`;

  // ── List view ─────────────────────────────────────────────────────────
  } else if (viewType === 'list') {
    html += `<ul class="db-list">`;
    (db.rows || []).forEach(row => {
      html += `<li class="db-list-item">${escapeHtml(rowTitle(row, primary))}</li>`;
    });
    html += `</ul>`;

  // ── Table view (default) ──────────────────────────────────────────────
  } else {
    html += `<table class="simple-table"><thead><tr>`;
    html += props.map(p => `<th>${escapeHtml(p.name)}</th>`).join('');
    html += `</tr></thead><tbody>`;
    (db.rows || []).forEach(row => {
      html += `<tr>`;
      html += props.map(p =>
        `<td>${p === primary
          ? escapeHtml(rowTitle(row, primary))
          : escapeHtml(cellDisplayText(row, p))}</td>`
      ).join('');
      html += `</tr>`;
    });
    html += `</tbody></table>`;
  }

  html += `</div>`;
  return html;
}

function renderSsTable(ss) {
  if (!ss) return `<p><em>[Spreadsheet not available in this export]</em></p>`;
  const cols = ss.columns || [];
  let html = `<table class="simple-table"><thead><tr>${cols.map(c => `<th>${escapeHtml(c.name || "")}</th>`).join("")}</tr></thead><tbody>`;
  (ss.data || []).forEach(row => {
    html += `<tr>${cols.map(c => `<td>${escapeHtml(displayCell(row.cells?.[c.id], ss.data, cols))}</td>`).join("")}</tr>`;
  });
  html += `</tbody></table>`;
  return html;
}

function blockToHtml(b, ctx) {
  const lvl = headingLevel(b.type);
  if (b.type.startsWith("heading") && !b.type.startsWith("toggle") && lvl) return `<h${lvl}>${nl2br(b.text)}</h${lvl}>`;
  if (b.type.startsWith("toggleHeading") && lvl) return `<details><summary><strong style="font-size:1.${5-lvl}em">${nl2br(b.text)}</strong></summary><div style="margin-left:20px">${blocksToHtml(b.children || [], ctx)}</div></details>`;
  switch (b.type) {
    case "paragraph": return b.text ? `<p>${nl2br(b.text)}</p>` : `<p>&nbsp;</p>`;
    case "toggle": return `<details><summary>${nl2br(b.text)}</summary><div style="margin-left:20px">${blocksToHtml(b.children || [], ctx)}</div></details>`;
    case "callout": return `<div class="callout"><span>${escapeHtml(b.emoji || "💡")}</span><div>${nl2br(b.text)}</div></div>`;
    case "quote": return `<blockquote>${nl2br(b.text)}</blockquote>`;
    case "divider": return `<hr/>`;
    case "toc": return "";
        case "page": {
      const target = ctx?.pageFileMap?.[b.pageRef];
      if (target) {
        const title = ctx?.pagesById?.[b.pageRef]?.title || "Untitled";
        return `<p>📄 <a href="${escapeHtml(target)}">${escapeHtml(title)}</a></p>`;
      }
      return `<p>📄 <em>Linked page (not included in this export)</em></p>`;
    }
    case "columns": return `<div class="eris-columns" style="display:flex;gap:24px;">${(b.cols || []).map((c, i) => `<div class="eris-column" data-width="${(b.colWidths && b.colWidths[i]) ?? Math.round(100 / ((b.cols || []).length || 1))}" style="flex:${(b.colWidths && b.colWidths[i]) || 1};min-width:0;">${blocksToHtml(c.blocks, ctx)}</div>`).join("")}</div>`;
    case "image": return b.media?.dataUrl ? `<figure><img src="${b.media.dataUrl}"/></figure>` : "";
    case "video": return b.media?.dataUrl ? `<video src="${b.media.dataUrl}" controls></video>` : "";
    case "audio": return b.media?.dataUrl ? `<audio src="${b.media.dataUrl}" controls></audio>` : "";
    case "file": return b.media?.dataUrl ? `<p><a href="${b.media.dataUrl}" download="${escapeHtml(b.media.name || "file")}">📎 ${escapeHtml(b.media.name || "Download file")}</a></p>` : "";
    case "link": return b.url ? `<p><a href="${escapeHtml(b.url)}" target="_blank" rel="noopener">${escapeHtml(b.url)}</a></p>` : "";
    case "spotify": { const u = getSpotifyEmbedUrl(b.url); return u ? `<iframe src="${u}" width="100%" height="${spotifyDefaultHeight(b.url)}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>` : ""; }
    case "youtube": { const u = getYouTubeEmbedUrl(b.url); return u ? `<div style="position:relative;padding-bottom:56.25%;height:0;"><iframe src="${u}" style="position:absolute;top:0;left:0;width:100%;height:100%;" allowfullscreen></iframe></div>` : ""; }
    case "figma": { const u = getFigmaEmbedUrl(b.url); return u ? `<iframe src="${u}" width="100%" height="450" allowfullscreen></iframe>` : ""; }
    case "maps": { const u = getMapsEmbedUrl(b.url); return u ? `<iframe src="${u}" width="100%" height="360"></iframe>` : ""; }
    case "twitter": return b.url ? `<blockquote class="twitter-tweet"><a href="${escapeHtml(b.url)}"></a></blockquote>` : "";
    case "github": return b.url ? `<p><a href="${escapeHtml(b.url)}" target="_blank" rel="noopener">🔗 ${escapeHtml(b.url)}</a></p>` : "";
    case "embed": {
      const provider = detectEmbedProvider(b.url);
      const willEmbed = b.displayAs === "embed" || (b.displayAs !== "bookmark" && !!provider);
      if (!willEmbed) return b.url ? `<p><a href="${escapeHtml(b.url)}" target="_blank" rel="noopener">${escapeHtml(b.url)}</a></p>` : "";
      const u = provider?.embedUrl || b.url;
      return u ? `<iframe src="${u}" width="100%" height="${b.embedHeight || provider?.height || 400}"></iframe>` : "";
    }
    case "database": return renderDbTable(ctx?.databases?.[b.dbId]);
    case "spreadsheet": return renderSsTable(ctx?.spreadsheets?.[b.ssId]);
    default: return b.text ? `<p>${nl2br(b.text)}</p>` : "";
  }
}

function blocksToHtml(blocks, ctx) {
  let html = ""; let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.type === "bulleted" || b.type === "numbered") {
      const tag = b.type === "numbered" ? "ol" : "ul";
      html += `<${tag}>`;
      while (i < blocks.length && blocks[i].type === b.type) {
        html += `<li>${nl2br(blocks[i].text)}`;
        if (blocks[i].children?.length) html += blocksToHtml(blocks[i].children, ctx);
        html += `</li>`;
        i++;
      }
      html += `</${tag}>`;
      continue;
    }
    if (b.type === "todo") {
      html += `<ul class="to-do-list"><li><input type="checkbox" disabled ${b.checked ? "checked" : ""}/> <span${b.checked ? ' style="text-decoration:line-through;color:#8a8a88;"' : ""}>${nl2br(b.text)}</span></li></ul>`;
      i++; continue;
    }
    html += blockToHtml(b, ctx);
    i++;
  }
  return html;
}

function buildExportHtml(page, databases = {}, spreadsheets = {}, extra = {}) {
  const { pageFileMap = null, pagesById = null, includeIsland = true } = extra;
  const dbIds = new Set(), ssIds = new Set();
  collectDbAndSsIds(page.blocks || [], dbIds, ssIds);
  const dbData = {}; dbIds.forEach(id => { if (databases[id]) dbData[id] = databases[id]; });
  const ssData = {}; ssIds.forEach(id => { if (spreadsheets[id]) ssData[id] = spreadsheets[id]; });
  const ctx = { databases: dbData, spreadsheets: ssData, pageFileMap, pagesById };
  // Hidden data island: makes ERIS -> ERIS re-import perfectly lossless
  // (exact database view, column widths, page icon & cover all preserved),
  // while the rest of the document stays normal, readable HTML for viewing
  // or printing outside ERIS.
    const island = includeIsland
    ? JSON.stringify({ version: 1, page, databases: dbData, spreadsheets: ssData }).replace(/</g, "\\u003c")
    : null;
  const iconHtml = page.icon?.kind === "emoji" ? `<div class="page-icon">${escapeHtml(page.icon.value || "")}</div>`
    : page.icon?.kind === "image" ? `<img class="page-icon" src="${page.icon.value}"/>` : "";
  const coverHtml = page.cover?.kind === "image" ? `<div class="page-cover" style="background-image:url('${page.cover.value}')"></div>`
    : page.cover?.kind === "color" ? `<div class="page-cover" style="background:${page.cover.value}"></div>` : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(page.title || "Untitled")}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:900px;margin:40px auto;padding:0 24px 80px;color:#1F1F1F;line-height:1.55;}
  h1{font-size:2.1em;margin:0.6em 0 0.3em;} h2{font-size:1.6em;margin:0.8em 0 0.3em;} h3{font-size:1.3em;margin:0.8em 0 0.3em;} h4{font-size:1.1em;margin:0.8em 0 0.3em;}
  p{margin:0.3em 0;} blockquote{margin:12px 0;padding-left:14px;border-left:3px solid #ccc;font-style:italic;}
  hr{border:none;border-top:1px solid #e4e3e0;margin:20px 0;}
  ul,ol{padding-left:1.5em;margin:0.3em 0;} .to-do-list{list-style:none;padding-left:0.3em;}
  .callout{display:flex;gap:10px;background:#f1f0ec;border-radius:8px;padding:12px 14px;margin:8px 0;align-items:flex-start;}
  img,video{max-width:100%;border-radius:6px;} iframe{border:none;border-radius:8px;margin:8px 0;}
  details{margin:6px 0;} summary{cursor:pointer;font-weight:500;}
  .page-cover{height:180px;background-size:cover;background-position:center;border-radius:8px;margin-bottom:18px;}
  .page-header{display:flex;align-items:center;gap:14px;margin-bottom:4px;}
  .page-header .page-icon{font-size:48px;line-height:1;}
  .page-header img.page-icon{width:48px;height:48px;border-radius:8px;object-fit:cover;}
  .page-header h1{margin:0;}
  .eris-database, table.simple-table{width:100%;border-collapse:collapse;margin:10px 0;}
  .db-meta{font-size:12px;color:#8a8a88;margin-bottom:6px;}
  table.simple-table th, table.simple-table td{border:1px solid #e4e3e0;padding:6px 10px;font-size:14px;text-align:left;}
  table.simple-table th{background:#f7f6f3;font-weight:600;}
  @media print{ a{color:inherit;text-decoration:none;} iframe{display:none;} }
  /* Gallery */
  .db-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin:10px 0;}
  .db-card{border:1px solid #e4e3e0;border-radius:10px;overflow:hidden;background:#fff;}
  .db-card-cover{height:100px;background-size:cover;background-position:center;}
  .db-card-cover--empty{background:linear-gradient(135deg,#f1f0ec,#e4e3e0);}
  .db-card-body{padding:10px 12px 12px;}
  .db-card-title{font-weight:600;font-size:14px;margin-bottom:4px;}
  .db-card-prop{font-size:12px;color:#8a8a88;margin-bottom:2px;}
  /* Board */
  .db-board{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;}
  .db-board-col{width:240px;flex-shrink:0;}
  .db-board-col-header{display:flex;align-items:center;gap:6px;font-weight:600;font-size:13px;margin-bottom:8px;}
  .db-board-col-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
  .db-board-col-count{margin-left:auto;font-size:12px;color:#8a8a88;}
  .db-board-card{border:1px solid #e4e3e0;border-radius:8px;padding:10px 12px;margin-bottom:8px;background:#fff;}
  .db-board-card-title{font-weight:500;font-size:13px;}
  /* List */
  .db-list{list-style:none;padding:0;margin:8px 0;}
  .db-list-item{padding:8px 6px;border-bottom:1px solid #e4e3e0;font-size:14px;}
</style></head><body>
<div class="page-cover-wrap">${coverHtml}</div>
<div class="page-header">${iconHtml}<h1 class="page-title">${escapeHtml(page.title || "Untitled")}</h1></div>
<div class="page-body">
${blocksToHtml(page.blocks || [], ctx)}
</div>
${island ? `<script type="application/json" id="eris-data">${island}</script>` : ""}
<script async src="https://platform.twitter.com/widgets.js"></script>
</body></html>`;
}

function dataUrlParts(dataUrl) {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl || "");
  if (!m) return null;
  return { mime: m[1], base64: m[2] };
}
function extFromMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/gif") return "gif";
  if (mime === "image/webp") return "webp";
  if (mime === "image/svg+xml") return "svg";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  return "bin";
}

// Deep-clones a page and pulls every base64 image (blocks, icon, cover) out
// into a real file inside the zip under images/, replacing the dataUrl with
// a relative path so the exported HTML can reference a normal <img src>.
function extractPageImages(page, zip, imgCounter) {
  const clone = JSON.parse(JSON.stringify(page));
  function saveDataUrl(dataUrl) {
    const parts = dataUrlParts(dataUrl);
    if (!parts) return dataUrl;
    const ext = extFromMime(parts.mime);
    const name = `images/img_${imgCounter.n++}.${ext}`;
    zip.file(name, parts.base64, { base64: true });
    return name;
  }
  function walkBlocks(blocks) {
    (blocks || []).forEach(b => {
      if (b.media?.dataUrl && b.media.dataUrl.startsWith("data:")) {
        b.media = { ...b.media, dataUrl: saveDataUrl(b.media.dataUrl) };
      }
      if (b.children?.length) walkBlocks(b.children);
      if (b.cols) b.cols.forEach(c => walkBlocks(c.blocks));
    });
  }
  walkBlocks(clone.blocks);
  if (clone.icon?.kind === "image" && clone.icon.value?.startsWith("data:")) {
    clone.icon = { ...clone.icon, value: saveDataUrl(clone.icon.value) };
  }
  if (clone.cover?.kind === "image" && clone.cover.value?.startsWith("data:")) {
    clone.cover = { ...clone.cover, value: saveDataUrl(clone.cover.value) };
  }
  return clone;
}

// Walks parentId chains to find a page and every sub-page beneath it.
function collectDescendantPages(rootId, allPages) {
  const byParent = {};
  allPages.forEach(p => { (byParent[p.parentId] ||= []).push(p); });
  const out = [];
  function walk(id) {
    const p = allPages.find(x => x.id === id);
    if (!p) return;
    out.push(p);
    (byParent[id] || []).forEach(child => walk(child.id));
  }
  walk(rootId);
  return out;
}

// Gives every exported page a unique, safe .html filename.
function assignPageFileNames(pages) {
  const used = new Set();
  const map = {};
  pages.forEach(p => {
    const base = safeFileName(p.title);
    let name = `${base}.html`, i = 2;
    while (used.has(name.toLowerCase())) name = `${base}-${i++}.html`;
    used.add(name.toLowerCase());
    map[p.id] = name;
  });
  return map;
}

// Exports a page AND all of its sub-pages as a .zip: one HTML file per page,
// real image files under images/, and working links between the pages.
async function exportPageAsZip(page, allPages, databases = {}, spreadsheets = {}) {
  const JSZip = await loadJSZip();
  if (!JSZip) { alert("Couldn't load zip support. Check your connection and try again."); return; }
  const zip = new JSZip();
  const pagesToExport = collectDescendantPages(page.id, allPages);
  const pageFileMap = assignPageFileNames(pagesToExport);
  const pagesById = {}; pagesToExport.forEach(p => { pagesById[p.id] = p; });
  const imgCounter = { n: 1 };

  for (const p of pagesToExport) {
    const clone = extractPageImages(p, zip, imgCounter);
    const dbIds = new Set(), ssIds = new Set();
    collectDbAndSsIds(clone.blocks || [], dbIds, ssIds);
    const dbData = {}; dbIds.forEach(id => { if (databases[id]) dbData[id] = databases[id]; });
    const ssData = {}; ssIds.forEach(id => { if (spreadsheets[id]) ssData[id] = spreadsheets[id]; });
    const html = buildExportHtml(clone, dbData, ssData, { pageFileMap, pagesById, includeIsland: false });
    zip.file(pageFileMap[p.id], html);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${safeFileName(page.title)}.zip`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function downloadTextFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function safeFileName(s) {
  return (s || "Untitled").replace(/[\\/:*?"<>|]/g, "").trim() || "Untitled";
}

function exportPageAsHtml(page, databases = {}, spreadsheets = {}) {
  downloadTextFile(`${safeFileName(page.title)}.html`, buildExportHtml(page, databases, spreadsheets), "text/html");
}

// PDF export: no bundled PDF library, so we open the exported HTML in a new
// tab and trigger the browser's native print dialog — choosing "Save as
// PDF" there produces a real PDF without needing any extra dependency.
function exportPageAsPdf(page, databases = {}, spreadsheets = {}) {
  const html = buildExportHtml(page, databases, spreadsheets);
  const w = window.open("", "_blank");
  if (!w) { alert("Please allow pop-ups for this site to export as PDF."); return; }
  w.document.open(); w.document.write(html); w.document.close();
  const doPrint = () => { try { w.focus(); w.print(); } catch {} };
  w.addEventListener("load", doPrint);
  setTimeout(doPrint, 700);
}

export {
  parseNotionImport,
  exportPageAsHtml,
  exportPageAsPdf,
  exportPageAsZip,
};
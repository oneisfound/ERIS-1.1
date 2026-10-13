function parseSpotifyRef(input) {
  if (!input) return null;
  const raw = input.trim();
  try {
    if (raw.startsWith("spotify:")) {
      // spotify:track:ID  (also spotify:user:x:playlist:ID -> take last two)
      const parts = raw.split(":").filter(Boolean);
      if (parts.length >= 3) return { type: parts[parts.length - 2], id: parts[parts.length - 1] };
      return null;
    }
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (!url.hostname.includes("spotify.com")) return null;
    // Strip locale prefixes like /intl-fr/ or /intl-pt-BR/ that Spotify's
    // share links/mobile app add, which previously broke the embed URL.
    const clean = url.pathname.replace(/^\/intl-[a-z]{2}(-[A-Za-z]+)?/i, "");
    const m = clean.match(/\/(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/);
    if (!m) return null;
    return { type: m[1], id: m[2] };
  } catch { return null; }
}
function getSpotifyEmbedUrl(input) {
  const ref = parseSpotifyRef(input);
  if (!ref) return null;
  return `https://open.spotify.com/embed/${ref.type}/${ref.id}?utm_source=generator&theme=0`;
}
// Notion sizes tracks/episodes short, and albums/playlists/shows/artists tall.
function spotifyDefaultHeight(input) {
  const ref = parseSpotifyRef(input);
  if (!ref) return 152;
  return ["track", "episode"].includes(ref.type) ? 152 : 352;
}

function getGitHubEmbedUrl(input) {
  if (!input) return null;
  try {
    const raw = input.trim();
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./i, "");

    // github.com/owner/repo
    if (host === "github.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return {
          type: "repo",
          owner: parts[0],
          repo: parts[1].replace(/\.git$/, ""),
          path: parts.slice(2).join("/"),
          originalUrl: raw,
        };
      }
      return null;
    }

    // username.github.io[/reponame[/...]]
    const pagesMatch = host.match(/^([a-z0-9-]+)\.github\.io$/i);
    if (pagesMatch) {
      const owner = pagesMatch[1];
      const parts = url.pathname.split("/").filter(Boolean);
      const repo = parts.length ? parts[0] : `${owner}.github.io`;
      return {
        type: "repo",
        owner,
        repo,
        path: parts.slice(1).join("/"),
        originalUrl: raw,
        isPagesLink: true,
      };
    }

    return null;
  } catch { return null; }
}

// ---- YouTube ---------------------------------------------------------
function getYouTubeEmbedUrl(input) {
  if (!input) return null;
  try {
    const raw = input.trim();
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\.|^m\./, "");
    let id = null;
    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] || null;
    } else if (host.includes("youtube.com") || host.includes("youtube-nocookie.com")) {
      if (url.pathname.startsWith("/watch")) id = url.searchParams.get("v");
      else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2];
      else if (url.pathname.startsWith("/live/")) id = url.pathname.split("/")[2];
      else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2];
    }
    if (!id) return null;
    id = id.split("?")[0].split("&")[0];
    const start = url.searchParams.get("t") || url.searchParams.get("start");
    const startSecs = start ? parseInt(start, 10) : null;
    return `https://www.youtube.com/embed/${id}${startSecs ? `?start=${startSecs}` : ""}`;
  } catch { return null; }
}

// ---- Twitter / X -------------------------------------------------------
// The old approach proxied through twitframe.com (a third-party service
// that is frequently offline), which is why tweets never loaded. Real
// tweet embeds use Twitter/X's own oEmbed endpoint + widgets.js, the same
// mechanism Notion uses, so we do that instead (see TwitterBlock).
function isTwitterUrl(input) {
  if (!input) return false;
  try {
    const url = new URL(input.includes("://") ? input : `https://${input}`);
    return /(^|\.)(twitter\.com|x\.com)$/.test(url.hostname.replace(/^www\./, "")) &&
      /\/status(es)?\//.test(url.pathname);
  } catch { return false; }
}
let _twitterWidgetsLoading = null;
function loadTwitterWidgets() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.twttr?.widgets) return Promise.resolve();
  if (_twitterWidgetsLoading) return _twitterWidgetsLoading;

  _twitterWidgetsLoading = new Promise(resolve => {
    function waitForWidgets(attempt = 0) {
      if (window.twttr?.widgets) { resolve(); return; }
      if (attempt > 100) { resolve(); return; } // ~10s max wait, then give up
      setTimeout(() => waitForWidgets(attempt + 1), 100);
    }
    const existing = document.getElementById("twitter-wjs");
    if (existing) { waitForWidgets(); return; }
    const s = document.createElement("script");
    s.id = "twitter-wjs";
    s.src = "https://platform.twitter.com/widgets.js";
    s.async = true;
    s.onload = () => waitForWidgets();
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
  return _twitterWidgetsLoading;
}

function getFigmaEmbedUrl(input) {
  try {
    if (input.includes("figma.com")) {
      return `https://www.figma.com/embed?embed_host=eris&url=${encodeURIComponent(input)}`;
    }
    return null;
  } catch { return null; }
}

// ---- Google Maps ---------------------------------------------------------
// The old version always re-encoded the *entire* pasted URL as the `q`
// parameter, even when the user pasted a real Google Maps link — Maps then
// tried (and often failed) to search for a giant URL string instead of the
// actual place. This extracts the real place name / coordinates first.
function getMapsEmbedUrl(input) {
  if (!input) return null;
  const raw = input.trim();
  try {
    if (raw.includes("google.com/maps") || raw.includes("maps.app.goo.gl")) {
      const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
      // .../@37.7858,-122.4008,15z -> coordinates
      const coordMatch = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&z=15&output=embed`;
      }
      // .../place/Name+Of+Place/... -> place name
      const placeMatch = url.pathname.match(/\/place\/([^/]+)/);
      if (placeMatch) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(decodeURIComponent(placeMatch[1]).replace(/\+/g, " "))}&output=embed`;
      }
      // ?q=... already present
      const q = url.searchParams.get("q");
      if (q) return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
      // Fall back to letting Maps resolve the shortened/whole URL itself.
      return `https://maps.google.com/maps?q=${encodeURIComponent(raw)}&output=embed`;
    }
    // Treat as a plain search query / address
    return `https://maps.google.com/maps?q=${encodeURIComponent(raw)}&output=embed`;
  } catch { return null; }
}

const EMBED_PROVIDERS = [
  { test: u => /vimeo\.com\/(\d+)/.test(u), build: u => { const id = u.match(/vimeo\.com\/(\d+)/)[1]; return { embedUrl: `https://player.vimeo.com/video/${id}`, ratio: 0.5625 }; } },
  { test: u => /loom\.com\/share\//.test(u), build: u => ({ embedUrl: u.replace("/share/", "/embed/"), ratio: 0.5625 }) },
  { test: u => /codepen\.io\/[^/]+\/pen\//.test(u), build: u => ({ embedUrl: u.replace("/pen/", "/embed/"), height: 420 }) },
  { test: u => /codesandbox\.io\/s\//.test(u), build: u => ({ embedUrl: u.replace("codesandbox.io/s/", "codesandbox.io/embed/"), height: 500 }) },
  { test: u => /replit\.com\/@/.test(u), build: u => ({ embedUrl: `${u}${u.includes("?") ? "&" : "?"}embed=true`, height: 500 }) },
  { test: u => /docs\.google\.com\/(document|spreadsheets|presentation|forms)\//.test(u), build: u => ({ embedUrl: u.replace(/\/(edit|viewform).*$/, "/preview"), height: 480 } ) },
  { test: u => /calendar\.google\.com\/calendar/.test(u), build: u => ({ embedUrl: u, height: 480 }) },
  { test: u => /soundcloud\.com\//.test(u), build: u => ({ embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(u)}&color=%23ff5500&auto_play=false`, height: 166 }) },
  { test: u => /miro\.com\/app\/board\//.test(u), build: u => ({ embedUrl: u.replace("/app/board/", "/app/live-embed/"), height: 480 }) },
  { test: u => /excalidraw\.com\/#/.test(u), build: u => ({ embedUrl: u, height: 480 }) },
  { test: u => /gist\.github\.com\//.test(u), build: u => ({ embedUrl: u, height: 300, isGist: true }) },
  { test: u => /typeform\.com\//.test(u), build: u => ({ embedUrl: u, height: 500 }) },
  { test: u => /airtable\.com\/(embed\/|shr)/.test(u), build: u => ({ embedUrl: u.includes("/embed/") ? u : u.replace("airtable.com/", "airtable.com/embed/"), height: 480 }) },
  { test: u => /\.pdf($|\?)/i.test(u), build: u => ({ embedUrl: `https://docs.google.com/viewer?url=${encodeURIComponent(u)}&embedded=true`, height: 500 }) },
];
function detectEmbedProvider(input) {
  if (!input) return null;
  try {
    const url = input.includes("://") ? input : `https://${input}`;
    for (const p of EMBED_PROVIDERS) {
      if (p.test(url)) return p.build(url);
    }
    return null;
  } catch { return null; }
}

function getLinkPreviewData(url) {
  // We can't do real server-side preview, so we'll show a styled link card
  try {
    const u = new URL(url.startsWith("http") ? url : "https://"+url);
    return { hostname: u.hostname, href: u.href };
  } catch { return null; }
}

export {
  parseSpotifyRef,
  getSpotifyEmbedUrl,
  spotifyDefaultHeight,
  getGitHubEmbedUrl,
  getYouTubeEmbedUrl,
  isTwitterUrl,
  loadTwitterWidgets,
  getFigmaEmbedUrl,
  getMapsEmbedUrl,
  detectEmbedProvider,
  getLinkPreviewData,
};
import { useState, useRef, useEffect } from "react";
import { isTwitterUrl } from "../../utils/embeds";

function XLogo({ size = 16, color = "#fff" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TwitterBlock({ block, colors, onUpdate, locked }) {
  const [editing, setEditing] = useState(!block.url);
  const [inputVal, setInputVal] = useState(block.url || "");
  const ref = useRef(null);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  function commit() {
    const val = inputVal.trim();
    if (!val) return;
    onUpdate({ url: val });
    setEditing(false);
  }

  if (editing) {
    return (
      <div style={{ background: colors.surface, borderRadius: 12, border: "1.5px solid " + colors.border, overflow: "hidden" }}>
        <div style={{ background: "#000", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <XLogo size={18} />
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Post on X</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>Paste a post URL</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={ref}
              value={inputVal}
              onChange={function(e) { setInputVal(e.target.value); }}
              onKeyDown={function(e) {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setEditing(false);
              }}
              placeholder="https://x.com/user/status/..."
              style={{ flex: 1, padding: "9px 12px", border: "1px solid " + colors.border, borderRadius: 7, outline: "none", background: colors.bg, color: colors.text, fontSize: 13, fontFamily: "inherit" }}
            />
            <button onClick={commit} style={{ background: "#000", border: "none", borderRadius: 7, padding: "9px 18px", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 600 }}>
              Embed
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isTwitterUrl(block.url)) {
    return (
      <div style={{ padding: 12, color: "#e03", fontSize: 13, background: colors.surface, borderRadius: 8 }}>
        Invalid post URL. Paste a link to a specific post (contains "/status/").
        {!locked && (
          <button onClick={function() { setEditing(true); }} style={{ marginLeft: 8, background: "transparent", border: "none", cursor: "pointer", color: "#2383e2", fontSize: 13 }}>
            Edit
          </button>
        )}
      </div>
    );
  }

  var handleMatch = block.url.match(/(?:twitter|x)\.com\/(\w+)\/status\/(\d+)/i);
  var handle = handleMatch ? handleMatch[1] : null;
  var postId = handleMatch ? handleMatch[2] : null;

    return (
    <a
        href={block.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
        position: "relative",
        display: "block",
        borderRadius: 14,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        background: colors.bg,
        border: "1px solid " + colors.border,
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={function(e) {
        e.currentTarget.style.borderColor = "#1d9bf0";
        e.currentTarget.style.boxShadow = "0 2px 10px rgba(29,155,240,0.12)";
        var el = e.currentTarget.querySelector(".embed-actions");
        if (el) el.style.opacity = "1";
      }}
      onMouseLeave={function(e) {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.boxShadow = "none";
        var el = e.currentTarget.querySelector(".embed-actions");
        if (el) el.style.opacity = "0";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <XLogo size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 2 }}>
            {handle ? "@" + handle : "Post on X"}
          </div>
          <div style={{ fontSize: 13, color: colors.muted }}>
            {postId ? "Post " + postId.slice(0, 6) + "…" : "View on X"}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#1d9bf0", fontWeight: 600, padding: "6px 12px", borderRadius: 20, border: "1px solid #1d9bf0", flexShrink: 0, whiteSpace: "nowrap" }}>
          View post
        </div>
      </div>
      {!locked && (
        <div className="embed-actions" style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 4, opacity: 0, transition: "opacity 0.15s" }}>
          <button
            onClick={function(e) {
              e.preventDefault();
              setEditing(true);
              setInputVal(block.url || "");
            }}
            style={{ background: "rgba(0,0,0,0.65)", border: "none", borderRadius: 5, padding: "3px 8px", cursor: "pointer", color: "#fff", fontSize: 11 }}
          >
            Edit
          </button>
          <button
            onClick={function(e) {
              e.preventDefault();
              onUpdate({ url: null });
              setEditing(true);
            }}
            style={{ background: "rgba(0,0,0,0.65)", border: "none", borderRadius: 5, padding: "3px 8px", cursor: "pointer", color: "#fff", fontSize: 11 }}
          >
            Remove
          </button>
        </div>
      )}
    </a>
  );
}

export default TwitterBlock;
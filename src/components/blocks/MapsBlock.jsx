import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";
import { getMapsEmbedUrl } from "../../utils/embeds";


function MapsBlock({ block, colors, onUpdate, locked }) {
  const [editing, setEditing] = useState(!block.url);
  const [inputVal, setInputVal] = useState(block.url || "");
  const ref = useRef(null);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  function commit() {
    const val = inputVal.trim();
    if (!val) return;
    onUpdate({ url: val });
    setEditing(false);
  }

  if (editing) {
    return (
      <div style={{ background:colors.surface, borderRadius:10,
        border:`1.5px solid ${colors.border}`, overflow:"hidden" }}>
        <div style={{ background:"#4285F4", padding:"10px 14px",
          display:"flex", alignItems:"center", gap:8 }}>
          <MapPin size={16} color="#fff"/>
          <span style={{ color:"#fff", fontWeight:600, fontSize:14 }}>Google Maps</span>
        </div>
        <div style={{ padding:14 }}>
          <div style={{ fontSize:13, color:colors.muted, marginBottom:8 }}>
            Paste a Google Maps URL or type a location / search query
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input ref={ref} value={inputVal}
              onChange={e=>setInputVal(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter")commit(); if(e.key==="Escape")setEditing(false); }}
              placeholder="https://maps.google.com/... or 'Eiffel Tower, Paris'"
              style={{ flex:1, padding:"8px 12px", border:`1px solid ${colors.border}`,
                borderRadius:6, outline:"none", background:colors.bg,
                color:colors.text, fontSize:13, fontFamily:"inherit" }}
            />
            <button onClick={commit}
              style={{ background:"#4285F4", border:"none", borderRadius:6,
                padding:"8px 16px", cursor:"pointer", color:"#fff",
                fontSize:13, fontWeight:600 }}>
              Embed
            </button>
          </div>
        </div>
      </div>
    );
  }

  const embedUrl = getMapsEmbedUrl(block.url);

  return (
    <div style={{ position:"relative", borderRadius:10, overflow:"hidden",
      border:`1px solid ${colors.border}` }}
      onMouseEnter={e=>{ const el=e.currentTarget.querySelector(".embed-actions"); if(el)el.style.opacity="1"; }}
      onMouseLeave={e=>{ const el=e.currentTarget.querySelector(".embed-actions"); if(el)el.style.opacity="0"; }}>
      <iframe
        src={embedUrl}
        width="100%"
        height={360}
        style={{ border:"none", display:"block" }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {!locked && (
        <div className="embed-actions"
          style={{ position:"absolute", top:8, right:8, display:"flex", gap:4,
            opacity:0, transition:"opacity 0.15s" }}>
          <button onClick={()=>{ setEditing(true); setInputVal(block.url||""); }}
            style={{ background:"rgba(0,0,0,0.6)", border:"none", borderRadius:5,
              padding:"3px 8px", cursor:"pointer", color:"#fff", fontSize:11 }}>
            Edit
          </button>
          <button onClick={()=>{ onUpdate({ url:null }); setEditing(true); }}
            style={{ background:"rgba(0,0,0,0.6)", border:"none", borderRadius:5,
              padding:"3px 8px", cursor:"pointer", color:"#fff", fontSize:11 }}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

export default MapsBlock;
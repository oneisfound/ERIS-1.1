import { useState, useRef, useEffect } from "react";
import {
  Music,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

import {
  getSpotifyEmbedUrl,
  spotifyDefaultHeight,
} from "../../utils/embeds";

function SpotifyBlock({ block, colors, onUpdate, locked }) {
  const [editing, setEditing] = useState(!block.url);
  const [inputVal, setInputVal] = useState(block.url || "");
  const [compact, setCompact] = useState(false);
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  const wrapRef = useRef(null);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  function commit() {
    const val = inputVal.trim();
    if (!val) return;
    onUpdate({ url: val });
    setEditing(false);
  }

  function startResize(e) {
    if (locked) return;
    e.preventDefault();
    const pW = wrapRef.current?.parentElement?.offsetWidth || 600;
    const x0 = e.clientX, w0 = block.imageWidth || 100;
    const move = ev => onUpdate({ imageWidth: Math.max(30, Math.min(100, w0 + ((ev.clientX - x0) / pW) * 100)) });
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  }

  if (editing) {
    return (
      <div style={{ background:colors.surface, borderRadius:10,
        border:`1.5px solid ${colors.border}`, overflow:"hidden" }}>
        <div style={{ background:"#1DB954", padding:"10px 14px",
          display:"flex", alignItems:"center", gap:8 }}>
          <Music size={16} color="#fff"/>
          <span style={{ color:"#fff", fontWeight:600, fontSize:14 }}>Spotify</span>
        </div>
        <div style={{ padding:14 }}>
          <div style={{ fontSize:13, color:colors.muted, marginBottom:8 }}>
            Paste a Spotify link (track, album, playlist, podcast, artist)
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input
              ref={ref}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if(e.key==="Enter") commit(); if(e.key==="Escape") setEditing(false); }}
              placeholder="https://open.spotify.com/track/..."
              style={{ flex:1, padding:"8px 12px", border:`1px solid ${colors.border}`,
                borderRadius:6, outline:"none", background:colors.bg,
                color:colors.text, fontSize:13, fontFamily:"inherit" }}
            />
            <button onClick={commit}
              style={{ background:"#1DB954", border:"none", borderRadius:6,
                padding:"8px 16px", cursor:"pointer", color:"#fff",
                fontSize:13, fontWeight:600 }}>
              Embed
            </button>
          </div>
          <div style={{ fontSize:11, color:colors.muted, marginTop:8 }}>
            Tip: You can also paste a Spotify URI like <code>spotify:track:ID</code>
          </div>
        </div>
      </div>
    );
  }

  const embedUrl = getSpotifyEmbedUrl(block.url);
  if (!embedUrl) {
    return (
      <div style={{ padding:12, color:"#e03", fontSize:13,
        background:colors.surface, borderRadius:8 }}>
        Invalid Spotify URL. Paste a link from the Spotify "Share" menu.
        {!locked && <button onClick={()=>setEditing(true)}
          style={{ marginLeft:8, background:"transparent", border:"none",
            cursor:"pointer", color:"#2383e2", fontSize:13 }}>Edit</button>}
      </div>
    );
  }

  const align = block.imageAlign || "center";
  const width = block.imageWidth || 100;
  const mx = align==="left" ? {marginRight:"auto",marginLeft:0} : align==="right" ? {marginLeft:"auto",marginRight:0} : {margin:"0 auto"};
  const fullHeight = spotifyDefaultHeight(block.url);
  const height = compact ? 80 : fullHeight;

  return (
    <div ref={wrapRef} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {show && !locked && (
        <div style={{ display:"flex", gap:6, marginBottom:6, alignItems:"center" }}>
          {[["left",<AlignLeft size={13}/>],["center",<AlignCenter size={13}/>],["right",<AlignRight size={13}/>]].map(([a,ico])=>(
            <button key={a} onClick={()=>onUpdate({imageAlign:a})} style={{background:align===a?colors.border:"transparent",border:"none",borderRadius:4,padding:"4px 7px",cursor:"pointer",color:colors.text,display:"flex",alignItems:"center"}}>{ico}</button>
          ))}
          <button onClick={()=>setCompact(v=>!v)} style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,padding:"3px 9px",fontSize:12,cursor:"pointer",color:colors.text}}>
            {compact ? "Expanded" : "Compact"}
          </button>
          <span style={{fontSize:12,color:colors.muted,marginLeft:4}}>Width:{Math.round(width)}%</span>
          <a href={block.url} target="_blank" rel="noopener noreferrer" style={{marginLeft:"auto",fontSize:12,color:"#1DB954",textDecoration:"none",display:"flex",alignItems:"center",gap:4}}>
            <Music size={12}/>Open
          </a>
          <button onClick={()=>{ setEditing(true); setInputVal(block.url||""); }} style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,padding:"3px 9px",fontSize:12,cursor:"pointer",color:colors.muted}}>Edit</button>
          <button onClick={()=>{ onUpdate({ url:null }); setEditing(true); }} style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,padding:"3px 9px",fontSize:12,cursor:"pointer",color:colors.muted}}>Remove</button>
        </div>
      )}
      <div style={{ position:"relative", width:`${width}%`, ...mx, borderRadius:12, overflow:"hidden",
        border:`1px solid ${colors.border}`, boxShadow: show ? "0 2px 14px rgba(0,0,0,0.08)" : "none", transition:"box-shadow 0.15s" }}>
        <iframe
          src={embedUrl}
          width="100%"
          height={height}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ display:"block" }}
        />
        {show && !locked && (
          <div onMouseDown={startResize} style={{position:"absolute",right:-5,top:"50%",transform:"translateY(-50%)",width:10,height:36,background:colors.muted,borderRadius:5,cursor:"ew-resize",opacity:0.7}}/>
        )}
      </div>
    </div>
  );
}

export default SpotifyBlock;
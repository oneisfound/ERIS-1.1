import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";

import {
  detectEmbedProvider,
  getLinkPreviewData,
} from "../../utils/embeds";



function GenericEmbedBlock({ block, colors, onUpdate, locked }) {
  const [editing, setEditing] = useState(!block.url);
  const [inputVal, setInputVal] = useState(block.url || "");
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  const wrapRef = useRef(null);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  function commit() {
    let val = inputVal.trim();
    if (!val) return;
    if (!val.startsWith("http")) val = "https://" + val;
    onUpdate({ url: val, displayAs: null, embedHeight: null });
    setEditing(false);
  }

  if (editing) {
    return (
      <div style={{ background:colors.surface, borderRadius:10,
        border:`1.5px solid ${colors.border}`, overflow:"hidden" }}>
        <div style={{ background:colors.border, padding:"10px 14px",
          display:"flex", alignItems:"center", gap:8 }}>
          <Globe size={16} color={colors.muted}/>
          <span style={{ fontWeight:600, fontSize:14, color:colors.text }}>Embed</span>
        </div>
        <div style={{ padding:14 }}>
          <div style={{ fontSize:13, color:colors.muted, marginBottom:8 }}>
            Paste any URL to embed it
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input ref={ref} value={inputVal}
              onChange={e=>setInputVal(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter")commit(); if(e.key==="Escape")setEditing(false); }}
              placeholder="https://..."
              style={{ flex:1, padding:"8px 12px", border:`1px solid ${colors.border}`,
                borderRadius:6, outline:"none", background:colors.bg,
                color:colors.text, fontSize:13, fontFamily:"inherit" }}
            />
            <button onClick={commit}
              style={{ background:"#2383e2", border:"none", borderRadius:6,
                padding:"8px 16px", cursor:"pointer", color:"#fff",
                fontSize:13, fontWeight:600 }}>
              Embed
            </button>
          </div>
          <div style={{ fontSize:11, color:colors.muted, marginTop:8 }}>
            Docs, Sheets, Slides, Forms, Vimeo, Loom, CodePen, CodeSandbox, Replit, SoundCloud, Miro,
            Excalidraw, Airtable, Typeform, Gists and PDFs embed directly. Anything else shows as a
            bookmark card if the site blocks embedding — you can still switch to "Try embed" for it.
          </div>
        </div>
      </div>
    );
  }

  const provider = detectEmbedProvider(block.url);
  const forcedMode = block.displayAs; // "embed" | "bookmark" | null(auto)
  const willEmbed = forcedMode === "embed" || (forcedMode !== "bookmark" && !!provider);

  function startWidthResize(e) {
    if (locked) return;
    e.preventDefault();
    const pW = wrapRef.current?.parentElement?.offsetWidth || 600;
    const x0 = e.clientX, w0 = block.imageWidth || 100;
    const move = ev => onUpdate({ imageWidth: Math.max(30, Math.min(100, w0 + ((ev.clientX - x0) / pW) * 100)) });
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  }
  function startHeightResize(e) {
    if (locked) return;
    e.preventDefault();
    const y0 = e.clientY, h0 = block.embedHeight || provider?.height || 400;
    const move = ev => onUpdate({ embedHeight: Math.max(120, Math.min(1000, h0 + (ev.clientY - y0))) });
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  }

  // Bookmark fallback (matches Notion's behavior when a link can't be embedded)
  if (!willEmbed) {
    const preview = getLinkPreviewData(block.url);
    return (
      <div style={{ position:"relative" }}
        onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
        <a href={block.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none", display:"block" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10,
            background:colors.surface, borderRadius:8, padding:"12px 14px",
            border:`1px solid ${colors.border}` }}>
            <div style={{ width:36, height:36, borderRadius:6, background:colors.border,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <img src={`https://www.google.com/s2/favicons?domain=${preview?.hostname}&sz=32`} alt=""
                style={{ width:18, height:18 }} onError={e=>{ e.target.style.display="none"; }}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:500, color:colors.text,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{block.url}</div>
              <div style={{ fontSize:12, color:colors.muted, marginTop:2 }}>{preview?.hostname || "Bookmark"}</div>
            </div>
            <Globe size={14} style={{ color:colors.muted, flexShrink:0 }}/>
          </div>
        </a>
        {show && !locked && (
          <div style={{ position:"absolute", top:8, right:8, display:"flex", gap:4 }}>
            <button onClick={()=>onUpdate({ displayAs:"embed" })}
              style={{ background:colors.bg, border:`1px solid ${colors.border}`, borderRadius:5,
                padding:"3px 8px", cursor:"pointer", fontSize:11, color:colors.muted }}>
              Try embed
            </button>
            <button onClick={()=>{ setEditing(true); setInputVal(block.url||""); }}
              style={{ background:colors.bg, border:`1px solid ${colors.border}`, borderRadius:5,
                padding:"3px 8px", cursor:"pointer", fontSize:11, color:colors.muted }}>
              Edit
            </button>
            <button onClick={()=>onUpdate({ url:null })}
              style={{ background:colors.bg, border:`1px solid ${colors.border}`, borderRadius:5,
                padding:"3px 8px", cursor:"pointer", fontSize:11, color:colors.muted }}>
              Remove
            </button>
          </div>
        )}
      </div>
    );
  }

  const embedUrl = provider?.embedUrl || block.url;
  const height = block.embedHeight || provider?.height || 400;

  return (
    <div ref={wrapRef} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {show && !locked && (
        <div style={{ display:"flex", gap:6, marginBottom:6, alignItems:"center" }}>
          <span style={{ fontSize:12, color:colors.muted }}>Width:{Math.round(block.imageWidth||100)}%</span>
          {!provider && (
            <span style={{ fontSize:11, color:"#CB912F" }}>Unrecognized site — may not display if it blocks embedding</span>
          )}
          <a href={block.url} target="_blank" rel="noopener noreferrer"
            style={{ marginLeft:"auto", fontSize:12, color:"#2383e2", textDecoration:"none" }}>Open ↗</a>
          <button onClick={()=>onUpdate({ displayAs:"bookmark" })}
            style={{ background:"transparent", border:`1px solid ${colors.border}`, borderRadius:6,
              padding:"3px 9px", fontSize:12, cursor:"pointer", color:colors.muted }}>
            View as bookmark
          </button>
          <button onClick={()=>{ setEditing(true); setInputVal(block.url||""); }}
            style={{ background:"transparent", border:`1px solid ${colors.border}`, borderRadius:6,
              padding:"3px 9px", fontSize:12, cursor:"pointer", color:colors.muted }}>Edit</button>
          <button onClick={()=>onUpdate({ url:null })}
            style={{ background:"transparent", border:`1px solid ${colors.border}`, borderRadius:6,
              padding:"3px 9px", fontSize:12, cursor:"pointer", color:colors.muted }}>Remove</button>
        </div>
      )}
      <div style={{ position:"relative", width:`${block.imageWidth||100}%`,
        margin: (block.imageAlign==="left") ? "0 auto 0 0" : (block.imageAlign==="right") ? "0 0 0 auto" : "0 auto",
        borderRadius:10, overflow:"hidden", border:`1px solid ${colors.border}` }}>
        <iframe
          src={embedUrl}
          width="100%"
          height={height}
          style={{ border:"none", display:"block" }}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
        {show && !locked && (
          <>
            <div onMouseDown={startWidthResize} style={{position:"absolute",right:-5,top:"50%",transform:"translateY(-50%)",width:10,height:36,background:colors.muted,borderRadius:5,cursor:"ew-resize",opacity:0.7}}/>
            <div onMouseDown={startHeightResize} style={{position:"absolute",left:"50%",bottom:-4,transform:"translateX(-50%)",width:36,height:10,background:colors.muted,borderRadius:5,cursor:"ns-resize",opacity:0.7}}/>
          </>
        )}
      </div>
    </div>
  );
}

export default GenericEmbedBlock;
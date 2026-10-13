import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "lucide-react";
import { getLinkPreviewData } from "../../utils/embeds";
import IconEmojiPicker, { ICON_MAP } from "../ui/IconEmojiPicker";

const PALETTE = [
  "#9065B0", "#448361", "#E03E3E", "#C14C8A", "#787774", "#273669", "#7ADEB1",
  "#D9730D", "#F09EA8", "#9F6B53", "#337EA9", "#B0ED77", "#CB912F", "#E3A96F",
];

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const MIN_WIDTH = 180;
const MIN_HEIGHT = 56;

function LinkBlock({ block, colors, onUpdate, locked }) {
  const [editing, setEditing] = useState(!block.url);
  const [inputVal, setInputVal] = useState(block.url || "");
  const [styling, setStyling] = useState(false);
  const [labelVal, setLabelVal] = useState(block.label || "");
  const [pickingIcon, setPickingIcon] = useState(false);
  const ref = useRef(null);
  const styleBoxRef = useRef(null);
  const iconBoxRef = useRef(null);
  const wrapRef = useRef(null);

  const [liveSize, setLiveSize] = useState(null);
  const dragState = useRef(null);

  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  useEffect(() => {
    if (!styling) return;
    function onDocClick(e) {
      if (styleBoxRef.current && !styleBoxRef.current.contains(e.target)) setStyling(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [styling]);

  useEffect(() => {
    if (!pickingIcon) return;
    function onDocClick(e) {
      if (iconBoxRef.current && !iconBoxRef.current.contains(e.target)) setPickingIcon(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [pickingIcon]);

  function commit() {
    let val = inputVal.trim();
    if (!val) return;
    if (!val.startsWith("http")) val = "https://" + val;
    onUpdate({ url: val });
    setEditing(false);
  }

  function commitLabel() {
    onUpdate({ label: labelVal.trim() || null });
  }

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = wrapRef.current.getBoundingClientRect();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
    };

    function onMove(ev) {
      const d = dragState.current;
      if (!d) return;
      const newWidth = Math.max(MIN_WIDTH, d.startWidth + (ev.clientX - d.startX));
      const newHeight = Math.max(MIN_HEIGHT, d.startHeight + (ev.clientY - d.startY));
      setLiveSize({ width: newWidth, height: newHeight });
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setLiveSize(current => {
        if (current) onUpdate({ width: Math.round(current.width), height: Math.round(current.height) });
        return null;
      });
      dragState.current = null;
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [onUpdate]);

  if (editing) {
    return (
      <div style={{ display:"flex", gap:8, alignItems:"center",
        background:colors.surface, borderRadius:8, padding:"10px 14px",
        border:`1.5px solid ${colors.border}` }}>
        <Link size={15} style={{ color:colors.muted, flexShrink:0 }}/>
        <input
          ref={ref}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if(e.key==="Enter") commit(); if(e.key==="Escape") setEditing(false); }}
          placeholder="Paste a URL and press Enter…"
          style={{ flex:1, border:"none", outline:"none", background:"transparent",
            fontSize:14, color:colors.text, fontFamily:"inherit" }}
        />
        <button onClick={commit}
          style={{ background:"#2383e2", border:"none", borderRadius:5,
            padding:"4px 12px", cursor:"pointer", color:"#fff", fontSize:13 }}>
          Embed
        </button>
      </div>
    );
  }

  const preview = getLinkPreviewData(block.url);
  const displayText = block.label || block.url;
  const CustomIconComp = block.icon?.type === "icon" ? ICON_MAP[block.icon.value] : null;

  const boxBg = block.bgColor ? hexToRgba(block.bgColor, 0.16) : colors.surface;
  const boxBorder = block.bgColor ? hexToRgba(block.bgColor, 0.4) : colors.border;

  const sizeStyle = liveSize
    ? { width: liveSize.width, height: liveSize.height }
    : { width: block.width || "100%", height: block.height || "auto" };

  return (
    <div ref={wrapRef} style={{ position:"relative", ...sizeStyle, minWidth:MIN_WIDTH, minHeight:MIN_HEIGHT, boxSizing:"border-box" }}
      onMouseEnter={e => e.currentTarget.querySelector(".link-actions").style.opacity="1"}
      onMouseLeave={e => { if (!styling) e.currentTarget.querySelector(".link-actions").style.opacity="0"; }}>
      <a href={block.url} target="_blank" rel="noopener noreferrer"
        style={{ textDecoration:"none", display:"block", width:"100%", height:"100%" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, width:"100%", height:"100%",
          background:boxBg, borderRadius:8, padding:"10px 14px", boxSizing:"border-box",
          border:`1px solid ${boxBorder}`,
          transition:"border-color 0.15s, box-shadow 0.15s" }}
          onMouseEnter={e=>{ e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.08)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.boxShadow="none"; }}>

          <div
            ref={iconBoxRef}
            onClick={e => { if (locked) return; e.preventDefault(); e.stopPropagation(); setPickingIcon(v => !v); }}
            style={{
              width:32, height:32, borderRadius:6, background:colors.border,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              cursor: locked ? "default" : "pointer", position:"relative",
              fontSize: block.icon?.type === "emoji" ? 18 : undefined,
            }}
          >
            {block.icon?.type === "emoji" ? (
              <span>{block.icon.value}</span>
            ) : CustomIconComp ? (
              <CustomIconComp size={16} color={block.textColor || colors.text} />
            ) : (
              <img
                src={`https://www.google.com/s2/favicons?domain=${preview?.hostname}&sz=32`}
                alt="" style={{ width:16, height:16 }}
                onError={e=>{ e.target.style.display="none"; }}
              />
            )}

            {pickingIcon && (
              <div
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                style={{ position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:30 }}
              >
                <IconEmojiPicker
                  colors={colors}
                  currentIcon={block.icon || null}
                  onSelect={(icon) => onUpdate({ icon })}
                  onClose={() => setPickingIcon(false)}
                />
              </div>
            )}
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{
              fontSize:14,
              color: block.textColor || colors.text,
              fontWeight: block.bold ? 700 : 500,
              fontStyle: block.italic ? "italic" : "normal",
              textDecoration: block.underline ? "underline" : "none",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {displayText}
            </div>
            <div style={{ fontSize:12, color:colors.muted, marginTop:2 }}>
              {preview?.hostname}
            </div>
          </div>
          <div style={{ color:colors.muted, flexShrink:0 }}>
            <Link size={14}/>
          </div>
        </div>
      </a>

      {!locked && (
        <div className="link-actions"
          style={{ position:"absolute", top:8, right:8, display:"flex", gap:4,
            opacity: styling ? 1 : 0, transition:"opacity 0.15s" }}>
          <button
            onClick={e=>{ e.preventDefault(); e.stopPropagation(); setStyling(v=>!v); }}
            style={{ background:colors.bg, border:`1px solid ${colors.border}`,
              borderRadius:5, padding:"3px 8px", cursor:"pointer",
              fontSize:11, color:colors.muted }}>
            Style
          </button>
          <button onClick={e=>{ e.preventDefault(); setEditing(true); setInputVal(block.url||""); }}
            style={{ background:colors.bg, border:`1px solid ${colors.border}`,
              borderRadius:5, padding:"3px 8px", cursor:"pointer",
              fontSize:11, color:colors.muted }}>
            Edit URL
          </button>
          <button onClick={e=>{ e.preventDefault(); onUpdate({ url:null, label:null, textColor:null, bgColor:null, bold:false, italic:false, underline:false, width:null, height:null, icon:null }); setEditing(true); }}
            style={{ background:colors.bg, border:`1px solid ${colors.border}`,
              borderRadius:5, padding:"3px 8px", cursor:"pointer",
              fontSize:11, color:colors.muted }}>
            Remove
          </button>
        </div>
      )}

      {styling && (
        <div
          ref={styleBoxRef}
          onClick={e=>{ e.preventDefault(); e.stopPropagation(); }}
          onMouseDown={e=>e.stopPropagation()}
          style={{ position:"absolute", top:"calc(100% + 6px)", right:8, zIndex:20,
            background:colors.bg, border:`1px solid ${colors.border}`, borderRadius:8,
            padding:12, width:240, boxShadow:"0 4px 14px rgba(0,0,0,0.15)" }}>

          <div style={{ fontSize:11, color:colors.muted, marginBottom:4 }}>Display text</div>
          <input
            value={labelVal}
            onChange={e=>setLabelVal(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter") commitLabel(); }}
            onBlur={commitLabel}
            placeholder={block.url}
            style={{ width:"100%", border:`1px solid ${colors.border}`, borderRadius:5,
              padding:"6px 8px", fontSize:13, marginBottom:10,
              background:colors.surface, color:colors.text, outline:"none", fontFamily:"inherit" }}
          />

          <div style={{ fontSize:11, color:colors.muted, marginBottom:6 }}>Format</div>
          <div style={{ display:"flex", gap:6, marginBottom:10 }}>
            <button
              onClick={() => onUpdate({ bold: !block.bold })}
              title="Bold"
              style={{ width:26, height:26, borderRadius:5, cursor:"pointer",
                fontWeight:700, fontSize:13,
                background: block.bold ? "#2383e2" : colors.surface,
                color: block.bold ? "#fff" : colors.text,
                border:`1px solid ${colors.border}` }}>
              B
            </button>
            <button
              onClick={() => onUpdate({ italic: !block.italic })}
              title="Italic"
              style={{ width:26, height:26, borderRadius:5, cursor:"pointer",
                fontStyle:"italic", fontSize:13,
                background: block.italic ? "#2383e2" : colors.surface,
                color: block.italic ? "#fff" : colors.text,
                border:`1px solid ${colors.border}` }}>
              I
            </button>
            <button
              onClick={() => onUpdate({ underline: !block.underline })}
              title="Underline"
              style={{ width:26, height:26, borderRadius:5, cursor:"pointer",
                textDecoration:"underline", fontSize:13,
                background: block.underline ? "#2383e2" : colors.surface,
                color: block.underline ? "#fff" : colors.text,
                border:`1px solid ${colors.border}` }}>
              U
            </button>
          </div>

          <div style={{ fontSize:11, color:colors.muted, marginBottom:6 }}>Text color</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
            <button
              title="Default"
              onClick={() => onUpdate({ textColor: null })}
              style={{ width:22, height:22, borderRadius:"50%", background:colors.text,
                border: !block.textColor ? "2px solid #2383e2" : `1px solid ${colors.border}`,
                cursor:"pointer" }}
            />
            {PALETTE.map(c => (
              <button
                key={"text-"+c}
                title={c}
                onClick={() => onUpdate({ textColor: c })}
                style={{ width:22, height:22, borderRadius:"50%", background:c,
                  border: block.textColor === c ? "2px solid #2383e2" : `1px solid ${colors.border}`,
                  cursor:"pointer" }}
              />
            ))}
          </div>

          <div style={{ fontSize:11, color:colors.muted, marginBottom:6 }}>Background color</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            <button
              title="Default"
              onClick={() => onUpdate({ bgColor: null })}
              style={{ width:22, height:22, borderRadius:"50%", background:colors.surface,
                border: !block.bgColor ? "2px solid #2383e2" : `1px solid ${colors.border}`,
                cursor:"pointer" }}
            />
            {PALETTE.map(c => (
              <button
                key={"bg-"+c}
                title={c}
                onClick={() => onUpdate({ bgColor: c })}
                style={{ width:22, height:22, borderRadius:"50%", background:hexToRgba(c, 0.4),
                  border: block.bgColor === c ? "2px solid #2383e2" : `1px solid ${colors.border}`,
                  cursor:"pointer" }}
              />
            ))}
          </div>
        </div>
      )}

      {!locked && (
        <div
          onMouseDown={handleResizeStart}
          title="Drag to resize"
          style={{
            position:"absolute", bottom:2, right:2, width:14, height:14,
            cursor:"nwse-resize", zIndex:10,
            background:`linear-gradient(135deg, transparent 50%, ${colors.muted} 50%)`,
            opacity:0.5, borderRadius:2,
          }}
        />
      )}
    </div>
  );
}

export default LinkBlock;
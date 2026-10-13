import { useState } from "react";
import { Bold, Italic, Underline, Strikethrough, Code, Link as LinkIcon, Palette, Highlighter, X, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

const BASE_COLORS = ["#9065B0","#448361","#E03E3E","#C14C8A","#787774","#273669","#7ADEB1","#D9730D","#F09EA8","#9F6B53","#337EA9","#B0ED77","#CB912F","#E3A96F",];

// Converts a 6-digit hex into an 8-digit hex with baked-in alpha for highlight fills.
function withAlpha(hex, alpha) {
  const a = Math.round(alpha*255).toString(16).padStart(2,"0");
  return hex + a;
}

function SelectionToolbar({ rect, onFormat, darkMode }) {
  const [openPanel, setOpenPanel] = useState(null);
  const [linkVal, setLinkVal] = useState("");
  if (!rect) return null;

  const top = rect.top + window.scrollY - 44;
  const left = rect.left + window.scrollX + rect.width/2;

  const defaultTextColor = darkMode ? "#FFFFFF" : "#2F2F2F";

  const btn = (Icon, active, onClick, title) => (
    <button title={title} onMouseDown={e=>{e.preventDefault();onClick();}}
      style={{background:active?"#3a3a3a":"transparent",border:"none",borderRadius:5,padding:"6px 7px",cursor:"pointer",color:"#fff",display:"flex",alignItems:"center"}}
      onMouseEnter={e=>{if(!active)e.currentTarget.style.background="#333";}}
      onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}>
      <Icon size={14}/>
    </button>
  );

  return (
    <div data-selection-toolbar onMouseDown={e=>e.stopPropagation()}
      style={{position:"absolute",top,left,transform:"translateX(-50%)",zIndex:300,
        background:"#1F1F1F",borderRadius:8,padding:4,display:"flex",alignItems:"center",gap:2,boxShadow:"0 8px 24px rgba(0,0,0,0.35)"}}>
      {btn(Bold, false, ()=>onFormat("bold"), "Bold")}
      {btn(Italic, false, ()=>onFormat("italic"), "Italic")}
      {btn(Underline, false, ()=>onFormat("underline"), "Underline")}
      {btn(Strikethrough, false, ()=>onFormat("strike"), "Strikethrough")}
      {btn(Code, false, ()=>onFormat("code"), "Inline code")}
      {btn(LinkIcon, openPanel==="link", ()=>setOpenPanel(p=>p==="link"?null:"link"), "Link")}
      {btn(Palette, openPanel==="color", ()=>setOpenPanel(p=>p==="color"?null:"color"), "Text color")}
      {btn(Highlighter, openPanel==="highlight", ()=>setOpenPanel(p=>p==="highlight"?null:"highlight"), "Highlight")}
      <div style={{width:1,height:18,background:"rgba(255,255,255,0.15)",margin:"0 2px"}}/>
        {btn(AlignLeft, false, ()=>onFormat("align",{value:"left"}), "Align left")}
        {btn(AlignCenter, false, ()=>onFormat("align",{value:"center"}), "Align center")}
        {btn(AlignRight, false, ()=>onFormat("align",{value:"right"}), "Align right")}

      {openPanel==="color" && (
        <div style={{position:"absolute",top:"100%",left:0,marginTop:4,background:"#2A2A2A",borderRadius:8,padding:6,display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,boxShadow:"0 8px 24px rgba(0,0,0,0.35)"}}>
          <div onMouseDown={e=>{e.preventDefault();onFormat("color",{value:null});setOpenPanel(null);}}
            title="Default"
            style={{width:20,height:20,borderRadius:5,background:defaultTextColor,cursor:"pointer",border:"1px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <X size={10} color={darkMode?"#000":"#fff"}/>
          </div>
          {BASE_COLORS.map(c=><div key={c} onMouseDown={e=>{e.preventDefault();onFormat("color",{value:c});setOpenPanel(null);}} style={{width:20,height:20,borderRadius:5,background:c,cursor:"pointer",border:"1px solid rgba(255,255,255,0.15)"}}/>)}
        </div>
      )}
      {openPanel==="highlight" && (
        <div style={{position:"absolute",top:"100%",left:0,marginTop:4,background:"#2A2A2A",borderRadius:8,padding:6,display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,boxShadow:"0 8px 24px rgba(0,0,0,0.35)"}}>
          <div onMouseDown={e=>{e.preventDefault();onFormat("highlight",{value:null});setOpenPanel(null);}}
            title="None"
            style={{width:20,height:20,borderRadius:5,background:"transparent",cursor:"pointer",border:"1px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <X size={10} color="#fff"/>
          </div>
          {BASE_COLORS.map(c=><div key={c} onMouseDown={e=>{e.preventDefault();onFormat("highlight",{value:withAlpha(c,0.28)});setOpenPanel(null);}} style={{width:20,height:20,borderRadius:5,background:withAlpha(c,0.65),cursor:"pointer",border:"1px solid rgba(255,255,255,0.15)"}}/>)}
        </div>
      )}
      {openPanel==="link" && (
        <div onMouseDown={e=>e.stopPropagation()} style={{position:"absolute",top:"100%",left:0,marginTop:4,background:"#2A2A2A",borderRadius:8,padding:8,display:"flex",gap:6,boxShadow:"0 8px 24px rgba(0,0,0,0.35)"}}>
          <input value={linkVal} onChange={e=>setLinkVal(e.target.value)} placeholder="Paste link"
            onKeyDown={e=>{if(e.key==="Enter"&&linkVal.trim()){onFormat("link",{url:linkVal.trim()});setOpenPanel(null);setLinkVal("");}}}
            style={{background:"#1F1F1F",border:"1px solid #444",borderRadius:5,padding:"5px 8px",color:"#fff",fontSize:12,width:180,outline:"none"}}/>
          <button onMouseDown={e=>{e.preventDefault();if(linkVal.trim()){onFormat("link",{url:linkVal.trim()});setOpenPanel(null);setLinkVal("");}}}
            style={{background:"#2383e2",border:"none",borderRadius:5,padding:"5px 10px",color:"#fff",fontSize:12,cursor:"pointer"}}>Apply</button>
        </div>
      )}
    </div>
  );
}

export default SelectionToolbar;
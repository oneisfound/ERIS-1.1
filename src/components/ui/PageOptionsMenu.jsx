import { useState, useRef, useEffect } from "react";
import PageColorPicker from "./PageColorPicker";
import PageFontPicker from "./PageFontPicker";                    // ADD
import { getPageColor, getPageFont } from "../../utils/data";     // ADD getPageFont
import { FONT_OPTIONS } from "../../data/constants";              // ADDype icon
import { MoreHorizontal, Lock, Unlock, Moon, Sun, Copy, Trash2, Maximize2, Minimize2, FileText, Undo2, Redo2, Palette, Type } from "lucide-react";
import { Share2 } from "lucide-react"; // add Share2 to your existing lucide-react import line


function blocksToText(blocks, depth=0) {
  let o=""; const p=" ".repeat(depth);
  for (const b of blocks) {
    if (b.text) o+=p+b.text+"\n";
    if (b.children?.length) o+=blocksToText(b.children,depth+1);
    if (b.type==="columns"&&b.cols) b.cols.forEach(c=>{o+=blocksToText(c.blocks,depth+1);});
  }
  return o;
}

function PageOptionsMenu({colors,darkMode,setDarkMode,activePage,updatePage,onTrash,fullWidth,setFullWidth,onDuplicate,onUndo,onRedo,onSelectAll,canUndo,canRedo,onCopyPageLink,onSharePage}) {
  const[open,setOpen]=useState(false);
  const[colorOpen,setColorOpen]=useState(false);
  const[fontOpen,setFontOpen]=useState(false);   // ADD
  const ref=useRef(null);
  useEffect(()=>{function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);}document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const locked=activePage?.locked||false;
  const pill=v=>(<div style={{width:32,height:18,borderRadius:9,background:v?"#2383e2":colors.border,position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{position:"absolute",top:3,left:v?15:3,width:12,height:12,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/></div>);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareStatus, setShareStatus] = useState(""); // for feedback text
  const item=(icon,label,fn,danger=false,extra=null,disabled=false)=>(<div onClick={()=>{if(disabled)return;fn();setOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:6,cursor:disabled?"default":"pointer",fontSize:13.5,color:disabled?colors.muted:danger?"#e03":colors.text,userSelect:"none",opacity:disabled?0.5:1}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.background=danger?"rgba(238,0,51,0.08)":colors.surface;}} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><span style={{flexShrink:0,display:"flex"}}>{icon}</span><span style={{flex:1}}>{label}</span>{extra}</div>);
  const div=<div style={{height:1,background:colors.border,margin:"4px 0"}}/>;

console.log("activePage is:", activePage);

async function handleShare() {
  const email = shareEmail.trim().toLowerCase();
  if (!email) return;
  setShareStatus("Searching...");
  try {
    await onSharePage(email);
    setShareStatus(`Shared!`);
    setShareEmail("");
  } catch (err) {
    console.error("Share error:", err);
    setShareStatus("Something went wrong: " + err.message);
  }
}


  return(
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(v=>!v)} style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,padding:"6px 8px",cursor:"pointer",color:colors.text,display:"flex",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><MoreHorizontal size={16}/></button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,width:240,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:9,padding:5,zIndex:200,boxShadow:"0 10px 36px rgba(0,0,0,0.16)",animation:"menuSlideIn 0.12s ease"}}>
          {item(darkMode?<Sun size={15}/>:<Moon size={15}/>,darkMode?"Light mode":"Dark mode",()=>setDarkMode(v=>!v),false,pill(darkMode))}
          {item(<Undo2 size={15}/> ,"Undo",onUndo,false,null,!canUndo)}
          {item(<Redo2 size={15}/> ,"Redo",onRedo,false,null,!canRedo)}
          {item(<Copy size={15}/> ,"Select all blocks",onSelectAll)}
          {item(<Copy size={15}/>,"Copy content",()=>{const t=(activePage?.title?activePage.title+"\n\n":"")+blocksToText(activePage?.blocks||[]);navigator.clipboard.writeText(t).catch(()=>{});})}
          {item(<Copy size={15}/>,"Copy link to page",onCopyPageLink)}
          {item(<FileText size={15}/>,"Duplicate page",onDuplicate)}
          {div}
          {item(<Copy size={15}/>,"Copy content",()=>{const t=(activePage?.title?activePage.title+"\n\n":"")+blocksToText(activePage?.blocks||[]);navigator.clipboard.writeText(t).catch(()=>{});})}
                    {item(<FileText size={15}/>,"Duplicate page",onDuplicate)}
          {div}
          <div onClick={()=>setColorOpen(v=>!v)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:6,cursor:"pointer",fontSize:13.5,color:colors.text,userSelect:"none"}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{flexShrink:0,display:"flex"}}><Palette size={15}/></span>
            <span style={{flex:1}}>Page color</span>
            
            <span style={{fontSize:11,color:colors.muted}}>{colorOpen?"▴":"▾"}</span>
          </div>
          {colorOpen&&(
            <div style={{padding:"2px 8px 8px"}}>
              <PageColorPicker activeColor={getPageColor(activePage)} colors={colors} onPick={(colorId)=>updatePage(activePage.id,{color:colorId})}/>
            </div>
          )}
          {div}
<div onClick={()=>setFontOpen(v=>!v)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:6,cursor:"pointer",fontSize:13.5,color:colors.text,userSelect:"none"}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
  <span style={{flexShrink:0,display:"flex"}}><Type size={15}/></span>
  <span style={{flex:1}}>Page font</span>
  <span style={{fontSize:11,color:colors.muted}}>{fontOpen?"▴":"▾"}</span>
</div>
{fontOpen&&(
  <div style={{padding:"2px 8px 8px"}}>
    <PageFontPicker activeFont={getPageFont(activePage)} colors={colors} onPick={(fontId)=>updatePage(activePage.id,{font:fontId})}/>
  </div>
)}
{div}
<div onClick={()=>setShareOpen(v=>!v)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:6,cursor:"pointer",fontSize:13.5,color:colors.text,userSelect:"none"}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
  <span style={{flexShrink:0,display:"flex"}}><Share2 size={15}/></span>
  <span style={{flex:1}}>Share page</span>
  <span style={{fontSize:11,color:colors.muted}}>{shareOpen?"▴":"▾"}</span>
</div>
{shareOpen&&(
  <div style={{padding:"6px 12px 10px",display:"flex",flexDirection:"column",gap:6}}>
    <input
      type="email"
      placeholder="Enter email"
      value={shareEmail}
      onChange={(e)=>setShareEmail(e.target.value)}
      style={{padding:"6px 8px",borderRadius:6,border:`1px solid ${colors.border}`,background:colors.bg||"transparent",color:colors.text,fontSize:13}}
    />
    <button
      onClick={handleShare}
      style={{padding:"6px 8px",borderRadius:6,border:"none",background:"#2383e2",color:"#fff",fontSize:13,cursor:"pointer"}}
    >
      Share
    </button>
    {shareStatus && <span style={{fontSize:11.5,color:colors.muted}}>{shareStatus}</span>}
  </div>
)}
          {div}
          {item(fullWidth?<Minimize2 size={15}/>:<Maximize2 size={15}/>,fullWidth?"Centered width":"Full width",()=>setFullWidth(v=>!v),false,pill(fullWidth))}
          {item(locked?<Unlock size={15}/>:<Lock size={15}/>,locked?"Unlock page":"Lock page",()=>updatePage(activePage.id,{locked:!locked}),false,pill(locked))}
          {div}
          {item(<Trash2 size={15}/>,"Move to trash",onTrash,true)}
        </div>
      )}
    </div>
  );
}

export default PageOptionsMenu;
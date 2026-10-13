import { useState, useEffect, useRef } from "react";
import { Sparkles, Upload, Download, FileCode, FileDown, Archive } from "lucide-react";

function ImportExportMenu({colors,activePage,onImportFile,onExportHtml,onExportPdf,onExportZip,importStatus}) {
  const[open,setOpen]=useState(false);
  const ref=useRef(null);
  const fileRef=useRef(null);
  useEffect(()=>{function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);}document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const item=(icon,label,fn,disabled=false)=>(<div onClick={()=>{if(disabled)return;fn();setOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:6,cursor:disabled?"default":"pointer",fontSize:13.5,color:disabled?colors.muted:colors.text,userSelect:"none",opacity:disabled?0.5:1}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.background=colors.surface;}} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><span style={{flexShrink:0,display:"flex"}}>{icon}</span><span style={{flex:1}}>{label}</span></div>);
  const div=<div style={{height:1,background:colors.border,margin:"4px 0"}}/>;
  const loading=importStatus==="loading";
  return(
    <div ref={ref} style={{position:"relative"}}>
      <input ref={fileRef} type="file" accept=".html,.htm,.zip,.md,.markdown,.csv" style={{display:"none"}}
        onChange={e=>{const f=e.target.files[0];if(f)onImportFile(f);e.target.value="";}}/>
      <button onClick={()=>setOpen(v=>!v)} title="Import / Export"
        style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,padding:"6px 8px",cursor:"pointer",color:colors.text,display:"flex",alignItems:"center",gap:6}}
        onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        {loading ? <Sparkles size={16}/> : <Download size={16}/>}
        {loading && <span style={{fontSize:12}}>Importing…</span>}
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,width:260,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:9,padding:5,zIndex:200,boxShadow:"0 10px 36px rgba(0,0,0,0.16)",animation:"menuSlideIn 0.12s ease"}}>
          <div style={{padding:"4px 12px 8px",fontSize:11,fontWeight:600,color:colors.muted,textTransform:"uppercase",letterSpacing:0.4}}>Notion</div>
          {item(<Upload size={15}/>,"Import from Notion…",()=>fileRef.current?.click())}
          <div style={{padding:"2px 12px 8px",fontSize:11,color:colors.muted}}>Accepts HTML, ZIP, Markdown, or CSV files</div>
          {div}
          {item(<FileCode size={15}/>,"Export page as HTML",onExportHtml,!activePage)}
          {item(<FileDown size={15}/>,"Export page as PDF",onExportPdf,!activePage)}
          {item(<Archive size={15}/>,"Export page + sub-pages as ZIP",onExportZip,!activePage)}
          {importStatus?.error&&(<><div/><div style={{padding:"8px 12px 4px",fontSize:12,color:"#e03"}}>{importStatus.error}</div></>)}
        </div>
      )}
    </div>
  );
}

export default ImportExportMenu;
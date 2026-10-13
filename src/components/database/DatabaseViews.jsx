import { useState, useRef, useEffect } from "react";
import { Check, X, Plus, MoreVertical } from "lucide-react";
import { NUMBER_FORMATS, FILTER_OPERATORS, PROP_TYPES, PROP_ICONS } from "../../data/constants";
import { rid } from "../../utils/data";
import RenderIcon from "../ui/RenderIcon";
import { MiniPageEditor } from "../../App";

function colorWithOpacity(hex, opacity) {
  const value = (hex || "").replace("#", "");
  if (value.length !== 6) return null;
  const number = parseInt(value, 16);
  return `rgba(${number >> 16},${(number >> 8) & 255},${number & 255},${opacity})`;
}

function CellValue({ prop, value, colors }) {
  if (prop.type === "checkbox")
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:16,height:16,borderRadius:3,
          border:`2px solid ${value?"#2383e2":colors.border}`,
          background:value?"#2383e2":"transparent",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          {value && <Check size={10} color="#fff"/>}
        </div>
      </div>
    );

  if (prop.type === "select") {
    const opt = prop.options?.find(o => o.id===value || o.name===value);
    return opt
      ? <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",
          borderRadius:4,background:opt.color+"33",color:opt.color,
          fontSize:12,fontWeight:500,whiteSpace:"nowrap"}}>{opt.name}</span>
      : <span/>;
  }

  if (prop.type === "multi-select") {
    const vals = Array.isArray(value) ? value : [];
    return (
      <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
        {vals.map(v => {
          const opt = prop.options?.find(o => o.id===v || o.name===v);
          return opt
            ? <span key={v} style={{display:"inline-flex",alignItems:"center",
                padding:"2px 7px",borderRadius:4,background:opt.color+"33",
                color:opt.color,fontSize:11,fontWeight:500}}>{opt.name}</span>
            : null;
        })}
      </div>
    );
  }

  if (prop.type === "progress") {
    const pct = Math.max(0, Math.min(100, parseFloat(value) || 0));
    return (
      <div style={{display:"flex",alignItems:"center",gap:6,width:"100%"}}>
        <div style={{flex:1,height:6,background:colors.border,borderRadius:3,overflow:"hidden"}}>
          <div style={{width:`${pct}%`,height:"100%",borderRadius:3,transition:"width 0.3s",
            background:pct>=100?"#4DAB9A":pct>50?"#2383e2":"#FFA344"}}/>
        </div>
        <span style={{fontSize:11,color:colors.muted,flexShrink:0,minWidth:28}}>{pct}%</span>
      </div>
    );
  }

  if (prop.type === "date" && value) {
    const d = new Date(value);
    const formatted = isNaN(d)
      ? value
      : d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
    return <span style={{fontSize:13,color:colors.text}}>{formatted}</span>;
  }

  if (prop.type === "number" && value !== "" && value !== null && value !== undefined) {
    const fmt = NUMBER_FORMATS[prop.numberFormat || "number"];
    const display = fmt ? fmt.format(value) : String(value);
    return <span style={{fontSize:13,color:colors.text,fontFamily:"monospace"}}>{display}</span>;
  }

  if (prop.type === "formula") {
    return <span style={{fontSize:13,color:"#2383e2",fontFamily:"monospace"}}>{value||""}</span>;
  }

  if (prop.type === "relation") {
    const ids = Array.isArray(value) ? value : [];
    return (
      <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
        {ids.map(id => (
          <span key={id} style={{padding:"1px 6px",borderRadius:4,
            background:colors.surface,border:`1px solid ${colors.border}`,fontSize:12}}>
            {id}
          </span>
        ))}
      </div>
    );
  }

  return (
    <span style={{fontSize:13,color:colors.text,overflow:"hidden",
      textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>
      {value || ""}
    </span>
  );
}

function CellEditor({prop,value,onChange,colors,onClose}) {
  const[v,setV]=useState(value??"");
  const ref=useRef(null);
  useEffect(()=>{if(ref.current)ref.current.focus();},[]);
  if(prop.type==="checkbox")return(<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px"}}><div onClick={()=>{onChange(!value);onClose();}} style={{width:18,height:18,borderRadius:3,border:`2px solid ${value?"#2383e2":colors.border}`,background:value?"#2383e2":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>{value&&<Check size={12} color="#fff"/>}</div></div>);
  if(prop.type==="date")return(<div style={{padding:"4px 0"}}><input ref={ref} type="date" value={v||""} onChange={e=>{setV(e.target.value);onChange(e.target.value);}} onBlur={onClose} style={{width:"100%",padding:"6px 10px",border:"none",outline:"none",background:"transparent",fontSize:13,color:colors.text,fontFamily:"inherit"}}/></div>);
  if(prop.type==="progress")return(<div style={{padding:"8px 12px",minWidth:180}}><div style={{display:"flex",alignItems:"center",gap:8}}><input ref={ref} type="range" min="0" max="100" step="1" value={parseFloat(v)||0} onChange={e=>{setV(e.target.value);onChange(e.target.value);}} style={{flex:1}}/><span style={{fontSize:12,minWidth:32}}>{parseFloat(v)||0}%</span></div><button onClick={onClose} style={{marginTop:6,width:"100%",padding:4,border:"none",borderRadius:4,background:colors.border,color:colors.text,cursor:"pointer"}}>Done</button></div>);
  if(prop.type==="select")return(<div style={{padding:6,minWidth:180}}>{prop.options?.map(opt=>(<div key={opt.id} onMouseDown={()=>{onChange(opt.id);onClose();}} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:5,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><span style={{width:10,height:10,borderRadius:"50%",background:opt.color,display:"inline-block",flexShrink:0}}/><span style={{fontSize:13}}>{opt.name}</span>{value===opt.id&&<Check size={12} style={{marginLeft:"auto",color:"#2383e2"}}/>}</div>))}<div onMouseDown={()=>{onChange(null);onClose();}} style={{padding:"6px 10px",borderRadius:5,cursor:"pointer",fontSize:12,color:colors.muted}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Clear</div></div>);
  if(prop.type==="multi-select"){const cur=Array.isArray(value)?value:[];return(<div style={{padding:6,minWidth:180}}>{prop.options?.map(opt=>{const sel=cur.includes(opt.id);return(<div key={opt.id} onMouseDown={()=>{const n=sel?cur.filter(x=>x!==opt.id):[...cur,opt.id];onChange(n);}} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:5,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><div style={{width:14,height:14,borderRadius:3,border:`2px solid ${sel?"#2383e2":colors.border}`,background:sel?"#2383e2":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{sel&&<Check size={9} color="#fff"/>}</div><span style={{fontSize:13,flex:1}}>{opt.name}</span><span style={{width:10,height:10,borderRadius:"50%",background:opt.color,display:"inline-block"}}/></div>);})}<div onMouseDown={()=>{onChange([]);onClose();}} style={{padding:"6px 10px",borderRadius:5,cursor:"pointer",fontSize:12,color:colors.muted}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Clear all</div></div>);}
  return(<div style={{padding:"4px 0"}}><input ref={ref} value={v} onChange={e=>setV(e.target.value)} onBlur={()=>{onChange(v);onClose();}} onKeyDown={e=>{if(e.key==="Enter"||e.key==="Escape"){onChange(v);onClose();}}} style={{width:"100%",padding:"6px 10px",border:"none",outline:"none",background:"transparent",fontSize:13,color:colors.text,fontFamily:"inherit"}}/></div>);
}

function FilterSortPanel({ db, view, colors, onUpdateView }) {
  const [tab, setTab] = useState("filter");

  function addFilter() {
    const prop = db.properties[0];
    onUpdateView({ filters: [...(view.filters||[]), {id:rid(),propId:prop.id,operator:"contains",value:""}] });
  }
  function removeFilter(fid) { onUpdateView({ filters:(view.filters||[]).filter(f=>f.id!==fid) }); }
  function updateFilter(fid, ch) { onUpdateView({ filters:(view.filters||[]).map(f=>f.id!==fid?f:{...f,...ch}) }); }
  function addSort() {
    const prop = db.properties[0];
    onUpdateView({ sorts: [...(view.sorts||[]), {id:rid(),propId:prop.id,direction:"asc"}] });
  }
  function removeSort(sid) { onUpdateView({ sorts:(view.sorts||[]).filter(s=>s.id!==sid) }); }
  function updateSort(sid, ch) { onUpdateView({ sorts:(view.sorts||[]).map(s=>s.id!==sid?s:{...s,...ch}) }); }

  const sel = {
    border:`1px solid ${colors.border}`,borderRadius:5,padding:"4px 6px",
    background:colors.bg,color:colors.text,fontSize:12,cursor:"pointer",outline:"none",
  };

  return (
    <div style={{position:"absolute",top:"100%",left:0,marginTop:4,width:400,
      background:colors.sidebar,border:`1px solid ${colors.border}`,
      borderRadius:10,padding:14,zIndex:50,boxShadow:"0 8px 32px rgba(0,0,0,0.15)"}}>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:12}}>
        {[
          {k:"filter", label:`Filter${view.filters?.length?` (${view.filters.length})`:""}`},
          {k:"sort",   label:`Sort${view.sorts?.length?` (${view.sorts.length})`:""}`},
          {k:"group",  label:"Group"},
        ].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)}
            style={{flex:1,padding:"5px 0",borderRadius:6,border:"none",cursor:"pointer",
              fontSize:12,fontWeight:tab===t.k?600:400,
              background:tab===t.k?colors.border:"transparent",color:colors.text}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter tab */}
      {tab==="filter" && (
        <div>
          {(view.filters||[]).map(f => {
            const prop = db.properties.find(p=>p.id===f.propId);
            const ops = FILTER_OPERATORS[prop?.type] || FILTER_OPERATORS.text;
            const noValue = ["is empty","is not empty","is checked","is not checked"].includes(f.operator);
            return (
              <div key={f.id} style={{display:"flex",gap:6,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                <select value={f.propId}
                  onChange={e=>updateFilter(f.id,{propId:e.target.value,operator:"contains",value:""})}
                  style={sel}>
                  {db.properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={f.operator} onChange={e=>updateFilter(f.id,{operator:e.target.value})} style={sel}>
                  {ops.map(op=><option key={op} value={op}>{op}</option>)}
                </select>
                {!noValue && (
                  prop?.type==="select" ? (
                    <select value={f.value} onChange={e=>updateFilter(f.id,{value:e.target.value})} style={sel}>
                      <option value="">Any</option>
                      {prop.options?.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  ) : prop?.type==="checkbox" ? null : (
                    <input value={f.value||""} onChange={e=>updateFilter(f.id,{value:e.target.value})}
                      placeholder="Value"
                      style={{...sel,flex:1,minWidth:60,padding:"4px 8px"}}/>
                  )
                )}
                <button onClick={()=>removeFilter(f.id)}
                  style={{background:"transparent",border:"none",cursor:"pointer",color:"#e03",padding:2,display:"flex"}}>
                  <X size={13}/>
                </button>
              </div>
            );
          })}
          <button onClick={addFilter}
            style={{display:"flex",alignItems:"center",gap:5,background:"transparent",
              border:`1px dashed ${colors.border}`,borderRadius:6,padding:"5px 10px",
              cursor:"pointer",color:colors.muted,fontSize:12,marginTop:4}}>
            <Plus size={12}/>Add filter
          </button>
        </div>
      )}

      {/* Sort tab */}
      {tab==="sort" && (
        <div>
          {(view.sorts||[]).map(s=>(
            <div key={s.id} style={{display:"flex",gap:6,alignItems:"center",marginBottom:8}}>
              <select value={s.propId} onChange={e=>updateSort(s.id,{propId:e.target.value})} style={sel}>
                {db.properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={s.direction} onChange={e=>updateSort(s.id,{direction:e.target.value})} style={sel}>
                <option value="asc">Ascending ↑</option>
                <option value="desc">Descending ↓</option>
              </select>
              <button onClick={()=>removeSort(s.id)}
                style={{background:"transparent",border:"none",cursor:"pointer",color:"#e03",padding:2,display:"flex"}}>
                <X size={13}/>
              </button>
            </div>
          ))}
          <button onClick={addSort}
            style={{display:"flex",alignItems:"center",gap:5,background:"transparent",
              border:`1px dashed ${colors.border}`,borderRadius:6,padding:"5px 10px",
              cursor:"pointer",color:colors.muted,fontSize:12,marginTop:4}}>
            <Plus size={12}/>Add sort
          </button>
        </div>
      )}

      {/* Group tab */}
      {tab==="group" && (
        <div>
          <div style={{fontSize:12,color:colors.muted,marginBottom:8}}>Group by property:</div>
          <select value={view.groupBy||""}
            onChange={e=>onUpdateView({groupBy:e.target.value||null})}
            style={{...sel,width:"100%",padding:"6px 8px"}}>
            <option value="">No grouping</option>
            {db.properties.filter(p=>p.type==="select"||p.type==="checkbox").map(p=>(
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function RowModal({row,colors,darkMode,onClose,onUpdateRowPage}) {
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <MiniPageEditor rowId={row.id} pageData={row.pageData} colors={colors} darkMode={darkMode}
        onUpdate={(_,pd)=>onUpdateRowPage(row.id,pd)} onClose={onClose} locked={false}/>
    </div>
  );
}

function TableView({db,colors,onUpdateCell,onAddRow,onAddProp,onDeleteRow,onUpdateProp,onOpenRow,onReorderRows,locked}) {
  const[ec,setEc]=useState(null);const[hovRow,setHovRow]=useState(null);const[pm,setPm]=useState(null);const[dragRow,setDragRow]=useState(null);const[dragOver,setDragOver]=useState(null);
  return(
    <div style={{overflowX:"auto"}}>
      <table style={{borderCollapse:"collapse",width:"100%",tableLayout:"fixed",minWidth:db.properties.length*160+120}}>
        <colgroup><col style={{width:32}}/>{db.properties.map(p=><col key={p.id} style={{width:160}}/>)}<col style={{width:100}}/></colgroup>
        <thead><tr style={{borderBottom:`1px solid ${colors.border}`}}>
          <th style={{padding:"8px 4px",width:32}}/>
          {db.properties.map(prop=>(
            <th key={prop.id} style={{padding:"6px 8px",textAlign:"left",fontWeight:500,fontSize:12,color:colors.muted,borderRight:`1px solid ${colors.border}`,position:"relative"}}>
              <div style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer"}} onClick={()=>!locked&&setPm(pm===prop.id?null:prop.id)}>
                <span style={{display:"flex",color:colors.muted}}>{PROP_ICONS[prop.type]}</span><span>{prop.name}</span>
                {!locked&&!prop.isPrimary&&<MoreVertical size={11} style={{marginLeft:"auto",opacity:0.5}}/>}
              </div>
              {pm===prop.id&&!locked&&(
                <div style={{position:"absolute",top:"100%",left:0,zIndex:30,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:8,padding:6,minWidth:180,boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>
                  {PROP_TYPES.map(pt=>(<div key={pt} onMouseDown={()=>{onUpdateProp(prop.id,{type:pt});setPm(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:5,cursor:"pointer",background:prop.type===pt?colors.surface:"transparent",fontSize:13}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background=prop.type===pt?colors.surface:"transparent"}><span style={{color:colors.muted}}>{PROP_ICONS[pt]}</span>{pt}</div>))}
                  <div style={{height:1,background:colors.border,margin:"4px 0"}}/>
                                    {prop.type==="number" && (
                    <>
                      <div style={{height:1,background:colors.border,margin:"4px 0"}}/>
                      <div style={{padding:"4px 8px",fontSize:11,color:colors.muted,fontWeight:600}}>FORMAT</div>
                      {Object.entries(NUMBER_FORMATS).map(([key,fmt])=>(
                        <div key={key}
                          onMouseDown={()=>{onUpdateProp(prop.id,{numberFormat:key});setPm(null);}}
                          style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",
                            borderRadius:5,cursor:"pointer",fontSize:12,
                            background:prop.numberFormat===key?colors.surface:"transparent"}}
                          onMouseEnter={e=>e.currentTarget.style.background=colors.surface}
                          onMouseLeave={e=>e.currentTarget.style.background=prop.numberFormat===key?colors.surface:"transparent"}>
                          {fmt.label}
                        </div>
                      ))}
                    </>
                  )}
                  {prop.type==="formula" && (
                    <>
                      <div style={{height:1,background:colors.border,margin:"4px 0"}}/>
                      <div style={{padding:"4px 8px",fontSize:11,color:colors.muted}}>EXPRESSION</div>
                      <div style={{padding:"4px 8px"}}>
                        <input
                          defaultValue={prop.formulaExpr||""}
                          placeholder="{Price} * 1.1"
                          onBlur={e=>onUpdateProp(prop.id,{formulaExpr:e.target.value})}
                          onKeyDown={e=>{if(e.key==="Enter")onUpdateProp(prop.id,{formulaExpr:e.target.value});}}
                          onClick={e=>e.stopPropagation()}
                          style={{width:"100%",padding:"4px 6px",border:`1px solid ${colors.border}`,
                            borderRadius:4,outline:"none",background:colors.bg,
                            color:colors.text,fontSize:11,fontFamily:"monospace"}}
                        />
                      </div>
                    </>
                  )}
                  <div style={{height:1,background:colors.border,margin:"4px 0"}}/>
                  <div onMouseDown={()=>{onUpdateProp(prop.id,"DELETE");setPm(null);}} style={{padding:"6px 8px",borderRadius:5,cursor:"pointer",fontSize:13,color:"#e03"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(238,0,51,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Delete property</div>
                </div>
              )}
            </th>
          ))}
          <th style={{padding:"6px 8px"}}>{!locked&&<button onClick={onAddProp} style={{background:"transparent",border:"none",cursor:"pointer",color:colors.muted,display:"flex",alignItems:"center",gap:4,fontSize:12,padding:"2px 4px",borderRadius:4}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Plus size={12}/>Prop</button>}</th>
        </tr></thead>
        <tbody>
          {db.rows.map(row=>(
            <tr key={row.id} draggable={!locked} onDragStart={e=>{setDragRow(row.id);e.dataTransfer.effectAllowed="move";}} onDragOver={e=>{e.preventDefault();setDragOver(row.id);}} onDrop={e=>{e.preventDefault();if(dragRow&&dragRow!==row.id)onReorderRows(dragRow,row.id);setDragRow(null);setDragOver(null);}} onDragEnd={()=>{setDragRow(null);setDragOver(null);}} onMouseEnter={()=>setHovRow(row.id)} onMouseLeave={()=>setHovRow(null)} style={{borderBottom:`1px solid ${colors.border}`,borderTop:dragOver===row.id?"2px solid #2383e2":"none",background:hovRow===row.id?colors.surface:"transparent",opacity:dragRow===row.id?0.45:1,transition:"background 0.08s"}}>
              <td style={{padding:"6px 4px",textAlign:"center",width:32}}>{!locked&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:2}}><span title="Drag to reorder" style={{cursor:"grab",color:colors.muted,fontSize:12}}>⋮⋮</span>{hovRow===row.id&&<button onClick={()=>onDeleteRow(row.id)} title="Delete entry" style={{background:"transparent",border:"none",cursor:"pointer",color:colors.muted,padding:0,display:"flex"}}><X size={13}/></button>}</div>}</td>
              {db.properties.map(prop=>(
                <td key={prop.id} style={{padding:0,borderRight:`1px solid ${colors.border}`,position:"relative",verticalAlign:"middle",height:36}}>
                  {ec?.rowId===row.id&&ec?.propId===prop.id&&!locked?<div style={{position:"absolute",top:0,left:0,zIndex:20,background:colors.sidebar,border:`1px solid #2383e2`,borderRadius:4,minWidth:200,boxShadow:"0 4px 16px rgba(0,0,0,0.12)"}}><CellEditor prop={prop} value={row.cells[prop.id]} colors={colors} onChange={val=>onUpdateCell(row.id,prop.id,val)} onClose={()=>setEc(null)}/></div>
                  :<div onClick={()=>!locked&&(prop.isPrimary?onOpenRow(row):setEc({rowId:row.id,propId:prop.id}))} style={{padding:"6px 10px",minHeight:36,cursor:locked?"default":"pointer",display:"flex",alignItems:"center"}}>
                    {prop.isPrimary?<div style={{display:"flex",alignItems:"center",gap:6,width:"100%"}}><span style={{fontSize:13,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.cells[prop.id]||""}</span>{hovRow===row.id&&!locked&&<button onMouseDown={e=>{e.stopPropagation();onOpenRow(row);}} style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:4,padding:"2px 6px",cursor:"pointer",fontSize:11,color:colors.muted,flexShrink:0}}>Open</button>}</div>:<CellValue prop={prop} value={row.cells[prop.id]} colors={colors}/>}
                  </div>}
                </td>
              ))}
              <td/>
            </tr>
          ))}
        </tbody>
      </table>
      {!locked&&(<button onClick={onAddRow} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",background:"transparent",border:"none",cursor:"pointer",color:colors.muted,fontSize:13,width:"100%",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Plus size={13}/>New row</button>)}
    </div>
  );
}

// UPDATED: GalleryView opens MiniPageEditor when clicking a card
function GalleryView({db,colors,darkMode,onAddRow,onDeleteRow,onReorderRows,onUpdateRowPage,locked}) {
  const primary=db.properties.find(p=>p.isPrimary)||db.properties[0];
  const visProps=db.properties.filter(p=>!p.isPrimary).slice(0,3);
  const[hov,setHov]=useState(null);
  const[miniPage,setMiniPage]=useState(null);
  const[dragRow,setDragRow]=useState(null);
  const[dragOver,setDragOver]=useState(null);

  return(
    <>
      <div style={{display:"grid",gridTemplateColumns:`repeat(auto-fill,minmax(${db.galleryCardSize==="small"?160:db.galleryCardSize==="large"?300:220}px,1fr))`,gap:12,padding:"4px 0 16px"}}>
        {db.rows.map(row=>{
          // Use mini-page title if set, otherwise fall back to primary cell
          const displayTitle = (row.pageData?.title) || row.cells[primary?.id] || "Untitled";
          const displayIcon = row.pageData?.icon || null;
          return(
            <div key={row.id} draggable={!locked} onDragStart={e=>{setDragRow(row.id);e.dataTransfer.effectAllowed="move";}} onDragOver={e=>{e.preventDefault();setDragOver(row.id);}} onDrop={e=>{e.preventDefault();if(dragRow&&dragRow!==row.id)onReorderRows(dragRow,row.id);setDragRow(null);setDragOver(null);}} onDragEnd={()=>{setDragRow(null);setDragOver(null);}} onMouseEnter={()=>setHov(row.id)} onMouseLeave={()=>setHov(null)}
              onClick={()=>setMiniPage({row})}
              style={{background:colorWithOpacity(db.backgroundColor,0.5)||colors.sidebar,border:`1px solid ${dragOver===row.id?"#2383e2":colors.border}`,borderRadius:10,overflow:"hidden",cursor:locked?"pointer":"grab",transition:"box-shadow 0.15s,transform 0.15s",boxShadow:hov===row.id?"0 4px 16px rgba(0,0,0,0.1)":"0 1px 4px rgba(0,0,0,0.04)",transform:hov===row.id?"translateY(-2px)":"none",opacity:dragRow===row.id?0.45:1,position:"relative"}}>
              {/* Card cover */}
              {row.pageData?.cover?(
                <div style={{height:100,background:row.pageData.cover.kind==="image"?`url(${row.pageData.cover.value}) center ${row.pageData.cover.positionY??50}%/cover no-repeat`:row.pageData.cover.value}}/>
              ):(
                <div style={{height:100,background:`linear-gradient(135deg,${colors.surface} 0%,${colors.border} 100%)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {displayIcon?<RenderIcon icon={displayIcon} size={36}/>:<span style={{fontSize:32,opacity:0.3}}>📄</span>}
                </div>
              )}
              <div style={{padding:"10px 12px 12px"}}>
                {/* Title row with icon */}
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  {displayIcon&&row.pageData?.cover&&(
                    <span style={{flexShrink:0}}>
                      <RenderIcon icon={displayIcon} size={16}/>
                    </span>
                  )}
                  {displayIcon&&!row.pageData?.cover&&null}
                  <div style={{fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>
                    {displayTitle}
                  </div>
                </div>
                {visProps.map(prop=><div key={prop.id} style={{marginBottom:4}}><CellValue prop={prop} value={row.cells[prop.id]} colors={colors}/></div>)}
              </div>
              {hov===row.id&&!locked&&<button onMouseDown={e=>{e.stopPropagation();onDeleteRow(row.id);}} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.35)",border:"none",borderRadius:4,padding:"3px 5px",cursor:"pointer",color:"#fff",display:"flex"}}><X size={12}/></button>}
            </div>
          );
        })}
        {!locked&&(<div onClick={()=>onAddRow()} style={{border:`1.5px dashed ${colors.border}`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",minHeight:160,cursor:"pointer",color:colors.muted,fontSize:13}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Plus size={14} style={{marginRight:4}}/>New item</div>)}
      </div>
      {miniPage&&(
        <MiniPageEditor
          rowId={miniPage.row.id}
          pageData={miniPage.row.pageData}
          colors={colors}
          darkMode={darkMode}
          onUpdate={(rowId,pd)=>{
            onUpdateRowPage(rowId,pd);
            setMiniPage(mp=>mp?{...mp,row:{...mp.row,pageData:pd}}:null);
          }}
          onClose={()=>setMiniPage(null)}
          locked={locked}
        />
      )}
    </>
  );
}

function BoardView({ db, colors, onAddRow, onOpenRow, onDeleteRow, onUpdateCell, locked }) {
  const primary   = db.properties.find(p=>p.isPrimary) || db.properties[0];
  const groupProp = db.properties.find(p=>p.type==="select" && !p.isPrimary);
  const [hov,     setHov]     = useState(null);
  const [dragging,setDragging]= useState(null); // {rowId}
  const [dragOver,setDragOver]= useState(null); // {colId}

  const columns = groupProp
    ? [{id:"__none__",name:"No status",color:colors.muted}, ...(groupProp.options||[])]
    : [{id:"__none__",name:"All",color:colors.muted}];

  function getColRows(colId) {
    if (!groupProp) return db.rows;
    if (colId==="__none__") return db.rows.filter(r=>!r.cells[groupProp.id]);
    return db.rows.filter(r=>r.cells[groupProp.id]===colId);
  }
  function handleDragStart(e, row) {
    setDragging({rowId:row.id});
    e.dataTransfer.effectAllowed="move";
  }
  function handleDrop(e, colId) {
    e.preventDefault();
    if (!dragging || !groupProp) return;
    onUpdateCell(dragging.rowId, groupProp.id, colId==="__none__" ? null : colId);
    setDragging(null); setDragOver(null);
  }

  return (
    <div style={{display:"flex",gap:12,overflowX:"auto",alignItems:"flex-start",paddingBottom:16}}>
      {columns.map(col => {
        const rows = getColRows(col.id);
        const isOver = dragOver===col.id;
        return (
          <div key={col.id} style={{width:240,flexShrink:0}}
            onDragOver={e=>{e.preventDefault();setDragOver(col.id);}}
            onDragLeave={()=>setDragOver(null)}
            onDrop={e=>handleDrop(e,col.id)}>
            {/* Column header */}
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:col.color,flexShrink:0}}/>
              <span style={{fontSize:13,fontWeight:600}}>{col.name}</span>
              <span style={{fontSize:12,color:colors.muted,marginLeft:"auto"}}>{rows.length}</span>
            </div>
            {/* Cards */}
            <div style={{display:"flex",flexDirection:"column",gap:8,minHeight:60,
              padding:isOver?"6px":"0",borderRadius:8,
              background:isOver?"rgba(35,131,226,0.06)":"transparent",
              border:isOver?`2px dashed #2383e2`:`2px solid transparent`,
              transition:"all 0.15s"}}>
              {rows.map(row=>(
                <div key={row.id}
                  draggable={!locked}
                  onDragStart={e=>handleDragStart(e,row)}
                  onDragEnd={()=>{setDragging(null);setDragOver(null);}}
                  onMouseEnter={()=>setHov(row.id)}
                  onMouseLeave={()=>setHov(null)}
                  onClick={()=>onOpenRow(row)}
                  style={{background:colors.sidebar,
                    border:`1px solid ${dragging?.rowId===row.id?"#2383e2":colors.border}`,
                    borderRadius:8,padding:"10px 12px",
                    cursor:locked?"pointer":"grab",
                    transition:"box-shadow 0.12s,opacity 0.15s",
                    boxShadow:hov===row.id?"0 3px 12px rgba(0,0,0,0.1)":"none",
                    opacity:dragging?.rowId===row.id?0.35:1,
                    position:"relative"}}>
                  <div style={{fontWeight:500,fontSize:13,marginBottom:4,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {row.cells[primary?.id]||"Untitled"}
                  </div>
                  {/* Show other props as pills */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                    {db.properties.filter(p=>!p.isPrimary&&p.type==="select").map(p=>(
                      <CellValue key={p.id} prop={p} value={row.cells[p.id]} colors={colors}/>
                    ))}
                  </div>
                  {hov===row.id&&!locked&&(
                    <button onMouseDown={e=>{e.stopPropagation();onDeleteRow(row.id);}}
                      style={{position:"absolute",top:6,right:6,background:"transparent",
                        border:"none",cursor:"pointer",color:colors.muted,padding:2,display:"flex"}}>
                      <X size={12}/>
                    </button>
                  )}
                </div>
              ))}
              {/* Drop indicator */}
              {isOver&&dragging&&(
                <div style={{height:4,background:"#2383e2",borderRadius:2,opacity:0.7}}/>
              )}
              {/* Add button */}
              {!locked&&(
                <button
                  onClick={()=>onAddRow(groupProp?{[groupProp.id]:col.id==="__none__"?null:col.id}:{})}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",
                    background:"transparent",border:`1px dashed ${colors.border}`,
                    borderRadius:8,cursor:"pointer",color:colors.muted,fontSize:12,
                    width:"100%",justifyContent:"center"}}
                  onMouseEnter={e=>e.currentTarget.style.background=colors.surface}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Plus size={12}/>Add
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({db,colors,onAddRow,onOpenRow,onDeleteRow,locked}) {
  const primary=db.properties.find(p=>p.isPrimary)||db.properties[0];
  const[hov,setHov]=useState(null);
  return(
    <div>
      {db.rows.map(row=>(
        <div key={row.id} onMouseEnter={()=>setHov(row.id)} onMouseLeave={()=>setHov(null)} onClick={()=>onOpenRow(row)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 6px",borderBottom:`1px solid ${colors.border}`,cursor:"pointer",background:hov===row.id?colors.surface:"transparent",borderRadius:5,transition:"background 0.08s"}}>
          <div style={{flex:1,fontSize:14,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.cells[primary?.id]||"Untitled"}</div>
          {db.properties.filter(p=>!p.isPrimary).slice(0,3).map(p=>(<div key={p.id} style={{flexShrink:0,maxWidth:120}}><CellValue prop={p} value={row.cells[p.id]} colors={colors}/></div>))}
          {hov===row.id&&!locked&&<button onMouseDown={e=>{e.stopPropagation();onDeleteRow(row.id);}} style={{background:"transparent",border:"none",cursor:"pointer",color:colors.muted,padding:2,display:"flex",flexShrink:0}}><X size={13}/></button>}
        </div>
      ))}
      {!locked&&(<button onClick={()=>onAddRow()} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 6px",background:"transparent",border:"none",cursor:"pointer",color:colors.muted,fontSize:13,width:"100%"}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Plus size={13}/>New item</button>)}
    </div>
  );
}

function CalendarView({ db, colors, onAddRow, onOpenRow, locked }) {
  const primary  = db.properties.find(p=>p.isPrimary) || db.properties[0];
  const dateProp = db.properties.find(p=>p.type==="date");
  const [curr, setCurr] = useState(new Date());
  const year = curr.getFullYear(), month = curr.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const monthName   = curr.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const today       = new Date();

  function dayStr(d) {
    return `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }
  function rowsForDay(d) {
    if (!dateProp) return [];
    return db.rows.filter(r => r.cells[dateProp.id] === dayStr(d));
  }

  const cells = [];
  for (let i=0; i<firstDay; i++) cells.push(null);
  for (let i=1; i<=daysInMonth; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Nav */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button onClick={()=>setCurr(new Date(year,month-1,1))}
          style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,
            padding:"4px 12px",cursor:"pointer",color:colors.text,fontSize:16}}>‹</button>
        <span style={{fontWeight:600,fontSize:15,flex:1,textAlign:"center"}}>{monthName}</span>
        <button onClick={()=>setCurr(new Date())}
          style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,
            padding:"4px 10px",cursor:"pointer",color:colors.text,fontSize:12}}>Today</button>
        <button onClick={()=>setCurr(new Date(year,month+1,1))}
          style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,
            padding:"4px 12px",cursor:"pointer",color:colors.text,fontSize:16}}>›</button>
      </div>

      {!dateProp && (
        <div style={{padding:20,textAlign:"center",color:colors.muted,fontSize:13,
          background:colors.surface,borderRadius:8}}>
          Add a <strong>Date</strong> property to use Calendar view.
        </div>
      )}

      {dateProp && (
        <div style={{border:`1px solid ${colors.border}`,borderRadius:10,overflow:"hidden"}}>
          {/* Weekday headers */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",
            background:colors.surface,borderBottom:`1px solid ${colors.border}`}}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
              <div key={d} style={{padding:"8px 4px",textAlign:"center",
                fontSize:12,fontWeight:600,color:colors.muted}}>{d}</div>
            ))}
          </div>
          {/* Day grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
            {cells.map((d,i)=>{
              const isToday = d && today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;
              const rows = d ? rowsForDay(d) : [];
              return (
                <div key={i}
                  style={{minHeight:90,
                    borderRight: i%7!==6 ? `1px solid ${colors.border}` : "none",
                    borderBottom: `1px solid ${colors.border}`,
                    padding:"4px",
                    background: d ? colors.bg : colors.surface,
                    opacity: d ? 1 : 0.4}}>
                  {d && (
                    <>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                        <span style={{fontSize:12,fontWeight:isToday?700:400,
                          color:isToday?"#fff":"inherit",
                          background:isToday?"#2383e2":"transparent",
                          borderRadius:"50%",width:22,height:22,
                          display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {d}
                        </span>
                        {!locked && (
                          <button onClick={()=>onAddRow({[dateProp.id]:dayStr(d)})}
                            style={{background:"transparent",border:"none",cursor:"pointer",
                              color:colors.muted,padding:2,fontSize:14,lineHeight:1,
                              borderRadius:3,display:"flex"}}
                            onMouseEnter={e=>e.currentTarget.style.background=colors.surface}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <Plus size={11}/>
                          </button>
                        )}
                      </div>
                      {rows.map(row=>(
                        <div key={row.id} onClick={()=>onOpenRow(row)}
                          style={{padding:"2px 5px",borderRadius:3,marginBottom:2,
                            background:"#2383e2",color:"#fff",fontSize:11,
                            cursor:"pointer",overflow:"hidden",
                            textOverflow:"ellipsis",whiteSpace:"nowrap"}}
                          onMouseEnter={e=>e.currentTarget.style.background="#1a6cc4"}
                          onMouseLeave={e=>e.currentTarget.style.background="#2383e2"}>
                          {row.cells[primary?.id] || "Untitled"}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineView({ db, colors, onOpenRow }) {
  const primary   = db.properties.find(p=>p.isPrimary) || db.properties[0];
  const dateProps = db.properties.filter(p=>p.type==="date");
  const startProp = dateProps[0];
  const endProp   = dateProps[1] || dateProps[0];
  const [curr, setCurr] = useState(new Date());
  const [hov, setHov]   = useState(null);

  const year = curr.getFullYear(), month = curr.getMonth();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const monthName   = curr.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const today       = new Date();
  const COL_W = 34;

  function dayOffset(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (d.getFullYear()!==year || d.getMonth()!==month) return null;
    return d.getDate()-1;
  }
  function getSpan(row) {
    const s = dayOffset(row.cells[startProp?.id]);
    if (s===null) return null;
    const e = dayOffset(row.cells[endProp?.id]);
    return { start:s, end: e!==null ? e : s };
  }

  return (
    <div>
      {/* Nav */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button onClick={()=>setCurr(new Date(year,month-1,1))}
          style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,padding:"4px 12px",cursor:"pointer",color:colors.text,fontSize:16}}>‹</button>
        <span style={{fontWeight:600,fontSize:15,flex:1,textAlign:"center"}}>{monthName}</span>
        <button onClick={()=>setCurr(new Date())}
          style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,padding:"4px 10px",cursor:"pointer",color:colors.text,fontSize:12}}>Today</button>
        <button onClick={()=>setCurr(new Date(year,month+1,1))}
          style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,padding:"4px 12px",cursor:"pointer",color:colors.text,fontSize:16}}>›</button>
      </div>

      {!startProp && (
        <div style={{padding:20,textAlign:"center",color:colors.muted,fontSize:13,
          background:colors.surface,borderRadius:8}}>
          Add a <strong>Date</strong> property to use Timeline view.
        </div>
      )}

      {startProp && (
        <div style={{overflowX:"auto",border:`1px solid ${colors.border}`,borderRadius:10}}>
          <div style={{display:"flex",minWidth:180+COL_W*daysInMonth}}>
            {/* Name column */}
            <div style={{width:180,flexShrink:0,borderRight:`1px solid ${colors.border}`}}>
              <div style={{height:36,background:colors.surface,borderBottom:`1px solid ${colors.border}`,
                display:"flex",alignItems:"center",padding:"0 12px",fontSize:12,fontWeight:600,color:colors.muted}}>
                Name
              </div>
              {db.rows.map(row=>(
                <div key={row.id}
                  onMouseEnter={()=>setHov(row.id)} onMouseLeave={()=>setHov(null)}
                  onClick={()=>onOpenRow(row)}
                  style={{height:40,padding:"0 12px",display:"flex",alignItems:"center",
                    borderBottom:`1px solid ${colors.border}`,cursor:"pointer",fontSize:13,
                    background:hov===row.id?colors.surface:"transparent",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {row.cells[primary?.id]||"Untitled"}
                </div>
              ))}
            </div>
            {/* Grid */}
            <div style={{flex:1,position:"relative"}}>
              {/* Day headers */}
              <div style={{display:"flex",height:36,background:colors.surface,
                borderBottom:`1px solid ${colors.border}`}}>
                {Array.from({length:daysInMonth},(_,i)=>{
                  const isT = today.getDate()===i+1&&today.getMonth()===month&&today.getFullYear()===year;
                  return(
                    <div key={i} style={{width:COL_W,flexShrink:0,textAlign:"center",
                      fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",
                      borderRight:`1px solid ${colors.border}`,
                      color:isT?"#2383e2":colors.muted,fontWeight:isT?700:400}}>
                      {i+1}
                    </div>
                  );
                })}
              </div>
              {/* Rows */}
              {db.rows.map(row=>{
                const span = getSpan(row);
                const isT2 = today.getMonth()===month&&today.getFullYear()===year;
                return(
                  <div key={row.id}
                    onMouseEnter={()=>setHov(row.id)} onMouseLeave={()=>setHov(null)}
                    style={{height:40,position:"relative",
                      borderBottom:`1px solid ${colors.border}`,
                      background:hov===row.id?colors.surface:"transparent"}}>
                    {/* Grid lines */}
                    {Array.from({length:daysInMonth},(_,i)=>(
                      <div key={i} style={{position:"absolute",left:i*COL_W,top:0,bottom:0,
                        borderRight:`1px solid ${colors.border}`,opacity:0.3}}/>
                    ))}
                    {/* Today highlight */}
                    {isT2&&(
                      <div style={{position:"absolute",
                        left:(today.getDate()-1)*COL_W,
                        top:0,bottom:0,width:COL_W,
                        background:"rgba(35,131,226,0.04)",zIndex:0}}/>
                    )}
                    {/* Bar */}
                    {span && (
                      <div onClick={()=>onOpenRow(row)}
                        style={{position:"absolute",zIndex:1,
                          left:span.start*COL_W+3,
                          top:8,height:24,
                          width:Math.max(COL_W-6,(span.end-span.start+1)*COL_W-6),
                          background:"#2383e2",borderRadius:5,
                          display:"flex",alignItems:"center",paddingLeft:7,
                          fontSize:11,color:"#fff",cursor:"pointer",
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#1a6cc4"}
                        onMouseLeave={e=>e.currentTarget.style.background="#2383e2"}>
                        {row.cells[primary?.id]||"Untitled"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export {
  CellValue,
  CellEditor,
  FilterSortPanel,
  RowModal,
  TableView,
  GalleryView,
  BoardView,
  ListView,
  CalendarView,
  TimelineView,
};
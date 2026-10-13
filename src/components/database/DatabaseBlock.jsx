import { useState, useRef } from "react";

import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
} from "lucide-react";

import {
  DB_VIEWS,
  DB_VIEW_ICONS,
  DB_VIEW_LABELS,
  ICON_LIBRARY,
  ICON_NAMES,
  DATABASE_COLORS,
  QUICK_EMOJIS,
} from "../../data/constants";

import { rid } from "../../utils/data";
import RenderIcon from "../ui/RenderIcon";

function colorWithOpacity(hex, opacity) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "transparent";
  const number = parseInt(value, 16);
  return `rgba(${number >> 16},${(number >> 8) & 255},${number & 255},${opacity})`;
}

import {
  TableView,
  GalleryView,
  BoardView,
  ListView,
  CalendarView,
  TimelineView,
  RowModal,
  FilterSortPanel,
} from "./DatabaseViews";

function applyFiltersAndSorts(rows, properties, view) {
  let result = [...rows];
  for (const f of (view.filters || [])) {
    const prop = properties.find(p => p.id === f.propId);
    if (!prop) continue;
    result = result.filter(row => {
      const val = row.cells[f.propId];
      switch(f.operator) {
        case "contains":         return String(val||"").toLowerCase().includes((f.value||"").toLowerCase());
        case "does not contain": return !String(val||"").toLowerCase().includes((f.value||"").toLowerCase());
        case "is":               return val === f.value;
        case "is not":           return val !== f.value;
        case "is empty":         return !val || val === "";
        case "is not empty":     return !!(val && val !== "");
        case "is checked":       return val === true;
        case "is not checked":   return val !== true;
        case "is before":        return val && f.value && val < f.value;
        case "is after":         return val && f.value && val > f.value;
        case "=":  return parseFloat(val) === parseFloat(f.value);
        case "≠":  return parseFloat(val) !== parseFloat(f.value);
        case "<":  return parseFloat(val) <  parseFloat(f.value);
        case ">":  return parseFloat(val) >  parseFloat(f.value);
        case "≤":  return parseFloat(val) <= parseFloat(f.value);
        case "≥":  return parseFloat(val) >= parseFloat(f.value);
        default:   return true;
      }
    });
  }
  for (const s of [...(view.sorts || [])].reverse()) {
    result.sort((a, b) => {
      const av = a.cells[s.propId] ?? "";
      const bv = b.cells[s.propId] ?? "";
      const an = parseFloat(av), bn = parseFloat(bv);
      const cmp = (!isNaN(an) && !isNaN(bn)) ? an - bn : String(av).localeCompare(String(bv));
      return s.direction === "desc" ? -cmp : cmp;
    });
  }
  return result;
}

function DatabaseBlock({block,colors,darkMode,locked,allDatabases,onUpdateDb,onDeleteDatabase}) {
  const db=allDatabases[block.dbId];
  const[openRow,setOpenRow]=useState(null);
  const[addViewOpen,setAddViewOpen]=useState(false);
  const[searchVal,setSearchVal]=useState("");
  const[editingName,setEditingName]=useState(false);
  const [showFilterSort, setShowFilterSort] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMenu, setViewMenu] = useState(null);
  const [editingView, setEditingView] = useState(null);
  const resizeRef = useRef(null);
  if(!db)return<div style={{padding:12,color:colors.muted,fontSize:13}}>Database not found.</div>;
  const initDb=db.activeViewId?db:{...db,activeViewId:db.views[0]?.id};
  const titleStyle={color:initDb.titleColor||colors.text,fontWeight:initDb.titleBold?700:600,fontStyle:initDb.titleItalic?"italic":"normal",textDecoration:initDb.titleUnderline?"underline":"none"};
  const activeView=initDb.views.find(v=>v.id===initDb.activeViewId)||initDb.views[0];
  function upDb(changes){onUpdateDb(block.dbId,{...initDb,...changes});}
    const searchedRows = searchVal
    ? initDb.rows.filter(r => {
        const p = initDb.properties.find(p=>p.isPrimary);
          return String(r.cells[p?.id] ?? "").toLowerCase().includes(searchVal.toLowerCase());
      })
    : initDb.rows;

  // Evaluate formula properties
  const rowsWithFormulas = searchedRows.map(row => {
    const newCells = {...row.cells};
    initDb.properties.filter(p=>p.type==="formula"&&p.formulaExpr).forEach(prop => {
      try {
        let expr = prop.formulaExpr;
        initDb.properties.forEach(p => {
          const val = parseFloat(row.cells[p.id]) || 0;
          expr = expr.replaceAll(`{${p.name}}`, val);
        });
        newCells[prop.id] = String(Function(`"use strict";return(${expr})`)());
      } catch { newCells[prop.id] = "#ERR"; }
    });
    return {...row, cells:newCells};
  });

  const filteredRows = applyFiltersAndSorts(rowsWithFormulas, initDb.properties, activeView);
  const filteredDb = { ...initDb, rows: filteredRows };
  function addRow(extraCells={}){const p=initDb.properties.find(p=>p.isPrimary);upDb({rows:[...initDb.rows,{id:rid(),cells:{[p?.id]:"New item",...extraCells},pageId:null,pageData:null}]});}
  function deleteRow(rowId){upDb({rows:initDb.rows.filter(r=>r.id!==rowId)});}
  function reorderRows(fromId,toId){
    const rows=[...initDb.rows];
    const fromIndex=rows.findIndex(row=>row.id===fromId);
    const toIndex=rows.findIndex(row=>row.id===toId);
    if(fromIndex<0||toIndex<0||fromIndex===toIndex)return;
    const [moved]=rows.splice(fromIndex,1);
    rows.splice(toIndex,0,moved);
    upDb({rows});
  }
  function updateCell(rowId,propId,val){upDb({rows:initDb.rows.map(r=>r.id!==rowId?r:{...r,cells:{...r.cells,[propId]:val}})});}
  function updateRowPage(rowId,pageData){
    const primaryProp=initDb.properties.find(p=>p.isPrimary);
    upDb({rows:initDb.rows.map(r=>r.id!==rowId?r:{
      ...r,
      pageData,
      cells:primaryProp&&pageData.title
        ?{...r.cells,[primaryProp.id]:pageData.title}
        :r.cells
    })});
  }
    function updateView(viewId, changes) {
    upDb({ views: initDb.views.map(v => v.id!==viewId ? v : {...v,...changes}) });
  }
    function deleteView(viewId) {
      if (initDb.views.length <= 1) return;
      const views = initDb.views.filter(view => view.id !== viewId);
      upDb({ views, activeViewId: initDb.activeViewId === viewId ? views[0].id : initDb.activeViewId });
      setViewMenu(null);
    }
  function startResize(event) {
    if (locked) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = resizeRef.current?.getBoundingClientRect().width || 0;
    const parentWidth = resizeRef.current?.parentElement?.getBoundingClientRect().width || startWidth;
    function move(moveEvent) {
      const width = Math.max(320, Math.min(parentWidth, startWidth + moveEvent.clientX - startX));
      upDb({ width: Math.round((width / parentWidth) * 100) });
    }
    function stop() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  }
  function addProp(){upDb({properties:[...initDb.properties,{id:rid(),name:"Property",type:"text",options:[]}]});}
  function updateProp(propId,ch){if(ch==="DELETE"){upDb({properties:initDb.properties.filter(p=>p.id!==propId)});return;}upDb({properties:initDb.properties.map(p=>p.id!==propId?p:{...p,...ch})});}
    const vp = {
    db:filteredDb, colors, darkMode, locked,
    onUpdateCell:updateCell,
    onAddRow:addRow,
    onDeleteRow:deleteRow,
    onReorderRows:reorderRows,
    onOpenRow:setOpenRow,
    onUpdateProp:updateProp,
    onAddProp:addProp,
    onUpdateRowPage:updateRowPage,
    activeView,
    onUpdateView: ch => updateView(activeView.id, ch),
  };
  return(
    <div ref={resizeRef} style={{width:`${Math.max(40, Math.min(100, initDb.width || 100))}%`,minWidth:320,maxWidth:"100%",position:"relative",border:`1px solid ${colors.border}`,borderRadius:10,overflow:"visible",marginBottom:4,background:initDb.backgroundColor?colorWithOpacity(initDb.backgroundColor,0.15):"transparent"}}>
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${colors.border}`,display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{position:"relative",flexShrink:0}}>
            <button onClick={()=>!locked&&setShowIconPicker(v=>!v)} title="Change database icon" style={{border:"none",background:"transparent",padding:2,cursor:locked?"default":"pointer",fontSize:22,lineHeight:1}}>{typeof initDb.icon === "object" ? <RenderIcon icon={initDb.icon} size={22}/> : (initDb.icon || "📊")}</button>
            {showIconPicker&&!locked&&<div style={{position:"absolute",top:"100%",left:0,zIndex:40,width:270,padding:8,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,0.14)"}}><div style={{fontSize:11,color:colors.muted,marginBottom:5}}>EMOJI</div><div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:2,maxHeight:150,overflowY:"auto"}}>{QUICK_EMOJIS.map(icon=><button key={icon} onClick={()=>{upDb({icon});setShowIconPicker(false);}} style={{border:"none",background:"transparent",padding:4,cursor:"pointer",fontSize:18,borderRadius:4}}>{icon}</button>)}</div><div style={{height:1,background:colors.border,margin:"8px 0"}}/><div style={{fontSize:11,color:colors.muted,marginBottom:5}}>ICON</div><div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:2,maxHeight:130,overflowY:"auto"}}>{ICON_NAMES.map(name=>{const Icon=ICON_LIBRARY[name];return <button key={name} title={name} onClick={()=>{upDb({icon:{kind:"icon",value:name,color:initDb.titleColor||colors.muted}});setShowIconPicker(false);}} style={{border:"none",background:"transparent",padding:5,cursor:"pointer",color:initDb.titleColor||colors.muted,display:"flex",justifyContent:"center"}}><Icon size={16}/></button>;})}</div></div>}
          </div>
                    {editingName&&!locked
            ?<input 
                autoFocus 
                defaultValue={initDb.name}
                onBlur={e=>{upDb({name:e.target.value||"Untitled Database"});setEditingName(false);}}
                onKeyDown={e=>{
                  if(e.key==="Enter"){upDb({name:e.target.value||"Untitled Database"});setEditingName(false);}
                  if(e.key==="Escape"){setEditingName(false);}
                }}
                onClick={e=>e.stopPropagation()}
                style={{...titleStyle,fontSize:20,outline:"none",background:colors.bg,fontFamily:"inherit",flex:1,borderRadius:4,padding:"2px 6px",border:`1px solid ${colors.border}`}}
              />
            :<span 
                onClick={()=>!locked&&setEditingName(true)}
                title="Click to rename"
                style={{...titleStyle,fontSize:20,flex:1,cursor:locked?"default":"pointer",userSelect:"none"}}
              >
                {initDb.name}
                {!locked&&<span style={{fontSize:11,color:colors.muted,marginLeft:6,fontWeight:400,opacity:0}}>✏️</span>}
              </span>
          }
          <div style={{display:"flex",alignItems:"center",gap:5,background:colors.surface,borderRadius:6,padding:"4px 8px"}}><Search size={12} style={{color:colors.muted}}/><input value={searchVal} onChange={e=>setSearchVal(e.target.value)} placeholder="Search…" style={{border:"none",outline:"none",background:"transparent",fontSize:12,color:colors.text,width:80,fontFamily:"inherit"}}/></div>
          {!locked&&<button onClick={addProp} style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:5,padding:"4px 8px",cursor:"pointer",color:colors.muted,fontSize:12,display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}><Plus size={11}/>Property</button>}
        </div>
          <div style={{display:"flex",alignItems:"center",gap:2}}>
          {initDb.views.map(view=>(<div key={view.id} style={{position:"relative",display:"flex",alignItems:"center"}}>
            {editingView===view.id&&!locked?<input autoFocus defaultValue={view.name} onBlur={e=>{updateView(view.id,{name:e.target.value||DB_VIEW_LABELS[view.type]+" view"});setEditingView(null);}} onKeyDown={e=>{if(e.key==="Enter"){updateView(view.id,{name:e.target.value||DB_VIEW_LABELS[view.type]+" view"});setEditingView(null);}if(e.key==="Escape")setEditingView(null);}} style={{width:100,padding:"5px 7px",border:`1px solid ${colors.border}`,borderRadius:6,background:colors.bg,color:colors.text,fontSize:13,outline:"none"}}/>:<button onClick={()=>upDb({activeViewId:view.id})} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 8px",borderRadius:6,border:"none",cursor:"pointer",fontSize:13,background:activeView.id===view.id?colors.bg:colors.surface,color:activeView.id===view.id?colors.text:colors.muted,fontWeight:activeView.id===view.id?500:400,boxShadow:activeView.id===view.id?`0 0 0 1px ${colors.border}`:"none"}}>{DB_VIEW_ICONS[view.type]}{view.name}</button>}
            {!locked&&<button onClick={()=>setViewMenu(viewMenu===view.id?null:view.id)} title="View options" style={{border:"none",background:"transparent",padding:3,cursor:"pointer",color:colors.muted,display:"flex"}}><MoreVertical size={13}/></button>}
            {viewMenu===view.id&&<div style={{position:"absolute",top:"100%",right:0,zIndex:40,minWidth:130,padding:5,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,0.14)"}}><button onClick={()=>{setEditingView(view.id);setViewMenu(null);}} style={{display:"block",width:"100%",padding:"7px 9px",border:"none",background:"transparent",textAlign:"left",cursor:"pointer",color:colors.text}}>Rename view</button><button onClick={()=>deleteView(view.id)} disabled={initDb.views.length<=1} style={{display:"flex",alignItems:"center",gap:5,width:"100%",padding:"7px 9px",border:"none",background:"transparent",textAlign:"left",cursor:initDb.views.length<=1?"not-allowed":"pointer",color:initDb.views.length<=1?colors.muted:"#e03"}}><Trash2 size={13}/>Delete view</button></div>}
          </div>))}
          {!locked&&(
            <div style={{position:"relative"}}>
              <button onClick={()=>setAddViewOpen(v=>!v)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 8px",borderRadius:6,border:`1px dashed ${colors.border}`,cursor:"pointer",fontSize:12,background:"transparent",color:colors.muted}}><Plus size={11}/>Add view</button>
              {addViewOpen&&(
                <div style={{position:"absolute",top:"100%",left:0,marginTop:4,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:8,padding:6,zIndex:30,minWidth:160,boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>
                  {DB_VIEWS.filter(vt=>!initDb.views.find(v=>v.type===vt)).map(vt=>(<div key={vt} onMouseDown={()=>{upDb({views:[...initDb.views,{id:rid(),type:vt,name:DB_VIEW_LABELS[vt]+" view"}]});setAddViewOpen(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:5,cursor:"pointer",fontSize:13}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{DB_VIEW_ICONS[vt]}<span>{DB_VIEW_LABELS[vt]}</span></div>))}
                </div>
              )}
            </div>
          )}
          {!locked&&<div style={{position:"relative"}}>
            <button onClick={()=>setShowFilterSort(v=>!v)} title="Filter and sort" style={{display:"flex",alignItems:"center",gap:4,padding:"5px 8px",borderRadius:6,border:`1px solid ${colors.border}`,cursor:"pointer",fontSize:12,background:"transparent",color:colors.muted}}>Filter / Sort</button>
            {showFilterSort&&<FilterSortPanel db={initDb} view={activeView} colors={colors} onUpdateView={ch=>updateView(activeView.id,ch)}/>} 
          </div>}
          {!locked&&<button onClick={()=>{if(window.confirm("Delete this database and all its entries?"))onDeleteDatabase?.();}} title="Delete database" style={{display:"flex",alignItems:"center",padding:5,border:"none",background:"transparent",color:"#e03",cursor:"pointer"}}><Trash2 size={15}/></button>}
          {!locked&&<div style={{position:"relative"}}><button onClick={()=>setShowSettings(v=>!v)} title="Database settings" style={{display:"flex",alignItems:"center",padding:5,border:"none",background:"transparent",color:colors.muted,cursor:"pointer"}}><MoreVertical size={15}/></button>{showSettings&&<div style={{position:"absolute",top:"100%",right:0,zIndex:50,width:250,padding:10,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:8,boxShadow:"0 8px 28px rgba(0,0,0,0.16)"}}><div style={{fontSize:11,color:colors.muted,fontWeight:600,marginBottom:6}}>TITLE COLOR</div><div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>{DATABASE_COLORS.map(color=><button key={color} onClick={()=>upDb({titleColor:color})} style={{width:19,height:19,padding:0,borderRadius:"50%",border:initDb.titleColor===color?`2px solid ${colors.text}`:`1px solid ${colors.border}`,background:color,cursor:"pointer"}}/>)}</div><div style={{fontSize:11,color:colors.muted,fontWeight:600,marginBottom:6}}>DATABASE COLOR</div><div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}><button onClick={()=>upDb({backgroundColor:null})} style={{width:19,height:19,padding:0,borderRadius:"50%",border:`1px solid ${colors.border}`,background:colors.bg,cursor:"pointer"}}/> {DATABASE_COLORS.map(color=><button key={color} onClick={()=>upDb({backgroundColor:color})} style={{width:19,height:19,padding:0,borderRadius:"50%",border:initDb.backgroundColor===color?`2px solid ${colors.text}`:`1px solid ${colors.border}`,background:colorWithOpacity(color,0.28),cursor:"pointer"}}/>)}</div><div style={{fontSize:11,color:colors.muted,fontWeight:600,marginBottom:5}}>TITLE FORMAT</div><div style={{display:"flex",gap:3,marginBottom:10}}>{[["titleBold","B"],["titleItalic","I"],["titleUnderline","U"]].map(([key,label])=><button key={key} onClick={()=>upDb({[key]:!initDb[key]})} style={{fontWeight:key==="titleBold"?700:400,fontStyle:key==="titleItalic"?"italic":"normal",textDecoration:key==="titleUnderline"?"underline":"none",color:initDb[key]?"#2383e2":colors.muted,border:"none",background:"transparent",cursor:"pointer",padding:"3px 5px"}}>{label}</button>)}</div><div style={{fontSize:11,color:colors.muted,fontWeight:600,marginBottom:5}}>GALLERY CARD SIZE</div><div style={{display:"flex",gap:4}}>{[["small","Small"],["medium","Medium"],["large","Large"]].map(([size,label])=><button key={size} onClick={()=>upDb({galleryCardSize:size})} style={{flex:1,padding:"5px 3px",border:`1px solid ${initDb.galleryCardSize===size?"#2383e2":colors.border}`,borderRadius:5,background:initDb.galleryCardSize===size?colors.surface:"transparent",color:colors.text,cursor:"pointer",fontSize:11}}>{label}</button>)}</div></div>}</div>}
        </div>
      </div>
      <div style={{padding:"12px 14px 14px"}}>
        {activeView.type==="table"    && <TableView    {...vp}/>}
        {activeView.type==="gallery"  && <GalleryView  {...vp}/>}
        {activeView.type==="board"    && <BoardView    {...vp}/>}
        {activeView.type==="list"     && <ListView     {...vp}/>}
        {activeView.type==="calendar" && <CalendarView {...vp}/>}
        {activeView.type==="timeline" && <TimelineView {...vp}/>}
      </div>
      {!locked&&<div onMouseDown={startResize} title="Drag to resize database" style={{position:"absolute",right:-4,bottom:6,width:8,height:36,cursor:"ew-resize",borderRadius:4,background:colors.border}}/>}
      {openRow&&<RowModal row={openRow} colors={colors} darkMode={darkMode} onClose={()=>setOpenRow(null)} onUpdateRowPage={updateRowPage}/>} 
    </div>
  );
}

export default DatabaseBlock;
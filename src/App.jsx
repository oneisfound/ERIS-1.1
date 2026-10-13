import { useState, useRef, useEffect, useCallback, useMemo} from "react";
import {
  Star, Heart, Flame, Zap, Coffee, Book, BookOpen, Bookmark, Briefcase,
  Calendar, Camera, Car, Clock, Cloud, Code, Compass, CreditCard,
  Database, Diamond, Dumbbell, Feather, FileText, Film, Flag, Flower,
  Folder, Gift, Globe, GraduationCap, Hammer, Headphones, Home,
  Image as ImageIcon, Key, Laptop, Leaf, Lightbulb, Lock, Unlock,
  Map, MapPin, Medal, Mic, Moon, Mountain, Music, Package, Palette,
  Paperclip, Pencil, Phone, PiggyBank, Plane, Puzzle, Rocket, Ruler,
  School, Scissors, Settings, Shield, ShoppingBag, ShoppingCart, Smile,
  Snowflake, Sparkles, Sun, Sunrise, Sunset, Target, Tent, Ticket,
  Trash2, TreePine, Trophy, Umbrella, User, Users, Utensils, Video,
  Wallet, Watch, Wind, Wrench,
  Type, Heading1, Heading2, Heading3, Heading4, List, ListOrdered,
  CheckSquare, ChevronRight, ChevronDown, Quote, Minus, MessageSquare,
  Columns3, File as FileGeneric, X, Plus, ListTree,
  AlignLeft, AlignCenter, AlignRight, GripVertical,
  Copy, Maximize2, Minimize2,
  Table, LayoutGrid, Kanban, List as ListIcon,
  Tag, Hash, Link, Mail, PhoneCall,
  Check, MoreVertical, Search, CalendarDays,
  LayoutTemplate, Sigma ,
  Upload, Download, FileCode, FileDown,
} from "lucide-react";

import {
  ICON_LIBRARY,
  ICON_NAMES,
  ICON_COLORS,
  DATABASE_COLORS,
  COVER_COLORS,
  SIZE_BY_LEVEL,
  QUICK_EMOJIS,
  COLUMN_PRESETS,
  NUMBER_FORMATS,
  FILTER_OPERATORS,
  PROP_TYPES,
  PROP_ICONS,
  SLASH_ITEMS,
  FONT_OPTIONS,
} from "./data/constants";

import {
  rid,
  headingLevel,
  defaultIcon,
  formatBytes,
  newSpreadsheet,
  evalFormula,
  displayCell,
  newSimpleBlock,
  newBlock,
  newPage,
  getPageColor,
  newDatabase,
  getContainer,
  updateContainer,
  collectHeadings,
  colLabel,
} from "./utils/data";

import {
  parseSpotifyRef,
  getSpotifyEmbedUrl,
  spotifyDefaultHeight,
  getGitHubEmbedUrl,
  getYouTubeEmbedUrl,
  isTwitterUrl,
  loadTwitterWidgets,
  getFigmaEmbedUrl,
  getMapsEmbedUrl,
  detectEmbedProvider,
  getLinkPreviewData,
} from "./utils/embeds";

import AnnouncementModal from "./components/ui/AnnouncementModal";

import { watchAuthState, logIn, signUp, logOut, updateUsername, updateUserAvatar, updateUserEmail } from "./utils/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./utils/firebase";
import { resetLocalSync } from "./utils/firebase";

import {
  loadWorkspace,
  saveWorkspace,
  watchSharedPagesForUser,
  updateSharedPageContent,
  removeSharedPageMember,
  sharePage,
  buildShareBundle,
  findUserByEmail,
} from "./utils/sync";

import ImageBlock from "./components/blocks/ImageBlock";
import LinkBlock from "./components/blocks/LinkBlock";
import SpotifyBlock from "./components/blocks/SpotifyBlock";
import GitHubBlock from "./components/blocks/GitHubBlock";
import YouTubeBlock from "./components/blocks/YouTubeBlock";
import TwitterBlock from "./components/blocks/TwitterBlock";
import FigmaBlock from "./components/blocks/FigmaBlock";
import MapsBlock from "./components/blocks/MapsBlock";
import GenericEmbedBlock from "./components/blocks/GenericEmbedBlock";
import PageOutline from "./components/ui/PageOutline";

import RenderIcon from "./components/ui/RenderIcon";
import CE from "./components/ui/CE";
import UploadBox from "./components/ui/UploadBox";
import ColumnPresetPicker from "./components/ui/ColumnPresetPicker";
import DragPreview from "./components/ui/DragPreview";
import TrashModal from "./components/ui/TrashModal";
import ViewPickerModal from "./components/ui/ViewPickerModal";
import PageOptionsMenu from "./components/ui/PageOptionsMenu";
import ImportExportMenu from "./components/ui/ImportExportMenu";

import DatabaseBlock from "./components/database/DatabaseBlock";
import SpreadsheetBlock from "./components/database/SpreadsheetBlock";

import SelectionToolbar from "./components/ui/SelectionToolbar";
import { applyMark } from "./utils/richText";

function TrashPanel({trash,colors,onRestore,onDeletePermanent}) {
  const [selected,setSelected]=useState(new Set());
  const toggle=id=>setSelected(prev=>{const next=new Set(prev);next.has(id)?next.delete(id):next.add(id);return next;});
  const selectAll=()=>setSelected(new Set(trash.map(page=>page.id)));
  if(!trash.length)return <div style={{padding:"8px 8px 16px",fontSize:12,color:colors.muted}}>Trash is empty</div>;
  return <div style={{borderTop:`1px solid ${colors.border}`,paddingTop:10,marginTop:10}}>
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 8px 6px",fontSize:12,fontWeight:600}}><Trash2 size={14} color="#e03"/><span style={{flex:1}}>Trash</span><button onClick={selectAll} style={{border:"none",background:"transparent",color:colors.muted,cursor:"pointer",fontSize:11}}>Select all</button></div>
    <div style={{maxHeight:180,overflowY:"auto"}}>{trash.map(page=><label key={page.id} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 8px",fontSize:13,cursor:"pointer"}}><input type="checkbox" checked={selected.has(page.id)} onChange={()=>toggle(page.id)}/><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{page.title||"Untitled"}</span></label>)}</div>
    {selected.size>0&&<div style={{display:"flex",gap:5,padding:"7px 8px 0"}}><button onClick={()=>{selected.forEach(id=>onRestore(id));setSelected(new Set());}} style={{flex:1,padding:"5px 4px",border:`1px solid ${colors.border}`,borderRadius:5,background:"transparent",color:colors.text,cursor:"pointer",fontSize:11}}>Restore</button><button onClick={()=>{if(window.confirm(`Permanently delete ${selected.size} page${selected.size===1?"":"s"}?`)){selected.forEach(id=>onDeletePermanent(id));setSelected(new Set());}}} style={{flex:1,padding:"5px 4px",border:"none",borderRadius:5,background:"#e03",color:"#fff",cursor:"pointer",fontSize:11}}>Delete forever</button></div>}
  </div>;
}

function blocksToText(blocks, depth=0) {
  let o=""; const p=" ".repeat(depth);
  for (const b of blocks) {
    if (b.text) o+=p+b.text+"\n";
    if (b.children?.length) o+=blocksToText(b.children,depth+1);
    if (b.type==="columns"&&b.cols) b.cols.forEach(c=>{o+=blocksToText(c.blocks,depth+1);});
  }
  return o;
}

function translucentColor(hex) {
  const value=hex.replace("#","");
  const n=parseInt(value,16);
  return `rgba(${n>>16},${(n>>8)&255},${n&255},0.3)`;
}

function getQuoteAccentColor(block, colors) {
  const marks = block.marks || [];
  const colorMark = marks.find(m => m.type === "color");
  return colorMark ? colorMark.value : colors.muted;
}

function BlockBackgroundPicker({block,colors,onUpdate}) {
  const [open,setOpen]=useState(false);
  return <div style={{position:"relative",flexShrink:0}}>
    <button onClick={()=>setOpen(value=>!value)} title="Change background color" style={{border:"none",background:"transparent",cursor:"pointer",fontSize:12,color:colors.muted,padding:2}}>◐</button>
    {open&&<div onMouseDown={e=>e.stopPropagation()} style={{position:"absolute",top:"100%",right:0,zIndex:40,display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,padding:7,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:7,boxShadow:"0 6px 20px rgba(0,0,0,0.15)"}}><button onClick={()=>{onUpdate({backgroundColor:null});setOpen(false);}} title="Default" style={{width:20,height:20,borderRadius:4,border:`1px solid ${colors.border}`,background:colors.bg,cursor:"pointer"}}>×</button>{DATABASE_COLORS.map(color=><button key={color} onClick={()=>{onUpdate({backgroundColor:color});setOpen(false);}} title={color} style={{width:20,height:20,borderRadius:4,border:`2px solid ${block.backgroundColor===color?colors.text:colors.border}`,background:translucentColor(color),cursor:"pointer"}}/>)}</div>}
  </div>;
}

function DividerBlock({block,colors,locked,onUpdate}) {
  const [hover,setHover]=useState(false);
  const shade=block.shade??50; // 0 = white, 50 = grey, 100 = black
  const lineColor=`hsl(0,0%,${100-shade}%)`;
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0"}}>
      <hr style={{flex:1,margin:0,border:"none",borderTop:`3px solid ${lineColor}`}}/>
      {!locked&&(
        <div title="Line color" style={{position:"relative",width:80,height:14,flexShrink:0,visibility:hover?"visible":"hidden"}}>
          <div style={{position:"absolute",left:0,right:0,top:4,height:6,borderRadius:3,border:`1px solid ${colors.border}`,background:"linear-gradient(to right,#ffffff,#808080,#000000)"}}/>
          <input type="range" min="0" max="100" step="1" value={shade}
            onChange={e=>onUpdate({shade:Number(e.target.value)})}
            onMouseDown={e=>e.stopPropagation()}
            style={{position:"absolute",inset:0,width:"100%",height:"100%",margin:0,background:"transparent",WebkitAppearance:"none",appearance:"none",cursor:"pointer"}}/>
        </div>
      )}
    </div>
  );
}

function cloneBlockTree(blocks) {
  return (blocks || []).map(block => ({
    ...JSON.parse(JSON.stringify(block)),
    id: rid(),
    children: cloneBlockTree(block.children),
    cols: block.cols?.map(column => ({
      ...column,
      id: rid(),
      blocks: cloneBlockTree(column.blocks),
    })),
  }));
}

import {
  parseNotionImport,
  exportPageAsHtml,
  exportPageAsPdf,
  exportPageAsZip,
} from "./utils/notion";

function MiniPageEditor({rowId,pageData,colors,darkMode,pages,onUpdate,onClose,locked}) { 
  const[page,setPage]=useState(()=>pageData||{title:"",icon:{kind:"emoji",value:"📄"},cover:null,blocks:[{id:rid(),type:"paragraph",text:"",checked:false,open:false,children:[],emoji:"💡",pageRef:null,media:null,cols:null,colWidths:null,imageAlign:"center",imageWidth:100,dbId:null,ssId:null}]});
  const[showIconPick,setShowIconPick]=useState(false);
  const[pickerTab,setPickerTab]=useState("emoji");
  const[selColor,setSelColor]=useState(ICON_COLORS[1]);
  const[showCoverPick,setShowCoverPick]=useState(false);
  const[coverTab,setCoverTab]=useState("color");
  const blockRefs=useRef({});
  const colRowRefs=useRef({});
  const colCellRefs=useRef({});
  const scrollContainerRef = useRef(null);
  const rowRegistry=useRef({});
  const blockClipboardRef=useRef([]);
  const[slashMenu,setSlashMenu]=useState(null);
  const[calloutPicker,setCalloutPicker]=useState(null);
  const[pendingFocus,setPendingFocus]=useState(null);
  const[dragState,setDragState]=useState({active:false,fromPath:null,fromPathKey:null,fromIndex:null,blockId:null,blockText:"",x:0,y:0,overPath:null,overPathKey:null,overIndex:null});
  const[syncLoading,setSyncLoading]=useState(false);
  const syncSkipRef=useRef(false);
  const saveTimer=useRef(null);
  const pendingRemovedShared = useRef(new Set());
  const[selection,setSelection]=useState(null);

  function upPage(ch){const np={...page,...ch};setPage(np);onUpdate(rowId,np);}
  function updBlocks(path,updater){const nb=updateContainer(page.blocks,path,updater);upPage({blocks:nb});}
  function updBlock(path,blockId,ch){updBlocks(path,arr=>arr.map(b=>b.id===blockId?{...b,...ch}:b));}

  useEffect(()=>{
    if(!pendingFocus)return;
    const el=blockRefs.current[pendingFocus.blockId];
    if(el){el.focus();try{const r=document.createRange(),s=window.getSelection();r.selectNodeContents(el);r.collapse(false);s.removeAllRanges();s.addRange(r);}catch{}}
    setPendingFocus(null);
  },[pendingFocus]);

  function handleInput(path,block,e){
    if(locked)return;
    const text=e.currentTarget.innerText;updBlock(path,block.id,{text});
    if(text.startsWith("/"))setSlashMenu({blockId:block.id,query:text.slice(1),index:0});
    else if(slashMenu?.blockId===block.id)setSlashMenu(null);
  }

  function deleteColumn(path,columnsBlockId,colId){
    if(locked)return;
    const container=getContainer(page.blocks,path);
    const idx=container.findIndex(b=>b.id===columnsBlockId);
    if(idx<0)return;
    const columnsBlock=container[idx];
    if(columnsBlock.type!=="columns")return;
    const remainingCols=(columnsBlock.cols||[]).filter(c=>c.id!==colId);
    if(remainingCols.length<=1){
      const replacement=remainingCols.length===1
        ? (remainingCols[0].blocks.length?remainingCols[0].blocks:[newSimpleBlock()])
        : [newSimpleBlock()];
      updBlocks(path,arr=>{const c=[...arr];c.splice(idx,1,...replacement);return c;});
    }else{
      const widths=remainingCols.map(()=>100/remainingCols.length);
      updBlocks(path,arr=>arr.map(b=>b.id===columnsBlockId?{...b,cols:remainingCols,colWidths:widths}:b));
    }
  }

  function handleKeyDown(path,block,index,e){
    if(locked)return;
    if(slashMenu?.blockId===block.id){
      const q=(slashMenu.query||"").trim().toLowerCase();
      const items=SLASH_ITEMS.filter(it=>!q||it.label.toLowerCase().includes(q)||it.kw.some(k=>k.includes(q)));
      if(e.key==="ArrowDown"){e.preventDefault();setSlashMenu(s=>({...s,index:Math.min(s.index+1,items.length-1)}));return;}
      if(e.key==="ArrowUp"){e.preventDefault();setSlashMenu(s=>({...s,index:Math.max(s.index-1,0)}));return;}
      if(e.key==="Enter"){e.preventDefault();const ch=items[slashMenu.index]||items[0];if(ch)changeBlockType(path,block.id,ch.type);return;}
      if(e.key==="Escape"){e.preventDefault();setSlashMenu(null);return;}
    }
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addBlockAfter(path,index,"paragraph");return;}
    if(e.key==="Backspace"){const txt=e.currentTarget.innerText.replace(/\u200B/g,"");if(!txt.length){e.preventDefault();deleteBlock(path,block.id);}}
  }
  function addBlockAfter(path,index,type="paragraph"){
    if(locked)return;
    const nb=newBlock(type);
    updBlocks(path,arr=>{const c=[...arr];c.splice(index+1,0,nb);return c;});
    setPendingFocus({blockId:nb.id});
  }
  function deleteBlock(path,blockId){
    if(locked)return;
    const cont=getContainer(page.blocks,path);
    const idx=cont.findIndex(b=>b.id===blockId);
    if(idx<0||(idx===0&&cont.length===1))return;
    const focusId=cont[Math.max(0,idx-1)].id;
    updBlocks(path,arr=>arr.filter(b=>b.id!==blockId));
    setPendingFocus({blockId:focusId});
  }
  function handleSelectionChange(path,blockId,offsets,rect){
    if(!offsets){
      if(toolbarInteractingRef.current) return; // ignore — this null came from clicking into our own toolbar
      setSelection(null);
      return;
    }
    setSelection({path,blockId,offsets,rect});
  }
  function applyMarkToSelection(type,extra={}){
    if(!selection)return;
    const{path,blockId,offsets}=selection;
    if(type==="align"){
      updBlock(path,blockId,{align:extra.value});
      return;
    }
    updBlocks(path,arr=>arr.map(b=>b.id!==blockId?b:{...b,marks:applyMark(b.marks||[],offsets.start,offsets.end,type,extra)}));
  }
  // FIX: this used to reach for `activePage`, which does not exist inside
  // MiniPageEditor (that's a variable from the top-level App component).
  // It also called the App-level 4-arg updBlock(pageId, path, blockId, ch)
  // instead of this component's own 3-arg updBlock(path, blockId, ch).
  // Left in place (harmless/unused) but now safe to call.
  function setSelectionAlign(align){
    if(!selection)return;
    const{path,blockId}=selection;
    updBlock(path,blockId,{align});
  }
    function changeBlockType(path,blockId,type){
    if(locked)return;
    const current=getContainer(page.blocks,path).find(block=>block.id===blockId);
    if(current?.type==="callout"&&type!=="callout"){
      const child=newBlock(type);
      updBlock(path,blockId,{text:"",children:[...(current.children||[]),child]});
      setSlashMenu(null);setPendingFocus({blockId:child.id});return;
    }
    if(type==="columns"){
      const cols=[{id:rid(),blocks:[newSimpleBlock()]},{id:rid(),blocks:[newSimpleBlock()]}];
      updBlock(path,blockId,{type:"columns",text:"",cols,colWidths:[50,50]});
      setSlashMenu(null);setPendingFocus({blockId});return;
    }
    updBlock(path,blockId,{type,text:""});setSlashMenu(null);setPendingFocus({blockId});
    // FIX: removed a stray leftover line here —
    //   updBlock(activePage.id,path,blockId,{align});
    // `activePage` and `align` don't exist in this scope; this threw a
    // ReferenceError every single time you changed a block's type inside
    // the mini page editor (e.g. via "/" commands or "Turn into").
  }
  function registerRow(blockId,el,path,index){if(el)rowRegistry.current[blockId]={el,path,index};else delete rowRegistry.current[blockId];}

  const toolbarInteractingRef = useRef(false);
  useEffect(()=>{
    function markToolbar(e){
      toolbarInteractingRef.current = !!e.target.closest('[data-selection-toolbar]');
    }
    document.addEventListener('mousedown', markToolbar, true);
    return ()=>document.removeEventListener('mousedown', markToolbar, true);
  },[]);

  function copyBlock(block){
    blockClipboardRef.current=[block];
    navigator.clipboard?.writeText(`ERIS_BLOCKS:${JSON.stringify([block])}`).catch(()=>{});
  }
  function cutBlock(path,blockId){
    const container=getContainer(page.blocks,path);
    const block=container.find(item=>item.id===blockId);
    if(!block)return;
    copyBlock(block);
    deleteBlock(path,blockId);
  }
  function duplicateBlock(path,index,block){
    const cloned=cloneBlockTree([block]);
    updBlocks(path,container=>{const next=[...container];next.splice(index+1,0,...cloned);return next;});
  }
  function pasteBlock(path,index){
    if(!blockClipboardRef.current.length)return;
    const cloned=cloneBlockTree(blockClipboardRef.current);
    updBlocks(path,container=>{const next=[...container];next.splice(index+1,0,...cloned);return next;});
  }
  function copyLink(block){navigator.clipboard?.writeText(`${window.location.href.split("#")[0]}#block-${block.id}`).catch(()=>{});}

  function uploadMiniIcon(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{upPage({icon:{kind:"image",value:r.result}});setShowIconPick(false);};r.readAsDataURL(f);}
  function uploadMiniCover(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{upPage({cover:{kind:"image",value:r.result,positionY:50}});setShowCoverPick(false);};r.readAsDataURL(f);}

  const sharedBL={
    rootBlocks:page.blocks||[],colors:colors,darkMode,pages,blockRefs,colRowRefs,colCellRefs,
    slashMenu,setSlashMenu,calloutPicker,setCalloutPicker,
    onInput:(path,block,e)=>handleInput(path,block,e),
    onKeyDown:(path,block,idx,e)=>handleKeyDown(path,block,idx,e),
    onUpdateBlock:(path,bId,ch)=>updBlock(path,bId,ch),
    onAddBlockAfter:(path,idx,t)=>addBlockAfter(path,idx,t),
    onDeleteBlock:(path,bId)=>deleteBlock(path,bId),
    onMoveBlock:()=>{},
    onChangeBlockType:(path,bId,t)=>changeBlockType(path,bId,t),
    onMediaUpload:(path,bId,file)=>{if(locked)return;const r=new FileReader();r.onload=()=>updBlock(path,bId,{media:{dataUrl:r.result,name:file.name,size:file.size}});r.readAsDataURL(file);},
    onNavigatePage:()=>{},
    setPendingFocus,dragState,registerRow,onDragHandleDown:()=>{},selectedIds:new Set(),locked,
    allDatabases:{},onUpdateDb:()=>{},allSpreadsheets:{},onUpdateSs:()=>{},
    onCopyBlock:copyBlock,onCutBlock:cutBlock,onDuplicateBlock:duplicateBlock,onPasteBlock:pasteBlock,
    onTurnIntoBlock:(path,blockId,type)=>updBlock(path,blockId,{type}),onCopyLink:copyLink,
    onSelectionChange:(path,blockId,offsets,rect)=>handleSelectionChange(path,blockId,offsets,rect),
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:colors.bg,borderRadius:14,width:"min(900px,94vw)",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 72px rgba(0,0,0,0.28)"}}>
        {selection&&<SelectionToolbar rect={selection.rect} onFormat={applyMarkToSelection} darkMode={darkMode}/>}
        <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",padding:"10px 14px",borderBottom:`1px solid ${colors.border}`,flexShrink:0}}>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:colors.muted,padding:4,display:"flex",borderRadius:4}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><X size={18}/></button>
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {page.cover&&(
            <div style={{height:140,overflow:"hidden",flexShrink:0,background:page.cover.kind==="image"?`url(${page.cover.value}) center ${page.cover.positionY??50}%/cover no-repeat`:page.cover.value,position:"relative"}}>
              {!locked&&(
                <div style={{position:"absolute",top:8,right:8,display:"flex",gap:6}}>
                  <button data-picker="mini-cover" onClick={()=>setShowCoverPick(v=>!v)} style={{background:"rgba(255,255,255,0.88)",border:"none",borderRadius:6,padding:"4px 9px",fontSize:12,cursor:"pointer"}}>Change</button>
                  <button onClick={()=>upPage({cover:null})} style={{background:"rgba(255,255,255,0.88)",border:"none",borderRadius:6,padding:"4px 9px",fontSize:12,cursor:"pointer",color:"#c00"}}>Remove</button>
                </div>
              )}
            </div>
          )}
          {showCoverPick&&!locked&&(
            <div style={{margin:"0 24px",padding:12,background:colors.surface,borderRadius:8,border:`1px solid ${colors.border}`,marginTop:8}}>
              <div style={{display:"flex",gap:6,marginBottom:10}}>
                {["color","upload"].map(t=><button key={t} onClick={()=>setCoverTab(t)} style={{flex:1,padding:6,borderRadius:6,border:"none",cursor:"pointer",background:coverTab===t?colors.border:"transparent",color:colors.text,fontSize:13}}>{t==="color"?"Color":"Upload"}</button>)}
              </div>
              {coverTab==="color"?<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{COVER_COLORS.map(col=><div key={col} onClick={()=>{upPage({cover:{kind:"color",value:col}});setShowCoverPick(false);}} style={{width:32,height:32,borderRadius:6,background:col,cursor:"pointer",border:`2px solid ${colors.border}`}}/>)}</div>:<input type="file" accept="image/*" onChange={uploadMiniCover} style={{fontSize:13,color:colors.text}}/>}
            </div>
          )}
          <div style={{padding:"0 32px 80px"}}>
            {!page.cover&&!locked&&(
              <div style={{marginTop:14}}>
                <button onClick={()=>setShowCoverPick(v=>!v)} style={{background:"transparent",border:"none",color:colors.muted,cursor:"pointer",fontSize:12,padding:0}}>+ Add cover</button>
              </div>
            )}
            <div style={{marginTop:page.cover?"-24px":"16px",position:"relative",display:"inline-block"}} data-picker="mini-icon">
              <div onClick={()=>!locked&&setShowIconPick(v=>!v)} style={{cursor:locked?"default":"pointer",display:"inline-flex",userSelect:"none"}}>
                <RenderIcon icon={page.icon} size={52}/>
              </div>
              {showIconPick&&!locked&&(
                <div data-picker="mini-icon" style={{position:"absolute",top:60,left:0,width:300,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:8,padding:12,zIndex:40,boxShadow:"0 8px 24px rgba(0,0,0,0.15)"}}>
                  <div style={{display:"flex",gap:6,marginBottom:10}}>
                    {["emoji","icons","upload"].map(t=><button key={t} onClick={()=>setPickerTab(t)} style={{flex:1,padding:5,borderRadius:6,border:"none",cursor:"pointer",background:pickerTab===t?colors.border:"transparent",color:colors.text,fontSize:11}}>{t==="emoji"?"Emoji":t==="icons"?"Icons":"Upload"}</button>)}
                  </div>
                  {pickerTab==="emoji"&&<div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:4}}>{QUICK_EMOJIS.map(em=><span key={em} onClick={()=>{upPage({icon:{kind:"emoji",value:em}});setShowIconPick(false);}} style={{fontSize:20,cursor:"pointer",textAlign:"center",padding:3,borderRadius:5}}>{em}</span>)}</div>}
                  {pickerTab==="icons"&&(
                    <>
                      <div style={{display:"flex",gap:5,marginBottom:6,flexWrap:"wrap"}}>{ICON_COLORS.map(col=><div key={col} onClick={()=>setSelColor(col)} style={{width:18,height:18,borderRadius:"50%",background:col,cursor:"pointer",border:selColor===col?`2px solid ${colors.text}`:`1px solid ${colors.border}`}}/>)}</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:5,maxHeight:180,overflowY:"auto"}}>{ICON_NAMES.map(name=>{const Comp=ICON_LIBRARY[name];return<div key={name} onClick={()=>{upPage({icon:{kind:"icon",value:name,color:selColor}});setShowIconPick(false);}} style={{display:"flex",alignItems:"center",justifyContent:"center",padding:5,borderRadius:5,cursor:"pointer"}} title={name}><Comp size={16} color={selColor}/></div>;})}</div>
                    </>
                  )}
                  {pickerTab==="upload"&&<input type="file" accept="image/*" onChange={uploadMiniIcon} style={{fontSize:13,color:colors.text}}/>}
                </div>
              )}
            </div>
            <div
              contentEditable={!locked}
              suppressContentEditableWarning
              data-placeholder={locked?undefined:"Untitled"}
              onInput={locked?undefined:e=>upPage({title:e.currentTarget.innerText})}
              ref={el=>{if(!el)return;if(el.dataset.forRow!==rowId){el.innerText=page.title||"";el.dataset.forRow=rowId;}}}
              style={{outline:"none",fontSize:32,fontWeight:700,margin:"8px 0 18px",direction:"ltr",whiteSpace:"pre-wrap",wordBreak:"break-word",minHeight:42,position:"relative",cursor:locked?"default":"text"}}
            />
            <BlockList path={[]} blocks={page.blocks} {...sharedBL}/>
          </div>
        </div>
      </div>
    </div>
  );
}

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

function BlockActions({block,path,index,colors,visible,onDragHandleDown,onCopyBlock,onCutBlock,onDuplicateBlock,onPasteBlock,onDeleteBlock,onTurnIntoBlock,onCopyLink}) {
  const [open,setOpen]=useState(false);
  const [turnInto,setTurnInto]=useState(false);
  const [placement,setPlacement]=useState("left");
  const holdTimer=useRef(null);
  const menuRef=useRef(null);
  function handleMouseDown(event){
    event.stopPropagation();
    holdTimer.current=setTimeout(()=>{holdTimer.current=null;onDragHandleDown(event,path,index,block);},180);
  }
  function handleMouseUp(){
    if(holdTimer.current){clearTimeout(holdTimer.current);holdTimer.current=null;}
  }
  function toggleMenu(){
    setOpen(value=>{
      const next=!value;
      if(next)requestAnimationFrame(()=>{const rect=menuRef.current?.getBoundingClientRect();setPlacement(rect&&rect.left<180?"top":"left");});
      return next;
    });
  }
  return <div style={{position:"absolute",left:2,top:4,zIndex:25,display:"flex",alignItems:"flex-start",opacity:visible||open?1:0,pointerEvents:visible||open?"auto":"none",transition:"opacity 0.12s ease"}}>
    <button onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onClick={e=>{e.stopPropagation();toggleMenu();}} title="Block actions and move" style={{border:"none",background:"transparent",padding:2,cursor:"grab",color:colors.muted,display:"flex",borderRadius:4}}><GripVertical size={15}/></button>
    {open&&<div ref={menuRef} onMouseDown={e=>e.stopPropagation()} style={{position:"absolute",...(placement==="left"?{right:"100%",top:0}:{left:0,bottom:"100%"}),marginRight:placement==="left"?4:0,marginBottom:placement==="top"?4:0,width:180,padding:4,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:7,boxShadow:"0 8px 24px rgba(0,0,0,0.16)",zIndex:60}}>
      <button onClick={()=>setTurnInto(value=>!value)} style={{display:"block",width:"100%",padding:"7px 9px",border:"none",background:"transparent",textAlign:"left",color:colors.text,cursor:"pointer",fontSize:12}}>Turn into {turnInto?"▴":"▾"}</button>
      {turnInto&&<div style={{maxHeight:180,overflowY:"auto",borderTop:`1px solid ${colors.border}`,borderBottom:`1px solid ${colors.border}`,padding:"3px 0"}}>{SLASH_ITEMS.filter(item=>["paragraph","heading1","heading2","heading3","heading4","bulleted","numbered","todo","toggle","quote","callout","divider"].includes(item.type)).map(item=><button key={item.type} onClick={()=>{onTurnIntoBlock(path,block.id,item.type);setOpen(false);setTurnInto(false);}} style={{display:"block",width:"100%",padding:"5px 9px",border:"none",background:block.type===item.type?colors.surface:"transparent",textAlign:"left",color:colors.text,cursor:"pointer",fontSize:11}}>{item.label}</button>)}</div>}
      <button onClick={()=>{onCopyLink(block);setOpen(false);}} style={{display:"block",width:"100%",padding:"7px 9px",border:"none",background:"transparent",textAlign:"left",color:colors.text,cursor:"pointer",fontSize:12}}>Copy link to block</button>
        {[["Copy",()=>{onCopyBlock(block);setOpen(false);}], ["Cut",()=>{onCutBlock(path,block.id);setOpen(false);}], ["Duplicate",()=>{onDuplicateBlock(path,index,block);setOpen(false);}], ["Paste below",()=>{onPasteBlock(path,index);setOpen(false);}], ["Delete",()=>{onDeleteBlock(path,block.id,true);setOpen(false);}]].map(([label,action],actionIndex)=><button key={label} onClick={e=>{e.stopPropagation();action();}} style={{display:"block",width:"100%",padding:"7px 9px",border:"none",borderTop:actionIndex===4?`1px solid ${colors.border}`:"none",background:"transparent",textAlign:"left",color:label==="Delete"?"#e03":colors.text,cursor:"pointer",fontSize:12,borderRadius:4}} onMouseEnter={e=>e.currentTarget.style.background=label==="Delete"?"rgba(238,0,51,0.08)":colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{label}</button>)}
    </div>}
  </div>;
}

function BlockList({
  path,blocks,rootBlocks,colors,darkMode,pages,blockRefs,colRowRefs,
  colCellRefs, onDeleteColumn,
  slashMenu,setSlashMenu,calloutPicker,setCalloutPicker,
  onInput,onKeyDown,onUpdateBlock,onAddBlockAfter,onDeleteBlock,onDeleteDatabase,
  onCopyBlock,onCutBlock,onDuplicateBlock,onPasteBlock,
  onTurnIntoBlock,onCopyLink,
  onMoveBlock,onChangeBlockType,onMediaUpload,onNavigatePage,setPendingFocus,
  dragState,registerRow,onDragHandleDown,selectedIds,
  locked,allDatabases,onUpdateDb,allSpreadsheets,onUpdateSs,onSelectionChange,
}) {
  const[hovId,setHovId]=useState(null);
  const[hoveredColId,setHoveredColId]=useState(null);
  const[colPresetFor,setColPresetFor]=useState(null);
  const pathKey=JSON.stringify(path);
  const inColumn = path.length>0 && !!path[path.length-1].colId;

  function startColResize(e,block,leftIdx) {
    if(locked)return;e.preventDefault();e.stopPropagation();
    const rowEl=colRowRefs.current[block.id];if(!rowEl)return;
    const rowW=rowEl.getBoundingClientRect().width,startX=e.clientX;
    const initW=block.colWidths?[...block.colWidths]:block.cols.map(()=>100/block.cols.length);
    document.body.style.userSelect="none";
    function move(ev){const d=((ev.clientX-startX)/rowW)*100,MIN=12,nw=[...initW];let l=nw[leftIdx]+d,r=nw[leftIdx+1]-d;if(l<MIN){r-=MIN-l;l=MIN;}if(r<MIN){l-=MIN-r;r=MIN;}nw[leftIdx]=l;nw[leftIdx+1]=r;onUpdateBlock(path,block.id,{colWidths:nw});}
    function up(){document.body.style.userSelect="";window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);}
    window.addEventListener("mousemove",move);window.addEventListener("mouseup",up);
  }

  function numberedIdx(i){let n=1;for(let j=i-1;j>=0;j--){if(blocks[j].type==="numbered")n++;else break;}return n;}
  function filtered(q){const ql=(q||"").trim().toLowerCase();if(!ql)return SLASH_ITEMS;return SLASH_ITEMS.filter(it=>it.label.toLowerCase().includes(ql)||it.kw.some(k=>k.includes(ql)));}

  const shared={
    rootBlocks,colors,darkMode,pages,blockRefs,colRowRefs,colCellRefs,
    slashMenu,setSlashMenu,calloutPicker,setCalloutPicker,
    onInput,onKeyDown,onUpdateBlock,onAddBlockAfter,onDeleteBlock,onDeleteDatabase,
    onCopyBlock,onCutBlock,onDuplicateBlock,onPasteBlock,onDeleteColumn,
    onMoveBlock,onChangeBlockType,onMediaUpload,onNavigatePage,
    setPendingFocus,dragState,registerRow,onDragHandleDown,selectedIds,locked,
    allDatabases,onUpdateDb,onDeleteDatabase,allSpreadsheets,onUpdateSs,onSelectionChange,
  };

  function renderContent(block,index) {
    const inp=e=>onInput(path,block,e);
    const kd=e=>onKeyDown(path,block,index,e);
    const lvl=headingLevel(block.type);
    const ceKey=`${block.id}:${block.type}`;
    function ce(placeholder,style){
      const isRTL = /[\u0600-\u06FF\u0750-\u077F]/.test(block.text||"");
      return <CE key={ceKey} blockId={block.id} initialText={block.text} marks={block.marks} placeholder={placeholder} blockRefs={blockRefs} locked={locked} onInput={inp} onKeyDown={kd}
        style={{
          textAlign: block.align || (isRTL ? "right" : "left"),
          direction: isRTL ? "rtl" : "ltr",
          ...style
        }}
        onMarksChange={(bId,newMarks)=>onUpdateBlock(path,bId,{marks:newMarks})}
        onSelectionChange={(bId,offsets,rect)=>onSelectionChange?.(path,bId,offsets,rect)}
      />;
    }
    if(block.type.startsWith("heading")&&!block.type.startsWith("toggle")&&lvl)return ce(`Heading ${lvl}`,{fontWeight:700,fontSize:SIZE_BY_LEVEL[lvl],margin:"14px 0 4px"});
    if(block.type.startsWith("toggleHeading")&&lvl)return(
      <div>
        <div style={{display:"flex",gap:8,alignItems:"flex-start",margin:"14px 0 4px"}}>
          <span onClick={()=>onUpdateBlock(path,block.id,{open:!block.open})} style={{cursor:"pointer",color:colors.muted,marginTop:4,flexShrink:0}}>{block.open?<ChevronDown size={lvl<=2?20:16}/>:<ChevronRight size={lvl<=2?20:16}/>}</span>
          <CE key={ceKey} blockId={block.id} initialText={block.text} placeholder={`Toggle heading ${lvl}`} blockRefs={blockRefs} locked={locked} onInput={inp} onKeyDown={kd} style={{flex:1,fontWeight:700,fontSize:SIZE_BY_LEVEL[lvl]}}/>
        </div>
        {block.open&&<div style={{marginLeft:28,borderLeft:`2px solid ${colors.border}`,paddingLeft:10}}><BlockList {...shared} path={[...path,{blockId:block.id,child:true}]} blocks={block.children||[]}/></div>}
      </div>
    );
    switch(block.type) {
      case"bulleted":return(<div style={{display:"flex",gap:10}}><span style={{color:colors.muted,lineHeight:"24px",flexShrink:0,marginTop:1}}>•</span>{ce("List item",{flex:1,fontSize:16,lineHeight:"24px"})}</div>);
      case"numbered":return(<div style={{display:"flex",gap:10}}><span style={{color:colors.muted,lineHeight:"24px",minWidth:20,flexShrink:0}}>{numberedIdx(index)}.</span>{ce("List item",{flex:1,fontSize:16,lineHeight:"24px"})}</div>);
      case"todo":return(<div style={{display:"flex",gap:10,alignItems:"flex-start"}}><input type="checkbox" checked={!!block.checked} onChange={()=>!locked&&onUpdateBlock(path,block.id,{checked:!block.checked})} disabled={locked} style={{marginTop:5,cursor:locked?"default":"pointer",flexShrink:0}}/><CE key={ceKey} blockId={block.id} initialText={block.text} placeholder="To-do" blockRefs={blockRefs} locked={locked} onInput={inp} onKeyDown={kd} style={{flex:1,fontSize:16,lineHeight:"24px",textDecoration:block.checked?"line-through":"none",color:block.checked?colors.muted:colors.text}}/></div>);
      case"toggle":return(
        <div>
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <span onClick={()=>onUpdateBlock(path,block.id,{open:!block.open})} style={{cursor:"pointer",color:colors.muted,lineHeight:"24px",flexShrink:0}}>{block.open?<ChevronDown size={16}/>:<ChevronRight size={16}/>}</span>
            {ce("Toggle",{flex:1,fontSize:16,lineHeight:"24px",fontWeight:500})}
          </div>
          {block.open&&<div style={{marginLeft:24,borderLeft:`2px solid ${colors.border}`,paddingLeft:10,marginTop:4}}><BlockList {...shared} path={[...path,{blockId:block.id,child:true}]} blocks={block.children||[]}/></div>}
        </div>
      );
      case"callout":return(
        <div style={{display:"flex",gap:10,background:block.backgroundColor?translucentColor(block.backgroundColor):colors.surface,borderRadius:8,padding:"12px 14px",alignItems:"flex-start",position:"relative"}}>
          <span onClick={()=>!locked&&setCalloutPicker(calloutPicker===block.id?null:block.id)} style={{cursor:locked?"default":"pointer",fontSize:20,lineHeight:1,userSelect:"none",flexShrink:0}}>{typeof block.emoji==="object"?<RenderIcon icon={block.emoji} size={20}/>:block.emoji}</span>
          {!locked&&<BlockBackgroundPicker block={block} colors={colors} onUpdate={change=>onUpdateBlock(path,block.id,change)}/>}
          {calloutPicker===block.id&&!locked&&(<div style={{position:"absolute",top:44,left:0,width:300,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:8,padding:8,zIndex:30,boxShadow:"0 6px 20px rgba(0,0,0,0.12)"}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,flexWrap:"wrap"}}>
  {block.emoji&&typeof block.emoji==="object"&&["#FFFFFF","#9065B0","#448361","#E03E3E","#C14C8A","#787774","#273669","#7ADEB1","#D9730D","#F09EA8","#9F6B53","#337EA9","#B0ED77","#CB912F","#E3A96F"].map(c=>(
    <button key={c} onClick={()=>onUpdateBlock(path,block.id,{emoji:{...block.emoji,color:c}})} style={{width:18,height:18,borderRadius:"50%",background:c,border:block.emoji.color===c?`2px solid ${colors.text}`:`1px solid ${colors.border}`,cursor:"pointer",padding:0}}/>
  ))}
  {block.emoji&&<button onClick={()=>{onUpdateBlock(path,block.id,{emoji:null});setCalloutPicker(null);}} style={{marginLeft:"auto",fontSize:11,color:colors.muted,background:"transparent",border:`1px solid ${colors.border}`,borderRadius:5,padding:"2px 8px",cursor:"pointer"}}>Remove</button>}
</div><div style={{fontSize:11,color:colors.muted,marginBottom:5}}>EMOJI</div><div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:2,maxHeight:130,overflowY:"auto"}}>{QUICK_EMOJIS.map(em=><button key={em} onClick={()=>{onUpdateBlock(path,block.id,{emoji:em});setCalloutPicker(null);}} style={{fontSize:18,border:"none",background:"transparent",cursor:"pointer",padding:3}}>{em}</button>)}</div><div style={{height:1,background:colors.border,margin:"7px 0"}}/><div style={{fontSize:11,color:colors.muted,marginBottom:5}}>ICON</div><div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:3,maxHeight:120,overflowY:"auto"}}>{ICON_NAMES.map(name=>{const Icon=ICON_LIBRARY[name];return <button key={name} title={name} onClick={()=>{onUpdateBlock(path,block.id,{emoji:{kind:"icon",value:name,color:(block.emoji&&block.emoji.color)||colors.muted}});setCalloutPicker(null);}} style={{border:"none",background:"transparent",color:colors.muted,cursor:"pointer",padding:4}}><Icon size={16}/></button>;})}</div></div>)}
          <div style={{flex:1,minWidth:0}}>{ce("Type a callout…",{fontSize:15,lineHeight:"22px"})}{block.children?.length>0&&<div style={{marginTop:4}}><BlockList {...shared} path={[...path,{blockId:block.id,child:true}]} blocks={block.children}/></div>}</div>
        </div>
      );
      case"quote":return(<div style={{display:"flex",alignItems:"flex-start",gap:6,padding:"8px 10px",borderRadius:6,background:block.backgroundColor?translucentColor(block.backgroundColor):"transparent"}}>
        <div style={{flex:1}}>
          {ce("Quote…",{fontStyle:"italic",fontSize:17,borderLeft:`3px solid ${getQuoteAccentColor(block,colors)}`,paddingLeft:14})}
        </div>
        {!locked&&<BlockBackgroundPicker block={block} colors={colors} onUpdate={change=>onUpdateBlock(path,block.id,change)}/>}
      </div>);
      case"divider":return<DividerBlock block={block} colors={colors} locked={locked} onUpdate={change=>onUpdateBlock(path,block.id,change)}/>;
      case"toc":{
        const hs=collectHeadings(rootBlocks);
        return(<div style={{background:colors.surface,borderRadius:8,padding:"12px 16px"}}>{!hs.length?<div style={{color:colors.muted,fontSize:13}}>Add headings to build a table of contents.</div>:hs.map(h=><div key={h.id} onClick={()=>blockRefs.current[h.id]?.scrollIntoView({behavior:"smooth",block:"center"})} style={{paddingLeft:(h.level-1)*14,padding:"3px 0",cursor:"pointer",fontSize:14,color:h.level===1?colors.text:colors.muted}}>{h.text||"Untitled heading"}</div>)}</div>);
      }
      case"page":{
        const linked=pages.find(p=>p.id===block.pageRef);
        return(<div onClick={()=>linked&&onNavigatePage(linked.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:6,cursor:"pointer",background:colors.surface}}><RenderIcon icon={linked?linked.icon:defaultIcon()} size={18}/><span style={{flex:1}}>{linked?(linked.title||"Untitled"):"Missing page"}</span></div>);
      }
            case"columns":{
        // Guard: heal any legacy/corrupted columns block that has no `cols`
        // instead of crashing (this is what was breaking every reload).
        const cols=(block.cols&&block.cols.length)?block.cols:[{id:rid(),blocks:[newSimpleBlock()]}];
        const widths=block.colWidths||cols.map(()=>100/cols.length);
        return(
          <div ref={el=>{if(el)colRowRefs.current[block.id]=el;}} style={{display:"flex",alignItems:"stretch",width:"100%"}}>
            {cols.map((col,i)=>(
              <div key={col.id}
                ref={el=>{if(el)colCellRefs.current[col.id]=el;else delete colCellRefs.current[col.id];}}
                onMouseEnter={()=>setHoveredColId(col.id)}
                onMouseLeave={()=>setHoveredColId(h=>h===col.id?null:h)}
                style={{display:"flex",width:`${widths[i]}%`,minWidth:0,flexShrink:0,position:"relative"}}>
                <div style={{flex:1,minWidth:0,padding:"0 6px",position:"relative"}}>
                  {!locked&&block.cols.length>1&&hoveredColId===col.id&&(
                    <button onClick={()=>onDeleteColumn(path,block.id,col.id)} title="Delete column (and its content)" style={{position:"absolute",top:-2,right:0,zIndex:20,border:"none",background:colors.surface,color:colors.muted,borderRadius:4,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,0.12)"}}>
                      <X size={12}/>
                    </button>
                  )}
                  <BlockList {...shared} path={[...path,{blockId:block.id,colId:col.id}]} blocks={col.blocks}/>
                </div>
                {i<block.cols.length-1&&(
  <div onMouseDown={e=>{if(!locked)startColResize(e,block,i);}} style={{width:4,flexShrink:0,cursor:locked?"default":"col-resize",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>{if(!locked)e.currentTarget.querySelector("div").style.background="#2383e2";}} onMouseLeave={e=>{e.currentTarget.querySelector("div").style.background=locked?"transparent":colors.border;}}>
    <div style={{width:2,height:32,background:locked?"transparent":colors.border,borderRadius:2,transition:"background 0.15s"}}/>
  </div>
)}
              </div>
            ))}
          </div>
        );
      }
      case"image":return block.media?<ImageBlock block={block} colors={colors} locked={locked} onUpdate={ch=>onUpdateBlock(path,block.id,ch)}/>:<UploadBox accept="image/*" label="Click to upload an image" colors={colors} locked={locked} onFile={f=>onMediaUpload(path,block.id,f)}/>;
      case"video":return block.media?.dataUrl
        ? <div><video src={block.media.dataUrl} controls style={{maxWidth:"100%",borderRadius:8}}/>{!locked&&<button onClick={()=>onUpdateBlock(path,block.id,{media:null})} style={{marginTop:4,background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,padding:"3px 8px",fontSize:12,cursor:"pointer",color:colors.text}}>Remove</button>}</div>
        : <UploadBox accept="video/*" label="Click to upload a video" colors={colors} locked={locked} onFile={f=>onMediaUpload(path,block.id,f)}/>;
      case"audio":return block.media?<div><audio src={block.media.dataUrl} controls style={{width:"100%"}}/>{!locked&&<button onClick={()=>onUpdateBlock(path,block.id,{media:null})} style={{marginTop:4,background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,padding:"3px 8px",fontSize:12,cursor:"pointer",color:colors.text}}>Remove</button>}</div>:<UploadBox accept="audio/*" label="Click to upload audio" colors={colors} locked={locked} onFile={f=>onMediaUpload(path,block.id,f)}/>;
      case"file":return block.media?<div style={{display:"flex",alignItems:"center",gap:10,background:colors.surface,borderRadius:8,padding:"10px 14px"}}><FileGeneric size={20} color={colors.muted}/><a href={block.media.dataUrl} download={block.media.name} style={{flex:1,color:colors.text,textDecoration:"none"}}>{block.media.name}</a><span style={{fontSize:12,color:colors.muted}}>{formatBytes(block.media.size)}</span>{!locked&&<button onClick={()=>onUpdateBlock(path,block.id,{media:null})} style={{background:"transparent",border:"none",cursor:"pointer",color:colors.muted}}><X size={14}/></button>}</div>:<UploadBox accept="*/*" label="Click to upload a file" colors={colors} locked={locked} onFile={f=>onMediaUpload(path,block.id,f)}/>;
      case "link":    return <LinkBlock    block={block} colors={colors} locked={locked} onUpdate={ch=>onUpdateBlock(path,block.id,ch)}/>;
      case "spotify": return <SpotifyBlock block={block} colors={colors} locked={locked} onUpdate={ch=>onUpdateBlock(path,block.id,ch)}/>;
      case "github":  return <GitHubBlock  block={block} colors={colors} locked={locked} onUpdate={ch=>onUpdateBlock(path,block.id,ch)}/>;
      case "youtube": return <YouTubeBlock block={block} colors={colors} locked={locked} onUpdate={ch=>onUpdateBlock(path,block.id,ch)}/>;
      case "twitter": return <TwitterBlock block={block} colors={colors} locked={locked} onUpdate={ch=>onUpdateBlock(path,block.id,ch)}/>;
      case "figma":   return <FigmaBlock   block={block} colors={colors} locked={locked} onUpdate={ch=>onUpdateBlock(path,block.id,ch)}/>;
      case "maps":    return <MapsBlock    block={block} colors={colors} locked={locked} onUpdate={ch=>onUpdateBlock(path,block.id,ch)}/>;
      case "embed":   return <GenericEmbedBlock block={block} colors={colors} locked={locked} onUpdate={ch=>onUpdateBlock(path,block.id,ch)}/>;
      case"database":return<DatabaseBlock block={block} colors={colors} darkMode={darkMode} locked={locked} allDatabases={allDatabases} onUpdateDb={onUpdateDb} onDeleteDatabase={()=>{onDeleteDatabase?.(block.dbId);onDeleteBlock(path,block.id,true);}}/>;
      case"spreadsheet":return<SpreadsheetBlock block={block} colors={colors} locked={locked} allSpreadsheets={allSpreadsheets} onUpdateSs={onUpdateSs}/>;
      default:return ce("Type '/' for commands",{fontSize:16,lineHeight:"24px",minHeight:28});
    }
  }

  const isOverHere=dragState.active&&dragState.overPathKey===pathKey;
  const dropHere=isOverHere?dragState.overIndex:null;
  const hideIndicator=dragState.fromPathKey===pathKey&&(dropHere===dragState.fromIndex||dropHere===dragState.fromIndex+1);
  const showIndicator=idx=>isOverHere&&dropHere===idx&&!hideIndicator;
  const DropLine=()=>(<div style={{position:"relative",height:0}}><div style={{position:"absolute",top:-1,left:0,right:0,height:2,background:"#2383e2",borderRadius:2,zIndex:10,transformOrigin:"left center",animation:"dropLineIn 0.1s cubic-bezier(0.2,0,0,1)"}}><div style={{position:"absolute",left:-3,top:-3,width:8,height:8,borderRadius:"50%",background:"#2383e2"}}/></div></div>);

  return(
    <div style={{position:"relative"}}>
      {blocks.map((block,index)=>{
        const isBeingDragged=dragState.active&&dragState.blockId===block.id;
        const isSelected=selectedIds?.has(block.id);
        return(
          <div key={block.id} id={`block-${block.id}`} data-block-row="true">
            {showIndicator(index)&&<DropLine/>}
            <div ref={el=>registerRow(block.id,el,path,index,block)} onMouseEnter={()=>setHovId(block.id)} onMouseLeave={()=>setHovId(h=>h===block.id?null:h)}
              style={{position:"relative",marginBottom:block.type==="divider"?2:3,opacity:isBeingDragged?0.3:1,transition:"opacity 0.18s cubic-bezier(0.2,0,0,1),background 0.16s cubic-bezier(0.2,0,0,1),box-shadow 0.16s cubic-bezier(0.2,0,0,1)",borderRadius:6,background:isSelected?"rgba(35,131,226,0.10)":"transparent",boxShadow:isSelected?"0 0 0 1.5px rgba(35,131,226,0.45)":"none"}}>
              <div style={{display:"flex",alignItems:"flex-start",paddingLeft:inColumn?10:28,position:"relative"}}>
                {!locked&&(<BlockActions block={block} path={path} index={index} colors={colors} visible={hovId===block.id&&!dragState.active} onDragHandleDown={onDragHandleDown} onCopyBlock={onCopyBlock} onCutBlock={onCutBlock} onDuplicateBlock={onDuplicateBlock} onPasteBlock={onPasteBlock} onDeleteBlock={onDeleteBlock} onTurnIntoBlock={onTurnIntoBlock} onCopyLink={onCopyLink}/>) }
                <div style={{flex:1,minWidth:0,position:"relative"}}>
                  {renderContent(block,index)}
                  {colPresetFor===block.id&&(<ColumnPresetPicker colors={colors} onPick={preset=>{const cols=Array.from({length:preset.cols},()=>({id:rid(),blocks:[newSimpleBlock()]}));onUpdateBlock(path,block.id,{type:"columns",text:"",cols,colWidths:preset.widths});setColPresetFor(null);setPendingFocus({blockId:cols[0].blocks[0].id});}}/>)}
                  {slashMenu?.blockId===block.id&&!locked&&(
                    <div style={{position:"absolute",top:"100%",left:0,marginTop:4,width:290,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",padding:6,maxHeight:320,overflowY:"auto",zIndex:50}}>
                      {filtered(slashMenu.query).length===0?<div style={{padding:"10px 12px",fontSize:13,color:colors.muted}}>No matching blocks</div>:filtered(slashMenu.query).map((item,i)=>{
                        const Icon=item.Icon,active=i===slashMenu.index;
                        return(
                          <div key={item.type} onMouseEnter={()=>setSlashMenu(s=>({...s,index:i}))}
                            onMouseDown={e=>{
                              e.preventDefault();
                              if(item.type==="columns"){onUpdateBlock(path,block.id,{text:""});setSlashMenu(null);setColPresetFor(block.id);}
                              else onChangeBlockType(path,block.id,item.type);
                            }}
                            style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:6,cursor:"pointer",background:active?colors.border:"transparent",transition:"background 0.08s"}}>
                            <span style={{width:28,height:28,borderRadius:6,background:colors.bg,border:`1px solid ${colors.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={14}/></span>
                            <div><div style={{fontSize:13.5}}>{item.label}</div><div style={{fontSize:11.5,color:colors.muted}}>{item.hint}</div></div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {showIndicator(blocks.length)&&<DropLine/>}
      {!locked&&<div onClick={()=>onAddBlockAfter(path,blocks.length-1,"paragraph")} style={{minHeight:80,cursor:"text"}}/>}
      {locked&&<div style={{minHeight:40}}/>}
    </div>
  );
}

function HomePage({pages,colors,onOpenPage,onNewPage}) {
  const roots = pages.filter(p=>!p.parentId);
  return (
    <div style={{padding:"60px 60px 120px",maxWidth:1000,margin:"0 auto"}}>
      <h1 style={{fontSize:32,fontWeight:700,marginBottom:24}}>Your pages</h1>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
        {roots.map(page=>(
          <div key={page.id} onClick={()=>onOpenPage(page.id)}
            style={{border:`1px solid ${colors.border}`,borderRadius:10,padding:16,cursor:"pointer",background:colors.sidebar,transition:"box-shadow 0.15s,transform 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.1)";e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none";}}>
            <div style={{fontSize:28,marginBottom:8}}><RenderIcon icon={page.icon} size={28}/></div>
            <div style={{fontWeight:600,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{page.title||"Untitled"}</div>
          </div>
        ))}
        <div onClick={onNewPage} style={{border:`1.5px dashed ${colors.border}`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",minHeight:100,cursor:"pointer",color:colors.muted,fontSize:13}}>
          + New page
        </div>
      </div>
    </div>
  );
}

function AuthModal({colors,mode,setMode,email,setEmail,password,setPassword,confirmPassword,setConfirmPassword,username,setUsername,avatar,setAvatar,showAvatarPicker,setShowAvatarPicker,error,onSubmit,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:colors.bg,borderRadius:12,width:320,padding:24,boxShadow:"0 24px 72px rgba(0,0,0,0.28)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{margin:0,fontSize:18}}>{mode==="login"?"Sign in":"Create account"}</h3>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:colors.muted}}><X size={18}/></button>
        </div>

        {mode==="signup"&&(
          <div style={{display:"flex",justifyContent:"center",marginBottom:14,position:"relative"}}>
            <div onClick={()=>setShowAvatarPicker(v=>!v)} style={{cursor:"pointer",width:56,height:56,borderRadius:"50%",background:colors.surface,border:`1px solid ${colors.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <RenderIcon icon={avatar} size={30}/>
            </div>
            {showAvatarPicker&&(
              <div style={{position:"absolute",top:64,zIndex:50,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:8,padding:8,display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:4,boxShadow:"0 8px 24px rgba(0,0,0,0.15)"}}>
                {QUICK_EMOJIS.map(em=><span key={em} onClick={()=>{setAvatar({kind:"emoji",value:em});setShowAvatarPicker(false);}} style={{fontSize:18,cursor:"pointer",textAlign:"center",padding:3,borderRadius:5}}>{em}</span>)}
              </div>
            )}
          </div>
        )}

        {mode==="signup"&&(
          <input type="text" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)}
            style={{width:"100%",padding:"8px 10px",marginBottom:8,borderRadius:6,border:`1px solid ${colors.border}`,background:colors.surface,color:colors.text,fontSize:14}}/>
        )}

        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
          style={{width:"100%",padding:"8px 10px",marginBottom:8,borderRadius:6,border:`1px solid ${colors.border}`,background:colors.surface,color:colors.text,fontSize:14}}/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
          style={{width:"100%",padding:"8px 10px",marginBottom:8,borderRadius:6,border:`1px solid ${colors.border}`,background:colors.surface,color:colors.text,fontSize:14}}/>

        {mode==="signup"&&(
          <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}
            style={{width:"100%",padding:"8px 10px",marginBottom:8,borderRadius:6,border:`1px solid ${colors.border}`,background:colors.surface,color:colors.text,fontSize:14}}/>
        )}

        {error&&<div style={{color:"#e03",fontSize:12,marginBottom:8}}>{error}</div>}
        <button onClick={onSubmit} style={{width:"100%",padding:"9px 0",borderRadius:6,border:"none",background:"#2383e2",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:600,marginBottom:10}}>
          {mode==="login"?"Sign in":"Sign up"}
        </button>
        <div style={{textAlign:"center",fontSize:12,color:colors.muted,cursor:"pointer"}} onClick={()=>setMode(mode==="login"?"signup":"login")}>
          {mode==="login"?"No account? Sign up":"Have an account? Sign in"}
        </div>
      </div>
    </div>
  );
}

function SettingsModal({colors,username,setUsername,email,setEmail,avatar,setAvatar,showAvatarPicker,setShowAvatarPicker,error,success,onSave,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:colors.bg,borderRadius:12,width:320,padding:24,boxShadow:"0 24px 72px rgba(0,0,0,0.28)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{margin:0,fontSize:18}}>Account settings</h3>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:colors.muted}}><X size={18}/></button>
        </div>

        <div style={{display:"flex",justifyContent:"center",marginBottom:14,position:"relative"}}>
          <div onClick={()=>setShowAvatarPicker(v=>!v)} style={{cursor:"pointer",width:56,height:56,borderRadius:"50%",background:colors.surface,border:`1px solid ${colors.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <RenderIcon icon={avatar} size={30}/>
          </div>
          {showAvatarPicker&&(
            <div style={{position:"absolute",top:64,zIndex:50,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:8,padding:8,display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:4,boxShadow:"0 8px 24px rgba(0,0,0,0.15)"}}>
              {QUICK_EMOJIS.map(em=><span key={em} onClick={()=>{setAvatar({kind:"emoji",value:em});setShowAvatarPicker(false);}} style={{fontSize:18,cursor:"pointer",textAlign:"center",padding:3,borderRadius:5}}>{em}</span>)}
            </div>
          )}
        </div>

        <label style={{fontSize:11,color:colors.muted,display:"block",marginBottom:3}}>Username</label>
        <input type="text" value={username} onChange={e=>setUsername(e.target.value)}
          style={{width:"100%",padding:"8px 10px",marginBottom:10,borderRadius:6,border:`1px solid ${colors.border}`,background:colors.surface,color:colors.text,fontSize:14}}/>

        <label style={{fontSize:11,color:colors.muted,display:"block",marginBottom:3}}>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
          style={{width:"100%",padding:"8px 10px",marginBottom:10,borderRadius:6,border:`1px solid ${colors.border}`,background:colors.surface,color:colors.text,fontSize:14}}/>

        {error&&<div style={{color:"#e03",fontSize:12,marginBottom:8}}>{error}</div>}
        {success&&<div style={{color:"#2ecc71",fontSize:12,marginBottom:8}}>{success}</div>}

                <button onClick={onSave} style={{width:"100%",padding:"9px 0",borderRadius:6,border:"none",background:"#2383e2",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:600}}>
          Save changes
        </button>

        {/* ADD THIS */}
        <button onClick={()=>{if(window.confirm("This will clear locally cached data and reload the app. Continue?"))resetLocalSync();}}
          style={{width:"100%",padding:"8px 0",marginTop:10,borderRadius:6,border:`1px solid ${colors.border}`,background:"transparent",color:colors.muted,cursor:"pointer",fontSize:12}}>
          Having sync issues? Reset local data
        </button>
      </div>
    </div>
  );
}

function ShareModal({colors,email,setEmail,error,success,onSubmit,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:colors.bg,borderRadius:12,width:320,padding:24,boxShadow:"0 24px 72px rgba(0,0,0,0.28)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{margin:0,fontSize:18}}>Share page</h3>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:colors.muted}}><X size={18}/></button>
        </div>
        <label style={{fontSize:11,color:colors.muted,display:"block",marginBottom:3}}>Their account email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="friend@example.com"
          style={{width:"100%",padding:"8px 10px",marginBottom:8,borderRadius:6,border:`1px solid ${colors.border}`,background:colors.surface,color:colors.text,fontSize:14}}/>
        {error&&<div style={{color:"#e03",fontSize:12,marginBottom:8}}>{error}</div>}
        {success&&<div style={{color:"#2ecc71",fontSize:12,marginBottom:8}}>{success}</div>}
        <button onClick={onSubmit} style={{width:"100%",padding:"9px 0",borderRadius:6,border:"none",background:"#2383e2",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:600}}>Share</button>
      </div>
    </div>
  );
}

function sanitizeBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks.map(b => {
    let block = { ...b };
    if (block.type === "columns") {
      if (!Array.isArray(block.cols) || block.cols.length === 0) {
        // Corrupted columns block — recover it as a plain paragraph instead
        // of leaving it as a columns block with nothing to render.
        block = { ...block, type: "paragraph", cols: null, colWidths: null };
      } else {
        block.cols = block.cols.map(c => ({ ...c, blocks: sanitizeBlocks(c.blocks) }));
      }
    }
    if (block.children?.length) block.children = sanitizeBlocks(block.children);
    return block;
  });
}
function sanitizePages(pagesArr) {
  return Array.isArray(pagesArr) ? pagesArr.map(p => ({ ...p, blocks: sanitizeBlocks(p.blocks) })) : pagesArr;
}

export default function App() {
  const[darkMode,setDarkMode]=useState(()=>{try{return localStorage.getItem("eris-dark-mode")==="true";}catch{return false;}});
  const[user,setUser]=useState(null);
  const[showAuthModal,setShowAuthModal]=useState(false);
  const[authMode,setAuthMode]=useState("login");
  const[authEmail,setAuthEmail]=useState("");
  const[authPassword,setAuthPassword]=useState("");
  const[authError,setAuthError]=useState("");
  const[profile,setProfile]=useState(null);
  const[authUsername,setAuthUsername]=useState("");
  const[authConfirmPassword,setAuthConfirmPassword]=useState("");
  const[authAvatar,setAuthAvatar]=useState({kind:"emoji",value:"🙂"});
  const[showAuthAvatarPicker,setShowAuthAvatarPicker]=useState(false);
  const[showUserMenu,setShowUserMenu]=useState(false);
  const[showSettingsModal,setShowSettingsModal]=useState(false);
  const[showShareModal,setShowShareModal]=useState(false);
  const[shareEmail,setShareEmail]=useState("");
  const[shareError,setShareError]=useState("");
  const[shareSuccess,setShareSuccess]=useState("");
  const[settingsUsername,setSettingsUsername]=useState("");
  const[settingsEmail,setSettingsEmail]=useState("");
  const[settingsAvatar,setSettingsAvatar]=useState({kind:"emoji",value:"🙂"});
  const[showSettingsAvatarPicker,setShowSettingsAvatarPicker]=useState(false);
  const[settingsError,setSettingsError]=useState("");
  const[settingsSuccess,setSettingsSuccess]=useState("");
  const[showAnnouncement,setShowAnnouncement]=useState(()=>{
  try{return localStorage.getItem("eris-announcement-dismissed")!=="true";}catch{return true;}
});
  const[sidebarOpen,setSidebarOpen]=useState(true);
  const[selection,setSelection]=useState(null);
  const[fullWidth,setFullWidth]=useState(false);
  const[pages,setPages]=useState(()=>{try{const s=localStorage.getItem("eris-pages");if(s)return sanitizePages(JSON.parse(s));}catch{}return[newPage(null)];});
    const[trash,setTrash]=useState(()=>{try{const s=localStorage.getItem("eris-trash");if(s)return sanitizePages(JSON.parse(s));}catch{}return[];});
    const historyRef=useRef({current:null,past:[],future:[],applying:false});
    const[historyTick,setHistoryTick]=useState(0);
  const[databases,setDatabases]=useState(()=>{try{const s=localStorage.getItem("eris-dbs");if(s)return JSON.parse(s);}catch{}return{};});
  const[spreadsheets,setSpreadsheets]=useState(()=>{try{const s=localStorage.getItem("eris-ss");if(s)return JSON.parse(s);}catch{}return{};});
  const[activePageId,setActivePageId]=useState("HOME");
  const[expanded,setExpanded]=useState(new Set());
  
  const[showIconPick,setShowIconPick]=useState(false);
  const[pickerTab,setPickerTab]=useState("emoji");
  const[selColor,setSelColor]=useState(ICON_COLORS[1]);
  const[showCoverPick,setShowCoverPick]=useState(false);
  const[coverTab,setCoverTab]=useState("color");
  const[repositioning,setRepositioning]=useState(false);
  const[slashMenu,setSlashMenu]=useState(null);
  const[calloutPicker,setCalloutPicker]=useState(null);
  const[pendingFocus,setPendingFocus]=useState(null);
  const[trashTarget,setTrashTarget]=useState(null);
  const[selectedIds,setSelectedIds]=useState(new Set());
  const[selectionRect,setSelectionRect]=useState(null);
  const[importStatus,setImportStatus]=useState(null);
  const[viewPickerPending,setViewPickerPending]=useState(null);
  const[dragState,setDragState]=useState({active:false,fromPath:null,fromPathKey:null,fromIndex:null,blockId:null,blockText:"",x:0,y:0,overPath:null,overPathKey:null,overIndex:null});
  const[syncLoading,setSyncLoading]=useState(false);
  const[hasUnsavedChanges,setHasUnsavedChanges]=useState(false); // ADD THIS
  const saveCounter=useRef(0);
  const syncSkipRef=useRef(false);
  const saveTimer=useRef(null);
  const pendingRemovedShared = useRef(new Set());
  const cvDrag=useRef({active:false,startY:0,startPos:50});
  const blockRefs=useRef({});
  const colRowRefs=useRef({});
  const colCellRefs=useRef({}); 
  const scrollContainerRef = useRef(null);
  const rowRegistry=useRef({});
  const blockClipboardRef=useRef([]);

  useEffect(()=>{try{localStorage.setItem("eris-pages",JSON.stringify(pages));}catch{}},[pages]);
    useEffect(()=>{try{localStorage.setItem("eris-trash",JSON.stringify(trash));}catch{}},[trash]);
    useEffect(()=>{try{localStorage.setItem("eris-dark-mode",String(darkMode));}catch{}},[darkMode]);
useEffect(()=>{
  const unsubscribe=watchAuthState(u=>setUser(u));
  return unsubscribe;
},[]);
useEffect(()=>{
  if(!user)return;
  let cancelled=false;
  (async()=>{
    setSyncLoading(true);
    try{
      const cloud=await loadWorkspace(user.uid);
      if(cancelled)return;
      if(cloud){
        syncSkipRef.current=true;
        setPages(prev=>{
          const sharedIds = new Set(prev.filter(p=>p.isShared).map(p=>p.id));
          const personal = sanitizePages(cloud.pages&&cloud.pages.length?cloud.pages:[newPage(null)])
            .filter(p=>!sharedIds.has(p.id));
          const shared = prev.filter(p=>p.isShared);
          return [...personal, ...shared];
        });
        setTrash(sanitizePages(cloud.trash||[]));
        setDatabases(cloud.databases||{});
        setSpreadsheets(cloud.spreadsheets||{});
      }else{
        await saveWorkspace(user.uid,{pages,trash,databases,spreadsheets});
      }
    }catch(e){console.error("Sync load failed:",e);}
    if(!cancelled)setSyncLoading(false);
  })();
  return ()=>{cancelled=true;};
},[user?.uid]); // ← changed from [user]

useEffect(()=>{
  if(!user)return;
  const unsub = watchSharedPagesForUser(user.uid, sharedDocs=>{
    const filtered = sharedDocs.filter(d=>!pendingRemovedShared.current.has(d.id) && !d.deleted);

    setPages(prev=>{
      const sharedIds = new Set(filtered.map(d=>d.id));
      const personal = prev.filter(p=>!p.isShared && !sharedIds.has(p.id));
      const shared = filtered.map(d=>{
        const existing = prev.find(p=>p.id===d.id);
        const activelyEditing = existing && existing.isShared && !existing.locked && activePageIdRef.current===d.id;
        return {
          id: d.id,
          title: activelyEditing ? existing.title : (d.title || "Untitled"),
          icon: activelyEditing ? existing.icon : (d.icon || defaultIcon()),
          blocks: activelyEditing ? existing.blocks : sanitizeBlocks(d.content?.blocks || []),
          parentId: null,
          locked: existing ? existing.locked : false,
          isShared: true,
          ownerId: d.ownerId,
        };
      });
      return [...personal, ...shared];
    });

    setDatabases(prev=>{
      const merged={...prev};
      filtered.forEach(d=>{ if(d.databases) Object.assign(merged, d.databases); });
      return merged;
    });
    setSpreadsheets(prev=>{
      const merged={...prev};
      filtered.forEach(d=>{ if(d.spreadsheets) Object.assign(merged, d.spreadsheets); });
      return merged;
    });
  });
  return unsub;
},[user]);

useEffect(()=>{
  if(!user)return;
  if(syncSkipRef.current){syncSkipRef.current=false;return;}
  const myId=++saveCounter.current;
  setHasUnsavedChanges(true);
  clearTimeout(saveTimer.current);
  saveTimer.current=setTimeout(()=>{
    const personalPages = pages.filter(p=>!p.isShared);
    saveWorkspace(user.uid,{pages:personalPages,trash,databases,spreadsheets})
      .then(()=>{ if(myId===saveCounter.current) setHasUnsavedChanges(false); })
      .catch(e=>console.error("SAVE FAILED:",e));
  },1000);
  return ()=>clearTimeout(saveTimer.current);
},[pages,trash,databases,spreadsheets,user]);

useEffect(()=>{
  const isElectron=navigator.userAgent.includes("Electron");
  function handleBeforeUnload(e){
    if(hasUnsavedChanges&&!isElectron){
      e.preventDefault();
      e.returnValue = "";
    }
  }
  window.addEventListener("beforeunload", handleBeforeUnload);
  return ()=>window.removeEventListener("beforeunload", handleBeforeUnload);
},[hasUnsavedChanges]);

useEffect(()=>{
  if(!user){setProfile(null);return;}
  const unsub=onSnapshot(doc(db,"users",user.uid),snap=>{if(snap.exists())setProfile(snap.data());});
  return unsub;
},[user]);

useEffect(()=>{
  const h=e=>{if(!e.target.closest("[data-picker='usermenu']"))setShowUserMenu(false);};
  document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
},[]);;
  useEffect(()=>{try{localStorage.setItem("eris-dbs",JSON.stringify(databases));}catch{}},[databases]);
  useEffect(()=>{try{localStorage.setItem("eris-ss",JSON.stringify(spreadsheets));}catch{}},[spreadsheets]);
  useEffect(()=>{if(!activePageId)setActivePageId("HOME");},[pages]);
  useEffect(()=>{
  function goToHashPage(){
    const hash = window.location.hash;
    if(hash.startsWith("#page-")){
      const id = hash.slice("#page-".length);
      if(pages.some(p=>p.id===id)) setActivePageId(id);
    }
  }
  goToHashPage(); // run once on load
  window.addEventListener("hashchange", goToHashPage); // also handle pasting a link while app is already open
  return ()=>window.removeEventListener("hashchange", goToHashPage);
},[pages]);
  useEffect(()=>{
    const snapshot=JSON.stringify(pages);
    const history=historyRef.current;
    if(history.current===null){history.current=snapshot;return;}
    if(history.applying){history.applying=false;history.current=snapshot;setHistoryTick(value=>value+1);return;}
    if(history.current!==snapshot){history.past.push(history.current);history.current=snapshot;history.future=[];if(history.past.length>100)history.past.shift();setHistoryTick(value=>value+1);}
  },[pages]);
  const toolbarInteractingRef = useRef(false);
useEffect(()=>{
  function markToolbar(e){
    toolbarInteractingRef.current = !!e.target.closest('[data-selection-toolbar]');
  }
  document.addEventListener('mousedown', markToolbar, true); // capture phase — runs before focus changes
  return ()=>document.removeEventListener('mousedown', markToolbar, true);
},[]);

  const C=darkMode?{bg:"#1F1F1F",sidebar:"#252525",text:"#E8E8E6",border:"#333",muted:"#8a8a88",surface:"#2A2A2A"}:{bg:"#FFFFFF",sidebar:"#F7F6F3",text:"#1F1F1F",border:"#E4E3E0",muted:"#8a8a88",surface:"#F1F0EC"};
  const activePage=pages.find(p=>p.id===activePageId);
  const locked=activePage?.locked||false;

useEffect(()=>{
  if(!user||!activePage||!activePage.isShared)return;
  const t=setTimeout(()=>{
    updateSharedPageContent(activePage.id,{
      title:activePage.title,
      icon:activePage.icon,
      content:{blocks:activePage.blocks},
    },user.uid).catch(e=>{
      if(e.code==="not-found"){
        console.warn("Shared page truly gone on server — clearing local isShared flag.");
        updatePage(activePage.id,{isShared:false});
      } else {
        console.error("Shared page publish failed:",e);
      }
    });
  },800);
  return ()=>clearTimeout(t);
},[activePage?.title,activePage?.icon,activePage?.blocks,activePage?.isShared,user]);


  const activePageIdRef = useRef(activePageId);
  useEffect(()=>{ activePageIdRef.current = activePageId; },[activePageId]);

  useEffect(()=>{
    if(!pendingFocus)return;
    const el=blockRefs.current[pendingFocus.blockId];
    if(el){el.focus();try{const r=document.createRange(),s=window.getSelection();r.selectNodeContents(el);r.collapse(false);s.removeAllRanges();s.addRange(r);}catch{}}
    setPendingFocus(null);
  },[pendingFocus]);

  useEffect(()=>{
    const h=e=>{if(!e.target.closest("[data-picker='icon']"))setShowIconPick(false);if(!e.target.closest("[data-picker='cover']"))setShowCoverPick(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);

  useEffect(()=>{
    function onKey(e){
      const editing=!!e.target.closest?.("input,textarea,[contenteditable='true']");
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="c"&&!editing&&selectedIds.size){e.preventDefault();copySelectedBlocks();return;}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="x"&&!editing&&selectedIds.size){e.preventDefault();copySelectedBlocks();deleteSelectedBlocks();return;}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="v"&&!editing&&blockClipboardRef.current.length){e.preventDefault();pasteBlocks();return;}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"&&!editing){e.preventDefault();e.shiftKey?redo():undo();return;}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"&&!editing){e.preventDefault();redo();return;}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="a"&&!editing){e.preventDefault();selectAllBlocks();return;}
      if(!selectedIds.size)return;
      if(e.key==="Escape"){setSelectedIds(new Set());return;}
      if(e.key==="Backspace"||e.key==="Delete"){e.preventDefault();deleteSelectedBlocks();}
    }
    document.addEventListener("keydown",onKey);return()=>document.removeEventListener("keydown",onKey);
  },[selectedIds]);

  useEffect(()=>{
  function onNativePaste(e){
    const text=e.clipboardData?.getData("text/plain");
    if(!text||!text.startsWith("ERIS_BLOCKS:"))return;
    e.preventDefault();
    if(!activePage)return;
    try{
      const blocks=JSON.parse(text.slice("ERIS_BLOCKS:".length));
      if(!blocks?.length)return;
      const cloned=cloneBlockTree(blocks);
      const selectedInfo=[...selectedIds].map(id=>rowRegistry.current[id]).filter(Boolean)[0];
      const path=selectedInfo?.path||[];
      const insertIndex=selectedInfo?selectedInfo.index+1:getContainer(activePage.blocks,path).length;
      updBlocks(activePage.id,path,container=>{const next=[...container];next.splice(insertIndex,0,...cloned);return next;});
      setSelectedIds(new Set(cloned.map(b=>b.id)));
    }catch{}
  }
  document.addEventListener("paste",onNativePaste);
  return()=>document.removeEventListener("paste",onNativePaste);
},[activePage,selectedIds]);

  useEffect(()=>{
    function clearSelectionOnClick(e){
      if(e.button===2)return;
      if(selectedIds.size||selectionRect){setSelectedIds(new Set());setSelectionRect(null);}
    }
    document.addEventListener("mousedown",clearSelectionOnClick);
    return()=>document.removeEventListener("mousedown",clearSelectionOnClick);
  },[selectedIds,selectionRect]);

  function addPage(parentId=null,{navigate=true}={}){const p=newPage(parentId);setPages(prev=>[...prev,p]);if(navigate)setActivePageId(p.id);if(parentId)setExpanded(prev=>{const s=new Set(prev);s.add(parentId);return s;});return p.id;}
  async function handleAuthSubmit(){
  setAuthError("");
  if(authMode==="signup"){
    if(!authUsername.trim()){setAuthError("Please choose a username");return;}
    if(authPassword.length<6){setAuthError("Password should be at least 6 characters");return;}
    if(authPassword!==authConfirmPassword){setAuthError("Passwords don't match");return;}
  }
  try{
    if(authMode==="login")await logIn(authEmail,authPassword);
    else await signUp(authEmail,authPassword,authUsername.trim(),authAvatar);
    setShowAuthModal(false);
    setAuthEmail("");setAuthPassword("");setAuthConfirmPassword("");setAuthUsername("");setAuthAvatar({kind:"emoji",value:"🙂"});
  }catch(e){
    setAuthError(e.message.replace("Firebase: ","").replace(/\(auth\/.*\)\.?/,""));
  }
}

function openSettings(){
  setSettingsUsername(profile?.username||"");
  setSettingsEmail(user?.email||"");
  setSettingsAvatar(profile?.avatar||{kind:"emoji",value:"🙂"});
  setSettingsError("");setSettingsSuccess("");
  setShowSettingsModal(true);
  setShowUserMenu(false);
}

async function handleSettingsSave(){
  setSettingsError("");setSettingsSuccess("");
  try{
    if(settingsUsername.trim()&&settingsUsername!==profile?.username){
      await updateUsername(user.uid,settingsUsername.trim());
    }
    if(JSON.stringify(settingsAvatar)!==JSON.stringify(profile?.avatar)){
      await updateUserAvatar(user.uid,settingsAvatar);
    }
    if(settingsEmail.trim()&&settingsEmail!==user.email){
      await updateUserEmail(settingsEmail.trim());
    }
    setSettingsSuccess("Saved!");
    setTimeout(()=>setShowSettingsModal(false),900);
  }catch(e){
    if(e.code==="auth/requires-recent-login"){
      setSettingsError("For security, please sign out and sign back in before changing your email.");
    }else{
      setSettingsError(e.message.replace("Firebase: ","").replace(/\(auth\/.*\)\.?/,""));
    }
  }
}

  function duplicatePage(page){const clone={...JSON.parse(JSON.stringify(page)),id:rid(),title:(page.title||"Untitled")+" (copy)"};setPages(prev=>{const idx=prev.findIndex(p=>p.id===page.id);const next=[...prev];next.splice(idx+1,0,clone);return next;});setActivePageId(clone.id);}
  function deletePage(id){setPages(prev=>{const del=new Set([id]);let ch=true;while(ch){ch=false;prev.forEach(p=>{if(p.parentId&&del.has(p.parentId)&&!del.has(p.id)){del.add(p.id);ch=true;}});}const rem=prev.filter(p=>!del.has(p.id));if(del.has(activePageId))setActivePageId(rem[0]?.id||"HOME");return rem;});}
    function movePageToTrash(id){
  const target = pages.find(p=>p.id===id);
  if(target?.isShared && user){
    pendingRemovedShared.current.add(id);
    removeSharedPageMember(id, user.uid).catch(e=>console.error("Failed to leave shared page:",e));
  }
  setPages(prev=>{
    const del=new Set([id]);let ch=true;
    while(ch){ch=false;prev.forEach(p=>{if(p.parentId&&del.has(p.parentId)&&!del.has(p.id)){del.add(p.id);ch=true;}});}
    const removed=prev.filter(p=>del.has(p.id));
    setTrash(current=>{
      const incoming=removed.filter(p=>!p.isShared).map(page=>({...page,trashedAt:Date.now()}));
      const incomingIds=new Set(incoming.map(page=>page.id));
      return [...current.filter(page=>!incomingIds.has(page.id)),...incoming];
    });
    const rem=prev.filter(p=>!del.has(p.id));
    if(del.has(activePageId))setActivePageId(rem[0]?.id||"HOME");
    return rem;
  });
}
    function restorePage(id){const target=trash.find(page=>page.id===id);if(!target)return;setTrash(prev=>prev.filter(page=>page.id!==id));setPages(prev=>[...prev,{...target,trashedAt:undefined,parentId:null}]);}
    function deletePermanent(id){setTrash(prev=>prev.filter(page=>page.id!==id));}
    function deletePage(id){movePageToTrash(id);}
    function undo(){const history=historyRef.current;if(!history.past.length)return;history.future.push(history.current);history.current=history.past.pop();history.applying=true;setPages(JSON.parse(history.current));setHistoryTick(value=>value+1);}
    function redo(){const history=historyRef.current;if(!history.future.length)return;history.past.push(history.current);history.current=history.future.pop();history.applying=true;setPages(JSON.parse(history.current));setHistoryTick(value=>value+1);}
  function updatePage(id,ch){setPages(prev=>prev.map(p=>p.id===id?{...p,...ch}:p));}
  async function handleImportNotionFile(file){
  setImportStatus("loading");
  try{
    const {pages:imported,databases:importedDbs,spreadsheets:importedSs}=await parseNotionImport(file);
    if(!imported.length)throw new Error("No page content found in that file.");
    console.log("IMPORT: parsed pages from file:", imported.length, imported.map(p=>p.title));
    if(importedSs&&Object.keys(importedSs).length)setSpreadsheets(prev=>({...prev,...importedSs}));
    if(importedDbs&&Object.keys(importedDbs).length)setDatabases(prev=>({...prev,...importedDbs}));
    setPages(prev=>{
      const next=[...prev,...imported];
      console.log("IMPORT: pages before:", prev.length, "-> after:", next.length, next.map(p=>p.title));
      return next;
    });
    setActivePageId(imported[0].id);
    setImportStatus(null);
  }catch(e){
    console.error("IMPORT FAILED:", e);
    setImportStatus({error:e?.message||"Couldn't import that file."});
    setTimeout(()=>setImportStatus(null),5000);
  }
}
  function updBlocks(pageId,path,updater){setPages(prev=>prev.map(p=>p.id===pageId?{...p,blocks:updateContainer(p.blocks,path,updater)}:p));}
  function updBlock(pageId,path,blockId,ch){updBlocks(pageId,path,arr=>arr.map(b=>b.id===blockId?{...b,...ch}:b));}
  function updateDatabase(dbId,changes){setDatabases(prev=>({...prev,[dbId]:changes}));}
  function updateSpreadsheet(ssId,changes){setSpreadsheets(prev=>({...prev,[ssId]:changes}));}
  function createDatabase(defaultView="table"){const db=newDatabase("Untitled Database",defaultView);setDatabases(prev=>({...prev,[db.id]:db}));return db.id;}
  function createSpreadsheet(){const ss=newSpreadsheet(6,6);setSpreadsheets(prev=>({...prev,[ss.id]:ss}));return ss.id;}

  function addBlockAfter(pageId,path,index,type="paragraph") {
    if(locked)return;
    if(type==="database"){
      setViewPickerPending({pageId,path,index});
      return;
    }
    if(type==="spreadsheet"){const ssId=createSpreadsheet();const nb={...newBlock("spreadsheet"),ssId};updBlocks(pageId,path,arr=>{const c=[...arr];c.splice(index+1,0,nb);return c;});return nb.id;}
    const nb=newBlock(type);
    updBlocks(pageId,path,arr=>{const c=[...arr];c.splice(index+1,0,nb);return c;});
    setPendingFocus({blockId:nb.id});
    return nb.id;
  }

  

async function handleSharePageByEmail(email){
  if(!user) throw new Error("You need to be signed in to share");
  if(!activePage) throw new Error("Open a page first before sharing");
  const found=await findUserByEmail(email);
  console.log("found user:", found); // ADD
  if(!found) throw new Error("No account found with that email");
  if(found.uid===user.uid) throw new Error("That's your own account");
  const bundle=buildShareBundle(activePage,pages,databases,spreadsheets);
  console.log("bundle built:", bundle); // ADD
  await sharePage(activePage.id,user.uid,found.uid,bundle);
  console.log("sharePage succeeded"); // ADD
  updatePage(activePage.id,{isShared:true,ownerId:user.uid});
}

async function submitShareByEmail(){
  setShareError("");
  setShareSuccess("");
  try{
    await handleSharePageByEmail(shareEmail);
    setShareSuccess("Shared!");
    setTimeout(()=>setShowShareModal(false),900);
  }catch(e){
    console.error("submitShareByEmail caught:", e);
    setShareError(e.message || "Couldn't share that page.");
  }
}

  function commitViewPicker(viewType) {
    if(!viewPickerPending)return;
    const{pageId,path,index}=viewPickerPending;
    const dbId=createDatabase(viewType);
    const nb={...newBlock("database"),dbId};
    updBlocks(pageId,path,arr=>{const c=[...arr];c.splice(index+1,0,nb);return c;});
    setViewPickerPending(null);
  }

  function deleteBlock(pageId,path,blockId,allowEmpty=false){
    if(locked)return;
    const page=pages.find(p=>p.id===pageId);
    const cont=getContainer(page.blocks,path);
    const idx=cont.findIndex(b=>b.id===blockId);
    if(idx<0||(idx===0&&cont.length===1&&!allowEmpty))return;
    const focusId=cont[Math.max(0,idx-1)]?.id;
    updBlocks(pageId,path,arr=>arr.filter(b=>b.id!==blockId));
    if(focusId)setPendingFocus({blockId:focusId});
  }

  function handleSelectionChange(path,blockId,offsets,rect){
  if(!offsets){
    if(toolbarInteractingRef.current) return;
    setSelection(null);
    return;
  }
  setSelection({path,blockId,offsets,rect});
}
  function applyMarkToSelection(type,extra={}){
  if(!selection||!activePage)return;
  const{path,blockId,offsets}=selection;
  if(type==="align"){
    updBlock(activePage.id,path,blockId,{align:extra.value});
    return;
  }
  updBlocks(activePage.id,path,arr=>arr.map(b=>b.id!==blockId?b:{...b,marks:applyMark(b.marks||[],offsets.start,offsets.end,type,extra)}));
  }

  function moveBlock(pageId,path,from,to){if(locked)return;updBlocks(pageId,path,arr=>{const c=[...arr];const[m]=c.splice(from,1);c.splice(to,0,m);return c;});}
  function moveBlockAcross(pageId,fromPath,fromIndex,toPath,toIndex){
    if(locked)return;
    setPages(prev=>prev.map(p=>{
      if(p.id!==pageId)return p;
      const fromContainer=getContainer(p.blocks,fromPath);
      const moving=fromContainer[fromIndex];
      if(!moving)return p;
      if(toPath.some(step=>step.blockId===moving.id))return p;
      let newBlocks=updateContainer(p.blocks,fromPath,arr=>arr.filter((_,i)=>i!==fromIndex));
      newBlocks=updateContainer(newBlocks,toPath,arr=>{const copy=[...arr];const insertAt=Math.max(0,Math.min(toIndex,copy.length));copy.splice(insertAt,0,moving);return copy;});
      return{...p,blocks:newBlocks};
    }));
  }
  function moveBlockToNewColumn(pageId,fromPath,fromIndex,columnsPath,columnsId,insertAt){
  if(locked)return;
  setPages(prev=>prev.map(page=>{
    if(page.id!==pageId)return page;
    const source=getContainer(page.blocks,fromPath);
    const moving=source[fromIndex];
    if(!moving||moving.id===columnsId)return page;
    let nextBlocks=updateContainer(page.blocks,fromPath,items=>items.filter((_,i)=>i!==fromIndex));
    nextBlocks=updateContainer(nextBlocks,columnsPath,items=>items.map(item=>{
      if(item.id!==columnsId||item.type!=="columns")return item;
      const cols=item.cols||[];
      const newColumn={id:rid(),blocks:[moving]};
      const at=Math.max(0,Math.min(insertAt,cols.length));
      const nextCols=[...cols.slice(0,at),newColumn,...cols.slice(at)];
      return {...item,cols:nextCols,colWidths:nextCols.map(()=>100/nextCols.length)};
    }));
    return {...page,blocks:nextBlocks};
  }));
}

  function deleteColumn(pageId,path,columnsBlockId,colId){
    if(locked)return;
    setPages(prev=>prev.map(p=>{
      if(p.id!==pageId)return p;
      const container=getContainer(p.blocks,path);
      const idx=container.findIndex(b=>b.id===columnsBlockId);
      if(idx<0)return p;
      const columnsBlock=container[idx];
      if(columnsBlock.type!=="columns")return p;
      const remainingCols=(columnsBlock.cols||[]).filter(c=>c.id!==colId);
      let newBlocks;
      if(remainingCols.length<=1){
        const replacement=remainingCols.length===1
          ? (remainingCols[0].blocks.length?remainingCols[0].blocks:[newSimpleBlock()])
          : [newSimpleBlock()];
        newBlocks=updateContainer(p.blocks,path,arr=>{const c=[...arr];c.splice(idx,1,...replacement);return c;});
      } else {
        const widths=remainingCols.map(()=>100/remainingCols.length);
        newBlocks=updateContainer(p.blocks,path,arr=>arr.map(b=>b.id===columnsBlockId?{...b,cols:remainingCols,colWidths:widths}:b));
      }
      return {...p,blocks:newBlocks};
    }));
  }

  function changeBlockType(pageId,path,blockId,type){
    if(locked)return;
    const current=getContainer(pages.find(page=>page.id===pageId)?.blocks||[],path).find(block=>block.id===blockId);
    if(current?.type==="callout"&&type!=="callout"){
      let child=newBlock(type);
      if(type==="page")child={...child,pageRef:addPage(pageId,{navigate:false})};
      if(type==="database")child={...child,dbId:createDatabase("table")};
      if(type==="spreadsheet")child={...child,ssId:createSpreadsheet()};
      if(type==="columns")child={...child,cols:[{id:rid(),blocks:[newSimpleBlock()]},{id:rid(),blocks:[newSimpleBlock()]}],colWidths:[50,50]};
      updBlock(pageId,path,blockId,{text:"",children:[...(current.children||[]),child]});
      setSlashMenu(null);setPendingFocus({blockId:child.id});return;
    }
    if(type==="page"){const newId=addPage(pageId,{navigate:false});updBlock(pageId,path,blockId,{type:"page",text:"",pageRef:newId});setSlashMenu(null);return;}
    if(type==="database"){
      setViewPickerPending({pageId,path,blockId,isChange:true});
      setSlashMenu(null);
      return;
    }
        if(type==="spreadsheet"){const ssId=createSpreadsheet();updBlock(pageId,path,blockId,{type:"spreadsheet",text:"",ssId});setSlashMenu(null);return;}
    if(type==="columns"){
      // FIX: keyboard-Enter selection used to set {type:"columns"} with no
      // `cols` array at all, which crashed the columns renderer on the very
      // next paint. Give it real starter columns instead, same as the
      // mouse/ColumnPresetPicker path does.
      const cols=[{id:rid(),blocks:[newSimpleBlock()]},{id:rid(),blocks:[newSimpleBlock()]}];
      updBlock(pageId,path,blockId,{type:"columns",text:"",cols,colWidths:[50,50]});
      setSlashMenu(null);
      return;
    }
    updBlock(pageId,path,blockId,{type,text:""});setSlashMenu(null);setPendingFocus({blockId});
  }

  function commitViewPickerChange(viewType) {
    if(!viewPickerPending)return;
    const{pageId,path,blockId,index,isChange}=viewPickerPending;
    const dbId=createDatabase(viewType);
    if(isChange){
      updBlock(pageId,path,blockId,{type:"database",text:"",dbId});
    } else {
      const nb={...newBlock("database"),dbId};
      updBlocks(pageId,path,arr=>{const c=[...arr];c.splice(index+1,0,nb);return c;});
    }
    setViewPickerPending(null);
  }

  function handleInput(pageId,path,block,e){
    if(locked)return;
    const text=e.currentTarget.innerText;updBlock(pageId,path,block.id,{text});
    if(text.startsWith("/"))setSlashMenu({blockId:block.id,query:text.slice(1),index:0});
    else if(slashMenu?.blockId===block.id)setSlashMenu(null);
  }
  function handleKeyDown(pageId,path,block,index,e){
    if(locked)return;
    if(slashMenu?.blockId===block.id){
      const q=(slashMenu.query||"").trim().toLowerCase();
      const items=SLASH_ITEMS.filter(it=>!q||it.label.toLowerCase().includes(q)||it.kw.some(k=>k.includes(q)));
      if(e.key==="ArrowDown"){e.preventDefault();setSlashMenu(s=>({...s,index:Math.min(s.index+1,items.length-1)}));return;}
      if(e.key==="ArrowUp"){e.preventDefault();setSlashMenu(s=>({...s,index:Math.max(s.index-1,0)}));return;}
      if(e.key==="Enter"){e.preventDefault();const ch=items[slashMenu.index]||items[0];if(ch)changeBlockType(pageId,path,block.id,ch.type);return;}
      if(e.key==="Escape"){e.preventDefault();setSlashMenu(null);return;}
    }
    if(e.key==="Enter"&&e.shiftKey){
  e.preventDefault();
  const sel=window.getSelection();
  if(!sel.rangeCount)return;
  const range=sel.getRangeAt(0);
  range.deleteContents();
  const nl=document.createTextNode("\n");
  range.insertNode(nl);
  range.setStartAfter(nl);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  e.currentTarget.dispatchEvent(new Event("input", { bubbles: true })); // <-- add this line
  return;
}
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addBlockAfter(pageId,path,index,"paragraph");return;}
    if(e.key==="Backspace"){const txt=e.currentTarget.innerText.replace(/\u200B/g,"");if(!txt.length){e.preventDefault();deleteBlock(pageId,path,block.id);}}
  }
  function handleMedia(pageId,path,blockId,file){if(locked)return;const reader=new FileReader();reader.onload=()=>updBlock(pageId,path,blockId,{media:{dataUrl:reader.result,name:file.name,size:file.size}});reader.readAsDataURL(file);}
  function uploadIcon(e){const f=e.target.files[0];if(!f||locked)return;const r=new FileReader();r.onload=()=>{updatePage(activePage.id,{icon:{kind:"image",value:r.result}});setShowIconPick(false);};r.readAsDataURL(f);}
  function uploadCover(e){const f=e.target.files[0];if(!f||locked)return;const r=new FileReader();r.onload=()=>{updatePage(activePage.id,{cover:{kind:"image",value:r.result,positionY:50}});setShowCoverPick(false);};r.readAsDataURL(f);}
  function cvDown(e){if(!repositioning||activePage?.cover?.kind!=="image"||locked)return;cvDrag.current={active:true,startY:e.clientY,startPos:activePage.cover.positionY??50};}
  function cvMove(e){if(!cvDrag.current.active)return;const d=(e.clientY-cvDrag.current.startY)/200*100;const p=Math.max(0,Math.min(100,cvDrag.current.startPos-d));updatePage(activePage.id,{cover:{...activePage.cover,positionY:p}});}
  function cvUp(){cvDrag.current.active=false;}
  function breadcrumb(pageId){const chain=[];let cur=pages.find(p=>p.id===pageId);while(cur){chain.unshift(cur);cur=cur.parentId?pages.find(p=>p.id===cur.parentId):null;}return chain;}
  function registerRow(blockId,el,path,index,block){if(el)rowRegistry.current[blockId]={el,path,index,block};else delete rowRegistry.current[blockId];}

  function startBlockDrag(e,path,index,block){
  if(locked)return;
  e.preventDefault();
  const startX=e.clientX,startY=e.clientY;
  let activated=false;
  let rafId=null,lastEv=null;

  // Pure calculation — no state writes here, so we can call it
  // either from the throttled rAF loop OR synchronously on mouseup.
  function computeTargets(ev){
  let best=null,bestDist=Infinity;
  Object.values(rowRegistry.current).forEach(info=>{
    if(!info?.el)return;
    const rect=info.el.getBoundingClientRect();
    const midY=rect.top+rect.height/2;
    const dist=Math.abs(ev.clientY-midY);
    if(dist<bestDist){bestDist=dist;best={midY,path:info.path,index:info.index,block:info.block,rect};}
  });

  let overPath=null,overIndex=null;
  if(best){overPath=best.path;overIndex=ev.clientY>best.midY?best.index+1:best.index;}

  // Check EVERY individual column's own left/right edge (not just the
  // whole row's outer edges), so dropping between two columns, or right
  // next to any single column, creates a new column exactly there.
  let edgeColumn=null;
  if(best?.block?.type==="columns"){
    const rowEl=colRowRefs.current[best.block.id];
    if(rowEl){
      const rowRect=rowEl.getBoundingClientRect();
      const withinRow=ev.clientY>=rowRect.top&&ev.clientY<=rowRect.bottom;
      if(withinRow){
        const EDGE=28;
        const cols=best.block.cols||[];
        for(let ci=0;ci<cols.length;ci++){
          const cellEl=colCellRefs.current[cols[ci].id];
          if(!cellEl)continue;
          const cellRect=cellEl.getBoundingClientRect();
          if(ev.clientX>=cellRect.left&&ev.clientX<=cellRect.left+EDGE){
            edgeColumn={path:best.path,id:best.block.id,insertAt:ci};
            break;
          }
          if(ev.clientX>=cellRect.right-EDGE&&ev.clientX<=cellRect.right){
            edgeColumn={path:best.path,id:best.block.id,insertAt:ci+1};
            break;
          }
        }
      }
    }
  }

  return{
    overPath,
    overPathKey:overPath?JSON.stringify(overPath):null,
    overIndex,
    overColumn:edgeColumn,
  };
}

  function applyForEvent(ev){
    const targets=computeTargets(ev);
    setDragState(s=>({...s,x:ev.clientX,y:ev.clientY,...targets}));
  }

  function onMove(ev){
    if(!activated){
      if(Math.hypot(ev.clientX-startX,ev.clientY-startY)<5)return;
      activated=true;
      document.body.style.userSelect="none";
      setDragState({active:true,fromPath:path,fromPathKey:JSON.stringify(path),fromIndex:index,blockId:block.id,blockText:(block.text||block.type||"").slice(0,60),x:ev.clientX,y:ev.clientY,overPath:null,overPathKey:null,overIndex:null,overColumn:null});
      return;
    }
    lastEv=ev;
    if(rafId==null)rafId=requestAnimationFrame(()=>{rafId=null;if(lastEv)applyForEvent(lastEv);});
  }

  function onUp(upEv){
    if(rafId!=null){cancelAnimationFrame(rafId);rafId=null;}
    window.removeEventListener("mousemove",onMove);
    window.removeEventListener("mouseup",onUp);
    document.body.style.userSelect="";

    setDragState(s=>{
      const reset={active:false,fromPath:null,fromPathKey:null,fromIndex:null,blockId:null,blockText:"",x:0,y:0,overPath:null,overPathKey:null,overIndex:null,overColumn:null};
      if(!s.active)return reset;

      // Recompute one last time using the ACTUAL mouseup position,
      // instead of trusting whatever rAF frame last landed.
      const targets=activated?computeTargets(upEv):{overPath:s.overPath,overIndex:s.overIndex,overColumn:s.overColumn};
      const{overColumn,overPath,overIndex}=targets;

      if(overColumn){
        moveBlockToNewColumn(activePage.id,s.fromPath,s.fromIndex,overColumn.path,overColumn.id,overColumn.insertAt);
      }else if(overPath){
        const samePath=s.fromPathKey===JSON.stringify(overPath);
        let toIndex=overIndex;
        if(samePath){
          if(toIndex>s.fromIndex)toIndex-=1;
          if(toIndex!==s.fromIndex)moveBlock(activePage.id,s.fromPath,s.fromIndex,toIndex);
        }else{
          moveBlockAcross(activePage.id,s.fromPath,s.fromIndex,overPath,toIndex);
        }
      }
      return reset;
    });
  }

  window.addEventListener("mousemove",onMove);
  window.addEventListener("mouseup",onUp);
}

    function startSelection(e){
  if(e.button!==2)return;
  e.preventDefault();
    if(e.target.closest("button,input,a,select,textarea")){
    if(selectedIds.size)setSelectedIds(new Set());
    return;
  }
  const startX=e.clientX,startY=e.clientY;let moved=false;
  let rafId=null,lastEv=null;
  function computeAndApply(){
    rafId=null;
    if(!lastEv)return;
    const ev=lastEv;
    setSelectionRect({x1:startX,y1:startY,x2:ev.clientX,y2:ev.clientY});
    const rx1=Math.min(startX,ev.clientX),rx2=Math.max(startX,ev.clientX),ry1=Math.min(startY,ev.clientY),ry2=Math.max(startY,ev.clientY);
    const sel=new Set();
    Object.entries(rowRegistry.current).forEach(([bId,info])=>{if(!info?.el)return;const r=info.el.getBoundingClientRect();if(r.left<rx2&&r.right>rx1&&r.top<ry2&&r.bottom>ry1)sel.add(bId);});
    setSelectedIds(sel);
  }
  function onMove(ev){
    if(!moved&&Math.hypot(ev.clientX-startX,ev.clientY-startY)>4)moved=true;
    if(!moved)return;
    lastEv=ev;
    if(rafId==null)rafId=requestAnimationFrame(computeAndApply);
  }
  function onUp(ev){
    if(ev.button!==2)return;
    if(rafId!=null)cancelAnimationFrame(rafId);
    window.removeEventListener("mousemove",onMove);
    window.removeEventListener("mouseup",onUp);
    setSelectionRect(null);
    if(!moved)setSelectedIds(new Set());
  }
  window.addEventListener("mousemove",onMove);
  window.addEventListener("mouseup",onUp);
}
  

  function deleteSelectedBlocks(){
    if(!selectedIds.size||!activePage)return;
    setPages(prev=>prev.map(p=>{
      if(p.id!==activePage.id)return p;
      const groups={};
      selectedIds.forEach(bId=>{const info=rowRegistry.current[bId];if(!info)return;const key=JSON.stringify(info.path);if(!groups[key])groups[key]={path:info.path,ids:new Set()};groups[key].ids.add(bId);});
      let blocks=p.blocks;
      Object.values(groups).forEach(g=>{blocks=updateContainer(blocks,g.path,arr=>{const filtered=arr.filter(b=>!g.ids.has(b.id));return filtered.length?filtered:[newSimpleBlock()];});});
      return{...p,blocks};
    }));
    setSelectedIds(new Set());
  }

  function selectedBlockPayload(){
    if(!selectedIds.size||!activePage)return [];
    const entries=[];
    selectedIds.forEach(blockId=>{
      const info=rowRegistry.current[blockId];
      if(!info)return;
      const container=getContainer(activePage.blocks,info.path);
      const block=container.find(item=>item.id===blockId);
      if(block)entries.push({index:info.index,block});
    });
    return entries.sort((a,b)=>a.index-b.index).map(entry=>entry.block);
  }

  function copySelectedBlocks(){
    const blocks=selectedBlockPayload();
    if(!blocks.length)return;
    const payload=`ERIS_BLOCKS:${JSON.stringify(blocks)}`;
    navigator.clipboard?.writeText(payload).catch(()=>{});
    blockClipboardRef.current=blocks;
  }

  function copyBlock(block){
    const blocks=[block];
    blockClipboardRef.current=blocks;
    navigator.clipboard?.writeText(`ERIS_BLOCKS:${JSON.stringify(blocks)}`).catch(()=>{});
  }

  function cutBlock(path,blockId){
    const container=getContainer(activePage?.blocks||[],path);
    const block=container.find(item=>item.id===blockId);
    if(!block)return;
    copyBlock(block);
    deleteBlock(activePage.id,path,blockId,true);
  }

  function duplicateBlock(path,index,block){
    const cloned=cloneBlockTree([block]);
    updBlocks(activePage.id,path,container=>{const next=[...container];next.splice(index+1,0,...cloned);return next;});
    setSelectedIds(new Set(cloned.map(item=>item.id)));
  }

  function copyLink(block){navigator.clipboard?.writeText(`${window.location.href.split("#")[0]}#block-${block.id}`).catch(()=>{});}

function copyPageLink(page){
  navigator.clipboard?.writeText(`${window.location.href.split("#")[0]}#page-${page.id}`)
    .then(()=>console.log("copied!"))
    .catch(err=>console.error("copy failed:", err));
}

  function pasteBlock(path,index){
    if(!blockClipboardRef.current.length)return;
    const cloned=cloneBlockTree(blockClipboardRef.current);
    updBlocks(activePage.id,path,container=>{const next=[...container];next.splice(index+1,0,...cloned);return next;});
    setSelectedIds(new Set(cloned.map(item=>item.id)));
  }

  async function pasteBlocks(){
    let blocks=blockClipboardRef.current;
    try{
      const text=await navigator.clipboard.readText();
      if(text.startsWith("ERIS_BLOCKS:"))blocks=JSON.parse(text.slice("ERIS_BLOCKS:".length));
    }catch{}
    if(!blocks?.length||!activePage)return;
    const cloned=cloneBlockTree(blocks);
    const selectedInfo=[...selectedIds].map(id=>rowRegistry.current[id]).filter(Boolean)[0];
    const path=selectedInfo?.path||[];
    const insertIndex=selectedInfo?selectedInfo.index+1:getContainer(activePage.blocks,path).length;
    updBlocks(activePage.id,path,container=>{const next=[...container];next.splice(insertIndex,0,...cloned);return next;});
    setSelectedIds(new Set(cloned.map(block=>block.id)));
  }

  function selectAllBlocks(){
    setSelectedIds(new Set(Object.keys(rowRegistry.current)));
  }

  function PageItem({pageId,depth}){
    const page=pages.find(p=>p.id===pageId);if(!page)return null;
    const children=pages.filter(p=>p.parentId===pageId);
    const open=expanded.has(pageId),active=activePageId===pageId;
    return(
      <div>
        <div onClick={()=>setActivePageId(pageId)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 6px",paddingLeft:8+depth*16,borderRadius:6,cursor:"pointer",background:active?C.border:"transparent",fontSize:13.5,userSelect:"none",transition:"background 0.08s"}}>
          <span onClick={e=>{e.stopPropagation();if(children.length)setExpanded(prev=>{const s=new Set(prev);s.has(pageId)?s.delete(pageId):s.add(pageId);return s;});}} style={{width:14,display:"flex",color:C.muted}}>{children.length?(open?<ChevronDown size={12}/>:<ChevronRight size={12}/>):null}</span>
          <RenderIcon icon={page.icon} size={15}/>
          <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{page.title||"Untitled"}</span>
          {page.locked&&<Lock size={10} style={{color:C.muted}}/>}
          <span onClick={e=>{e.stopPropagation();addPage(pageId);}} style={{opacity:0.5,cursor:"pointer",display:"flex"}}><Plus size={13}/></span>
          <span onClick={e=>{e.stopPropagation();setTrashTarget(pageId);}} style={{opacity:0.5,cursor:"pointer",display:"flex"}}><Trash2 size={13}/></span>
        </div>
        {open&&children.map(c=><PageItem key={c.id} pageId={c.id} depth={depth+1}/>)}
      </div>
    );
  }

  const roots=pages.filter(p=>!p.parentId);
  const ownRoots = roots.filter(p=>!p.isShared);
  const sharedRoots = roots.filter(p=>p.isShared);
  const sharedBL={
    rootBlocks:activePage?.blocks||[],colors:C,darkMode,pages,blockRefs,colRowRefs,colCellRefs,
    slashMenu,setSlashMenu,calloutPicker,setCalloutPicker,
    onInput:(path,block,e)=>handleInput(activePage.id,path,block,e),
    onKeyDown:(path,block,idx,e)=>handleKeyDown(activePage.id,path,block,idx,e),
    onUpdateBlock:(path,bId,ch)=>updBlock(activePage.id,path,bId,ch),
    onAddBlockAfter:(path,idx,t)=>addBlockAfter(activePage.id,path,idx,t),
    onDeleteBlock:(path,bId)=>deleteBlock(activePage.id,path,bId),
    onMoveBlock:(path,from,to)=>moveBlock(activePage.id,path,from,to),
    onChangeBlockType:(path,bId,t)=>changeBlockType(activePage.id,path,bId,t),
    onMediaUpload:(path,bId,file)=>handleMedia(activePage.id,path,bId,file),
    onNavigatePage:id=>setActivePageId(id),
    setPendingFocus,dragState,registerRow,onDragHandleDown:startBlockDrag,selectedIds,locked,
    allDatabases:databases,onUpdateDb:updateDatabase,
    onDeleteDatabase:(dbId)=>setDatabases(prev=>{const next={...prev};delete next[dbId];return next;}),
    allSpreadsheets:spreadsheets,onUpdateSs:updateSpreadsheet,
    onCopyBlock:copyBlock,onCutBlock:cutBlock,onDuplicateBlock:duplicateBlock,onPasteBlock:pasteBlock,
    onTurnIntoBlock:(path,blockId,type)=>updBlock(activePage.id,path,blockId,{type}),onCopyLink:copyLink,
    onSelectionChange:handleSelectionChange,                                                    // ADD
    onDeleteColumn:(path,columnsId,colId)=>deleteColumn(activePage.id,path,columnsId,colId), // ADD
  };
  
  const headings = useMemo(
  () => activePage ? collectHeadings(activePage.blocks) : [],
  [activePage]
);

  return(
    <div style={{display:"flex",height:"100vh",width:"100vw",background:C.bg,color:C.text,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",overflow:"hidden"}}>
      <style>{`
       @import url('https://fonts.googleapis.com/css2?family=Google+Sans+Flex&family=Oswald:wght@400;600;700&family=Roboto+Slab:wght@400;600;700&family=Comic+Relief&family=DM+Serif+Display&family=Caveat:wght@400;600&family=Noto+Serif:wght@400;600;700&family=Playpen+Sans+Arabic:wght@400;600;700&family=Zain:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes menuSlideIn{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}
        @keyframes dropLineIn{from{transform:scaleX(0.85);opacity:0;}to{transform:scaleX(1);opacity:1;}}
        [data-placeholder]:empty::before{content:attr(data-placeholder);color:#aaa;pointer-events:none;position:absolute;top:0;left:0;}
        [contenteditable]{position:relative;}
        *{box-sizing:border-box;}
        .embed-actions { pointer-events: all !important; }
        .link-actions  { pointer-events: all !important; }
        html{scroll-behavior:smooth;}
        blockquote.twitter-tweet {
        margin: 0 !important;
        padding: 12px 16px !important;
        border-left: 3px solid #1d9bf0 !important;
        background: transparent !important;
      }
        blockquote.twitter-tweet p {
          font-size: 15px !important;
          line-height: 1.4 !important;
        }
        blockquote.twitter-tweet a {
          color: #1d9bf0 !important;
          text-decoration: none !important;
        }
          [data-page-theme="pink"][data-mode="light"]   { --page-accent: #9e3345; --page-tint: #FFD1D1; }
          [data-page-theme="pink"][data-mode="dark"]    { --page-accent: #FFD1D1; --page-tint: #9e3345; }

          [data-page-theme="tan"][data-mode="light"]    { --page-accent: #6F4D38; --page-tint: #D1A992; }
          [data-page-theme="tan"][data-mode="dark"]     { --page-accent: #D1A992; --page-tint: #6F4D38; }

          [data-page-theme="cream"][data-mode="light"]  { --page-accent: #4F271D; --page-tint: #F5E7BF; }
          [data-page-theme="cream"][data-mode="dark"]   { --page-accent: #F5E7BF; --page-tint: #4F271D; }

          [data-page-theme="purple"][data-mode="light"] { --page-accent: #2b2238; --page-tint: #CDBFE3; }
          [data-page-theme="purple"][data-mode="dark"]  { --page-accent: #CDBFE3; --page-tint: #2b2238; }

          [data-page-theme="blue"][data-mode="light"]   { --page-accent: #222f42; --page-tint: #B9E0EB; }
          [data-page-theme="blue"][data-mode="dark"]    { --page-accent: #B9E0EB; --page-tint: #222f42; }

          [data-page-theme="green"][data-mode="light"]  { --page-accent: #2e4f31; --page-tint: #D6EDBB; }
          [data-page-theme="green"][data-mode="dark"]   { --page-accent: #D6EDBB; --page-tint: #2e4f31; }

          [data-page-theme="gray"]                      { --page-accent: #808080; --page-tint: #808080; }

          [data-page-theme="default"][data-mode="light"]{ --page-accent: #191919; --page-tint: #FFFFFF; }
          [data-page-theme="default"][data-mode="dark"] { --page-accent: #FFFFFF; --page-tint: #191919; }

          [data-page-theme="forestgreen"][data-mode="light"]{ --page-accent: #485E3A; --page-tint: #D6F0BB; }
          [data-page-theme="forestgreen"][data-mode="dark"] { --page-accent: #D6F0BB; --page-tint: #485E3A; }

          [data-page-theme="teal"][data-mode="light"]{ --page-accent: #3B6E5E; --page-tint: #C0EDE0; }
          [data-page-theme="teal"][data-mode="dark"] { --page-accent: #C0EDE0; --page-tint: #3B6E5E; }
          
      `}</style>
      {dragState.active&&<DragPreview text={dragState.blockText} x={dragState.x} y={dragState.y} dark={darkMode}/>}
      {selection&&<SelectionToolbar rect={selection.rect} onFormat={applyMarkToSelection} darkMode={darkMode}/>}
       {activePage && (
  <PageOutline
    headings={headings}
    colors={C}
    scrollContainerRef={scrollContainerRef}
    onJump={id => {
      document.getElementById(`block-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }}
  />
)}
      {trashTarget&&<TrashModal colors={C} title={pages.find(p=>p.id===trashTarget)?.title} onConfirm={()=>{movePageToTrash(trashTarget);setTrashTarget(null);}} onCancel={()=>setTrashTarget(null)}/>} 
      {viewPickerPending&&<ViewPickerModal colors={C} onPick={commitViewPickerChange} onCancel={()=>setViewPickerPending(null)}/>}
      {showAnnouncement&&<AnnouncementModal colors={C} onClose={()=>setShowAnnouncement(false)}/>}
      {showAuthModal&&<AuthModal colors={C} mode={authMode} setMode={setAuthMode} email={authEmail} setEmail={setAuthEmail} password={authPassword} setPassword={setAuthPassword} confirmPassword={authConfirmPassword} setConfirmPassword={setAuthConfirmPassword} username={authUsername} setUsername={setAuthUsername} avatar={authAvatar} setAvatar={setAuthAvatar} showAvatarPicker={showAuthAvatarPicker} setShowAvatarPicker={setShowAuthAvatarPicker} error={authError} onSubmit={handleAuthSubmit} onClose={()=>setShowAuthModal(false)}/>}
      {showSettingsModal&&<SettingsModal colors={C} username={settingsUsername} setUsername={setSettingsUsername} email={settingsEmail} setEmail={setSettingsEmail} avatar={settingsAvatar} setAvatar={setSettingsAvatar} showAvatarPicker={showSettingsAvatarPicker} setShowAvatarPicker={setShowSettingsAvatarPicker} error={settingsError} success={settingsSuccess} onSave={handleSettingsSave} onClose={()=>setShowSettingsModal(false)}/>}
      {selectionRect&&(<div style={{position:"fixed",zIndex:9998,pointerEvents:"none",left:Math.min(selectionRect.x1,selectionRect.x2),top:Math.min(selectionRect.y1,selectionRect.y2),width:Math.abs(selectionRect.x2-selectionRect.x1),height:Math.abs(selectionRect.y2-selectionRect.y1),background:"rgba(35,131,226,0.08)",border:"1px solid rgba(35,131,226,0.5)",borderRadius:3,transition:"background 0.1s ease"}}/>)}
      {showShareModal&&<ShareModal colors={C} email={shareEmail} setEmail={setShareEmail} error={shareError} success={shareSuccess} onSubmit={submitShareByEmail} onClose={()=>setShowShareModal(false)}/>}
      <div style={{width:sidebarOpen?"240px":"0px",overflow:"hidden",background:C.sidebar,borderRight:sidebarOpen?`1px solid ${C.border}`:"none",transition:"width 0.18s cubic-bezier(.4,0,.2,1)",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:16,flex:1,overflowY:"auto",minWidth:240}}>
          <div onClick={()=>setActivePageId("HOME")} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",borderRadius:6,cursor:"pointer",background:activePageId==="HOME"?C.border:"transparent",fontSize:13.5,fontWeight:600,marginBottom:10,userSelect:"none"}}>
  <Home size={15}/>
  <span>Home</span>
</div>
          <button onClick={()=>addPage(null)} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",color:C.muted,cursor:"pointer",padding:"6px 4px",fontSize:14,marginBottom:8}}>+ New page</button>
          {ownRoots.map(p=><PageItem key={p.id} pageId={p.id} depth={0}/>)}

{sharedRoots.length>0 && (
  <>
    <div style={{fontSize:11,fontWeight:600,color:C.muted,padding:"14px 8px 4px",textTransform:"uppercase",letterSpacing:0.5}}>Shared with me</div>
    {sharedRoots.map(p=><PageItem key={p.id} pageId={p.id} depth={0}/>)}
  </>
)}
          <TrashPanel trash={trash} colors={C} onRestore={restorePage} onDeletePermanent={deletePermanent}/>
        </div>
      </div>

        <div 
            data-page-theme={activePage?getPageColor(activePage):"default"} 
            data-mode={darkMode?"dark":"light"} 
               style={{
                flex:1,display:"flex",flexDirection:"column",minWidth:0,
                fontFamily: activePage?.font 
                 ? FONT_OPTIONS.find(f=>f.id===activePage.font)?.family 
                 : "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
                      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setSidebarOpen(v=>!v)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:16,color:C.text}}>☰</button>
            <span style={{fontFamily:"'Times New Roman',serif",fontWeight:"bold",fontSize:18}}>ERIS</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {locked&&<div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:6,background:C.surface,border:`1px solid ${C.border}`,fontSize:12,color:C.muted}}><Lock size={12}/>Read only</div>}
            {user?(
  <div style={{position:"relative"}} data-picker="usermenu">
    <div onClick={()=>setShowUserMenu(v=>!v)} style={{width:30,height:30,borderRadius:"50%",background:C.surface,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
      {profile?.avatar?<RenderIcon icon={profile.avatar} size={18}/>:<span style={{fontSize:13}}>{(profile?.username||user.email||"?")[0].toUpperCase()}</span>}
    </div>
    {showUserMenu&&(
      <div style={{position:"absolute",top:"110%",right:0,minWidth:180,background:C.sidebar,border:`1px solid ${C.border}`,borderRadius:8,padding:8,zIndex:60,boxShadow:"0 8px 24px rgba(0,0,0,0.15)"}}>
        <div style={{padding:"4px 6px",fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile?.username||"User"}</div>
        <div style={{padding:"0 6px 8px",fontSize:12,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
        <button onClick={openSettings} style={{display:"block",width:"100%",padding:"7px 6px",border:"none",background:"transparent",textAlign:"left",color:C.text,cursor:"pointer",fontSize:13,borderRadius:4}}>Settings</button>
<div style={{height:1,background:C.border,margin:"4px 0"}}/>
<button onClick={()=>{logOut();setShowUserMenu(false);}} style={{display:"block",width:"100%",padding:"7px 6px",border:"none",background:"transparent",textAlign:"left",color:"#e03",cursor:"pointer",fontSize:13,borderRadius:4}}>Sign out</button>
      </div>
    )}
  </div>
):(
  <button onClick={()=>setShowAuthModal(true)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 10px",cursor:"pointer",color:C.text,fontSize:13}}>Sign in</button>
)}

{activePage && activePageId!=="HOME" && user && (!activePage.isShared||activePage.ownerId===user.uid) && (
  <button onClick={()=>{setShareEmail("");setShareError("");setShareSuccess("");setShowShareModal(true);}}
    style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 10px",cursor:"pointer",color:C.text,fontSize:13}}>
    Share
  </button>
)}

              <ImportExportMenu colors={C} activePage={activePage} importStatus={importStatus}
              onImportFile={handleImportNotionFile}
              onExportHtml={()=>activePage&&exportPageAsHtml(activePage,databases,spreadsheets)}
              onExportPdf={()=>activePage&&exportPageAsPdf(activePage,databases,spreadsheets)}
              onExportZip={()=>activePage&&exportPageAsZip(activePage,pages,databases,spreadsheets)}/>
            <PageOptionsMenu colors={C} darkMode={darkMode} setDarkMode={setDarkMode} activePage={activePage} updatePage={updatePage} onTrash={()=>activePage&&setTrashTarget(activePage.id)} fullWidth={fullWidth} setFullWidth={setFullWidth} onDuplicate={()=>activePage&&duplicatePage(activePage)} onUndo={undo} onRedo={redo} onSelectAll={selectAllBlocks} canUndo={historyRef.current.past.length>0} canRedo={historyRef.current.future.length>0} onCopyPageLink={()=>activePage&&copyPageLink(activePage)} onSharePage={handleSharePageByEmail}/>
          </div>
        </div>
        <div ref={scrollContainerRef} style={{flex:1,overflowY:"auto",background:"var(--page-tint)"}}>
          {activePageId==="HOME"&&(
            <HomePage pages={pages} colors={C} onOpenPage={setActivePageId} onNewPage={()=>addPage(null)}/>
          )}
          {activePage&&(
            <>
              {activePage.cover&&(
                <div onMouseDown={cvDown} onMouseMove={cvMove} onMouseUp={cvUp} onMouseLeave={cvUp} style={{height:200,overflow:"hidden",userSelect:"none",cursor:repositioning&&activePage.cover.kind==="image"?"ns-resize":"default",background:activePage.cover.kind==="image"?`url(${activePage.cover.value}) center ${activePage.cover.positionY??50}%/cover no-repeat`:activePage.cover.value}}>
                  {!locked&&(
                    <div style={{display:"flex",gap:6,justifyContent:"flex-end",padding:12}}>
                      {activePage.cover.kind==="image"&&<button onClick={()=>setRepositioning(v=>!v)} style={{background:"rgba(255,255,255,0.88)",border:"none",borderRadius:6,padding:"5px 10px",fontSize:12,cursor:"pointer"}}>{repositioning?"Done":"Reposition"}</button>}
                      <button data-picker="cover" onClick={()=>setShowCoverPick(v=>!v)} style={{background:"rgba(255,255,255,0.88)",border:"none",borderRadius:6,padding:"5px 10px",fontSize:12,cursor:"pointer"}}>Change cover</button>
                      <button onClick={()=>{updatePage(activePage.id,{cover:null});setShowCoverPick(false);}} style={{background:"rgba(255,255,255,0.88)",border:"none",borderRadius:6,padding:"5px 10px",fontSize:12,cursor:"pointer",color:"#c00"}}>Remove</button>
                    </div>
                  )}
                </div>
              )}
                                
              {showCoverPick&&!locked&&(
                <div data-picker="cover" style={{position:"fixed",top:activePage.cover?214:64,right:16,width:300,background:C.sidebar,border:`1px solid ${C.border}`,borderRadius:8,padding:12,zIndex:40,boxShadow:"0 8px 24px rgba(0,0,0,0.15)"}}>
                  <div style={{display:"flex",gap:6,marginBottom:10}}>{["color","upload"].map(t=><button key={t} onClick={()=>setCoverTab(t)} style={{flex:1,padding:6,borderRadius:6,border:"none",cursor:"pointer",background:coverTab===t?C.border:"transparent",color:C.text,fontSize:13}}>{t==="color"?"Color":"Upload image"}</button>)}</div>
                  {coverTab==="color"?<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{COVER_COLORS.map(col=><div key={col} onClick={()=>{updatePage(activePage.id,{cover:{kind:"color",value:col}});setShowCoverPick(false);}} style={{width:36,height:36,borderRadius:6,background:col,cursor:"pointer",border:`2px solid ${C.border}`}}/>)}</div>:<input type="file" accept="image/*" onChange={uploadCover} style={{fontSize:13,color:C.text}}/>}
                </div>
              )}
              <div style={{padding:`0 ${fullWidth?"32px":"60px"} 120px`,maxWidth:fullWidth?"100%":860,margin:"0 auto",transition:"max-width 0.2s ease,padding 0.2s ease"}}>
                {!activePage.cover&&!locked&&(<div style={{marginTop:16}}><button data-picker="cover" onClick={()=>setShowCoverPick(v=>!v)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:13,padding:0}}>+ Add cover</button></div>)}
                {breadcrumb(activePage.id).length>1 && (
  <div style={{fontSize:13,color:C.muted,marginTop:12,display:"flex",flexWrap:"wrap",gap:4}}>
    {breadcrumb(activePage.id).map((p,i,arr)=>(<span key={p.id} style={{display:"flex",alignItems:"center",gap:4}}><span onClick={()=>setActivePageId(p.id)} style={{cursor:"pointer",color:i===arr.length-1?C.text:C.muted}}>{p.title||"Untitled"}</span>{i<arr.length-1&&<span style={{color:C.muted}}>/</span>}</span>))}
  </div>
)}
                <div style={{marginTop:activePage.cover?"-28px":"16px",position:"relative",display:"inline-block"}} data-picker="icon">
                  <div onClick={()=>!locked&&setShowIconPick(v=>!v)} style={{cursor:locked?"default":"pointer",display:"inline-flex",userSelect:"none"}}><RenderIcon icon={activePage.icon} size={96}/></div>
                  {showIconPick&&!locked&&(
                    <div data-picker="icon" style={{position:"absolute",top:96,left:0,width:340,background:C.sidebar,border:`1px solid ${C.border}`,borderRadius:8,padding:12,zIndex:40,boxShadow:"0 8px 24px rgba(0,0,0,0.15)"}}>
                      <div style={{display:"flex",gap:6,marginBottom:10}}>{["emoji","icons","upload"].map(t=><button key={t} onClick={()=>setPickerTab(t)} style={{flex:1,padding:6,borderRadius:6,border:"none",cursor:"pointer",background:pickerTab===t?C.border:"transparent",color:C.text,fontSize:12}}>{t==="emoji"?"Emoji":t==="icons"?"Icons":"Upload"}</button>)}</div>
                      {pickerTab==="emoji"&&<div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:4}}>{QUICK_EMOJIS.map(em=><span key={em} onClick={()=>{updatePage(activePage.id,{icon:{kind:"emoji",value:em}});setShowIconPick(false);}} style={{fontSize:22,cursor:"pointer",textAlign:"center",padding:4,borderRadius:6}}>{em}</span>)}</div>}
                      {pickerTab==="icons"&&(<><div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>{ICON_COLORS.map(col=><div key={col} onClick={()=>setSelColor(col)} style={{width:20,height:20,borderRadius:"50%",background:col,cursor:"pointer",border:selColor===col?`2px solid ${C.text}`:`1px solid ${C.border}`}}/>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:6,maxHeight:220,overflowY:"auto"}}>{ICON_NAMES.map(name=>{const Comp=ICON_LIBRARY[name];return<div key={name} onClick={()=>{updatePage(activePage.id,{icon:{kind:"icon",value:name,color:selColor}});setShowIconPick(false);}} style={{display:"flex",alignItems:"center",justifyContent:"center",padding:6,borderRadius:6,cursor:"pointer"}} title={name}><Comp size={18} color={selColor}/></div>;})}</div></>)}
                      {pickerTab==="upload"&&<input type="file" accept="image/*" onChange={uploadIcon} style={{fontSize:13,color:C.text}}/>}
                    </div>
                  )}
                </div>
                <div contentEditable={!locked} suppressContentEditableWarning data-placeholder={locked?undefined:"Untitled"} onInput={locked?undefined:e=>updatePage(activePage.id,{title:e.currentTarget.innerText})} onKeyDown={locked?undefined:e=>{if(e.key==="Enter"){e.preventDefault();blockRefs.current[activePage.blocks[0]?.id]?.focus();}}} ref={el=>{if(!el)return;if(el.dataset.forPage!==activePage.id){el.innerText=activePage.title||"";el.dataset.forPage=activePage.id;}}} style={{outline:"none",fontSize:40,fontWeight:700,margin:"10px 0 20px",direction:"ltr",whiteSpace:"pre-wrap",wordBreak:"break-word",minHeight:54,position:"relative",cursor:locked?"default":"text",}}/>
                {locked&&(<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:8,background:C.surface,border:`1px solid ${C.border}`,marginBottom:16,fontSize:13,color:C.muted}}><Lock size={14}/>This page is locked. Click ··· to unlock.</div>)}
                <div onMouseDown={startSelection} onContextMenu={e=>e.preventDefault()}>
  <BlockList path={[]} blocks={activePage.blocks} 
{...sharedBL}/>
</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export { MiniPageEditor };
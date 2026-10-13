import { useState, useRef, useEffect } from "react";

import {
  Plus,
  MoreVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sigma,
} from "lucide-react";

import {
  rid,
  displayCell,
  colLabel,
} from "../../utils/data";

function SpreadsheetBlock({block,colors,locked,allSpreadsheets,onUpdateSs}) {
  const ss=allSpreadsheets[block.ssId];
  const[sel,setSel]=useState(null);
  const[selRange,setSelRange]=useState(null);
  const[editing,setEditing]=useState(null);
  const[editVal,setEditVal]=useState("");
  const[formulaBar,setFormulaBar]=useState("");
  const[colMenu,setColMenu]=useState(null);
  const[rowMenu,setRowMenu]=useState(null);
  const[mouseDown,setMouseDown]=useState(false);
  const[editingName,setEditingName]=useState(false);
  const inputRef=useRef(null);
  useEffect(()=>{if(inputRef.current&&editing)inputRef.current.focus();},[editing]);
  if(!ss)return<div style={{padding:12,color:colors.muted,fontSize:13}}>Spreadsheet not found.</div>;
  function upSs(changes){onUpdateSs(block.ssId,{...ss,...changes});}
  function getCellRaw(ri,ci){return ss.data[ri]?.cells[ss.columns[ci]?.id]??"";}
  function getCellDisplay(ri,ci){return displayCell(getCellRaw(ri,ci),ss.data,ss.columns);}
  function upCell(ri,ci,val){const col=ss.columns[ci];const newData=ss.data.map((row,r)=>r!==ri?row:{...row,cells:{...row.cells,[col.id]:val}});upSs({data:newData});}
  function selectCell(ri,ci){setSel({ri,ci});setSelRange(null);setFormulaBar(getCellRaw(ri,ci)??"");}
  function startEdit(ri,ci){if(locked)return;const raw=getCellRaw(ri,ci);setEditing({ri,ci});setEditVal(raw??"");setSel({ri,ci});setFormulaBar(raw??"");}
  function commitEdit(ri,ci,val){upCell(ri,ci,val??editVal);setEditing(null);}
  function handleCellKeyDown(e,ri,ci){
    if(e.key==="Escape"){setEditing(null);return;}
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();commitEdit(ri,ci);selectCell(Math.min(ri+1,ss.data.length-1),ci);return;}
    if(e.key==="Tab"){e.preventDefault();commitEdit(ri,ci);e.shiftKey?selectCell(ri,Math.max(ci-1,0)):selectCell(ri,Math.min(ci+1,ss.columns.length-1));return;}
    if(!editing){
      if(e.key==="ArrowDown"){e.preventDefault();selectCell(Math.min(ri+1,ss.data.length-1),ci);return;}
      if(e.key==="ArrowUp"){e.preventDefault();selectCell(Math.max(ri-1,0),ci);return;}
      if(e.key==="ArrowRight"){e.preventDefault();selectCell(ri,Math.min(ci+1,ss.columns.length-1));return;}
      if(e.key==="ArrowLeft"){e.preventDefault();selectCell(ri,Math.max(ci-1,0));return;}
      if((e.key==="Delete"||e.key==="Backspace")&&!editing){e.preventDefault();upCell(ri,ci,"");return;}
      if(e.key==="F2"){e.preventDefault();startEdit(ri,ci);return;}
    }
  }
  function handleCellClick(e,ri,ci){if(e.shiftKey&&sel){setSelRange({r1:Math.min(sel.ri,ri),c1:Math.min(sel.ci,ci),r2:Math.max(sel.ri,ri),c2:Math.max(sel.ci,ci)});return;}selectCell(ri,ci);}
  function inRange(ri,ci){if(!selRange)return false;return ri>=selRange.r1&&ri<=selRange.r2&&ci>=selRange.c1&&ci<=selRange.c2;}
  function isSelected(ri,ci){return sel&&sel.ri===ri&&sel.ci===ci;}
  function startColResize(e,ci){
    if(locked)return;e.preventDefault();e.stopPropagation();
    const startX=e.clientX,startW=ss.columns[ci].width||120;
    document.body.style.userSelect="none";
    function move(ev){const newW=Math.max(60,startW+(ev.clientX-startX));upSs({columns:ss.columns.map((c,i)=>i===ci?{...c,width:newW}:c)});}
    function up(){document.body.style.userSelect="";window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);}
    window.addEventListener("mousemove",move);window.addEventListener("mouseup",up);
  }
  function addRow(afterRi){const newRow={id:rid(),cells:Object.fromEntries(ss.columns.map(c=>[c.id,""]))};const nd=[...ss.data];nd.splice(afterRi+1,0,newRow);upSs({data:nd});}
  function deleteRow(ri){if(ss.data.length<=1)return;upSs({data:ss.data.filter((_,i)=>i!==ri)});setSel(null);}
  function addCol(afterCi){const nc={id:rid(),width:120,align:"left",type:"text",name:""};const newCols=[...ss.columns];newCols.splice(afterCi+1,0,nc);const newData=ss.data.map(row=>({...row,cells:{...row.cells,[nc.id]:""}}));upSs({columns:newCols,data:newData});}
  function deleteCol(ci){if(ss.columns.length<=1)return;const col=ss.columns[ci];const newCols=ss.columns.filter((_,i)=>i!==ci);const newData=ss.data.map(row=>{const c={...row.cells};delete c[col.id];return{...row,cells:c};});upSs({columns:newCols,data:newData});setSel(null);}
  function setColAlign(ci,align){upSs({columns:ss.columns.map((c,i)=>i===ci?{...c,align}:c)});}
  function setColName(ci,name){upSs({columns:ss.columns.map((c,i)=>i===ci?{...c,name}:c)});}
  function copySelection(){if(!sel)return;if(selRange){const rows=[];for(let r=selRange.r1;r<=selRange.r2;r++){const row=[];for(let c=selRange.c1;c<=selRange.c2;c++)row.push(getCellDisplay(r,c));rows.push(row.join("\t"));}navigator.clipboard.writeText(rows.join("\n")).catch(()=>{});}else navigator.clipboard.writeText(getCellDisplay(sel.ri,sel.ci)).catch(()=>{});}
  const ROW_H=34,HEADER_H=36,ROW_NUM_W=48;
  return(
    <div style={{border:`1px solid ${colors.border}`,borderRadius:10,overflow:"hidden",marginBottom:4,background:colors.bg}} tabIndex={0}
      onKeyDown={e=>{
        if((e.ctrlKey||e.metaKey)&&e.key==="c"){e.preventDefault();copySelection();return;}
        if(sel&&!editing){
          handleCellKeyDown(e,sel.ri,sel.ci);
          if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!locked){startEdit(sel.ri,sel.ci);setEditVal(e.key);setFormulaBar(e.key);}
        }
      }}>
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",borderBottom:`1px solid ${colors.border}`,background:colors.surface,flexWrap:"wrap"}}>
        <Sigma size={14} style={{color:colors.muted,flexShrink:0}}/>
        {editingName&&!locked?<input autoFocus defaultValue={ss.name||"Spreadsheet"} onBlur={e=>{upSs({name:e.target.value});setEditingName(false);}} onKeyDown={e=>{if(e.key==="Enter"||e.key==="Escape"){upSs({name:e.target.value});setEditingName(false);}}} style={{fontSize:13,fontWeight:600,border:"none",outline:"none",background:"transparent",color:colors.text,fontFamily:"inherit",width:130}}/>:<span onDoubleClick={()=>!locked&&setEditingName(true)} style={{fontSize:13,fontWeight:600,cursor:locked?"default":"text",userSelect:"none"}}>{ss.name||"Spreadsheet"}</span>}
        <div style={{width:1,height:16,background:colors.border}}/>
        <div style={{fontSize:12,color:colors.muted,padding:"2px 6px",background:colors.bg,border:`1px solid ${colors.border}`,borderRadius:4,minWidth:42,textAlign:"center",fontFamily:"monospace"}}>{sel?`${colLabel(sel.ci)}${sel.ri+1}`:"—"}</div>
        <div style={{display:"flex",alignItems:"center",gap:4,flex:1,background:colors.bg,border:`1px solid ${colors.border}`,borderRadius:4,padding:"2px 8px",minWidth:120}}>
          <span style={{fontSize:11,color:"#2383e2",fontWeight:700,flexShrink:0,fontFamily:"monospace"}}>ƒ</span>
          <input value={formulaBar} onChange={e=>{setFormulaBar(e.target.value);if(sel&&!editing){setEditing(sel);setEditVal(e.target.value);}else if(editing)setEditVal(e.target.value);}} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();if(sel){upCell(sel.ri,sel.ci,formulaBar);setEditing(null);}}if(e.key==="Escape"){setFormulaBar(sel?getCellRaw(sel.ri,sel.ci):"");setEditing(null);}}} readOnly={locked||!sel} placeholder="Value or formula (=SUM, =AVG, =MIN, =MAX, =COUNT)" style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:13,color:colors.text,fontFamily:"monospace"}}/>
        </div>
        <button onClick={()=>upSs({frozenHeader:!ss.frozenHeader})} style={{background:ss.frozenHeader?"#2383e215":"transparent",border:`1px solid ${ss.frozenHeader?"#2383e2":colors.border}`,borderRadius:4,padding:"3px 7px",cursor:"pointer",fontSize:11,color:ss.frozenHeader?"#2383e2":colors.muted}}>{ss.frozenHeader?"Frozen":"Freeze"}</button>
        {!locked&&<><button onClick={()=>addRow(ss.data.length-1)} style={{display:"flex",alignItems:"center",gap:3,background:"transparent",border:`1px solid ${colors.border}`,borderRadius:4,padding:"3px 7px",cursor:"pointer",color:colors.muted,fontSize:11}}><Plus size={10}/>Row</button><button onClick={()=>addCol(ss.columns.length-1)} style={{display:"flex",alignItems:"center",gap:3,background:"transparent",border:`1px solid ${colors.border}`,borderRadius:4,padding:"3px 7px",cursor:"pointer",color:colors.muted,fontSize:11}}><Plus size={10}/>Col</button></>}
      </div>
      <div style={{overflowX:"auto",overflowY:"auto",maxHeight:460}}>
        <table style={{borderCollapse:"collapse",tableLayout:"fixed",fontSize:13,fontFamily:"inherit"}}>
          <colgroup><col style={{width:ROW_NUM_W}}/>{ss.columns.map(col=><col key={col.id} style={{width:col.width||120}}/>)}<col style={{width:40}}/></colgroup>
          <thead style={{position:ss.frozenHeader?"sticky":"relative",top:0,zIndex:4,background:colors.surface}}>
            <tr style={{height:HEADER_H}}>
              <th style={{background:colors.surface,border:`1px solid ${colors.border}`,borderLeft:"none",borderTop:"none",padding:0,position:"sticky",left:0,zIndex:5}}>
                <div onClick={()=>{setSel({ri:0,ci:0});setSelRange({r1:0,c1:0,r2:ss.data.length-1,c2:ss.columns.length-1});}} style={{display:"flex",alignItems:"center",justifyContent:"center",height:HEADER_H,cursor:"pointer",color:colors.muted,fontSize:10}}>▣</div>
              </th>
              {ss.columns.map((col,ci)=>(
                <th key={col.id} style={{background:colors.surface,border:`1px solid ${colors.border}`,borderTop:"none",padding:0,position:"relative",userSelect:"none",fontWeight:500}}>
                  <div style={{display:"flex",alignItems:"center",height:HEADER_H,padding:"0 4px",gap:2}}>
                    <span style={{fontSize:10,color:colors.muted,flexShrink:0,minWidth:16,textAlign:"center"}}>{colLabel(ci)}</span>
                    <input value={col.name||""} onChange={e=>!locked&&setColName(ci,e.target.value)} placeholder="Header" readOnly={locked} style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:12,color:colors.text,fontFamily:"inherit",fontWeight:500,minWidth:0,padding:0}}/>
                    {!locked&&(<span onClick={e=>{e.stopPropagation();setColMenu(colMenu===ci?null:ci);setRowMenu(null);}} style={{cursor:"pointer",color:colors.muted,flexShrink:0,display:"flex",padding:2,borderRadius:3}} onMouseEnter={e=>e.currentTarget.style.background=colors.border} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><MoreVertical size={11}/></span>)}
                  </div>
                  {colMenu===ci&&!locked&&(
                    <div style={{position:"absolute",top:"100%",left:0,zIndex:30,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:8,padding:6,minWidth:180,boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>
                      <div style={{padding:"4px 8px",fontSize:11,color:colors.muted,marginBottom:4}}>ALIGN</div>
                      {[["left","Left",<AlignLeft size={12}/>],["center","Center",<AlignCenter size={12}/>],["right","Right",<AlignRight size={12}/>]].map(([a,lbl,ico])=>(
                        <div key={a} onMouseDown={()=>{setColAlign(ci,a);setColMenu(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:5,cursor:"pointer",background:col.align===a?colors.surface:"transparent",fontSize:13}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background=col.align===a?colors.surface:"transparent"}>{ico}<span>{lbl}</span></div>
                      ))}
                      <div style={{height:1,background:colors.border,margin:"4px 0"}}/>
                      <div onMouseDown={()=>{addCol(ci);setColMenu(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:5,cursor:"pointer",fontSize:13}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Plus size={12}/>Insert right</div>
                      <div onMouseDown={()=>{addCol(ci-1);setColMenu(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:5,cursor:"pointer",fontSize:13}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Plus size={12}/>Insert left</div>
                      <div style={{height:1,background:colors.border,margin:"4px 0"}}/>
                      <div onMouseDown={()=>{deleteCol(ci);setColMenu(null);}} style={{padding:"6px 8px",borderRadius:5,cursor:"pointer",fontSize:13,color:"#e03"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(238,0,51,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Delete column</div>
                    </div>
                  )}
                  {!locked&&(<div onMouseDown={e=>startColResize(e,ci)} style={{position:"absolute",right:0,top:0,bottom:0,width:5,cursor:"col-resize",zIndex:2}} onMouseEnter={e=>e.currentTarget.style.background="#2383e2"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}/>)}
                </th>
              ))}
              <th style={{background:colors.surface,border:`1px solid ${colors.border}`,borderTop:"none",padding:0,width:40}}>
                {!locked&&(<div onClick={()=>addCol(ss.columns.length-1)} style={{display:"flex",alignItems:"center",justifyContent:"center",height:HEADER_H,cursor:"pointer",color:colors.muted}} onMouseEnter={e=>e.currentTarget.style.background=colors.border} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Plus size={13}/></div>)}
              </th>
            </tr>
          </thead>
          <tbody>
            {ss.data.map((row,ri)=>(
              <tr key={row.id} style={{height:ROW_H}}>
                <td style={{background:colors.surface,border:`1px solid ${colors.border}`,borderLeft:"none",padding:0,position:"sticky",left:0,zIndex:2}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:5,height:"100%",gap:2,userSelect:"none",position:"relative"}}>
                    <span style={{fontSize:11,color:colors.muted}}>{ri+1}</span>
                    {!locked&&(<span onClick={e=>{e.stopPropagation();setRowMenu(rowMenu===ri?null:ri);setColMenu(null);}} style={{cursor:"pointer",color:colors.muted,display:"flex",padding:1,borderRadius:2}} onMouseEnter={e=>e.currentTarget.style.color=colors.text} onMouseLeave={e=>e.currentTarget.style.color=colors.muted}><MoreVertical size={10}/></span>)}
                    {rowMenu===ri&&!locked&&(
                      <div style={{position:"absolute",left:ROW_NUM_W,top:0,zIndex:20,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:8,padding:6,minWidth:160,boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>
                        <div onMouseDown={()=>{addRow(ri);setRowMenu(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:5,cursor:"pointer",fontSize:13}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Plus size={12}/>Insert below</div>
                        <div onMouseDown={()=>{addRow(ri-1);setRowMenu(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:5,cursor:"pointer",fontSize:13}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Plus size={12}/>Insert above</div>
                        <div style={{height:1,background:colors.border,margin:"4px 0"}}/>
                        <div onMouseDown={()=>{deleteRow(ri);setRowMenu(null);}} style={{padding:"6px 8px",borderRadius:5,cursor:"pointer",fontSize:13,color:"#e03"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(238,0,51,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Delete row</div>
                      </div>
                    )}
                  </div>
                </td>
                {ss.columns.map((col,ci)=>{
                  const isSel=isSelected(ri,ci),inRng=inRange(ri,ci),isEdit=editing?.ri===ri&&editing?.ci===ci;
                  const rawVal=getCellRaw(ri,ci),dispVal=getCellDisplay(ri,ci),isFormula=typeof rawVal==="string"&&rawVal.startsWith("=");
                  return(
                    <td key={col.id} onClick={e=>handleCellClick(e,ri,ci)} onDoubleClick={()=>!locked&&startEdit(ri,ci)}
                      onMouseDown={e=>{if(!e.shiftKey){setSel({ri,ci});setSelRange(null);setFormulaBar(getCellRaw(ri,ci)??"");}setMouseDown(true);}}
                      onMouseEnter={()=>{if(mouseDown&&sel)setSelRange({r1:Math.min(sel.ri,ri),c1:Math.min(sel.ci,ci),r2:Math.max(sel.ri,ri),c2:Math.max(sel.ci,ci)});}}
                      onMouseUp={()=>setMouseDown(false)}
                      style={{border:`1px solid ${colors.border}`,padding:0,position:"relative",verticalAlign:"middle",background:isSel?"#2383e215":inRng?"#2383e20a":colors.bg,outline:isSel?"2px solid #2383e2":"none",outlineOffset:-1}}>
                      {isEdit&&!locked?(
                        <input ref={inputRef} value={editVal} onChange={e=>{setEditVal(e.target.value);setFormulaBar(e.target.value);}} onKeyDown={e=>handleCellKeyDown(e,ri,ci)} onBlur={()=>commitEdit(ri,ci)} style={{width:"100%",height:ROW_H,border:"none",outline:"none",background:"transparent",padding:"4px 8px",fontSize:13,fontFamily:"monospace",color:colors.text,boxSizing:"border-box",textAlign:col.align||"left"}}/>
                      ):(
                        <div style={{padding:"4px 8px",height:ROW_H,display:"flex",alignItems:"center",justifyContent:col.align==="right"?"flex-end":col.align==="center"?"center":"flex-start",overflow:"hidden",whiteSpace:"nowrap",gap:3}}>
                          {isFormula&&<span style={{color:"#2383e2",fontSize:10,flexShrink:0,fontFamily:"monospace"}}>ƒ</span>}
                          <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:13,color:colors.text}}>{dispVal}</span>
                        </div>
                      )}
                    </td>
                  );
                })}
                <td style={{border:`1px solid ${colors.border}`,padding:0,background:colors.bg}}/>
              </tr>
            ))}
          </tbody>
          {!locked&&(<tfoot><tr><td colSpan={ss.columns.length+2} style={{padding:0,border:"none"}}><div onClick={()=>addRow(ss.data.length-1)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",cursor:"pointer",color:colors.muted,fontSize:12,background:colors.surface,borderTop:`1px solid ${colors.border}`}} onMouseEnter={e=>e.currentTarget.style.background=colors.border} onMouseLeave={e=>e.currentTarget.style.background=colors.surface}><Plus size={12}/>Add row</div></td></tr></tfoot>)}
        </table>
      </div>
      {sel&&(
        <div style={{display:"flex",alignItems:"center",gap:16,padding:"4px 12px",borderTop:`1px solid ${colors.border}`,background:colors.surface,fontSize:11,color:colors.muted}}>
          <span>{selRange?`${(selRange.r2-selRange.r1+1)*(selRange.c2-selRange.c1+1)} cells`:`${colLabel(sel.ci)}${sel.ri+1}`}</span>
          {selRange&&(()=>{const vals=[];for(let r=selRange.r1;r<=selRange.r2;r++)for(let c=selRange.c1;c<=selRange.c2;c++){const v=parseFloat(getCellDisplay(r,c));if(!isNaN(v))vals.push(v);}if(!vals.length)return null;const sum=vals.reduce((a,b)=>a+b,0);return(<><span>Sum: <strong style={{color:colors.text}}>{sum}</strong></span><span>Avg: <strong style={{color:colors.text}}>{(sum/vals.length).toFixed(2)}</strong></span><span>Count: <strong style={{color:colors.text}}>{vals.length}</strong></span></>);})()}
        </div>
      )}
    </div>
  );
}


export default SpreadsheetBlock;
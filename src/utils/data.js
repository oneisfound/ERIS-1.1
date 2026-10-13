import { DB_VIEW_LABELS } from "../data/constants";

const rid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
const headingLevel = t => { const m = t.match(/(\d)$/); return m ? +m[1] : null; };
const defaultIcon = () => ({ kind:"emoji", value:"📄" });
const formatBytes = n => !n?"":n<1024?n+" B":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(1)+" MB";

function newSpreadsheet(rows=6, cols=6) {
  const columns = Array.from({length:cols},()=>({id:rid(),width:120,align:"left",type:"text",name:""}));
  const data = Array.from({length:rows},()=>({id:rid(),cells:Object.fromEntries(columns.map(c=>[c.id,""]))}));
  return {id:rid(),name:"Spreadsheet",columns,data,frozenHeader:true};
}

function evalFormula(expr, data, columns) {
  const str = expr.trim();
  const m = str.match(/^=(\w+)\(([A-Za-z]+)(\d+):([A-Za-z]+)(\d+)\)$/i);
  if (m) {
    const func=m[1].toUpperCase(),ci1=m[2].toUpperCase().charCodeAt(0)-65,r1=parseInt(m[3])-1,ci2=m[4].toUpperCase().charCodeAt(0)-65,r2=parseInt(m[5])-1;
    const vals=[];
    for(let ri=Math.min(r1,r2);ri<=Math.max(r1,r2);ri++){for(let ci=Math.min(ci1,ci2);ci<=Math.max(ci1,ci2);ci++){const row=data[ri];const col=columns[ci];if(row&&col){const v=parseFloat(row.cells[col.id]);if(!isNaN(v))vals.push(v);}}}
    if(!vals.length)return"0";
    switch(func){case"SUM":return String(vals.reduce((a,b)=>a+b,0));case"AVG":return String(+(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(4));case"COUNT":return String(vals.length);case"MIN":return String(Math.min(...vals));case"MAX":return String(Math.max(...vals));default:return"#NAME?";}
  }
  const mathM=str.match(/^=(.+)$/);
  if(mathM){try{return String(Function(`"use strict";return(${mathM[1]})`)())}catch{return"#ERR";}}
  return str;
}

function displayCell(val, data, columns) {
  if(typeof val==="string"&&val.startsWith("=")){try{return evalFormula(val,data,columns);}catch{return"#ERR";}}
  return val??"";
}

function newSimpleBlock() {
  return {id:rid(),type:"paragraph",text:"",marks:[],checked:false,open:false,children:[],emoji:"💡",pageRef:null,media:null,cols:null,colWidths:null,    imageAlign:"center", imageWidth:100, dbId:null, ssId:null,
    url:null, embedType:null, displayAs:null, embedHeight:null };
}
function newBlock(type="paragraph") {
  return {id:rid(),type,text:"",marks:[],checked:false,open:false,children:[],emoji:"💡",pageRef:null,media:null,imageAlign:"center",imageWidth:100,
    cols:type==="columns"?[{id:rid(),blocks:[newSimpleBlock()]},{id:rid(),blocks:[newSimpleBlock()]}]:null,
    colWidths:type==="columns"?[50,50]:null,    dbId:null, ssId:null,
    url:null, embedType:null, displayAs:null, embedHeight:null }; }
function newPage(parentId=null) {
  return {id:rid(),title:"",icon:defaultIcon(),cover:null,parentId,blocks:[newBlock("paragraph")],locked:false,color:"default"};
}
function getPageColor(page) {
  return page?.color || "default";
}
export function getPageFont(page) {
  return page?.font || "default";
}

function newDatabase(name = "Untitled Database", defaultView = "table") {
  const titlePropId = rid();
  const makeView = (type, label) => ({
    id: rid(), type, name: label + " view",
    filters: [], sorts: [], groupBy: null, cardImagePropId: null,
  });
  const db = {
    id: rid(), name,
    views: [ makeView(defaultView, DB_VIEW_LABELS[defaultView]) ],
    activeViewId: null,
    properties: [
      { id:titlePropId, name:"Name", type:"text", isPrimary:true },
      { id:rid(), name:"Status", type:"select",
        options:[
          {id:rid(),name:"Not started",color:"#F87168"},
          {id:rid(),name:"In progress",color:"#FFA344"},
          {id:rid(),name:"Done",color:"#4DAB9A"}
        ]
      },
      { id:rid(), name:"Priority", type:"select",
        options:[
          {id:rid(),name:"Low",color:"#8BC34A"},
          {id:rid(),name:"Medium",color:"#FFA344"},
          {id:rid(),name:"High",color:"#F87168"}
        ]
      },
    ],
    rows: [
      { id:rid(), cells:{}, pageId:null, pageData:null },
      { id:rid(), cells:{}, pageId:null, pageData:null },
      { id:rid(), cells:{}, pageId:null, pageData:null },
    ],
  };
  return { ...db, activeViewId: db.views[0].id };
}

function getContainer(blocks,path) {
  if(!path.length)return blocks;
  const[step,...rest]=path;
  const b=blocks.find(x=>x.id===step.blockId);
  if(step.child) return b?.children ? getContainer(b.children,rest) : [];
  if(!b?.cols)return[];
  const col=b.cols.find(c=>c.id===step.colId);
  return col?getContainer(col.blocks,rest):[];
}
function updateContainer(blocks,path,updater) {
  if(!path.length)return updater(blocks);
  const[step,...rest]=path;
  return blocks.map(b=>{
    if(b.id!==step.blockId)return b;
    if(step.child)return {...b,children:updateContainer(b.children||[],rest,updater)};
    return {...b,cols:(b.cols||[]).map(col=>col.id!==step.colId?col:{...col,blocks:updateContainer(col.blocks,rest,updater)})};
  });
}
function collectHeadings(blocks) {
  let out=[];
  for(const b of blocks){const lvl=headingLevel(b.type);if(lvl)out.push({id:b.id,level:lvl,text:b.text});if(b.type==="columns"&&b.cols)b.cols.forEach(col=>{out=out.concat(collectHeadings(col.blocks));});}
  return out;
}

const colLabel = i => { let s="",n=i+1; while(n>0){s=String.fromCharCode(65+(n-1)%26)+s;n=Math.floor((n-1)/26);} return s; };

export {
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
};
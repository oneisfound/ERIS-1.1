import { useState, useEffect, useRef } from "react";
import { Upload, Download, FileCode, FileDown } from "lucide-react";

function DragPreview({text,x,y,dark}) {
  return(
    <div style={{position:"fixed",pointerEvents:"none",zIndex:9999,left:0,top:0,transform:`translate(${x+14}px,${y-10}px) rotate(1.5deg) scale(1.03)`,background:dark?"#2a2a2a":"#fff",color:dark?"#e8e8e6":"#1f1f1f",boxShadow:"0 8px 28px rgba(0,0,0,0.18)",borderRadius:6,padding:"6px 14px",fontSize:14,maxWidth:380,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",opacity:0.92,willChange:"transform"}}>
      {text||"Block"}
    </div>
  );
}

export default DragPreview;
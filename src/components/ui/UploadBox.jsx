import { useState, useEffect, useRef } from "react";
import { Upload, Download, FileCode, FileDown } from "lucide-react";

function UploadBox({accept,label,colors,onFile,locked}) {
  if(locked)return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",border:`1.5px dashed ${colors.border}`,borderRadius:8,padding:"24px",color:colors.muted,fontSize:14}}>{label} (locked)</div>);
  return(
    <label style={{display:"flex",alignItems:"center",justifyContent:"center",border:`1.5px dashed ${colors.border}`,borderRadius:8,padding:"24px",cursor:"pointer",color:colors.muted,fontSize:14}}>
      {label}
      <input type="file" accept={accept} style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)onFile(f);}}/>
    </label>
  );
}

export default UploadBox;
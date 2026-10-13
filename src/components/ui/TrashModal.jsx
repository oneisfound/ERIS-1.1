import { Trash2 } from "lucide-react";

function TrashModal({colors,title,onConfirm,onCancel}) {
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:12,padding:28,width:360,boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><Trash2 size={20} color="#e03"/><span style={{fontWeight:600,fontSize:16}}>Move to trash?</span></div>
        <p style={{fontSize:14,color:colors.muted,marginBottom:20,lineHeight:"1.5"}}><strong style={{color:colors.text}}>"{title||"Untitled"}"</strong> and all its subpages will be deleted.</p>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onCancel} style={{padding:"8px 16px",borderRadius:7,border:`1px solid ${colors.border}`,background:"transparent",cursor:"pointer",color:colors.text,fontSize:13}}>Cancel</button>
          <button onClick={onConfirm} style={{padding:"8px 16px",borderRadius:7,border:"none",background:"#e03",cursor:"pointer",color:"#fff",fontSize:13,fontWeight:600}}>Move to Trash</button>
        </div>
      </div>
    </div>
  );
}

export default TrashModal;
import { COLUMN_PRESETS } from "../../data/constants";

function ColumnPresetPicker({colors,onPick}) {
  return(
    <div style={{position:"absolute",top:"100%",left:0,marginTop:4,background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:8,padding:8,zIndex:50,width:200,boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>
      {COLUMN_PRESETS.map(p=>(
        <div key={p.label} onMouseDown={e=>{e.preventDefault();onPick(p);}} style={{padding:"8px 10px",borderRadius:6,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:10}} onMouseEnter={e=>e.currentTarget.style.background=colors.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{display:"flex",gap:3,height:16,flexShrink:0}}>{p.widths.map((w,i)=><div key={i} style={{background:colors.muted,borderRadius:2,height:"100%",width:w*0.4,opacity:0.6}}/>)}</div>
          <span>{p.label}</span>
        </div>
      ))}
    </div>
  );
}

export default ColumnPresetPicker;
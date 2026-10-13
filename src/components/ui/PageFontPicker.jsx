import { FONT_OPTIONS } from "../../data/constants";

function PageFontPicker({activeFont,colors,onPick}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:2,maxHeight:220,overflowY:"auto"}}>
      {FONT_OPTIONS.map(font=>(
        <div key={font.id} onClick={()=>onPick(font.id)}
          style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"8px 10px",borderRadius:6,cursor:"pointer",
            background:activeFont===font.id?colors.border:"transparent",
            fontFamily:font.family,fontSize:14,color:colors.text,
          }}
          onMouseEnter={e=>{if(activeFont!==font.id)e.currentTarget.style.background=colors.surface;}}
          onMouseLeave={e=>{if(activeFont!==font.id)e.currentTarget.style.background="transparent";}}
        >
          <span>{font.label}</span>
          {activeFont===font.id&&<span style={{fontSize:11,color:colors.muted}}>✓</span>}
        </div>
      ))}
    </div>
  );
}

export default PageFontPicker;
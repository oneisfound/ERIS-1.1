import { Table, LayoutGrid, Kanban, List as ListIcon, CalendarDays, GanttChart } from "lucide-react";
import { DB_VIEWS, DB_VIEW_LABELS } from "../../data/constants";

function ViewPickerModal({colors,onPick,onCancel}) {
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:colors.sidebar,border:`1px solid ${colors.border}`,borderRadius:12,padding:28,width:400,boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
        <div style={{fontWeight:700,fontSize:18,marginBottom:8}}>Choose a view</div>
        <div style={{fontSize:13,color:colors.muted,marginBottom:20}}>How do you want to display this database?</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {DB_VIEWS.map(vt=>(
            <div key={vt} onClick={()=>onPick(vt)}
              style={{border:`2px solid ${colors.border}`,borderRadius:10,padding:"18px 16px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:10,transition:"border-color 0.15s,background 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#2383e2";e.currentTarget.style.background=colors.surface;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=colors.border;e.currentTarget.style.background="transparent";}}>
              <div style={{width:40,height:40,borderRadius:8,background:colors.surface,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {vt==="table"&&<Table size={22} color="#2383e2"/>}
                {vt==="gallery"&&<LayoutGrid size={22} color="#2383e2"/>}
                {vt==="board"&&<Kanban size={22} color="#2383e2"/>}
                {vt==="list"&&<ListIcon size={22} color="#2383e2"/>}
                {vt==="calendar"&&<CalendarDays size={22} color="#2383e2"/>}
                {vt==="timeline"&&<GanttChart size={22} color="#2383e2"/>}
              </div>
              <div style={{fontWeight:600,fontSize:14}}>{DB_VIEW_LABELS[vt]}</div>
              <div style={{fontSize:12,color:colors.muted,textAlign:"center"}}>
                {vt==="table"    && "Rows and columns like a spreadsheet"}
                {vt==="gallery"  && "Cards with images and properties"}
                {vt==="board"    && "Kanban-style grouped columns"}
                {vt==="list"     && "Simple list of items"}
                {vt==="calendar" && "Items on a monthly calendar"}
                {vt==="timeline" && "Gantt-style bars by date range"}
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:18,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={onCancel} style={{padding:"8px 16px",borderRadius:7,border:`1px solid ${colors.border}`,background:"transparent",cursor:"pointer",color:colors.muted,fontSize:13}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default ViewPickerModal;
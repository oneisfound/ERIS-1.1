import { useState } from "react";

function AnnouncementModal({colors,onClose}) {
  const[dontShow,setDontShow]=useState(false);
  function handleClose(){
    if(dontShow){
      try{localStorage.setItem("eris-announcement-dismissed","true");}catch{}
    }
    onClose();
  }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)handleClose();}}>
      <div style={{background:colors.bg,borderRadius:14,width:"min(680px,90vw)",maxHeight:"85vh",overflowY:"auto",padding:28,boxShadow:"0 24px 72px rgba(0,0,0,0.28)"}}>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:12,color:colors.text}}>Welcome! 🏠✨</h2>

        <div style={{fontSize:14,color:colors.muted,lineHeight:1.6,marginBottom:20}}>
          <p style={{margin:"0 0 12px"}}>Heeyyy, welcomeee to your new home! 🏠✨</p>
          <p style={{margin:"0 0 12px"}}>This is the first app I've ever made so please no judging 😅</p>
          <p style={{margin:"0 0 12px"}}>I'll let you explore the app on your own, but if you have any experience with Notion I don't think it'll be too difficult to figure out!</p>
          <p style={{margin:"0 0 8px",color:colors.text,fontWeight:600}}>A few things you should know:</p>
          <ul style={{margin:0,paddingLeft:20,display:"flex",flexDirection:"column",gap:8}}>
            <li>I KNOW the dragging can be annoying 😭 Unfortunately I couldn't make it as smooth as I wanted. Also, when dragging something to create a new column, make sure to place it between two columns that already exist.</li>
            <li>To make the selection toolbar appear, select the word you want, then right click on it with your mouse.</li>
            <li>To delete a block click the six dots next to the block and press Delete. You can also use that menu to copy and paste blocks and honestly ... fixing copy and paste was harder than making the entire app -</li>
            <li>Also, try not to color a quote until you've finished writing it completely… there's another annoying bug there ahem-</li>
            <li>If you have any feedback, text me! ✨</li>
          </ul>
          <p style={{margin:"12px 0 0"}}>And enjoy your time here! I hope you like it ~</p>
        </div>

        <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:colors.muted,marginBottom:20,cursor:"pointer",userSelect:"none"}}>
          <input type="checkbox" checked={dontShow} onChange={e=>setDontShow(e.target.checked)}/>
          Don't show this again
        </label>
        <button onClick={handleClose} style={{width:"100%",padding:"10px 0",borderRadius:8,border:"none",background:"#2383e2",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"}}>
          Got it
        </button>
      </div>
    </div>
  );
}

export default AnnouncementModal;
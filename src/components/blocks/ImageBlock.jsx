import { useState, useRef } from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Crop as CropIcon,
  Check,
  X,
} from "lucide-react";

function ImageBlock({block,colors,onUpdate,locked}) {
  const[show,setShow]=useState(false);
  const[cropping,setCropping]=useState(false);
  const[cropRect,setCropRect]=useState(()=>block.crop?{x:block.crop.x,y:block.crop.y,width:block.crop.width,height:block.crop.height}:{x:0,y:0,width:100,height:100});
  const ref=useRef(null);
  const cropImgRef=useRef(null);

  function startResize(e) {
    if(locked)return;e.preventDefault();
    const pW=ref.current?.parentElement?.offsetWidth||600;
    const x0=e.clientX,w0=block.imageWidth||100;
    const move=ev=>onUpdate({imageWidth:Math.max(10,Math.min(100,w0+((ev.clientX-x0)/pW)*100))});
    const up=()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);};
    window.addEventListener("mousemove",move);window.addEventListener("mouseup",up);
  }

  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

  function openCrop(){
    setCropRect(block.crop?{x:block.crop.x,y:block.crop.y,width:block.crop.width,height:block.crop.height}:{x:0,y:0,width:100,height:100});
    setCropping(true);
  }

  function startDragMove(e){
    if(locked)return;e.preventDefault();e.stopPropagation();
    const imgEl=cropImgRef.current;if(!imgEl)return;
    const rect=imgEl.getBoundingClientRect();
    const startX=e.clientX,startY=e.clientY;
    const orig={...cropRect};
    function move(ev){
      const dxPct=((ev.clientX-startX)/rect.width)*100;
      const dyPct=((ev.clientY-startY)/rect.height)*100;
      setCropRect({
        ...orig,
        x:clamp(orig.x+dxPct,0,100-orig.width),
        y:clamp(orig.y+dyPct,0,100-orig.height),
      });
    }
    function up(){window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);}
    window.addEventListener("mousemove",move);window.addEventListener("mouseup",up);
  }

  function startDragHandle(corner,e){
    if(locked)return;e.preventDefault();e.stopPropagation();
    const imgEl=cropImgRef.current;if(!imgEl)return;
    const rect=imgEl.getBoundingClientRect();
    const startX=e.clientX,startY=e.clientY;
    const orig={...cropRect};
    const MIN=8;
    function move(ev){
      const dxPct=((ev.clientX-startX)/rect.width)*100;
      const dyPct=((ev.clientY-startY)/rect.height)*100;
      let{x,y,width,height}=orig;
      if(corner.includes("e"))width=clamp(orig.width+dxPct,MIN,100-orig.x);
      if(corner.includes("s"))height=clamp(orig.height+dyPct,MIN,100-orig.y);
      if(corner.includes("w")){
        const newX=clamp(orig.x+dxPct,0,orig.x+orig.width-MIN);
        width=orig.width+(orig.x-newX);x=newX;
      }
      if(corner.includes("n")){
        const newY=clamp(orig.y+dyPct,0,orig.y+orig.height-MIN);
        height=orig.height+(orig.y-newY);y=newY;
      }
      setCropRect({x,y,width,height});
    }
    function up(){window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);}
    window.addEventListener("mousemove",move);window.addEventListener("mouseup",up);
  }

  function applyCrop(){
    const imgEl=cropImgRef.current;
    if(!imgEl){setCropping(false);return;}
    const naturalW=imgEl.naturalWidth||1,naturalH=imgEl.naturalHeight||1;
    const cropWpx=(cropRect.width/100)*naturalW;
    const cropHpx=(cropRect.height/100)*naturalH;
    const aspectRatio=(cropHpx/cropWpx)*100;
    onUpdate({crop:{...cropRect,aspectRatio}});
    setCropping(false);
  }

  function cancelCrop(){setCropping(false);}
  function resetCrop(){onUpdate({crop:null});setCropping(false);}

  const align=block.imageAlign||"center",width=block.imageWidth||100;
  const mx=align==="left"?{marginRight:"auto",marginLeft:0}:align==="right"?{marginLeft:"auto",marginRight:0}:{margin:"0 auto"};

  if(cropping){
    const r=cropRect;
    return(
      <div>
        <div style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
          <span style={{fontSize:12,color:colors.muted}}>Drag to crop</span>
          <button onClick={resetCrop} style={{marginLeft:"auto",background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,padding:"4px 9px",fontSize:12,cursor:"pointer",color:colors.muted}}>Reset</button>
          <button onClick={cancelCrop} style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,padding:"4px 9px",fontSize:12,cursor:"pointer",color:colors.text,display:"flex",alignItems:"center",gap:4}}><X size={13}/>Cancel</button>
          <button onClick={applyCrop} style={{background:"#2383e2",border:"none",borderRadius:6,padding:"4px 9px",fontSize:12,cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",gap:4}}><Check size={13}/>Apply</button>
        </div>
        <div style={{position:"relative",width:"100%",maxWidth:600,userSelect:"none"}}>
          <img ref={cropImgRef} src={block.media.dataUrl} alt="" draggable={false} style={{width:"100%",display:"block",borderRadius:8,userSelect:"none"}}/>
          {/* dark mask, built from 4 rectangles around the crop area */}
          <div style={{position:"absolute",left:0,top:0,right:0,height:`${r.y}%`,background:"rgba(0,0,0,0.55)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",left:0,top:`${r.y+r.height}%`,right:0,bottom:0,background:"rgba(0,0,0,0.55)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",left:0,top:`${r.y}%`,width:`${r.x}%`,height:`${r.height}%`,background:"rgba(0,0,0,0.55)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",left:`${r.x+r.width}%`,top:`${r.y}%`,right:0,height:`${r.height}%`,background:"rgba(0,0,0,0.55)",pointerEvents:"none"}}/>
          <div onMouseDown={startDragMove} style={{position:"absolute",left:`${r.x}%`,top:`${r.y}%`,width:`${r.width}%`,height:`${r.height}%`,border:"2px solid #2383e2",cursor:"move",boxSizing:"border-box"}}>
            {["nw","ne","sw","se"].map(corner=>(
              <div key={corner} onMouseDown={e=>startDragHandle(corner,e)}
                style={{position:"absolute",width:10,height:10,background:"#2383e2",borderRadius:"50%",cursor:`${corner}-resize`,
                  top:corner.includes("n")?-5:"auto",bottom:corner.includes("s")?-5:"auto",
                  left:corner.includes("w")?-5:"auto",right:corner.includes("e")?-5:"auto"}}/>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const crop=block.crop;

  return(
    <div onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {show&&!locked&&(
        <div style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
          {[["left",<AlignLeft size={13}/>],["center",<AlignCenter size={13}/>],["right",<AlignRight size={13}/>]].map(([a,ico])=>(
            <button key={a} onClick={()=>onUpdate({imageAlign:a})} style={{background:align===a?colors.border:"transparent",border:"none",borderRadius:4,padding:"4px 7px",cursor:"pointer",color:colors.text,display:"flex",alignItems:"center"}}>{ico}</button>
          ))}
          <button onClick={openCrop} title="Crop image" style={{background:"transparent",border:"none",borderRadius:4,padding:"4px 7px",cursor:"pointer",color:colors.text,display:"flex",alignItems:"center"}}><CropIcon size={13}/></button>
          <span style={{fontSize:12,color:colors.muted,marginLeft:4}}>Width:{Math.round(width)}%</span>
          <button onClick={()=>onUpdate({media:null})} style={{marginLeft:"auto",background:"transparent",border:`1px solid ${colors.border}`,borderRadius:6,padding:"3px 8px",fontSize:12,cursor:"pointer",color:colors.muted}}>Remove</button>
        </div>
      )}
      <div ref={ref} style={{position:"relative",width:`${width}%`,...mx}}>
        {crop?(
          <div style={{position:"relative",width:"100%",paddingTop:`${crop.aspectRatio}%`,overflow:"hidden",borderRadius:8}}>
            <img src={block.media.dataUrl} alt="" draggable={false} style={{
              position:"absolute",
              width:`${(100/crop.width)*100}%`,
              maxWidth:"none",
              top:`${-(crop.y/crop.height)*100}%`,
              left:`${-(crop.x/crop.width)*100}%`,
              userSelect:"none",pointerEvents:"none",
            }}/>
          </div>
        ):(
          <img src={block.media.dataUrl} alt="" draggable={false} style={{width:"100%",display:"block",borderRadius:8,userSelect:"none",pointerEvents:"none"}}/>
        )}
        {show&&!locked&&<div onMouseDown={startResize} style={{position:"absolute",right:-5,top:"50%",transform:"translateY(-50%)",width:10,height:36,background:colors.muted,borderRadius:5,cursor:"ew-resize",opacity:0.7}}/>}
      </div>
    </div>
  );
}

export default ImageBlock;
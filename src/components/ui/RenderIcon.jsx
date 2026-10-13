import { ICON_LIBRARY } from "../../data/constants";

function RenderIcon({icon,size}) {
  if(!icon)return null;
  if(icon.kind==="emoji")return<span style={{fontSize:size,lineHeight:1}}>{icon.value}</span>;
  if(icon.kind==="icon"){const C=ICON_LIBRARY[icon.value];return C?<C size={size} color={icon.color||"#5A5A57"}/>:null;}
  if(icon.kind==="image")return<img src={icon.value} alt="" style={{width:size,height:size,borderRadius:8,objectFit:"cover"}}/>;
  return null;
}

export default RenderIcon;
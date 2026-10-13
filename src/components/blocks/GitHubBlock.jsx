import { useState, useRef, useEffect } from "react";
import {
  Code,
  Link,
} from "lucide-react";

import { getGitHubEmbedUrl } from "../../utils/embeds";


function GitHubBlock({ block, colors, onUpdate, locked }) {
  const [editing, setEditing] = useState(!block.url);
  const [inputVal, setInputVal] = useState(block.url || "");
  const [repoData, setRepoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const ref = useRef(null);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  useEffect(() => {
  if (!block.url) return;
  const parsed = getGitHubEmbedUrl(block.url);
  if (!parsed) {
    setError("That doesn't look like a valid GitHub repository link.");
    setLoading(false);
    return;
  }
  setLoading(true);
  setError(null);
  fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`)
    .then(r => r.json())
    .then(data => {
      if (data.message) { setError(data.message); setLoading(false); return; }
      setRepoData(data);
      setLoading(false);
    })
    .catch(() => { setError("Failed to load repo"); setLoading(false); });
}, [block.url]);

  function commit() {
    const val = inputVal.trim();
    if (!val) return;
    onUpdate({ url: val });
    setEditing(false);
    setRepoData(null);
  }

  if (editing) {
    return (
      <div style={{ background:colors.surface, borderRadius:10,
        border:`1.5px solid ${colors.border}`, overflow:"hidden" }}>
        <div style={{ background:"#24292f", padding:"10px 14px",
          display:"flex", alignItems:"center", gap:8 }}>
          <Code size={16} color="#fff"/>
          <span style={{ color:"#fff", fontWeight:600, fontSize:14 }}>GitHub</span>
        </div>
        <div style={{ padding:14 }}>
          <div style={{ fontSize:13, color:colors.muted, marginBottom:8 }}>
            Paste a GitHub repository URL
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input
              ref={ref}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if(e.key==="Enter") commit(); if(e.key==="Escape") setEditing(false); }}
              placeholder="https://github.com/owner/repo"
              style={{ flex:1, padding:"8px 12px", border:`1px solid ${colors.border}`,
                borderRadius:6, outline:"none", background:colors.bg,
                color:colors.text, fontSize:13, fontFamily:"inherit" }}
            />
            <button onClick={commit}
              style={{ background:"#24292f", border:"none", borderRadius:6,
                padding:"8px 16px", cursor:"pointer", color:"#fff",
                fontSize:13, fontWeight:600 }}>
              Embed
            </button>
          </div>
        </div>
      </div>
    );
  }

  const parsed = getGitHubEmbedUrl(block.url);

  return (
    <div style={{ borderRadius:10, overflow:"hidden",
      border:`1px solid ${colors.border}`, position:"relative" }}
      onMouseEnter={e=>{ const el=e.currentTarget.querySelector(".embed-actions"); if(el)el.style.opacity="1"; }}
      onMouseLeave={e=>{ const el=e.currentTarget.querySelector(".embed-actions"); if(el)el.style.opacity="0"; }}>
      {/* Header bar */}
      <div style={{ background:"#24292f", padding:"10px 14px",
        display:"flex", alignItems:"center", gap:8 }}>
        <Code size={15} color="#fff"/>
        <span style={{ color:"#fff", fontSize:13, fontWeight:600 }}>
          {parsed ? `${parsed.owner}/${parsed.repo}` : block.url}
        </span>
        <a href={block.url} target="_blank" rel="noopener noreferrer"
          style={{ marginLeft:"auto", color:"rgba(255,255,255,0.6)", display:"flex",
            textDecoration:"none" }}
          onMouseEnter={e=>e.currentTarget.style.color="#fff"}
          onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.6)"}>
          <Link size={13}/>
        </a>
      </div>
      {/* Content */}
            {/* Content */}
      <div style={{ padding: parsed?.isPagesLink ? 0 : 16, background:colors.bg }}>
        {parsed?.isPagesLink && (
          <iframe
            src={block.url}
            title="GitHub Pages preview"
            style={{ width:"100%", height:420, border:"none", display:"block" }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        )}
        {loading && (
          <div style={{ color:colors.muted, fontSize:13, padding: parsed?.isPagesLink ? 16 : 0 }}>Loading repository…</div>
        )}
        {error && (
          <div style={{ color:"#e03", fontSize:13, padding: parsed?.isPagesLink ? 16 : 0 }}>
            {error === "Not Found" ? "Repository not found or is private." : error}
          </div>
        )}
        {repoData && (
          <div style={{ padding: parsed?.isPagesLink ? 16 : 0 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
              <img src={repoData.owner?.avatar_url} alt=""
                style={{ width:40, height:40, borderRadius:"50%", flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>
                  {repoData.full_name}
                </div>
                <div style={{ fontSize:13, color:colors.muted, lineHeight:1.4 }}>
                  {repoData.description || "No description provided."}
                </div>
              </div>
            </div>
            {/* Stats row */}
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {[
                { icon:"⭐", label:"Stars",   val: repoData.stargazers_count?.toLocaleString() },
                { icon:"🍴", label:"Forks",   val: repoData.forks_count?.toLocaleString() },
                { icon:"👁",  label:"Watchers",val: repoData.watchers_count?.toLocaleString() },
                { icon:"🐛", label:"Issues",  val: repoData.open_issues_count?.toLocaleString() },
              ].map(s=>(
                <div key={s.label} style={{ display:"flex", alignItems:"center", gap:4,
                  fontSize:12, color:colors.muted }}>
                  <span>{s.icon}</span>
                  <span style={{ fontWeight:600, color:colors.text }}>{s.val}</span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
            {/* Tags */}
            <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
              {repoData.language && (
                <span style={{ padding:"2px 8px", borderRadius:10, fontSize:11,
                  background:colors.surface, border:`1px solid ${colors.border}`,
                  color:colors.text }}>
                  {repoData.language}
                </span>
              )}
              {repoData.license?.name && (
                <span style={{ padding:"2px 8px", borderRadius:10, fontSize:11,
                  background:colors.surface, border:`1px solid ${colors.border}`,
                  color:colors.muted }}>
                  {repoData.license.name}
                </span>
              )}
              {repoData.topics?.slice(0,5).map(t=>(
                <span key={t} style={{ padding:"2px 8px", borderRadius:10, fontSize:11,
                  background:"#2383e215", border:`1px solid #2383e240`,
                  color:"#2383e2" }}>
                  {t}
                </span>
              ))}
            </div>
            {/* Updated */}
            <div style={{ marginTop:10, fontSize:11, color:colors.muted }}>
              Updated {new Date(repoData.updated_at).toLocaleDateString("en-US",
                {month:"short",day:"numeric",year:"numeric"})}
            </div>
          </div>
        )}
      </div>
      {!locked && (
        <div className="embed-actions"
          style={{ position:"absolute", top:8, right:36, display:"flex", gap:4,
            opacity:0, transition:"opacity 0.15s" }}>
          <button onClick={()=>{ setEditing(true); setInputVal(block.url||""); }}
            style={{ background:"rgba(0,0,0,0.6)", border:"none", borderRadius:5,
              padding:"3px 8px", cursor:"pointer", color:"#fff", fontSize:11 }}>
            Edit
          </button>
          <button onClick={()=>{ onUpdate({ url:null }); setEditing(true); }}
            style={{ background:"rgba(0,0,0,0.6)", border:"none", borderRadius:5,
              padding:"3px 8px", cursor:"pointer", color:"#fff", fontSize:11 }}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

export default GitHubBlock;
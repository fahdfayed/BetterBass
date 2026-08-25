import {useEffect,useRef,useState,type ReactNode} from "react";
import {LEARNING_STATE_EVENT} from "./learning-storage";

type RuntimeConfig={apiBase:string};
type SyncStatus="connecting"|"synced"|"saving"|"offline";
type StateResponse={learnerId:string;records:Record<string,string>;updatedAt:string|null};

declare global{interface Window{__BASSLAB_NODE_RUNTIME__?:RuntimeConfig}}

const STATE_KEYS=[
 "basslab-adaptive",
 "basslab-lessons",
 "basslab-course",
 "basslab-last-take",
 "basslab-beast",
 "basslab-performance-coach-v1",
 "slaplab-passes",
] as const;
const LEARNER_KEY="basslab-node-learner-id",SESSION_MARKER="basslab-node-last-session";

function learnerId(){
 const stored=localStorage.getItem(LEARNER_KEY);if(stored)return stored;
 const value=globalThis.crypto?.randomUUID?.()??`learner-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
 localStorage.setItem(LEARNER_KEY,value);return value;
}
function collectRecords(){return Object.fromEntries(STATE_KEYS.flatMap(key=>{const value=localStorage.getItem(key);return value===null?[]:[[key,value]]}))}
function takeSignature(raw:string){let hash=2166136261;for(let i=0;i<raw.length;i++){hash^=raw.charCodeAt(i);hash=Math.imul(hash,16777619)}return `take-${(hash>>>0).toString(36)}-${raw.length}`}
async function jsonRequest<T>(url:string,init?:RequestInit){const response=await fetch(url,{...init,headers:{"content-type":"application/json",...init?.headers}});if(!response.ok)throw new Error(`Node API returned ${response.status}`);return response.json() as Promise<T>}

export default function NodeRuntimeShell({children}:{children:ReactNode}){
 const [ready,setReady]=useState(false),[status,setStatus]=useState<SyncStatus>("connecting");
 const [id,setId]=useState("");
 const lastSaved=useRef(""),saving=useRef(false);
 const apiBase=window.__BASSLAB_NODE_RUNTIME__?.apiBase??"/api/v1";

 useEffect(()=>{let cancelled=false;const hydrate=async()=>{
  const nextId=learnerId();setId(nextId);
  try{
   const remote=await jsonRequest<StateResponse>(`${apiBase}/state/${encodeURIComponent(nextId)}`);
   Object.entries(remote.records??{}).forEach(([key,value])=>{if(STATE_KEYS.includes(key as typeof STATE_KEYS[number])&&localStorage.getItem(key)===null)localStorage.setItem(key,value)});
   const records=collectRecords();
   await jsonRequest(`${apiBase}/state/${encodeURIComponent(nextId)}`,{method:"PUT",body:JSON.stringify({records})});
   lastSaved.current=JSON.stringify(records);setStatus("synced");
  }catch{setStatus("offline")}
  const take=localStorage.getItem("basslab-last-take");
  if(take){const signature=takeSignature(take);if(localStorage.getItem(SESSION_MARKER)!==signature){try{const events=JSON.parse(take);await jsonRequest(`${apiBase}/sessions/${encodeURIComponent(nextId)}`,{method:"POST",body:JSON.stringify({sessionId:signature,source:"browser-audio-analysis",events})});localStorage.setItem(SESSION_MARKER,signature)}catch{}}}
  if(!cancelled)setReady(true);
 };void hydrate();return()=>{cancelled=true}},[apiBase]);

 useEffect(()=>{if(!ready||!id)return;let disposed=false;
  const sync=async()=>{if(saving.current||disposed)return;const records=collectRecords(),snapshot=JSON.stringify(records),take=records["basslab-last-take"],signature=take?takeSignature(take):"",needsState=snapshot!==lastSaved.current,needsSession=Boolean(take&&localStorage.getItem(SESSION_MARKER)!==signature);if(!needsState&&!needsSession)return;saving.current=true;setStatus("saving");try{if(needsState){await jsonRequest(`${apiBase}/state/${encodeURIComponent(id)}`,{method:"PUT",body:JSON.stringify({records})});lastSaved.current=snapshot}if(needsSession&&take){try{const events=JSON.parse(take);await jsonRequest(`${apiBase}/sessions/${encodeURIComponent(id)}`,{method:"POST",body:JSON.stringify({sessionId:signature,source:"browser-audio-analysis",events})});localStorage.setItem(SESSION_MARKER,signature)}catch{}}setStatus("synced")}catch{setStatus("offline")}finally{saving.current=false}};
  let debounce=0;const schedule=()=>{window.clearTimeout(debounce);debounce=window.setTimeout(()=>void sync(),450)};
  const timer=window.setInterval(()=>void sync(),5000);
  const flush=()=>{const records=collectRecords(),snapshot=JSON.stringify(records);if(snapshot===lastSaved.current)return;const payload=new Blob([JSON.stringify({records})],{type:"application/json"});navigator.sendBeacon?.(`${apiBase}/state/${encodeURIComponent(id)}`,payload)};
  const onVisibility=()=>{if(document.visibilityState==="hidden")flush()};
  window.addEventListener(LEARNING_STATE_EVENT,schedule);window.addEventListener("pagehide",flush);document.addEventListener("visibilitychange",onVisibility);
  return()=>{disposed=true;window.clearInterval(timer);window.clearTimeout(debounce);window.removeEventListener(LEARNING_STATE_EVENT,schedule);window.removeEventListener("pagehide",flush);document.removeEventListener("visibilitychange",onVisibility)};
 },[apiBase,id,ready]);

 if(!ready)return <main className="nodeBoot" aria-live="polite"><i/><span>NODE · EXPRESS</span><h1>Loading your Bass Lab…</h1><p>Restoring this learner’s course, practice and performance state.</p></main>;
 return <><div data-no-translate className={`nodeRuntimeStatus ${status}`} role="status" aria-live="polite"><i/><span>NODE API</span><b>{status==="connecting"?"CONNECTING":status==="saving"?"SAVING":status==="offline"?"LOCAL FALLBACK":"SYNCED"}</b></div>{children}</>;
}

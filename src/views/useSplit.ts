import {useCallback,useEffect,useRef,useState} from "react";

/**
 * A draggable divider between reading and working.
 *
 * The tools that sit in the workspace were built as full-page views, and how
 * much room they need depends on which one is open and what the reader is
 * doing with it — a fretboard wants width, a paragraph of instruction does
 * not. Rather than pick one split and make every tool live with it, the
 * divider is draggable and remembers where it was left.
 *
 * The value is the reading pane's share of the width, as a percentage.
 */
const STORE="basslab-lesson-split";
const MIN=25,MAX=75,DEFAULT=50;

const clamp=(value:number)=>Math.min(MAX,Math.max(MIN,value));

const read=():number=>{
 // Storage is unavailable in private windows and throws rather than returning
 // null, so a failure here has to fall back rather than break the lesson.
 try{
  const saved=Number(window.localStorage.getItem(STORE));
  return Number.isFinite(saved)&&saved>0?clamp(saved):DEFAULT;
 }catch{return DEFAULT}
};

export function useSplit(){
 const [split,setSplit]=useState(DEFAULT);
 const frame=useRef<HTMLDivElement>(null);
 const dragging=useRef(false);

 // Read the stored split after mount so the server and the client render the
 // same thing first.
 useEffect(()=>{setSplit(read())},[]);

 const save=useCallback((value:number)=>{
  setSplit(value);
  try{window.localStorage.setItem(STORE,String(value))}catch{/* not worth failing over */}
 },[]);

 const from=useCallback((clientX:number)=>{
  const box=frame.current?.getBoundingClientRect();
  if(!box||box.width===0)return;
  save(clamp(((clientX-box.left)/box.width)*100));
 },[save]);

 useEffect(()=>{
  const move=(event:PointerEvent)=>{if(dragging.current)from(event.clientX)};
  const up=()=>{
   dragging.current=false;
   document.body.classList.remove("isSplitting");
  };
  window.addEventListener("pointermove",move);
  window.addEventListener("pointerup",up);
  window.addEventListener("pointercancel",up);
  return()=>{
   window.removeEventListener("pointermove",move);
   window.removeEventListener("pointerup",up);
   window.removeEventListener("pointercancel",up);
  };
 },[from]);

 const onPointerDown=useCallback((event:React.PointerEvent)=>{
  event.preventDefault();
  dragging.current=true;
  // While dragging, stop the pointer selecting text it happens to cross.
  document.body.classList.add("isSplitting");
 },[]);

 const onKeyDown=useCallback((event:React.KeyboardEvent)=>{
  const step=event.shiftKey?10:2;
  if(event.key==="ArrowLeft"){event.preventDefault();save(clamp(split-step))}
  else if(event.key==="ArrowRight"){event.preventDefault();save(clamp(split+step))}
  else if(event.key==="Home"){event.preventDefault();save(MIN)}
  else if(event.key==="End"){event.preventDefault();save(MAX)}
  else if(event.key==="Enter"||event.key===" "){event.preventDefault();save(DEFAULT)}
 },[split,save]);

 return {split,frame,onPointerDown,onKeyDown,min:MIN,max:MAX};
}

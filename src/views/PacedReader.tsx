import {Children,useEffect,useRef,useState,type ReactNode} from "react";

type Props={
 /** The class the stage's own layout expects — the reader keeps it. */
 className:string;
 /**
  * Reveal everything at once. A stage the learner has already passed should
  * not make them click through it again to reach the part they came back for.
  */
 revealAll?:boolean;
 /** Named for the control, e.g. "in this lesson". */
 label?:string;
 children:ReactNode;
};

/**
 * Teaching delivered a beat at a time.
 *
 * A lesson stage runs to three or four hundred words across a dozen blocks,
 * which arrives as a wall and gets skimmed. The blocks are already written as
 * numbered beats — the theory, the vocabulary, the worked example — so the
 * reader hands over one, waits, and hands over the next.
 *
 * Revealed beats stay on the page. The point is to control the rate at which
 * the material arrives, not to hide what has already been read: a learner who
 * wants to look back at the formula while reading the example must be able to.
 */
export default function PacedReader({className,revealAll=false,label="in this stage",children}:Props){
 const beats=Children.toArray(children);
 const [shown,setShown]=useState(revealAll?beats.length:1);
 const frame=useRef<HTMLDivElement>(null);
 const advanced=useRef(false);
 /** How many beats were on the page before this reveal, so the new ones are known. */
 const shownAt=useRef(shown);

 // A stage the learner has already been through opens whole, and stays whole
 // if they walk back into it.
 useEffect(()=>{if(revealAll)setShown(beats.length)},[revealAll,beats.length]);

 /*
  * Move focus to the beat that just arrived, so a screen reader and a keyboard
  * both land on the new material instead of leaving the reader at a button
  * whose meaning has changed underneath them. Only after a real reveal — not
  * on first render, which would steal focus from the page heading.
  */
 useEffect(()=>{
  if(!advanced.current)return;
  advanced.current=false;
  const still=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const arrived=[...(frame.current?.children??[])].slice(shownAt.current) as HTMLElement[];
  shownAt.current=shown;
  const beat=arrived[0];
  if(!beat)return;

  // "Show all" can deliver several at once; every one of them enters.
  for(const el of arrived){
   el.classList.add("pacedBeat");
   el.addEventListener("animationend",()=>el.classList.remove("pacedBeat"),{once:true});
  }

  beat.tabIndex=-1;
  beat.focus({preventScroll:true});
  beat.scrollIntoView({block:"nearest",behavior:still?"auto":"smooth"});
 },[shown]);

 const remaining=beats.length-shown;
 const reveal=()=>{advanced.current=true;setShown(n=>Math.min(beats.length,n+1))};

 return (
  <>
   <div className={className} ref={frame}>
    {beats.slice(0,shown)}
   </div>

   {remaining>0&&(
    <div className="pacedNext">
     <button type="button" className="action action-primary" onClick={reveal}>
      Continue <span aria-hidden="true">↓</span>
     </button>
     <p className="pacedCount">
      <b className="mono">{shown}</b> of <b className="mono">{beats.length}</b> {label}
     </p>
     <button type="button" className="action action-quiet"
             onClick={()=>{advanced.current=true;setShown(beats.length)}}>
      Show all {beats.length}
     </button>
    </div>
   )}
  </>
 );
}

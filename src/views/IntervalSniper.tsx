import {useCallback,useEffect,useState} from "react";
import {NOTE_NAMES} from "../pitch";
import {SHORT_NAMES} from "../theory/degrees";
import {type Heard,useHeardNote} from "../useHeardNote";

/**
 * Hear the root; play the requested function.
 *
 * That is what the shelf has always promised this game does. What it actually
 * did was open the fretboard with the note labels hidden, which trains reading
 * a diagram rather than finding a sound — and could be completed without the
 * bass being plugged in.
 *
 * The degree is named, never the note. Answering means converting a function
 * into a pitch and then into a place on the neck, which is the whole skill; a
 * game that names the note has already done the interesting part for you.
 */

/** The degrees worth drilling, hardest last. */
const LADDER=[
 {id:"chord",name:"Chord tones",degrees:[0,4,7,10]},
 {id:"scale",name:"The whole scale",degrees:[0,2,4,5,7,9,11]},
 {id:"colour",name:"Colours and alterations",degrees:[1,3,6,8,10]},
 {id:"all",name:"Every degree",degrees:[0,1,2,3,4,5,6,7,8,9,10,11]},
];

type Props={
 /** Pitch class the degrees are measured from. */
 root:number;
 heard:Heard;
 listening:boolean;
 connecting:boolean;
 onListen:()=>void;
 audition:(pitchClasses:number[],hold?:number)=>void;
};

export default function IntervalSniper({root,heard,listening,connecting,onListen,audition}:Props){
 const [rung,setRung]=useState(LADDER[0]);
 const [asked,setAsked]=useState(LADDER[0].degrees[1]);
 const [streak,setStreak]=useState(0);
 const [best,setBest]=useState(0);
 const [last,setLast]=useState<{played:number;right:boolean}|null>(null);

 const nextDegree=useCallback((from:typeof rung,avoid:number)=>{
  const pool=from.degrees.filter(degree=>degree!==avoid);
  return pool[Math.floor(Math.random()*pool.length)]??from.degrees[0];
 },[]);

 // Changing rung is a new game, not a continuation of the old one.
 useEffect(()=>{
  setAsked(nextDegree(rung,-1));setStreak(0);setLast(null);
 },[rung,nextDegree]);

 const ignorePast=useHeardNote(heard,played=>{
  const right=played===(root+asked)%12;
  setLast({played,right});
  if(right){
   setStreak(count=>{const next=count+1;setBest(top=>Math.max(top,next));return next});
   setAsked(current=>nextDegree(rung,current));
  }else setStreak(0);
 },listening);

 const hearRoot=()=>{ignorePast();audition([root],.9)};

 return (
  <section className="sniper">
   <header>
    <span className="label">INTERVAL SNIPER</span>
    <h2>Hear the root. Play the function.</h2>
    <p>
     The degree is named, never the note. Finding it means turning a function into a
     pitch and a pitch into a place on the neck, which is the part worth practising.
    </p>
   </header>

   <div className="sniperRungs">
    {LADDER.map(item=>(
     <button
      key={item.id}
      type="button"
      className={`gymChip ${item.id===rung.id?"on":""}`}
      aria-pressed={item.id===rung.id}
      onClick={()=>setRung(item)}
     >
      <b>{item.name}</b>
      <small className="mono">{item.degrees.map(d=>SHORT_NAMES[d]).join(" ")}</small>
     </button>
    ))}
   </div>

   <div className="sniperRound">
    <div className="sniperAsk">
     <small>HOME IS {NOTE_NAMES[root]}</small>
     <b className="mono">{SHORT_NAMES[asked]}</b>
     <button type="button" className="action action-quiet" onClick={hearRoot}>▶ Hear home again</button>
    </div>

    <div className="sniperState" aria-live="polite">
     {!listening
      ?<>
        <p>This one cannot be played without the bass — that is the point of it.</p>
        <button type="button" className="action action-primary" onClick={onListen} aria-busy={connecting}>
         {connecting?"Connecting…":"Connect the bass"}
        </button>
       </>
      :last===null
       ?<p className="sniperWaiting"><i aria-hidden="true"/> Listening. Play {SHORT_NAMES[asked]} above {NOTE_NAMES[root]}.</p>
       :last.right
        ?<p className="sniperHit">Yes — {NOTE_NAMES[last.played]}. Next one.</p>
        :<p className="sniperMiss">
          That was {NOTE_NAMES[last.played]}, which is {SHORT_NAMES[((last.played-root)%12+12)%12]}.
          Still looking for {SHORT_NAMES[asked]}.
         </p>}
    </div>

    <div className="sniperScore">
     <div><b className="mono">{streak}</b><small>IN A ROW</small></div>
     <div><b className="mono">{best}</b><small>BEST</small></div>
    </div>
   </div>
  </section>
 );
}

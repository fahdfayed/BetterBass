import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {type Drill,drillById} from "../game/drills";
import {NOTE_NAMES} from "../pitch";
import {SHORT_NAMES} from "../theory/degrees";
import {type Heard} from "../useHeardNote";
import {type Outcome,useGameEngine} from "./useGameEngine";

/**
 * The one drill whose name promised more than "a hint fades as your streak
 * rises" ever delivered. A single global fade can't be a map — a map has
 * some ground you hold and some you don't, at the same time.
 *
 * Each degree the round pool has introduced gets its own fog state here:
 * answer it right twice running and it clears (no more reference tone for
 * that one specifically); miss it once and it fogs back over. The pool that
 * decides which degrees are even in play still widens with the streak,
 * exactly as ../game/drills.ts's own fog drill already does — this only
 * changes whether a given degree, once met, still needs the reference.
 */

const MASTERY_THRESHOLD=2;
const mod=(v:number)=>((v%12)+12)%12;

type Props={
 root:number;
 heard:Heard;
 listening:boolean;
 connecting:boolean;
 onListen:()=>void;
 audition:(pitchClasses:number[],hold?:number)=>void;
 onExit:()=>void;
};

export default function FogOfWar({root,heard,listening,connecting,onListen,audition,onExit}:Props){
 const [mastery,setMastery]=useState<Record<number,number>>({});
 const masteryRef=useRef(mastery);
 useEffect(()=>{masteryRef.current=mastery},[mastery]);

 const [met,setMet]=useState<number[]>([]);
 // The degree the currently-displayed ask is actually about — set as a side
 // effect of generating the ask itself, since useGameEngine calls `ask`
 // without ever handing the degree back to the caller.
 const activeDegreeRef=useRef<number|null>(null);

 const base=useMemo(()=>drillById("fog")!,[]);

 /*
  * Wraps the shared fog drill's own degree-picking/pool-widening logic and
  * overrides only the reference/hint decision, from a global level to this
  * degree's own mastery. `useMemo` with no deps keeps this stable across
  * renders — recreating it would look like a "fresh drill" to useGameEngine
  * and reset the whole round.
  */
 const fogDrill=useMemo<Drill>(()=>({
  ...base,
  ask:(askRoot,level,random)=>{
   const inner=base.ask(askRoot,level,random);
   const degree=mod(inner.notes[0]-askRoot);
   activeDegreeRef.current=degree;
   const cleared=(masteryRef.current[degree]??0)>=MASTERY_THRESHOLD;
   return {
    ...inner,
    reference:cleared?undefined:[askRoot],
    hint:cleared?"Clear. You've held this one — no reference now.":inner.hint,
   };
  },
 }),[base]);

 const [streak,setStreak]=useState(0);
 const [best,setBest]=useState(0);
 const [score,setScore]=useState(0);
 const [misses,setMisses]=useState(0);
 const [said,setSaid]=useState<string|null>(null);

 const onOutcome=useCallback((outcome:Outcome)=>{
  const degree=activeDegreeRef.current;
  if(degree!==null){
   setMet(current=>current.includes(degree)?current:[...current,degree]);
   setMastery(current=>({...current,[degree]:outcome.hit?(current[degree]??0)+1:0}));
  }
  if(outcome.hit){
   setScore(total=>total+1);
   setStreak(run=>{const next=run+1;setBest(top=>Math.max(top,next));return next});
   setSaid("Yes.");
   return;
  }
  setStreak(0);setMisses(count=>count+1);
  setSaid(outcome.reason==="wrongNote"?`That was ${NOTE_NAMES[mod(outcome.played)]}.`:"Too slow.");
 },[]);

 const{ask,left,over,restart}=useGameEngine(fogDrill,root,heard,listening,audition,onOutcome);

 const resetGame=()=>{
  setStreak(0);setScore(0);setMisses(0);setSaid(null);setMastery({});setMet([]);restart();
 };

 const clearedCount=met.filter(degree=>(mastery[degree]??0)>=MASTERY_THRESHOLD).length;
 const tiles=[...met].sort((a,b)=>a-b);

 return (
  <section className="runner beat-ambient fogOfWar">
   <header>
    <div><h2>{base.desc}</h2></div>
    <button type="button" className="action action-quiet" onClick={onExit}>← All games</button>
   </header>

   {!listening&&(
    <div className="runnerConnect">
     <p>This is answered on the instrument. Nothing is checked until the bass is connected.</p>
     <button type="button" className="action action-primary" onClick={onListen} aria-busy={connecting}>
      {connecting?"Connecting…":"Connect the bass"}
     </button>
    </div>
   )}

   {tiles.length>0&&(
    <div className="fogMap" aria-label="Degrees met so far, and whether they still need the reference">
     {tiles.map(degree=>{
      const cleared=(mastery[degree]??0)>=MASTERY_THRESHOLD;
      const progress=Math.min(mastery[degree]??0,MASTERY_THRESHOLD);
      return (
       <span key={degree} className={`fogTile ${cleared?"clear":"foggy"}`}
             title={cleared?"Clear":`${progress}/${MASTERY_THRESHOLD} toward clearing`}>
        {SHORT_NAMES[degree]}
       </span>
      );
     })}
    </div>
   )}

   <div className="runnerBoard">
    <div className="runnerAsk" aria-live="polite">
     {over?(
      <>
       <span className="label">Time</span>
       <b>{clearedCount} of {tiles.length} cleared</b>
       <p>{score} correct, longest run of {best}. {misses} missed.</p>
       <button type="button" className="action action-primary" onClick={resetGame}>Again</button>
      </>
     ):(
      <>
       <span className="label">Play</span>
       <b>{ask?.prompt??"…"}</b>
       {ask?.hint&&<p>{ask.hint}</p>}
       {ask?.reference&&(
        <button type="button" className="action action-quiet"
                onClick={()=>audition(ask.reference!,.8)}>▶ Hear it again</button>
       )}
      </>
     )}
    </div>

    <div className="runnerSide">
     {said&&!over&&<p className={`runnerSaid ${said.startsWith("Yes")?"good":"bad"}`} role="status">{said}</p>}
     <div className="runnerScore">
      <div><b className="mono">{streak}</b><small>In a row</small></div>
      <div><b className="mono">{clearedCount}</b><small>Cleared</small></div>
      <div><b className="mono">{left}</b><small>Seconds</small></div>
     </div>
    </div>
   </div>
  </section>
 );
}

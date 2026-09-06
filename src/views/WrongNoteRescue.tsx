import {lazy,Suspense,useCallback,useMemo,useState,useRef} from "react";
import {type Drill} from "../game/drills";
import {circularDistance,poolFor,tierFor,type Tier} from "../game/rescue";
import {QUALITIES} from "../tab/chromatic-library";
import {NOTE_NAMES} from "../pitch";
import {type Heard} from "../useHeardNote";
import {useOutcomeFlash} from "./game-neck-target";
import {type Outcome,useGameEngine} from "./useGameEngine";

/** See GameRunner.tsx's identical const for why this is lazy. */
const GameNeck3D=lazy(()=>import("./GameNeck3D"));

/**
 * The drill's own comment already said it: "the nearest ones are the
 * convincing answers" — but nothing ever measured that. Any chord tone
 * still rescues the forced note, exactly as before; which one you choose is
 * now scored, and mastery is rewarded with harder rescues rather than more
 * of the same one. The scoring itself lives in ../game/rescue.ts, tested
 * apart from React and the mic.
 */

const mod=(v:number)=>((v%12)+12)%12;
const pick=<T,>(list:T[],random:()=>number)=>list[Math.floor(random()*list.length)]??list[0];

type Props={
 root:number;
 heard:Heard;
 listening:boolean;
 connecting:boolean;
 onListen:()=>void;
 audition:(pitchClasses:number[],hold?:number)=>void;
 onExit:()=>void;
};

export default function WrongNoteRescue({root,heard,listening,connecting,onListen,audition,onExit}:Props){
 const forcedRef=useRef(0);

 /*
  * `useMemo` with no deps: created once, so useGameEngine never sees a
  * "fresh drill" and resets the round. `forcedRef` records which note was
  * actually forced this round, since `advance()`'s accept-array check only
  * tells the engine whether the answer counted, not what it counted against.
  */
 const rescueDrill=useMemo<Drill>(()=>({
  id:"rescue",title:"Wrong Note Rescue",desc:"Make a forced outside note sound deliberate.",
  timed:false,session:0,
  ask:(askRoot,level,random)=>{
   const quality=pick(QUALITIES,random);
   const inside=quality.tones.map(tone=>mod(askRoot+tone));
   const outside=[...Array(12).keys()].filter(pc=>!inside.includes(pc));
   const forced=pick(poolFor(outside,inside,level),random);
   forcedRef.current=forced;
   return {
    prompt:`${NOTE_NAMES[forced]} over ${NOTE_NAMES[askRoot]}${quality.symbol}, resolve it`,
    hint:"Land on any tone of the chord. A semitone away pulls hardest.",
    notes:[],
    accept:inside,
    reference:[forced],
   };
  },
 }),[]);

 const [streak,setStreak]=useState(0);
 const [best,setBest]=useState(0);
 const [misses,setMisses]=useState(0);
 const [said,setSaid]=useState<string|null>(null);
 const [tiers,setTiers]=useState<Record<Tier,number>>({Textbook:0,Reaches:0,Distant:0});
 const{lastOutcome,reportOutcome,syncAsk}=useOutcomeFlash();

 const onOutcome=useCallback((outcome:Outcome)=>{
  reportOutcome(outcome.hit);
  if(outcome.hit){
   const distance=circularDistance(outcome.played,forcedRef.current);
   const{tier,said:message}=tierFor(distance);
   setTiers(current=>({...current,[tier]:current[tier]+1}));
   setStreak(run=>{const next=run+1;setBest(top=>Math.max(top,next));return next});
   setSaid(message);
   return;
  }
  setStreak(0);setMisses(count=>count+1);
  setSaid("Not a tone of the chord.");
 },[reportOutcome]);

 const{ask,progress}=useGameEngine(rescueDrill,root,heard,listening,audition,onOutcome);
 syncAsk(ask,progress);

 const total=tiers.Textbook+tiers.Reaches+tiers.Distant;

 return (
  <section className="runner beat-ambient wrongNoteRescue">
   <header>
    <div><h2>{rescueDrill.desc}</h2></div>
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

   <div className="runnerNeck">
    <Suspense fallback={null}>
     <GameNeck3D ask={ask} progress={progress} lastOutcome={lastOutcome}/>
    </Suspense>
   </div>

   <div className="runnerBoard">
    <div className="runnerAsk" aria-live="polite">
     <span className="label">Play</span>
     <b>{ask?.prompt??"…"}</b>
     {ask?.hint&&<p>{ask.hint}</p>}
     {ask?.reference&&(
      <button type="button" className="action action-quiet"
              onClick={()=>audition(ask.reference!,.8)}>▶ Hear it again</button>
     )}
    </div>

    <div className="runnerSide">
     {said&&<p className={`runnerSaid ${said.startsWith("Not")?"bad":"good"}`} role="status">{said}</p>}
     <div className="runnerScore">
      <div><b className="mono">{streak}</b><small>In a row</small></div>
      <div><b className="mono">{best}</b><small>Best</small></div>
      <div><b className="mono">{misses}</b><small>Misses</small></div>
     </div>
     {total>0&&(
      <div className="rescueTiers" aria-label="How the rescues broke down">
       <div className="tierRow textbook"><b>{tiers.Textbook}</b><small>Textbook</small></div>
       <div className="tierRow reaches"><b>{tiers.Reaches}</b><small>Reaches</small></div>
       <div className="tierRow distant"><b>{tiers.Distant}</b><small>Distant</small></div>
      </div>
     )}
    </div>
   </div>
  </section>
 );
}

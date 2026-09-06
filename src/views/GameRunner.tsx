import {lazy,Suspense,useCallback,useEffect,useMemo,useRef,useState} from "react";
import {type Ask,type Drill} from "../game/drills";
import {NOTE_NAMES} from "../pitch";
import {type Heard} from "../useHeardNote";
import {type LastOutcome,targetPitchClass} from "./game-neck-target";
import {type Outcome,useGameEngine} from "./useGameEngine";

/**
 * Three.js/@react-three/fiber/drei are a bigger dependency than the rest of
 * this app combined (see the 3D neck design spec) — lazy so a player who
 * never opens a drill never pays for them, same as BassLab does for the
 * free-explore 3D neck screen itself. targetPitchClass/LastOutcome live in
 * their own module precisely so this file can use them without dragging
 * that in eagerly too.
 */
const GameNeck3D=lazy(()=>import("./GameNeck3D"));

/**
 * Plays any of the seven scored drills (Boss Fight is BossFight.tsx — same
 * question engine, a health bar instead of a streak counter).
 *
 * They used to be eight cards that set some state and opened another screen —
 * no score, no end, and nothing checking what was played. useGameEngine keeps
 * the asking, judging and clock in one place; this component owns only what
 * a hit or a miss is worth here: streak, best, score, misses.
 */

type Props={
 drill:Drill;
 /** Pitch class the degrees are measured from. */
 root:number;
 heard:Heard;
 listening:boolean;
 connecting:boolean;
 onListen:()=>void;
 audition:(pitchClasses:number[],hold?:number)=>void;
 onExit:()=>void;
};

export default function GameRunner({
 drill,root,heard,listening,connecting,onListen,audition,onExit,
}:Props){
 const [streak,setStreak]=useState(0);
 const [best,setBest]=useState(0);
 const [score,setScore]=useState(0);
 const [misses,setMisses]=useState(0);
 const [said,setSaid]=useState<string|null>(null);
 const [lastOutcome,setLastOutcome]=useState<LastOutcome|null>(null);

 // judge() calls onOutcome before it advances to the next ask, but this
 // closure is only ever (re)read at the moment of that call — not this
 // render — so it needs the ask/progress that were on screen just now, not
 // whatever ask/progress this render closes over. Updated below, after
 // useGameEngine returns them, same freshness trick useGameEngine itself
 // uses for onOutcomeRef.
 const currentAskRef=useRef<{ask:Ask|null;progress:number}>({ask:null,progress:0});

 const onOutcome=useCallback((outcome:Outcome)=>{
  const{ask:askedFor,progress:atStep}=currentAskRef.current;
  setLastOutcome({pc:targetPitchClass(askedFor,atStep),hit:outcome.hit,at:performance.now()});
  if(outcome.hit){
   setScore(total=>total+1);
   setStreak(run=>{const next=run+1;setBest(top=>Math.max(top,next));return next});
   setSaid(outcome.onBeat?"On it.":"Yes.");
   return;
  }
  setStreak(0);setMisses(count=>count+1);
  if(outcome.reason==="offBeat")
   setSaid(`That landed on ${outcome.at.toFixed(1)}, the ask was ${outcome.wantedBeats.join(", ")}.`);
  else if(outcome.reason==="wrongNote")
   setSaid(`${outcome.onBeat?"On the beat, but that was ":"That was "}${NOTE_NAMES[((outcome.played%12)+12)%12]}.`);
  else
   setSaid(`Right note, but slower than ${outcome.limit.toFixed(1)}s.`);
 },[]);

 const{ask,progress,left,over,beat,restart}=useGameEngine(drill,root,heard,listening,audition,onOutcome);
 currentAskRef.current={ask,progress};

 // A fresh drill is a fresh game.
 useEffect(()=>{setStreak(0);setBest(0);setScore(0);setMisses(0);setSaid(null)},[drill]);
 // A new question clears the last one's verdict text.
 useEffect(()=>{setSaid(null)},[ask]);

 const doRestart=()=>{setStreak(0);setScore(0);setMisses(0);setSaid(null);restart()};

 const clock12=useMemo(()=>[0,1,2,3],[]);

 /*
  * Landing and Rhythm run their own click and judge against it directly
  * (see beatNow/judge in useGameEngine) — `.runnerBeats` already carries their
  * pulse. The other six have no clock of their own, so `beat-ambient` opts
  * them into the book's shared one instead: a beat-pulse borrowed from
  * whatever transport the player already has running, pure CSS, nothing here
  * to score against. NoteQuest's target card wears the same class.
  */
 return (
  <section className={`runner ${drill.timed?"runner-timed":"beat-ambient"}`}>
   <header>
    <div>
     <h2>{drill.desc}</h2>
    </div>
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

   {!over&&(
    <div className="runnerNeck">
     <Suspense fallback={null}>
      <GameNeck3D ask={ask} progress={progress} lastOutcome={lastOutcome}/>
     </Suspense>
    </div>
   )}

   <div className="runnerBoard">
    <div className="runnerAsk" aria-live="polite">
     {over?(
      <>
       <span className="label">Time</span>
       <b>{score} in {drill.session}s</b>
       <p>Longest run of {best}. {misses} missed.</p>
       <button type="button" className="action action-primary" onClick={doRestart}>Again</button>
      </>
     ):(
      <>
       <span className="label">
        {ask?.limit!==undefined?`WITHIN ${ask.limit.toFixed(1)}s`:"Play"}
       </span>
       <b>{ask?.prompt??"…"}</b>
       {ask?.hint&&<p>{ask.hint}</p>}
       {ask&&ask.notes.length>1&&(
        <p className="runnerSteps">
         {ask.notes.map((note,index)=>(
          <i key={index} className={index<progress?"done":index===progress?"now":""}>
           {NOTE_NAMES[note]}
          </i>
         ))}
        </p>
       )}
       {ask?.reference&&(
        <button type="button" className="action action-quiet"
                onClick={()=>audition(ask.reference!,.8)}>▶ Hear it again</button>
       )}
      </>
     )}
    </div>

    <div className="runnerSide">
     {drill.timed&&!over&&(
      <div className="runnerBeats" aria-hidden="true">
       {clock12.map(index=>(
        <i key={index} className={index===beat?"on":""}>{index+1}</i>
       ))}
      </div>
     )}
     {said&&!over&&<p className={`runnerSaid ${said.startsWith("Yes")||said.startsWith("On it")?"good":"bad"}`} role="status">{said}</p>}
     <div className="runnerScore">
      <div><b className="mono">{streak}</b><small>In a row</small></div>
      <div><b className="mono">{best}</b><small>Best</small></div>
      {drill.session>0&&<div><b className="mono">{left}</b><small>Seconds</small></div>}
     </div>
    </div>
   </div>
  </section>
 );
}

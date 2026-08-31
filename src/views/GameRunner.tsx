import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {type Ask,type Drill,advance,onBeat} from "../game/drills";
import {NOTE_NAMES} from "../pitch";
import {type Heard,useHeardNote} from "../useHeardNote";
import {startAudioClock,type AudioClock} from "../audio-clock";

/**
 * Plays any of the eight drills.
 *
 * They used to be eight cards that set some state and opened another screen —
 * no score, no end, and nothing checking what was played. One runner keeps the
 * scoring, the clock and the listening in a single place, so a new drill is a
 * rule rather than a screen.
 */

const TEMPO=72;
const BEAT=60/TEMPO;

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
 const [ask,setAsk]=useState<Ask|null>(null);
 const [progress,setProgress]=useState(0);
 const [streak,setStreak]=useState(0);
 const [best,setBest]=useState(0);
 const [score,setScore]=useState(0);
 const [misses,setMisses]=useState(0);
 const [said,setSaid]=useState<string|null>(null);
 const [left,setLeft]=useState(drill.session);
 const [over,setOver]=useState(false);
 const [beat,setBeat]=useState(0);

 // The clock, for the drills that judge when as well as what.
 const clock=useRef<{ctx:AudioContext;clock:AudioClock}|null>(null);
 const mark=useRef({beat:0,at:0});
 const asked=useRef(0);

 const level=Math.min(4,Math.floor(streak/4));

 const nextAsk=useCallback(()=>{
  const next=drill.ask(root,level,Math.random);
  setAsk(next);setProgress(0);asked.current=performance.now();
  if(next.reference)audition(next.reference,.8);
 },[drill,root,level,audition]);

 // A fresh drill is a fresh game.
 useEffect(()=>{
  setStreak(0);setBest(0);setScore(0);setMisses(0);setSaid(null);
  setLeft(drill.session);setOver(false);
  const first=drill.ask(root,0,Math.random);
  setAsk(first);setProgress(0);asked.current=performance.now();
  if(first.reference)audition(first.reference,.8);
 },[drill,root,audition]);

 // The session timer, for the drills that end.
 useEffect(()=>{
  if(!drill.session||over)return;
  const id=window.setInterval(()=>{
   setLeft(remaining=>{
    if(remaining<=1){setOver(true);return 0}
    return remaining-1;
   });
  },1000);
  return ()=>window.clearInterval(id);
 },[drill.session,over]);

 /*
  * The click, and a mark of where the bar is.
  *
  * Beat position is worked out from the audio clock rather than from
  * performance.now(), because the click the player is hearing is on the audio
  * clock and judging them against a different one would call good notes late.
  */
 useEffect(()=>{
  if(!drill.timed||over)return;
  const ctx=new AudioContext();
  const running=startAudioClock(ctx,()=>TEMPO,{
   schedule:(index,time)=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.frequency.setValueAtTime(index%4===0?1320:880,time);
    gain.gain.setValueAtTime(.0001,time);
    gain.gain.exponentialRampToValueAtTime(index%4===0?.5:.25,time+.005);
    gain.gain.exponentialRampToValueAtTime(.0001,time+.06);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(time);osc.stop(time+.08);
    mark.current={beat:index,at:time};
   },
   display:index=>setBeat(index%4),
  });
  clock.current={ctx,clock:running};
  return ()=>{running.stop();void ctx.close();clock.current=null};
 },[drill.timed,over]);

 /** Where in the bar we are, 1 to 4, at this instant. */
 const beatNow=()=>{
  const engine=clock.current;
  if(!engine)return 1;
  const since=engine.ctx.currentTime-mark.current.at;
  return ((mark.current.beat+since/BEAT)%4+4)%4+1;
 };

 const judge=useCallback((played:number)=>{
  if(!ask||over)return;

  // Timed drills judge the beat first: the right note in the wrong place is
  // the mistake this drill exists to find.
  if(ask.beats?.length){
   const at=beatNow();
   const wanted=ask.beats.find(want=>onBeat(at,want));
   if(wanted===undefined){
    setStreak(0);setMisses(count=>count+1);
    setSaid(`That landed on ${at.toFixed(1)}, the ask was ${ask.beats.join(", ")}.`);
    return;
   }
   if(ask.notes.length&&((played%12)+12)%12!==((ask.notes[0]%12)+12)%12){
    setStreak(0);setMisses(count=>count+1);
    setSaid(`On the beat, but that was ${NOTE_NAMES[((played%12)+12)%12]}.`);
    return;
   }
   setScore(total=>total+1);
   setStreak(run=>{const next=run+1;setBest(top=>Math.max(top,next));return next});
   setSaid("On it.");
   nextAsk();
   return;
  }

  const step=advance(ask,progress,played);
  setProgress(step.progress);

  if(step.done){
   const late=ask.limit!==undefined&&(performance.now()-asked.current)/1000>ask.limit;
   if(late){
    setStreak(0);setMisses(count=>count+1);
    setSaid(`Right note, but slower than ${ask.limit?.toFixed(1)}s.`);
   }else{
    setScore(total=>total+1);
    setStreak(run=>{const next=run+1;setBest(top=>Math.max(top,next));return next});
    setSaid("Yes.");
   }
   nextAsk();
   return;
  }

  if(step.hit){setSaid(null);return}
  setStreak(0);setMisses(count=>count+1);
  setSaid(`That was ${NOTE_NAMES[((played%12)+12)%12]}.`);
 },[ask,progress,over,nextAsk]);

 useHeardNote(heard,judge,listening&&!over);

 const restart=()=>{
  setStreak(0);setScore(0);setMisses(0);setSaid(null);
  setLeft(drill.session);setOver(false);nextAsk();
 };

 const clock12=useMemo(()=>[0,1,2,3],[]);

 return (
  <section className="runner">
   <header>
    <div>
     <span className="label">{drill.title.toUpperCase()}</span>
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

   <div className="runnerBoard">
    <div className="runnerAsk" aria-live="polite">
     {over?(
      <>
       <span className="label">Time</span>
       <b>{score} in {drill.session}s</b>
       <p>Longest run of {best}. {misses} missed.</p>
       <button type="button" className="action action-primary" onClick={restart}>Again</button>
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

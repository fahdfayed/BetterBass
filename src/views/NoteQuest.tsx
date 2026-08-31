import {useEffect,useMemo,useRef,useState} from "react";
import {MISSES_ALLOWED,questFor,startWalk,step,targetPitchOf,type Walk} from "../quest-data";
import QuestScene from "./QuestScene";
import {COURSE_LESSONS} from "../course-data";
import {PITCH_NAMES} from "../harmony-fretboard-data";
import {shortName} from "../theory/degrees";

/**
 * Play the lesson, one note at a time, and the path moves.
 *
 * The site listens to the player in two places and neither of them is a test:
 * the ear ladder plays sounds at you, and the jury is a form you fill in after
 * the take. Nothing anywhere asks you to produce a specific note on the
 * instrument and refuses to continue until it hears one.
 *
 * A wrong note does not end the walk — it sends you back to the last place
 * worth standing, which is home, the note the lesson is about, or the turn.
 * Falling back to the very beginning every time turns a ten-step path into
 * something nobody finishes, and the interesting difficulty is remembering the
 * road rather than surviving it.
 */

type Props={
 /** The lesson to walk. */
 lesson:number;
 /** The last note the microphone committed, including repeats after a gap. */
 heard:{midi:number;at:number}|null;
 listening:boolean;
 connecting:boolean;
 onListen:()=>void;
 onPickLesson:(index:number)=>void;
 /** Sound a pitch class, so the player can hear the target before hunting it. */
 audition:(pitchClasses:number[],hold?:number)=>void;
};

export default function NoteQuest({
 lesson,heard,listening,connecting,onListen,onPickLesson,audition,
}:Props){
 const quest=useMemo(()=>questFor(lesson),[lesson]);

 const [walk,setWalk]=useState<Walk>(startWalk);
 const [wrong,setWrong]=useState<{played:number;wanted:number}|null>(null);
 const {at,misses,best,done}=walk;

 // Notes heard before the walk started are not answers to it.
 const consumed=useRef(heard?.at??0);
 useEffect(()=>{consumed.current=heard?.at??0},[lesson]);

 const reset=()=>{
  setWalk(startWalk());setWrong(null);
  consumed.current=heard?.at??performance.now();
 };
 useEffect(()=>{setWalk(startWalk());setWrong(null)},[lesson]);

 const target=quest.steps[Math.min(at,quest.steps.length-1)];
 const targetPitch=targetPitchOf(quest,walk);

 useEffect(()=>{
  if(!heard||done||heard.at<=consumed.current)return;
  consumed.current=heard.at;
  const played=((heard.midi%12)+12)%12;
  setWalk(current=>{
   const next=step(quest,current,played);
   setWrong(next.hit?null:{played,wanted:targetPitchOf(quest,current)});
   return next;
  });
 },[heard,done,quest]);

 const spent=misses>=MISSES_ALLOWED;

 return (
  <div className="osScreen noteQuest">
   <div className="screenIntro">
    <span>THE LONG WAY HOME</span>
    <h1 data-page-heading tabIndex={-1}>{quest.rootName} {quest.modeName}, one note at a time.</h1>
    <p>{quest.premise}</p>
   </div>

   <div className="questLesson">
    <label>
     <span className="label">WALKING</span>
     <select value={lesson} onChange={event=>onPickLesson(Number(event.target.value))}>
      {COURSE_LESSONS.map((item,index)=>(
       <option key={item.title} value={index}>
        {String(index+1).padStart(2,"0")} · {item.title}
       </option>
      ))}
     </select>
    </label>
    <span className="questProgress mono" role="status">
     {done?"ARRIVED":`${at} / ${quest.steps.length - 1} STEPS`}
    </span>
    <span className={`questLives mono ${spent?"spent":""}`}>
     {Array.from({length:MISSES_ALLOWED},(_,index)=>(
      <i key={index} aria-hidden="true" className={index<misses?"gone":""}>◆</i>
     ))}
     <small>{spent?"LOST THE ROAD":`${MISSES_ALLOWED-misses} WRONG TURNS LEFT`}</small>
    </span>
   </div>

   {!listening&&(
    <div className="questConnect">
     <p>Nothing can be checked until the bass is connected.</p>
     <button type="button" className="action action-primary" onClick={onListen} aria-busy={connecting}>
      {connecting?"Connecting…":"Connect the bass"}
     </button>
    </div>
   )}

   <QuestScene quest={quest} at={at} done={done} missed={!!wrong}
               misses={misses} allowed={MISSES_ALLOWED}/>

   <section className={`questTarget ${wrong?"missed":""} ${done?"arrived":""}`} aria-live="polite">
    {done?(
     <>
      <span className="label">ARRIVED</span>
      <h2>Home, from the other side.</h2>
      <p>
       You walked {quest.steps.length - 1} steps of {quest.rootName} {quest.modeName}
       {misses?` and took ${misses} wrong turn${misses>1?"s":""}`:" without a wrong turn"}.
       Play it again in another key and it is the same walk.
      </p>
      <button type="button" className="action action-primary" onClick={reset}>Walk it again</button>
     </>
    ):spent?(
     <>
      <span className="label">LOST THE ROAD</span>
      <h2>Three wrong turns. Start from home.</h2>
      <p>
       The path has not changed and neither has the key. Sound each target before you
       reach for it — the ear finds the note faster than the hand searching for it does.
      </p>
      <button type="button" className="action action-primary" onClick={reset}>Back to the start</button>
     </>
    ):(
     <>
      <span className="label">
       {at===0?"SET OFF FROM":"NEXT"} · STEP {at+1} OF {quest.steps.length}
      </span>
      <h2>{target.place}</h2>
      <div className="questNote">
       <b className="mono">{PITCH_NAMES[targetPitch]}</b>
       <i className="mono">{shortName(target.degree)}</i>
       <button type="button" className="action action-quiet"
               onClick={()=>audition([quest.root,targetPitch],.55)}>
        ▶ Hear it against home
       </button>
      </div>
      {wrong
       ?<p className="questMiss" role="alert">
         You played {PITCH_NAMES[wrong.played]}. The path wanted {PITCH_NAMES[wrong.wanted]},
         so you are back at the last place worth standing.
        </p>
       :<p>{target.beat}</p>}
     </>
    )}
   </section>

   <section className="questRoad">
    <header><span className="label">WHAT EACH PLACE IS</span></header>
    <ol>
     {quest.steps.map((place,index)=>{
      const walked=index<at||done;
      const here=index===at&&!done;
      return (
       <li key={index} className={`${walked?"walked":""} ${here?"here":""} ${place.checkpoint?"checkpoint":""}`}>
        <i className="mono" aria-hidden="true">{shortName(place.degree)}</i>
        <b>{walked||here?place.place:"—"}</b>
        {walked&&<p>{place.beat}</p>}
       </li>
      );
     })}
    </ol>
    {best>0&&!done&&<p className="dim questBest">Furthest so far: step {best}.</p>}
   </section>
  </div>
 );
}

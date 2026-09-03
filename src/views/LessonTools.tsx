import {lazy,Suspense} from "react";
import {courseTabsFor} from "../tab/course-exercises";

const HarmonyFretboard=lazy(()=>import("../HarmonyFretboard"));
const TheoryReference=lazy(()=>import("../TheoryReference"));
/* Static: see JacoMasterclass. Five other views import it eagerly, so the
   dynamic import here could not move it into a chunk of its own. */
import ExerciseTabs from "../tab/ExerciseTabs";

/** Everything the panes need, threaded from BassLab in one bundle. */
export type ToolBridge={
 root:number;
 mode:number;
 fbView:string;
 fog:number;
 picked:number|null;
 setRoot:(pc:number)=>void;
 setMode:(mode:number)=>void;
 setChord:(chord:string)=>void;
 setFbView:(view:string)=>void;
 setFog:(fog:number)=>void;
 setPicked:(pc:number|null)=>void;
 audition:(pcs:number[],hold?:number,droneRoot?:number)=>void;
 /** Backing band. */
 playing:boolean;
 startRuntime:()=>void;
 bpm:number;
 setBpm:(bpm:number)=>void;
 bar:number;
 beat:number;
 /** Take capture. */
 recording:boolean;
 beginTake:()=>void;
 endTake:()=>void;
 eventCount:number;
 listening:boolean;
 /** What the microphone is hearing, for the panes that can show it. */
 livePitch:{midi:number;cents:number}|null;
 /** Which lesson this is, so its written exercises can be found. */
 lessonIndex:number;
 /** The lesson's characteristic tones, for the ear pad. */
 intervals:number[];
 character:number[];
 noteName:(pc:number)=>string;
};

const Loading=()=><div className="toolLoading" role="status"><i/><span>Opening…</span></div>;

/** Which pane belongs to which stage, and what to call it. */
export const WORKSPACE_LABELS=[
 "Theory reference",
 "Ear trainer",
 "Fretboard",
 "Exercises",
 "Backing band",
 "Take recorder",
];

export default function LessonTools({stage,bridge}:{stage:number;bridge:ToolBridge}){
 const {root,noteName}=bridge;

 if(stage===0)return (
  <Suspense fallback={<Loading/>}>
   <TheoryReference embedded root={root} onSetMode={bridge.setMode} onAudition={bridge.audition}/>
  </Suspense>
 );

 if(stage===1){
  // Ear pad: hear home, then each tone this lesson is built on, against a drone.
  const tones=[...new Set([0,...bridge.character,...bridge.intervals])].slice(0,8);
  return (
   <div className="earPad">
    <p className="dim">Play each tone against the drone. Predict it before you press it.</p>
    <div className="earGrid">
     {tones.map(interval=>{
      const pc=(root+interval+120)%12;
      return (
       <button key={interval} className="earKey" onClick={()=>bridge.audition([pc],.5,root)}>
        <b>{noteName(pc)}</b>
        <small>{interval===0?"home":`+${interval}`}</small>
       </button>
      );
     })}
    </div>
    <button className="action" onClick={()=>bridge.audition(tones.map(i=>(root+i+120)%12),.42,root)}>
     Play the whole set
    </button>
   </div>
  );
 }

 if(stage===2)return (
  <Suspense fallback={<Loading/>}>
   <HarmonyFretboard
    embedded
    centre={root} homeMode={bridge.mode} displayMode={bridge.fbView} fog={bridge.fog} selectedPc={bridge.picked}
    onSetRoot={bridge.setRoot} onSetMode={bridge.setMode} onSetChord={bridge.setChord}
    onDisplayMode={bridge.setFbView} onFog={bridge.setFog} onSelectPc={bridge.setPicked}
    onAudition={bridge.audition}
    livePitch={bridge.livePitch} listening={bridge.listening}
   />
  </Suspense>
 );

 // PRACTICE is where the lesson's written exercises live: the tab, the
 // playback and the tempo control are the work, not a description of it.
 if(stage===3){
  const exercises=courseTabsFor(bridge.lessonIndex);
  if(exercises.length)return (
   <Suspense fallback={<Loading/>}>
    <ExerciseTabs exercises={exercises} label="Lesson exercises"/>
   </Suspense>
  );
 }

 if(stage===3||stage===4)return (
  <div className="toolDeck">
   <div className="transportRow">
    <button className={bridge.playing?"action action-quiet":"action-primary"} onClick={bridge.startRuntime}>
     {bridge.playing?"■ Stop band":"▶ Start band"}
    </button>
    <div className="barBeat" aria-live="off" aria-label={`Bar ${bridge.bar}, beat ${bridge.beat}`}>
     <span className="barNumber">bar</span>
     <b>{String(bridge.bar).padStart(2,"0")}</b><span>:</span><b>{bridge.beat}</b>
    </div>
   </div>
   <label className="tempoControl">
    <span className="label">Tempo</span>
    <span className="tempoMark" aria-label={`${bridge.bpm} beats per minute`}>
     <span className="tempoNote" aria-hidden="true">♩</span>
     <span className="tempoEq" aria-hidden="true">=</span>
     <b>{bridge.bpm}</b>
    </span>
    <input type="range" min="50" max="140" value={bridge.bpm} onChange={event=>bridge.setBpm(+event.target.value)}/>
   </label>
   <p className="dim">The band follows the lesson's key and mode. Change tempo while it runs.</p>
  </div>
 );

 return (
  <div className="toolDeck">
   <div className="transportRow">
    <button className={bridge.recording?"action action-quiet":"action-primary"} onClick={bridge.recording?bridge.endTake:bridge.beginTake}>
     {bridge.recording?"■ End & analyse":"● Record the take"}
    </button>
    <div className="takeCount mono">
     <b>{bridge.eventCount}</b><small>notes</small>
    </div>
   </div>
   <p className="dim">
    {bridge.listening
     ? "Input is live. Record one uninterrupted take, then read the evidence on the left."
     : "Connect the bass from the header, then record one uninterrupted take."}
   </p>
  </div>
 );
}

import {type Harmony,type NoteEvent} from "../pitch";
import {SHORT_NAMES} from "../theory/degrees";
import {verdict} from "../take-verdict";

/** What the engine works out about a note, and what it works it out from. */
const PIPELINE:[string,string,string][]=[
 ["01","Pitch + octave","Autocorrelation"],
 ["02","Onset + release","Stable-frame gate"],
 ["03","Duration + attack","Amplitude envelope"],
 ["04","Beat placement","Tempo grid"],
 ["05","Harmonic function","Musical GPS"],
 ["06","Resolution","Following-event context"],
];

const EXERCISES=[
 {menu:"Characteristic Tone",title:"Make it sound Dorian",
  brief:"Play four bars over Am7. Use F♯ twice, once on a strong beat. No ascending or descending scale run."},
 {menu:"Note Sniper",title:"Find the target anywhere",
  brief:"Target: F♯. Play any F♯ in under two seconds; next, find it above fret 12."},
 {menu:"Wrong Note Rescue",title:"Turn tension into intention",
  brief:"Forced note: D♯ over Am7. Resolve it convincingly within one note and keep the pulse."},
 {menu:"Outside Length",title:"Control time away from home",
  brief:"Remain inside for four bars. Go outside for exactly one beat, develop the phrase, then return to a chord tone."},
 {menu:"Daily Boss Fight",title:"Three minutes. No safety net.",
  brief:"Combine modal identity, three approaches, one enclosure, one side-slip, motif development and a deliberate final resolution."},
];

const COLUMNS=["TIME","NOTE","FUNCTION","DURATION","BEAT","DYNAMIC","RESOLUTION"];

/** How many of the most recent events the table shows. */
const TABLE_ROWS=12;

const mean=(events:NoteEvent[],of:(e:NoteEvent)=>number)=>
 Math.round(events.reduce((sum,e)=>sum+of(e),0)/events.length);

type Props={
 harmony:Harmony;
 /** Index into MODES. */
 mode:number;

 // Input state. The microphone itself belongs to the page.
 listening:boolean;
 /** True while the browser is asking for the microphone. */
 connecting:boolean;
 calibrated:boolean;
 /** Learned noise floor, as a raw amplitude. */
 noise:number;
 /** Whether a note is being heard clearly right now. */
 hearing:boolean;
 audioError:string;
 onCalibrate:()=>void;

 /** Which reference exercise is selected. */
 exercise:number;
 onExercise:(index:number)=>void;

 bpm:number;
 onBpm:(bpm:number)=>void;

 recording:boolean;
 onBeginTake:()=>void;
 onEndTake:()=>void;
 onClear:()=>void;
 events:NoteEvent[];
 /** When the current take started, so event times can be shown relative to it. */
 takeStart:number;
};

/**
 * Calibrate once; every exercise hears the same thing afterwards.
 *
 * The screen exists to make the analysis arguable. It shows the events it
 * detected, not just a score, so a player who disagrees with the verdict can
 * see which note it was reached from.
 */
export default function ListeningEngine({
 harmony,mode,listening,connecting,calibrated,noise,hearing,audioError,onCalibrate,
 exercise,onExercise,bpm,onBpm,recording,onBeginTake,onEndTake,onClear,events,takeStart,
}:Props){
 const {ri,color}=harmony;
 const selected=EXERCISES[exercise];
 const outside=events.filter(e=>e.tension===4);
 const coach=verdict(events,mode,color);

 return (
  <div className="osScreen">
   <div className="screenIntro">
    <span>Phase 2 · shared audio intelligence</span>
    <h1 data-page-heading tabIndex={-1}>Listening engine.</h1>
    <p>Calibrate once, then every exercise receives the same musical event stream: onset, release, duration, dynamics, beat placement, function, tension and resolution.</p>
   </div>

   <div className="calibration">
    <article>
     <span>Input calibration</span>
     <h2>{calibrated?"Ready to listen.":"Set your clean input."}</h2>
     <p>{calibrated
      ? `Noise floor learned at ${Math.round(noise*1000)} units. Detection range: E1-G5. Use a clean DI signal for best monophonic tracking.`
      : "Mute the strings for two seconds, then play open E, A, D and G clearly. Keep effects, amp simulation and monitoring outside this browser input."}</p>
     <div className="calStats">
      <div><small>Input</small><b>{connecting?"ASKING…":listening?"Active":"Offline"}</b></div>
      <div><small>Noise floor</small><b>{calibrated?"LOW":"-"}</b></div>
      <div><small>Latency</small><b>{calibrated?"~24 ms":"-"}</b></div>
      <div><small>Confidence</small><b>{hearing?"High":"Waiting"}</b></div>
     </div>
     {audioError&&<p className="audioError" role="alert">{audioError}</p>}
     <button onClick={()=>{if(!connecting)onCalibrate()}} aria-disabled={connecting} aria-busy={connecting}
             className={connecting?"waiting":""}>
      {connecting?"ASKING FOR THE MICROPHONE…":calibrated?"Recalibrate":"Begin calibration"}
     </button>
    </article>
    <article className="pipeline">
     <span>Event pipeline</span>
     {PIPELINE.map(([step,what,how])=>(
      <div key={step}>
       <b>{step}</b>
       <span>{what}<small>{how}</small></span>
       <i className={calibrated?"ready":""}/>
      </div>
     ))}
    </article>
   </div>

   <div className="referenceExercises">
    <div className="exerciseMenu">
     {EXERCISES.map((x,i)=>(
      <button className={exercise===i?"active":""} key={x.menu} onClick={()=>onExercise(i)}>
       <span>0{i+1}</span><b>{x.menu}</b>
      </button>
     ))}
    </div>
    <article className="exerciseStage">
     <span>REFERENCE EXERCISE {exercise+1}/{EXERCISES.length}</span>
     <h2>{selected.title}</h2>
     <p>{selected.brief}</p>
     <div className="takeControls">
      <label>Tempo <b>{bpm} BPM</b>
       <input type="range" min="50" max="140" value={bpm} onChange={e=>onBpm(+e.target.value)}/>
      </label>
      <button className={recording?"stop":connecting?"waiting":""}
              onClick={()=>{if(connecting)return;(recording?onEndTake:onBeginTake)()}}
              aria-disabled={connecting} aria-busy={connecting}>
       {connecting?"ASKING FOR THE MICROPHONE…":recording?"■ END & ANALYZE":"● RECORD TAKE"}
      </button>
      <button onClick={onClear}>Clear</button>
     </div>
    </article>
   </div>

   {events.length>0&&(
    <div className="takeAnalysis">
     <div className="takeSummary">
      <span>Take analysis</span>
      <div><b>{events.length}</b><small>Events</small></div>
      <div><b>{mean(events,e=>e.dur)}</b><small>Avg duration ms</small></div>
      <div><b>{Math.round(events.filter(e=>e.tension<4).length/events.length*100)}%</b><small>Inside</small></div>
      <div>
       <b>{outside.filter(e=>e.resolution==="recovered").length}/{outside.length}</b>
       <small>Recoveries</small>
      </div>
      <div><b>{mean(events,e=>Math.abs(e.offset))}</b><small>Mean offset ms</small></div>
     </div>

     <div className="eventTimeline">
      {events.map(e=>(
       <button key={e.id} className={`t${e.tension}`}
               /* Short notes still need to be clickable, so the bar has a floor. */
               style={{width:`${Math.max(28,e.dur/8)}px`}}
               title={`${e.n}${e.oct} · ${e.dur} ms · beat ${e.beat}`}>
        <b>{e.n}{e.oct}</b>
        <small>{SHORT_NAMES[(e.midi-ri+120)%12]}</small>
       </button>
      ))}
     </div>

     <div className="eventTable">
      <div className="eventRow head">{COLUMNS.map(c=><span key={c}>{c}</span>)}</div>
      {events.slice(-TABLE_ROWS).map(e=>(
       <div className="eventRow" key={e.id}>
        <span>{((e.start-takeStart)/1000).toFixed(2)}s</span>
        <span><b>{e.n}{e.oct}</b></span>
        <span className={`fn t${e.tension}`}>{e.fn}</span>
        <span>{e.dur} ms</span>
        <span>{e.beat} <small>{e.offset>=0?"+":""}{e.offset}ms</small></span>
        <span>{e.amp>.08?"ff":e.amp>.04?"mf":"p"}</span>
        <span className={e.resolution}>{e.resolution}</span>
       </div>
      ))}
     </div>

     <div className="coachVerdict">
      <span>Coach verdict</span>
      <h3>{coach.heading}</h3>
      <p>{coach.advice}</p>
     </div>
    </div>
   )}
  </div>
 );
}

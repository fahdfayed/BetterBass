import {useState} from "react";
import {useAudition} from "../useAudition";
import {MODES} from "../harmony-fretboard-data";
import {NOTE_NAMES as N,type Harmony} from "../pitch";
import {SHORT_NAMES} from "../theory/degrees";

/** The shape of one detected note, as the listening engine reports it. */
type LabEvent={midi:number,tension:number};

const TABS:[string,string][]=[
 ["motif","MOTIF MACHINE"],["slip","SIDE-SLIP"],["enclose","ENCLOSURES"],
 ["voice","VOICE LEADING"],["tension","TENSION ARC"],["diagnose","MODAL OR FUNCTIONAL?"],
];

const MUTATIONS=["ORIGINAL","RETROGRADE","+1 SEMITONE","−1 SEMITONE","ALTER END"];

const SLIP_WINDOWS=["","½ beat","1 beat","2 beats","1 bar"];

const VOICE_LEVELS:[string,string][]=[
 ["SHELL","Guide tones only"],
 ["CONNECT","Nearest chord tones; max major 3rd"],
 ["DECORATE","One chromatic neighbour before every landing"],
 ["FREEDOM","Improvise; skeleton must remain singable"],
];

const CURVE_STEPS=["HOME","COLOUR","TENSION","OUTSIDE","CLIMAX"];

/** What a bar of each intensity costs against the budget. */
const TENSION_COST=[0,0,1,2,4];

const HARMONY_CASES=[
 {p:"Dm7 for 16 bars",a:"Modal",
  why:"Static harmony gives one tonal field enough time for Dorian colour, motif and register development."},
 {p:"Dm7 → G7 → Cmaj7",a:"Functional",
  why:"The chords create dominant direction. Guide tones and destinations matter more than assigning a new scale shape."},
 {p:"Am7 | D7 | Am7 | D7",a:"Hybrid",
  why:"A recurring modal centre coexists with functional dominant colour. Track A as home while respecting F♯ and C on D7."},
];

const ENCLOSURES:[number[],string][]=[
 [[1,-1,0],"UPPER / LOWER"],
 [[-1,2,0],"LOWER / DIATONIC UPPER"],
 [[2,-1,0],"WIDE UPPER / LOWER"],
];

type Props={
 harmony:Harmony;
 /** Index into MODES for the home mode. */
 mode:number;
 /** The take's detected notes; the labs read the last few as source material. */
 events:LabEvent[];
 recording:boolean;
 onBeginTake:()=>void;
 onEndTake:()=>void;
 /** Play a run of pitch classes over the home drone. */
 audition:(pitchClasses:number[])=>void;
 /** Send a side-slip figure to the backing band and open it. */
 onLoadIntoBand:(semitones:number)=>void;
 /*
  * Which lab is open is controlled from outside, because the enclosure game
  * opens this screen on a chosen tab. The feedback line used to be too, for a
  * worse reason: a dead lesson-jury path wrote its verdict into it. That path
  * is gone, so the line belongs to the lab again.
  */
 tab:string;
 onTabChange:(tab:string)=>void;
};

/**
 * Six labs for playing outside on purpose.
 *
 * Each one is built around the same claim: leaving the key is not the hard
 * part, and none of these exercises score the departure. What they score is
 * whether the idea survived the trip — its rhythm, its contour, its return.
 *
 * Each lab's own settings live here rather than in the page around them,
 * because nothing outside this screen reads them. The two that are controlled
 * from outside say why above.
 */
export default function ImprovisationLab(
 {harmony,mode,events,recording,onBeginTake,onEndTake,audition,onLoadIntoBand,
  tab:labMode,onTabChange:setLabMode}:Props
){
 const {playing,play}=useAudition(audition);
 const [feedback,setFeedback]=useState("");
 const [mutation,setMutation]=useState("ORIGINAL");
 const [slip,setSlip]=useState(1);
 const [slipLength,setSlipLength]=useState(1);
 const [targetTone,setTargetTone]=useState(0);
 const [tensionBudget,setTensionBudget]=useState(10);
 const [curve,setCurve]=useState([0,1,1,2,3,4,2,0]);
 const [harmonyQuiz,setHarmonyQuiz]=useState(0);

 const {ri,chordTones}=harmony;
 const modeName=MODES[mode].n;

 // The player's own last four notes, or a plain shape to work with before
 // they have played anything.
 const motif=events.length
  ? events.slice(-4).map(e=>(e.midi%12+12)%12)
  : [ri,(ri+3)%12,(ri+5)%12,(ri+7)%12];

 const mutated=
  mutation==="RETROGRADE" ? [...motif].reverse() :
  mutation==="+1 SEMITONE" ? motif.map(x=>(x+1)%12) :
  mutation==="−1 SEMITONE" ? motif.map(x=>(x+11)%12) :
  mutation==="ALTER END" ? motif.map((x,i)=>i===motif.length-1?(x+2)%12:x) :
  motif;

 const spent=events.reduce((sum,e)=>sum+TENSION_COST[e.tension],0);

 const degree=(pitchClass:number)=>SHORT_NAMES[(pitchClass-ri+12)%12];

 return (
  <div className="osScreen advancedScreen">
   <div className="screenIntro">
    <span>Phase 5 · advanced improvisation laboratory</span>
    <h1 data-page-heading tabIndex={-1}>Design tension.<br/>Then survive it.</h1>
    <p>These laboratories turn advanced vocabulary into controlled musical behavior: preserve an idea, displace it, manage a budget, follow harmonic gravity and return on purpose.</p>
   </div>

   <div className="labTabs">
    {TABS.map(([id,title])=>(
     <button className={labMode===id?"active":""} key={id}
             onClick={()=>{setLabMode(id);setFeedback("")}}>{title}</button>
    ))}
   </div>

   {labMode==="motif"&&(
    <div className="labWorkspace">
     <article className="labBrief">
      <span>CAPTURE → MUTATE → RESOLVE</span>
      <h2>One idea. Many lives.</h2>
      <p>The most recent four detected notes become your source motif. Preserve enough contour or rhythm that the listener recognizes it after transformation.</p>
      <div className="motifNotes">
       {motif.map((pc,i)=><b key={i}>{N[pc]}<small>{degree(pc)}</small></b>)}
      </div>
      <button onClick={()=>play("source",motif)} aria-busy={playing==="source"}
              className={playing==="source"?"sounding":""}>
       {playing==="source"?"♪ SOUNDING":"▶ HEAR SOURCE"}
      </button>
     </article>
     <article className="mutationPanel">
      <span>Mutation engine</span>
      <div>{MUTATIONS.map(name=>(
       <button className={mutation===name?"active":""} key={name}
               onClick={()=>setMutation(name)}>{name}</button>
      ))}</div>
      <div className="motifNotes transformed">
       {mutated.map((pc,i)=><b key={i}>{N[pc]}<small>{degree(pc)}</small></b>)}
      </div>
      <button className={`labPrimary ${playing==="mutation"?"sounding":""}`}
              onClick={()=>play("mutation",[...mutated,ri])} aria-busy={playing==="mutation"}>
       {playing==="mutation"?"♪ SOUNDING":"HEAR MUTATION + RETURN"}
      </button>
      <p><b>MISSION:</b> original twice → mutation twice → alter final note → resolve to {N[ri]} without changing the pocket.</p>
     </article>
    </div>
   )}

   {labMode==="slip"&&(
    <div className="labWorkspace">
     <article className="labBrief">
      <span>Control time away</span>
      <h2>Side-slip machine.</h2>
      <p>Displace the entire home idea by semitone while its rhythmic identity remains intact. The longer the displacement, the stronger the return must be.</p>
      <div className="slipControls">
       <label>DIRECTION
        <select value={slip} onChange={e=>setSlip(+e.target.value)}>
         <option value="1">+1 semitone</option>
         <option value="-1">−1 semitone</option>
        </select>
       </label>
       <label>DURATION
        <select value={slipLength} onChange={e=>setSlipLength(+e.target.value)}>
         <option value="1">½ beat</option>
         <option value="2">1 beat</option>
         <option value="3">2 beats</option>
         <option value="4">1 bar</option>
        </select>
       </label>
      </div>
      <button onClick={()=>play("slip",[ri,(ri+3)%12,(ri+slip+12)%12,(ri+3+slip+12)%12,ri])}
              aria-busy={playing==="slip"} className={playing==="slip"?"sounding":""}>
       {playing==="slip"?"♪ SOUNDING":"▶ HEAR DEPARTURE"}
      </button>
     </article>
     <article className="slipTimeline">
      <span>Harmonic route</span>
      <div><b>Home</b><small>{N[ri]} {modeName}</small></div>
      <i>→</i>
      <div className="away"><b>{slip>0?"+1":"−1"}</b><small>{N[(ri+slip+12)%12]} {modeName}</small></div>
      <i>→</i>
      <div><b>Home</b><small>Land: {chordTones.map(n=>N[n]).join(" / ")}</small></div>
      <p>Departure window: <b>{SLIP_WINDOWS[slipLength]}</b>. Keep articulation and motif rhythm unchanged.</p>
      <button className="labPrimary" onClick={()=>onLoadIntoBand(slip)}>Load into responsive band</button>
     </article>
    </div>
   )}

   {labMode==="enclose"&&(
    <div className="labWorkspace">
     <article className="labBrief">
      <span>Target first</span>
      <h2>Enclosure generator.</h2>
      <p>Choose the destination before the decoration. Every path below surrounds a structural chord tone and lands it on the strong beat.</p>
      <div className="targetPicker">
       {[0,3,7,10].map(x=>(
        <button className={targetTone===x?"active":""} onClick={()=>setTargetTone(x)} key={x}>
         {N[(ri+x)%12]}<small>{SHORT_NAMES[x]}</small>
        </button>
       ))}
      </div>
     </article>
     <article className="enclosureRoutes">
      <span>GENERATED ROUTES → TARGET {N[(ri+targetTone)%12]}</span>
      {ENCLOSURES.map(([route,name],i)=>{
       const notes=route.map(x=>(ri+targetTone+x+12)%12);
       return (
        <button key={i} onClick={()=>play(`route${i}`,notes)}
                aria-busy={playing===`route${i}`}
                className={playing===`route${i}`?"sounding":""}>
         <b>{notes.map(pc=>N[pc]).join(" → ")}</b>
         <small>{name}</small>
         <em>{playing===`route${i}`?"♪ SOUNDING":"▶ HEAR"}</em>
        </button>
       );
      })}
      <p><b>APPLICATION RULE:</b> over eight bars, every third chord tone must be approached with a different enclosure. Do not alter the core groove.</p>
     </article>
    </div>
   )}

   {labMode==="voice"&&(
    <div className="voiceLab">
     <article>
      <span>Local gravity</span>
      <h2>Dm7 → G7 → Cmaj7</h2>
      <p>Build the destination skeleton first. Chromaticism is allowed only after the shortest meaningful paths are audible.</p>
     </article>
     <div className="voiceRoute">
      <div><small>Dm7</small><b>F · C</b><span>3 · ♭7</span></div>
      <i>F holds<br/>C → B</i>
      <div><small>G7</small><b>B · F</b><span>3 · ♭7</span></div>
      <i>B holds<br/>F → E</i>
      <div><small>Cmaj7</small><b>E · B</b><span>3 · 7</span></div>
     </div>
     <div className="voiceLevels">
      {VOICE_LEVELS.map(([name,rule],i)=>(
       <button key={name}
               onClick={()=>setFeedback(`Level ${i+1}: ${rule}. Record 8 choruses; pass 7 clean destination maps.`)}>
        <b>0{i+1}</b><span>{name}</span><small>{rule}</small>
       </button>
      ))}
     </div>
     {feedback&&<p className="labFeedback">{feedback}</p>}
     <button className={`labPrimary ${playing==="guide"?"sounding":""}`}
            onClick={()=>play("guide",[5,0,11,5,4,11])} aria-busy={playing==="guide"}>
     {playing==="guide"?"♪ SOUNDING":"▶ HEAR GUIDE-TONE SKELETON"}
    </button>
    </div>
   )}

   {labMode==="tension"&&(
    <div className="tensionLab">
     <article className="labBrief">
      <span>Tension curve designer</span>
      <h2>Draw the story before you play it.</h2>
      <p>Click each bar to set harmonic intensity. Then record a take and compare the planned architecture with detected tension events.</p>
      <label className="budgetControl">Tension budget <b>{tensionBudget} POINTS</b>
       <input type="range" min="4" max="40" value={tensionBudget}
              onChange={e=>setTensionBudget(+e.target.value)}/>
      </label>
     </article>
     <div className="curveDesigner">
      {curve.map((v,i)=>(
       <button key={i} onClick={()=>setCurve(curve.map((x,j)=>j===i?(x+1)%5:x))}>
        <span>BAR {i+1}</span>
        <i><em style={{height:`${18+v*18}%`}}/></i>
        <b>{CURVE_STEPS[v]}</b>
       </button>
      ))}
     </div>
     <div className="budgetReadout">
      <div><small>Planned peak</small><b>{Math.max(...curve)===4?"Climax":"Controlled"}</b></div>
      <div><small>Take cost</small><b className={spent>tensionBudget?"over":""}>{spent} / {tensionBudget}</b></div>
      <div><small>Events captured</small><b>{events.length}</b></div>
      <button className="labPrimary" onClick={recording?onEndTake:onBeginTake}>
       {recording?"■ END & SCORE":"● RECORD TENSION ARC"}
      </button>
     </div>
     <p className="tensionLegend">HOME 0 · COLOUR 1 · MILD TENSION 2 · OUTSIDE 4. Budget is not a value judgment, it trains deliberate density.</p>
    </div>
   )}

   {labMode==="diagnose"&&(()=>{
    const situation=HARMONY_CASES[harmonyQuiz];
    const answer=(choice:string)=>setFeedback(
     situation.a===choice?`CORRECT, ${situation.why}`:`NOT THIS TIME, ${situation.why}`
    );
    return (
     <div className="diagnosisLab">
      <article>
       <span>SHOULD I THINK MODALLY?</span>
       <h2>{situation.p}</h2>
       <p>Diagnose the harmonic situation before improvising. The right mental model changes what counts as home, movement and resolution.</p>
       <div>
        <button onClick={()=>answer("MODAL")}>Modal</button>
        <button onClick={()=>answer("FUNCTIONAL")}>Functional</button>
        <button onClick={()=>answer("HYBRID")}>Hybrid</button>
       </div>
       {feedback&&<p className={feedback.startsWith("CORRECT")?"correct":""}>{feedback}</p>}
       <button className="nextCase"
               onClick={()=>{setHarmonyQuiz((harmonyQuiz+1)%HARMONY_CASES.length);setFeedback("")}}>
        NEXT HARMONIC SITUATION →
       </button>
      </article>
      <aside>
       <span>Decision lens</span>
       <div><b>Static</b><p>Develop mode, colour, rhythm and motif over one centre.</p></div>
       <div><b>Directional</b><p>Track guide tones, dominant pull and nearest destinations.</p></div>
       <div><b>Mixed</b><p>Preserve a larger home while honoring temporary chord gravity.</p></div>
      </aside>
     </div>
    );
   })()}
  </div>
 );
}

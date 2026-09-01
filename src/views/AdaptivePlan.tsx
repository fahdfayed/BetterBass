import {NOTE_NAMES as N} from "../pitch";

const AXES=["HEAR","SEE","KNOW","PLAY","CREATE"];

/** The five baseline questions, one per axis, in AXES order. */
const DIAGNOSTIC=[
 {domain:"Hear",ask:"Can you identify function before seeing the fretboard?",
  how:"An A drone sounds. Imagine ten random tones: identify inside/outside, interval and best destination."},
 {domain:"Know",ask:"Can you explain why tension resolves?",
  how:"Over Am7, classify D♯ as an approach, enclosure component, side-slip colour or unresolved tension according to context."},
 {domain:"SEE",ask:"Can you locate functions across the entire neck?",
  how:"Find the ♭3, 6 and ♭7 of three random roots below fret 5 and above fret 12."},
 {domain:"Play",ask:"Can you preserve time while harmony changes?",
  how:"Play 16 bars: chord tones, modal colour, chromatic approach, then home, without changing the pocket."},
 {domain:"Create",ask:"Can you create rather than run a memorized shape?",
  how:"Develop one three-note motif, displace it rhythmically, move it outside by semitone and resolve it."},
];

/** What each honest answer is worth, and what it is called. */
const SELF_REPORT:[string,string,number][]=[
 ["NOT RELIABLE","Below 60%",45],
 ["USABLE","60-75%",68],
 ["STRONG","76-89%",82],
 ["AUTOMATIC","90%+",94],
];

const BOTTLENECKS=[
 "hearing function","full-neck visualization","harmonic explanation",
 "execution under pressure","spontaneous creation",
];

/** Skills that decay, with how far along each one is. */
const DEBT:[string,number][]=[
 ["Phrygian recognition",74],["E♭ fretboard",58],["Enclosures",66],
 ["5/4 pocket",49],["High register",43],
];

/** Days since review beyond which a skill is treated as owed, not held. */
const REVIEW_DUE=14;

const LADDER:[string,string,number][]=[
 ["Dorian colour","Automatic",96],
 ["Chromatic approach","Musical",84],
 ["Enclosures","Playable",72],
 ["Side-slip","Understood",61],
 ["Superimposition","Learned",43],
 ["Free outside","Unknown",18],
];

type Props={
 /** False until the baseline diagnostic has been answered. */
 ready:boolean;
 /** Which diagnostic question is showing, 0 to 4. */
 step:number;
 /** Score out of 100 on each axis, in AXES order. */
 freedom:number[];
 /** Days since each debt item was last reviewed, in DEBT order. */
 reviewDays:number[];
 /** Outside-control transfer per key, indexed by pitch class. */
 keyMatrix:number[];
 antiHabit:boolean;
 onAnswer:(score:number)=>void;
 onPractiseKey:(pitchClass:number)=>void;
 onAntiHabit:(on:boolean)=>void;
 onGenerate:()=>void;
 onRetake:()=>void;
};

/**
 * The curriculum rebuilt from evidence.
 *
 * The 28-week spine does not move; what moves is the order it is met in. Every
 * figure here comes from something the player did — a recorded take, a key
 * they have avoided, a skill that has gone quiet — rather than from hours
 * logged, which measures attendance instead of ability.
 */
export default function AdaptivePlan(
 {ready,step,freedom,reviewDays,keyMatrix,antiHabit,
  onAnswer,onPractiseKey,onAntiHabit,onGenerate,onRetake}:Props
){
 const weakest=freedom.indexOf(Math.min(...freedom));
 const lowest=Math.min(...freedom);
 const stage=lowest>85?"Free improviser":lowest>72?"Inside / outside player":"Tension-aware player";
 const question=DIAGNOSTIC[step];

 return (
  <div className="osScreen">
   <div className="screenIntro">
    <h1 data-page-heading tabIndex={-1}>Train the player<br/>who showed up.</h1>
    <p>The curriculum preserves the manual’s 28-week spine, but today’s route is rebuilt from current evidence: recorded takes, neglected keys, mastery decay, recurring habits and jury scores.</p>
   </div>

   {!ready ? (
    <div className="diagnosticFlow">
     <div className="diagProgress">
      <span>Baseline diagnostic</span>
      {DIAGNOSTIC.map((_,i)=><i className={i<step?"done":i===step?"active":""} key={i}/>)}
     </div>
     <article>
      <h2>{question.ask}</h2>
      <p>{question.how}</p>
      <div className="diagChoices">
       {SELF_REPORT.map(([name,band,score])=>(
        <button key={name} onClick={()=>onAnswer(score)}>{name}<small>{band}</small></button>
       ))}
      </div>
      <small className="diagNote">Recorded Listening Engine evidence is blended into PLAY and CREATE. Self-report only establishes the initial baseline.</small>
     </article>
    </div>
   ) : (
    <>
     <div className="adaptiveOverview">
      <article className="computedFreedom">
       <span>Computed freedom score</span>
       <div>{AXES.map((axis,i)=>(
        <div key={axis}>
         <b>{freedom[i]}</b><span>{axis}</span>
         <i><em style={{width:`${freedom[i]}%`}}/></i>
        </div>
       ))}</div>
       <p>Primary bottleneck: <b>{BOTTLENECKS[weakest]}</b>. This receives the largest block today.</p>
      </article>
      <article className="readiness">
       <h2>{stage}</h2>
       <div><b>{Math.round(freedom.reduce((a,b)=>a+b,0)/AXES.length)}</b><small>Overall</small></div>
       <p>Scores are calculated from diagnostic evidence, take analysis and cross-key transfer, not hours practiced.</p>
      </article>
     </div>

     <div className="adaptGrid">
      <article className="practiceDebt">
       <span>Practice debt · auto-scheduled</span>
       {DEBT.map(([skill,held],i)=>{
        const days=reviewDays[i];
        return (
         <div key={skill}>
          <span className={days>REVIEW_DUE?"urgent":""}>{days}d</span>
          <div><b>{skill}</b><i><em style={{width:`${held}%`}}/></i></div>
          <small>{days>REVIEW_DUE?"Review due":"Maintain"}</small>
         </div>
        );
       })}
      </article>
      <article className="masteryLadder">
       <span>Mastery is not complete / incomplete</span>
       {LADDER.map(([skill,level,held])=>(
        <div key={skill}>
         <b>{skill}</b><i><em style={{width:`${held}%`}}/></i><span>{level}</span>
        </div>
       ))}
      </article>
     </div>

     <div className="matrixBlock">
      <header>
       <div><h2>The truth about “I know this.”</h2></div>
       <p>Outside-control transfer is strongest in A, G and C. F♯, D♭ and A♭ are automatically weighted into the next seven sessions.</p>
      </header>
      <div className="adaptiveMatrix">
       {N.map((note,i)=>(
        <button key={note} onClick={()=>onPractiseKey(i)}>
         <b>{note}</b>
         {/* Never fully transparent: a key at zero still has to be readable. */}
         <span style={{opacity:.35+keyMatrix[i]/150}}>{keyMatrix[i]}</span>
         <small>{keyMatrix[i]>=80?"Strong":keyMatrix[i]>=60?"Usable":"Debt"}</small>
        </button>
       ))}
      </div>
     </div>

     <div className="antiHabit">
      <div>
       <h2>Break the patterns you hide inside.</h2>
       <p>71% of phrases start on beat 1 · 63% begin on root · 84% of fills ascend · 79% E/A string bias.</p>
      </div>
      <label>
       <input type="checkbox" checked={antiHabit} onChange={e=>onAntiHabit(e.target.checked)}/>
       <i/>
       <span>{antiHabit?"ACTIVE, comfort rules banned":"Activate anti-habit mode"}</span>
      </label>
     </div>

     <div className="adaptiveAction">
      <div>
       <span>Next session logic</span>
       <p>Weakest Freedom axis + weakest key + oldest debt + one anti-habit + five-minute boss fight.</p>
      </div>
      <button onClick={onGenerate}>Generate today from evidence</button>
      <button onClick={onRetake}>Retake diagnostic</button>
     </div>
    </>
   )}
  </div>
 );
}

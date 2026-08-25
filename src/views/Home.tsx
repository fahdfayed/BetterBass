import Icon from "../components/Icon";
import {goToView} from "../router";

type Props={
 percent:number;
 completed:number;
 lesson:{index:number;total:number;unit:number;title:string;outcome:string;duration:number};
 stage:{index:number;names:string[]};
 flow:Array<{n:string;name:string;minutes:number;task:string}>;
 units:Array<{n:number;title:string;subtitle:string;range:number[]}>;
 onOpenLesson:()=>void;
 onOpenUnit:(lessonIndex:number)=>void;
};

const QUICK=[
 {view:"runtime",icon:"band",title:"Play with the band",blurb:"Backing tracks, progressions and tempo"},
 {view:"coach",icon:"coach",title:"Use the live coach",blurb:"Listen, detect and correct your take"},
 {view:"maqam",icon:"maqam",title:"Practise a maqam",blurb:"Sayr, hand routes and backing"},
 {view:"slap",icon:"slap",title:"Train slap bass",blurb:"Beginner through advanced routines"},
] as const;

/** Circumference of the r=52 progress ring, so the dash offset can be derived. */
const RING=2*Math.PI*52;

export default function Home({percent,completed,lesson,stage,flow,units,onOpenLesson,onOpenUnit}:Props){
 // The four flow blocks map onto six lesson stages, so two stages share a block.
 const flowPosition=Math.min(flow.length-1,Math.floor(stage.index/1.5));

 return (
  <>
   <header className="homeHero rise">
    <div className="homeHeroText">
     <span className="eyebrow">Outside In · Bass learning studio</span>
     <h1 className="display" data-page-heading tabIndex={-1}>
      Your next step is <span className="gradientText">ready</span>.
     </h1>
     <p className="lede">
      Continue the course, start a hands-free routine, or open a focused tool.
      Everything else can wait.
     </p>
    </div>

    <div className="progressRing" role="img" aria-label={`${percent}% of the course complete`}>
     <svg viewBox="0 0 120 120">
      <circle className="ringTrack" cx="60" cy="60" r="52"/>
      <circle
       className="ringValue"
       cx="60" cy="60" r="52"
       style={{strokeDasharray:RING,strokeDashoffset:RING-(RING*percent)/100}}
      />
     </svg>
     <div className="ringLabel">
      <b className="mono">{percent}<i>%</i></b>
      <span className="eyebrow">Complete</span>
     </div>
    </div>
   </header>

   <section className="homeFocus">
    <article className="card lit homeLesson rise d1">
     <div className="homeLessonTop">
      <span className="chip accent">Next lesson</span>
      <span className="chip mono">{lesson.duration} min</span>
     </div>
     <span className="eyebrow">Unit {lesson.unit} · Lesson {lesson.index+1} of {lesson.total}</span>
     <h2>{lesson.title}</h2>
     <p className="muted">{lesson.outcome}</p>

     <ol className="stageRail" aria-label="Lesson stages">
      {stage.names.map((name,index)=>(
       <li key={name} className={index<stage.index?"done":index===stage.index?"active":""}>
        <i aria-hidden="true">{index<stage.index?"✓":index+1}</i>
        <span>{name}</span>
       </li>
      ))}
     </ol>

     <button className="btn primary sheen homeLessonGo" onClick={onOpenLesson}>
      {stage.index?"Continue lesson":"Start lesson"} <span className="arrow">→</span>
     </button>
    </article>

    <aside className="card homeHandsFree rise d2">
     <div className="orb" aria-hidden="true"><Icon name="practice"/><i/><i/><i/></div>
     <span className="eyebrow">Hands-free practice</span>
     <h2>Touch once. Keep both hands on the bass.</h2>
     <p className="muted">
      Choose the time and blocks before you begin. Spoken cues, timers,
      corrections and transitions then run automatically.
     </p>
     <ul className="ticks">
      <li>Choose 10, 25, 45 or 90 minutes</li>
      <li>Skip any block before starting</li>
      <li>Live listening and automatic feedback</li>
     </ul>
     <button className="btn" onClick={()=>goToView("practice")}>
      Set up a routine <span className="arrow">→</span>
     </button>
    </aside>
   </section>

   <section className="homeSection reveal">
    <header className="sectionHead">
     <div>
      <span className="eyebrow">How today's lesson flows</span>
      <h2>Four blocks, one clear finish line.</h2>
     </div>
     <button className="btn ghost" onClick={onOpenLesson}>Open lesson <span className="arrow">→</span></button>
    </header>
    <ol className="flowTrack stagger">
     {flow.map((block,index)=>{
      const state=index===flowPosition?"current":index<flowPosition?"done":"later";
      return (
       <li key={block.n} className={`card flowBlock ${state}`}>
        <div className="flowTop">
         <i className="mono">{block.n}</i>
         <span>{block.name}</span>
         <b className="mono">{block.minutes} min</b>
        </div>
        <p className="muted">{block.task}</p>
        <span className={`chip ${state==="current"?"accent":""}`}>
         {state==="current"?"Up next":state==="done"?"Done":"Later"}
        </span>
       </li>
      );
     })}
    </ol>
   </section>

   <section className="homeSection reveal">
    <header className="sectionHead">
     <div>
      <span className="eyebrow">Quick start</span>
      <h2>Go straight to the work you need.</h2>
     </div>
    </header>
    <div className="quickGrid stagger">
     {QUICK.map(item=>(
      <button key={item.view} className="card interactive lit quickTile" onClick={()=>goToView(item.view)}>
       <Icon name={item.icon}/>
       <span><b>{item.title}</b><small>{item.blurb}</small></span>
       <em className="arrow" aria-hidden="true">→</em>
      </button>
     ))}
    </div>
   </section>

   <section className="homeSection reveal">
    <header className="sectionHead">
     <div>
      <span className="eyebrow">Your course</span>
      <h2>Six connected units.</h2>
     </div>
     <button className="btn ghost" onClick={()=>goToView("roadmap")}>
      See all {lesson.total} lessons <span className="arrow">→</span>
     </button>
    </header>
    <div className="unitGrid stagger">
     {units.map(unit=>{
      const total=unit.range[1]-unit.range[0]+1;
      const done=Math.max(0,Math.min(total,completed-unit.range[0]));
      const locked=unit.range[0]>completed;
      const state=unit.n===lesson.unit?"active":done===total?"complete":locked?"locked":"";
      return (
       <button
        key={unit.n}
        className={`card interactive unitCard ${state}`}
        style={{"--accent":`var(--unit-${unit.n})`} as React.CSSProperties}
        onClick={()=>{if(!locked)onOpenUnit(Math.max(unit.range[0],Math.min(completed,unit.range[1])))}}
        disabled={locked}
        aria-label={`Unit ${unit.n}: ${unit.title}. ${done} of ${total} lessons complete.${locked?" Locked.":""}`}
       >
        <div className="unitTop">
         <i aria-hidden="true">{done===total?"✓":unit.n}</i>
         <em className="mono">{done}/{total}</em>
        </div>
        <b>{unit.title}</b>
        <small>{unit.subtitle}</small>
        <div className="meter"><span style={{width:`${(done/total)*100}%`}}/></div>
       </button>
      );
     })}
    </div>
   </section>
  </>
 );
}

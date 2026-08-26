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

const ELSEWHERE=[
 {view:"runtime",icon:"band",label:"Play with the band",note:"Vamps, progressions, tempo"},
 {view:"coach",icon:"coach",label:"Live coach",note:"Listen, detect, correct"},
 {view:"maqam",icon:"maqam",label:"Arabic maqam",note:"Sayr and hand routes"},
 {view:"slap",icon:"slap",label:"Slap bass",note:"Beginner to advanced"},
] as const;

/**
 * Home states one thing loudly — the next lesson — and lists everything else
 * quietly beneath it. No panels: sections are separated by air and a hairline,
 * and every secondary destination is a row that lights up under the cursor.
 */
export default function Home({percent,completed,lesson,stage,flow,units,onOpenLesson,onOpenUnit}:Props){
 const here=Math.min(flow.length-1,Math.floor(stage.index/1.5));

 return (
  <>
   <header className="lede-block">
    <span className="label rise">Unit {lesson.unit} · Lesson {lesson.index+1} of {lesson.total}</span>
    <h1 className="display rise d1" data-page-heading tabIndex={-1}>{lesson.title}</h1>
    <p className="lead rise d2">{lesson.outcome}</p>

    <div className="lede-act rise d3">
     <button className="action-primary" onClick={onOpenLesson}>
      {stage.index?"Continue":"Begin"} <span className="caret" aria-hidden="true">→</span>
     </button>
     <span className="dim mono">{lesson.duration} min · {stage.names[stage.index]}</span>
    </div>

    <div className="lede-meter rise d4">
     <div className="meter"><span style={{width:`${percent}%`}}/></div>
     <span className="label">{completed} of {lesson.total} passed</span>
    </div>
   </header>

   <section className="band reveal">
    <div className="band-head">
     <h2 className="label">Today</h2>
     <button className="action action-quiet" onClick={onOpenLesson}>
      Open lesson <span className="caret" aria-hidden="true">→</span>
     </button>
    </div>
    <ol className="rows stagger">
     {flow.map((block,index)=>(
      <li key={block.n}>
       <button
        className={`row flow-row ${index===here?"is-current":""} ${index<here?"is-done":""}`}
        onClick={onOpenLesson}
       >
        <span className="figure row-n">{block.n}</span>
        <span className="row-main">
         <b>{block.name}</b>
         <small className="dim">{block.task}</small>
        </span>
        <span className="row-end mono dim">{block.minutes}m</span>
       </button>
      </li>
     ))}
    </ol>
   </section>

   <section className="band reveal">
    <h2 className="label band-head">Elsewhere</h2>
    <ol className="rows stagger">
     {ELSEWHERE.map(item=>(
      <li key={item.view}>
       <button className="row" onClick={()=>goToView(item.view)}>
        <span className="row-icon"><Icon name={item.icon}/></span>
        <span className="row-main">
         <b>{item.label}</b>
         <small className="dim">{item.note}</small>
        </span>
        <span className="caret row-end dim" aria-hidden="true">→</span>
       </button>
      </li>
     ))}
    </ol>
   </section>

   <section className="band reveal">
    <div className="band-head">
     <h2 className="label">The course</h2>
     <button className="action action-quiet" onClick={()=>goToView("roadmap")}>
      All {lesson.total} lessons <span className="caret" aria-hidden="true">→</span>
     </button>
    </div>
    <ol className="rows stagger">
     {units.map(unit=>{
      const total=unit.range[1]-unit.range[0]+1;
      const done=Math.max(0,Math.min(total,completed-unit.range[0]));
      const locked=unit.range[0]>completed;
      return (
       <li key={unit.n}>
        <button
         className={`row unit-row ${unit.n===lesson.unit?"is-current":""}`}
         disabled={locked}
         onClick={()=>{if(!locked)onOpenUnit(Math.max(unit.range[0],Math.min(completed,unit.range[1])))}}
        >
         <span className="figure row-n">{String(unit.n).padStart(2,"0")}</span>
         <span className="row-main">
          <b>{unit.title}</b>
          <small className="dim">{unit.subtitle}</small>
         </span>
         <span className="unit-progress">
          <span className="meter"><span style={{width:`${(done/total)*100}%`}}/></span>
          <span className="mono dim">{done}/{total}</span>
         </span>
        </button>
       </li>
      );
     })}
    </ol>
   </section>
  </>
 );
}

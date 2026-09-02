import Glyph from "../components/Glyph";
import Icon from "../components/Icon";
import {Fragment} from "react";
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

/** Rehearsal letters, as a conductor gives them. I is skipped: it reads as a 1. */
const MARKS=["A","B","C","D","E","F","G","H","J","K","L","M"];

const PREVIEW_FRETS=[5,6,7,8,9,10];
const PREVIEW_NECK:Array<{string:string;dots:Record<number,[string,string]>}>=[
 {string:"G",dots:{5:["C","guide"],9:["E","chord"]}},
 {string:"D",dots:{5:["G","guide"],7:["A","root"],9:["B","colour"]}},
 {string:"A",dots:{7:["E","chord"],10:["G","guide"]}},
 {string:"E",dots:{5:["A","root"],7:["B","colour"]}},
];

function NeckPreview(){
 return (
  <div className="neckPreview">
   <p className="neckPreviewChord"><b>Am9</b><span>going to D13</span></p>
   <div className="neckGrid">
    <span className="neckFretNo"/>
    {PREVIEW_FRETS.map(fret=><span className="neckFretNo" key={fret}>{fret}</span>)}
    {PREVIEW_NECK.map(row=>(
     <Fragment key={row.string}>
      <span className="neckOpen">{row.string}</span>
      {PREVIEW_FRETS.map(fret=>{
       const dot=row.dots[fret];
       return (
        <span key={fret}>
         {dot&&<span className="neckDot" data-role={dot[1]}>{dot[0]}</span>}
        </span>
       );
      })}
     </Fragment>
    ))}
   </div>
   <p className="neckKey">
    <span><i className="is-root"/>Root</span>
    <span><i className="is-guide"/>Guide tone</span>
    <span><i/>Chord tone</span>
    <span><i/>Colour</span>
   </p>
  </div>
 );
}

const ELSEWHERE=[
 {view:"runtime",icon:"band",label:"Play with the band",note:"Vamps, progressions, tempo"},
 {view:"coach",icon:"coach",label:"Live coach",note:"Listen, detect, correct"},
 {view:"maqam",icon:"maqam",label:"Arabic maqam",note:"Sayr and hand routes"},
 {view:"slap",icon:"slap",label:"Slap bass",note:"Beginner to advanced"},
] as const;

/**
 * Home is one branded product statement first, then the session underneath.
 * The fretboard is not decoration: it demonstrates the central Outside In
 * claim by showing what each note is doing against the harmony.
 */
export default function Home({percent:_,completed,lesson,stage,flow,units,onOpenLesson,onOpenUnit}:Props){
 const here=Math.min(flow.length-1,Math.floor(stage.index/1.5));

 return (
  <>
   <section className="productHero" aria-labelledby="outside-in-title">
    <div className="productHeroCopy">
     {/*
       * One heading, two voices. DESIGN.md pins the signature as "Playfair
       * Display italic and Inter alternating inside a single heading, the
       * first clause set and the second stated" — and the home page, which is
       * the only screen that exists to make the argument, was the one place
       * not using it. It shouted a name a first-time visitor has no reason to
       * know at 128px and stated the differentiator underneath at 32px.
       *
       * Both strings are unchanged. They are one statement now instead of two
       * competing ones, so the page has a single peak and the thing worth
       * reading is the thing that is loud.
       */}
     <h1 id="outside-in-title" className="productHeroStatement" data-page-heading tabIndex={-1}>
      <span className="heroVoiceSet rise d1">Outside In</span>
      <span className="heroVoiceStated rise d2">Progression first. Scale second.</span>
     </h1>
     <p className="productHeroSupport rise d3">
      See what every note is doing against the chord you are on and the one you are moving toward.
     </p>
     <div className="productHeroActions rise d4">
      <button className="action-primary" onClick={onOpenLesson}>
       {stage.index?"Continue":"Begin"} lesson
      </button>
     </div>
    </div>

    <div className="productHeroVisual" aria-hidden="true">
     <NeckPreview/>
    </div>
   </section>

   <section className="band reveal">
    <div className="band-head">
     <h2 className="label">Today</h2>
     <button className="action action-quiet" onClick={onOpenLesson}>
      Open lesson <svg className="caret" viewBox="0 0 12 12" width="9" height="9" aria-hidden="true"><path d="M2 1 10 6 2 11Z" fill="currentColor"/></svg>
     </button>
    </div>
    <ol className="chartRows" data-register="chart">
     {flow.map((block,index)=>{
      const last=index===flow.length-1;
      return (
       <li key={block.n} className="system">
        <span className="systemMark">
         {last
          ? <Glyph name="coda" label="Coda"/>
          : <span
             className="rehearsalMark"
             data-current={index===here?"true":undefined}
             data-done={index<here?"true":undefined}
            >{MARKS[index]??block.n}</span>}
        </span>
        <button
         className={`systemBody chartRow ${index===here?"is-current":""} ${index<here?"is-done":""}`}
         onClick={onOpenLesson}
        >
         <span className="chartRowMain">
          <b>{block.name}</b>
          <small className="marginNote">{block.task}</small>
         </span>
         <span className="repeatCount">
          <Glyph name="repeatBoth"/>
          <span>{block.minutes}</span>
          <span className="times">min</span>
         </span>
        </button>
       </li>
      );
     })}
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
      All {lesson.total} lessons <svg className="caret" viewBox="0 0 12 12" width="9" height="9" aria-hidden="true"><path d="M2 1 10 6 2 11Z" fill="currentColor"/></svg>
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
import SpotlightHero from "../components/SpotlightHero";
import ContainerScroll from "../components/ui/container-scroll-animation";
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

/**
 * The neck the landing panel tilts up: A minor 9, with what each note is doing.
 *
 * Not a decorative graphic and not a screenshot. It is the product's actual
 * claim in one glance, which is that a note has a job here rather than a
 * permission. Roles and positions are real: fifth to tenth fret, standard
 * tuning, with the root on the A string and the guide tones a player would
 * actually reach for.
 */
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
    <span><i className="is-guide"/>Guide tone, the note that names the chord</span>
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
 * Home states one thing loudly — the next lesson — and lists everything else
 * quietly beneath it. No panels: sections are separated by air and a hairline,
 * and every secondary destination is a row that lights up under the cursor.
 */
/**
 * Hero imagery, served from this origin.
 *
 * Still the brief's own subject, rock strata, and still placeholders: the
 * spotlight wants two photographs of the same frame that differ in some
 * meaningful way, which for this product would be a neck lit two ways or the
 * same bar written two ways. Replace both files and nothing else changes.
 *
 * They are local rather than hotlinked for the same reason the typefaces are.
 * External images are blocked outright here (img-src 'self' data: blob:), so
 * the hotlinked version renders a black rectangle, and the design system's own
 * rules already refuse third-party CDNs.
 */
const HERO_BASE="/hero/hero-base.webp";
const HERO_REVEAL="/hero/hero-reveal.webp";

export default function Home({percent,completed,lesson,stage,flow,units,onOpenLesson,onOpenUnit}:Props){
 const here=Math.min(flow.length-1,Math.floor(stage.index/1.5));

 return (
  <>
   {/*
     * PLACEHOLDER IMAGERY. These two URLs came with the design brief and are
     * geology photographs, which is the wrong subject for this product. The
     * mechanic and the composition are right; the pictures need replacing with
     * something of an instrument. Swap both constants and nothing else changes.
     */}
   <SpotlightHero base={HERO_BASE} reveal={HERO_REVEAL}>
    <div className="heroHead">
     <h1 data-page-heading tabIndex={-1}>
      <span className="heroLineSerif hero-anim hero-reveal" style={{animationDelay:"0.25s"}}>
       Progression first.
      </span>
      <span className="heroLineSans hero-anim hero-reveal" style={{animationDelay:"0.42s"}}>
       Scale second.
      </span>
     </h1>
    </div>

    <div className="heroNoteLeft hero-anim hero-fade" style={{animationDelay:"0.7s"}}>
     <p>
      The neck shows what every note is doing against the chord you are on and
      the one you are going to, so the answer changes when the harmony does.
     </p>
    </div>

    <div className="heroNoteRight hero-anim hero-fade" style={{animationDelay:"0.85s"}}>
     <p>
      {lesson.outcome}
     </p>
     <button className="action-primary" onClick={onOpenLesson}>
      {stage.index?"Continue":"Begin"} lesson {lesson.index+1}
     </button>
     <span className="fineprint">
      {lesson.duration} min · {stage.names[stage.index]} · {completed} of {lesson.total} passed
     </span>
    </div>
   </SpotlightHero>

   <ContainerScroll
    title={
     <>
      <h2>A note is not <em>allowed</em>. It has a job.</h2>
      <p>
       Every other diagram shows you which notes fit. This one shows you what
       each one is doing, and where the line has to arrive next.
      </p>
     </>
    }
   >
    <NeckPreview/>
   </ContainerScroll>

   <section className="band reveal">
    <div className="band-head">
     <h2 className="label">Today</h2>
     <button className="action action-quiet" onClick={onOpenLesson}>
      Open lesson <svg className="caret" viewBox="0 0 12 12" width="9" height="9" aria-hidden="true"><path d="M2 1 10 6 2 11Z" fill="currentColor"/></svg>
     </button>
    </div>
    {/*
      * The session read as a chart. Each block takes a rehearsal letter in the
      * left margin, the way a player is told to take it from B, and the last
      * one is the coda: it is the thing the session is for, and on paper the
      * coda is where the chart resolves. The numbers the blocks carried before
      * were a list index wearing a serif; a letter is how the instruction is
      * actually given in a room.
      */}
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

import type {ReactNode} from "react";

type Props={
 lesson:{index:number;total:number;title:string;unit:number;outcome:string;duration:number};
 stageIndex:number;
 stageNames:string[];
 /** Highest stage reached, so the rail can show what is still ahead. */
 stageReached:number;
 guide:{title:string;body:string;finish:string};
 onStage:(index:number)=>void;
 onAdvance:()=>void;
 advanceLabel:string;
 canAdvance:boolean;
 blockedReason?:string;
 onPrevLesson:()=>void;
 onNextLesson:()=>void;
 hasPrev:boolean;
 hasNext:boolean;
 /** What to read. */
 instruction:ReactNode;
 /** What to do it with — the tool bound to this stage. */
 workspace:ReactNode;
 workspaceLabel:string;
};

const rehearsalLetter=(index:number)=>String.fromCharCode(65+(index%26));

/**
 * The lesson as a workspace rather than a document.
 *
 * The instruction and the instrument sit side by side, the way a kata sits
 * beside its editor. Before this, every stage told you to go and use a tool and
 * then navigated you away from the thing you were reading — which meant losing
 * the task the moment you went to do it.
 */
export default function LessonWorkspace({
 lesson,stageIndex,stageNames,stageReached,guide,onStage,onAdvance,advanceLabel,
 canAdvance,blockedReason,onPrevLesson,onNextLesson,hasPrev,hasNext,
 instruction,workspace,workspaceLabel,
}:Props){

 /*
  * A new lesson turns the page, and that turn is the shell's: the lesson is in
  * the address, so the route-level leaf goes over the whole working page. A
  * stage change is not a new page — it is the same page saying the next thing
  * — so it re-enters rather than turning.
  */
 return (
  <div className="lessonShell">
   {/*
     * The head of the page, set the way a system is headed: the stage struck
     * as a numeral at the start of a stave, and the stage's name stamped on
     * it. It heads the whole page now rather than one pane of it.
     */}
   <header className="stageHead">
    <b className="stageNumeral" aria-hidden="true">{String(stageIndex+1).padStart(2,"0")}</b>
    <i className="stageHeadStave" aria-hidden="true"/>
    <span className="label stageHeadName">{stageNames[stageIndex]}</span>
   </header>

   <h1 className="lessonTitle" data-page-heading tabIndex={-1}>{lesson.title}</h1>

   <p className="lessonMeter">
    <b className="lessonMeterNow">{String(lesson.index).padStart(2,"0")}</b>
    <span className="lessonMeterTotal">/ {lesson.total}</span>
    <span className="lessonMeterRule" aria-hidden="true">
     <i style={{width:`${Math.round((lesson.index/lesson.total)*100)}%`}}/>
    </span>
    <span className="sr">Lesson {lesson.index} of {lesson.total}</span>
    <span className="lessonMeterStep">
     <button type="button" className="tStep" onClick={onPrevLesson} disabled={!hasPrev} aria-label="Previous lesson">
      <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 2 3.5 6l4 4"/></svg>
     </button>
     <span className="lessonMeterMins">{lesson.duration} min</span>
     <button type="button" className="tStep" onClick={onNextLesson} disabled={!hasNext} aria-label="Next lesson">
      <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 2l4 4-4 4"/></svg>
     </button>
    </span>
   </p>

   <nav className="stageTabs" aria-label="Lesson stages">
    {stageNames.map((name,index)=>{
     const state=index<stageReached?"done":index===stageIndex?"active":"ahead";
     return (
      <button
       key={name}
       className={`stageTab ${state}`}
       aria-current={index===stageIndex?"step":undefined}
       onClick={()=>onStage(index)}
      >
       <i
        className="rehearsalMark"
        data-current={index===stageIndex?"true":undefined}
        data-done={index<stageReached?"true":undefined}
        aria-hidden="true"
       >{rehearsalLetter(index)}</i>
       <span>{name}</span>
      </button>
     );
    })}
   </nav>

   {/*
     * One column, and the instrument gets the page.
     *
     * This replaced a two-pane split. The split was the right idea in the
     * wrong container: the panes lived inside the working page, which lives
     * inside the book, which lies on the stand, so by the time the neck was
     * measured it had about five hundred pixels and twenty-one frets to draw
     * in them. Every fix was a way of making something too small slightly less
     * too small.
     *
     * Stacked, nothing competes. The brief reads at a proper measure, the
     * instrument spans the whole page, and the one thing the split existed to
     * protect -- not losing the task the moment you go and do it -- is carried
     * by the strip between them, which stays put while you work.
     */}
   <section className="lessonBrief stageSwap" key={stageIndex} aria-label="This stage">
    <h2>{guide.title}</h2>
    <p className="dim">{guide.body}</p>
   </section>

   {/*
     * The task, and it does not scroll away.
     *
     * Sticky at the head of the page: the stage you are on, what counts as
     * done, and the one control that says you did it. While both hands are on
     * the instrument this is the only part of the lesson a player needs in
     * view, which is exactly why it is the part that stays.
     */}
   <div className="taskStrip">
    <span className="taskMark" aria-hidden="true">{rehearsalLetter(stageIndex)}</span>
    <span className="label taskStage">{stageNames[stageIndex]}</span>
    <i className="taskRule" aria-hidden="true"/>
    <span className="taskMet" aria-hidden="true">
     <svg viewBox="0 0 22 22" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="9.25"/>
      <path d="M6.9 11.3 9.8 14.1 15.1 8.2" strokeLinecap="round" strokeLinejoin="round"/>
     </svg>
    </span>
    <b className="taskCriterion">{guide.finish}</b>
    {!canAdvance&&blockedReason&&<span className="checkBlocked">{blockedReason}</span>}
    <button className="action-primary taskGo" onClick={onAdvance} disabled={!canAdvance}>
     {advanceLabel} <svg className="caret" viewBox="0 0 12 12" width="9" height="9" aria-hidden="true"><path d="M2 1 10 6 2 11Z" fill="currentColor"/></svg>
    </button>
   </div>

   {/* The instrument, at the width it needs. */}
   <section className="lessonStage" aria-label={workspaceLabel}>
    <div className="stageBar">
     <span className="label">Workspace</span>
     <b>{workspaceLabel}</b>
    </div>
    {workspace}
   </section>

   {/* Everything else the stage has to say, under the thing it is about. */}
   <section className="lessonRead" key={`read-${stageIndex}`} aria-label="Instruction">
    {instruction}
   </section>
  </div>
 );
}

import type {ReactNode} from "react";
import PageTurn from "../components/PageTurn";

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
  * A new lesson is a new spread, and that turn is the shell's: the lesson is
  * in the address, so the route-level leaf already goes over the whole working
  * page. What is left for this view is the stage, which is a change of task
  * within one spread and turns the reading page alone — the instrument on the
  * right has not changed, and turning it would say that it had.
  */
 return (
  <div className="lessonShell">
   <header className="missionBar">
    <button className="action action-quiet" onClick={onPrevLesson} disabled={!hasPrev} aria-label="Previous lesson">←</button>
    <div className="missionId">
     <h1 data-page-heading tabIndex={-1}>{lesson.title}</h1>
    </div>
    <span className="chip mono">{lesson.duration} min</span>
    <button className="action action-quiet" onClick={onNextLesson} disabled={!hasNext} aria-label="Next lesson">→</button>
   </header>

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
     * Fixed, not draggable.
     *
     * The divider used to be draggable and remembered where it was left, which
     * meant the workspace could be parked at a quarter of the width and the
     * tool inside it had no say. The fretboard is the tool that suffers: it is
     * the widest thing in the product, and at a narrow split its controls
     * collapsed into single-character columns.
     *
     * The proportions below are stated in the stylesheet as real minimums for
     * both panes, so neither can be starved. Below the breakpoint they stack.
     */}
   <div className="lessonSplit">
    {/* The leaf, laid into the reading column's own cell so it hinges on the
        binding. Outside the section below, which React remounts on every stage
        change: a turn mounted inside the thing that changes can never know
        that it did. */}
    <PageTurn at={stageIndex} order={stageIndex} verso/>

    <section className="lessonRead" key={stageIndex} aria-label="Instruction">
     <div className="stageIntro">
      <div className="stageScoreHeading">
       <span className="rehearsalMark" data-current="true" aria-hidden="true">{rehearsalLetter(stageIndex)}</span>
       <span className="label">{stageNames[stageIndex]}</span>
      </div>
      <h2>{guide.title}</h2>
      <p className="dim">{guide.body}</p>
     </div>
     <div className="scoreStaffDivider" aria-hidden="true"/>
     {instruction}

     {/*
       * The standard sits at the foot of the page it belongs to.
       *
       * It used to run the full width beneath the spread, which put the
       * criterion for this stage across the binding and under the instrument,
       * and left the fold stopping short of the bottom of the book. It is the
       * last thing printed on the reading page, so that is where it goes, and
       * it turns with the page when the stage changes.
       */}
     <footer className="checkBar">
      <div className="checkCriteria">
       <span className="label">Move on when</span>
       <b>{guide.finish}</b>
      </div>
      <div className="checkAction">
       {!canAdvance&&blockedReason&&<span className="checkBlocked">{blockedReason}</span>}
       <button className="action-primary" onClick={onAdvance} disabled={!canAdvance}>
        {advanceLabel} <svg className="caret" viewBox="0 0 12 12" width="9" height="9" aria-hidden="true"><path d="M2 1 10 6 2 11Z" fill="currentColor"/></svg>
       </button>
      </div>
     </footer>
    </section>

    {/* A rule between reading and working, no longer a control. */}
    <div className="splitter" aria-hidden="true"><i/></div>

    <aside className="lessonDo" aria-label={workspaceLabel}>
     <div className="doHead">
      <span className="label">Workspace</span>
      <b>{workspaceLabel}</b>
     </div>
     <div className="doBody">{workspace}</div>
    </aside>
   </div>
  </div>
 );
}

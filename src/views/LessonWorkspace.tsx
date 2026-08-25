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
 return (
  <div className="lessonShell">
   <header className="missionBar">
    <button className="btn ghost" onClick={onPrevLesson} disabled={!hasPrev} aria-label="Previous lesson">←</button>
    <div className="missionId">
     <span className="eyebrow">Unit {lesson.unit} · Lesson {lesson.index+1} of {lesson.total}</span>
     <h1 data-page-heading tabIndex={-1}>{lesson.title}</h1>
    </div>
    <span className="chip mono">{lesson.duration} min</span>
    <button className="btn ghost" onClick={onNextLesson} disabled={!hasNext} aria-label="Next lesson">→</button>
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
       <i aria-hidden="true">{index<stageReached?"✓":index+1}</i>
       <span>{name}</span>
      </button>
     );
    })}
   </nav>

   <div className="lessonSplit">
    <section className="lessonRead stageSwap" key={stageIndex} aria-label="Instruction">
     <div className="stageIntro">
      <span className="eyebrow">{stageNames[stageIndex]}</span>
      <h2>{guide.title}</h2>
      <p className="muted">{guide.body}</p>
     </div>
     {instruction}
    </section>

    <aside className="lessonDo" aria-label={workspaceLabel}>
     <div className="doHead">
      <span className="eyebrow">Workspace</span>
      <b>{workspaceLabel}</b>
     </div>
     <div className="doBody">{workspace}</div>
    </aside>
   </div>

   <footer className="checkBar">
    <div className="checkCriteria">
     <span className="eyebrow">Move on when</span>
     <b>{guide.finish}</b>
    </div>
    <div className="checkAction">
     {!canAdvance&&blockedReason&&<span className="checkBlocked">{blockedReason}</span>}
     <button className="btn primary sheen" onClick={onAdvance} disabled={!canAdvance}>
      {advanceLabel} <span className="arrow">→</span>
     </button>
    </div>
   </footer>
  </div>
 );
}

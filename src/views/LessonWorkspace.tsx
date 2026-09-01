import type {ReactNode} from "react";
import {useSplit} from "./useSplit";

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
 const {split,frame,onPointerDown,onKeyDown,min,max}=useSplit();

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

   <div className="lessonSplit" ref={frame} style={{gridTemplateColumns:`minmax(0,${split}fr) auto minmax(0,${100-split}fr)`}}>
    <section className="lessonRead stageSwap" key={stageIndex} aria-label="Instruction">
     <div className="stageIntro">
      <div className="stageScoreHeading">
       <span className="rehearsalMark" data-current="true" aria-hidden="true">{rehearsalLetter(stageIndex)}</span>
       <span className="label">{stageNames[stageIndex]}</span>
      </div>
      <h2>{guide.title}</h2>
      <p className="dim">{guide.body}</p>
     </div>
     {instruction}
    </section>

    <div
     className="splitter"
     role="separator"
     tabIndex={0}
     aria-label="Resize the workspace"
     aria-orientation="vertical"
     aria-valuenow={Math.round(split)}
     aria-valuemin={min}
     aria-valuemax={max}
     onPointerDown={onPointerDown}
     onKeyDown={onKeyDown}
     onDoubleClick={()=>onKeyDown({key:"Enter",preventDefault(){},shiftKey:false} as never)}
    ><i aria-hidden="true"/></div>

    <aside className="lessonDo" aria-label={workspaceLabel}>
     <div className="doHead">
      <span className="label">Workspace</span>
      <b>{workspaceLabel}</b>
     </div>
     <div className="doBody">{workspace}</div>
    </aside>
   </div>

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
  </div>
 );
}

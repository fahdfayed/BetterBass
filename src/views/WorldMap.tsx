import {useState} from "react";
import type {TerritoryState} from "../game/progression";

type Props={
 territories:TerritoryState[];
 lessonTitles:string[];
 currentLesson:number;
 onOpenLesson:(index:number)=>void;
};

/** A gentle S-curve between two nodes, so the route reads as a path not a wire. */
function link(from:TerritoryState,to:TerritoryState){
 const midX=(from.x+to.x)/2;
 return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
}

export default function WorldMap({territories,lessonTitles,currentLesson,onOpenLesson}:Props){
 const [open,setOpen]=useState<number|null>(()=>territories.find(t=>t.current)?.id??1);
 const selected=territories.find(t=>t.id===open)??null;
 const passed=territories.reduce((sum,t)=>sum+t.done,0);

 return (
  <>
   <header className="mapHead rise">
    <div>
     <h1 className="display" data-page-heading tabIndex={-1}>
      Six <span className="gradientText">territories</span>.
     </h1>
     <p className="lede">
      Each one opens when the ground before it is proven. Pick a territory to see
      its lessons, then open any that is ready.
     </p>
    </div>
    <div className="hudStats">
     <div className="hudStat"><b className="mono">{passed}<i>/{lessonTitles.length}</i></b><span className="label">Lessons passed</span></div>
     <div className="hudStat"><b className="mono">{territories.filter(t=>t.unlocked).length}<i>/6</i></b><span className="label">Territories open</span></div>
    </div>
   </header>

   <section className="mapBoard rise d1" aria-label="Course territory map">
    <svg className="mapCanvas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
     {territories.slice(0,-1).map((from,index)=>{
      const to=territories[index+1];
      return (
       <path
        key={from.id}
        className={`mapLink ${to.unlocked?"open":"locked"}`}
        d={link(from,to)}
        pathLength={1}
        style={{animationDelay:`${180+index*160}ms`}}
       />
      );
     })}
    </svg>

    <ul className="mapNodes">
     {territories.map(territory=>{
      const state=!territory.unlocked?"locked":territory.complete?"complete":territory.current?"current":"open";
      return (
       <li
        key={territory.id}
        className={`mapNode ${state} ${open===territory.id?"selected":""}`}
        style={{
         left:`${territory.x}%`,top:`${territory.y}%`,
         "--accent":`var(--unit-${territory.id})`,
         animationDelay:`${140+(territory.id-1)*140}ms`,
        } as React.CSSProperties}
       >
        <button
         onClick={()=>setOpen(territory.id)}
         aria-expanded={open===territory.id}
         aria-label={`Territory ${territory.id}, ${territory.name}. ${
          territory.unlocked
           ? `${territory.done} of ${territory.total} lessons passed.`
           : `Locked. ${territory.lessonsToUnlock} more lessons needed.`
         }`}
        >
         <span className="nodeRing">
          <span className="nodeCore">{territory.complete?"✓":territory.unlocked?territory.id:"🔒"}</span>
         </span>
         <span className="nodeLabel">
          <b>{territory.name}</b>
          <small>{territory.unlocked?`${territory.done}/${territory.total} passed`:`${territory.lessonsToUnlock} to unlock`}</small>
         </span>
        </button>
       </li>
      );
     })}
    </ul>
   </section>

   {selected&&(
    <section className="territoryPanel rise d2" style={{"--accent":`var(--unit-${selected.id})`} as React.CSSProperties}>
     <header>
      <div>
       <h2>{selected.name}</h2>
       <p className="dim">{selected.subtitle}</p>
      </div>
      <div className="territoryScore">
       <b className="mono">{selected.done}<i>/{selected.total}</i></b>
       <div className="meter"><span style={{width:`${selected.percent}%`}}/></div>
      </div>
     </header>

     {selected.unlocked
      ? <ol className="missionList stagger" key={selected.id}>
         {Array.from({length:selected.total},(_,offset)=>{
          const index=selected.range[0]+offset;
          const isPassed=offset<selected.done;
          const isCurrent=index===currentLesson;
          const reachable=isPassed||index<=selected.range[0]+selected.done;
          return (
           <li key={index} className={`mission ${isPassed?"passed":""} ${isCurrent?"current":""} ${reachable?"":"locked"}`}>
            <button onClick={()=>{if(reachable)onOpenLesson(index)}} disabled={!reachable}>
             <i className="missionMark" aria-hidden="true">{isPassed?"✓":isCurrent?"▶":offset+1}</i>
             <span className="missionName">{lessonTitles[index]??`Lesson ${index+1}`}</span>
             <span className="missionState">
              {isPassed?"Passed":isCurrent?"In progress":reachable?"Ready":"Locked"}
             </span>
            </button>
           </li>
          );
         })}
        </ol>
      : <p className="lockNote">
         Pass <b>{selected.lessonsToUnlock}</b> more {selected.lessonsToUnlock===1?"lesson":"lessons"} to open this territory.
        </p>}
    </section>
   )}
  </>
 );
}

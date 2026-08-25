import {useState} from "react";
import type {Badge,Progression,TerritoryState} from "../game/progression";

type Props={
 progression:Progression;
 lessonTitles:string[];
 currentLesson:number;
 onOpenLesson:(index:number)=>void;
};

/** A gentle S-curve between two nodes, so the route reads as a path not a wire. */
function link(from:TerritoryState,to:TerritoryState){
 const midX=(from.x+to.x)/2;
 return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
}

const TIER_LABEL:Record<Badge["tier"],string>={bronze:"Bronze",silver:"Silver",gold:"Gold"};

export default function WorldMap({progression,lessonTitles,currentLesson,onOpenLesson}:Props){
 const {territories,rank,badges,badgesEarned,streak,keysMastered,xp}=progression;
 const [open,setOpen]=useState<number|null>(()=>territories.find(t=>t.current)?.id??1);
 const selected=territories.find(t=>t.id===open)??null;

 return (
  <>
   <header className="mapHead rise">
    <div>
     <span className="eyebrow">The route</span>
     <h1 className="display" data-page-heading tabIndex={-1}>
      Six <span className="gradientText">territories</span>.
     </h1>
     <p className="lede">
      Each one opens when the ground before it is proven. Nothing here is
      unlocked by time spent — only by juries passed.
     </p>
    </div>

    <div className="hudStats">
     <div className="hudStat"><b className="mono">{xp.toLocaleString()}</b><span className="eyebrow">XP</span></div>
     <div className="hudStat"><b className="mono">{streak}</b><span className="eyebrow">Day streak</span></div>
     <div className="hudStat"><b className="mono">{keysMastered}<i>/12</i></b><span className="eyebrow">Keys</span></div>
     <div className="hudStat"><b className="mono">{badgesEarned}<i>/{badges.length}</i></b><span className="eyebrow">Badges</span></div>
    </div>
   </header>

   <section className="mapBoard card rise d1" aria-label="Course territory map">
    <svg className="mapCanvas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
     {territories.slice(0,-1).map((from,index)=>{
      const to=territories[index+1];
      return (
       <path
        key={from.id}
        className={`mapLink ${to.unlocked?"open":"locked"}`}
        d={link(from,to)}
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
        style={{left:`${territory.x}%`,top:`${territory.y}%`,"--accent":`var(--unit-${territory.id})`} as React.CSSProperties}
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
    <section className="card lit territoryPanel rise d2" style={{"--accent":`var(--unit-${selected.id})`} as React.CSSProperties}>
     <header>
      <div>
       <span className="eyebrow">Territory {selected.id}</span>
       <h2>{selected.name}</h2>
       <p className="muted">{selected.subtitle}</p>
      </div>
      <div className="territoryScore">
       <b className="mono">{selected.percent}<i>%</i></b>
       <div className="meter"><span style={{width:`${selected.percent}%`}}/></div>
      </div>
     </header>

     {selected.unlocked
      ? <ol className="missionList">
         {Array.from({length:selected.total},(_,offset)=>{
          const index=selected.range[0]+offset;
          const passed=offset<selected.done;
          const isCurrent=index===currentLesson;
          const reachable=passed||index<=selected.range[0]+selected.done;
          return (
           <li key={index} className={`mission ${passed?"passed":""} ${isCurrent?"current":""} ${reachable?"":"locked"}`}>
            <button onClick={()=>{if(reachable)onOpenLesson(index)}} disabled={!reachable}>
             <i className="missionMark" aria-hidden="true">{passed?"✓":isCurrent?"▶":offset+1}</i>
             <span className="missionName">{lessonTitles[index]??`Lesson ${index+1}`}</span>
             <span className="missionState">
              {passed?"Passed":isCurrent?"In progress":reachable?"Ready":"Locked"}
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

   <section className="homeSection reveal">
    <header className="sectionHead">
     <div>
      <span className="eyebrow">Achievements</span>
      <h2>{badgesEarned} of {badges.length} earned.</h2>
     </div>
     <span className="chip">Rank {rank.level} · {rank.title}</span>
    </header>
    <ul className="badgeGrid">
     {badges.map(item=>(
      <li key={item.id} className={`card badgeCard ${item.tier} ${item.earned?"earned":""}`}>
       <div className="badgeMedal" aria-hidden="true">{item.earned?"★":"☆"}</div>
       <b>{item.name}</b>
       <small>{item.description}</small>
       <div className="meter"><span style={{width:`${item.percent}%`}}/></div>
       <span className="badgeFoot">
        <em>{TIER_LABEL[item.tier]}</em>
        <span className="mono">{item.detail}</span>
       </span>
      </li>
     ))}
    </ul>
   </section>
  </>
 );
}

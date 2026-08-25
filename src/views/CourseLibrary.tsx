import {useMemo,useState} from "react";

export type LibraryLesson={
 index:number;
 unit:number;
 title:string;
 tag:string;
 duration:number;
 outcome:string;
};

type Props={
 lessons:LibraryLesson[];
 units:Array<{n:number;title:string;subtitle:string;weeks:string;range:number[]}>;
 completed:number;
 current:number;
 onOpen:(index:number)=>void;
};

type Filter="all"|"ready"|"passed"|"locked";

const FILTERS:Array<{id:Filter;label:string}>=[
 {id:"all",label:"All"},
 {id:"ready",label:"Ready"},
 {id:"passed",label:"Passed"},
 {id:"locked",label:"Locked"},
];

const stateOf=(index:number,completed:number)=>
 index<completed?"passed":index===completed?"ready":"locked";

const STATE_LABEL:Record<string,string>={passed:"Passed",ready:"Ready",locked:"Locked"};

export default function CourseLibrary({lessons,units,completed,current,onOpen}:Props){
 const [filter,setFilter]=useState<Filter>("all");
 const [query,setQuery]=useState("");

 const matches=useMemo(()=>{
  const q=query.trim().toLowerCase();
  return lessons.filter(lesson=>{
   const state=stateOf(lesson.index,completed);
   if(filter!=="all"&&state!==filter)return false;
   if(!q)return true;
   return [lesson.title,lesson.outcome,lesson.tag].some(field=>field.toLowerCase().includes(q));
  });
 },[lessons,completed,filter,query]);

 // Grouping only helps while browsing the whole course; once a filter or a
 // search narrows things down, a flat list of hits is what is actually wanted.
 const grouped=filter==="all"&&!query.trim();

 const counts=useMemo(()=>({
  all:lessons.length,
  passed:lessons.filter(l=>stateOf(l.index,completed)==="passed").length,
  ready:lessons.filter(l=>stateOf(l.index,completed)==="ready").length,
  locked:lessons.filter(l=>stateOf(l.index,completed)==="locked").length,
 }),[lessons,completed]);

 const row=(lesson:LibraryLesson)=>{
  const state=stateOf(lesson.index,completed);
  const locked=state==="locked";
  return (
   <li key={lesson.index} className={`libRow ${state} ${lesson.index===current?"here":""}`}>
    <button onClick={()=>{if(!locked)onOpen(lesson.index)}} disabled={locked}>
     <i className="libMark" aria-hidden="true">{state==="passed"?"✓":locked?"🔒":lesson.index+1}</i>
     <span className="libMain">
      <b>{lesson.title}</b>
      <small>{lesson.outcome}</small>
     </span>
     <span className="libMeta">
      <span className="chip">{lesson.tag}</span>
      <span className="mono libDuration">{lesson.duration}m</span>
      <span className={`libState ${state}`}>{STATE_LABEL[state]}</span>
     </span>
    </button>
   </li>
  );
 };

 return (
  <>
   <header className="libHead rise">
    <div>
     <span className="eyebrow">{lessons.length}-lesson curriculum</span>
     <h1 className="display" data-page-heading tabIndex={-1}>
      From scales to <span className="gradientText">free improvisation</span>.
     </h1>
     <p className="lede">
      Lessons open in order, because later freedom depends on earlier hearing.
      Anything already passed stays open.
     </p>
    </div>
    <div className="hudStats">
     <div className="hudStat"><b className="mono">{counts.passed}<i>/{counts.all}</i></b><span className="eyebrow">Passed</span></div>
     <div className="hudStat"><b className="mono">{Math.round((counts.passed/counts.all)*100)}<i>%</i></b><span className="eyebrow">Complete</span></div>
    </div>
   </header>

   <div className="libControls rise d1">
    <label className="libSearch">
     <span className="visuallyHidden">Search lessons</span>
     <input
      type="search"
      placeholder="Search lessons by name, outcome or tag…"
      value={query}
      onChange={event=>setQuery(event.target.value)}
      autoComplete="off"
     />
    </label>
    <div className="libFilters" role="group" aria-label="Filter by state">
     {FILTERS.map(item=>(
      <button
       key={item.id}
       className={`libFilter ${filter===item.id?"on":""}`}
       aria-pressed={filter===item.id}
       onClick={()=>setFilter(item.id)}
      >
       {item.label} <em className="mono">{counts[item.id]}</em>
      </button>
     ))}
    </div>
   </div>

   {matches.length===0&&(
    <p className="libEmpty card">
     Nothing matches{query.trim()?` “${query.trim()}”`:""}
     {filter!=="all"?` in ${STATE_LABEL[filter].toLowerCase()} lessons`:""}.
    </p>
   )}

   {grouped
    ? units.map(unit=>{
       const inUnit=matches.filter(lesson=>lesson.unit===unit.n);
       if(!inUnit.length)return null;
       const done=inUnit.filter(l=>stateOf(l.index,completed)==="passed").length;
       return (
        <section
         key={unit.n}
         className="libUnit reveal"
         style={{"--accent":`var(--unit-${unit.n})`} as React.CSSProperties}
        >
         <header className="libUnitHead">
          <i aria-hidden="true">{unit.n}</i>
          <div>
           <span className="eyebrow">Unit {unit.n} · Weeks {unit.weeks}</span>
           <h2>{unit.title}</h2>
           <p className="muted">{unit.subtitle}</p>
          </div>
          <span className="mono libUnitCount">{done}/{inUnit.length}</span>
         </header>
         <ol className="libRows">{inUnit.map(row)}</ol>
        </section>
       );
      })
    : <ol className="libRows libFlat">{matches.map(row)}</ol>}
  </>
 );
}

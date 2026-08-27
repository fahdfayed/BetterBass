import {COURSE_UNITS} from "../course-data";

/**
 * What the player can actually do, rather than how much they have read.
 *
 * Every figure here is derived from lessons passed, so the page cannot
 * congratulate someone for time spent browsing.
 */
const ABILITIES=[
 "Establish home without overusing the root",
 "Name intervals by function",
 "State chord quality with structural tones",
 "Control tension through rhythm and duration",
 "Hear modal colour before touching the bass",
 "Improvise a mode without running its scale",
 "Follow guide tones through changing harmony",
 "Leave the key and resolve deliberately",
];

type Props={
 /** Share of the course passed, already rounded. */
 percent:number;
 /** How many lessons have been passed outright. */
 completed:number;
 /** Position in the curriculum, zero based. */
 lessonIndex:number;
 lessonTitle:string;
 unitNumber:number;
 unitTitle:string;
 onContinue:()=>void;
};

export default function CourseProgress(
 {percent,completed,lessonIndex,lessonTitle,unitNumber,unitTitle,onContinue}:Props
){
 return (
  <div className="osScreen courseProgressPage">
   <header>
    <span>COURSE PROGRESS</span>
    <h1 data-page-heading tabIndex={-1}>What can you<br/>actually do now?</h1>
    <p>Progress is tied to passed performance standards, not browsing time.</p>
   </header>

   <section className="progressHero">
    <div>
     <b>{percent}%</b>
     <span>COURSE COMPLETE</span>
     <i><em style={{width:`${percent}%`}}/></i>
    </div>
    <article>
     <small>CURRENT POSITION</small>
     <h2>Unit {unitNumber}: {unitTitle}</h2>
     <p>Lesson {lessonIndex+1}: {lessonTitle}</p>
     <button onClick={onContinue}>CONTINUE COURSE →</button>
    </article>
   </section>

   <div className="unitProgressList">
    {COURSE_UNITS.map(unit=>{
     const total=unit.range[1]-unit.range[0]+1;
     const done=Math.max(0,Math.min(total,completed-unit.range[0]));
     return (
      <article key={unit.n}>
       <i>{done===total?"✓":unit.n}</i>
       <div>
        <small>UNIT {unit.n}</small>
        <b>{unit.title}</b>
        <span>{done}/{total} LESSONS</span>
        <u><em style={{width:`${done/total*100}%`}}/></u>
       </div>
      </article>
     );
    })}
   </div>

   <section className="abilities">
    <span>EARNED ABILITIES</span>
    {/* An ability is claimed every third passed lesson, so the list stays
        ahead of the player without ever running out. */}
    {ABILITIES.map((ability,i)=>(
     <div className={completed>i*3?"earned":""} key={ability}>
      <i>{completed>i*3?"✓":"·"}</i>
      <span>{ability}</span>
     </div>
    ))}
   </section>
  </div>
 );
}

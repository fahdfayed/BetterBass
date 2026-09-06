import PracticeHistory from "./PracticeHistory";

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
 /** Open the screen that records and scores a take. */
 onRecordTake:()=>void;
};

/**
 * The record of the book so far, not a second copy of it.
 *
 * This used to also list all six units with their own completion bars —
 * exactly what Course's own list already shows, lesson by lesson, unit by
 * unit. Keeping both was the same mistake `/map` made: two pages answering
 * "how far along am I" is not two features, it is one fact told twice and
 * left free to disagree. What is left here is the one summary number, then
 * what does not exist anywhere else — what you have actually proved, and
 * the practice log behind it. "Continue" lives on Home; this page is the
 * record, not the resume button.
 */
export default function CourseProgress({percent,completed,onRecordTake}:Props){
 return (
  <div className="osScreen courseProgressPage">
   <header>
    <h1 data-page-heading tabIndex={-1}>What can you<br/>actually do now?</h1>
    <p>Progress is tied to passed performance standards, not browsing time.</p>
   </header>

   <section className="progressHero">
    <div>
     <b>{percent}%</b>
     <span>Course complete</span>
     <i><em style={{width:`${percent}%`}}/></i>
    </div>
   </section>

   <section className="abilities">
    <span>Earned abilities</span>
    {/* An ability is claimed every third passed lesson, so the list stays
        ahead of the player without ever running out. */}
    {ABILITIES.map((ability,i)=>(
     <div className={completed>i*3?"earned":""} key={ability}>
      <i>{completed>i*3?"✓":"·"}</i>
      <span>{ability}</span>
     </div>
    ))}
   </section>

   <PracticeHistory onRecord={onRecordTake}/>
  </div>
 );
}

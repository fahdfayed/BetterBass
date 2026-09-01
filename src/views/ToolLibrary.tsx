/**
 * Every lab on the site, listed once.
 *
 * The course opens the right tool at the moment a lesson needs it, so this
 * page exists for the other direction: a player who already knows what they
 * want to work on and would rather not walk the curriculum to reach it.
 */
const TOOLS=[
 {id:"runtime",icon:"practice",tag:"Play",title:"Backing band",desc:"Choose a style, tempo and progression, then practise over a responsive four-bar band."},
 {id:"fret",icon:"course",tag:"SEE",title:"Harmony fretboard",desc:"See chord tones, modal colour and tension across the full neck in the current key."},
 {id:"engine",icon:"coach",tag:"Listen",title:"Record and analyse",desc:"Let the site hear a take and explain timing, note function, tension and resolution."},
 {id:"advanced",icon:"slap",tag:"Create",title:"Improvisation lab",desc:"Work on motifs, enclosures, side-slips, voice leading and deliberate outside playing."},
 {id:"progression",icon:"course",tag:"Read",title:"Progression reader",desc:"Type a progression and read what it is doing. Key, Roman numerals, function, and which chords are borrowed rather than merely outside."},
 {id:"reference",icon:"library",tag:"Understand",title:"Theory reference",desc:"Look up the exact concept you need without leaving the lesson or starting another course."},
 {id:"adaptive",icon:"progress",tag:"Plan",title:"Adaptive training plan",desc:"Turn your weakest key, skill and overdue review into one focused practice route."},
];

const PATHS:Record<string,string[]>={
 home:["M3 10.5 12 3l9 7.5","M5.5 9v12h13V9"],
 course:["M4 5.5c2.8-.9 5.4-.4 8 1.5v13c-2.6-1.9-5.2-2.4-8-1.5z","M20 5.5c-2.8-.9-5.4-.4-8 1.5v13c2.6-1.9 5.2-2.4 8-1.5z"],
 practice:["M8 5.5v13l11-6.5z"],
 coach:["M3 12h3l2.2-5 3.6 10 2.7-7 2 4H21"],
 maqam:["M9 18V6l10-2v12","M9 18c0 1.4-1.6 2.5-3.5 2.5S2 19.4 2 18s1.6-2.5 3.5-2.5S9 16.6 9 18Z","M19 16c0 1.4-1.6 2.5-3.5 2.5S12 17.4 12 16s1.6-2.5 3.5-2.5S19 14.6 19 16Z"],
 slap:["M13 2 5 13h6l-1 9 9-13h-6z"],
 library:["M4 4h6v6H4z","M14 4h6v6h-6z","M4 14h6v6H4z","M14 14h6v6h-6z"],
 progress:["M4 20V10","M10 20V4","M16 20v-7","M22 20H2"],
};

export function UiIcon({name}:{name:string}){
 return (
  <span className="navIcon" aria-hidden="true">
   <svg viewBox="0 0 24 24">{(PATHS[name]||PATHS.library).map((d,i)=><path d={d} key={i}/>)}</svg>
  </span>
 );
}

export default function ToolLibrary({onOpen}:{onOpen:(view:string)=>void}){
 return (
  <div className="osScreen toolLibraryPage">
   <header>
    <div>
     <h1 data-page-heading tabIndex={-1}>Find the right tool.<br/>Get back to playing.</h1>
     <p>These are the same focused labs already inside the course, now organized by what you need to do.</p>
    </div>
    <button onClick={()=>onOpen("courseLesson")}>Return to current lesson <span>→</span></button>
   </header>

   <section className="toolLibraryGrid">
    {TOOLS.map(tool=>(
     <button onClick={()=>onOpen(tool.id)} key={tool.id}>
      <UiIcon name={tool.icon}/>
      <h2>{tool.title}</h2>
      <p>{tool.desc}</p>
      <b>Open tool <i>→</i></b>
     </button>
    ))}
   </section>

   <aside className="libraryHint">
    <UiIcon name="course"/>
    <div>
     <b>Not sure what to choose?</b>
     <p>Return to the current lesson. It opens the correct tool at the moment you need it.</p>
    </div>
    <button onClick={()=>onOpen("courseLesson")}>Continue lesson</button>
   </aside>
  </div>
 );
}

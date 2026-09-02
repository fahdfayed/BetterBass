import type {ReactElement} from "react";
import PageLeaf from "../components/PageLeaf";

/**
 * Every lab on the site, listed once.
 *
 * The course opens the right tool at the moment a lesson needs it, so this
 * page exists for the other direction: a player who already knows what they
 * want to work on and would rather not walk the curriculum to reach it.
 *
 * It is a list, not a grid of cards, and the difference matters here more than
 * anywhere else in the book. Seven equal tiles say "these are seven of the
 * same thing, choose one"; a numbered list on staves says what each one is for
 * and lets the eye run down it. The page this replaced put an icon, a heading
 * and a paragraph in identical boxes, which is the lazy container, and it read
 * as a product's feature grid rather than as the contents of a lab.
 *
 * Each row carries two drawings. The left one names the tool — a kit, a neck,
 * a take — and the right one shows what the tool produces: the waveform it
 * captures, the shapes it lights, the curve it plots. Both are authored here
 * in the same hand as the transport's icons, one stroke weight, no library.
 */

type Tool={
 id:string;
 title:string;
 desc:string;
 /** The tool, drawn. */
 mark:ReactElement;
 /** What the tool produces, drawn. */
 yield:ReactElement;
};

/* One weight, round joins, shared by every drawing on this page. */
const line={fill:"none",stroke:"currentColor",strokeWidth:1.4,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};

/** A run of bars whose heights come from one seeded pass, so it is stable. */
const bars=(count:number,seed:number,height:number)=>
 Array.from({length:count},(_,i)=>{
  const wave=Math.sin((i + seed) * 1.7) * Math.cos((i + seed) * .41);
  return Math.max(.08,Math.abs(wave)) * height;
 });

const Waveform=({n=34,seed=1}:{n?:number;seed?:number})=>(
 <svg viewBox="0 0 120 30" width="120" height="30" aria-hidden="true">
  {bars(n,seed,26).map((h,i)=>(
   <line key={i} x1={4 + i * (112 / n)} x2={4 + i * (112 / n)}
         y1={15 - h / 2} y2={15 + h / 2}
         stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  ))}
 </svg>
);

const TOOLS:Tool[]=[
 {
  id:"runtime",
  title:"Backing band",
  desc:"Choose a style, tempo and progression, then practise over a responsive four-bar band.",
  mark:(
   <svg viewBox="0 0 44 34" {...line} aria-hidden="true">
    <ellipse cx="22" cy="26" rx="13" ry="6"/>
    <path d="M9 26v-4M35 26v-4"/>
    <ellipse cx="12" cy="16" rx="6.5" ry="2.8"/>
    <ellipse cx="31" cy="14" rx="6" ry="2.6"/>
    <path d="M12 16v6M31 14v8"/>
    <path d="M4 9l9 3M40 7l-8 3"/>
    <path d="M3.5 8.5h1M39.5 6.5h1"/>
   </svg>
  ),
  yield:<Waveform seed={2}/>,
 },
 {
  id:"fret",
  title:"Harmony fretboard",
  desc:"See chord tones, modal colour and tension across the full neck in the current key.",
  mark:(
   <svg viewBox="0 0 44 34" {...line} aria-hidden="true">
    <path d="M4 7v20M14 7v20M24 7v20M34 7v20M42 7v20"/>
    <path d="M4 9h38M4 15h38M4 21h38M4 27h38"/>
    <circle cx="19" cy="15" r="2.6" fill="currentColor" stroke="none"/>
    <circle cx="29" cy="21" r="2.6" fill="currentColor" stroke="none"/>
    <circle cx="9" cy="9" r="2.4"/>
   </svg>
  ),
  yield:(
   <svg viewBox="0 0 120 30" {...line} aria-hidden="true">
    <path d="M6 4v22M38 4v22M70 4v22M102 4v22"/>
    <path d="M6 8h96M6 15h96M6 22h96"/>
    <circle cx="22" cy="8" r="3" fill="currentColor" stroke="none"/>
    <circle cx="54" cy="15" r="3" fill="currentColor" stroke="none"/>
    <circle cx="86" cy="22" r="3"/>
   </svg>
  ),
 },
 {
  id:"engine",
  title:"Record and analyse",
  desc:"Let the site hear a take and explain timing, note function, tension and resolution.",
  mark:(
   <svg viewBox="0 0 44 34" {...line} aria-hidden="true">
    <rect x="17" y="4" width="10" height="16" rx="5"/>
    <path d="M11 17a11 11 0 0 0 22 0M22 28v4M16 32h12"/>
   </svg>
  ),
  yield:<Waveform seed={7}/>,
 },
 {
  id:"advanced",
  title:"Improvisation lab",
  desc:"Work on motifs, enclosures, side-slips, voice leading and deliberate outside playing.",
  mark:(
   <svg viewBox="0 0 44 34" {...line} aria-hidden="true">
    <path d="M16 24V8l14-3v16"/>
    <ellipse cx="12" cy="24" rx="4.2" ry="3.2" fill="currentColor" stroke="none"/>
    <ellipse cx="26" cy="21" rx="4.2" ry="3.2" fill="currentColor" stroke="none"/>
    <path d="M16 12l14-3"/>
   </svg>
  ),
  yield:(
   <svg viewBox="0 0 120 30" {...line} aria-hidden="true">
    <path d="M4 22c10-2 14-14 22-14s10 12 18 12 12-14 20-14 12 10 20 10 12-6 32-8"/>
    {[[26,8],[44,20],[62,6],[80,16],[104,14]].map(([x,y],i)=>(
     <circle key={i} cx={x} cy={y} r="2.4" fill="currentColor" stroke="none"/>
    ))}
   </svg>
  ),
 },
 {
  id:"progression",
  title:"Progression reader",
  desc:"Type a progression and read what it is doing. Key, Roman numerals, function, and which chords are borrowed rather than merely outside.",
  mark:(
   <svg viewBox="0 0 44 34" {...line} aria-hidden="true">
    <path d="M4 8h36M4 26h36M4 8v18M40 8v18"/>
    <path d="M16 8v18M28 8v18"/>
    <path d="M8 15h4M20 15h4M32 15h4"/>
   </svg>
  ),
  yield:(
   <svg viewBox="0 0 120 30" aria-hidden="true">
    <text x="60" y="20" textAnchor="middle" fontFamily="var(--font)" fontSize="16" fill="currentColor">
     ii &#8211; V &#8211; I
    </text>
   </svg>
  ),
 },
 {
  id:"reference",
  title:"Theory reference",
  desc:"Look up the exact concept you need without leaving the lesson or starting another course.",
  mark:(
   <svg viewBox="0 0 44 34" {...line} aria-hidden="true">
    <path d="M6 6h14a4 4 0 0 1 4 4v18a4 4 0 0 0-4-4H6z"/>
    <path d="M38 6H24a4 4 0 0 0-4 4v18a4 4 0 0 1 4-4h14z"/>
    <path d="M28 12h6M28 17h6"/>
   </svg>
  ),
  yield:(
   <svg viewBox="0 0 120 30" {...line} aria-hidden="true">
    <circle cx="60" cy="15" r="11"/>
    {Array.from({length:12},(_,i)=>{
     const a=(i/12)*Math.PI*2-Math.PI/2;
     return <circle key={i} cx={60+Math.cos(a)*11} cy={15+Math.sin(a)*11} r="1.4" fill="currentColor" stroke="none"/>;
    })}
    <path d="M60 4v3"/>
   </svg>
  ),
 },
 {
  id:"adaptive",
  title:"Adaptive training plan",
  desc:"Turn your weakest key, skill and overdue review into one focused practice route.",
  mark:(
   <svg viewBox="0 0 44 34" {...line} aria-hidden="true">
    <circle cx="20" cy="18" r="12"/>
    <circle cx="20" cy="18" r="7"/>
    <circle cx="20" cy="18" r="2.2" fill="currentColor" stroke="none"/>
    <path d="M20 18 38 4M33 4h5v5"/>
   </svg>
  ),
  yield:(
   <svg viewBox="0 0 120 30" {...line} aria-hidden="true">
    <path d="M6 25l20-4 18-6 20-3 18-6 22-3"/>
    {[[6,25],[26,21],[44,15],[64,12],[82,6],[104,3]].map(([x,y],i)=>(
     <circle key={i} cx={x} cy={y} r="2.2" fill="currentColor" stroke="none"/>
    ))}
   </svg>
  ),
 },
];

export function UiIcon({name}:{name:string}){
 const tool=TOOLS.find(candidate=>candidate.id===name);
 return <span className="navIcon" aria-hidden="true">{tool?tool.mark:TOOLS[1].mark}</span>;
}

export default function ToolLibrary({onOpen}:{onOpen:(view:string)=>void}){
 return (
  <div className="osScreen labIndex">
   {/*
     * The statement moves to the left page.
     *
     * There is no list to put there on this route — the labs themselves are
     * the list, and they are the work — so the facing page carries what the
     * section is for and the way back out of it, which is what a section
     * divider in a book carries.
     */}
   <PageLeaf>
    <div className="leafStatement">
     <h1 data-page-heading tabIndex={-1} className="struck">
      Find the right tool.<br/>Get back to playing.
     </h1>
     <hr className="redRule"/>
     <p>These are the same focused labs already inside the course, now organized by what you need to do.</p>
     <button type="button" className="leafReturn" onClick={()=>onOpen("courseLesson")}>
      Return to current lesson <span className="caret" aria-hidden="true">&#8594;</span>
     </button>
     <p className="leafFocus annot">
      <span>Note to self:</span>
      <span>Start with the smallest useful step.</span>
      <span>Keep it musical.</span>
     </p>
    </div>
   </PageLeaf>

   <ol className="labList">
    {TOOLS.map((tool,index)=>(
     <li key={tool.id}>
      <button type="button" className="labRow staveRow" onClick={()=>onOpen(tool.id)}>
       <b className="labNum">{index + 1}</b>
       <span className="labMark" aria-hidden="true">{tool.mark}</span>
       <span className="labText">
        <span className="labTitle">{tool.title}</span>
        <small className="labDesc">{tool.desc}</small>
       </span>
       <span className="labYield" aria-hidden="true">{tool.yield}</span>
       <span className="labOpen">Open tool <span className="caret" aria-hidden="true">&#8594;</span></span>
      </button>
     </li>
    ))}
   </ol>
  </div>
 );
}

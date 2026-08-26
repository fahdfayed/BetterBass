import {lazy,Suspense,useState} from "react";
import {JACO_CHAPTERS} from "../tab/jaco-masterclass";

const ExerciseTabs=lazy(()=>import("../tab/ExerciseTabs"));

/**
 * The masterclass, laid out as the method it follows.
 *
 * Eight chapters in the book's order, each opening to its own subsections. One
 * chapter is open at a time so the sequence stays legible; nothing is locked,
 * because the book itself says not to work through it a page at a time.
 */
export default function JacoMasterclass(){
 const [openChapter,setOpenChapter]=useState(JACO_CHAPTERS[0].id);

 return (
  <>
   <header className="lede-block">
    <span className="label">Masterclass</span>
    <h1 className="display" data-page-heading tabIndex={-1}>Jaco Pastorius</h1>
    <p className="lead">
     The hands, then the theory, then harmony, melody, rhythm and soloing — the syllabus of
     Ray Peterson’s <i>Jaco Pastorius Bass Method</i>, in its own order.
    </p>
    <p className="dim measure">
     The chapters and their sections are the book’s. The exercises are written for this course:
     the book’s studies and its transcriptions are copyrighted, so each section names the
     recording instead, and gives you original material built on the same technique.
    </p>
   </header>

   <ol className="chapters">
    {JACO_CHAPTERS.map(chapter=>{
     const open=chapter.id===openChapter;
     const count=chapter.sections.reduce((sum,section)=>sum+section.exercises.length,0);
     return (
      <li key={chapter.id} className={`chapter ${open?"is-open":""}`}>
       <h2>
        <button
         className="chapterHead"
         aria-expanded={open}
         aria-controls={`chapter-${chapter.id}`}
         onClick={()=>setOpenChapter(open?"":chapter.id)}
        >
         <i className="figure" aria-hidden="true">{chapter.n}</i>
         <span className="chapterTitle">{chapter.title}</span>
         <span className="chapterCount mono">{count||"—"}</span>
        </button>
       </h2>

       <div id={`chapter-${chapter.id}`} className="chapterBody" hidden={!open}>
        {chapter.epigraph&&<p className="epigraph">{chapter.epigraph}</p>}
        <p className="chapterNote">{chapter.note}</p>

        {open&&chapter.sections.map(section=>(
         <section key={section.id} className="masterSection">
          <h3>{section.title}</h3>
          <p>{section.note}</p>
          {section.listen&&<p className="dim"><span className="label">Listen</span> {section.listen}</p>}
          {section.exercises.length>0&&(
           <Suspense fallback={<p className="tabLoading" role="status">Loading the reader…</p>}>
            <ExerciseTabs exercises={section.exercises} label={`${section.title} exercises`}/>
           </Suspense>
          )}
         </section>
        ))}
       </div>
      </li>
     );
    })}
   </ol>
  </>
 );
}

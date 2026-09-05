import {Suspense,useState} from "react";
import {JACO_CHAPTERS} from "../tab/jaco-masterclass";

/*
 * Statically imported, like the five other views that use it.
 *
 * It was lazy here and in LessonTools, and that dynamic import could never
 * split: BeastPractice, MaqamLab, SlapLab, ChromaticGym and TechniqueLab all
 * pull the same module in eagerly, so the bundler kept it in the shared chunk
 * and warned that the dynamic import did nothing. Every one of those views is
 * itself lazily loaded, so the module already arrives only when a view that
 * needs it does -- the second boundary bought nothing but a spinner.
 */
import ExerciseTabs from "../tab/ExerciseTabs";

/**
 * The masterclass, laid out as the method it follows.
 *
 * Seven chapters in the book's order, each opening to its own subsections. One
 * chapter is open at a time so the sequence stays legible; nothing is locked,
 * because the book itself says not to work through it a page at a time.
 *
 * The book's own eighth chapter, "Food for Thought," closed its teaching with
 * a page of biography and no exercises. Worth reading once, not worth a
 * permanent tab in a masterclass whose every other tab opens onto something
 * to play — dropped rather than kept as a chapter with nothing in it. "The
 * Sound," a gear-description subsection of chapter 1 with the same shape
 * (real content, zero exercises), is dropped for the same reason.
 */
export default function JacoMasterclass(){
 const [openChapter,setOpenChapter]=useState(JACO_CHAPTERS[0].id);

 return (
  <>
   <header className="lede-block">
    <h1 className="display" data-page-heading tabIndex={-1}>Jaco Pastorius</h1>
    <p className="lead">
     The hands, then the theory, then harmony, melody, rhythm and soloing, the syllabus of
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
         <span className="chapterCount mono">{count||"-"}</span>
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

import {lazy,Suspense,useMemo,useState} from "react";
import {type Degree,degreeAt,exampleFor} from "../theory/degrees";
import {type TabExercise,degreesUsed,keyName,noteName,playableKeys,toAlphaTex,transpose} from "./notation";

const TabPlayer=lazy(()=>import("./TabPlayer"));

/**
 * The notes an exercise is built from, named and explained.
 *
 * Every exercise says what to do and how to know you have it. Neither answers
 * the question a learner actually has in front of the tab — what is this note
 * doing here. The degrees are read back out of the music, so the answer is
 * always the exercise that is on screen.
 */
function DegreeKey({exercise}:{exercise:TabExercise}){
 const [open,setOpen]=useState<Degree|null>(null);
 const degrees=useMemo(()=>degreesUsed(exercise),[exercise]);
 if(degrees.length===0)return null;   // material that arrived already fretted

 return (
  <div className="degreeKey">
   <span className="label">Built from</span>
   <span className="degreeKeyRow">
    {degrees.map(degree=>{
     const meaning=degreeAt(degree);
     const isOpen=open?.semitones===meaning.semitones;
     return (
      <button
       key={degree}
       type="button"
       className={`degreeChip ${isOpen?"on":""}`}
       aria-expanded={isOpen}
       onClick={()=>setOpen(isOpen?null:meaning)}
      >
       <b>{meaning.names[0]}</b>
       <i>{noteName(exercise.root+degree).replace(/\d+$/,"")}</i>
      </button>
     );
    })}
   </span>
   {open&&(
    <p className="degreeKeyMeaning" role="status">
     <b>{open.label}</b> {open.meaning} {exampleFor(open,exercise.root)}
    </p>
   )}
  </div>
 );
}

/**
 * A set of exercises with the reader underneath them.
 *
 * Used anywhere the site hands a learner something to play — a lesson's
 * practice stage, a slap drill, a maqam sayr, a Beast passage — so the reading
 * and playback controls behave identically everywhere they appear.
 */
export default function ExerciseTabs({exercises,label}:{exercises:TabExercise[];label?:string}){
 const [index,setIndex]=useState(0);
 const [key,setKey]=useState<number|null>(null);
 const written=exercises[Math.min(index,exercises.length-1)];

 /*
  * All twelve keys, from material written once.
  *
  * Exercises are stored as degrees above a root and fretted at the last
  * moment, so the key is one number. Both source methods say the same thing —
  * take everything round the cycle — and until now the site could only offer
  * whichever key each exercise happened to be written in.
  */
 const keys=useMemo(()=>playableKeys(written),[written]);
 const exercise=useMemo(()=>{
  if(key===null||key===((written.root%12)+12)%12)return written;
  return transpose(written,key)??written;
 },[written,key]);

 // Rendering the notation is the expensive half of showing a tab, so it is not
 // redone until the learner actually picks a different exercise.
 const tex=useMemo(()=>{
  try{return toAlphaTex(exercise)}
  catch(cause){return cause instanceof Error?cause:new Error("This exercise could not be written out.")}
 },[exercise]);

 if(!exercise)return null;

 return (
  <div className="exercises">
   {exercises.length>1&&(
    <nav className="exercisePick" aria-label={label??"Exercises"}>
     {exercises.map((item,i)=>(
      <button
       key={item.id}
       className={`exerciseChip ${i===index?"on":""}`}
       aria-current={i===index?"true":undefined}
       onClick={()=>{setIndex(i);setKey(null)}}
      >
       <i className="barNumber" aria-hidden="true">{String(i+1).padStart(2,"0")}</i>
       <span>{item.title}</span>
      </button>
     ))}
    </nav>
   )}

   <div className="exerciseBrief">
    {exercise.loop&&(
     <div className="repeatCount" aria-label="Repeat this exercise">
      <span className="repeatGlyph" aria-hidden="true">𝄆</span>
      <span className="times">repeat</span>
      <span className="repeatGlyph" aria-hidden="true">𝄇</span>
     </div>
    )}
    <p>{exercise.brief}</p>
    <p className="dim"><span className="label">Pass</span> {exercise.pass}</p>
   </div>

   {keys.length>1&&(
    <div className="keyPick">
     <span className="label">Key</span>
     <span className="keyRow">
      {keys.map(pitchClass=>{
       const current=((exercise.root%12)+12)%12===pitchClass;
       const asWritten=((written.root%12)+12)%12===pitchClass;
       return (
        <button
         key={pitchClass}
         type="button"
         className={`keyChip ${current?"on":""}`}
         aria-pressed={current}
         title={asWritten?"As written":`Transpose to ${keyName(pitchClass)}`}
         onClick={()=>setKey(pitchClass)}
        >
         {keyName(pitchClass)}
        </button>
       );
      })}
     </span>
     {exercise!==written&&<span className="keyNote dim">{written.rootName} as written</span>}
    </div>
   )}

   <DegreeKey exercise={exercise}/>

   {tex instanceof Error
    ?<p className="tabError" role="alert">{tex.message}</p>
    :(
     <Suspense fallback={<p className="tabLoading" role="status">Loading the reader…</p>}>
      <TabPlayer
       key={exercise.id}
       source={{kind:"tex",tex}}
       title={exercise.title}
       initialLooping={exercise.loop}
       root={exercise.root}
      />
     </Suspense>
    )}
  </div>
 );
}

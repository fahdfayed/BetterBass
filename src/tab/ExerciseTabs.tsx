import {lazy,Suspense,useMemo,useState} from "react";
import {type TabExercise,toAlphaTex} from "./notation";

const TabPlayer=lazy(()=>import("./TabPlayer"));

/**
 * A set of exercises with the reader underneath them.
 *
 * Used anywhere the site hands a learner something to play — a lesson's
 * practice stage, a slap drill, a maqam sayr, a Beast passage — so the reading
 * and playback controls behave identically everywhere they appear.
 */
export default function ExerciseTabs({exercises,label}:{exercises:TabExercise[];label?:string}){
 const [index,setIndex]=useState(0);
 const exercise=exercises[Math.min(index,exercises.length-1)];

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
       onClick={()=>setIndex(i)}
      >
       <i aria-hidden="true">{String(i+1).padStart(2,"0")}</i>
       <span>{item.title}</span>
      </button>
     ))}
    </nav>
   )}

   <div className="exerciseBrief">
    <p>{exercise.brief}</p>
    <p className="dim"><span className="label">Pass</span> {exercise.pass}</p>
   </div>

   {tex instanceof Error
    ?<p className="tabError" role="alert">{tex.message}</p>
    :(
     <Suspense fallback={<p className="tabLoading" role="status">Loading the reader…</p>}>
      <TabPlayer
       key={exercise.id}
       source={{kind:"tex",tex}}
       title={exercise.title}
       initialLooping={exercise.loop}
      />
     </Suspense>
    )}
  </div>
 );
}

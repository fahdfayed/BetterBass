import {useMemo,useState} from "react";
import ExerciseTabs from "../tab/ExerciseTabs";
import {TECHNIQUE_AREAS} from "../technique-data";
import {FINGER_ORDERS,anchorDrill,crossingDrill,permutationDrill,shiftDrill}
 from "../tab/technique-library";

/**
 * The hands.
 *
 * Every other page here is about what to play. This one is about whether the
 * two hands can play it, which is the half of the instrument the site had
 * nothing on — the only technique material anywhere was a six-line injury
 * checklist inside the Beast practice page.
 */

const DRILL_SETS=[
 {id:"perm",label:"Finger independence",
  blurb:"The twenty-four orders four fingers can be played in, one position, all four strings."},
 {id:"cross",label:"String crossing",
  blurb:"The same orders with a different string on every note, so both hands have to agree."},
 {id:"anchor",label:"Holding one finger",
  blurb:"One finger stays down while the others work around it. This is the one that hurts."},
 {id:"shift",label:"Shifting",
  blurb:"One shape moved by a measured distance, without looking at the neck."},
] as const;

type Set=typeof DRILL_SETS[number]["id"];

export default function TechniqueLab(){
 const [area,setArea]=useState(TECHNIQUE_AREAS[0].id);
 const [set,setSet]=useState<Set>("perm");
 const [orderIndex,setOrderIndex]=useState(0);

 const open=TECHNIQUE_AREAS.find(item=>item.id===area)!;
 const order=FINGER_ORDERS[orderIndex];

 const exercises=useMemo(()=>{
  if(set==="perm")return [permutationDrill(order)];
  if(set==="cross")return [crossingDrill(order)];
  if(set==="anchor")return [1,2,3,4].map(finger=>anchorDrill(finger));
  return [1,2,3,5,7].map(distance=>shiftDrill(distance));
 },[set,order]);

 const usesOrder=set==="perm"||set==="cross";

 return (
  <div className="osScreen techniqueLab">
   <div className="screenIntro">
    <h1 data-page-heading tabIndex={-1}>Whether you can play it, not what to play.</h1>
    <p>
     Theory tells you which note. It does not tell you how to reach it without the hand
     collapsing, how to silence the three strings you are not on, or how to spend an hour
     so that something is different at the end of it. None of that is optional, and a
     player whose hand cramps at the fifth fret does not have a theory problem.
    </p>
   </div>

   <nav className="techAreas" aria-label="Technique areas">
    {TECHNIQUE_AREAS.map(item=>(
     <button
      key={item.id}
      type="button"
      className={`techTab ${item.id===area?"on":""}`}
      aria-current={item.id===area?"true":undefined}
      onClick={()=>setArea(item.id)}
     >
      <i aria-hidden="true">{item.n}</i>
      <b>{item.title}</b>
     </button>
    ))}
   </nav>

   <article className="techArea">
    <header>
     <h2>{open.title}</h2>
     <p>{open.core}</p>
    </header>

    <div className="techRules">
     {open.rules.map((rule,index)=>(
      <article key={rule.name}>
       <i aria-hidden="true">{String(index+1).padStart(2,"0")}</i>
       <b>{rule.name}</b>
       <p>{rule.detail}</p>
      </article>
     ))}
    </div>

    <div className="techDiagnosis">
     <article className="myth">
      <span>What goes wrong</span>
      <p>{open.trap}</p>
     </article>
     <article className="fix">
      <span>How you know it is right</span>
      <p>{open.proof}</p>
     </article>
    </div>
   </article>

   <section className="techDrills">
    <header>
     <h2>Drills for the hand, not the ear.</h2>
     <p>
      These are written as frets and strings rather than as notes, because that is what
      they are about. They have no key and do not transpose.
     </p>
    </header>

    <div className="techSets">
     {DRILL_SETS.map(item=>(
      <button
       key={item.id}
       type="button"
       className={`gymChip wide ${item.id===set?"on":""}`}
       aria-pressed={item.id===set}
       onClick={()=>setSet(item.id)}
      >
       <b>{item.label}</b>
       <small>{item.blurb}</small>
      </button>
     ))}
    </div>

    {usesOrder&&(
     <div className="techOrders">
      <span className="label">Finger order</span>
      <span className="techOrderRow">
       {FINGER_ORDERS.map((item,index)=>(
        <button
         key={item.join("")}
         type="button"
         className={`keyChip ${index===orderIndex?"on":""}`}
         aria-pressed={index===orderIndex}
         onClick={()=>setOrderIndex(index)}
        >
         {item.join("")}
        </button>
       ))}
      </span>
      <span className="keyNote dim">All twenty-four. Work through them rather than picking favourites.</span>
     </div>
    )}

    <ExerciseTabs exercises={exercises} label="Technique drills"/>
   </section>
  </div>
 );
}

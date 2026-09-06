import {useId,useState} from "react";
import {type Degree,exampleFor,readFormula} from "../theory/degrees";

/**
 * A formula whose degrees explain themselves.
 *
 * The shorthand is only readable if you already know it, which makes every
 * formula on the site useless to exactly the people it is meant to teach.
 * Each degree becomes a button; pressing one writes its meaning underneath.
 *
 * A definition placed in the flow rather than floating over the text means
 * there is nothing to position, nothing to clip inside a scrolling table, and
 * it works the same under a finger as under a pointer.
 *
 * Anything that is not a degree — a lesson's formula is often a sentence —
 * passes through as plain text.
 */
export default function Formula({formula,className=""}:{formula:string;className?:string}){
 const [open,setOpen]=useState<Degree|null>(null);
 const id=useId();
 const pieces=readFormula(formula);
 const explainable=pieces.some(piece=>piece.degree);

 if(!explainable)return <span className={className}>{formula}</span>;

 return (
  <span className={`formula ${className}`}>
   <span className="formulaLine">
    {pieces.map((piece,index)=>{
     if(!piece.degree)return <span key={index}>{piece.text}</span>;
     const isOpen=open?.semitones===piece.degree.semitones;
     return (
      <button
       key={index}
       type="button"
       className={`degree ${isOpen?"on":""}`}
       aria-expanded={isOpen}
       aria-controls={`${id}-meaning`}
       onClick={()=>setOpen(isOpen?null:piece.degree!)}
      >
       {piece.text}
      </button>
     );
    })}
   </span>
   <span className="degreeMeaning" id={`${id}-meaning`} role="status">
    {open&&(
     <>
      <b>{open.names.join(" / ")}</b>
      <i>{open.label}</i>
      <span>{open.meaning} {exampleFor(open,0)}</span>
     </>
    )}
   </span>
  </span>
 );
}

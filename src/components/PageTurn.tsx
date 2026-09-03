import {useEffect,useRef,useState} from "react";

/**
 * A leaf of the book going over.
 *
 * The sheet is real paper rather than a snapshot of the outgoing page — see the
 * head of page-turn.css for why — so this component owns no content. It exists
 * to answer two questions the stylesheet cannot: *whether* a turn happened, and
 * *which way*.
 */

type Direction="fwd"|"back";

/**
 * Which way the book opened.
 *
 * Direction is not decoration here. The course states that lessons open in
 * order, and the left page prints that order with a number against every entry,
 * so "did I move forward or back" is a fact the interface already asserts twice
 * and the turn is the third place it can say it without words. A turn that goes
 * the same way whichever direction you moved is a page-shaped fade.
 */
export function directionBetween(from:number|undefined,to:number|undefined):Direction{
 if(from===undefined||to===undefined)return "fwd";
 return to<from?"back":"fwd";
}

type Props={
 /** Changes whenever a turn should run. Usually a route path or a stage index. */
 at:string|number;
 /** Where `at` sits in the reading order, so the leaf knows which way to go. */
 order?:number;
 /** The reading page of a spread hinges on its right edge, not the binding. */
 verso?:boolean;
};

export default function PageTurn({at,order,verso=false}:Props){
 const [turn,setTurn]=useState<{id:number;dir:Direction}|null>(null);
 const previous=useRef<{at:string|number;order?:number}>({at,order});
 /*
  * A counter rather than a clock. Two navigations inside the same millisecond
  * produced the same key, React kept the element instead of remounting it, and
  * the second turn inherited the first one's finished animation -- a sheet left
  * lying across the page with nothing due to fire and clear it.
  */
 const sequence=useRef(0);
 /*
  * The first render is an arrival, not a turn. A leaf going over on the opening
  * screen would be the book turning a page nobody read.
  */
 const opened=useRef(false);

 useEffect(()=>{
  const was=previous.current;
  previous.current={at,order};
  if(!opened.current){opened.current=true;return}
  if(was.at===at)return;
  sequence.current+=1;
  setTurn({id:sequence.current,dir:directionBetween(was.order,order)});
 },[at,order]);

 /*
  * A backstop, because `animationend` is not guaranteed to arrive.
  *
  * A document that is not being rendered does not advance its animations, so a
  * turn that starts just as the tab goes to the background never finishes and
  * never fires. The sheet ends the arc transparent and takes no pointer, so a
  * leaked one is invisible — but it is still a node lying over the working page
  * for the rest of the session, and the next turn stacks another on top.
  *
  * The event stays the primary path: it is exact, and it clears on the frame
  * the leaf lands. This only catches the case where the frame never comes.
  */
 useEffect(()=>{
  if(!turn)return;
  const swept=window.setTimeout(()=>setTurn(null),1200);
  return()=>window.clearTimeout(swept);
 },[turn]);

 if(!turn)return null;

 return (
  <div
   key={turn.id}
   className={`turnLayer ${verso?"is-verso":""}`}
   data-dir={turn.dir}
   aria-hidden="true"
   /*
     * `key` remounts the layer, so a turn interrupted by a second navigation is
     * replaced rather than resumed: the new sheet starts its arc from flat.
     */
   onAnimationEnd={event=>{
    /*
     * The shade finishes on the same schedule, so the leaf's own name is what
     * is checked: clearing on whichever animation happened to end first would
     * take the sheet off the page mid-arc.
     */
    if(event.animationName.startsWith("leafOver"))setTurn(null);
   }}
  >
   <i className="turnShade"/>
   <div className="turnLeaf">
    <i className="turnFace turnFront"/>
    <i className="turnFace turnBack"/>
   </div>
  </div>
 );
}

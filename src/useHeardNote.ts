import {useCallback,useEffect,useRef} from "react";

/** What the microphone reports when it commits a note. */
export type Heard={midi:number;at:number}|null;

/**
 * React to notes as they are played, once each.
 *
 * The live pitch arrives as a value rather than an event, so a screen watching
 * it has to work out for itself which notes are new: without that, re-rendering
 * for any other reason replays the last note, and notes played before the
 * screen opened count as answers to a question that had not been asked yet.
 *
 * The handler is kept in a ref so a caller can close over fresh state without
 * the effect re-running and re-consuming the same note.
 *
 * Returns a function that discards anything played up to now — call it when
 * starting a round, so the note that finished the last one does not begin the
 * next.
 */
export function useHeardNote(
 heard:Heard,
 onNote:(pitchClass:number,midi:number)=>void,
 active=true,
){
 const consumed=useRef(heard?.at??0);
 const handler=useRef(onNote);
 useEffect(()=>{handler.current=onNote});

 useEffect(()=>{
  if(!active||!heard||heard.at<=consumed.current)return;
  consumed.current=heard.at;
  handler.current(((heard.midi%12)+12)%12,heard.midi);
 },[heard,active]);

 return useCallback(()=>{consumed.current=performance.now()},[]);
}

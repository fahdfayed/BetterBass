import {useCallback,useEffect,useRef,useState} from "react";

/**
 * Which "hear this" button is currently sounding.
 *
 * Auditioning a phrase makes noise and changes nothing on screen, so a player
 * whose output is muted, or whose audio context has not resumed, presses the
 * button and cannot tell whether the site is broken or their speakers are.
 * This gives each button a way to say it is playing.
 *
 * The phrase is scheduled ahead on the audio clock rather than played through
 * an element there is anything to listen to, so the end is calculated from the
 * note count rather than awaited.
 */
export function useAudition(audition:(pitchClasses:number[],hold?:number)=>void){
 const [playing,setPlaying]=useState<string|null>(null);
 const timer=useRef(0);

 // A phrase outliving its screen would leave the state set on a component that
 // is no longer mounted.
 useEffect(()=>()=>window.clearTimeout(timer.current),[]);

 const play=useCallback((id:string,pitchClasses:number[],hold=.34)=>{
  audition(pitchClasses,hold);
  setPlaying(id);
  window.clearTimeout(timer.current);
  // The drone runs a little past the last note; this matches what audition
  // schedules so the button stops looking busy when the sound actually stops.
  timer.current=window.setTimeout(()=>setPlaying(null),
   (pitchClasses.length*hold+.45)*1000);
 },[audition]);

 return {playing,play};
}

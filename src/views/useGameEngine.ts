import {useCallback,useEffect,useRef,useState} from "react";
import {type Ask,type Drill,advance,onBeat} from "../game/drills";
import {type Heard,useHeardNote} from "../useHeardNote";
import {startAudioClock,type AudioClock} from "../audio-clock";

/**
 * The half of a drill that has nothing to do with how it's scored: what's
 * asked, whether what was played answers it, and when the round ends.
 *
 * GameRunner and BossFight want the same questions judged the same way but
 * disagree completely on what a hit or a miss *means* — a streak counter for
 * one, a health bar for the other. So this owns only the verdict, reported
 * through `onOutcome`, and leaves what to do with that verdict to the caller.
 */

const TEMPO=72;
const BEAT=60/TEMPO;

export type Outcome=
 |{hit:true;onBeat:boolean;played:number}
 |{hit:false;reason:"offBeat";at:number;wantedBeats:number[]}
 |{hit:false;reason:"wrongNote";played:number;onBeat:boolean}
 |{hit:false;reason:"late";limit:number};

export type GameEngine={
 ask:Ask|null;
 progress:number;
 left:number;
 over:boolean;
 beat:number;
 restart:()=>void;
};

export function useGameEngine(
 drill:Drill,root:number,heard:Heard,listening:boolean,
 audition:(pitchClasses:number[],hold?:number)=>void,
 onOutcome:(outcome:Outcome)=>void,
):GameEngine{
 const [ask,setAsk]=useState<Ask|null>(null);
 const [progress,setProgress]=useState(0);
 const [streak,setStreak]=useState(0);
 const [left,setLeft]=useState(drill.session);
 const [over,setOver]=useState(false);
 const [beat,setBeat]=useState(0);

 const clock=useRef<{ctx:AudioContext;clock:AudioClock}|null>(null);
 const mark=useRef({beat:0,at:0});
 const asked=useRef(0);
 const onOutcomeRef=useRef(onOutcome);
 onOutcomeRef.current=onOutcome;

 const level=Math.min(4,Math.floor(streak/4));

 const nextAsk=useCallback(()=>{
  const next=drill.ask(root,level,Math.random);
  setAsk(next);setProgress(0);asked.current=performance.now();
  if(next.reference)audition(next.reference,.8);
 },[drill,root,level,audition]);

 // A fresh drill is a fresh game.
 useEffect(()=>{
  setStreak(0);setLeft(drill.session);setOver(false);
  const first=drill.ask(root,0,Math.random);
  setAsk(first);setProgress(0);asked.current=performance.now();
  if(first.reference)audition(first.reference,.8);
 },[drill,root,audition]);

 // The session timer, for the drills that end.
 useEffect(()=>{
  if(!drill.session||over)return;
  const id=window.setInterval(()=>{
   setLeft(remaining=>{
    if(remaining<=1){setOver(true);return 0}
    return remaining-1;
   });
  },1000);
  return ()=>window.clearInterval(id);
 },[drill.session,over]);

 /*
  * The click, and a mark of where the bar is.
  *
  * Beat position is worked out from the audio clock rather than from
  * performance.now(), because the click the player is hearing is on the audio
  * clock and judging them against a different one would call good notes late.
  */
 useEffect(()=>{
  if(!drill.timed||over)return;
  const ctx=new AudioContext();
  const running=startAudioClock(ctx,()=>TEMPO,{
   schedule:(index,time)=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.frequency.setValueAtTime(index%4===0?1320:880,time);
    gain.gain.setValueAtTime(.0001,time);
    gain.gain.exponentialRampToValueAtTime(index%4===0?.5:.25,time+.005);
    gain.gain.exponentialRampToValueAtTime(.0001,time+.06);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(time);osc.stop(time+.08);
    mark.current={beat:index,at:time};
   },
   display:index=>setBeat(index%4),
  });
  clock.current={ctx,clock:running};
  return ()=>{running.stop();void ctx.close();clock.current=null};
 },[drill.timed,over]);

 /** Where in the bar we are, 1 to 4, at this instant. */
 const beatNow=()=>{
  const engine=clock.current;
  if(!engine)return 1;
  const since=engine.ctx.currentTime-mark.current.at;
  return ((mark.current.beat+since/BEAT)%4+4)%4+1;
 };

 const judge=useCallback((played:number)=>{
  if(!ask||over)return;

  // Timed drills judge the beat first: the right note in the wrong place is
  // the mistake this drill exists to find.
  if(ask.beats?.length){
   const at=beatNow();
   const wanted=ask.beats.find(want=>onBeat(at,want));
   if(wanted===undefined){
    setStreak(0);
    onOutcomeRef.current({hit:false,reason:"offBeat",at,wantedBeats:ask.beats});
    return;
   }
   if(ask.notes.length&&((played%12)+12)%12!==((ask.notes[0]%12)+12)%12){
    setStreak(0);
    onOutcomeRef.current({hit:false,reason:"wrongNote",played,onBeat:true});
    return;
   }
   setStreak(run=>run+1);
   onOutcomeRef.current({hit:true,onBeat:true,played});
   nextAsk();
   return;
  }

  const step=advance(ask,progress,played);
  setProgress(step.progress);

  if(step.done){
   const late=ask.limit!==undefined&&(performance.now()-asked.current)/1000>ask.limit;
   if(late){
    setStreak(0);
    onOutcomeRef.current({hit:false,reason:"late",limit:ask.limit as number});
   }else{
    setStreak(run=>run+1);
    onOutcomeRef.current({hit:true,onBeat:false,played});
   }
   nextAsk();
   return;
  }

  // A step into a multi-note sequence, correct so far but not yet a verdict.
  if(step.hit)return;
  setStreak(0);
  onOutcomeRef.current({hit:false,reason:"wrongNote",played,onBeat:false});
 },[ask,progress,over,nextAsk]);

 useHeardNote(heard,judge,listening&&!over);

 const restart=useCallback(()=>{
  setStreak(0);setLeft(drill.session);setOver(false);nextAsk();
 },[drill.session,nextAsk]);

 return {ask,progress,left,over,beat,restart};
}

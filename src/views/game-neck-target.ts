import {useCallback,useRef,useState} from "react";
import {type Ask} from "../game/drills";

/**
 * Split out of GameNeck3D.tsx so every drill screen can compute what to
 * flash on the 3D neck without importing that component's module graph —
 * which pulls in NeckScene and, through it, three.js — just to reach these
 * two pure functions.
 */

const mod=(value:number)=>((value%12)+12)%12;

export type LastOutcome={pcs:number[];hit:boolean;at:number};

/**
 * The pitch class(es) the player needs to find right now.
 *
 * Usually one note. `ask.accept` (Wrong Note Rescue) has no single right
 * answer — any tone of the chord resolves it — so every accepted tone is a
 * target at once, not just the nearest one.
 */
export function targetPitchClasses(ask:Ask|null,progress:number):number[]{
 if(!ask)return [];
 if(ask.accept)return [...new Set(ask.accept.map(mod))];
 if(!ask.notes.length)return [];
 // A timed ask judges the whole beat against ask.notes[0] regardless of
 // progress — see useGameEngine's judge — everything else advances one
 // note at a time through the sequence.
 const index=ask.beats?.length?0:Math.min(progress,ask.notes.length-1);
 return [mod(ask.notes[index])];
}

/**
 * Every screen that shows GameNeck3D needs the same two things: a way to
 * report each outcome as a flash, and the ask/progress *at the moment of
 * that outcome* — not whatever they've become by the time the report runs,
 * since useGameEngine's judge() calls onOutcome and then immediately
 * advances to the next ask in the same tick.
 *
 * `syncAsk` exists because of an ordering problem: onOutcome has to exist
 * before useGameEngine is called (it's an argument to it), but the ask and
 * progress it needs are useGameEngine's *return* value. The screen calls
 * `syncAsk(ask,progress)` right after destructuring that return, every
 * render, keeping the ref current for whenever the next outcome fires.
 */
export function useOutcomeFlash(){
 const current=useRef<{ask:Ask|null;progress:number}>({ask:null,progress:0});
 const [lastOutcome,setLastOutcome]=useState<LastOutcome|null>(null);

 const reportOutcome=useCallback((hit:boolean)=>{
  const{ask,progress}=current.current;
  setLastOutcome({pcs:targetPitchClasses(ask,progress),hit,at:performance.now()});
 },[]);

 const syncAsk=(ask:Ask|null,progress:number)=>{current.current={ask,progress}};

 return {lastOutcome,reportOutcome,syncAsk};
}

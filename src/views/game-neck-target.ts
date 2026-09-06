import {type Ask} from "../game/drills";

/**
 * Split out of GameNeck3D.tsx so GameRunner can compute a target pitch class
 * without importing that component's module graph — which pulls in
 * NeckScene and, through it, three.js — just to reach one pure function.
 */

export type LastOutcome={pc:number|null;hit:boolean;at:number};

/** The pitch class the player needs to play right now, or null with nothing to ask for. */
export function targetPitchClass(ask:Ask|null,progress:number):number|null{
 if(!ask||!ask.notes.length)return null;
 // A timed ask judges the whole beat against ask.notes[0] regardless of
 // progress — see useGameEngine's judge — everything else advances one
 // note at a time through the sequence.
 const index=ask.beats?.length?0:Math.min(progress,ask.notes.length-1);
 return ((ask.notes[index]%12)+12)%12;
}

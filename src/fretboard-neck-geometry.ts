/**
 * Physical and theoretical facts the 3D neck view needs, kept apart from
 * React and Three.js so the arithmetic can be tested directly.
 *
 * Tuning and fret count are not re-declared here — they already exist,
 * tested, in fretboard-positions.ts, which the live-pitch board uses to
 * find where a heard note could be fretted. This module only adds what
 * that one doesn't have: real (non-uniform) fret spacing, and which
 * pitch classes belong to a root+mode and what role each one plays.
 */

import {MODES,SCALE_LIBRARY} from "./harmony-fretboard-data.ts";

const mod=(value:number)=>((value%12)+12)%12;

/**
 * Distance from the nut to `fret`, in the same units as `scaleLength`.
 *
 * The standard luthier's formula: each fret sits at the point that leaves
 * the remaining string length shorter by the twelfth root of two, compounded
 * per fret — which is why the 12th fret (one octave) always lands at exactly
 * half the scale length, real basses included.
 */
export function fretPosition(fret:number,scaleLength:number):number{
 return scaleLength*(1-1/Math.pow(2,fret/12));
}

/** The pitch classes of `mode`'s scale, transposed to `root`. */
export function notesInMode(root:number,mode:number):number[]{
 return MODES[mode].s.map(interval=>mod(root+interval));
}

export type Role="root"|"colour"|"scale"|"outside";

/**
 * A note's role against a root+mode alone — no chord.
 *
 * This is deliberately a 4-tier scheme, not HarmonyFretboard's 5-tier
 * root/chord/colour/scale/outside: "chord" and the guide-tone tiers
 * describe a note's relationship to a *sounding chord*, which doesn't
 * exist yet without progression playback (a later phase). Root, colour
 * (the mode's own identifying tone) and scale are all real without one.
 */
export function roleFor(pc:number,root:number,mode:number):Role{
 const interval=mod(pc-root);
 if(interval===0)return "root";
 if(SCALE_LIBRARY[mode].character.includes(interval))return "colour";
 if(MODES[mode].s.includes(interval))return "scale";
 return "outside";
}

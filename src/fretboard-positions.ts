/**
 * Where a heard pitch can be fretted.
 *
 * The board draws pitch classes, so on its own it can only light every E on the
 * neck when an E is played. A heard note arrives as a real pitch, which is
 * enough to say which frets could actually have produced it — usually two or
 * three of them, and the player knows which one their hand is on.
 *
 * Kept out of the component so the arithmetic can be tested: an off-by-one here
 * lights the wrong fret on every string at once, and that is not something to
 * discover by squinting at a diagram.
 */

/** Open strings, highest first, as MIDI — the order the board draws them in. */
export const OPEN_STRINGS=[43,38,33,28];

/** The highest fret the board draws. */
export const TOP_FRET=20;

export type Position={
 /** Index into {@link OPEN_STRINGS}: 0 is the G string, 3 is the low E. */
 string:number;
 fret:number;
};

/**
 * Every place `midi` sits on the neck, highest string first.
 *
 * Empty when the pitch is below the open low E or above the top fret of the G
 * string — the detector hears notes a four-string cannot play, and inventing a
 * position for them would put a mark under a finger that is not there.
 */
export function positionsFor(midi:number,tuning=OPEN_STRINGS,topFret=TOP_FRET):Position[]{
 if(!Number.isFinite(midi))return [];
 const places:Position[]=[];
 tuning.forEach((open,string)=>{
  const fret=Math.round(midi)-open;
  if(fret>=0&&fret<=topFret)places.push({string,fret});
 });
 return places;
}

/** The same, as `string:fret` keys, which is what a lookup in render wants. */
export const positionKeys=(midi:number,tuning=OPEN_STRINGS,topFret=TOP_FRET)=>
 new Set(positionsFor(midi,tuning,topFret).map(place=>`${place.string}:${place.fret}`));

import {type Bar,type Event,type TabExercise,f} from "./notation.ts";

/**
 * Drills for the hands rather than the ear.
 *
 * Everything else on this site is about what to play. None of it is about the
 * two hands that have to play it, and the one place technique appears at all is
 * a six-line injury checklist inside the Beast practice page. A player whose
 * left hand collapses at the fifth fret does not have a theory problem.
 *
 * These are written as frets and strings rather than as degrees, because that
 * is what they are about: which finger, which string, how far the hand travels.
 * They have no key and do not transpose — moving a finger-independence drill to
 * B♭ would be a category error.
 *
 * The permutation drills are the twenty-four orderings of four fingers. There
 * is nothing to invent there and nobody to credit: with four fingers there are
 * twenty-four orders to put them in, and playing all of them is the exercise.
 */

/** Strings are numbered from the top of the tab down: 1 is G, 4 is E. */
const STRINGS=[4,3,2,1];

const permute=<T,>(items:T[]):T[][]=>
 items.length<=1?[items]:items.flatMap((item,index)=>
  permute([...items.slice(0,index),...items.slice(index+1)]).map(rest=>[item,...rest]));

/** The twenty-four orders four fingers can be played in. */
export const FINGER_ORDERS=permute([1,2,3,4]);

const orderName=(order:number[])=>order.join("-");

/**
 * One finger order, played on every string.
 *
 * Four bars of four, ascending the strings. The hand stays in one position for
 * the whole drill, which is the point — the fingers move and nothing else does.
 */
export function permutationDrill(order:number[],position=5):TabExercise{
 const bars:Bar[]=STRINGS.map(string=>
  order.map(finger=>f(string,position+finger-1,4)) as Event[]);

 return {
  id:`tech-perm-${orderName(order)}`,
  title:`Finger order ${orderName(order)}`,
  brief:`One finger per fret from ${position}. Play ${orderName(order)} on the E string, then A, `+
        `D and G without moving the hand. The thumb stays behind the neck and the fingers `+
        `already used stay down where the order lets them.`,
  pass:"Four strings at one tempo with no hand movement, no buzz, and no finger lifting higher than it needs to.",
  root:0,
  rootName:`Position ${position}`,
  tempo:60,
  bars,
  loop:true,
 };
}

/**
 * The same order, crossing strings on every note.
 *
 * A permutation played down one string trains the fingers. Played across the
 * strings it trains the two hands together, which is where the difficulty
 * actually is — the right hand has to arrive on a different string each time
 * the left hand changes finger.
 */
export function crossingDrill(order:number[],position=5):TabExercise{
 /*
  * Four routes across the strings. Written out rather than derived: the
  * arithmetic that produced the outside-in pair landed on the same string
  * twice in a row, which is the one thing a string-crossing drill must not do.
  */
 const routes=[[4,3,2,1],[1,2,3,4],[4,1,3,2],[2,3,1,4]];
 const bars:Bar[]=routes.map(route=>
  order.map((finger,index)=>f(route[index],position+finger-1,4)) as Event[]);
 return {
  id:`tech-cross-${orderName(order)}`,
  title:`Crossing on ${orderName(order)}`,
  brief:`The same fingers, a different string for every note: across, back, then outside-in `+
        `and inside-out. Strict index-middle alternation in the right hand throughout.`,
  pass:"No missed string, no doubled right-hand finger, and the tone identical on all four strings.",
  root:0,
  rootName:`Position ${position}`,
  tempo:54,
  bars,
  loop:true,
 };
}

/**
 * Moving the hand instead of stretching it.
 *
 * The hand has to travel eventually, and the useful skill is arriving in a new
 * position already in shape rather than reaching for one note and dragging the
 * rest after it. Each bar begins where the last one ended, so the shift is
 * always measured from a note the ear can hear.
 */
export function shiftDrill(distance:number,start=3):TabExercise{
 const positions=[start,start+distance,start+distance*2,start+distance];
 const bars:Bar[]=positions.map(position=>
  [f(3,position,4),f(3,position+3,4),f(2,position,4),f(2,position+3,4)] as Event[]);
 return {
  id:`tech-shift-${distance}`,
  title:`Shifting by ${distance} ${distance===1?"fret":"frets"}`,
  brief:`The same two-string shape moved by ${distance}. Look at the first position, then `+
        `move without looking, the shift is a measured distance, not a search. Release the `+
        `thumb as the hand travels and let it land behind the new position.`,
  pass:`Four positions in time, each landing in shape, with the shift heard as movement rather than as a gap.`,
  root:0,
  rootName:`From fret ${start}`,
  tempo:56,
  bars,
  loop:true,
 };
}

/**
 * One finger held while the others work.
 *
 * Independence is not speed. Holding the first finger down while the third and
 * fourth move is the thing that hurts, and it is the thing that stops the
 * fourth finger being useless.
 */
export function anchorDrill(held:number,position=5):TabExercise{
 const others=[1,2,3,4].filter(finger=>finger!==held);
 const bars:Bar[]=STRINGS.slice(0,2).flatMap(string=>[
  [f(string,position+held-1,4),...others.map(finger=>f(string,position+finger-1,4))] as Event[],
  [...[...others].reverse().map(finger=>f(string,position+finger-1,4)),f(string,position+held-1,4)] as Event[],
 ]);
 return {
  id:`tech-anchor-${held}`,
  title:`Finger ${held} stays down`,
  brief:`Put finger ${held} down and leave it there. The other three play around it without it `+
        `lifting, on two strings, up and back. Stop the moment the held finger rises or the `+
        `hand starts to squeeze.`,
  pass:`Two strings both directions with finger ${held} never leaving the string and no pain anywhere.`,
  root:0,
  rootName:`Position ${position}`,
  tempo:52,
  bars,
  loop:true,
 };
}

export const TECHNIQUE_DRILLS:TabExercise[]=[
 ...FINGER_ORDERS.map(order=>permutationDrill(order)),
 ...FINGER_ORDERS.map(order=>crossingDrill(order)),
 ...[1,2,3,5,7].map(distance=>shiftDrill(distance)),
 ...[1,2,3,4].map(finger=>anchorDrill(finger)),
];


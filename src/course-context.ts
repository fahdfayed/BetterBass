import {COURSE_LESSONS} from "./course-data.ts";
import {COURSE_TABS} from "./tab/course-exercises.ts";
import {MODES,PITCH_NAMES} from "./harmony-fretboard-data.ts";

/**
 * The harmonic ground a lesson is taught on.
 *
 * The workspace panes — the fretboard, the band, the ear pad — were opening on
 * whatever key the player last happened to leave them in, so the Lydian lesson
 * could open its fretboard in Dorian and the pane claiming "the band follows
 * the lesson's key and mode" was simply wrong. Every lesson already knows
 * enough to answer this: its own first exercise names the root it is written
 * in, and its interval list names the collection.
 */

const mod=(value:number)=>((value%12)+12)%12;

/** The root the lesson's own exercises are written in. */
function rootOf(index:number){
 const first=COURSE_TABS[`l${index}-0`];
 return first?mod(first.root):0;
}

/**
 * The mode a lesson is taught in.
 *
 * Twelve lessons name a complete mode in their interval list. The rest teach
 * part of one — a four-note cell, a rhythmic pair, a chromatic set — and
 * guessing a mode from those produces nonsense: a lesson on rhythmic weight
 * whose two intervals are the root and a ♭2 is not a Phrygian lesson.
 *
 * So the interval list answers only when it is a whole mode. Otherwise the
 * lesson's own exercises are asked, because somebody wrote down what they are
 * played over — "A Dorian", "Bm7♭5 vamp", "Cmaj7 drone" — and that is the
 * ground the lesson actually teaches on.
 */
const NAMED=["Ionian","Dorian","Phrygian","Lydian","Mixolydian","Aeolian","Locrian"];

function groundsOf(index:number){
 return [0,1,2,3]
  .map(slot=>COURSE_TABS[`l${index}-${slot}`]?.rootName)
  .filter((name):name is string=>!!name)
  .join(" · ");
}

function modeOf(index:number){
 const lesson=COURSE_LESSONS[index];
 const wanted=[...new Set(lesson.intervals.map(mod))].sort((a,b)=>a-b);

 const exact=MODES.findIndex(mode=>{
  const has=[...mode.s].map(mod).sort((a,b)=>a-b);
  return has.length===wanted.length&&has.every((x,i)=>x===wanted[i]);
 });
 if(exact>=0)return exact;

 const grounds=groundsOf(index);

 // A mode named outright wins: it was written by someone who knew.
 const named=NAMED.findIndex(name=>grounds.includes(name));
 if(named>=0)return named;

 /*
  * Otherwise the chord quality names it. Minor is the ambiguous one — Dorian
  * and Aeolian share everything but the sixth — so the lesson's own tones
  * decide: a natural 6 makes it Dorian, a ♭6 Aeolian, and with neither present
  * Dorian, which is the minor this course teaches from.
  */
 /*
  * Only a chord built on the lesson's own root says anything about its mode.
  * Lesson 23 is played over "G7 vamp, then G7→C" in the key of C with D as its
  * root; reading that G7 as the lesson's quality made a ii chord Mixolydian.
  */
 const home=PITCH_NAMES[rootOf(index)].replace("♯","#");
 const onHome=(quality:string)=>
  new RegExp(`${home.replace("#","[#♯]")}\s*${quality}`,"i").test(grounds);
 const has=(pattern:RegExp)=>pattern.test(grounds);

 // Every interval in the octave is a chromatic lesson, not a modal one; the
 // major scale is what those are measured against.
 if(wanted.length>=11)return 0;

 if(onHome("m7[♭b]5")||onHome("ø"))return 6;
 if(onHome("maj7"))return 0;
 if(onHome("7(?![a-z])"))return 4;
 if(onHome("m7")||has(/minor/)){
  if(wanted.includes(9))return 1;
  if(wanted.includes(8))return 5;
  return 1;
 }
 // Nothing named at all — a drone lesson. Its own third decides.
 if(wanted.includes(3))return wanted.includes(8)?5:1;
 return 0;
}

export type LessonContext={
 root:number;
 mode:number;
 /** A chord the pane can name this ground with. */
 chord:string;
};

/** Minor-ish modes take a minor seventh; the brighter ones take their own. */
const chordFor=(root:number,mode:number)=>{
 const third=MODES[mode].s.find(iv=>mod(iv)===3||mod(iv)===4);
 const fifth=MODES[mode].s.some(iv=>mod(iv)===6)&&!MODES[mode].s.some(iv=>mod(iv)===7);
 const name=PITCH_NAMES[root];
 if(fifth)return `${name}m7b5`;
 if(third===3)return `${name}m7`;
 return MODES[mode].s.some(iv=>mod(iv)===10)?`${name}7`:`${name}maj7`;
};

export function lessonContext(index:number):LessonContext{
 const safe=Math.max(0,Math.min(COURSE_LESSONS.length-1,index));
 const root=rootOf(safe),mode=modeOf(safe);
 return {root,mode,chord:chordFor(root,mode)};
}

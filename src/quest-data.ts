import {COURSE_LESSONS} from "./course-data.ts";
import {lessonContext} from "./course-context.ts";
import {MODES,PITCH_NAMES} from "./harmony-fretboard-data.ts";

/**
 * A journey through the lesson's own harmony, played on the bass.
 *
 * The site can hear the player and never asks them to prove anything with the
 * instrument in real time — the ear ladder plays sounds at you, the jury is
 * scored by hand afterwards. This asks for one note at a time and does not move
 * until it hears the right one.
 *
 * The story is not decoration bolted onto the notes. Each place is what the
 * degree actually does: the tritone is exactly half the octave and home is
 * equally far in both directions from it, the seventh is a semitone below home
 * and will not wait, the fourth is a crossing rather than somewhere to stand.
 * A player who remembers the journey has remembered the functions.
 *
 * The arc is the one this whole site is named for. Leave home, climb to the top
 * of the lesson's own collection by way of the note it is about, and come back
 * down a different road.
 */

const mod=(value:number)=>((value%12)+12)%12;

type Place={place:string;beat:string};

/** What each degree is, told as somewhere you can stand. */
const PLACES:Place[]=[
 {place:"Home",beat:"Everything after this is measured from here."},
 {place:"The Near Gate",beat:"One semitone out — close enough that it feels like pressure on the door rather than distance."},
 {place:"The Rise",beat:"A whole step. Far enough to have left, near enough to fall back without trying."},
 {place:"The Grey Fork",beat:"The road turns minor here. Whatever happens next, it happens in the dark."},
 {place:"The Bright Fork",beat:"The road turns major here. This is the note that decided it."},
 {place:"The Ford",beat:"A crossing, not a place to stand. Over a major third it pulls down onto it."},
 {place:"The Tritone Bridge",beat:"Exactly half the octave. From here home is the same distance in either direction."},
 {place:"The Waystone",beat:"The most solid ground outside home, and it decides nothing — no major, no minor."},
 {place:"The Long Shadow",beat:"It leans downward onto the fifth. This is the weight in a minor key."},
 {place:"The High Meadow",beat:"Bright, and it still has not changed whether the road is major or minor."},
 {place:"The Open Gate",beat:"No pull homeward at all. You could stay out here, and some music does."},
 {place:"The Last Light",beat:"A semitone under home. It wants to resolve and it will not wait long."},
];

export type QuestStep={
 /** Semitones above the root. Matched by pitch class, so any octave counts. */
 degree:number;
 place:string;
 beat:string;
 /** A wrong note sends the player back to the last of these. */
 checkpoint:boolean;
};

export type Quest={
 lesson:number;
 title:string;
 premise:string;
 /** Pitch class of home. */
 root:number;
 mode:number;
 rootName:string;
 modeName:string;
 steps:QuestStep[];
};

/**
 * Build the path.
 *
 * Up through the lesson's degrees to the top of them, then home by the chord
 * tones — a different road back, which is the point of going out at all.
 *
 * The turn is the summit rather than the characteristic tone, because the
 * characteristic tone is often near home: making it the turning point gave the
 * Phrygian lesson a journey of root, ♭2, root. The characteristic tone is still
 * the landmark, marked wherever it falls on the way up.
 *
 * Consecutive steps are never the same degree — two identical targets in a row
 * would ask the player to play one note and have it counted twice.
 */
function pathOf(scale:number[],chordTones:number[]){
 /*
  * A chromatic lesson names all twelve degrees, and walking every one of them
  * and back is a march rather than a journey. Above an octatonic collection,
  * only the structural notes are visited.
  */
 const climb=scale.length>8
  ?scale.filter(degree=>degree===0||chordTones.includes(degree))
  :scale;

 const summit=climb[climb.length-1]??7;
 const back=chordTones.filter(degree=>degree>0&&degree<summit).sort((a,b)=>b-a);
 const raw=[...climb,...back,0];

 const path:number[]=[];
 for(const degree of raw)if(path[path.length-1]!==degree)path.push(degree);
 return path;
}

export function questFor(index:number):Quest{
 const safe=Math.max(0,Math.min(COURSE_LESSONS.length-1,index));
 const lesson=COURSE_LESSONS[safe];
 const {root,mode}=lessonContext(safe);

 const own=[...new Set(lesson.intervals.map(mod))].sort((a,b)=>a-b);
 /*
  * Some lessons name two degrees — the rhythmic-weight one lists a root and a
  * ♭2 — which is not enough to walk anywhere. Those fall back to the mode the
  * lesson is actually taught on, which is the ground its exercises are played
  * over anyway.
  */
 const scale=own.length>=5?own:[...new Set(MODES[mode].s.map(mod))].sort((a,b)=>a-b);

 const tones=[...new Set(MODES[mode].s.map(mod))].filter(degree=>
  degree===0||degree===3||degree===4||degree===7||degree===10||degree===11);

 // The landmark: what the lesson is about, wherever it falls on the way up.
 const character=lesson.character.map(mod).filter(degree=>degree>0&&scale.includes(degree));
 const far=character[0]??0;

 const path=pathOf(scale,tones);

 /*
  * The turn is always somewhere to fall back to. Two lessons name a
  * characteristic tone their own scale does not contain, which left them with
  * the start as their only checkpoint — one wrong note near the end and the
  * whole path was gone.
  */
 const summit=Math.max(...path);
 const turn=path.indexOf(summit);

 const steps:QuestStep[]=path.map((degree,position)=>{
  const at=PLACES[mod(degree)];
  const isFar=degree===far&&position>0&&path.indexOf(degree)===position;
  const isEnd=position===path.length-1;
  return {
   degree,
   place:isFar?`${at.place} — the far point`:isEnd?"Home again":at.place,
   beat:isFar
    ?`${at.beat} This is the note the lesson is about — the reason for the whole walk.`
    :isEnd
     ?"Home, from the other side. It should sound like arriving rather than like stopping."
     :at.beat,
   // Home, the landmark and the turn: the places worth being sent back to.
   checkpoint:position===0||isFar||position===turn,
  };
 });

 return {
  lesson:safe,
  title:lesson.title,
  premise:`Leave ${PITCH_NAMES[root]}, climb as far as the path goes${far?`, by way of the `+
          `${PLACES[mod(far)].place.toLowerCase()}`:""}, and find a different way home. `+
          `Nothing moves until the bass plays the right note.`,
  root,mode,
  rootName:PITCH_NAMES[root],
  modeName:MODES[mode].n,
  steps,
 };
}

/** Where the player has got to. */
export type Walk={
 /** Index of the step being asked for. */
 at:number;
 misses:number;
 /** Furthest step reached this attempt, which survives being sent back. */
 best:number;
 done:boolean;
};

export const startWalk=():Walk=>({at:0,misses:0,best:0,done:false});

/** How many wrong turns before the road is lost entirely. */
export const MISSES_ALLOWED=3;

export const targetPitchOf=(quest:Quest,walk:Walk)=>
 mod(quest.root+quest.steps[Math.min(walk.at,quest.steps.length-1)].degree);

/**
 * One note, judged.
 *
 * Kept out of the component so the rule can be tested without a bass in
 * somebody's hands: a hit moves on, and a miss falls back to the last place
 * worth standing rather than to the beginning. Matched by pitch class, because
 * which octave the player found the note in is not what is being asked.
 */
export function step(quest:Quest,walk:Walk,played:number):Walk&{hit:boolean}{
 if(walk.done)return {...walk,hit:false};

 if(mod(played)===targetPitchOf(quest,walk)){
  const next=walk.at+1;
  return {
   at:Math.min(next,quest.steps.length-1),
   misses:walk.misses,
   best:Math.max(walk.best,next),
   done:next>=quest.steps.length,
   hit:true,
  };
 }

 let back=0;
 for(let index=walk.at-1;index>=0;index--)if(quest.steps[index].checkpoint){back=index;break}
 return {at:back,misses:walk.misses+1,best:walk.best,done:false,hit:false};
}

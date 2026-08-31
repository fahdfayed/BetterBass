import {NOTE_NAMES} from "../pitch.ts";
import {SHORT_NAMES} from "../theory/degrees.ts";

/**
 * The eight games, as rules rather than as screens.
 *
 * Seven of the eight used to be a card that set some state and opened another
 * view: "Fog of War" dimmed the fretboard labels and left you there, "Daily
 * Boss Fight" opened the take recorder. Nothing kept score, nothing ended, and
 * nothing checked what you played — two of them opened the same screen in the
 * same state as each other.
 *
 * The rules live here so they can be tested without a bass or a browser: what
 * is asked, what counts as right, and how the difficulty moves.
 */

const mod=(value:number)=>((value%12)+12)%12;

/** One question. */
export type Ask={
 /** The instruction, already written for the player. */
 prompt:string;
 /** Why this one, or what to listen for. Optional. */
 hint?:string;
 /**
  * The pitch classes to play, in order. Empty means any pitch will do, which
  * is what the rhythm drill wants.
  */
 notes:number[];
 /** Beats of the bar the notes must land on, for the timed drills. */
 beats?:number[];
 /** Seconds allowed once the ask appears, for the drills that are a race. */
 limit?:number;
 /** Sound this before the player answers — the reference they are owed. */
 reference?:number[];
 /**
  * Any one of these ends the round, in place of `notes`.
  *
  * The rescue has no single right answer — every tone of the chord resolves
  * the forced note, and which one you choose is a musical decision rather than
  * a correct one.
  */
 accept?:number[];
};

export type Drill={
 id:string;
 title:string;
 desc:string;
 /** Does the clock run for this one. */
 timed:boolean;
 /** Roughly how long a session should last, in seconds. 0 means untimed. */
 session:number;
 /** Build the next question. `level` rises with the streak. */
 ask:(root:number,level:number,random:()=>number)=>Ask;
};

const pick=<T,>(list:T[],random:()=>number)=>list[Math.floor(random()*list.length)]??list[0];

/** Degrees to draw from, widening as the streak grows. */
const POOLS=[
 [0,4,7,10],                       // chord tones
 [0,2,4,5,7,9,11],                 // the whole scale
 [0,1,3,4,6,8,10],                 // colours and alterations
 [0,1,2,3,4,5,6,7,8,9,10,11],      // everything
];
const poolFor=(level:number)=>POOLS[Math.min(level,POOLS.length-1)];

/** The chord qualities the enclosure drill aims into. */
const QUALITIES=[
 {symbol:"maj7",tones:[0,4,7,11]},
 {symbol:"m7",tones:[0,3,7,10]},
 {symbol:"7",tones:[0,4,7,10]},
 {symbol:"m7♭5",tones:[0,3,6,10]},
];

/** How a target can be surrounded. Offsets end on the target itself. */
const APPROACHES=[
 {name:"from a semitone below",offsets:[-1,0]},
 {name:"from a semitone above",offsets:[1,0]},
 {name:"above then below",offsets:[1,-1,0]},
 {name:"below then above",offsets:[-1,1,0]},
];

export const DRILLS:Drill[]=[
 {
  id:"location",title:"Note Location Sniper",
  desc:"Find any called pitch in under two seconds.",
  timed:false,session:90,
  ask:(root,level,random)=>{
   const note=Math.floor(random()*12);
   return {
    prompt:`Play ${NOTE_NAMES[note]}`,
    hint:"Anywhere on the neck. Speed is the whole point — do not hunt for a shape.",
    notes:[note],
    // The window tightens as the streak grows, which is the drill's difficulty.
    limit:Math.max(1.2,2.4-level*.3),
   };
  },
 },
 {
  id:"interval",title:"Interval Sniper",
  desc:"Hear the root; play the requested function.",
  timed:false,session:0,
  ask:(root,level,random)=>{
   const degree=pick(poolFor(level).filter(d=>d!==0),random);
   return {
    prompt:`Play ${SHORT_NAMES[degree]}`,
    hint:`Home is ${NOTE_NAMES[root]}. The degree is named and the note is not, on purpose.`,
    notes:[mod(root+degree)],
    reference:[root],
   };
  },
 },
 {
  id:"rescue",title:"Wrong Note Rescue",
  desc:"Make a forced outside note sound deliberate.",
  timed:false,session:0,
  ask:(root,level,random)=>{
   const quality=pick(QUALITIES,random);
   const inside=quality.tones.map(tone=>mod(root+tone));
   const outside=[...Array(12).keys()].filter(pc=>!inside.includes(pc));
   const forced=pick(outside,random);
   // Any chord tone rescues it; the nearest ones are the convincing answers.
   return {
    prompt:`${NOTE_NAMES[forced]} over ${NOTE_NAMES[root]}${quality.symbol} — resolve it`,
    hint:"Land on any tone of the chord. A semitone away pulls hardest.",
    notes:[],
    accept:inside,
    reference:[forced],
   };
  },
 },
 {
  id:"landing",title:"Target Note Landing",
  desc:"Hit assigned notes on exact beats and bars.",
  timed:true,session:120,
  ask:(root,level,random)=>{
   const degree=pick(poolFor(Math.min(level,1)),random);
   const beat=1+Math.floor(random()*4);
   return {
    prompt:`Play ${NOTE_NAMES[mod(root+degree)]} on beat ${beat}`,
    hint:`It is the ${SHORT_NAMES[degree]} of ${NOTE_NAMES[root]}. The click keeps going — land it in the bar, not near it.`,
    notes:[mod(root+degree)],
    beats:[beat],
   };
  },
 },
 {
  id:"enclosure",title:"Enclosure Generator",
  desc:"Surround chord tones from above and below.",
  timed:false,session:0,
  ask:(root,level,random)=>{
   const quality=pick(QUALITIES,random);
   const target=pick(quality.tones,random);
   // Longer surrounds once the short ones are reliable.
   const approach=pick(level>=1?APPROACHES:APPROACHES.slice(0,2),random);
   const absolute=mod(root+target);
   return {
    prompt:`Approach ${NOTE_NAMES[absolute]} ${approach.name}`,
    hint:`It is the ${SHORT_NAMES[target]} of ${NOTE_NAMES[root]}${quality.symbol}. Play the approach and the target, in order.`,
    notes:approach.offsets.map(offset=>mod(absolute+offset)),
   };
  },
 },
 {
  id:"rhythm",title:"Rhythm Before Notes",
  desc:"Build music before adding pitch choices.",
  timed:true,session:120,
  ask:(root,level,random)=>{
   // A figure inside one bar. More of the bar is used as the streak grows.
   const candidates=[[1,3],[1,2,4],[2,4],[1,3,4],[1,2,3,4]];
   const beats=pick(candidates.slice(0,2+level),random);
   return {
    prompt:`Play on ${beats.join(", ")}`,
    hint:"Any pitch at all. This one only listens to when.",
    notes:[],
    beats,
   };
  },
 },
 {
  id:"fog",title:"Fog of War",
  desc:"Maps disappear as recall improves.",
  timed:false,session:120,
  ask:(root,level,random)=>{
   const degree=pick(poolFor(level).filter(d=>d!==0),random);
   return {
    prompt:`Play ${SHORT_NAMES[degree]} of ${NOTE_NAMES[root]}`,
    // The help is the reference tone, and it is what gets taken away.
    hint:level===0
     ?"Home is sounded first while you find your bearings."
     :level===1
      ?"Home is sounded once more, then it stops."
      :"No reference now. The centre has to be somewhere you already are.",
    notes:[mod(root+degree)],
    reference:level<=1?[root]:undefined,
   };
  },
 },
 {
  id:"boss",title:"Daily Boss Fight",
  desc:"Three minutes. No help. No stopping.",
  timed:false,session:180,
  ask:(root,level,random)=>{
   // Everything the other drills ask, with the reference tones removed.
   const source=pick(
    DRILLS.filter(drill=>drill.id!=="boss"&&drill.id!=="rhythm"&&drill.id!=="landing"),
    random,
   );
   const inner=source.ask(root,Math.max(level,1),random);
   return {...inner,reference:undefined,limit:undefined,
    hint:`${source.title} — no reference, no second try.`};
  },
 },
];

export const drillById=(id:string)=>DRILLS.find(drill=>drill.id===id);

/**
 * How far through an ask a played note takes you.
 *
 * A sequence has to arrive in order, and a wrong note restarts it rather than
 * ending the round — the enclosure is the point of the exercise, and losing it
 * on the last of four notes with no way back teaches nothing.
 */
export function advance(ask:Ask,progress:number,played:number):{progress:number;hit:boolean;done:boolean}{
 if(ask.accept){
  const hit=ask.accept.map(mod).includes(mod(played));
  return {progress:0,hit,done:hit};
 }
 if(!ask.notes.length)return {progress:0,hit:true,done:true};

 const wanted=ask.notes[progress];
 if(mod(played)===mod(wanted)){
  const next=progress+1;
  return {progress:next>=ask.notes.length?0:next,hit:true,done:next>=ask.notes.length};
 }
 // A restart, unless the wrong note happens to be the first one.
 const restarted=mod(played)===mod(ask.notes[0])?1:0;
 return {progress:restarted,hit:false,done:false};
}

/** Did a note land close enough to its beat to count. */
export const onBeat=(beatPosition:number,wanted:number,tolerance=.28)=>{
 const distance=Math.abs(beatPosition-wanted);
 return Math.min(distance,4-distance)<=tolerance;
};

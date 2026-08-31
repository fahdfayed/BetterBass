import {PASSAGES} from "../beast-passages.ts";
import {exerciseFromAsciiTab} from "./ascii-tab.ts";
import {type Bar,type TabExercise,n,r,run} from "./notation.ts";

/**
 * Playable tabs for the parts of the site outside the 28-lesson course: the
 * Beast programme, the slap ladder and the maqam module.
 */

const E1=28,A1=33,C2=36,D2=38,G1=31;

/* ---------------- The Beast programme ---------------- */

/**
 * The Beast passages already ship as plain-text tab, so they are converted
 * rather than rewritten — the fingerings in the manual are the point of those
 * exercises, and re-deriving them would quietly move notes the author chose.
 */
export const BEAST_TABS:TabExercise[]=PASSAGES.flatMap(passage=>{
 const tempo=/(\d{2,3})\s*BPM/i.exec(passage.hammer)?.[1];
 const base={brief:passage.how,pass:passage.hammer,tempo:tempo?Number(tempo):50};

 // A few passages are a heading over several written variants; those variants
 // are the actual exercises.
 if(passage.variants?.length){
  return passage.variants.map((variant,i)=>exerciseFromAsciiTab({
   ...base,
   id:`${passage.id}-${i}`,
   title:`${passage.title} · ${variant.name}`,
   brief:variant.note,
   tab:variant.tab,
  }));
 }
 return [exerciseFromAsciiTab({...base,id:passage.id,title:passage.title,tab:passage.tab})];
});

export const beastTab=(id:string)=>BEAST_TABS.find(tab=>tab.id===id);

/* ---------------- The slap ladder ---------------- */

type SlapSpec={drill:string;title:string;brief:string;pass:string;root:number;rootName:string;tempo:number;bars:Bar[]};

// Slap notation is a plucking-hand vocabulary — thumb, pop, ghost — that tab
// cannot spell directly. What the tab carries is the pitch and the grid; the
// drill's own text still says which hand does what, and ghosts are written as
// dead notes so the subdivision stays visible.
const SLAP:SlapSpec[]=[
 {drill:"rebound",title:"Railroad rebound",brief:"One thumb note per beat on the open E, everything else silent.",pass:"Every note rings equally and nothing else sounds.",root:E1,rootName:"Open E",tempo:40,bars:[
  run([0,0,0,0],4),run([0,0,0,0],4),
  [n(0,4),r(4),n(0,4),r(4)],
  [n(0,2),r(2)],
 ]},
 {drill:"octave",title:"Root–octave handshake",brief:"Thumb the root, pop the octave. Matched volume, nothing in between.",pass:"Root and octave sit at the same volume.",root:A1,rootName:"A · root and octave",tempo:60,bars:[
  [n(0,4),n(12,4),n(0,4),n(12,4)],
  [n(0,8),n(12,8),n(0,4),n(12,2)],
  [n(0,4),n(12,4),n(0,8),n(12,8),n(0,4)],
  [n(0,2),n(12,2)],
 ]},
 {drill:"ghost",title:"Sixteenth-note ghost matrix",brief:"Sounded roots inside a full sixteenth grid. The dead notes keep the subdivision alive.",pass:"The grid never wavers, and only the chosen notes speak.",root:A1,rootName:"A · sixteenth grid",tempo:64,bars:[
  [n(0,16),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,16),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,16),n(0,16,{ghost:true}),
   n(0,16,{ghost:true}),n(0,16),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,16),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,16,{ghost:true})],
  [n(0,16),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(12,16),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,16),
   n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(12,16),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,16),n(0,16,{ghost:true}),n(0,16,{ghost:true})],
 ]},
 {drill:"layer",title:"One-groove construction",brief:"Skeleton, then one ghost, then one hammer-on, then one octave answer. Add nothing until the pocket holds.",pass:"Each added layer leaves the pocket where it was.",root:A1,rootName:"A minor groove",tempo:72,bars:[
  [n(0,4),r(4),n(0,4),r(4)],
  [n(0,4),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,8),n(0,4),r(4)],
  [n(0,8),n(3,8),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,8),n(0,4),r(4)],
  [n(0,8),n(3,8),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,8),n(12,4),n(10,4)],
 ]},
 {drill:"double",title:"Double-thumb pendulum",brief:"Down and up thumb strokes at one volume. The upstroke must not be the quiet one.",pass:"Down and up are indistinguishable by volume.",root:A1,rootName:"A · double thumb",tempo:56,bars:[
  run([0,0,0,0,0,0,0,0],8),
  run([0,12,0,12,0,12,0,12],8),
  run([0,3,5,7,5,3,0,0],8),
  [n(0,2),r(2)],
 ]},
 {drill:"four",title:"Four-stroke cell",brief:"Thumb down, thumb up, index pop, middle pop — one circular gesture, four attacks.",pass:"The four attacks feel like one motion, not four decisions.",root:A1,rootName:"A · four-stroke",tempo:52,bars:[
  [n(0,16),n(12,16),n(15,16),n(19,16),n(0,16),n(12,16),n(15,16),n(19,16),
   n(0,16),n(12,16),n(15,16),n(19,16),n(0,16),n(12,16),n(15,16),n(19,16)],
  [n(0,16),n(12,16),n(15,16),n(19,16),n(0,16),n(12,16),n(15,16),n(19,16),n(0,4),r(4)],
 ]},
 {drill:"ohp",title:"Open–hammer–pluck conversation",brief:"One plucking attack launches several fretting events: open string, hammer, then the pop above.",pass:"Three sounds from one attack, all even.",root:A1,rootName:"A · open-hammer-pluck",tempo:60,bars:[
  [n(-5,8),n(0,8),n(12,4),n(-5,8),n(0,8),n(12,4)],
  [n(-5,8),n(3,8),n(15,4),n(-5,8),n(0,8),n(12,4)],
  [n(-5,8),n(0,8),n(12,8),n(10,8),n(7,4),n(0,4)],
  [n(0,2),r(2)],
 ]},
 {drill:"capstone",title:"Five-minute musical proof",brief:"Establish, converse, develop, peak once, return. Vocabulary earns nothing if the time weakens.",pass:"The arc is audible and the pocket never pays for it.",root:A1,rootName:"A · full arc",tempo:76,bars:[
  [n(0,4),r(4),n(0,8),n(12,8),n(0,4)],
  [n(0,8),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(3,8),n(0,8),n(12,4),n(10,4)],
  [n(0,8),n(3,8),n(5,8),n(7,8),n(10,4),n(12,4)],
  [n(15,8),n(12,8),n(10,8),n(7,8),n(3,4),n(0,4)],
  [n(0,2),r(2)],
 ]},
];

export const SLAP_TABS:Record<string,TabExercise>=Object.fromEntries(
 SLAP.map(spec=>[spec.drill,{
  id:`slap-${spec.drill}`,title:spec.title,brief:spec.brief,pass:spec.pass,
  root:spec.root,rootName:spec.rootName,tempo:spec.tempo,bars:spec.bars,loop:true,
 } satisfies TabExercise]),
);

export const slapTab=(drillId:string)=>SLAP_TABS[drillId];

/* ---------------- Maqam ---------------- */

/**
 * Only the maqamat that live entirely in twelve-tone equal temperament get a
 * tab. Bayati, Rast, Saba and Sikah all turn on quarter-tones — a half-flat
 * third is the whole identity of Rast — and writing them as their nearest fret
 * would teach the wrong pitch, so those keep the module's own cents-accurate
 * drone and tuner instead of getting notation that lies about them.
 */
const MAQAM_STEPS:Record<string,number[]>={
 hijaz:[0,1,4,5,7,8,10,12],
 nahawand:[0,2,3,5,7,8,11,12],
 kurd:[0,1,3,5,7,8,10,12],
 ajam:[0,2,4,5,7,9,11,12],
};

const MAQAM_META:Record<string,{title:string;ghammaz:number;root:number;rootName:string}>={
 hijaz:{title:"Hijaz",ghammaz:3,root:D2,rootName:"D Hijaz"},
 nahawand:{title:"Nahawand",ghammaz:4,root:C2,rootName:"C Nahawand"},
 kurd:{title:"Kurd",ghammaz:3,root:D2,rootName:"D Kurd"},
 ajam:{title:"Ajam",ghammaz:4,root:G1,rootName:"G Ajam"},
};

export const MAQAM_TABS:Record<string,TabExercise>=Object.fromEntries(
 Object.entries(MAQAM_STEPS).map(([id,steps])=>{
  const meta=MAQAM_META[id];
  // The lower jins is the first four degrees; the ghammaz is where the upper
  // jins takes over, so the sayr is written to turn there.
  const lower=steps.slice(0,meta.ghammaz+1);
  return [id,{
   id:`maqam-${id}`,
   title:`${meta.title} · sayr`,
   brief:`Lower jins, the turn at the ghammaz, then the full ascent and a descent that lands on the tonic.`,
   pass:"The tonic returns without searching, and the ghammaz is audible as the turn.",
   root:meta.root,
   rootName:meta.rootName,
   tempo:56,
   bars:[
    lower.map(deg=>n(deg,4)).concat(Array.from({length:Math.max(0,4-lower.length)},()=>r(4))).slice(0,4),
    [...lower].reverse().map(deg=>n(deg,4)).concat(Array.from({length:Math.max(0,4-lower.length)},()=>r(4))).slice(0,4),
    run(steps.slice(0,8),8),
    run([...steps].reverse().slice(0,8),8),
    [n(0,2),r(2)],
   ],
   loop:true,
  } satisfies TabExercise];
 }),
);

export const maqamTab=(maqamId:string)=>MAQAM_TABS[maqamId];

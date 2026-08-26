import {type Bar,type TabExercise,n,r,run} from "./notation.ts";

/**
 * A playable tab for every exercise in the 28-lesson course.
 *
 * Each one is written to the task the lesson already sets, not to a generic
 * pattern: when the prose says "land ♭3 on beat 3", the tab lands ♭3 on beat 3.
 * Everything is spelled in degrees above the root the lesson names, so the same
 * exercise transposes without being rewritten, and the fretting is worked out
 * at render time by the fingering pass in {@link ./notation}.
 */

// Roots in the register a bass actually plays them in.
const E1=28,FS1=30,G1=31,A1=33,B1=35,C2=36,D2=38;

type Spec={
 lesson:number;
 /** Index into the lesson's own exercises array, so the two line up. */
 index:number;
 title:string;
 brief:string;
 pass:string;
 root:number;
 rootName:string;
 tempo:number;
 ts?:[number,number];
 bars:Bar[];
};

/** Root, colour tone, root — the shape used wherever an interval is being named. */
const nameIt=(deg:number):Bar=>[n(0,4),n(deg,2),n(0,4)];
/** Two bars of the same figure with one degree swapped, for A/B comparisons. */
const compare=(figure:number[],a:number,b:number):Bar[]=>[
 run(figure.map(d=>(d===a?a:d)),4),
 run(figure.map(d=>(d===a?b:d)),4),
];

const SPECS:Spec[]=[
 /* ---------------- Unit 1 · The Inside Foundation ---------------- */
 {lesson:0,index:0,title:"Root gravity",brief:"A, E, C and G in changing orders. Every phrase ends on A without running a scale.",pass:"A feels final even when the phrase begins elsewhere.",root:A1,rootName:"A drone",tempo:66,bars:[
  run([7,3,10,0]),run([3,10,7,0]),run([10,7,3,0]),[n(0,2),r(2)],
 ]},
 {lesson:0,index:1,title:"False home",brief:"Two bars leaning on E, then C→A and G→A restore A as home.",pass:"You can name the exact moment the ear returned to A.",root:A1,rootName:"A drone",tempo:70,bars:[
  [n(7,4),n(2,4),n(7,2)],
  [n(7,4),n(10,4),n(7,2)],
  [n(3,4),n(0,4),n(10,4),n(0,4)],
  [n(0,2),r(2)],
 ]},
 {lesson:0,index:2,title:"Bass-led harmony",brief:"E, E♭, F♯ and B♭ underneath a C drone — major, minor, Lydian and Mixolydian in turn.",pass:"Name the perceived colour before replaying.",root:C2,rootName:"C drone",tempo:60,bars:[
  [n(4,2),n(0,2)],[n(3,2),n(0,2)],[n(6,2),n(0,2)],[n(10,2),n(0,2)],
 ]},

 {lesson:1,index:0,title:"Sing before play",brief:"Sing each degree against the drone, then verify it. ♭2, 2, ♭3, 3, ♯4, 5, 6, ♭7, 7.",pass:"Exact, or corrected immediately without fishing.",root:A1,rootName:"A drone",tempo:56,bars:[
  nameIt(1),nameIt(2),nameIt(3),nameIt(4),nameIt(6),nameIt(7),nameIt(9),nameIt(10),nameIt(11),
 ]},
 {lesson:1,index:1,title:"Function sniper",brief:"On every click, the called interval — then say its note name and its function.",pass:"Inside two seconds, no silent searching.",root:A1,rootName:"A · random calls",tempo:50,bars:[
  run([0,4,0,7]),run([0,9,0,10]),run([0,3,0,6]),run([0,11,0,0]),
 ]},
 {lesson:1,index:2,title:"One interval, three meanings",brief:"E stays fixed. It is the 3rd of C, the 5th of A and the 2nd of D — hear the function change, not the pitch.",pass:"Function, not fingering, drives each phrase.",root:C2,rootName:"C, A and D drones",tempo:56,bars:[
  [n(0,4),n(4,2),n(0,4)],
  [n(-3,4),n(4,2),n(-3,4)],
  [n(2,4),n(4,2),n(2,4)],
 ]},

 {lesson:2,index:0,title:"Shell line",brief:"Four bars from A, C and G only. E arrives on the second pass.",pass:"Minor quality stays obvious with three pitches.",root:A1,rootName:"Am7",tempo:72,bars:[
  [n(0,4),n(3,4),n(10,2)],
  [n(3,4),n(0,4),n(10,2)],
  [n(10,4),n(3,4),n(0,2)],
  [n(0,2),r(2)],
  [n(0,4),n(3,4),n(7,4),n(10,4)],
  [n(7,4),n(3,4),n(0,2)],
  [n(10,4),n(7,4),n(3,4),n(0,4)],
  [n(0,2),r(2)],
 ]},
 {lesson:2,index:1,title:"Target hierarchy",brief:"Root on beat 1, ♭3 on beat 3, ♭7 on the next bar's beat 1. The notes between are only transport.",pass:"Targets land accurately without breaking time.",root:A1,rootName:"Am7 · click on 2 & 4",tempo:72,bars:[
  [n(0,4),n(5,8),n(7,8),n(3,4),n(2,8),n(0,8)],
  [n(10,4),n(9,8),n(7,8),n(5,4),n(3,8),n(2,8)],
  [n(0,4),n(3,8),n(5,8),n(3,4),n(2,8),n(0,8)],
  [n(10,2),n(0,2)],
 ]},
 {lesson:2,index:2,title:"Layered groove",brief:"Chord tones, then B/D/F♯ added, then one chromatic approach. Each layer keeps the chord readable.",pass:"Every layer adds colour while Am7 stays clear.",root:A1,rootName:"Am7 vamp",tempo:76,bars:[
  [n(0,4),n(7,4),n(3,4),n(10,4)],
  [n(0,4),n(10,4),n(7,2)],
  [n(0,4),n(2,8),n(3,8),n(7,4),n(9,8),n(10,8)],
  [n(5,4),n(3,4),n(0,2)],
  [n(0,4),n(2,8),n(3,8),n(7,4),n(6,8),n(7,8)],
  [n(9,8),n(10,8),n(0,4),n(11,8),n(0,8),n(0,4)],
  [n(0,4),n(3,4),n(4,8),n(3,8),n(2,8),n(0,8)],
  [n(0,2),r(2)],
 ]},

 {lesson:3,index:0,title:"Weight swap",brief:"B♭→A across the bar line, then B♭ landing on beat 1. Identical pitches, opposite weight.",pass:"You can hear and explain why the second version feels heavier.",root:A1,rootName:"Am7",tempo:70,bars:[
  [n(0,4),n(0,4),n(0,4),n(1,8),n(0,8)],
  [n(0,2),r(2)],
  [n(1,4),n(0,8),n(0,8),n(0,4),n(0,4)],
  [n(0,2),r(2)],
 ]},
 {lesson:3,index:1,title:"One note, four meanings",brief:"The same B♭→A ghosted, soft, accented and sustained. Pitch never changes; exposure does.",pass:"Rank the four by tension before replaying.",root:A1,rootName:"A drone",tempo:60,bars:[
  [n(1,16,{ghost:true}),n(0,16),n(0,8),n(0,4),r(2)],
  [n(1,8),n(0,8),n(0,4),r(2)],
  [n(1,4,{accent:true}),n(0,4),r(2)],
  [n(1,2),n(0,2)],
 ]},
 {lesson:3,index:2,title:"Register exposure",brief:"One gesture, three heights on the neck. Intensity changes without a single new note.",pass:"Control intensity without changing note choice.",root:A1,rootName:"A drone",tempo:64,bars:[
  [n(1,4),n(0,2),r(4)],
  [n(13,4),n(12,2),r(4)],
  [n(25,4),n(24,2),r(4)],
 ]},

 /* ---------------- Unit 2 · How Modes Work ---------------- */
 {lesson:4,index:0,title:"Mode carousel",brief:"One root, seven collections. Announce the altered degree before each change.",pass:"Altered degrees named before every change.",root:C2,rootName:"C drone",tempo:64,bars:[
  run([0,2,4,5,7,9,11,12],8),
  run([0,2,4,6,7,9,11,12],8),
  run([0,2,4,5,7,9,10,12],8),
  run([0,2,3,5,7,9,10,12],8),
  run([0,2,3,5,7,8,10,12],8),
  run([0,1,3,5,7,8,10,12],8),
  run([0,1,3,5,6,8,10,12],8),
 ]},
 {lesson:4,index:1,title:"Root reframe",brief:"The white notes never change. The drone moves to C, D, E and A and takes every interval with it.",pass:"Name the resulting mode and its intervals.",root:C2,rootName:"White-note collection",tempo:66,bars:[
  [n(0,4),n(4,4),n(7,4),n(11,4)],
  [n(2,4),n(5,4),n(9,4),n(12,4)],
  [n(4,4),n(7,4),n(11,4),n(14,4)],
  [n(-3,4),n(0,4),n(4,4),n(7,4)],
 ]},
 {lesson:4,index:2,title:"No-root identity",brief:"A modal phrase that never starts on C and still says which mode it is by bar 2.",pass:"The characteristic tone makes identity clear by bar 2.",root:C2,rootName:"C drone",tempo:70,bars:[
  [n(4,4),n(6,4),n(7,2)],
  [n(9,8),n(7,8),n(6,4),n(4,2)],
  [n(2,4),n(4,4),n(6,4),n(7,4)],
  [n(0,2),r(2)],
 ]},

 {lesson:5,index:0,title:"One-note morph",brief:"C Ionian and C Mixolydian back to back. B→B♭ is the only edit.",pass:"The whole environment changes from one degree.",root:C2,rootName:"C drone",tempo:66,bars:[
  ...compare([0,4,7,11],11,10),
  ...compare([7,11,7,4],11,10),
  [n(0,2),r(2)],
 ]},
 {lesson:5,index:1,title:"Relative re-root",brief:"C Ionian, then D Dorian, from one note collection. Each phrase ends on its own root.",pass:"No accidental return to C during the D section.",root:C2,rootName:"C major collection",tempo:70,bars:[
  [n(0,4),n(4,4),n(7,4),n(11,4)],
  [n(9,4),n(7,4),n(4,4),n(0,4)],
  [n(2,4),n(5,4),n(9,4),n(11,4)],
  [n(11,4),n(9,4),n(5,4),n(2,4)],
 ]},
 {lesson:5,index:2,title:"Distant transfer",brief:"F♯ Ionian, Dorian and Phrygian built by formula. No parent scale is named first.",pass:"All notes found without a diagram.",root:FS1,rootName:"F♯ root",tempo:64,bars:[
  run([0,2,4,5,7,9,11,12],8),
  run([0,2,3,5,7,9,10,12],8),
  run([0,1,3,5,7,8,10,12],8),
 ]},

 {lesson:6,index:0,title:"Family sort",brief:"Root and 3rd only. Decide major or minor before any colour is allowed in.",pass:"No mode named before the chord family is right.",root:C2,rootName:"C drone",tempo:60,bars:[
  [n(0,4),n(4,2),r(4)],
  [n(0,4),n(3,2),r(4)],
  [n(0,4),n(4,2),r(4)],
  [n(0,4),n(3,2),r(4)],
 ]},
 {lesson:6,index:1,title:"Brightness ladder",brief:"Lydian → Ionian → Mixolydian, then Dorian → Aeolian → Phrygian. Name the single alteration between neighbours.",pass:"You can name the one degree that changed each time.",root:C2,rootName:"C drone",tempo:64,bars:[
  run([0,4,6,7],4),run([0,4,5,7],4),run([0,4,5,10],4),
  run([0,3,9,10],4),run([0,3,8,10],4),run([0,1,3,8],4),
 ]},
 {lesson:6,index:2,title:"Emotional decoy",brief:"C Lydian and C Phrygian at one tempo, one articulation, one register. The interval is the only evidence.",pass:"You cite the interval, not a mood adjective.",root:C2,rootName:"C drone",tempo:68,bars:[
  [n(0,4),n(4,4),n(6,4),n(7,4)],
  [n(0,4),n(3,4),n(1,4),n(0,4)],
  [n(0,4),n(4,4),n(6,4),n(7,4)],
  [n(0,4),n(3,4),n(1,4),n(0,4)],
 ]},

 {lesson:7,index:0,title:"Scarcity study",brief:"D, F, A and B only. No scale runs — the natural 6 has to do the work.",pass:"Dorian is audible before bar 3.",root:D2,rootName:"D Dorian drone",tempo:72,bars:[
  [n(0,4),n(3,4),n(7,2)],
  [n(9,4),n(7,4),n(3,2)],
  [n(0,8),n(3,8),n(7,4),n(9,2)],
  [n(9,4),n(7,4),n(0,2)],
 ]},
 {lesson:7,index:1,title:"Too little / too much",brief:"One take hiding the 6, one overstating it, then a third that balances the dose.",pass:"You can explain why the final dosage works.",root:D2,rootName:"D Dorian",tempo:72,bars:[
  [n(0,4),n(3,4),n(7,4),n(10,4)],
  [n(9,8),n(9,8),n(9,8),n(9,8),n(9,4),n(9,4)],
  [n(0,4),n(3,8),n(5,8),n(9,4),n(7,4)],
  [n(0,2),r(2)],
 ]},
 {lesson:7,index:2,title:"Strong-beat colour",brief:"B once on a weak subdivision, then again on beat 3. Same note, different consequence.",pass:"You hear how metric weight changes modal clarity.",root:D2,rootName:"D Dorian",tempo:80,bars:[
  [n(0,4),n(3,4),n(7,8),n(9,8),n(7,4)],
  [n(0,4),n(3,4),n(9,2)],
  [n(0,2),r(2)],
 ]},

 /* ---------------- Unit 3 · The Seven Modal Sounds ---------------- */
 {lesson:8,index:0,title:"Shell and colour",brief:"Bar 1 states C–E–G–B. Bar 2 adds F and resolves it into E.",pass:"Major quality stays clear and F has direction.",root:C2,rootName:"Cmaj7 drone",tempo:75,bars:[
  run([0,4,7,11],4),
  [n(5,4),n(4,2),r(4)],
  run([11,7,4,0],4),
  [n(0,2),r(2)],
 ]},
 {lesson:8,index:1,title:"Four-note Ionian",brief:"C, E, G and B — then G is swapped for F and the stability changes.",pass:"You can describe the change in stability.",root:C2,rootName:"C drone",tempo:70,bars:[
  [n(0,4),n(4,4),n(7,4),n(11,4)],
  [n(11,4),n(7,4),n(4,2)],
  [n(0,4),n(4,4),n(5,4),n(11,4)],
  [n(11,4),n(5,4),n(4,2)],
 ]},
 {lesson:8,index:2,title:"Parallel test",brief:"C Ionian against C Mixolydian. Only the 7th moves.",pass:"You identify the version from the 7th alone.",root:C2,rootName:"C drone",tempo:70,bars:[
  ...compare([0,4,7,11],11,10),
  ...compare([4,7,11,0],11,10),
 ]},

 {lesson:9,index:0,title:"Four-note identity",brief:"D, F, A and B only. Put B somewhere the ear will remember it.",pass:"Dorian audible by bar 2.",root:D2,rootName:"D drone",tempo:76,bars:[
  [n(0,4),n(3,4),n(7,2)],
  [n(9,2),n(7,2)],
  [n(0,8),n(3,8),n(7,8),n(9,8),n(7,4),n(3,4)],
  [n(0,2),r(2)],
 ]},
 {lesson:9,index:1,title:"Dorian vs Aeolian",brief:"One phrase, twice. B natural becomes B♭ and the mode changes underneath it.",pass:"You hear and name the 6 / ♭6 contrast.",root:D2,rootName:"D drone",tempo:76,bars:[
  ...compare([0,3,7,9],9,8),
  ...compare([7,9,7,3],9,8),
 ]},
 {lesson:9,index:2,title:"Upper-structure colour",brief:"Dm, C major and G major triads connected by nearest note. B arrives as colour, not modulation.",pass:"B sounds like Dorian colour, not a key change.",root:D2,rootName:"Dm7 vamp",tempo:80,bars:[
  run([0,3,7],4).concat([n(10,4)]),
  run([10,14,17],4).concat([n(14,4)]),
  run([5,9,12],4).concat([n(9,4)]),
  [n(7,4),n(3,4),n(0,2)],
 ]},

 {lesson:10,index:0,title:"Root–♭2 control",brief:"F→E as a 16th, an 8th, a quarter and a half. The rub gets longer each time.",pass:"You rank the four intensities accurately.",root:E1,rootName:"E drone",tempo:65,bars:[
  [n(1,16,{ghost:true}),n(0,16),n(0,8),n(0,2),r(4)],
  [n(1,8),n(0,8),n(0,2),r(4)],
  [n(1,4),n(0,2),r(4)],
  [n(1,2),n(0,2)],
 ]},
 {lesson:10,index:1,title:"Minor shell first",brief:"Four bars of E–G–B–D, then F once per bar. The minor centre must stay stronger than the rub.",pass:"Minor centre remains stronger than the ♭2.",root:E1,rootName:"Em7 vamp",tempo:70,bars:[
  run([0,3,7,10],4),
  run([10,7,3,0],4),
  [n(0,4),n(3,4),n(1,4),n(0,4)],
  [n(0,4),n(7,4),n(1,4),n(0,4)],
 ]},
 {lesson:10,index:2,title:"Parallel test",brief:"One motif in E Aeolian, then E Phrygian. F♯ becomes F and nothing else moves.",pass:"Mode identified within two notes.",root:E1,rootName:"E drone",tempo:70,bars:[
  ...compare([0,2,3,7],2,1),
  ...compare([3,2,0,7],2,1),
 ]},

 {lesson:11,index:0,title:"Lydian cell",brief:"Motifs from C, D and F♯ only. F♯ resolves up to G or falls back to E.",pass:"All three notes feel related to C.",root:C2,rootName:"C drone",tempo:72,bars:[
  [n(0,4),n(2,4),n(6,2)],
  [n(6,4),n(7,2),r(4)],
  [n(2,4),n(6,4),n(4,2)],
  [n(0,2),r(2)],
 ]},
 {lesson:11,index:1,title:"Ionian contrast",brief:"One phrase with F, then with F♯. Hear the new pull up into G.",pass:"You hear the ♯4→5 gravity appear.",root:C2,rootName:"C drone",tempo:72,bars:[
  ...compare([0,4,5,7],5,6),
  ...compare([7,5,4,0],5,6),
 ]},
 {lesson:11,index:2,title:"Upper triad",brief:"C major and D major triads, connected by nearest tones. C stays home throughout.",pass:"C remains home despite the D triad.",root:C2,rootName:"Cmaj7 drone",tempo:76,bars:[
  run([0,4,7],4).concat([n(4,4)]),
  run([2,6,9],4).concat([n(6,4)]),
  run([7,4,2],4).concat([n(6,4)]),
  [n(4,2),n(0,2)],
 ]},

 {lesson:12,index:0,title:"Dominant shell",brief:"G, B, D and F. F is a structural tone here, not something that slipped in.",pass:"F sounds chosen, not accidental.",root:G1,rootName:"G7 vamp",tempo:78,bars:[
  run([0,4,7,10],4),
  [n(10,4),n(7,4),n(4,2)],
  [n(0,8),n(4,8),n(7,8),n(10,8),n(7,4),n(4,4)],
  [n(0,2),r(2)],
 ]},
 {lesson:12,index:1,title:"Static vs functional",brief:"The same F: held over the vamp, then resolved F→E as G7 moves to C.",pass:"You can hear when F wants to move and when it does not.",root:G1,rootName:"G7, then G7→C",tempo:78,bars:[
  [n(0,4),n(4,4),n(10,2)],
  [n(10,2),n(10,2)],
  [n(0,4),n(4,4),n(10,4),n(11,4)],
  [n(5,2),n(9,2)],
 ]},
 {lesson:12,index:2,title:"Ionian contrast",brief:"One phrase with F♯, then with F. The leading tone disappears.",pass:"You identify the mode from the 7th.",root:G1,rootName:"G drone",tempo:74,bars:[
  ...compare([0,4,7,11],11,10),
  ...compare([11,7,4,0],11,10),
 ]},

 {lesson:13,index:0,title:"Aeolian descent",brief:"C–B–A and F–E cells. F→E is the sound of the mode.",pass:"♭6 falling to 5 is the clearest event in the phrase.",root:A1,rootName:"A drone",tempo:72,bars:[
  [n(3,4),n(2,4),n(0,2)],
  [n(8,4),n(7,2),r(4)],
  [n(3,8),n(2,8),n(0,4),n(8,4),n(7,4)],
  [n(0,2),r(2)],
 ]},
 {lesson:13,index:1,title:"Dorian contrast",brief:"One motif twice. F becomes F♯ and the sixth lifts.",pass:"You hear the ♭6 / 6 difference without labels.",root:A1,rootName:"A drone",tempo:72,bars:[
  ...compare([0,3,7,8],8,9),
  ...compare([8,7,3,0],8,9),
 ]},
 {lesson:13,index:2,title:"Four-note scarcity",brief:"A, C, E and F only. The ♭6 carries the whole identity.",pass:"Aeolian is obvious from four pitches.",root:A1,rootName:"A drone",tempo:74,bars:[
  [n(0,4),n(3,4),n(7,2)],
  [n(8,4),n(7,4),n(3,2)],
  [n(0,8),n(3,8),n(7,8),n(8,8),n(7,4),n(0,4)],
  [n(0,2),r(2)],
 ]},

 {lesson:14,index:0,title:"m7♭5 shell",brief:"B, D, F and A. Leave G and C out until the shell is solid.",pass:"The diminished 5th is audible without the scale.",root:B1,rootName:"B drone",tempo:70,bars:[
  run([0,3,6,10],4),
  [n(10,4),n(6,4),n(3,2)],
  [n(0,8),n(3,8),n(6,8),n(10,8),n(6,4),n(3,4)],
  [n(0,2),r(2)],
 ]},
 {lesson:14,index:1,title:"Locrian colour",brief:"C added to the shell — once short, once sustained. Compare what each placement costs.",pass:"You can say why one placement destabilises more.",root:B1,rootName:"Bm7♭5 vamp",tempo:70,bars:[
  [n(0,4),n(1,8),n(3,8),n(6,4),n(3,4)],
  [n(0,4),n(1,2),n(3,4)],
  [n(6,4),n(3,4),n(0,2)],
 ]},
 {lesson:14,index:2,title:"Functional context",brief:"Bm7♭5 → E7 → Am, connected by nearest motion: A→G♯→A and D→D→C.",pass:"Every connection moves by a step or less.",root:B1,rootName:"Bm7♭5 → E7 → Am",tempo:74,bars:[
  [n(0,4),n(3,4),n(6,4),n(10,4)],
  [n(5,4),n(9,4),n(3,4),n(10,4)],
  [n(-2,4),n(1,4),n(5,4),n(8,4)],
  [n(-2,2),r(2)],
 ]},

 /* ---------------- Unit 4 · Modal Improvisation ---------------- */
 {lesson:15,index:0,title:"Four-layer groove",brief:"Root and 5th, then ♭3 and ♭7, then the Dorian 6, then melodic variation.",pass:"Each layer is audibly a layer, not a new idea.",root:D2,rootName:"Dm7",tempo:88,bars:[
  [n(0,4),n(7,4),n(0,4),n(7,4)],
  [n(0,4),n(3,8),n(0,8),n(10,4),n(7,4)],
  [n(0,4),n(3,8),n(5,8),n(9,4),n(7,4)],
  [n(0,8),n(3,8),n(7,8),n(9,8),n(10,4),n(0,4)],
 ]},
 {lesson:15,index:1,title:"Identity placement",brief:"B on &4, then beat 2, then beat 3. Three versions, one note moved.",pass:"You can hear which placement sells Dorian hardest.",root:D2,rootName:"D Dorian",tempo:88,bars:[
  [n(0,4),n(3,4),n(7,4),n(0,8),n(9,8)],
  [n(0,4),n(9,4),n(7,4),n(3,4)],
  [n(0,4),n(3,4),n(9,4),n(7,4)],
 ]},
 {lesson:15,index:2,title:"Genre transfer",brief:"One Dorian groove, three feels. The theory never changes — only the rhythm and articulation.",pass:"Same notes read as three different genres.",root:D2,rootName:"D Dorian",tempo:92,bars:[
  [n(0,8),n(0,16,{ghost:true}),n(0,16),n(3,8),n(7,8),n(9,8),n(7,8),n(3,4)],
  [n(0,4,{accent:true}),n(0,4),n(3,4),n(9,4)],
  [n(0,2),n(9,4),n(7,4)],
 ]},

 {lesson:16,index:0,title:"One note",brief:"A only. Rhythm, rests, dynamics, ghost notes and duration are the entire vocabulary.",pass:"It is musical with one pitch.",root:A1,rootName:"A · drum loop",tempo:84,bars:[
  [n(0,8),n(0,16,{ghost:true}),n(0,16),r(8),n(0,8),n(0,4,{accent:true}),r(4)],
  [n(0,2),r(8),n(0,8),n(0,4)],
  [n(0,16),n(0,16),n(0,8),r(4),n(0,4,{accent:true}),r(4)],
  [n(0,1)],
 ]},
 {lesson:16,index:1,title:"Four-note Dorian",brief:"A, C, E and F♯. Call and answer, with no fifth pitch allowed.",pass:"Call and response is clear without adding pitches.",root:A1,rootName:"A, C, E, F♯",tempo:84,bars:[
  [n(0,4),n(3,4),n(7,2)],
  [n(9,4),n(7,4),n(3,2)],
  [n(3,8),n(7,8),n(9,4),n(7,4),n(3,4)],
  [n(0,2),r(2)],
 ]},
 {lesson:16,index:2,title:"Anti-habit",brief:"No phrase starts on beat 1 or on A. Every third phrase descends.",pass:"No phrase breaks either rule.",root:A1,rootName:"Same four notes",tempo:84,bars:[
  [r(4),n(3,4),n(7,4),n(9,4)],
  [r(8),n(7,8),n(9,4),n(7,4),n(3,4)],
  [r(4),n(9,8),n(7,8),n(3,4),n(0,4)],
  [n(0,2),r(2)],
 ]},

 {lesson:17,index:0,title:"Capture",brief:"A three-note motif, repeated exactly three times. Exactly.",pass:"All three repetitions are identical.",root:A1,rootName:"A Dorian",tempo:80,bars:[
  [n(0,8),n(3,8),n(5,4),r(2)],
  [n(0,8),n(3,8),n(5,4),r(2)],
  [n(0,8),n(3,8),n(5,4),r(2)],
 ]},
 {lesson:17,index:1,title:"Four mutations",brief:"Displaced, re-ended, sequenced, then answered an octave up. The motif survives all four.",pass:"The motif is recognisable in every mutation.",root:A1,rootName:"A Dorian",tempo:80,bars:[
  [r(8),n(0,8),n(3,8),n(5,4),r(8),r(4)],
  [n(0,8),n(3,8),n(9,4),r(2)],
  [n(3,8),n(5,8),n(7,4),r(2)],
  [n(12,8),n(15,8),n(17,4),r(2)],
 ]},
 {lesson:17,index:2,title:"Modal preservation",brief:"Transform the motif but keep F♯ alive, or bring it back in the answer.",pass:"Dorian survives every transformation.",root:A1,rootName:"A Dorian",tempo:80,bars:[
  [n(0,8),n(3,8),n(9,4),r(2)],
  [n(3,8),n(5,8),n(9,4),r(2)],
  [n(5,8),n(7,8),n(9,4),r(2)],
  [n(9,4),n(7,4),n(0,2)],
 ]},

 {lesson:18,index:0,title:"Fill ladder",brief:"Every fourth bar takes a fill: one beat, then two, then the whole bar. All of them target G→A.",pass:"Every fill lands exactly on the downbeat.",root:A1,rootName:"A Mixolydian",tempo:90,bars:[
  [n(0,4),n(7,4),n(0,4),n(10,4)],
  [n(0,4),n(7,4),n(0,4),n(10,8),n(0,8)],
  [n(0,4),n(7,4),n(9,8),n(10,8),n(9,8),n(10,8)],
  [n(0,8),n(4,8),n(5,8),n(7,8),n(9,8),n(10,8),n(10,8),n(0,8)],
 ]},
 {lesson:18,index:1,title:"Three targets",brief:"D on beat 1, F on beat 3, B on &4 — one fill each, landing exactly.",pass:"Each target lands where it was aimed.",root:D2,rootName:"D Dorian",tempo:86,bars:[
  [n(10,8),n(0,4),r(8),r(2)],
  [n(0,4),n(2,8),n(3,8),n(3,4),r(4)],
  [n(0,4),n(7,4),n(10,8),n(9,8),n(9,4)],
 ]},
 {lesson:18,index:2,title:"Rhythm first",brief:"One pitch. Play the fill's rhythm before choosing any note for it.",pass:"The rhythm is decided before the pitches are.",root:A1,rootName:"A · one pitch",tempo:90,bars:[
  [n(0,4),n(0,4),n(0,8),n(0,8),n(0,4)],
  [n(0,8),n(0,8),n(0,4),n(0,16),n(0,16),n(0,8),n(0,4)],
  [n(0,4),r(4),n(0,8),n(0,8),n(0,4)],
  [n(0,2),r(2)],
 ]},

 {lesson:19,index:0,title:"Sing first",brief:"Sing ♭3, 6 and ♭7 against the drone. Play each only once the sung pitch holds still.",pass:"The sung pitch is stable before the bass confirms it.",root:A1,rootName:"A drone",tempo:56,bars:[
  nameIt(3),nameIt(9),nameIt(10),
  [n(15,4),n(21,4),n(22,2)],
 ]},
 {lesson:19,index:1,title:"Function response",brief:"Hear a note, name its interval, then play its strongest resolution.",pass:"The resolution is chosen, not stumbled onto.",root:A1,rootName:"A drone",tempo:60,bars:[
  [n(1,4),n(0,2),r(4)],
  [n(10,4),n(0,2),r(4)],
  [n(6,4),n(7,2),r(4)],
  [n(9,4),n(7,2),r(4)],
 ]},
 {lesson:19,index:2,title:"Dark screen",brief:"Reproduce this four-note phrase by ear alone. Label the functions afterwards, not during.",pass:"Reproduced without looking, then labelled correctly.",root:A1,rootName:"A · no fretboard",tempo:64,bars:[
  [n(0,4),n(9,4),n(10,4),n(3,4)],
  [n(0,2),r(2)],
 ]},

 /* ---------------- Unit 5 · Harmony in Motion ---------------- */
 {lesson:20,index:0,title:"Layered 16 bars",brief:"Chord tones, extensions, characteristic colour, melodic variation — four bars each.",pass:"The four sections are audibly different jobs.",root:D2,rootName:"Dm7 vamp",tempo:84,bars:[
  [n(0,4),n(3,4),n(7,4),n(10,4)],
  [n(10,4),n(7,4),n(3,2)],
  [n(0,4),n(2,4),n(5,4),n(7,4)],
  [n(5,4),n(2,4),n(0,2)],
  [n(0,4),n(3,8),n(5,8),n(9,4),n(7,4)],
  [n(9,4),n(7,4),n(3,2)],
  [n(0,8),n(3,8),n(7,8),n(9,8),n(10,4),n(7,4)],
  [n(0,2),r(2)],
 ]},
 {lesson:20,index:1,title:"Register arc",brief:"Start below fret 5, be above fret 12 by bar 12, and be low again by bar 16.",pass:"The arc is heard as one shape, not three sections.",root:D2,rootName:"Dm7",tempo:84,bars:[
  [n(0,4),n(3,4),n(7,4),n(10,4)],
  [n(7,4),n(10,4),n(12,4),n(15,4)],
  [n(15,4),n(19,4),n(21,4),n(22,4)],
  [n(22,4),n(15,4),n(7,4),n(0,4)],
 ]},
 {lesson:20,index:2,title:"Density arc",brief:"Two notes a bar, then four, then eight, then back to two. The tempo never moves.",pass:"Density changes while the pulse stays put.",root:D2,rootName:"Dm7 vamp",tempo:84,bars:[
  [n(0,2),n(7,2)],
  [n(0,4),n(3,4),n(7,4),n(10,4)],
  run([0,3,5,7,9,7,5,3],8),
  [n(0,2),n(7,2)],
 ]},

 {lesson:21,index:0,title:"Triad weave",brief:"D minor, C major and G major, joined by whichever note is nearest.",pass:"No leap larger than needed between triads.",root:D2,rootName:"Dm7 drone",tempo:80,bars:[
  run([0,3,7],4).concat([n(10,4)]),
  run([10,14,17],4).concat([n(14,4)]),
  run([5,9,12],4).concat([n(9,4)]),
  [n(7,4),n(3,4),n(0,2)],
 ]},
 {lesson:21,index:1,title:"Seventh map",brief:"Each diatonic seventh gets a bar, and every bar resolves to D or F.",pass:"Every arpeggio finds D or F by its last note.",root:D2,rootName:"D Dorian",tempo:80,bars:[
  run([0,3,7,10],4),
  run([2,5,9,12],4),
  run([3,7,10,14],4),
  [n(5,4),n(9,4),n(3,2)],
 ]},
 {lesson:21,index:2,title:"Pentatonic overlay",brief:"D minor pentatonic, then E minor pentatonic, then both — targeting F and C.",pass:"The overlay lands on F or C, not just anywhere.",root:D2,rootName:"Dm7",tempo:84,bars:[
  run([0,3,5,7,10,7,5,3],8),
  run([2,5,7,9,12,9,7,5],8),
  [n(0,8),n(3,8),n(7,8),n(9,8),n(10,4),n(3,4)],
  [n(0,2),r(2)],
 ]},

 {lesson:22,index:0,title:"Diagnose first",brief:"A static centre, a dominant pull, then a hybrid. Label each from what the bass is doing.",pass:"You name the gravitational evidence, not the chord symbol.",root:D2,rootName:"Three contexts",tempo:78,bars:[
  [n(0,4),n(3,4),n(7,4),n(10,4)],
  [n(0,2),n(9,2)],
  [n(5,4),n(9,4),n(0,4),n(4,4)],
  [n(-2,2),r(2)],
 ]},
 {lesson:22,index:1,title:"Same material, two contexts",brief:"F held as a stable modal ♭7, then the same F as a guide tone resolving to E.",pass:"You can hear which F wants to move.",root:G1,rootName:"G7 vamp, then G7→C",tempo:78,bars:[
  [n(0,4),n(4,4),n(10,2)],
  [n(10,2),n(10,2)],
  [n(0,4),n(4,4),n(10,4),n(11,4)],
  [n(5,2),n(9,2)],
 ]},
 {lesson:22,index:2,title:"No scale chasing",brief:"ii–V–I with 3rds and 7ths only. Then one approach note before each destination.",pass:"The changes are readable from guide tones alone.",root:D2,rootName:"ii–V–I in C",tempo:80,bars:[
  [n(3,2),n(10,2)],
  [n(9,2),n(3,2)],
  [n(2,2),n(9,2)],
  [n(1,8),n(2,8),n(8,8),n(9,8),n(2,2)],
 ]},

 {lesson:23,index:0,title:"Guide-tone skeleton",brief:"F–C, then B–F, then E–B. Half notes, and sing every movement.",pass:"You sing each movement before you play it.",root:D2,rootName:"Dm7 → G7 → Cmaj7",tempo:66,bars:[
  [n(3,2),n(10,2)],
  [n(9,2),n(3,2)],
  [n(2,2),n(9,2)],
  [n(2,1)],
 ]},
 {lesson:23,index:1,title:"Nearest destination",brief:"Same progression, with fills — and no leap larger than a major 3rd anywhere.",pass:"No interval in the line exceeds a major 3rd.",root:D2,rootName:"Dm7 → G7 → Cmaj7",tempo:72,bars:[
  [n(0,4),n(2,4),n(3,4),n(5,4)],
  [n(5,4),n(7,4),n(9,4),n(10,4)],
  [n(10,4),n(9,4),n(7,4),n(5,4)],
  [n(4,4),n(2,4),n(0,2)],
 ]},
 {lesson:23,index:2,title:"Chromatic decoration",brief:"The same skeleton, with one neighbour note before each destination.",pass:"Each decoration resolves to the tone it decorated.",root:D2,rootName:"Dm7 → G7 → Cmaj7",tempo:72,bars:[
  [n(4,8),n(3,8),n(3,2),r(4)],
  [n(8,8),n(9,8),n(9,2),r(4)],
  [n(1,8),n(2,8),n(2,2),r(4)],
  [n(2,1)],
 ]},

 /* ---------------- Unit 6 · Controlled Outside Playing ---------------- */
 {lesson:24,index:0,title:"Four targets",brief:"D, F, A and C, each approached from a semitone below on &4 into 1.",pass:"Every approach lands exactly on the downbeat.",root:D2,rootName:"Dm7",tempo:70,bars:[
  [n(-1,8),n(0,4),r(8),r(2)],
  [n(2,8),n(3,4),r(8),r(2)],
  [n(6,8),n(7,4),r(8),r(2)],
  [n(9,8),n(10,4),r(8),r(2)],
 ]},
 {lesson:24,index:1,title:"Upper approaches",brief:"The same four targets from above, on &2 into 3. Compare the pull.",pass:"You can describe how upper gravity differs from lower.",root:D2,rootName:"Dm7",tempo:70,bars:[
  [r(4),n(1,8),n(0,4),r(8),r(4)],
  [r(4),n(4,8),n(3,4),r(8),r(4)],
  [r(4),n(8,8),n(7,4),r(8),r(4)],
  [r(4),n(11,8),n(10,4),r(8),r(4)],
 ]},
 {lesson:24,index:2,title:"Metric displacement",brief:"One approach path, moved to &4, beat 1, &1 and beat 2 in turn.",pass:"You hear the same notes change weight four times.",root:D2,rootName:"Dm7",tempo:70,bars:[
  [r(2),r(4),n(2,8),n(3,8)],
  [n(2,8),n(3,8),r(4),r(2)],
  [r(8),n(2,8),n(3,8),r(8),r(2)],
  [r(4),n(2,8),n(3,8),r(2)],
 ]},

 {lesson:25,index:0,title:"Enclose the shell",brief:"Upper–lower–target, then lower–upper–target, onto A, C, E and G.",pass:"Both orders are available on every chord tone.",root:A1,rootName:"Am7",tempo:72,bars:[
  [n(1,8),n(-1,8),n(0,4),n(4,8),n(2,8),n(3,4)],
  [n(-1,8),n(1,8),n(0,4),n(2,8),n(4,8),n(3,4)],
  [n(8,8),n(6,8),n(7,4),n(11,8),n(9,8),n(10,4)],
  [n(0,2),r(2)],
 ]},
 {lesson:25,index:1,title:"Every third target",brief:"Enclose every third chord tone while the groove rhythm stays exactly where it was.",pass:"The groove never flinches for the decoration.",root:A1,rootName:"Am7 vamp",tempo:78,bars:[
  [n(0,4),n(3,4),n(7,4),n(10,4)],
  [n(0,4),n(3,4),n(8,8),n(6,8),n(7,4)],
  [n(0,4),n(3,4),n(7,4),n(10,4)],
  [n(11,8),n(9,8),n(10,4),n(3,4),n(0,4)],
 ]},
 {lesson:25,index:2,title:"Strip the decoration",brief:"The decorated line, then only its destinations. The second version must still be the same line.",pass:"The stripped version is recognisably the same line.",root:A1,rootName:"Am7",tempo:78,bars:[
  [n(1,8),n(-1,8),n(0,4),n(4,8),n(2,8),n(3,4)],
  [n(8,8),n(6,8),n(7,4),n(11,8),n(9,8),n(10,4)],
  [n(0,2),n(3,2)],
  [n(7,2),n(10,2)],
 ]},

 {lesson:26,index:0,title:"One-beat slip",brief:"A–C–D twice, then B♭–D♭–E♭ for one beat, then home to A/C/E/G.",pass:"The return is deliberate, not a scramble.",root:A1,rootName:"A Dorian",tempo:84,bars:[
  [n(0,8),n(3,8),n(5,8),n(3,8),n(0,8),n(3,8),n(5,8),n(3,8)],
  [n(1,8),n(4,8),n(6,8),n(4,8),n(0,4),n(3,4)],
  [n(7,4),n(10,4),n(0,2)],
 ]},
 {lesson:26,index:1,title:"Length ladder",brief:"Slip for half a beat, one beat, two beats, then a whole bar. The return never changes.",pass:"Every length still returns cleanly.",root:A1,rootName:"A Dorian",tempo:84,bars:[
  [n(0,4),n(3,4),n(4,8),n(3,8),n(0,4)],
  [n(0,4),n(3,4),n(1,8),n(4,8),n(0,4)],
  [n(0,4),n(1,8),n(4,8),n(6,8),n(4,8),n(0,4)],
  [n(1,8),n(4,8),n(6,8),n(8,8),n(6,8),n(4,8),n(1,8),n(0,8)],
 ]},
 {lesson:26,index:2,title:"Motif continuity",brief:"Shift the motif up a semitone with its rhythm intact. Only the final note changes on the way home.",pass:"The rhythm is identical in both positions.",root:A1,rootName:"A Dorian",tempo:84,bars:[
  [n(0,8),n(3,8),n(5,4),n(3,8),n(0,8),n(3,4)],
  [n(1,8),n(4,8),n(6,4),n(4,8),n(1,8),n(4,4)],
  [n(0,8),n(3,8),n(5,4),n(3,8),n(0,8),n(0,4)],
 ]},

 {lesson:27,index:0,title:"Draw the curve",brief:"Eight stages from home to climax and back, one device each. This is the shape, not the solo.",pass:"The curve is audible as a single arc.",root:A1,rootName:"32-bar form",tempo:80,bars:[
  [n(0,2),n(7,2)],
  [n(0,4),n(3,4),n(7,4),n(10,4)],
  [n(0,4),n(9,4),n(7,4),n(3,4)],
  [n(0,4),n(1,8),n(3,8),n(7,4),n(6,4)],
  [n(1,8),n(4,8),n(6,8),n(8,8),n(6,4),n(4,4)],
  [n(13,4),n(16,4),n(18,4),n(21,4)],
  [n(10,4),n(7,4),n(3,4),n(0,4)],
  [n(0,1)],
 ]},
 {lesson:27,index:1,title:"Budget take",brief:"Ten tension points: colour costs 1, an approach 2, a strong outside note 4. Spend them all, and no more.",pass:"You can account for every point you spent.",root:A1,rootName:"Am7 vamp",tempo:80,bars:[
  [n(0,4),n(3,4),n(9,4),n(7,4)],
  [n(0,4),n(2,8),n(3,8),n(10,4),n(7,4)],
  [n(0,4),n(6,8),n(7,8),n(3,4),n(0,4)],
  [n(1,8),n(4,8),n(6,4),n(3,4),n(0,4)],
 ]},
 {lesson:27,index:2,title:"Full rehearsal",brief:"Groove, identity, motif, space, approach, enclosure, side-slip, return — in one pass.",pass:"Every device appears once and the return is convincing.",root:A1,rootName:"Evolving form",tempo:80,bars:[
  [n(0,4),n(7,4),n(0,8),n(3,8),n(7,4)],
  [n(0,4),n(9,4),n(7,2)],
  [n(0,8),n(3,8),n(5,4),r(2)],
  [r(2),n(0,4),n(3,4)],
  [n(2,8),n(3,8),n(7,4),n(6,8),n(7,8),n(10,4)],
  [n(11,8),n(9,8),n(10,4),n(4,8),n(2,8),n(3,4)],
  [n(1,8),n(4,8),n(6,8),n(4,8),n(0,4),n(3,4)],
  [n(0,1)],
 ]},
];

const key=(lesson:number,index:number)=>`l${lesson}-${index}`;

export const COURSE_TABS:Record<string,TabExercise>=Object.fromEntries(
 SPECS.map(spec=>[key(spec.lesson,spec.index),{
  id:key(spec.lesson,spec.index),
  title:spec.title,
  brief:spec.brief,
  pass:spec.pass,
  root:spec.root,
  rootName:spec.rootName,
  tempo:spec.tempo,
  ts:spec.ts,
  bars:spec.bars,
  loop:true,
 } satisfies TabExercise]),
);

/** The tab for one of a lesson's exercises, if it has been written yet. */
export const courseTab=(lesson:number,index:number):TabExercise|undefined=>COURSE_TABS[key(lesson,index)];

/** Every tab belonging to a lesson, in the order the lesson lists them. */
export const courseTabsFor=(lesson:number):TabExercise[]=>
 SPECS.filter(spec=>spec.lesson===lesson).sort((a,b)=>a.index-b.index).map(spec=>COURSE_TABS[key(spec.lesson,spec.index)]);

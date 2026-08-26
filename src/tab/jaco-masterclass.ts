import {type Bar,type Duration,type Event,type TabExercise,beatsOf,f,n,r} from "./notation.ts";

/**
 * A masterclass that follows the syllabus of Ray Peterson's *Jaco Pastorius
 * Bass Method* (Hal Leonard, 2010).
 *
 * The chapters, their subsections and their order are the book's, so a reader
 * working through this covers the same ground in the same sequence. The
 * exercises are not: that book's studies and its transcriptions of Jaco's
 * compositions are copyrighted, and its own notice names internet posting
 * specifically. What is reproduced here is the teaching — which technique comes
 * when, and what each one is for — with original material written to drill it,
 * and the recordings named so a reader can hear the real thing.
 */

// Roots in the register the material sits in. The book works in C for the
// harmonic chapters, which is kept.
const E1=28,F1=29,G1=31,A1=33,C2=36,D2=38;

export type Section={
 id:string;
 title:string;
 /** What this subsection teaches. */
 note:string;
 /** Where to go and hear it, when the book points at a recording. */
 listen?:string;
 exercises:TabExercise[];
};

export type Chapter={
 n:number;
 id:string;
 title:string;
 /** The chapter's opening line in the book, where it has one. */
 epigraph?:string;
 note:string;
 sections:Section[];
};

type Spec=Omit<TabExercise,"loop">&{loop?:boolean};
const ex=(spec:Spec):TabExercise=>({loop:true,...spec});

/* ---------------- writing helpers ---------------- */

/** Fill a bar out to its full length with rests. */
function close(bar:Bar,filled:number,beatsPerBar:number):Bar{
 let left=beatsPerBar-filled;
 for(const value of [1,2,4,8,16] as Duration[]){
  const width=4/value;
  while(left>=width-1e-9){bar.push(r(value));left-=width}
 }
 return bar;
}

/**
 * Chunk a stream of notes into bars, filling every short bar out with rests.
 *
 * Almost everything here is a scale or an arpeggio run through a shape, which
 * is far easier to write as one list than as hand-counted bars — and the bar
 * arithmetic then cannot be got wrong.
 */
function intoBars(events:Event[],beatsPerBar=4):Bar[]{
 const bars:Bar[]=[];
 let bar:Bar=[],filled=0;
 for(const event of events){
  const width=beatsOf(event);
  if(filled+width>beatsPerBar+1e-9){bars.push(close(bar,filled,beatsPerBar));bar=[];filled=0}
  bar.push(event);filled+=width;
 }
 if(bar.length)bars.push(close(bar,filled,beatsPerBar));
 return bars;
}

const runOf=(degs:number[],d:Duration,extra:Partial<Extract<Event,{t:"n"}>>={}):Event[]=>
 degs.map(deg=>n(deg,d,extra));
/** Triplet eighths — the note value most of the book's arpeggio drills use. */
const trip=(degs:number[]):Event[]=>runOf(degs,8,{tuplet:3});
const eighths=(degs:number[]):Event[]=>runOf(degs,8);

/** A shape ascending then descending, without repeating the top note. */
const upDown=(degs:number[]):number[]=>[...degs,...[...degs].reverse().slice(1)];

/** Root, 3rd, 5th, octave and back — the book's triad drill, in triplets. */
const arpeggio=(shape:number[],from=0):number[]=>{
 const up=[...shape.map(step=>step+from),from+12];
 // Six notes, so they fill two beats as triplets — the root that closes the
 // figure is written separately as a held note.
 return [...up,...[...up].reverse().slice(1,-1)];
};

/* ---------------- the chapters ---------------- */

export const JACO_CHAPTERS:Chapter[]=[
 /* ============================================================= */
 {
  n:1,id:"technique",title:"Basic Technique",
  epigraph:"“Make every note count.”",
  note:"The method starts with the hands, because everything after it depends on them. Curved fingers, knuckles that do not collapse, and a thumb that stays behind the neck.",
  sections:[
   {
    id:"left-hand",title:"Left Hand",
    note:"Three frets are played one-to-four with the middle fingers resting on the string behind — the hand makes a claw. Five frets are the same shape with the fourth finger stretching and the second taking the note halfway. The whole-tone scale builds that stretch; the diminished scale adds a first-finger slide of a half step to extend the reach without breaking the shape.",
    exercises:[
     ex({
      id:"jaco-lh-1",title:"The claw",
      brief:"A three-fret span, first finger to fourth. The second and third fingers stay down on the string behind the fourth.",
      pass:"Every note speaks without the knuckles caving in.",
      root:F1,rootName:"F · three-fret span",tempo:60,
      bars:intoBars(eighths(upDown([0,2,3]).concat(upDown([2,4,5])))),
     }),
     ex({
      id:"jaco-lh-2",title:"Whole-tone stretch",
      brief:"Nothing but whole steps, so the hand is always spanning five frets. The fourth finger takes the top, the second takes the middle.",
      pass:"The stretch holds all the way up without the thumb coming over the neck.",
      root:G1,rootName:"G whole-tone",tempo:56,
      bars:intoBars(trip([0,2,4,6,8,10,12,10,8,6,4,2]).concat([n(0,2)])),
     }),
     ex({
      id:"jaco-lh-3",title:"Diminished, sliding the first finger",
      brief:"Whole step, half step, all the way up. Where the shape runs out, slide the first finger a half step rather than reaching.",
      pass:"The slide is deliberate and in time, not a scramble.",
      root:E1,rootName:"E diminished",tempo:56,
      bars:intoBars(eighths([0,2,3,5,6,8,9,11,12,11,9,8,6,5,3,2]).concat([n(0,1)])),
     }),
    ],
   },
   {
    id:"right-hand",title:"Right Hand",
    note:"Fingerstyle, first two fingers, slightly curved, pulling back over the string rather than slapping down at it. The thumb hangs around the E string instead of anchoring, which keeps the hand mobile. Over the bridge pickup the string is tighter and the attack sharper; nearer the neck it is looser and sings, which is where walking lines live.",
    exercises:[
     ex({
      id:"jaco-rh-1",title:"Alternation across the strings",
      brief:"Strict first-second-first-second, straight through the string crossings. Do not let the same finger take two in a row.",
      pass:"You cannot hear where the crossings are.",
      root:A1,rootName:"A · alternation",tempo:72,
      bars:intoBars(eighths([0,7,12,19,12,7,0,7,12,19,12,7,0,7,12,7]).concat([n(0,2)])),
     }),
     ex({
      id:"jaco-rh-2",title:"Bridge, then neck",
      brief:"The same two bars twice: first over the bridge pickup short and hard, then up near the neck long and singing.",
      pass:"Two obviously different sounds from identical notes.",
      root:A1,rootName:"A minor",tempo:76,
      bars:[
       [n(0,8,{staccato:true}),n(3,8,{staccato:true}),n(7,8,{staccato:true}),n(10,8,{staccato:true}),n(7,4,{staccato:true}),n(3,4,{staccato:true})],
       [n(0,2,{staccato:true}),r(2)],
       [n(0,8,{letRing:true}),n(3,8),n(7,8),n(10,8),n(7,4),n(3,4)],
       [n(0,2,{letRing:true}),r(2)],
      ],
     }),
    ],
   },
   {
    id:"the-sound",title:"The Sound",
    note:"A pre-CBS Fender Jazz or a faithful replica, Rotosound Swing Bass strings, the neck pickup off, the bridge pickup wide open, and the volume set at the amp. The hands are most of it, but this is the signal chain underneath them.",
    exercises:[],
   },
   {
    id:"fretless",title:"The Fretless Bass",
    note:"Two things carry across: play exactly where the fret would be, and hit the note first and put the vibrato on afterwards — not at the same time as the attack.",
    exercises:[
     ex({
      id:"jaco-fretless-1",title:"Note first, then vibrato",
      brief:"Land the pitch clean, hold it a moment, and only then start the vibrato.",
      pass:"The attack is in tune before any movement begins.",
      root:G1,rootName:"G minor",tempo:56,
      bars:[
       [n(0,1,{vibrato:true})],
       [n(10,2,{vibrato:true}),n(7,2,{vibrato:true})],
       [n(3,4,{slide:"inFromBelow"}),n(5,4),n(7,2,{vibrato:true})],
       [n(0,2,{vibrato:true}),n(0,2,{slide:"outDown"})],
      ],
     }),
    ],
   },
  ],
 },

 /* ============================================================= */
 {
  n:2,id:"theory",title:"Basic Theory",
  note:"The octave splits into twelve half steps. Scales and chords are particular selections from those twelve, and the distance between any two notes is an interval. Learn the sound of each interval as well as its shape, and take everything you learn around the cycle of fifths in all twelve keys.",
  sections:[
   {
    id:"theory-basics",title:"Half steps, tetrachords, intervals and the cycle",
    note:"A major scale is two identical four-note units — whole, whole, half — a whole step apart. Each unit is a tetrachord. The cycle of fifths orders the keys, and most jazz harmony moves along it.",
    exercises:[
     ex({
      id:"jaco-th-1",title:"The chromatic scale",
      brief:"Twelve half steps up and back. One fret at a time, evenly.",
      pass:"No note is louder or longer than its neighbours.",
      root:E1,rootName:"E chromatic",tempo:60,
      bars:intoBars(eighths(upDown([0,1,2,3,4,5,6,7,8,9,10,11,12])).concat([n(0,2)])),
     }),
     ex({
      id:"jaco-th-2",title:"Two tetrachords",
      brief:"Whole–whole–half, a whole step, then whole–whole–half again. Play the two halves as two separate ideas before joining them.",
      pass:"You can hear the scale as two units rather than eight notes.",
      root:C2,rootName:"C major",tempo:64,
      bars:[
       [n(0,4),n(2,4),n(4,4),n(5,4)],
       [n(7,4),n(9,4),n(11,4),n(12,4)],
       [n(12,4),n(11,4),n(9,4),n(7,4)],
       [n(5,4),n(4,4),n(2,4),n(0,4)],
      ],
     }),
     ex({
      id:"jaco-th-3",title:"Every interval from one root",
      brief:"Root then interval, all the way out to the octave. Name each one aloud as you play it.",
      pass:"You can name the interval before you hear it.",
      root:C2,rootName:"C · intervals",tempo:56,
      bars:intoBars([1,2,3,4,5,6,7,8,9,10,11,12].flatMap(step=>[n(0,8),n(step,4),r(8)])),
     }),
     ex({
      id:"jaco-th-4",title:"Around the cycle of fifths",
      brief:"Root and 3rd of each key, moving down a fifth every bar. This is the order to take everything else in.",
      pass:"You get all the way round without stopping to work out the next key.",
      root:C2,rootName:"C · down in fifths",tempo:60,
      bars:intoBars([0,5,10,3,8,1,6,11,4,9,2,7].flatMap(step=>[n(step,4),n(step+4,4)])),
     }),
    ],
   },
  ],
 },

 /* ============================================================= */
 {
  n:3,id:"harmony",title:"Harmonic Elements",
  epigraph:"“Human beings have nothing to do with music. Music is in the air; you just have to pull it out.”",
  note:"The part of the playing that set him apart. The approach is always the same: state the harmony from the inside, expand out into chromatic territory, then come back — which only works if the harmonic material is completely under the hand. Spell every chord in your head as you play it rather than running the notes.",
  sections:[
   {
    id:"triads",title:"Triads",
    note:"Four kinds, each a pair of stacked thirds: major is a major then a minor 3rd, minor is minor then major, augmented is two majors, diminished is two minors. Bottom note is the root, middle the 3rd, top the 5th. Play each one in root position, then find the same notes somewhere else on the neck, then an octave up, then across two octaves.",
    exercises:[
     ex({
      id:"jaco-tri-1",title:"Major triad",
      brief:"Root, 3rd, 5th, octave and back in triplets — then the same shape an octave up, then across two octaves.",
      pass:"Spelled in your head, not found by feel.",
      root:C2,rootName:"C major",tempo:66,
      bars:intoBars([
       ...trip(arpeggio([0,4,7])),n(0,2),
       ...trip(arpeggio([0,4,7],12)),n(12,2),
       ...trip([0,4,7,12,16,19,24,19,16,12,7,4]),n(0,1),
      ]),
     }),
     ex({
      id:"jaco-tri-2",title:"Minor triad",
      brief:"A minor 3rd on the bottom, a major on top. The relative minor of C major, so the notes are the same and the centre is not.",
      pass:"It sounds minor from the first two notes.",
      root:A1,rootName:"A minor",tempo:66,
      bars:intoBars([
       ...trip(arpeggio([0,3,7])),n(0,2),
       ...trip(arpeggio([0,3,7],12)),n(12,2),
       ...trip([0,3,7,12,15,19,24,19,15,12,7,3]),n(0,1),
      ]),
     }),
     ex({
      id:"jaco-tri-3",title:"Augmented triad",
      brief:"Two major 3rds — a major triad with a ♯5. It divides the octave in three, so it repeats every four frets.",
      pass:"You can start it from any of its three notes and it sounds the same.",
      root:C2,rootName:"C augmented",tempo:66,
      bars:intoBars([
       ...trip(arpeggio([0,4,8])),n(0,2),
       ...trip(arpeggio([0,4,8],12)),n(12,2),
       ...trip([0,4,8,12,16,20,24,20,16,12,8,4]),n(0,1),
      ]),
     }),
     ex({
      id:"jaco-tri-4",title:"Diminished triad",
      brief:"Two minor 3rds — a minor triad with a ♭5. It divides the octave in four.",
      pass:"The ♭5 is in tune and does not drift toward the natural 5th.",
      root:A1,rootName:"A diminished",tempo:66,
      bars:intoBars([
       ...trip(arpeggio([0,3,6])),n(0,2),
       ...trip(arpeggio([0,3,6],12)),n(12,2),
       ...trip([0,3,6,12,15,18,24,18,15,12,6,3]),n(0,1),
      ]),
     }),
    ],
   },
   {
    id:"diatonic-triads",title:"Diatonic Triads",
    note:"The seven triads that live inside the major scale: major on I, IV and V, minor on ii, iii and vi, diminished on vii. Knowing which quality sits on which degree is what lets you read a key rather than a list of chords.",
    exercises:[
     ex({
      id:"jaco-dia-1",title:"The seven triads of the major scale",
      brief:"Up each triad from every degree of C major in turn. Say the chord name as you start it.",
      pass:"Major, minor and diminished are audible without checking.",
      root:C2,rootName:"C major",tempo:70,
      bars:intoBars([[0,4,7],[2,5,9],[4,7,11],[5,9,12],[7,11,14],[9,12,16],[11,14,17]]
       .flatMap(triad=>trip([...triad,triad[0]+12,triad[2],triad[1]]))),
     }),
     ex({
      id:"jaco-dia-2",title:"Inversions",
      brief:"The same seven triads with the 3rd on the bottom, then with the 5th on the bottom. Same chords, different lowest note.",
      pass:"You can name the inversion from its bass note alone.",
      root:C2,rootName:"C major",tempo:66,
      bars:intoBars([
       ...trip([4,7,12,7,4,0]),
       ...trip([7,12,16,12,7,4]),
       ...trip([5,9,14,9,5,2]),
       ...trip([9,14,17,14,9,5]),
       ...trip([7,11,16,11,7,4]),
       ...trip([11,16,19,16,11,7]),
      ]),
     }),
    ],
   },
   {
    id:"tritone-triads",title:"Alternating Diatonic Triads with Tritone Relationships",
    note:"Take a second-inversion diatonic triad going up, then answer it with the root-position triad a tritone away coming down. The tritone halves the octave, and superimposing that far triad over the original root supplies the ♭5, ♭7 and ♭9 — which is the sound of an altered dominant, and the thinking behind flat-five substitution. Exercise II is the same idea reversed.",
    exercises:[
     ex({
      id:"jaco-tt-1",title:"Exercise I — second inversion up, tritone down",
      brief:"Second inversion ascending, then the root-position triad a tritone away descending. Straight through the key.",
      pass:"The far triad sounds like colour over the key, not like a mistake.",
      root:C2,rootName:"C major · flat-five substitution",tempo:60,ts:[2,4],
      bars:intoBars([
       [[7,12,16],[6,10,13]],[[9,14,17],[8,11,15]],[[11,16,19],[10,13,17]],
       [[12,17,21],[11,15,18]],[[14,19,23],[13,17,20]],[[16,21,24],[15,18,22]],[[17,23,26],[23,20,17]],
      ].flatMap(([up,down])=>trip([...up,...[...down].reverse()])),2),
     }),
     ex({
      id:"jaco-tt-2",title:"Exercise II — root position up, second inversion down",
      brief:"The reverse: root position ascending, then the tritone-away triad in second inversion coming down.",
      pass:"Both directions are as fluent as each other.",
      root:C2,rootName:"C major · flat-five substitution",tempo:60,ts:[2,4],
      // Root position of the diatonic triad ascending, then the tritone-away
      // triad in second inversion — fifth lowest — coming back down.
      bars:intoBars([
       [[0,4,7],[10,6,1]],[[2,5,9],[11,8,3]],[[4,7,11],[13,10,5]],
       [[5,9,12],[15,11,6]],[[7,11,14],[17,13,8]],[[9,12,16],[18,15,10]],[[11,14,17],[20,17,11]],
      ].flatMap(([up,down])=>trip([...up,...down])),2),
     }),
    ],
   },
   {
    id:"sevenths",title:"Seventh Chords",
    note:"Stack one more third on a triad and you have a seventh chord. In a major key: major sevenths on I and IV, minor sevenths on ii, iii and vi, a dominant seventh on V, and a minor seventh flat five on vii. The ii–V–I is the progression most standards are built from — learn it in all twelve keys and you can learn tunes in blocks rather than chord by chord.",
    exercises:[
     ex({
      id:"jaco-7-1",title:"The seven diatonic sevenths",
      brief:"Root, 3rd, 5th, 7th up and back from every degree of C major.",
      pass:"You can name the chord quality of each degree without counting.",
      root:C2,rootName:"C major",tempo:72,
      bars:intoBars([[0,4,7,11],[2,5,9,12],[4,7,11,14],[5,9,12,16],[7,11,14,17],[9,12,16,19],[11,14,17,21]]
       .flatMap(chord=>eighths([...chord,chord[3],chord[2],chord[1],chord[0]]))),
     }),
     ex({
      id:"jaco-7-2",title:"ii–V–I",
      brief:"Dm7, G7, Cmaj7 as arpeggios, then again using only the 3rds and 7ths.",
      pass:"The guide-tone version still spells the progression on its own.",
      root:D2,rootName:"Dm7 → G7 → Cmaj7",tempo:72,
      bars:intoBars([
       ...eighths([0,3,7,10,7,3,0,3]),
       ...eighths([5,9,12,15,12,9,5,9]),
       ...eighths([10,14,17,21,17,14,10,14]),
       n(3,2),n(10,2),
       n(9,2),n(15,2),
       n(14,2),n(21,2),
      ]),
     }),
     ex({
      id:"jaco-7-3",title:"Sevenths around the cycle",
      brief:"One seventh arpeggio a bar, moving down a fifth each time. This is how a standard's changes actually move.",
      pass:"No hesitation at the key changes.",
      root:C2,rootName:"Cycle of fifths",tempo:70,
      bars:intoBars([0,5,10,3,8,1,6,11].flatMap(step=>eighths([step,step+4,step+7,step+10]))),
     }),
    ],
   },
   {
    id:"dominants",title:"Dominant Seventh Chords",
    note:"The V chord takes more alteration than any other, which is why it gets its own section. Keep stacking thirds and you reach the 9th, 11th and 13th — the 2nd, 4th and 6th degrees an octave up. Sharpen or flatten those and you have the altered dominant vocabulary the tritone exercise was preparing.",
    exercises:[
     ex({
      id:"jaco-dom-1",title:"Dominant seventh and its extensions",
      brief:"G7 out to the 9th, the 11th and the 13th. The extensions are the 2nd, 4th and 6th degrees, an octave up.",
      pass:"You can stop at any extension and still hear it as G7.",
      root:G1,rootName:"G7",tempo:70,
      bars:intoBars([
       ...eighths([0,4,7,10,14,10,7,4]),
       ...eighths([0,4,7,10,14,17,14,10]),
       ...eighths([0,4,7,10,14,17,21,17]),
       ...eighths([14,10,7,4]),n(0,2),
      ]),
     }),
     ex({
      id:"jaco-dom-2",title:"Altered extensions",
      brief:"The same chord with ♭9, ♯9, ♯11 and ♭13. Each one still resolves to C.",
      pass:"Every alteration resolves; none is left hanging.",
      root:G1,rootName:"G7 altered → C",tempo:66,
      bars:intoBars([
       ...eighths([0,4,10,13,10,4,0,13]),
       ...eighths([0,4,10,15,10,4,0,15]),
       ...eighths([0,4,10,18,10,4,0,18]),
       ...eighths([0,4,10,20,10,4,0,4]),
       n(5,2),n(9,2),
      ]),
     }),
     ex({
      id:"jaco-dom-3",title:"Flat-five substitution",
      brief:"G7 answered by D♭7 a tritone away. They share the same 3rd and 7th, swapped over, which is why one can stand for the other.",
      pass:"The substitution sounds like a stronger route home, not a wrong chord.",
      root:G1,rootName:"G7 / D♭7 → C",tempo:66,
      bars:intoBars([
       ...eighths([0,4,7,10,7,4,0,4]),
       ...eighths([6,10,13,16,13,10,6,10]),
       ...eighths([4,10,10,16,4,10,10,16]),
       n(5,2),n(9,2),
      ]),
     }),
    ],
   },
   {
    id:"harmonics",title:"Harmonics",
    note:"Touch the string lightly over a node instead of pressing it down and the string divides, sounding a bell tone far above the written position. Counting from the twelfth fret down, the nodes give the octave, the 5th above that, two octaves, the major 3rd above that, and the 5th again — so the ones that sit over a fret spell a major triad spread across three octaves. Two more complete the picture: the ♭7 (ten semitones above the root — B♭ in C) and the 9th. Those do not sit over a fret at all. They fall between the 2nd and 3rd, which is why a harmonics chart prints them as decimals and tells you the numbers are approximate; with those two added the string spells a dominant ninth on its own open note. They are real and worth hunting for, but they are found by ear, and no tab can write them down.",
    listen:"“Portrait of Tracy” — a whole piece built from these nodes.",
    exercises:[
     ex({
      id:"jaco-harm-1",title:"The nodes",
      brief:"Twelfth, seventh and fifth on each string. Touch directly over the fret and release as the note speaks.",
      pass:"Every one rings with no fretted pitch underneath it.",
      root:E1,rootName:"Open strings · natural harmonics",tempo:60,
      bars:[
       [f(4,12,4,{harmonic:"natural"}),f(4,7,4,{harmonic:"natural"}),f(4,5,2,{harmonic:"natural"})],
       [f(3,12,4,{harmonic:"natural"}),f(3,7,4,{harmonic:"natural"}),f(3,5,2,{harmonic:"natural"})],
       [f(2,12,4,{harmonic:"natural"}),f(2,7,4,{harmonic:"natural"}),f(2,5,2,{harmonic:"natural"})],
       [f(1,12,4,{harmonic:"natural"}),f(1,7,4,{harmonic:"natural"}),f(1,5,2,{harmonic:"natural"})],
      ],
     }),
     ex({
      id:"jaco-harm-2",title:"The chord inside one string",
      brief:"Every node over a fret on the E string, from the twelfth down: E, B, E, G♯, B — an E major triad across three octaves, from a string you never fret. Then hunt between the 2nd and 3rd frets for the two that finish it.",
      pass:"All five ring cleanly, and you can find at least one of the two unwritable ones by ear.",
      root:E1,rootName:"E9 from the E string",tempo:56,
      bars:[
       [f(4,12,4,{harmonic:"natural",letRing:true}),f(4,7,4,{harmonic:"natural",letRing:true}),f(4,5,2,{harmonic:"natural",letRing:true})],
       [f(4,4,4,{harmonic:"natural",letRing:true}),f(4,3,4,{harmonic:"natural",letRing:true}),r(2)],
       [f(3,12,4,{harmonic:"natural",letRing:true}),f(2,12,4,{harmonic:"natural",letRing:true}),f(1,12,2,{harmonic:"natural",letRing:true})],
       [f(4,0,1,{letRing:true})],
      ],
     }),
     ex({
      id:"jaco-harm-3",title:"A melody from bell tones",
      brief:"Harmonics across the strings, each ringing into the next, over a fretted root underneath.",
      pass:"It sounds like one instrument, and the low note is still sounding when the last harmonic lands.",
      root:E1,rootName:"E · harmonics over a root",tempo:56,
      bars:[
       [f(4,0,4,{letRing:true}),f(3,12,4,{harmonic:"natural",letRing:true}),f(2,12,4,{harmonic:"natural",letRing:true}),f(1,12,4,{harmonic:"natural",letRing:true})],
       [f(2,7,4,{harmonic:"natural",letRing:true}),f(1,7,4,{harmonic:"natural",letRing:true}),f(1,5,2,{harmonic:"natural",letRing:true})],
       [f(4,3,4,{letRing:true}),f(3,7,4,{harmonic:"natural",letRing:true}),f(2,5,4,{harmonic:"natural",letRing:true}),f(1,5,4,{harmonic:"natural",letRing:true})],
       [f(4,0,2,{letRing:true}),f(1,12,2,{harmonic:"natural",letRing:true})],
      ],
     }),
     ex({
      id:"jaco-harm-4",title:"Artificial harmonics",
      brief:"Hold the note with the index finger and reach up twelve frets with the fourth to touch the harmonic. The other method is to stop the string with the picking-hand thumb and pluck with the first finger.",
      pass:"The stopped harmonic is as clear as an open one.",
      root:E1,rootName:"E · artificial harmonics",tempo:56,
      bars:[
       [f(4,3,4,{letRing:true}),f(4,15,4,{harmonic:"artificial"}),f(4,5,4,{letRing:true}),f(4,17,4,{harmonic:"artificial"})],
       [f(3,3,4,{letRing:true}),f(3,15,4,{harmonic:"artificial"}),f(3,5,4,{letRing:true}),f(3,17,4,{harmonic:"artificial"})],
       [f(2,2,4,{letRing:true}),f(2,14,4,{harmonic:"artificial"}),f(1,0,4,{letRing:true}),f(1,12,4,{harmonic:"natural"})],
       [f(4,0,2,{letRing:true}),f(1,12,2,{harmonic:"natural"})],
      ],
     }),
    ],
   },
  ],
 },

 /* ============================================================= */
 {
  n:4,id:"melody",title:"Melodic Elements",
  epigraph:"“You can play practically any note; it’s just a matter of understanding how they work together.”",
  note:"For all the technique, he never lost the melody. Learn the tune to everything you play, not only the bass part. Scales build dexterity and show what fits over a chord, but the goal of practising them is to make statements, not to run them in a solo.",
  sections:[
   {
    id:"scales",title:"Scales",
    note:"Practise each scale three ways: one octave, two octaves, and extended — up to the point on the G string where the next shift would be needed, which usually stops a little short of two octaves. The extended pattern takes you straight across the strings and back, which is what builds right-hand speed.",
    exercises:[
     ex({
      id:"jaco-sc-1",title:"One octave",
      brief:"Up and back, evenly. Choose a tempo where nothing stumbles and hold it.",
      pass:"Every note is the same length and the same weight.",
      root:C2,rootName:"C major · one octave",tempo:66,
      bars:intoBars(eighths(upDown([0,2,4,5,7,9,11,12])).concat([n(0,2)])),
     }),
     ex({
      id:"jaco-sc-2",title:"Two octaves",
      brief:"The same scale across two octaves. The shifts are the exercise.",
      pass:"The shifts are inaudible.",
      root:C2,rootName:"C major · two octaves",tempo:66,
      bars:intoBars(eighths(upDown([0,2,4,5,7,9,11,12,14,16,17,19,21,23,24])).concat([n(0,2)])),
     }),
     ex({
      id:"jaco-sc-3",title:"Extended",
      brief:"Up to the last note on the G string before another shift would be needed, then back. Across the strings and home without moving the hand.",
      pass:"The hand does not move position once.",
      root:C2,rootName:"C major · extended",tempo:70,
      bars:intoBars(eighths(upDown([0,2,4,5,7,9,11,12,14,16,17])).concat([n(0,2)])),
     }),
    ],
   },
   {
    id:"sequences",title:"Melodic Sequences",
    note:"Three patterns that ran through the lessons: take a scale and move a fixed shape down through it, one degree at a time. They turn a scale into vocabulary. Learn them in all keys.",
    exercises:[
     ex({
      id:"jaco-seq-1",title:"Sequence 1 — descending fours",
      brief:"Four notes down from each degree, then start again a degree lower.",
      pass:"The pattern never breaks at a string crossing.",
      root:C2,rootName:"C major",tempo:70,
      bars:intoBars([12,11,9,7,5,4].flatMap(top=>{
       const scale=[0,2,4,5,7,9,11,12,14,16];
       const at=scale.indexOf(top);
       return eighths(scale.slice(Math.max(0,at-3),at+1).reverse());
      })),
     }),
     ex({
      id:"jaco-seq-2",title:"Sequence 2 — down three, up one",
      brief:"Three notes down then one back up, moving a degree lower each time.",
      pass:"The turn is as even as the descent.",
      root:C2,rootName:"C major",tempo:70,
      bars:intoBars([12,11,9,7,5,4].flatMap(top=>{
       const scale=[0,2,4,5,7,9,11,12,14,16];
       const at=scale.indexOf(top);
       const cell=scale.slice(Math.max(0,at-2),at+1).reverse();
       return eighths([...cell,scale[Math.max(0,at-1)]]);
      })),
     }),
     ex({
      id:"jaco-seq-3",title:"Sequence 3 — diatonic thirds",
      brief:"A note, skip one, the next — then move down a degree and do it again.",
      pass:"You can name each interval as a major or a minor 3rd.",
      root:C2,rootName:"C major",tempo:70,
      bars:intoBars([0,2,4,5,7,9,11,12].flatMap(step=>eighths([step,step+4>12?step+3:step+4]))
       .concat(eighths([12,9,11,7,9,5,7,4,5,2,4,0]))),
     }),
    ],
   },
   {
    id:"modes",title:"Modes",
    note:"Two ways to see the same thing. A mode is the major scale started from one of its degrees — D Dorian is C major from D. Or it is a major or minor scale with one degree altered — Dorian is minor with a raised 6th, Lydian is major with a ♯4. The second view is the one that tells you what it will sound like. Practise each with the chord it belongs over: Dorian with minor sevenths, Mixolydian with dominants, Lydian with major sevenths, Locrian with minor seven flat five.",
    exercises:[
     ex({
      id:"jaco-mode-1",title:"The seven modes from one root",
      brief:"All seven from the same root, so only the altered degrees change. Announce which degree moved before each one.",
      pass:"You can name the altered degree between any two neighbours.",
      root:C2,rootName:"C · parallel modes",tempo:64,
      bars:intoBars([
       [0,2,4,5,7,9,11,12],
       [0,2,3,5,7,9,10,12],
       [0,1,3,5,7,8,10,12],
       [0,2,4,6,7,9,11,12],
       [0,2,4,5,7,9,10,12],
       [0,2,3,5,7,8,10,12],
       [0,1,3,5,6,8,10,12],
      ].flatMap(mode=>eighths(mode))),
     }),
     ex({
      id:"jaco-mode-2",title:"Mode and chord together",
      brief:"Each mode straight after the chord it belongs over — the arpeggio, then the scale.",
      pass:"The chord and scale sound like one idea, not two exercises.",
      root:D2,rootName:"Dm7 · G7 · Cmaj7 · Bm7♭5",tempo:70,
      bars:intoBars([
       ...eighths([0,3,7,10,7,3,0,3]),
       ...eighths([0,2,3,5,7,9,10,12]),
       ...eighths([5,9,12,15,12,9,5,9]),
       ...eighths([5,7,9,10,12,14,15,17]),
       ...eighths([10,14,17,21,17,14,10,14]),
       ...eighths([10,12,14,16,17,19,21,22]),
       ...eighths([9,12,15,19,15,12,9,12]),
       ...eighths([9,10,12,14,15,17,19,21]),
      ]),
     }),
    ],
   },
  ],
 },

 /* ============================================================= */
 {
  n:5,id:"rhythm",title:"Rhythmic Elements",
  note:"Seven grooves, each one a different rhythmic problem. The book takes these from the records; what follows is original material built on the same device, with the recording named so you can hear where it comes from.",
  sections:[
   {
    id:"sixteenths",title:"Sixteenth-note funk",
    listen:"“Come On, Come Over”",
    note:"The plucking hand never stops moving through the sixteenth grid. Most of those sixteenths are dead notes; the small number that get a pitch are placed exactly.",
    exercises:[ex({
     id:"jaco-rh-16",title:"The dead-note grid",
     brief:"Sixteen sixteenths, four of them sounded. Keep the hand moving through every cell.",
     pass:"The dead notes read as rhythm, not as mistakes.",
     root:F1,rootName:"F7",tempo:96,
     bars:[
      [n(0,16,{accent:true}),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,16),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,16,{ghost:true}),
       n(0,16,{accent:true}),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(12,16),n(0,16,{ghost:true}),n(10,16),n(0,16,{ghost:true}),n(0,16,{ghost:true})],
      [n(0,16,{accent:true}),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,16,{ghost:true}),n(0,16),n(0,16,{ghost:true}),n(3,16),n(0,16,{ghost:true}),
       n(0,16,{accent:true}),n(0,16,{ghost:true}),n(12,16),n(0,16,{ghost:true}),n(10,16),n(0,16,{ghost:true}),n(7,16),n(0,16,{ghost:true})],
     ],
    })],
   },
   {
    id:"ostinato",title:"Ostinato and odd groupings",
    listen:"“Opus Pocus”",
    note:"A figure that repeats exactly while the bar moves underneath it. The point is that the cell does not adjust to the bar line.",
    exercises:[ex({
     id:"jaco-rh-ost",title:"A three-note cell in four",
     brief:"Three notes inside a four-beat bar. It takes three bars to come back round.",
     pass:"You keep the count of four while the figure argues with it.",
     root:A1,rootName:"A minor",tempo:76,
     bars:intoBars(eighths([0,3,7,0,3,7,0,3,7,0,3,7,0,3,7,0,3,7,0,3,7,0,3,7]).concat([n(0,2)])),
    })],
   },
   {
    id:"second-line",title:"Second line",
    listen:"“Liberty City”",
    note:"A New Orleans parade feel: the bass answers the drum rather than doubling it, and the space matters as much as the notes.",
    exercises:[ex({
     id:"jaco-rh-2nd",title:"Answering the drum",
     brief:"Play on the second half of each beat as often as the first. Leave beat 3 alone in the first bar.",
     pass:"It swings without a snare behind it.",
     root:F1,rootName:"F major",tempo:88,
     bars:[
      [n(0,8),n(0,16,{ghost:true}),n(0,16),n(7,8),r(8),n(5,8),n(4,8),n(0,4)],
      [n(0,8),n(7,8),n(9,8),n(7,8),n(5,4),n(0,4)],
      [n(0,8),n(0,16,{ghost:true}),n(0,16),n(7,8),r(8),n(9,8),n(7,8),n(5,4)],
      [n(0,2),r(2)],
     ],
    })],
   },
   {
    id:"straight-funk",title:"Straight funk",
    listen:"“I Can Dig It Baby”",
    note:"Root-heavy, on the beat, and unhurried. The hardest thing here is playing less.",
    exercises:[ex({
     id:"jaco-rh-funk",title:"Playing less",
     brief:"Four bars where the busiest one has six notes in it.",
     pass:"You are not tempted to fill the gaps.",
     root:E1,rootName:"E7",tempo:92,
     bars:[
      [n(0,4),r(8),n(0,8),n(10,4),r(4)],
      [n(0,4),r(8),n(0,8),n(3,8),n(0,8),r(4)],
      [n(0,4),r(8),n(0,8),n(10,4),n(12,4)],
      [n(0,2),r(2)],
     ],
    })],
   },
   {
    id:"burn",title:"Fast swing",
    listen:"“Kuru”",
    note:"Quarter notes at a tempo where quarter notes are difficult. Walking is the technique and time is the whole test.",
    exercises:[ex({
     id:"jaco-rh-walk",title:"Walking at tempo",
     brief:"Four to the bar through a ii–V–I. Every note the same length.",
     pass:"The time does not lean forward as it gets harder.",
     root:D2,rootName:"Dm7 → G7 → Cmaj7",tempo:120,
     bars:[
      [n(0,4),n(3,4),n(5,4),n(7,4)],
      [n(5,4),n(9,4),n(12,4),n(11,4)],
      [n(10,4),n(14,4),n(12,4),n(11,4)],
      [n(10,2),r(2)],
     ],
    })],
   },
   {
    id:"cha-cha",title:"Cha-cha",
    listen:"“(Used to Be A) Cha-Cha”",
    note:"A Latin feel where the bass lands off the downbeat and the pattern is two bars long, not one.",
    exercises:[ex({
     id:"jaco-rh-cha",title:"Two-bar Latin cell",
     brief:"The figure is two bars. Do not let it collapse into a one-bar loop.",
     pass:"You can feel bar 1 and bar 2 as different places.",
     root:C2,rootName:"C minor",tempo:104,
     bars:[
      [n(0,4),r(8),n(0,8),n(7,4),n(10,8),n(7,8)],
      [r(8),n(0,8),n(0,4),n(3,8),n(0,8),n(-2,4)],
     ],
    })],
   },
   {
    id:"afro-cuban",title:"Afro-Cuban 6/8",
    listen:"“Okonkole Y Trompa”",
    note:"Six-eight, felt in two. The bass sits with the bell pattern rather than on the beat.",
    exercises:[ex({
     id:"jaco-rh-68",title:"Six-eight, felt in two",
     brief:"Count two dotted beats a bar, not six eighths.",
     pass:"It feels like two, and the subdivision is still even.",
     root:G1,rootName:"G minor",tempo:88,ts:[6,8],
     bars:[
      [n(0,8),r(8),n(3,8),n(7,8),r(8),n(5,8)],
      [n(0,8),r(8),n(3,8),n(10,8),n(7,8),n(3,8)],
      [n(0,8),r(8),n(3,8),n(7,8),r(8),n(10,8)],
      [n(0,4,{dot:true}),n(7,4,{dot:true})],
     ],
    })],
   },
  ],
 },

 /* ============================================================= */
 {
  n:6,id:"solo",title:"Soloistic Elements",
  note:"Six solo studies. The book transcribes the originals; these are written for the same devices, and each names the record so you can hear how it was actually done.",
  sections:[
   {
    id:"bebop-head",title:"Reading a bebop head",
    listen:"“Donna Lee”",
    note:"A bebop line played on bass at speed: continuous eighths, chromatic approach notes always on the weak part of the beat, and every phrase landing on a chord tone.",
    exercises:[ex({
     id:"jaco-solo-bebop",title:"Bebop line over ii–V–I",
     brief:"Continuous eighths. Every chromatic note falls on a weak eighth and resolves by a half step.",
     pass:"Play it at 60 with every note even before taking it faster.",
     root:D2,rootName:"Dm7 → G7 → Cmaj7",tempo:96,
     bars:intoBars([
      ...eighths([0,2,3,5,7,9,10,11]),
      ...eighths([12,10,9,8,7,5,4,3]),
      ...eighths([2,1,0,-2,-3,-1,0,2]),
      n(-2,2),r(2),
     ]),
    })],
   },
   {
    id:"singing",title:"The singing line",
    listen:"“Continuum”",
    note:"Fretless, high on the neck, almost every note entered or left with a slide. Play it as though it has words.",
    exercises:[ex({
     id:"jaco-solo-sing",title:"A melody, not a bass part",
     brief:"Upper register, slid entrances, vibrato on anything held.",
     pass:"Someone listening would call it a melody.",
     root:D2,rootName:"D minor",tempo:64,
     bars:[
      [n(19,4,{slide:"inFromBelow"}),n(17,4),n(15,2,{vibrato:true})],
      [n(17,4,{slide:"legato"}),n(19,4),n(22,2,{vibrato:true})],
      [n(19,8),n(17,8),n(15,4),n(14,4,{slide:"legato"}),n(15,4)],
      [n(12,1,{vibrato:true})],
     ],
    })],
   },
   {
    id:"latin-solo",title:"Soloing over a Latin vamp",
    listen:"“(Used to Be A) Cha-Cha”",
    note:"The same two-bar feel from the rhythm chapter, now with a line over it. The groove has to survive the solo.",
    exercises:[ex({
     id:"jaco-solo-latin",title:"Line over the two-bar cell",
     brief:"Keep the two-bar shape audible while the line moves above it.",
     pass:"You can still feel the cha-cha underneath.",
     root:C2,rootName:"C minor",tempo:104,
     bars:[
      [n(0,8),n(3,8),n(7,8),n(10,8),n(12,4),n(10,4)],
      [n(7,8),n(10,8),n(12,8),n(15,8),n(14,4),n(12,4)],
      [n(10,8),n(12,8),n(15,8),n(19,8),n(15,4),n(12,4)],
      [n(0,2),r(2)],
     ],
    })],
   },
   {
    id:"composed",title:"A composed melody at speed",
    listen:"“Teen Town”",
    note:"Written, not improvised — a line where the melody and the bass part are the same thing, and the tempo is the difficulty.",
    exercises:[ex({
     id:"jaco-solo-fast",title:"Written line at tempo",
     brief:"Sixteenths in a fixed shape. Learn it slowly enough to memorise, then push the tempo.",
     pass:"You can play it from memory without looking at the neck.",
     root:F1,rootName:"F minor",tempo:104,
     bars:intoBars([
      ...runOf([0,3,5,7,5,3,0,3],16),
      ...runOf([5,7,10,12,10,7,5,7],16),
      ...runOf([0,3,5,7,10,12,15,12],16),
      ...runOf([10,7,5,3,0,3,5,3],16),
      n(0,2),r(2),
     ]),
    })],
   },
   {
    id:"harmonic-solo",title:"Harmonic sophistication",
    listen:"“Havona”",
    note:"Fast changes with altered dominants, and a solo that keeps stating the harmony rather than running scales over it.",
    exercises:[ex({
     id:"jaco-solo-harm",title:"Stating the changes",
     brief:"One bar per chord, arpeggios only, with an altered extension on each dominant.",
     pass:"The changes are readable with nothing playing behind you.",
     root:C2,rootName:"Cmaj7 → A7♭9 → Dm7 → G7♯9",tempo:88,
     bars:intoBars([
      ...eighths([0,4,7,11,7,4,0,4]),
      ...eighths([9,13,16,19,20,16,13,9]),
      ...eighths([2,5,9,12,9,5,2,5]),
      ...eighths([7,11,14,17,18,14,11,7]),
      n(0,2),r(2),
     ]),
    })],
   },
   {
    id:"baroque",title:"Baroque line playing",
    listen:"“Chromatic Fantasy”",
    note:"He worked from Bach and Dotzauer, and thought of that material the same way he thought of a jazz solo — analysed with chord symbols rather than Roman numerals. Continuous line, one voice implying several.",
    exercises:[ex({
     id:"jaco-solo-bach",title:"One voice implying two",
     brief:"A continuous line that alternates a moving upper voice against a held low note, so a single line sounds like two.",
     pass:"A listener hears two parts.",
     root:D2,rootName:"D minor",tempo:76,
     bars:intoBars([
      ...eighths([0,12,2,12,3,12,5,12]),
      ...eighths([7,12,5,12,3,12,2,12]),
      ...eighths([0,14,2,14,3,14,5,14]),
      ...eighths([7,17,5,15,3,14,2,12]),
      n(0,2),r(2),
     ]),
    })],
   },
  ],
 },

 /* ============================================================= */
 {
  n:7,id:"food-for-thought",title:"Food for Thought",
  note:"The book closes its teaching with a chapter that has no exercises in it — an argument that the man deserves to be remembered for more than the wreckage of his last years. He was generous with his time, competitive at sport, serious about being a decent citizen, and convinced that attitude was most of playing well: about seventy-five percent mental, as he put it — if you are thinking you are happening, you are always swinging. The point for a student is that the character and the playing were not separable, and the strengths worth copying are not only the musical ones.",
  sections:[],
 },

 /* ============================================================= */
 {
  n:8,id:"sketchbook",title:"Sketchbook",
  note:"The last chapter reproduces pages from his own practice book — scrawled staves with instructions to himself in the margins. The ideas on them are worth working even without the handwriting: diminished fourths inside Dorian harmony, everything also played backwards, fifths taken in reverse, and the standing note to practise it all in triplets.",
  sections:[
   {
    id:"dim-fourths",title:"Diminished fourths in Dorian harmony",
    note:"Stack fourths out of the Dorian collection and let the diminished one fall where it falls. The interval that does not fit is the one worth hearing.",
    exercises:[ex({
     id:"jaco-sk-1",title:"Fourths through Dorian",
     brief:"A fourth from each degree of D Dorian. One of them is diminished — find it by ear before you work it out.",
     pass:"You can name which degree produced the odd one.",
     root:D2,rootName:"D Dorian",tempo:66,
     bars:intoBars([0,2,3,5,7,9,10,12].flatMap(step=>eighths([step,step+5>12&&step===9?step+4:step+5]))),
    })],
   },
   {
    id:"retrograde",title:"Also retrograde",
    note:"Whatever you have just practised, play it backwards. It is the same material and a completely different exercise, because the hand cannot coast.",
    exercises:[ex({
     id:"jaco-sk-2",title:"Forwards, then backwards",
     brief:"Two bars of a figure, then the same notes in reverse order.",
     pass:"The retrograde is as fluent as the original.",
     root:D2,rootName:"D Dorian",tempo:70,
     bars:intoBars([
      ...eighths([0,2,3,5,7,9,10,12]),
      ...eighths([12,10,9,7,5,3,2,0]),
      ...eighths([0,3,7,10,12,10,7,3]),
      ...eighths([3,7,10,12,10,7,3,0]),
     ]),
    })],
   },
   {
    id:"fifths-backwards",title:"Fifths backwards",
    note:"The cycle is normally practised in one direction until that direction is the only one you know. Take it the other way.",
    exercises:[ex({
     id:"jaco-sk-3",title:"The cycle in reverse",
     brief:"Up a fifth each bar instead of down. Root and 5th only.",
     pass:"As automatic as the familiar direction.",
     root:C2,rootName:"C · up in fifths",tempo:66,
     bars:intoBars([0,7,2,9,4,11,6,1].flatMap(step=>eighths([step,step+7,step+12,step+7]))),
    })],
   },
   {
    id:"triplets",title:"Practise in triplets",
    note:"The instruction written across his own page. Anything drilled in eighths becomes a different exercise in threes, because the accents land somewhere else every bar.",
    exercises:[ex({
     id:"jaco-sk-4",title:"The same scale in threes",
     brief:"A scale you already know, in triplets. The accent moves through the scale as the groupings cross the beat.",
     pass:"The triplets are even and the accents fall where they fall.",
     root:C2,rootName:"C major",tempo:66,
     bars:intoBars(trip(upDown([0,2,4,5,7,9,11,12])).concat([n(0,2)])),
    })],
   },
  ],
 },
];

export const JACO_SECTIONS:Section[]=JACO_CHAPTERS.flatMap(chapter=>chapter.sections);
export const JACO_EXERCISES:TabExercise[]=JACO_SECTIONS.flatMap(section=>section.exercises);
export const jacoChapter=(id:string)=>JACO_CHAPTERS.find(chapter=>chapter.id===id);

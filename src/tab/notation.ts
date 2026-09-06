/**
 * The music model the exercises are written in, and its translation to alphaTex.
 *
 * Exercises are written as scale degrees above a root rather than as frets,
 * because that is how the course itself thinks: every lesson describes its
 * material as intervals ("♭3", "natural 6", "♯4"), and the same exercise has to
 * work from whatever root a learner transposes it to. Frets are chosen here, at
 * the last moment, by {@link fingerings}.
 */

/** Note values, as the denominator of the fraction: 4 is a quarter note. */
export type Duration=1|2|4|8|16|32;

/** How a note is touched, as opposed to which note it is. */
export type Slide=
 /** Into the next written note, and out of this one. */
 |"legato"|"shift"
 /** Arriving from an unwritten pitch below or above — the fretless entrance. */
 |"inFromBelow"|"inFromAbove"
 /** Leaving the pitch and letting it fall or rise away. */
 |"outUp"|"outDown";

type Shading={
 dot?:boolean;
 accent?:boolean;
 ghost?:boolean;
 tuplet?:number;
 letRing?:boolean;
 staccato?:boolean;
 palmMute?:boolean;
 vibrato?:boolean;
 slide?:Slide;
 /** Natural harmonics ring off the open string; artificial ones are stopped. */
 harmonic?:"natural"|"artificial";
};

export type Event=
 /** A pitch, given as semitones above the exercise root. */
 |({t:"n";deg:number;d:Duration}&Shading)
 /** Two or more pitches struck together — double stops, tenths, triads. */
 |({t:"c";degs:number[];d:Duration}&Shading)
 /**
  * A note already tied to a place on the neck. Material that arrives as tab —
  * the Beast passages, an imported file — already answers the fingering
  * question, and re-deriving it would move notes the author placed on purpose.
  */
 |({t:"f";string:number;fret:number;d:Duration}&Shading)
 /** Silence. */
 |{t:"r";d:Duration};

export type Bar=Event[];

export type TabExercise={
 id:string;
 title:string;
 /** What the learner is being asked to do. */
 brief:string;
 /** How they know they have it. */
 pass:string;
 /** Concert pitch of degree 0, as MIDI. */
 root:number;
 /** How the root is spelled in this exercise's key. */
 rootName:string;
 tempo:number;
 ts?:[number,number];
 bars:Bar[];
 /** Bars worth looping by default — practice material usually is. */
 loop?:boolean;
};

/** Standard 4-string bass pitches, low to high: E1 A1 D2 G2. */
export const BASS_TUNING=[28,33,38,43];
/**
 * The same tuning written for alphaTex, which needs it highest string first.
 *
 * alphaTex numbers strings by their line from the top down, and takes each
 * one's pitch from this list in the order written — so string 1 is both the top
 * line and the first entry here. Declaring it low-to-high instead puts the E
 * string on the top line: the tab still reads plausibly, and every note sounds
 * a string away from where it is written.
 */
const TUNING_TEX="G2 D2 A1 E1";
const STRINGS=BASS_TUNING.length;
/**
 * Above this the neck runs out of usable room for practice material. Twenty is
 * what a Fender Jazz gives you, which is the neck this material was written on.
 */
const MAX_FRET=20;

const PLAIN_BEATS:Record<Duration,number>={1:4,2:2,4:1,8:0.5,16:0.25,32:0.125};

/**
 * How many beats an event occupies.
 *
 * A tuplet squeezes its notes into less time than they are written for — three
 * triplet eighths fill the space of two — so the written value alone does not
 * add a bar up correctly.
 */
export function beatsOf(event:Event):number{
 const plain=PLAIN_BEATS[event.d];
 const dotted="dot" in event&&event.dot?plain*1.5:plain;
 const tuplet="tuplet" in event&&event.tuplet?dotted*2/event.tuplet:dotted;
 return tuplet;
}

/** MIDI note number for a degree above a root. */
export const pitchOf=(root:number,deg:number)=>root+deg;

const SHARP_NAMES=["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
const FLAT_NAMES=["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"];

/** Spell a MIDI pitch, choosing flats or sharps to match the exercise's key. */
export function noteName(midi:number,preferFlats=true){
 const table=preferFlats?FLAT_NAMES:SHARP_NAMES;
 return table[((midi%12)+12)%12]+(Math.floor(midi/12)-1);
}

export type Fingering={string:number;fret:number};

/**
 * Choose a fret and string for every pitch in the exercise.
 *
 * A pitch sits on up to four places on the neck, and picking each one
 * independently produces tab that is technically correct and unplayable. This
 * walks the whole line at once and takes the route with the least hand travel,
 * which is what a bass player would actually finger.
 */
export function fingerings(pitches:number[]):Fingering[]{
 if(pitches.length===0)return [];

 // Every place each pitch can be played, cheapest hand position first.
 const options=pitches.map(pitch=>{
  const places:Fingering[]=[];
  for(let s=1;s<=STRINGS;s++){
   const open=BASS_TUNING[STRINGS-s];
   const fret=pitch-open;
   if(fret>=0&&fret<=MAX_FRET)places.push({string:s,fret});
  }
  return places;
 });

 // A pitch below the open E simply cannot be played; the caller has written the
 // exercise in the wrong register and should hear about it rather than get
 // silently transposed tab.
 const missing=options.findIndex(places=>places.length===0);
 if(missing>=0)throw new Error(`Pitch ${pitches[missing]} (${noteName(pitches[missing])}) is outside the range of a 4-string bass.`);

 const travel=(from:Fingering,to:Fingering)=>{
  // Open strings cost nothing to reach, so they should not drag the hand.
  const stretch=from.fret===0||to.fret===0?0:Math.abs(from.fret-to.fret);
  const cross=Math.abs(from.string-to.string);
  return stretch*2+(cross>2?(cross-2)*3:0);
 };
 // Prefer the lower neck, and prefer not to sit on the thin strings for bass
 // lines that could be played lower and fatter.
 const seat=(f:Fingering)=>f.fret*0.35+(STRINGS-f.string)*0.2;

 let previous=options[0].map(place=>({cost:seat(place),from:-1}));
 const back:number[][]=[options[0].map(()=>-1)];

 for(let i=1;i<options.length;i++){
  const row=options[i].map((place,j)=>{
   let best=Infinity,bestFrom=0;
   previous.forEach((prior,k)=>{
    const cost=prior.cost+travel(options[i-1][k],place)+seat(place);
    if(cost<best){best=cost;bestFrom=k}
   });
   return {cost:best,from:bestFrom,index:j};
  });
  back.push(row.map(entry=>entry.from));
  previous=row;
 }

 // Walk the cheapest ending back to the start.
 let index=0;
 previous.forEach((entry,i)=>{if(entry.cost<previous[index].cost)index=i});
 const chosen:Fingering[]=[];
 for(let i=options.length-1;i>=0;i--){
  chosen[i]=options[i][index];
  index=back[i][index];
 }
 return chosen;
}

const escapeTex=(text:string)=>text.replace(/"/g,"'");

const SLIDE_TEX:Record<Slide,string>={
 legato:"sl",shift:"ss",
 inFromBelow:"sib",inFromAbove:"sia",
 outUp:"sou",outDown:"sod",
};

/**
 * Voice a chord across separate strings.
 *
 * Notes struck together each need their own string, so the melodic fingering
 * pass cannot answer this — it is free to reuse a string from one note to the
 * next. The search is tiny (at most four pitches over four strings), so every
 * arrangement is tried and the one a hand can actually hold wins: the smallest
 * fret span, then the lowest position.
 */
function chordVoicing(pitches:number[]):Fingering[]{
 const options=pitches.map(pitch=>{
  const places:Fingering[]=[];
  for(let s=1;s<=STRINGS;s++){
   const fret=pitch-BASS_TUNING[STRINGS-s];
   if(fret>=0&&fret<=MAX_FRET)places.push({string:s,fret});
  }
  return places;
 });
 if(options.some(places=>places.length===0)){
  const missing=pitches[options.findIndex(places=>places.length===0)];
  throw new Error(`Pitch ${missing} (${noteName(missing)}) is outside the range of a 4-string bass.`);
 }

 let best:Fingering[]|null=null,bestCost=Infinity;
 const walk=(index:number,taken:Fingering[])=>{
  if(index===options.length){
   const frets=taken.filter(place=>place.fret>0).map(place=>place.fret);
   const span=frets.length?Math.max(...frets)-Math.min(...frets):0;
   // A span wider than four frets is not a chord anyone holds.
   if(span>4)return;
   const cost=span*10+Math.min(...taken.map(place=>place.fret));
   if(cost<bestCost){bestCost=cost;best=[...taken]}
   return;
  }
  for(const place of options[index]){
   if(taken.some(other=>other.string===place.string))continue;
   walk(index+1,[...taken,place]);
  }
 };
 walk(0,[]);
 if(!best)throw new Error(`These notes cannot be held together: ${pitches.map(p=>noteName(p)).join(" ")}.`);
 return best;
}

/** Render one exercise as alphaTex, ready to hand to the reader. */
export function toAlphaTex(exercise:TabExercise):string{
 const [beats,unit]=exercise.ts??[4,4];

 // Fingerings are chosen across the whole exercise, so the hand position
 // carries over bar lines the way it does when someone plays it.
 const pitches:number[]=[];
 exercise.bars.forEach(bar=>bar.forEach(event=>{
  if(event.t==="n")pitches.push(pitchOf(exercise.root,event.deg));
 }));
 const places=fingerings(pitches);

 let n=0;
 const bars=exercise.bars.map(bar=>bar.map(event=>{
  /*
   * A note is written `fret.string{how it is played}.duration{what the beat
   * does}`. The two brace blocks are not interchangeable: how a note is
   * touched belongs to the note and has to come before the duration, while
   * dots and tuplets belong to the beat and come after it. Putting a note
   * effect after the duration does not degrade — the whole score fails to
   * parse.
   */
  const beatFx:string[]=[];
  if(event.d&&"dot" in event&&event.dot)beatFx.push("d");
  if("tuplet" in event&&event.tuplet)beatFx.push(`tu ${event.tuplet}`);
  const beatShade=beatFx.length?`{${beatFx.join(" ")}}`:"";

  if(event.t==="r")return `r.${event.d}${beatShade}`;

  const noteFx:string[]=[];
  if(event.accent)noteFx.push("ac");
  if(event.ghost)noteFx.push("x");
  if(event.letRing)noteFx.push("lr");
  if(event.staccato)noteFx.push("st");
  if(event.palmMute)noteFx.push("pm");
  if(event.vibrato)noteFx.push("v");
  if(event.slide)noteFx.push(SLIDE_TEX[event.slide]);
  if(event.harmonic)noteFx.push(event.harmonic==="natural"?"nh":"ah");
  const noteShade=noteFx.length?`{${noteFx.join(" ")}}`:"";

  if(event.t==="c"){
   // A chord is its notes in brackets, each carrying its own touch, then one
   // shared duration for the beat.
   const voicing=chordVoicing(event.degs.map(deg=>pitchOf(exercise.root,deg)));
   return `(${voicing.map(place=>`${place.fret}.${place.string}${noteShade}`).join(" ")}).${event.d}${beatShade}`;
  }
  const {string,fret}=event.t==="f"?event:places[n++];
  return `${fret}.${string}${noteShade}.${event.d}${beatShade}`;
 }).join(" ")).join(" |\n");

 return [
  `\\title "${escapeTex(exercise.title)}"`,
  `\\subtitle "${escapeTex(exercise.rootName)} · ${exercise.tempo} BPM"`,
  `\\tempo ${exercise.tempo}`,
  // 33 is fingered electric bass in General MIDI, so playback sounds like the
  // instrument the exercise is for.
  `\\instrument 33`,
  `\\tuning ${TUNING_TEX}`,
  `\\ts ${beats} ${unit}`,
  ".",
  bars,
 ].join("\n");
}

/* ---- helpers used by the exercise library, so specs stay readable ---- */

/** A note, by degree above the root. */
export const n=(deg:number,d:Duration=4,extra:Partial<Extract<Event,{t:"n"}>>={}):Event=>({t:"n",deg,d,...extra});
/** A rest. */
export const r=(d:Duration=4):Event=>({t:"r",d});
/** Several pitches struck together. */
export const c=(degs:number[],d:Duration=4,extra:Partial<Extract<Event,{t:"c"}>>={}):Event=>({t:"c",degs,d,...extra});
/** A note at a known place on the neck. */
export const f=(string:number,fret:number,d:Duration=8,extra:Partial<Extract<Event,{t:"f"}>>={}):Event=>({t:"f",string,fret,d,...extra});
/** Several degrees in a row at one note value. */
export const run=(degs:number[],d:Duration=4):Event[]=>degs.map(deg=>n(deg,d));

/**
 * The distinct degrees an exercise is built from, in the order they first
 * appear.
 *
 * An exercise says what to do and how to know you have it, but never which
 * notes it is made of or what they are for. That answer is already sitting in
 * the music, so it is read back rather than written out — it cannot drift from
 * the exercise the way a hand-written note would.
 *
 * Material that arrived already fretted has no root to measure against, so it
 * returns nothing rather than inventing degrees.
 */
export function degreesUsed(exercise:TabExercise):number[]{
 const seen:number[]=[];
 for(const bar of exercise.bars)for(const event of bar){
  const degrees=event.t==="n"?[event.deg]:event.t==="c"?event.degs:[];
  for(const degree of degrees){
   const pitchClass=((degree%12)+12)%12;
   if(!seen.includes(pitchClass))seen.push(pitchClass);
  }
 }
 return seen;
}

/* ---------------- transposition ---------------- */

/**
 * Rewrite the note names inside an exercise's label.
 *
 * Labels are written prose — "Am7", "Dm7 → G7 → Cmaj7", "D Dorian drone" — so
 * moving an exercise to another key has to move the names in its label too, or
 * the tab plays in F while the heading still says A minor.
 *
 * Only a bare note name is touched: a letter A to G, optionally with one
 * accidental, standing as its own word. That leaves "As written" and "Cycle of
 * fifths" alone, because neither "As" nor "Cycle" is a note name on its own.
 */
export function transposeLabel(label:string,semitones:number):string{
 if(semitones===0)return label;
 const STEP:Record<string,number>={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
 /*
  * A note name here is a letter A to G, optionally with one accidental, that
  * is either standing alone or followed by something that only ever follows a
  * chord root — a quality, a number, a slash. Requiring a word boundary after
  * the letter is not enough: it would rewrite the D of "D Dorian" and leave
  * the A of "Am7" alone, which is exactly backwards. Requiring no letter after
  * is not enough either, for the same reason in reverse.
  */
 // The trailing alternatives matter: without a space or punctuation among
 // them, "B♭ major" backtracks to bare "B", shifts that, and leaves the flat
 // stranded behind it as "C♭".
 const NOTE=/\b([A-G])([♯♭#b])?(?=maj|min|dim|aug|sus|add|m|°|ø|[+\/0-9]|[\s·,;:)\]]|$|\b)/g;
 return label.replace(NOTE,(whole,letter:string,accidental?:string)=>{
  const shift=accidental==="♯"||accidental==="#"?1:accidental==="♭"||accidental==="b"?-1:0;
  const from=STEP[letter];
  if(from===undefined)return whole;
  return FLAT_NAMES[(((from+shift+semitones)%12)+12)%12];
 });
}


/** Roots the search will try, low to high, when moving an exercise. */
const ROOT_SEARCH_LOW=28;   // open E, the lowest note on the instrument
const ROOT_SEARCH_HIGH=45;  // an octave and a half up, past which nothing sits

/**
 * Move an exercise to another key.
 *
 * Exercises are written as degrees above a root and fretted at the last
 * moment, so a key change is a change of one number — which is what makes all
 * twelve keys available from material written once. The catch is range: the
 * same degrees an octave too high run off the end of the neck, and an octave
 * too low fall under the open E. So rather than shifting the root by the
 * interval, every octave of the target note is tried and the lowest one that
 * the whole exercise actually fits on is taken.
 *
 * Returns null when no octave works, which is the honest answer for material
 * that already spans most of the neck.
 */
export function transpose(exercise:TabExercise,pitchClass:number):TabExercise|null{
 const target=((pitchClass%12)+12)%12;
 for(let root=ROOT_SEARCH_LOW;root<=ROOT_SEARCH_HIGH;root++){
  if((((root%12)+12)%12)!==target)continue;
  const moved:TabExercise={
   ...exercise,
   root,
   rootName:transposeLabel(exercise.rootName,root-exercise.root),
   title:exercise.title,
  };
  try{
   toAlphaTex(moved);
   return moved;
  }catch{
   // This octave does not fit on the neck; try the next one up.
  }
 }
 return null;
}

/**
 * Which of the twelve keys an exercise can actually be played in.
 *
 * Material written as frets rather than degrees — the Beast passages, the
 * harmonics studies — has no root to move, so it reports none rather than
 * offering twelve keys that would all sound identical.
 */
export function playableKeys(exercise:TabExercise):number[]{
 if(degreesUsed(exercise).length===0)return [];
 const keys:number[]=[];
 for(let pitchClass=0;pitchClass<12;pitchClass++){
  if(transpose(exercise,pitchClass))keys.push(pitchClass);
 }
 return keys;
}

/** The bare name of a pitch class, for labelling a key. */
export const keyName=(pitchClass:number)=>FLAT_NAMES[((pitchClass%12)+12)%12];

import assert from "node:assert/strict";
import test from "node:test";
import {COURSE_LESSONS} from "../src/course-data.ts";
import {BASS_TUNING,beatsOf,degreesUsed,fingerings,keyName,playableKeys,toAlphaTex,transpose,transposeLabel,c,f,n,r} from "../src/tab/notation.ts";
import {parseAsciiTab} from "../src/tab/ascii-tab.ts";
import {COURSE_TABS,courseTabsFor} from "../src/tab/course-exercises.ts";
import {BEAST_TABS,MAQAM_TABS,SLAP_TABS} from "../src/tab/lab-exercises.ts";
import {JACO_CHAPTERS,JACO_EXERCISES,JACO_SECTIONS} from "../src/tab/jaco-masterclass.ts";

const everyExercise=[
 ...Object.values(COURSE_TABS),
 ...BEAST_TABS,
 ...Object.values(SLAP_TABS),
 ...Object.values(MAQAM_TABS),
 ...JACO_EXERCISES,
];

/**
 * Beat arithmetic comes from the engine itself. A copy here would have to know
 * about dots and tuplets too, and would drift out of step the moment one of
 * them changed.
 */
const beats=beatsOf;

/** The bars of an alphaTex score, past the metadata header. */
const bodyOf=tex=>tex.split("\n.\n")[1]??"";

/**
 * Every note in a score, as {fret,string}, in playing order.
 *
 * Two shapes to read: a single note carries its own duration, `5.4.4`, while
 * the notes of a chord are bracketed and share one, `(5.4 4.2).4`. Reading only
 * the first shape silently skips every chord, which makes the checks below pass
 * on material they never looked at.
 */
const notesIn=tex=>{
 const found=[];
 const token=/\(([^)]*)\)\.\d+(?:\{[^}]*\})?|(\d+)\.(\d)(?:\{[^}]*\})?\.\d+(?:\{[^}]*\})?/g;
 for(const match of bodyOf(tex).matchAll(token)){
  if(match[1]!==undefined){
   for(const note of match[1].trim().split(/\s+/).filter(Boolean)){
    const [fret,string]=note.replace(/\{[^}]*\}/g,"").split(".");
    found.push({fret:Number(fret),string:Number(string)});
   }
  }else found.push({fret:Number(match[2]),string:Number(match[3])});
 }
 return found;
};

test("every lesson exercise has a tab, and they line up with the prose",()=>{
 COURSE_LESSONS.forEach((lesson,index)=>{
  const tabs=courseTabsFor(index);
  assert.equal(tabs.length,lesson.exercises.length,
   `lesson ${index+1} "${lesson.title}" has ${tabs.length} tabs for ${lesson.exercises.length} exercises`);
 });
});

test("every bar holds exactly the beats its time signature promises",()=>{
 for(const exercise of everyExercise){
  const [count,unit]=exercise.ts??[4,4];
  const expected=count*(4/unit);
  exercise.bars.forEach((bar,index)=>{
   const total=bar.reduce((sum,event)=>sum+beats(event),0);
   assert.ok(Math.abs(total-expected)<1e-9,
    `${exercise.id} "${exercise.title}" bar ${index+1}: ${total} beats, expected ${expected}`);
  });
 }
});

test("every exercise renders to alphaTex and stays on the neck",()=>{
 for(const exercise of everyExercise){
  const tex=toAlphaTex(exercise);
  assert.match(tex,/^\\title /,`${exercise.id} must open with its title`);
  assert.match(tex,/\\tuning G2 D2 A1 E1/,`${exercise.id} must be tuned for bass`);
  // Frets only, and only ones a hand can reach.
  const notes=notesIn(tex);
  assert.ok(notes.length>0,`${exercise.id} rendered no notes at all`);
  for(const {fret,string} of notes){
   assert.ok(fret<=20,`${exercise.id} asks for fret ${fret}`);
   assert.ok(string>=1&&string<=4,`${exercise.id} asks for string ${string}`);
  }
 }
});

test("a pitch below the open E is refused rather than silently moved",()=>{
 assert.throws(()=>fingerings([BASS_TUNING[0]-1]),/outside the range/);
 assert.doesNotThrow(()=>fingerings([BASS_TUNING[0]]));
});

test("fingerings keep the hand still instead of picking each note alone",()=>{
 // A minor from the open A: a bassist plays this in first position.
 const places=fingerings([33,36,40,43]);
 assert.deepEqual(places,[
  {string:3,fret:0},
  {string:3,fret:3},
  {string:2,fret:2},
  {string:1,fret:0},
 ]);
});

test("the tuning is declared highest string first, or every note sounds wrong",()=>{
 // alphaTex numbers strings by their line from the top down, and reads each
 // one's pitch from the \tuning list in the order written. Declaring it
 // low-to-high renders tab that looks correct and plays a string out: the top
 // line is drawn as the G string and sounds as the E. Nothing about the
 // rendered tab reveals this, so the ordering is pinned here instead.
 const tex=toAlphaTex({
  id:"t",title:"Tuning",brief:"",pass:"",root:28,rootName:"E",tempo:60,
  // The open low E, then fifteen semitones above it, which is the open G.
  bars:[[n(0,2),n(15,2)]],
 });
 const tuning=/\\tuning (.+)/.exec(tex)[1].trim().split(/\s+/);
 assert.deepEqual(tuning,["G2","D2","A1","E1"],"highest string first");

 // String 1 is the top line and the first entry, so its open pitch is the
 // highest — read the declaration back and check it descends.
 const open=tuning.map(name=>{
  const step={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[name[0]];
  return step+12*(Number(name.slice(-1))+1);
 });
 assert.deepEqual(open,[...open].sort((a,b)=>b-a),"string 1 must be the highest");
 assert.deepEqual([...open].reverse(),BASS_TUNING,"the same four pitches, written the other way");
});

test("every note sounds the pitch it was written as",()=>{
 // The end-to-end invariant: a degree above the root comes out of the player as
 // that exact pitch. This is what a mis-declared tuning breaks — the tab still
 // looks right, so only the arithmetic catches it.
 const openForString=string=>BASS_TUNING[BASS_TUNING.length-string];
 for(const exercise of everyExercise){
  const intended=[];
  for(const bar of exercise.bars)for(const event of bar){
   if(event.t==="n")intended.push(exercise.root+event.deg);
   else if(event.t==="c")for(const deg of event.degs)intended.push(exercise.root+deg);
   else if(event.t==="f")intended.push(openForString(event.string)+event.fret);
  }
  const played=notesIn(toAlphaTex(exercise)).map(note=>openForString(note.string)+note.fret);
  assert.deepEqual(played,intended,`${exercise.id} "${exercise.title}" sounds different pitches than it was written with`);
 }
});

test("string 4 is the low E and string 1 is the G",()=>{
 assert.equal(BASS_TUNING.length,4);
 assert.deepEqual(BASS_TUNING,[28,33,38,43]);
 assert.deepEqual(fingerings([28]),[{string:4,fret:0}]);
 assert.deepEqual(fingerings([43]),[{string:1,fret:0}]);
});

test("plain-text tab is read as pitch and phrasing",()=>{
 const {bars,ts}=parseAsciiTab([
  "G|--------------------|",
  "D|--------------------|",
  "A|--------------------|",
  "E|--3-5-7--4-6-8------|",
 ].join("\n"));
 // The wider gap between groups is where the bar line belongs.
 assert.equal(bars.length,2);
 assert.deepEqual(ts,[3,4]);
 assert.deepEqual(bars[0].map(event=>event.fret),[3,5,7]);
 assert.deepEqual(bars[1].map(event=>event.fret),[4,6,8]);
 assert.ok(bars.every(bar=>bar.every(event=>event.string===4)),"the E lane stays on string 4");
});

test("a two-digit fret is one note, not two",()=>{
 const {bars}=parseAsciiTab("E|--10-12--|");
 const notes=bars.flat().filter(event=>event.t==="f");
 assert.deepEqual(notes.map(event=>event.fret),[10,12]);
 // A short figure is still padded out to a whole bar rather than left a stub.
 assert.equal(bars[0].length,8);
});

test("rests and note shading survive the trip to alphaTex",()=>{
 const tex=toAlphaTex({
  id:"t",title:"Shading",brief:"",pass:"",root:33,rootName:"A",tempo:80,
  bars:[[n(0,4,{accent:true}),n(0,8,{ghost:true}),n(0,8),r(2)]],
 });
 // alphaTex spells these "ac" and "x" — not "accent" and "ghost".
 assert.match(tex,/\{ac\}/);
 assert.match(tex,/\{x\}/);
 assert.match(tex,/r\.2/);
});

test("harmonics, slides and double stops render",()=>{
 const tex=toAlphaTex({
  id:"t",title:"Technique",brief:"",pass:"",root:29,rootName:"F",tempo:60,
  bars:[[f(4,12,4,{harmonic:"natural"}),n(0,4,{slide:"inFromBelow"}),n(3,4,{vibrato:true}),c([0,16],4)]],
 });
 assert.match(tex,/\{nh\}/,"natural harmonic");
 assert.match(tex,/\{sib\}/,"slide in from below");
 assert.match(tex,/\{v\}/,"vibrato");
 assert.match(tex,/\(\d+\.\d \d+\.\d\)\.4/,"a double stop is bracketed and shares one duration");
});

test("note effects go before the duration and beat effects after",()=>{
 // The grammar is fret.string{how it is played}.duration{what the beat does}.
 // Putting a note effect after the duration does not degrade gracefully — the
 // whole score fails to parse and the reader shows nothing at all.
 const NOTE_ONLY=/^(nh|ah|th|ph|sh|fh|tr|v|vw|sl|ss|sib|sia|sou|sod|h|g|ac|hac|ten|pm|st|lr|x)$/;
 const BEAT_ONLY=/^(tu|d|dd)$/;
 for(const exercise of everyExercise){
  for(const line of bodyOf(toAlphaTex(exercise)).split("\n")){
   for(const beat of line.trim().split(/\s+(?![^{]*\})/).filter(Boolean)){
    if(beat==="|")continue;
    // Split at the duration: everything before it belongs to the note.
    const durationAt=beat.lastIndexOf(".");
    for(const match of beat.matchAll(/\{([^}]*)\}/g)){
     const keyword=match[1].trim().split(/\s+/)[0];
     const afterDuration=match.index>durationAt;
     if(NOTE_ONLY.test(keyword)){
      assert.ok(!afterDuration,`${exercise.id}: "${keyword}" is a note effect but sits after the duration in ${beat}`);
     }else if(BEAT_ONLY.test(keyword)){
      assert.ok(afterDuration,`${exercise.id}: "${keyword}" is a beat effect but sits before the duration in ${beat}`);
     }
    }
   }
  }
 }
});

test("a chord puts every note on its own string",()=>{
 const tex=toAlphaTex({
  id:"t",title:"Chord",brief:"",pass:"",root:29,rootName:"F",tempo:60,
  bars:[[c([0,16],2),c([0,7,16],2)]],
 });
 for(const chord of tex.matchAll(/\(([^)]*)\)/g)){
  const strings=chord[1].trim().split(/\s+/).map(note=>note.split(".")[1]);
  assert.equal(new Set(strings).size,strings.length,`two notes share a string in (${chord[1]})`);
 }
});

test("the whole written library is accounted for",()=>{
 const prose=COURSE_LESSONS.reduce((sum,lesson)=>sum+lesson.exercises.length,0);
 assert.equal(Object.keys(COURSE_TABS).length,prose);
 assert.ok(BEAST_TABS.length>=21,"every Beast passage and variant is playable");
 assert.equal(Object.keys(SLAP_TABS).length,8);
 // Only the equal-tempered maqamat can honestly be written as frets.
 assert.deepEqual(Object.keys(MAQAM_TABS).sort(),["ajam","hijaz","kurd","nahawand"]);
 // Every masterclass module carries exercises, and every id is unique.
 // The book has an eighth chapter and a third section of its first, both pure
 // prose with nothing to drill — dropped rather than kept as a tab with
 // nothing in it, so every chapter and section left here earns its place.
 assert.equal(JACO_CHAPTERS.length,7);
 assert.deepEqual(JACO_CHAPTERS.map(chapter=>chapter.n),[1,2,3,4,5,6,7]);
 assert.ok(JACO_SECTIONS.length>=30,`only ${JACO_SECTIONS.length} sections`);
 assert.ok(JACO_EXERCISES.length>=50,`only ${JACO_EXERCISES.length} masterclass exercises`);
 assert.equal(new Set(everyExercise.map(x=>x.id)).size,everyExercise.length,"duplicate exercise id");
});

test("only effect keywords alphaTex actually knows are emitted",()=>{
 // A wrong keyword is not rejected by anything on our side — the score simply
 // fails to parse at render time and the reader shows an error, which is how
 // "accent" (the real keyword is "ac") shipped unnoticed. This is the parser's
 // own vocabulary, read out of its effect tables.
 const NOTE_EFFECTS=new Set(["nh","ah","th","ph","sh","fh","tr","v","vw","sl","ss","sib","sia",
  "sou","sod","psd","psu","h","lht","g","ac","hac","ten","pm","st","lr","x","-","t","lf","rf","acc","turn"]);
 const BEAT_EFFECTS=new Set(["tu","f","fo","vs","v","vw","s","p","tt","txt","lyrics","d","dd",
  "color","instrument","bank","volume","balance","mute","solo","multibarrest"]);

 const seen=new Set();
 for(const exercise of everyExercise){
  for(const block of bodyOf(toAlphaTex(exercise)).matchAll(/\{([^}]*)\}/g)){
   // "tu 3" and friends carry an argument; only the keyword is checked.
   for(const token of block[1].trim().split(/\s+/).filter(Boolean)){
    if(/^\d+$/.test(token))continue;
    seen.add(token);
    assert.ok(NOTE_EFFECTS.has(token)||BEAT_EFFECTS.has(token),
     `${exercise.id} emits "${token}", which alphaTex does not accept`);
   }
  }
 }
 // Guard the guard: if nothing is shaded any more, this test proves nothing.
 assert.ok(seen.size>0,"no note effects were emitted at all");
});

test("an exercise moved to another key keeps its shape",()=>{
 // Transposition is a change of one number because exercises are written as
 // degrees and fretted at the last moment. What must not change is the music:
 // the same intervals, in the same order, at the new pitch.
 for(const exercise of everyExercise.slice(0,40)){
  const keys=playableKeys(exercise);
  if(keys.length===0)continue;
  const before=degreesUsed(exercise);
  for(const key of keys){
   const moved=transpose(exercise,key);
   assert.ok(moved,`${exercise.id}: reported ${keyName(key)} playable but would not transpose`);
   assert.deepEqual(degreesUsed(moved),before,
    `${exercise.id} in ${keyName(key)}: the degrees changed`);
   assert.equal(((moved.root%12)+12)%12,key,`${exercise.id}: landed in the wrong key`);
   assert.doesNotThrow(()=>toAlphaTex(moved),`${exercise.id} in ${keyName(key)} does not fit the neck`);
  }
 }
});

test("material written as frets is not offered a key it cannot change",()=>{
 // The Beast passages and the harmonics studies are written at fixed places on
 // the neck. Moving the root would change nothing anyone could hear, so no
 // keys are offered rather than twelve identical ones.
 const fretted=everyExercise.filter(x=>degreesUsed(x).length===0);
 assert.ok(fretted.length>20,`expected the fretted material, found ${fretted.length}`);
 for(const exercise of fretted){
  assert.deepEqual(playableKeys(exercise),[],`${exercise.id} offered a key change it cannot make`);
 }
});

test("a label follows its exercise into the new key",()=>{
 // Chord symbols and key names inside a label have to move with the music, or
 // the tab plays in F under a heading that still says A minor.
 assert.equal(transposeLabel("Am7",8),"Fm7");
 assert.equal(transposeLabel("Dm7 → G7 → Cmaj7",3),"Fm7 → B♭7 → E♭maj7");
 assert.equal(transposeLabel("D Dorian drone",2),"E Dorian drone");
 assert.equal(transposeLabel("B♭ major",1),"B major","an accidental must not be left behind");
 // Words that merely start with a note letter are not note names.
 assert.equal(transposeLabel("As written",5),"As written");
 assert.equal(transposeLabel("Cycle of fifths",5),"Cycle of fifths");
 assert.equal(transposeLabel("Fast swing",3),"Fast swing");
 assert.equal(transposeLabel("Am7",0),"Am7","no move, no change");
});

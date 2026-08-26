import assert from "node:assert/strict";
import test from "node:test";
import {DEGREE_NAMES,MODES,PITCH_NAMES,SCALE_LIBRARY} from "../src/harmony-fretboard-data.ts";
import {THEORY_DICTIONARIES,THEORY_DOMAINS} from "../src/bass-theory-data.ts";
import {COURSE_LESSONS} from "../src/course-data.ts";
import {JACO_EXERCISES} from "../src/tab/jaco-masterclass.ts";

/**
 * Theory checks.
 *
 * The rest of the suite asks whether a tab is well-formed — that its bars add
 * up, that its frets exist, that the pitch you wrote is the pitch that sounds.
 * None of it asks whether the music is *right*, which is how a G minor sat
 * inside a C major exercise for several passes. These tests read the written
 * theory and check it against itself.
 */

/**
 * Degree shorthand to semitones above the root.
 *
 * The site writes its formulas the way a chart does — a flat seventh is the
 * seventh lowered a semitone, ten from the root, B-flat in C — and several
 * degrees have two names depending on whether they are read as a scale step or
 * a chord extension. Both spellings resolve to the same distance.
 */
const STEP={
 "1":0,
 "♭2":1,"♭9":1,
 "2":2,"9":2,
 "♯2":3,"♯9":3,"♭3":3,
 "3":4,
 "4":5,"11":5,
 "♯4":6,"♯11":6,"♭5":6,
 "5":7,
 "♯5":8,"♭6":8,"♭13":8,
 "6":9,"13":9,"𝄫7":9,
 "♭7":10,
 "7":11,
 "8":12,
};

const parseFormula=formula=>formula.trim().split(/\s+/).map(token=>{
 const value=STEP[token];
 assert.notEqual(value,undefined,`unknown degree "${token}" in "${formula}"`);
 return value;
});

test("every scale's formula produces exactly the intervals it declares",()=>{
 for(const scale of SCALE_LIBRARY){
  assert.deepEqual(parseFormula(scale.formula),scale.intervals,
   `${scale.id}: "${scale.formula}" does not spell [${scale.intervals}]`);
 }
});

test("every scale is ordered, has no repeats, and owns its character tones",()=>{
 for(const scale of SCALE_LIBRARY){
  assert.deepEqual(scale.intervals,[...scale.intervals].sort((a,b)=>a-b),`${scale.id}: intervals out of order`);
  assert.equal(new Set(scale.intervals).size,scale.intervals.length,`${scale.id}: duplicate interval`);
  assert.ok(scale.character.length>0,`${scale.id}: no character tone`);
  for(const tone of scale.character){
   assert.ok(scale.intervals.includes(tone),`${scale.id}: character ${tone} is not in [${scale.intervals}]`);
  }
 }
});

test("the seven modes are the first seven scales, and stay that way",()=>{
 // MODES is derived from SCALE_LIBRARY so the two cannot disagree; this pins
 // the order and the identifying tone, which a reorder of the library would
 // silently change.
 assert.deepEqual(MODES.map(mode=>mode.n),
  ["Ionian","Dorian","Phrygian","Lydian","Mixolydian","Aeolian","Locrian"]);
 assert.deepEqual(MODES.map(mode=>mode.s[mode.c]),[11,9,1,6,10,8,6],
  "the tone that identifies each mode against its neighbour");
 for(const mode of MODES)assert.ok(mode.c>=0,`${mode.n}: character tone not found in its own scale`);
});

/** True when a formula is a plain degree list rather than prose or alternatives. */
const isDegreeList=formula=>formula.trim().split(/\s+/).every(token=>token in STEP);

test("interval rows agree with the distance they name",()=>{
 // These rows are written as prose ("7 SEMITONES · 5") and the number is also
 // stored separately, because the reference renders a worked example from it.
 // Two places to state the same fact is two places to get it wrong: the octave
 // row said zero, and rendered correctly only because a pitch class repeats.
 let checked=0;
 for(const dictionary of THEORY_DICTIONARIES)for(const row of dictionary.rows){
  if(row.semitones===undefined)continue;
  const stated=/^(\d+)\s+SEMITONES?/i.exec(row.formula);
  assert.ok(stated,`${row.name.en}: "${row.formula}" does not open with a semitone count`);
  assert.equal(row.semitones,Number(stated[1]),
   `${row.name.en}: formula says ${stated[1]} semitones, the field says ${row.semitones}`);
  assert.ok(row.semitones>=0&&row.semitones<=12,`${row.name.en}: ${row.semitones} is outside an octave`);
  checked++;
 }
 assert.equal(checked,13,`expected the thirteen intervals of the octave, found ${checked}`);
});

test("degree formulas everywhere are written in degrees the system knows",()=>{
 // Not ordering: a chord formula names extensions above the octave ("1 3 5 7 9"
 // puts the 9th above the 7th), and degree shorthand is deliberately
 // octave-agnostic, so the tokens do not ascend numerically. What must hold is
 // that every token is a degree the site can resolve, and that none repeats.
 let checked=0;
 for(const dictionary of THEORY_DICTIONARIES)for(const row of dictionary.rows){
  if(!isDegreeList(row.formula))continue;   // alternatives and prose are not measurable
  const tokens=row.formula.trim().split(/\s+/);
  parseFormula(row.formula);
  assert.equal(new Set(tokens).size,tokens.length,
   `${dictionary.id} / ${row.name.en}: "${row.formula}" names a degree twice`);
  checked++;
 }
 assert.ok(checked>=30,`only ${checked} degree formulas were measurable`);
});

test("every concept formula is written in degrees the system knows",()=>{
 for(const domain of THEORY_DOMAINS)for(const concept of domain.concepts??[]){
  if(!/^[0-9♭♯𝄫 ]+$/.test(concept.formula))continue;   // prose formulas are not degree lists
  parseFormula(concept.formula);
 }
});

test("degree and pitch name tables cover the octave once",()=>{
 assert.equal(PITCH_NAMES.length,12);
 assert.equal(DEGREE_NAMES.length,12);
 assert.equal(new Set(PITCH_NAMES).size,12,"a pitch name is repeated");
});

test("lesson degrees are inside the octave and own their character tones",()=>{
 COURSE_LESSONS.forEach((lesson,index)=>{
  // The worked-example table prints one row per degree, so a repeat is a
  // duplicated row rather than a rhythm.
  assert.equal(new Set(lesson.intervals).size,lesson.intervals.length,
   `lesson ${index+1} "${lesson.title}": [${lesson.intervals}] repeats a degree`);
  for(const degree of [...lesson.intervals,...lesson.character]){
   assert.ok(degree>=0&&degree<=11,
    `lesson ${index+1} "${lesson.title}": degree ${degree} is outside 0-11`);
  }
  for(const tone of lesson.character){
   assert.ok(lesson.intervals.includes(tone),
    `lesson ${index+1} "${lesson.title}": character ${tone} is not among its own degrees`);
  }
 });
});

/* ---- the masterclass harmony, identified by shape rather than by label ---- */

const NOTE=["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
const degreesOf=id=>{
 const exercise=JACO_EXERCISES.find(x=>x.id===id);
 assert.ok(exercise,`no exercise ${id}`);
 return exercise.bars.flat().filter(event=>event.t==="n").map(event=>event.deg);
};

/** What chord is this, from its pitches alone? */
function identify(three){
 const pitches=[...new Set(three.map(d=>((d%12)+12)%12))];
 if(pitches.length!==3)return null;
 for(const root of pitches){
  const shape=pitches.map(p=>(((p-root)%12)+12)%12).sort((a,b)=>a-b).join();
  if(shape==="0,4,7")return {root,quality:"major"};
  if(shape==="0,3,7")return {root,quality:"minor"};
  if(shape==="0,3,6")return {root,quality:"diminished"};
  if(shape==="0,4,8")return {root,quality:"augmented"};
 }
 return null;
}

test("the four triad drills really are the four triad types",()=>{
 const want=[["jaco-tri-1","major"],["jaco-tri-2","minor"],["jaco-tri-3","augmented"],["jaco-tri-4","diminished"]];
 for(const [id,quality] of want){
  const found=identify(degreesOf(id).slice(0,3));
  assert.ok(found,`${id}: not a recognisable triad`);
  assert.equal(found.quality,quality,`${id} is ${found.quality}`);
 }
});

test("the diatonic triads of C are major, minor and diminished in the right order",()=>{
 // This is the check that caught a G minor written where the V of C belongs.
 const expected=["major","minor","minor","major","major","minor","diminished"];
 const degrees=degreesOf("jaco-dia-1");
 expected.forEach((quality,i)=>{
  const found=identify(degrees.slice(i*6,i*6+3));
  assert.ok(found,`degree ${i+1}: not a recognisable triad`);
  assert.equal(found.quality,quality,`degree ${i+1} of C major is ${found.quality}, not ${quality}`);
 });
});

test("every tritone pair is the same quality, six semitones away",()=>{
 for(const id of ["jaco-tt-1","jaco-tt-2"]){
  const degrees=degreesOf(id);
  assert.equal(degrees.length%6,0,`${id}: not built from three-note groups`);
  assert.equal(degrees.length/6,7,`${id}: a major key has seven triads`);
  for(let i=0;i<degrees.length;i+=6){
   const up=identify(degrees.slice(i,i+3)),down=identify(degrees.slice(i+3,i+6));
   const pair=`${id} pair ${i/6+1}`;
   assert.ok(up&&down,`${pair}: not a recognisable triad`);
   assert.equal(up.quality,down.quality,
    `${pair}: ${NOTE[up.root]} ${up.quality} answered by ${NOTE[down.root]} ${down.quality}`);
   assert.equal((((down.root-up.root)%12)+12)%12,6,
    `${pair}: ${NOTE[up.root]} to ${NOTE[down.root]} is not a tritone`);
  }
 }
});

test("the seven diatonic sevenths of C are spelled correctly",()=>{
 const expected=[[0,4,7,11],[2,5,9,12],[4,7,11,14],[5,9,12,16],[7,11,14,17],[9,12,16,19],[11,14,17,21]];
 const degrees=degreesOf("jaco-7-1");
 expected.forEach((chord,i)=>{
  assert.deepEqual(degrees.slice(i*8,i*8+4),chord,`seventh chord on degree ${i+1}`);
 });
});

test("only real harmonic nodes are written as harmonics",()=>{
 // A fret that is not a node does not fail loudly — the renderer quietly sounds
 // an octave instead, which is how a chord that was supposed to be a dominant
 // ninth turned out to be a major triad.
 const NODES=new Set([2,3,4,5,7,9,12,16,17,19,24]);
 for(const exercise of JACO_EXERCISES){
  for(const event of exercise.bars.flat()){
   if(event.t!=="f"||event.harmonic!=="natural")continue;
   assert.ok(NODES.has(event.fret),
    `${exercise.id}: fret ${event.fret} is not a natural-harmonic node`);
  }
 }
});

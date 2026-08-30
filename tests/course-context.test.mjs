import assert from "node:assert/strict";
import test from "node:test";
import {lessonContext} from "../src/course-context.ts";
import {COURSE_LESSONS} from "../src/course-data.ts";
import {LESSON_DETAILS} from "../src/course-details.ts";
import {MODES,PITCH_NAMES} from "../src/harmony-fretboard-data.ts";

/**
 * The ground each lesson is taught on.
 *
 * The workspace panes used to open on whatever key the player last left them
 * in, so the Lydian lesson could show its fretboard in Dorian. These say what
 * each lesson's own material implies, which is what those panes now follow.
 */

const name=index=>{
 const {root,mode}=lessonContext(index);
 return `${PITCH_NAMES[root]} ${MODES[mode].n}`;
};

test("each modal lesson opens in the mode it is about",()=>{
 // Unit 3 teaches one mode per lesson. Nothing in the workspace should have
 // to be told twice which one.
 const expected={
  8:"C Ionian",9:"D Dorian",10:"E Phrygian",11:"C Lydian",
  12:"G Mixolydian",13:"A Aeolian",14:"B Locrian",
 };
 for(const [index,ground] of Object.entries(expected)){
  assert.equal(name(+index),ground,
   `lesson ${index} is "${COURSE_LESSONS[+index].title}"`);
 }
});

test("a lesson that is not about a mode is not given one from two notes",()=>{
 /*
  * "Rhythmic Weight, Duration & Articulation" lists exactly two intervals, the
  * root and a ♭2. Reading a mode out of that made it a Phrygian lesson, which
  * it is not about at all. Its own exercises are played over Am7.
  */
 assert.equal(name(3),"A Dorian");

 // "Mode Families & the Brightness Spectrum" compares all seven. Picking the
 // darkest as its ground is a worse answer than the neutral one.
 assert.equal(name(6),"C Ionian");

 // Every interval in the octave is a chromatic lesson, measured against major.
 assert.equal(COURSE_LESSONS[1].intervals.length,12);
 assert.equal(name(1),"A Ionian");
});

test("a chord on some other root does not decide the mode",()=>{
 /*
  * Lesson 23's exercises say "G7 vamp, then G7→C" and "ii–V–I in C", and the
  * lesson's own root is D. Reading that G7 as its quality made a ii chord
  * Mixolydian; it is the ii of C, which is D Dorian.
  */
 assert.equal(name(22),"D Dorian");
 assert.equal(name(23),"D Dorian");
});

test("every lesson gets a ground, and the chord matches the mode it names",()=>{
 for(let index=0;index<COURSE_LESSONS.length;index++){
  const {root,mode,chord}=lessonContext(index);
  assert.ok(root>=0&&root<12,`lesson ${index} needs a root in the octave`);
  assert.ok(mode>=0&&mode<MODES.length,`lesson ${index} needs a real mode`);

  // The chord has to describe the mode, or the pane naming it would mislead.
  const tones=MODES[mode].s.map(iv=>((iv%12)+12)%12);
  const minorThird=tones.includes(3),flatFive=tones.includes(6)&&!tones.includes(7);
  if(flatFive)assert.match(chord,/m7b5$/,`${name(index)} is half-diminished`);
  else if(minorThird)assert.match(chord,/m7$/,`${name(index)} is minor`);
  else assert.match(chord,/(maj7|(?<!m)7)$/,`${name(index)} is major or dominant`);
  assert.ok(chord.startsWith(PITCH_NAMES[root]),`the chord should sit on the root`);
 }
});

test("an index outside the course still returns a usable ground",()=>{
 // The route carries a lesson number from the URL, which can be anything.
 assert.deepEqual(lessonContext(-5),lessonContext(0));
 assert.deepEqual(lessonContext(999),lessonContext(COURSE_LESSONS.length-1));
});

const significant=(text)=>new Set(
 (text.toLowerCase().match(/[a-z♯♭0-9]+/g)??[]).filter(word=>word.length>3)
);

test("a lesson's prerequisites come from before it, not from itself",()=>{
 /*
  * The opening section says "check the foundation" and used to show the
  * lesson's own outcomes: the Lydian lesson asked whether you could feature ♯4
  * over a major third before it had explained either. A prerequisite that
  * restates the outcome is the same mistake in a new field.
  */
 assert.equal(LESSON_DETAILS.length,COURSE_LESSONS.length);
 for(let i=0;i<LESSON_DETAILS.length;i++){
  const {prerequisites,selfCheck}=LESSON_DETAILS[i];
  assert.equal(prerequisites.length,3,`lesson ${i} needs three prerequisites`);
  for(const item of prerequisites){
   assert.ok(item.length>20,`"${item}" is too short to be a real check`);
   assert.ok(!selfCheck.includes(item),
    `lesson ${i} lists "${item}" as both a prerequisite and an outcome`);

   /*
    * An exact match is the easy case. "Name the single degree that separates
    * Aeolian from Dorian" against "Can you compare Aeolian and Dorian by one
    * degree?" is the same question asked twice, and matches nothing exactly.
    */
   for(const outcome of selfCheck){
    const shared=[...significant(item)].filter(word=>significant(outcome).has(word));
    assert.ok(shared.length<3,
     `lesson ${i} asks the same thing before and after:
`+
     `  before: ${item}
  after:  ${outcome}
  shared: ${shared.join(", ")}`);
   }
  }
 }

 // The first lesson cannot stand on an earlier one, so it stands on the
 // instrument instead.
 assert.match(LESSON_DETAILS[0].prerequisites.join(" "),/in tune|pulse|neck/);

 // And a later lesson's prerequisites should name material the course has
 // actually covered by then. Lydian follows the mode lessons, so its
 // foundation is about thirds and drones, not about ♯4.
 const lydian=LESSON_DETAILS[11].prerequisites.join(" ");
 assert.match(lydian,/major third|major seventh/);
});

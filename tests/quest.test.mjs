import assert from "node:assert/strict";
import test from "node:test";
import {MISSES_ALLOWED,questFor,startWalk,step,targetPitchOf} from "../src/quest-data.ts";
import {COURSE_LESSONS} from "../src/course-data.ts";
import {lessonContext} from "../src/course-context.ts";
import {MODES} from "../src/harmony-fretboard-data.ts";

/**
 * The walk, checked without a bass in anybody's hands.
 *
 * The rule lives outside the component precisely so it can be tested: whether a
 * wrong note costs the right amount of ground is not something to find out by
 * playing a lesson twenty times.
 */

const mod=value=>((value%12)+12)%12;
/** Play the note the path is asking for. */
const right=(quest,walk)=>step(quest,walk,targetPitchOf(quest,walk));
/** Play something else. */
const wrong=(quest,walk)=>step(quest,walk,mod(targetPitchOf(quest,walk)+1));

test("every lesson produces a walk that leaves home and returns to it",()=>{
 for(let index=0;index<COURSE_LESSONS.length;index++){
  const quest=questFor(index);
  const degrees=quest.steps.map(item=>item.degree);

  assert.ok(degrees.length>=6,`lesson ${index} is a walk of ${degrees.length} steps`);
  assert.equal(degrees[0],0,`lesson ${index} does not start at home`);
  assert.equal(degrees.at(-1),0,`lesson ${index} does not end at home`);
  assert.ok(Math.max(...degrees)>0,`lesson ${index} never leaves home`);

  /*
   * Two identical targets in a row would let one note count twice — and the
   * microphone reports a held note once, so the path would also stall.
   */
  for(let i=1;i<degrees.length;i++)
   assert.notEqual(degrees[i],degrees[i-1],
    `lesson ${index} asks for ${degrees[i]} twice running`);

  // Every degree has to belong to the ground the lesson is taught on, or the
  // walk would be asking for notes the lesson never mentions.
  const {mode}=lessonContext(index);
  const collection=MODES[mode].s.map(mod);
  const own=[...new Set(COURSE_LESSONS[index].intervals.map(mod))];
  for(const degree of degrees)
   assert.ok(collection.includes(mod(degree))||own.includes(mod(degree)),
    `lesson ${index} asks for ${degree}, which is in neither its own list nor its mode`);
 }
});

test("there is always somewhere to fall back to that is not the beginning",()=>{
 for(let index=0;index<COURSE_LESSONS.length;index++){
  const quest=questFor(index);
  const marks=quest.steps.filter(item=>item.checkpoint).length;
  assert.ok(marks>=2,`lesson ${index} has ${marks} checkpoint(s)`);
  assert.ok(quest.steps[0].checkpoint,`lesson ${index} does not treat home as one`);

  // and one of them is past halfway, or the back half of the walk has nothing
  const last=quest.steps.map((item,at)=>item.checkpoint?at:-1).filter(at=>at>=0).at(-1);
  assert.ok(last>0,`lesson ${index} only marks the start`);
 }
});

test("the right note moves on and the wrong note costs ground",()=>{
 const quest=questFor(11);
 let walk=startWalk();

 walk=right(quest,walk);
 assert.equal(walk.hit,true);
 assert.equal(walk.at,1);
 assert.equal(walk.misses,0);

 walk=right(quest,walk);
 assert.equal(walk.at,2);

 const before=walk.at;
 walk=wrong(quest,walk);
 assert.equal(walk.hit,false);
 assert.equal(walk.misses,1);
 assert.ok(walk.at<before,"a wrong note has to cost something");
 assert.ok(quest.steps[walk.at].checkpoint,"and it lands on a checkpoint");
});

test("a wrong note falls back to the nearest checkpoint behind, not to the start",()=>{
 /*
  * The whole design decision. Sending the player home from step nine of ten
  * makes the back half of every walk unreachable in practice.
  */
 const quest=questFor(9);
 const marks=quest.steps.map((item,at)=>item.checkpoint?at:-1).filter(at=>at>0);
 assert.ok(marks.length,"this lesson needs a checkpoint past the start for the test to mean anything");

 // Walk to just past the last checkpoint.
 const deep=marks.at(-1)+1;
 let walk=startWalk();
 while(walk.at<deep)walk=right(quest,walk);
 assert.equal(walk.at,deep);

 walk=wrong(quest,walk);
 assert.equal(walk.at,marks.at(-1),"should fall back one checkpoint, not to zero");
 assert.notEqual(walk.at,0);
});

test("the walk is judged by pitch class, not by octave",()=>{
 const quest=questFor(9);
 const walk=startWalk();
 const wanted=targetPitchOf(quest,walk);
 for(const octave of [-24,-12,0,12,24,36])
  assert.equal(step(quest,walk,wanted+octave).hit,true,
   `${wanted}+${octave} should count as the same note`);
});

test("misses accumulate, and the furthest point survives being sent back",()=>{
 const quest=questFor(9);
 let walk=startWalk();
 walk=right(quest,walk);
 walk=right(quest,walk);
 walk=right(quest,walk);
 const reached=walk.best;
 assert.equal(reached,3);

 walk=wrong(quest,walk);
 assert.equal(walk.best,reached,"being sent back does not erase how far you got");
 assert.equal(walk.misses,1);

 walk=wrong(quest,walk);
 walk=wrong(quest,walk);
 assert.equal(walk.misses,MISSES_ALLOWED,"three wrong turns is the whole allowance");
});

test("arriving home ends the walk, and nothing after it counts",()=>{
 const quest=questFor(11);
 let walk=startWalk();
 for(let i=0;i<quest.steps.length;i++)walk=right(quest,walk);

 assert.equal(walk.done,true);
 assert.equal(walk.misses,0);
 assert.equal(walk.best,quest.steps.length);

 // A finished walk ignores further notes rather than restarting or advancing.
 const after=step(quest,walk,7);
 assert.equal(after.done,true);
 assert.equal(after.at,walk.at);
 assert.equal(after.misses,0);
});

test("a walk can be completed with no wrong turns, from any lesson",()=>{
 // If some lesson's path could not be walked, the game would be unfinishable
 // there and nothing else in these tests would notice.
 for(let index=0;index<COURSE_LESSONS.length;index++){
  const quest=questFor(index);
  let walk=startWalk();
  for(let guard=0;guard<64&&!walk.done;guard++)walk=right(quest,walk);
  assert.equal(walk.done,true,`lesson ${index} cannot be finished`);
  assert.equal(walk.misses,0);
 }
});

test("each place says what its degree actually does",()=>{
 const quest=questFor(11); // Lydian: the tritone is its landmark
 const bridge=quest.steps.find(item=>item.degree===6);
 assert.ok(bridge,"the Lydian walk should pass through its ♯4");
 // Two tellings of this degree exist (quest-data.ts's PLACES), chosen by
 // lesson index, so this checks the concept rather than one exact phrasing.
 assert.match(bridge.beat,/half/i);
 assert.match(bridge.beat,/octave/i);
 assert.match(bridge.place,/far point/,"and mark it as what the lesson is about");

 for(const item of quest.steps){
  assert.ok(item.place.length>3,"every step needs somewhere to be");
  assert.ok(item.beat.length>40,`"${item.place}" is named but not explained`);
 }
});

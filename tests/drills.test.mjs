import assert from "node:assert/strict";
import test from "node:test";
import {DRILLS,advance,drillById,onBeat} from "../src/game/drills.ts";

/**
 * The rules, checked without a bass or a browser.
 *
 * Seven of these eight were a card that set some state and opened another
 * screen. Nothing kept score, nothing ended and nothing checked what was
 * played, so there was nothing to test — which is most of why they stayed that
 * way.
 */

const mod=value=>((value%12)+12)%12;
/** A deterministic stand-in for Math.random, so a failure can be repeated. */
const sequence=values=>{let i=0;return()=>values[i++%values.length]};

test("there are eight drills and each one says what it is",()=>{
 assert.equal(DRILLS.length,8);
 assert.equal(new Set(DRILLS.map(d=>d.id)).size,8);
 for(const drill of DRILLS){
  assert.ok(drill.title.length>4,`${drill.id} has no title`);
  assert.ok(drill.desc.length>20,`${drill.id} does not say what it is`);
  assert.equal(typeof drill.ask,"function");
 }
});

test("every drill asks something answerable, in every key, at every level",()=>{
 for(const drill of DRILLS){
  for(let root=0;root<12;root++){
   for(let level=0;level<5;level++){
    for(let seed=0;seed<12;seed++){
     const ask=drill.ask(root,level,sequence([seed/12,(seed*7%12)/12,(seed*5%12)/12]));

     assert.ok(ask.prompt.length>4,`${drill.id} produced an empty prompt`);
     // Something has to end the round: notes to play, a set to choose from, or
     // beats to land on.
     assert.ok(ask.notes.length||ask.accept?.length||ask.beats?.length,
      `${drill.id} asks for nothing that can be answered`);

     for(const note of ask.notes)
      assert.ok(note>=0&&note<12,`${drill.id} wants pitch class ${note}`);
     for(const note of ask.accept??[])
      assert.ok(note>=0&&note<12,`${drill.id} accepts pitch class ${note}`);
     for(const beat of ask.beats??[])
      assert.ok(beat>=1&&beat<=4,`${drill.id} wants beat ${beat}`);
     if(ask.limit!==undefined)
      assert.ok(ask.limit>=1,`${drill.id} allows only ${ask.limit}s`);
    }
   }
  }
 }
});

test("a sequence has to arrive in order",()=>{
 const ask={prompt:"",notes:[5,3,4]};

 let step=advance(ask,0,5);
 assert.deepEqual([step.hit,step.progress,step.done],[true,1,false]);

 step=advance(ask,1,3);
 assert.deepEqual([step.hit,step.progress,step.done],[true,2,false]);

 step=advance(ask,2,4);
 assert.equal(step.hit,true);
 assert.equal(step.done,true,"the last note of the sequence finishes it");
});

test("a wrong note restarts the sequence rather than ending the round",()=>{
 /*
  * Losing an enclosure on the last of four notes with no way back teaches
  * nothing — the shape is the exercise, so it is offered again.
  */
 const ask={prompt:"",notes:[5,3,4]};
 const step=advance(ask,2,9);
 assert.equal(step.hit,false);
 assert.equal(step.done,false);
 assert.equal(step.progress,0,"back to the beginning of the shape");

 // Unless the wrong note happens to be the start of it, which is a real restart.
 const restart=advance({prompt:"",notes:[5,3,4]},2,5);
 assert.equal(restart.progress,1,"playing the first note again counts as that note");
});

test("octave does not matter",()=>{
 const ask={prompt:"",notes:[5]};
 for(const octave of [-24,-12,0,12,24])
  assert.equal(advance(ask,0,5+octave).hit,true,`5+${octave} should count`);
});

test("the rescue accepts any chord tone, not one right answer",()=>{
 const rescue=drillById("rescue");
 const ask=rescue.ask(0,0,sequence([.1,.9]));
 assert.ok(ask.accept?.length,"the rescue has to offer a set");
 assert.equal(ask.notes.length,0,"and not a fixed sequence");

 for(const tone of ask.accept){
  const step=advance(ask,0,tone);
  assert.equal(step.hit,true,`${tone} is a chord tone and should resolve it`);
  assert.equal(step.done,true);
 }
 // and the forced note itself is not in the chord
 const forced=ask.reference[0];
 assert.ok(!ask.accept.includes(mod(forced)),
  "the note you are asked to rescue cannot already be a resolution");
 assert.equal(advance(ask,0,forced).hit,false);
});

test("the enclosure ends on its target, having surrounded it",()=>{
 const enclosure=drillById("enclosure");
 for(let seed=0;seed<12;seed++){
  const ask=enclosure.ask(0,1,sequence([seed/12,(seed*5%12)/12,(seed*7%12)/12]));
  assert.ok(ask.notes.length>=2,"an approach and a target at least");

  const target=ask.notes.at(-1);
  // Every approach note sits within a whole tone of the target, which is what
  // makes it an approach rather than a leap. The pool now includes the
  // Chromatic Gym's wide devices (a whole tone on one side, a semitone on the
  // other), not only the all-semitone enclosures, so two semitones is the
  // real ceiling rather than one.
  for(const note of ask.notes.slice(0,-1)){
   const gap=Math.min(mod(note-target),mod(target-note));
   assert.ok(gap>=1&&gap<=2,`${note} is ${gap} semitones from the target`);
  }
  assert.equal(new Set(ask.notes).size,ask.notes.length,"no note twice");
 }
});

test("the fog takes the reference away as the level rises",()=>{
 const fog=drillById("fog");
 const at=level=>fog.ask(0,level,sequence([.3,.6]));
 assert.ok(at(0).reference,"help at the start");
 assert.ok(at(1).reference,"and once more");
 assert.equal(at(2).reference,undefined,"then it is gone");
 assert.equal(at(3).reference,undefined);
 assert.match(at(2).hint,/no reference/i);
});

test("the sniper's window tightens but never becomes impossible",()=>{
 const sniper=drillById("location");
 const limits=[0,1,2,3,4,5].map(level=>sniper.ask(0,level,sequence([.4])).limit);
 for(let i=1;i<limits.length;i++)
  assert.ok(limits[i]<=limits[i-1],"the window should not widen");
 assert.ok(Math.min(...limits)>=1.2,"and never drop under a playable window");
});

test("the boss fight offers no help and no second chances",()=>{
 const boss=drillById("boss");
 for(let seed=0;seed<20;seed++){
  const ask=boss.ask(0,2,sequence([seed/20,(seed*3%20)/20,(seed*7%20)/20]));
  assert.equal(ask.reference,undefined,"the boss sounds nothing for you");
  assert.equal(ask.limit,undefined,"and does not race you either — it just does not help");
  assert.ok(ask.notes.length||ask.accept?.length);
 }
 assert.equal(boss.session,180,"three minutes");
});

test("only the timed drills ask for beats",()=>{
 for(const drill of DRILLS){
  const ask=drill.ask(0,1,sequence([.5,.2,.8]));
  if(drill.timed)assert.ok(ask.beats?.length,`${drill.id} is timed but asks for no beat`);
  else assert.equal(ask.beats,undefined,`${drill.id} is untimed but wants a beat`);
 }
});

test("a note counts as on the beat only when it is near it",()=>{
 assert.equal(onBeat(1,1),true);
 assert.equal(onBeat(1.2,1),true,"slightly late still counts");
 assert.equal(onBeat(0.8,1),true,"slightly early too");
 assert.equal(onBeat(1.6,1),false,"half a beat out does not");
 // The bar wraps, so just before beat 1 is not two beats away from it.
 assert.equal(onBeat(3.9,1),false);
 assert.equal(onBeat(3.95,4),true);
});

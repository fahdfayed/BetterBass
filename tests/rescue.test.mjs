import assert from "node:assert/strict";
import test from "node:test";
import {circularDistance,nearestDistance,poolFor,tierFor} from "../src/game/rescue.ts";

test("circularDistance wraps around the octave rather than counting past it",()=>{
 assert.equal(circularDistance(0,1),1);
 assert.equal(circularDistance(0,11),1,"11 semitones up is 1 semitone down, the short way round");
 assert.equal(circularDistance(0,6),6,"a tritone is its own farthest point either way");
 assert.equal(circularDistance(3,3),0);
});

test("nearestDistance is the closest of several tones, not the farthest or the sum",()=>{
 assert.equal(nearestDistance(0,[1,6]),1);
 assert.equal(nearestDistance(6,[0,7]),1,"6 sits one semitone from 7, even though it's 6 from 0");
});

test("tierFor grades a rescue by how far the played note sits from the forced one",()=>{
 assert.equal(tierFor(0).tier,"Textbook");
 assert.equal(tierFor(1).tier,"Textbook","landing exactly on it or a semitone away are the same strong pull");
 assert.equal(tierFor(2).tier,"Reaches");
 assert.equal(tierFor(3).tier,"Distant");
 assert.equal(tierFor(6).tier,"Distant","a tritone rescue is still a rescue, just the boldest one");
});

test("poolFor offers every outside note at the easy level",()=>{
 const inside=[0,4,7,11]; // Amaj7-shape tones, transposed to C for round numbers
 const outside=[1,2,3,5,6,8,9,10];
 assert.deepEqual(poolFor(outside,inside,0),outside);
});

test("poolFor narrows to notes with no semitone-away resolution once past level 0",()=>{
 const inside=[0,4,7,11];
 const outside=[1,2,3,5,6,8,9,10];
 // 1 and 3 sit a semitone from 0 or 4; 5 sits a semitone from 4; 10 sits a
 // semitone from 11 -- those are the "easy" outside notes the hard pool drops.
 const hard=poolFor(outside,inside,1);
 assert.ok(!hard.includes(1)&&!hard.includes(3)&&!hard.includes(5)&&!hard.includes(10),
  `expected the semitone-adjacent notes dropped from the hard pool, got ${hard}`);
 assert.ok(hard.length>0,"a genuinely harder pool must still have something in it");
});

test("poolFor falls back to every outside note if the hard pool would otherwise be empty",()=>{
 // A quality whose tones happen to sit a semitone from every outside note.
 const inside=[0,2,4,6,8,10]; // every even pitch class
 const outside=[1,3,5,7,9,11]; // every odd one -- each exactly 1 semitone from two insiders
 assert.deepEqual(poolFor(outside,inside,1),outside,
  "an empty hard pool must fall back rather than leaving the drill with nothing to ask");
});

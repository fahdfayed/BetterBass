import assert from "node:assert/strict";
import test from "node:test";
import {fretPosition,notesInMode,roleFor} from "../src/fretboard-neck-geometry.ts";

test("fretPosition places the nut at zero and the octave at half the scale length",()=>{
 assert.equal(fretPosition(0,100),0);
 assert.equal(fretPosition(12,100),50,"the 12th fret is always exactly half the scale length");
});

test("fretPosition places the double-octave at three quarters of the scale length",()=>{
 // A well-known real-world checkpoint: fret 24 sits 3/4 of the way to the bridge.
 assert.ok(Math.abs(fretPosition(24,100)-75)<1e-9);
});

test("fretPosition is monotonically increasing and never reaches the scale length",()=>{
 let previous=-1;
 for(let fret=0;fret<=20;fret++){
  const position=fretPosition(fret,100);
  assert.ok(position>previous,`fret ${fret} did not move further than the one before it`);
  assert.ok(position<100,`fret ${fret} reached or passed the bridge`);
  previous=position;
 }
});

test("notesInMode returns the mode's scale transposed to the given root",()=>{
 // Ionian (mode 0) from C (root 0) is the plain major scale.
 assert.deepEqual(notesInMode(0,0),[0,2,4,5,7,9,11]);
 // The same mode from A (root 9) transposes every degree by 9 semitones.
 assert.deepEqual(notesInMode(9,0),[9,11,1,2,4,6,8]);
});

test("roleFor names the root, the mode's own character tones, and the rest of the scale",()=>{
 // Dorian (mode 1) from A: scale is A B C D E F# G (root 9).
 assert.equal(roleFor(9,9,1),"root");
 // Dorian's character tone is scale degree index matching its raised 6th (F#, pc 6).
 assert.equal(roleFor(6,9,1),"colour");
 // D (pc 2) is in the scale, not the root, not the character tone.
 assert.equal(roleFor(2,9,1),"scale");
});

test("roleFor names anything outside the mode's scale as outside",()=>{
 // A# (pc 10) is not in A Dorian (A B C D E F# G).
 assert.equal(roleFor(10,9,1),"outside");
});

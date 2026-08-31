import assert from "node:assert/strict";
import test from "node:test";
import {OPEN_STRINGS,TOP_FRET,positionKeys,positionsFor} from "../src/fretboard-positions.ts";

/**
 * Where a heard note is shown on the neck.
 *
 * An off-by-one here marks the wrong fret on every string at once, which is not
 * something to notice by squinting at a diagram while holding a bass.
 */

test("the open strings are the open strings",()=>{
 // E1 A1 D2 G2, highest first, which is the order the board draws.
 assert.deepEqual(OPEN_STRINGS,[43,38,33,28]);
 for(const [index,midi] of OPEN_STRINGS.entries()){
  const places=positionsFor(midi);
  assert.ok(places.some(place=>place.string===index&&place.fret===0),
   `${midi} should be fret 0 of string ${index}`);
 }
});

test("a pitch is found everywhere it can be fretted",()=>{
 // A2 is 45: fret 2 of G, 7 of D, 12 of A and 17 of E.
 assert.deepEqual(positionsFor(45),[
  {string:0,fret:2},{string:1,fret:7},{string:2,fret:12},{string:3,fret:17},
 ]);

 // The low E has exactly one place, being the lowest note on the instrument.
 assert.deepEqual(positionsFor(28),[{string:3,fret:0}]);
});

test("pitches the instrument cannot play get no position at all",()=>{
 /*
  * The detector hears notes a four-string cannot reach — a low B from a
  * five-string, a harmonic, something else in the room. Inventing a fret for
  * those would put a mark under a finger that is not there.
  */
 assert.deepEqual(positionsFor(27),[],"a semitone below the open low E");
 assert.deepEqual(positionsFor(20),[],"well below the instrument");
 assert.deepEqual(positionsFor(43+TOP_FRET+1),[],"past the top fret of the G string");
 assert.deepEqual(positionsFor(Number.NaN),[],"and nothing at all");
});

test("the top fret is included and the one past it is not",()=>{
 const top=positionsFor(43+TOP_FRET);
 assert.deepEqual(top,[{string:0,fret:TOP_FRET}]);
 assert.deepEqual(positionsFor(43+TOP_FRET+1),[]);
});

test("a pitch between frets is read as the nearest fret",()=>{
 // The detector reports a real pitch, so it can arrive slightly sharp or flat
 // of the fret that produced it.
 assert.deepEqual(positionsFor(45.2),positionsFor(45));
 assert.deepEqual(positionsFor(44.8),positionsFor(45));
});

test("the keys match what the board looks up",()=>{
 const keys=positionKeys(45);
 assert.ok(keys.has("0:2")&&keys.has("1:7")&&keys.has("2:12")&&keys.has("3:17"));
 assert.equal(keys.size,4);
 assert.equal(positionKeys(20).size,0);
});

test("every note on the neck round-trips",()=>{
 // Nothing playable should be unreachable, and nothing should land twice on
 // the same string.
 for(let midi=28;midi<=43+TOP_FRET;midi++){
  const places=positionsFor(midi);
  assert.ok(places.length>0,`${midi} is on the neck but has no position`);
  assert.equal(new Set(places.map(p=>p.string)).size,places.length,
   `${midi} landed twice on one string`);
  for(const place of places)
   assert.equal(OPEN_STRINGS[place.string]+place.fret,midi,
    `${midi} at string ${place.string} fret ${place.fret} is a different note`);
 }
});

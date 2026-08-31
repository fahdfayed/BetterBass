import assert from "node:assert/strict";
import test from "node:test";
import {FINGER_ORDERS,TECHNIQUE_DRILLS,anchorDrill,crossingDrill,permutationDrill,shiftDrill}
 from "../src/tab/technique-library.ts";
import {TECHNIQUE_AREAS} from "../src/technique-data.ts";
import {beatsOf,toAlphaTex} from "../src/tab/notation.ts";

const beats=bar=>bar.reduce((sum,event)=>sum+beatsOf(event),0);

test("there are twenty-four finger orders and no repeats",()=>{
 assert.equal(FINGER_ORDERS.length,24,"four fingers have twenty-four orders");
 assert.equal(new Set(FINGER_ORDERS.map(order=>order.join(""))).size,24);
 for(const order of FINGER_ORDERS)
  assert.deepEqual([...order].sort(),[1,2,3,4],`${order} is not a permutation`);
});

test("a permutation drill maps each finger to its own fret and never moves the hand",()=>{
 for(const order of FINGER_ORDERS){
  const drill=permutationDrill(order,5);
  assert.equal(drill.bars.length,4,"one bar per string");

  const frets=new Set();
  drill.bars.forEach((bar,index)=>{
   assert.equal(beats(bar),4);
   // One string per bar, descending E to G.
   assert.equal(new Set(bar.map(event=>event.string)).size,1);
   assert.equal(bar[0].string,[4,3,2,1][index]);

   bar.forEach((event,position)=>{
    assert.equal(event.t,"f");
    // Finger n plays fret position+n-1: that is what one-finger-per-fret means.
    assert.equal(event.fret,5+order[position]-1,
     `${drill.id} bar ${index} note ${position} is on the wrong fret`);
    frets.add(event.fret);
   });
  });
  // The hand covers exactly four frets and stays there.
  assert.deepEqual([...frets].sort((a,b)=>a-b),[5,6,7,8]);
 }
});

test("a crossing drill changes string on every note",()=>{
 for(const order of FINGER_ORDERS){
  const drill=crossingDrill(order,5);
  for(const [index,bar] of drill.bars.entries()){
   assert.equal(beats(bar),4);
   /*
    * The whole point of the drill. Deriving the outside-in route arithmetically
    * produced 4-2-2-4, which plays the same string twice in a row and trains
    * nothing.
    */
   assert.equal(new Set(bar.map(event=>event.string)).size,4,
    `${drill.id} bar ${index} does not use all four strings`);
   for(let i=1;i<bar.length;i++)
    assert.notEqual(bar[i].string,bar[i-1].string,
     `${drill.id} bar ${index} stays on one string between notes ${i-1} and ${i}`);
  }
 }
});

test("an anchor drill keeps its held finger in every bar",()=>{
 for(const held of [1,2,3,4]){
  const drill=anchorDrill(held,5);
  const heldFret=5+held-1;
  assert.equal(drill.bars.length,4);

  for(const [index,bar] of drill.bars.entries()){
   assert.equal(beats(bar),4);
   assert.ok(bar.some(event=>event.fret===heldFret),
    `${drill.id} bar ${index} never plays the held finger`);
   // and the other three each appear once
   const others=bar.filter(event=>event.fret!==heldFret).map(event=>event.fret);
   assert.equal(new Set(others).size,3,`${drill.id} bar ${index} repeats a finger`);
  }

  /*
   * reverse() mutates. Reversing the shared list in the second bar left every
   * later bar using the reversed order, so the drill silently stopped
   * alternating up and back after the first string.
   */
  assert.deepEqual(drill.bars[0].map(e=>e.fret),drill.bars[2].map(e=>e.fret));
  assert.deepEqual(drill.bars[1].map(e=>e.fret),drill.bars[3].map(e=>e.fret));
  assert.notDeepEqual(drill.bars[0].map(e=>e.fret),drill.bars[1].map(e=>e.fret));
 }
});

test("a shift drill actually moves the hand, and lands back in shape",()=>{
 for(const distance of [1,2,3,5,7]){
  const drill=shiftDrill(distance,3);
  const lowest=drill.bars.map(bar=>Math.min(...bar.map(event=>event.fret)));
  assert.deepEqual(lowest,[3,3+distance,3+distance*2,3+distance]);
  for(const bar of drill.bars){
   assert.equal(beats(bar),4);
   // Every position is the same shape, moved.
   const shape=bar.map(event=>event.fret-Math.min(...bar.map(e=>e.fret)));
   assert.deepEqual(shape,[0,3,0,3]);
  }
 }
});

test("every drill fits on the neck and says what it is for",()=>{
 for(const drill of TECHNIQUE_DRILLS){
  assert.doesNotThrow(()=>toAlphaTex(drill),`${drill.id} does not fit on the neck`);
  assert.ok(drill.brief.length>80,`${drill.id} does not say what to do`);
  assert.ok(drill.pass.length>30,`${drill.id} does not say when it is right`);
  for(const bar of drill.bars)for(const event of bar){
   assert.equal(event.t,"f","technique drills are frets, not degrees");
   assert.ok(event.fret>=0&&event.fret<=20,`${drill.id} reaches fret ${event.fret}`);
   assert.ok(event.string>=1&&event.string<=4,`${drill.id} uses string ${event.string}`);
  }
 }
 assert.equal(new Set(TECHNIQUE_DRILLS.map(d=>d.id)).size,TECHNIQUE_DRILLS.length);
});

test("each technique area teaches, warns and gives a way to check",()=>{
 assert.ok(TECHNIQUE_AREAS.length>=5);
 for(const area of TECHNIQUE_AREAS){
  assert.ok(area.core.length>150,`${area.id} explains too little`);
  assert.ok(area.rules.length>=5,`${area.id} needs at least five rules`);
  assert.ok(area.trap.length>60,`${area.id} does not say what goes wrong`);
  assert.ok(area.proof.length>40,`${area.id} gives no way to check`);
  for(const rule of area.rules){
   assert.ok(rule.name.length>5,`${area.id} has an unnamed rule`);
   assert.ok(rule.detail.length>60,`"${rule.name}" is asserted rather than explained`);
  }
 }
 // The health area comes first on purpose: it is the one that is irreversible.
 assert.equal(TECHNIQUE_AREAS[0].id,"health");
 assert.match(TECHNIQUE_AREAS[0].trap,/pain|tingling|numbness/i);
});

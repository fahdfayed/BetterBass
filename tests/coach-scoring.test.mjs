import {test} from "node:test";
import assert from "node:assert/strict";
import {AXES,scoringAxisFor,axisBlueprint,analyzeEvents,defaultDetector} from "../src/coach-scoring.ts";

// Regression pin for the casing bug fixed in this pass: a session was built with
// axis:"Repair"/"Prove" (Title-case) while every comparison checked the uppercase
// literals, so a Prove block's take was never credited and a Repair block never
// got its mid-block spoken correction. scoringAxisFor is the one place that
// decision is made now, so pinning it here is what would have caught it.
test("scoringAxisFor credits the five real axes, maps Prove to Create, and gives Repair no attempt",()=>{
 for(const axis of AXES){
  assert.equal(scoringAxisFor({axis}),axis);
 }
 assert.equal(scoringAxisFor({axis:"PROVE"}),"CREATE");
 assert.equal(scoringAxisFor({axis:"REPAIR"}),null);
});

test("scoringAxisFor rejects the old Title-case literals — this is the exact bug that shipped",()=>{
 assert.equal(scoringAxisFor({axis:"Repair"}),null);
 assert.equal(scoringAxisFor({axis:"Prove"}),null);
});

test("axisBlueprint produces a real task for every scored axis",()=>{
 const modeIntervals=[0,2,3,5,7,9,10];
 for(const axis of AXES){
  const blueprint=axisBlueprint(axis,10,0,"Dorian",modeIntervals,3,"Outside In");
  assert.ok(blueprint.title.length>0);
  assert.ok(blueprint.steps.length>0);
  assert.ok(blueprint.detector.minEvents>0);
 }
});

test("analyzeEvents passes a clean, on-grid take and fails an empty one",()=>{
 const modeIntervals=[0,2,3,5,7,9,10],characterInterval=3,key=0,tempo=80;
 const detector=defaultDetector(8,modeIntervals,characterInterval);
 const block={id:"b",title:"t",minutes:8,axis:"HEAR",reason:"",task:"",pass:"",tool:"hear",done:false,detector};
 const gridMs=30000/tempo;
 const clean=Array.from({length:detector.minEvents+4},(_,index)=>({
  midi:36+[0,3,7,10][index%4],offset:0,tension:0,resolution:"",
  start:index*gridMs,end:index*gridMs+120,dur:120,beat:index,
 }));
 const passResult=analyzeEvents(block,clean,key,tempo,0,modeIntervals,characterInterval);
 assert.equal(passResult.pass,true);

 const emptyResult=analyzeEvents(block,[],key,tempo,0,modeIntervals,characterInterval);
 assert.equal(emptyResult.pass,false);
 assert.equal(emptyResult.events,0);
});

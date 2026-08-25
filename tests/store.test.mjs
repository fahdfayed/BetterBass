import assert from "node:assert/strict";
import test from "node:test";
import {analyzePracticeTake,validateLearnerId,validateRecords} from "../server/store.mjs";

const note=(overrides={})=>({start:0,end:300,offset:5,tension:1,fn:"CHORD",resolution:"—",...overrides});

test("analyzePracticeTake scores timing, tension and resolution", () => {
 const analysis=analyzePracticeTake([
  note({start:0,end:300,offset:10,tension:0,fn:"ROOT"}),
  note({start:400,end:700,offset:-30,tension:4,fn:"OUTSIDE",resolution:"recovered"}),
  note({start:800,end:1100,offset:20,tension:4,fn:"OUTSIDE",resolution:"unresolved"}),
  note({start:1200,end:1600,offset:0,tension:2,fn:"COLOUR"}),
 ]);
 assert.equal(analysis.noteCount,4);
 assert.equal(analysis.durationMs,1600);
 assert.equal(analysis.averageGridOffsetMs,15);
 assert.equal(analysis.timingScore,85);
 assert.equal(analysis.insidePercent,50);
 assert.equal(analysis.outsideCount,2);
 assert.equal(analysis.resolutionRate,50);
 assert.deepEqual({...analysis.functionCounts},{ROOT:1,OUTSIDE:2,COLOUR:1});
});

test("analyzePracticeTake survives empty and malformed takes",()=>{
 for(const input of [[],null,undefined,"not an array",[null,7,"x"]]){
  const analysis=analyzePracticeTake(input);
  assert.equal(analysis.durationMs,0,`durationMs must not be Infinity for ${JSON.stringify(input)}`);
  assert.ok(Number.isFinite(analysis.durationMs));
  assert.equal(analysis.averageGridOffsetMs,null);
  assert.equal(analysis.timingScore,null);
  assert.equal(analysis.insidePercent,null);
  assert.equal(analysis.resolutionRate,null);
 }
 assert.equal(analyzePracticeTake([]).noteCount,0);
});

test("analyzePracticeTake clamps the timing score and caps the event count",()=>{
 assert.equal(analyzePracticeTake([note({offset:100000})]).timingScore,0,"a wild offset floors at zero");
 assert.equal(analyzePracticeTake([note({offset:0})]).timingScore,100);
 assert.equal(analyzePracticeTake(Array.from({length:6000},()=>note())).noteCount,5000);
});

test("analyzePracticeTake buckets unrecognised function labels",()=>{
 const analysis=analyzePracticeTake([note({fn:"nope!! <script>"}),note({fn:123}),note({fn:"root"})]);
 assert.equal(analysis.functionCounts.UNLABELLED,2);
 assert.equal(analysis.functionCounts.ROOT,1);
 assert.equal(Object.getPrototypeOf(analysis.functionCounts),null,"labels come from the client, so no inherited keys");
});

test("validateLearnerId accepts real ids and refuses reserved or malformed ones",()=>{
 assert.ok(validateLearnerId("learner_test_001"));
 assert.ok(validateLearnerId(crypto.randomUUID()));
 for(const bad of ["__proto__","constructor","prototype","short","has space","has/slash","",null,undefined,42,"x".repeat(101)]){
  assert.equal(validateLearnerId(bad),false,`${String(bad)} must be refused`);
 }
});

test("validateRecords enforces the key allow-list and the size budget",()=>{
 assert.equal(validateRecords({"basslab-course":"{}"}),null);
 assert.match(validateRecords({"not-allowed":"x"}),/unsupported state key/);
 assert.match(validateRecords({"basslab-course":{}}),/serialized string/);
 assert.match(validateRecords({"basslab-course":"x".repeat(750_001)}),/too large/);
 assert.match(validateRecords(["basslab-course"]),/must be an object/);
 assert.match(validateRecords(null),/must be an object/);
 const total={"basslab-course":"x".repeat(700_000),"basslab-beast":"y".repeat(700_000),"basslab-lessons":"z".repeat(700_000)};
 assert.match(validateRecords(total),/payload is too large/);
});

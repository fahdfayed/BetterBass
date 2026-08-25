import assert from "node:assert/strict";
import test from "node:test";
import {TERRITORIES,territoryStates} from "../src/game/progression.ts";

test("the six territories cover the whole course without gaps or overlap",()=>{
 assert.equal(TERRITORIES.length,6);
 assert.equal(TERRITORIES[0].range[0],0,"the first territory starts at lesson one");
 assert.equal(TERRITORIES[5].range[1],27,"the last territory ends at lesson 28");
 TERRITORIES.slice(1).forEach((territory,index)=>{
  const previous=TERRITORIES[index];
  assert.equal(territory.range[0],previous.range[1]+1,`${territory.name} must start where ${previous.name} ends`);
 });
 const lessons=TERRITORIES.reduce((sum,t)=>sum+(t.range[1]-t.range[0]+1),0);
 assert.equal(lessons,28,"every lesson belongs to exactly one territory");
});

test("a brand new learner has only the first territory open",()=>{
 const states=territoryStates(0,0);
 assert.deepEqual(states.map(t=>t.unlocked),[true,false,false,false,false,false]);
 assert.equal(states[0].done,0);
 assert.equal(states[0].current,true);
 assert.equal(states[5].lessonsToUnlock,24);
 assert.ok(states.every(t=>!t.complete));
});

test("territories unlock in order and report what is still missing",()=>{
 const states=territoryStates(9,9);
 assert.deepEqual(states.map(t=>t.unlocked),[true,true,true,false,false,false]);
 assert.deepEqual(states.map(t=>t.complete),[true,true,false,false,false,false]);
 assert.equal(states[2].done,1,"lessons 0-8 are done, so only index 8 falls inside territory three");
 assert.equal(states[2].total,7);
 assert.equal(states[2].current,true,"lesson 9 sits inside territory three");
 assert.equal(states[3].lessonsToUnlock,6,"six more lessons before improvisation opens");
 assert.equal(states[0].percent,100);
});

test("exactly one territory is current at a time",()=>{
 for(const lesson of [0,3,4,8,14,15,19,20,23,24,27]){
  const current=territoryStates(lesson,lesson).filter(t=>t.current);
  assert.equal(current.length,1,`lesson ${lesson} should sit in exactly one territory`);
  assert.ok(lesson>=current[0].range[0]&&lesson<=current[0].range[1]);
 }
});

test("finishing the course completes and unlocks everything",()=>{
 const states=territoryStates(28,27);
 assert.ok(states.every(t=>t.unlocked&&t.complete),"all six territories done");
 assert.ok(states.every(t=>t.percent===100));
});

test("progress never runs past a territory's own size",()=>{
 const states=territoryStates(99,0);
 assert.ok(states.every(t=>t.done<=t.total),"done can never exceed total");
 assert.ok(states.every(t=>t.percent===100));
 assert.ok(states.every(t=>t.lessonsToUnlock===0));
});

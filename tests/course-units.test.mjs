import assert from "node:assert/strict";
import test from "node:test";
import {COURSE_UNITS,unitLessonsToUnlock} from "../src/course-data.ts";

/**
 * The six units, as the single source of truth for "where am I in the course
 * and what stands between here and the next unit." This used to be answered a
 * second time by `game/progression.ts`'s TERRITORIES, a parallel copy of the
 * same six ranges for the now-retired `/map`. These are the boundary checks
 * that file carried, ported onto the one copy that is left.
 */

test("the six units cover the whole course without gaps or overlap",()=>{
 assert.equal(COURSE_UNITS.length,6);
 assert.equal(COURSE_UNITS[0].range[0],0,"the first unit starts at lesson one");
 assert.equal(COURSE_UNITS[5].range[1],27,"the last unit ends at lesson 28");
 COURSE_UNITS.slice(1).forEach((unit,index)=>{
  const previous=COURSE_UNITS[index];
  assert.equal(unit.range[0],previous.range[1]+1,`${unit.title} must start where ${previous.title} ends`);
 });
 const lessons=COURSE_UNITS.reduce((sum,u)=>sum+(u.range[1]-u.range[0]+1),0);
 assert.equal(lessons,28,"every lesson belongs to exactly one unit");
});

test("a brand new learner is exactly four lessons from unit two",()=>{
 assert.equal(unitLessonsToUnlock(COURSE_UNITS[0],0),0,"the first unit needs nothing to unlock");
 assert.equal(unitLessonsToUnlock(COURSE_UNITS[1],0),4);
 assert.equal(unitLessonsToUnlock(COURSE_UNITS[5],0),24,"the last unit is the whole course away");
});

test("the threshold counts down and never goes negative",()=>{
 assert.equal(unitLessonsToUnlock(COURSE_UNITS[3],15),0,"unit four's own first lesson unlocks it");
 assert.equal(unitLessonsToUnlock(COURSE_UNITS[3],9),6,"six more lessons before unit four opens");
 assert.equal(unitLessonsToUnlock(COURSE_UNITS[0],99),0,"finishing the course cannot make a threshold negative");
});

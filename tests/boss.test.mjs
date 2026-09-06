import assert from "node:assert/strict";
import test from "node:test";
import {fightResult,hitDamage,missDamage,START_HP} from "../src/game/boss.ts";

test("hit damage rises with an unbroken streak and caps at ten",()=>{
 assert.equal(hitDamage(0),10);
 assert.equal(hitDamage(5),15);
 assert.equal(hitDamage(10),20);
 assert.equal(hitDamage(50),20,"the combo bonus caps rather than growing without bound");
});

test("a miss costs a fixed amount regardless of streak",()=>{
 assert.equal(missDamage,15);
});

test("both fighters start at full health",()=>{
 assert.equal(START_HP,100);
});

test("the fight ends the moment either side is out of health",()=>{
 assert.equal(fightResult(0,50,60),"won","a boss at zero HP is defeated even if the player is hurt too");
 assert.equal(fightResult(50,0,60),"lost");
 assert.equal(fightResult(50,50,60),"fighting");
});

test("running out of time with the boss still standing is a loss, not a draw",()=>{
 assert.equal(fightResult(40,90,0),"lost");
});

test("a simultaneous zero favours the win, since defeating the boss is what ends the round",()=>{
 assert.equal(fightResult(0,0,60),"won");
});

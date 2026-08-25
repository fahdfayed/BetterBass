import assert from "node:assert/strict";
import test from "node:test";
import {
 badgesFor,currentStreak,EMPTY_INPUT,longestStreak,LEVELS,masteredKeys,
 progressionFor,rankFor,slapPassCount,territoryStates,XP_RATES,xpBreakdown,
} from "../src/game/progression.ts";

const input=(overrides={})=>({...EMPTY_INPUT,...overrides});

test("a brand new learner starts at the bottom with nothing unlocked past unit 1",()=>{
 const state=progressionFor(EMPTY_INPUT,0);
 assert.equal(state.xp,0);
 assert.equal(state.rank.level,1);
 assert.equal(state.rank.title,"Bedroom");
 assert.equal(state.badgesEarned,0);
 assert.equal(state.streak,0);
 assert.equal(state.territories[0].unlocked,true,"the first territory is always open");
 assert.equal(state.territories.filter(t=>t.unlocked).length,1);
 assert.equal(state.territories[5].lessonsToUnlock,24);
});

test("XP comes only from proven work, priced by source",()=>{
 const {total,sources}=xpBreakdown(input({
  lessonsCompleted:3,
  beastDays:[1,2,3,4],
  slapPasses:{rebound:["2026-01-01","2026-01-03"],octave:["2026-01-05"]},
  coachPasses:2,
  tempoRung:4,
  keyMatrix:[90,80,10,79,100,0,0,0,0,0,0,0],
 }));
 const expected=
  3*XP_RATES.lesson+
  4*XP_RATES.beastDay+
  3*XP_RATES.slapPass+
  2*XP_RATES.coachPass+
  3*XP_RATES.tempoRung+   // rung 4 means three climbed
  3*XP_RATES.keyMastered; // 90, 80 and 100 clear the threshold; 79 does not
 assert.equal(total,expected);
 assert.equal(sources.reduce((sum,s)=>sum+s.xp,0),total,"sources must sum to the total");
 assert.equal(sources.find(s=>s.label==="Keys mastered").count,3);
 assert.equal(sources.find(s=>s.label==="Tempo rungs climbed").count,3);
});

test("XP never goes negative on malformed state",()=>{
 const {total}=xpBreakdown(input({lessonsCompleted:-5,tempoRung:0,beastDays:[],slapPasses:{}}));
 assert.equal(total,0);
 assert.equal(slapPassCount({}),0);
 assert.equal(slapPassCount({a:null}),0);
 assert.equal(masteredKeys([]),0);
});

test("rank thresholds line up with the level table",()=>{
 assert.equal(rankFor(0).level,1);
 assert.equal(rankFor(299).level,1);
 assert.equal(rankFor(300).level,2);
 assert.equal(rankFor(300).title,"Garage");
 assert.equal(rankFor(9799).level,8);
 assert.equal(rankFor(9800).level,9);
 assert.equal(rankFor(9800).title,"Headliner");
 for(const level of LEVELS)assert.equal(rankFor(level.at).level,level.level,`${level.title} boundary`);
});

test("rank reports progress through the current level, and caps cleanly",()=>{
 const mid=rankFor(300+((800-300)/2));
 assert.equal(mid.level,2);
 assert.equal(mid.span,500);
 assert.equal(mid.into,250);
 assert.equal(mid.percent,50);
 assert.equal(mid.next.title,"Rehearsal Room");

 const capped=rankFor(50000);
 assert.equal(capped.level,9);
 assert.equal(capped.next,null,"no next level at the cap");
 assert.equal(capped.span,null);
 assert.equal(capped.percent,100,"a capped rank shows a full bar, not a division by zero");
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

test("finishing the course completes and unlocks everything",()=>{
 const states=territoryStates(28,27);
 assert.ok(states.every(t=>t.unlocked&&t.complete),"all six territories done");
 assert.ok(states.every(t=>t.percent===100));
});

test("streaks measure consecutive days, not totals",()=>{
 assert.equal(longestStreak([1,2,3,7,8]),3);
 assert.equal(currentStreak([1,2,3,7,8]),2,"the run ending at the latest day");
 assert.equal(longestStreak([5,1,3,2,4]),5,"order must not matter");
 assert.equal(longestStreak([4,4,4]),1,"duplicates are one day");
 assert.equal(longestStreak([]),0);
 assert.equal(currentStreak([]),0);
 assert.equal(currentStreak([9]),1);
});

test("badges report partial progress and only fire when actually earned",()=>{
 const early=badgesFor(input({lessonsCompleted:2,keyMatrix:[90,90,0,0,0,0,0,0,0,0,0,0]}));
 const first=early.find(b=>b.id==="first-pass");
 const twelve=early.find(b=>b.id==="twelve-keys");
 assert.equal(first.earned,true);
 assert.equal(twelve.earned,false);
 assert.equal(twelve.percent,17,"2 of 12 keys");
 assert.equal(twelve.detail,"2 / 12 keys");

 const done=badgesFor(input({
  lessonsCompleted:28,keyMatrix:Array(12).fill(95),beastDays:Array.from({length:30},(_,i)=>i+1),
  tempoRung:10,slapPasses:{a:Array(10).fill("2026-01-01")},juryScores:[80,80,80,80,80],
  freedom:[90,90,90,90,90],coachPasses:10,
 }));
 assert.ok(done.every(b=>b.earned),`every badge should be earned: ${done.filter(b=>!b.earned).map(b=>b.id)}`);
 assert.ok(done.every(b=>b.percent===100));
});

test("seeded placeholder scores do not hand out unearned badges",()=>{
 // The app seeds juryScores at 70 and freedom well above zero before anything
 // has been assessed. A fresh profile must still earn nothing.
 const fresh=badgesFor(input({juryScores:[70,70,70,70,70],freedom:[72,89,94,86,63]}));
 assert.equal(fresh.find(b=>b.id==="no-weak-link").earned,false,"no jury has been sat yet");
 assert.equal(fresh.find(b=>b.id==="free-player").earned,false);
 assert.equal(fresh.filter(b=>b.earned).length,0,"a brand new profile has earned nothing");

 // Once a jury has actually been passed the same scores do count.
 const assessed=badgesFor(input({lessonsCompleted:1,juryScores:[70,70,70,70,70],freedom:[90,90,90,90,90]}));
 assert.equal(assessed.find(b=>b.id==="no-weak-link").earned,true);
 assert.equal(assessed.find(b=>b.id==="free-player").earned,true);
});

test("a badge cannot exceed 100 percent or report more than it needs",()=>{
 const over=badgesFor(input({lessonsCompleted:999,tempoRung:50}));
 const graduate=over.find(b=>b.id==="graduate");
 assert.equal(graduate.percent,100);
 assert.equal(graduate.detail,"28 / 28 lessons");
});

test("a real mid-course learner gets a coherent snapshot",()=>{
 const state=progressionFor(input({
  lessonsCompleted:9,
  beastDays:[1,2,3,4,5,6,7,8],
  tempoRung:5,
  keyMatrix:[85,90,40,80,20,10,95,30,0,0,60,70],
  slapPasses:{rebound:["2026-01-01","2026-01-02","2026-01-03"]},
  coachPasses:4,
  juryScores:[82,75,88,71,80],
  freedom:[72,89,94,86,63],
 }),9);
 // 85, 90, 80 and 95 clear the threshold; 79 and below do not.
 assert.equal(state.keysMastered,4);
 assert.equal(state.xp,900+200+120+120+80+60);
 assert.equal(state.rank.level,3);
 assert.equal(state.rank.title,"Rehearsal Room");
 assert.equal(state.streak,8);
 assert.equal(state.territories.filter(t=>t.unlocked).length,3);
 assert.ok(state.badgesEarned>0&&state.badgesEarned<state.badges.length,"partway through the badge set");
 assert.ok(state.rank.percent>0&&state.rank.percent<100);
});

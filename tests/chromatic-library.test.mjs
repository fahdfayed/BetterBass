import assert from "node:assert/strict";
import test from "node:test";
import {CHROMATIC_STUDIES,DEVICES,PROGRESSIONS,QUALITIES,cycleStudy,deviceStudy,extensionStudy,
 progressionLine,targetStudy}
 from "../src/tab/chromatic-library.ts";
import {beatsOf,playableKeys,toAlphaTex,transpose} from "../src/tab/notation.ts";

/**
 * The chromatic studies are generated, so nobody proofreads them.
 *
 * A hand-written exercise is checked by the person writing it out. These are
 * produced by a procedure across every device, chord quality, target and key,
 * which means a mistake in the procedure is a mistake in a few thousand
 * exercises at once. The first version padded the end of the bar by repeating
 * one note three times and reached below the low E.
 */

const bars=study=>study.bars;
const beats=bar=>bar.reduce((sum,event)=>sum+beatsOf(event),0);

test("every device is a real approach that ends on its target",()=>{
 for(const device of DEVICES){
  assert.equal(device.offsets.at(-1),0,`${device.id} must end on the target`);
  assert.ok(device.offsets.length>=2,`${device.id} approaches from nowhere`);

  // An offset of 0 anywhere but last would play the target early.
  assert.equal(device.offsets.filter(offset=>offset===0).length,1,
   `${device.id} touches the target more than once`);

  // Approach notes have to be near the target; a fifth away is a leap, not an
  // approach, and the ear stops hearing it as one gesture.
  for(const offset of device.offsets)
   assert.ok(Math.abs(offset)<=2,`${device.id} reaches ${offset} semitones away`);
 }
 assert.equal(new Set(DEVICES.map(d=>d.offsets.join(","))).size,DEVICES.length,
  "two devices describe the same approach");
});

test("every chord quality is spelled correctly",()=>{
 for(const quality of QUALITIES){
  assert.equal(quality.tones.length,4,`${quality.id} needs four tones`);
  assert.equal(quality.tones[0],0,`${quality.id} must start on its root`);
  assert.deepEqual([...quality.tones].sort((a,b)=>a-b),quality.tones,
   `${quality.id} is not in ascending order`);
  const third=quality.tones[1],fifth=quality.tones[2],seventh=quality.tones[3];
  assert.ok(third===3||third===4,`${quality.id} has no third`);
  assert.ok(fifth===6||fifth===7||fifth===8,`${quality.id} has no fifth`);
  assert.ok(seventh>=9&&seventh<=11,`${quality.id} has no sixth or seventh`);
 }
 // Sanity against the names they are given.
 const by=id=>QUALITIES.find(q=>q.id===id).tones;
 assert.deepEqual(by("maj7"),[0,4,7,11]);
 assert.deepEqual(by("m7"),[0,3,7,10]);
 assert.deepEqual(by("dom7"),[0,4,7,10]);
 assert.deepEqual(by("m7b5"),[0,3,6,10]);
 assert.deepEqual(by("dim7"),[0,3,6,9]);
});

test("every generated bar is four beats long",()=>{
 for(const study of CHROMATIC_STUDIES)
  for(const bar of bars(study))
   assert.equal(beats(bar),4,`${study.id} has a bar of ${beats(bar)} beats`);
});

test("the target lands on beat 3 and is a chord tone",()=>{
 for(const device of DEVICES)for(const quality of QUALITIES){
  const study=deviceStudy(device,quality);
  study.bars.forEach((bar,index)=>{
   // Beats 1 and 2 are four eighths, so the target is the fifth event.
   const before=bar.slice(0,4);
   assert.equal(beats(before),2,`${study.id} bar ${index} does not reach beat 3 in four events`);

   const target=bar[4];
   assert.equal(target.t,"n");
   assert.equal(target.deg,quality.tones[index],
    `${study.id} bar ${index} aims at ${target.deg}, not the chord tone`);

   // The target is the point of the bar, so it is longer than its approach.
   assert.ok(beatsOf(target)>beatsOf(bar[3]),
    `${study.id} bar ${index} gives the target no more weight than its approach`);

   // and the approach really is the device
   const approach=device.offsets.slice(0,-1);
   const played=bar.slice(4-approach.length,4).map(e=>e.deg-target.deg);
   assert.deepEqual(played,approach,
    `${study.id} bar ${index} does not play ${device.id}`);
  });
 }
});

test("nothing is written outside the range of a bass",()=>{
 // The generator picks one root for everything, so a bad choice puts every
 // study off the neck at once. toAlphaTex is what refuses.
 for(const study of CHROMATIC_STUDIES)
  assert.doesNotThrow(()=>toAlphaTex(study),`${study.id} does not fit on the neck`);
});

test("the studies transpose, and say so honestly when they do not",()=>{
 let total=0,partial=0;
 for(const study of CHROMATIC_STUDIES){
  const keys=playableKeys(study);
  total+=keys.length;
  if(keys.length<12)partial++;
  assert.ok(keys.length>=10,`${study.id} only fits ${keys.length} keys`);
  for(const key of keys){
   const moved=transpose(study,key);
   assert.ok(moved,`${study.id} claims ${key} and will not move there`);
   assert.equal(((moved.root%12)+12)%12,key);
   // Transposing must not rewrite the music.
   assert.deepEqual(moved.bars,study.bars);
  }
 }
 assert.ok(total>3000,`only ${total} playable exercises`);
 // A handful reach too high in one key; that is reported, not hidden.
 // The two-register target studies span an octave more than the rest, so a
 // few reach too high in one key. That is reported by playableKeys rather
 // than hidden, and every study still covers at least ten.
 assert.ok(partial<=40,`${partial} studies do not cover all twelve keys`);
});

test("a line aims at guide tones that connect by a step",()=>{
 /*
  * The third and the seventh are what carry a chord's quality, and around the
  * cycle they connect by a semitone or less: the third of ii is the seventh of
  * V, and the third of V is the seventh of I. A line that aims anywhere else is
  * playing over the changes rather than through them.
  */
 for(const device of DEVICES)for(const progression of PROGRESSIONS)
  for(const chain of ["3-7","7-3"]){
   const line=progressionLine(device,progression,chain);
   assert.equal(line.bars.length,progression.steps.length);

   const targets=line.bars.map((bar,index)=>{
    const step=progression.steps[index];
    const quality=QUALITIES.find(q=>q.id===step.quality);
    const target=bar[4];
    // The generator picks each chord's octave to keep the line in one register,
    // so the guide tone is checked by pitch class rather than by written degree.
    const pc=x=>((x%12)+12)%12;
    const relative=pc(target.deg-step.degree);
    // Only ever a third or a seventh — never a root or a fifth.
    assert.ok([pc(quality.tones[1]),pc(quality.tones[3])].includes(relative),
     `${line.id} bar ${index} aims at ${relative}, which is not a guide tone`);
    return target.deg;
   });

   /*
    * Consecutive targets have to be reachable. A leap past a fourth means the
    * chord was voiced in the wrong register rather than led into — which is
    * what happened when a V chord was built up from a fifth above the key and
    * its seventh landed an eleventh up.
    */
   for(let i=1;i<targets.length;i++){
    const apart=Math.abs(((targets[i]-targets[i-1])%12+12)%12);
    assert.ok(Math.min(apart,12-apart)<=4,
     `${line.id} moves ${targets[i-1]} to ${targets[i]}, which is not a guide-tone move`);
   }
  }
});

test("round the cycle, the guide tones connect by a step or hold",()=>{
 /*
  * This is the claim the whole alternation exists for, and it only holds where
  * the roots move by fourths: the third of ii is literally the seventh of V,
  * and the third of V is the seventh of I. Progressions whose roots move by
  * thirds cannot do this, which is why it is asserted here and not above.
  */
 for(const id of ["ii-v-i","ii-v-i-minor","cycle"]){
  const progression=PROGRESSIONS.find(p=>p.id===id);
  for(const device of DEVICES)for(const chain of ["3-7","7-3"]){
   const targets=progressionLine(device,progression,chain).bars.map(bar=>bar[4].deg);
   for(let i=1;i<targets.length;i++){
    // A step by pitch class. Which octave the neck allows it in is a separate
    // question, and a bass cannot always take the nearest one.
    const apart=Math.abs(((targets[i]-targets[i-1])%12+12)%12);
    assert.ok(Math.min(apart,12-apart)<=2,
     `${id} (${chain}) moves ${targets[i-1]} to ${targets[i]}, which is not a guide-tone step`);
   }
  }
 }
});

test("the progressions are spelled the way they are named",()=>{
 const by=id=>PROGRESSIONS.find(p=>p.id===id).steps.map(s=>[s.degree,s.quality]);
 // ii is a whole tone up and minor; V is a fifth up and dominant.
 assert.deepEqual(by("ii-v-i"),[[2,"m7"],[7,"dom7"],[0,"maj7"]]);
 // the minor cadence takes a half-diminished ii
 assert.deepEqual(by("ii-v-i-minor"),[[2,"m7b5"],[7,"dom7"],[0,"m7"]]);
 // a tritone substitute sits a semitone above the tonic
 assert.deepEqual(by("tritone")[1],[1,"dom7"]);
 // the backdoor approaches from ♭VII, a whole tone below the tonic
 assert.deepEqual(by("backdoor")[1],[10,"dom7"]);
 // a blues is dominant throughout
 for(const [,quality] of by("blues-head"))assert.equal(quality,"dom7");

 for(const progression of PROGRESSIONS){
  assert.ok(progression.steps.length>=3,`${progression.id} is not a progression`);
  assert.ok(progression.blurb.length>40,`${progression.id} does not say what it is for`);
  for(const step of progression.steps){
   assert.ok(step.degree>=0&&step.degree<12,`${progression.id} leaves the octave`);
   assert.ok(QUALITIES.some(q=>q.id===step.quality),
    `${progression.id} uses a quality that does not exist: ${step.quality}`);
  }
 }
});

test("no two studies share an id",()=>{
 const ids=CHROMATIC_STUDIES.map(study=>study.id);
 assert.equal(new Set(ids).size,ids.length);
 // Every study has to explain itself, because there are too many to browse
 // without one.
 for(const study of CHROMATIC_STUDIES){
  assert.ok(study.brief.length>60,`${study.id} does not say what to do`);
  assert.ok(study.pass.length>30,`${study.id} does not say when it is right`);
  assert.ok(study.title.length>5,`${study.id} has no usable title`);
 }
});

test("a target study covers two registers with the same device",()=>{
 const device=DEVICES.find(d=>d.id==="enclose-ab");
 const quality=QUALITIES.find(q=>q.id==="m7");
 const study=targetStudy(device,quality,1);
 assert.equal(study.bars.length,4);
 // Bars alternate low and high, and the high one is an octave up.
 assert.equal(study.bars[1][4].deg-study.bars[0][4].deg,12);
 assert.deepEqual(study.bars[0],study.bars[2]);
 assert.deepEqual(study.bars[1],study.bars[3]);
});

test("every quality declares extensions that sit above its own seventh",()=>{
 for(const quality of QUALITIES){
  assert.equal(quality.extensions.length,3,`${quality.id} needs a 9th, 11th and 13th`);
  const seventh=quality.tones[3];
  for(const extension of quality.extensions)
   assert.ok(extension>seventh,
    `${quality.id} calls ${extension} an extension but its seventh is ${seventh}`);
  assert.deepEqual([...quality.extensions].sort((a,b)=>a-b),quality.extensions,
   `${quality.id} lists its extensions out of order`);
  // A ninth is a ninth: an octave and a tone, give or take an alteration.
  assert.ok(quality.extensions[0]>=13&&quality.extensions[0]<=15,
   `${quality.id} has no recognisable ninth`);
 }
 // The altered and raised-eleventh chords are what the approach work is for.
 for(const id of ["maj7-s11","dom7-s11","dom7-s5","maj7-s5"])
  assert.ok(QUALITIES.some(q=>q.id===id),`${id} is missing`);
 assert.deepEqual(QUALITIES.find(q=>q.id==="dom7-s11").tones,[0,4,6,10]);
 assert.deepEqual(QUALITIES.find(q=>q.id==="dom7-s5").tones,[0,4,8,10]);
});

test("an extension study aims above the chord, not inside it",()=>{
 for(const device of DEVICES)for(const quality of QUALITIES){
  const study=extensionStudy(device,quality);
  assert.equal(study.bars.length,3,"a ninth, an eleventh and a thirteenth");
  study.bars.forEach((bar,index)=>{
   const target=bar[4];
   assert.equal(target.deg,quality.extensions[index],
    `${study.id} bar ${index} does not aim at the extension`);
   // and it really is above every chord tone
   assert.ok(target.deg>Math.max(...quality.tones),
    `${study.id} bar ${index} aims inside the chord`);
  });
 }
});

test("a cycle study passes through all twelve keys and comes back",()=>{
 for(const device of DEVICES)for(const quality of QUALITIES)for(const index of [1,3]){
  const study=cycleStudy(device,quality,index);
  assert.equal(study.bars.length,12,"twelve bars, twelve keys");

  const pc=x=>((x%12)+12)%12;
  const targets=study.bars.map(bar=>bar[4].deg);
  // Every bar is a different key, so every target is a different pitch class.
  assert.equal(new Set(targets.map(pc)).size,12,
   `${study.id} does not reach all twelve keys`);

  /*
   * The roots ascend by a fourth, so consecutive targets do too — that is what
   * makes it a cycle rather than twelve unrelated bars.
   */
  for(let i=1;i<targets.length;i++)
   assert.equal(pc(targets[i]-targets[i-1]),5,
    `${study.id} moves ${targets[i-1]} to ${targets[i]}, which is not a fourth`);

  // and it stays in one register rather than climbing an octave per bar
  assert.ok(Math.max(...targets)-Math.min(...targets)<=12,
   `${study.id} spans ${Math.max(...targets)-Math.min(...targets)} semitones`);
 }
});

test("an extension is named by the interval it actually is",()=>{
 /*
  * A fixed "9th, 11th, 13th" list called maj7's raised eleventh a natural one,
  * which is precisely the note a major seventh chord cannot take: a natural 11
  * sits a semitone above the major third.
  */
 const named=quality=>extensionStudy(DEVICES[0],quality).brief;

 const maj7=QUALITIES.find(q=>q.id==="maj7");
 assert.match(named(maj7),/♯11th/,"a major seventh takes a raised eleventh");
 assert.doesNotMatch(named(maj7),/the 11th/,"and never a natural one");

 // A dominant has a major third too, so the same rule applies.
 assert.match(named(QUALITIES.find(q=>q.id==="dom7")),/♯11th/);

 // Minor chords have no major third, so the natural eleventh is available.
 assert.match(named(QUALITIES.find(q=>q.id==="m7")),/the 11th/);

 // Any chord with a major third must not offer a natural 11 as a target.
 for(const quality of QUALITIES){
  if(!quality.tones.includes(4))continue;
  assert.ok(!quality.extensions.includes(17),
   `${quality.id} has a major third and offers a natural 11 above it`);
 }
});

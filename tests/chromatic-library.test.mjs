import assert from "node:assert/strict";
import test from "node:test";
import {CHROMATIC_STUDIES,DEVICES,QUALITIES,cadenceLine,deviceStudy,targetStudy}
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
 assert.ok(partial<=8,`${partial} studies do not cover all twelve keys`);
});

test("the cadence line aims at the third of each chord in turn",()=>{
 for(const device of DEVICES){
  const line=cadenceLine(device);
  assert.equal(line.bars.length,4);
  // ii is a whole tone up, V a fifth up, I the tonic; the third of each is
  // what states the change.
  const thirds=[2+3,7+4,0+4];
  thirds.forEach((third,index)=>{
   const target=line.bars[index][4];
   assert.equal(target.deg,third,
    `${line.id} bar ${index} aims at ${target.deg} rather than the third (${third})`);
  });
  assert.equal(line.bars[3][0].deg,0,"the line should settle on the tonic");
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

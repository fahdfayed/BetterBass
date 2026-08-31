import assert from "node:assert/strict";
import test from "node:test";
import {autoCorrelate,centsToNote,createPitchTracker,labelFor,midiHz,PITCH_RMS_GATE,tensionFor} from "../src/pitch.ts";

const RATE=48000,FFT=8192;

/** A plucked string is not a sine: the harmonics are what make octave errors easy. */
function pluck(hz,{rate=RATE,length=FFT,amplitude=.25,harmonics=[1,.55,.32,.18,.09]}={}){
 const buffer=new Float32Array(length);
 for(let i=0;i<length;i++){
  let sample=0;
  harmonics.forEach((level,index)=>{sample+=level*Math.sin(2*Math.PI*hz*(index+1)*i/rate)});
  buffer[i]=amplitude*sample/harmonics.reduce((a,b)=>a+b,0);
 }
 return buffer;
}

test("detects every open string on a five-string bass",async t=>{
 // Low B and low E sit below the lag range the previous detector searched.
 const strings=[["B0",30.87],["E1",41.20],["A1",55.00],["D2",73.42],["G2",98.00]];
 for(const [name,hz] of strings){
  const detected=autoCorrelate(pluck(hz),RATE);
  assert.notEqual(detected,-1,`${name} (${hz} Hz) must be detected at all`);
  const cents=Math.abs(1200*Math.log2(detected/hz));
  assert.ok(cents<50,`${name}: detected ${detected.toFixed(2)} Hz, ${cents.toFixed(0)} cents off`);
  await t.test(`${name} ${hz} Hz -> ${detected.toFixed(2)} Hz`,()=>{});
 }
});

test("detects the upper register without locking an octave low",()=>{
 for(const hz of [130.81,196,261.63,440,880]){
  const detected=autoCorrelate(pluck(hz),RATE);
  const cents=Math.abs(1200*Math.log2(detected/hz));
  assert.ok(cents<50,`${hz} Hz read as ${detected.toFixed(2)} Hz (${cents.toFixed(0)} cents off)`);
 }
});

test("works at 44.1 kHz as well as 48 kHz",()=>{
 for(const rate of [44100,48000]){
  const detected=autoCorrelate(pluck(41.2,{rate}),rate);
  assert.ok(Math.abs(1200*Math.log2(detected/41.2))<50,`low E at ${rate} Hz read as ${detected.toFixed(2)}`);
 }
});

test("rejects silence and noise below the gate",()=>{
 assert.equal(autoCorrelate(new Float32Array(FFT),RATE),-1,"digital silence");
 const quiet=pluck(110,{amplitude:PITCH_RMS_GATE/4});
 assert.equal(autoCorrelate(quiet,RATE),-1,"a signal under the noise gate");
});

test("centsToNote names the pitch, octave and deviation",()=>{
 assert.deepEqual(centsToNote(440),{midi:69,hz:440,n:"A",oct:4,cents:0});
 assert.equal(centsToNote(41.203).n,"E");
 assert.equal(centsToNote(41.203).oct,1);
 assert.equal(centsToNote(midiHz(28)).n,"E");
 // Sharp but still recognisably an A: report the deviation, not the next note.
 const sharp=centsToNote(440*Math.pow(2,40/1200));
 assert.equal(sharp.n,"A");
 assert.ok(Math.abs(sharp.cents-40)<=1,`expected about +40 cents, got ${sharp.cents}`);
});

test("harmonic labelling ranks home, chord, colour, scale and outside",()=>{
 // A Dorian: home A(9), chord tones A C E G, colour F♯(6), scale A B C D E F♯ G.
 const harmony={ri:9,chordTones:[9,0,4,7],color:6,scale:[9,11,0,2,4,6,7]};
 assert.equal(tensionFor(9,harmony),0);
 assert.equal(labelFor(9,harmony),"ROOT");
 assert.equal(tensionFor(0,harmony),1);
 assert.equal(labelFor(0,harmony),"CHORD");
 assert.equal(tensionFor(6,harmony),2);
 assert.equal(labelFor(6,harmony),"COLOUR");
 assert.equal(tensionFor(2,harmony),3);
 assert.equal(labelFor(2,harmony),"EXTENSION");
 assert.equal(tensionFor(1,harmony),4);
 assert.equal(labelFor(1,harmony),"OUTSIDE");
});

/**
 * The signals that broke the old detector.
 *
 * Raw autocorrelation read a low E as 905 Hz under ten per cent noise while
 * reading it correctly under twenty, and energy an octave below the note
 * produced no reading at all rather than a wrong one. Both are ordinary things
 * for a bass to do — a boomy cabinet, a room, a rattling string — so both are
 * held here.
 */
function signal(hz,{rate=RATE,length=FFT,amplitude=.25,harmonics=[1,.55,.32,.18,.09],
                    decay=0,noise=0,sub=0,seed=1}={}){
 const buffer=new Float32Array(length),sum=harmonics.reduce((a,b)=>a+b,0)||1;
 // A fixed generator, so a failure can be reproduced rather than re-rolled.
 let state=seed;
 const random=()=>{state=(state*1103515245+12345)&0x7fffffff;return state/0x7fffffff*2-1};
 for(let i=0;i<length;i++){
  const t=i/rate;
  let sample=0;
  harmonics.forEach((level,index)=>{sample+=level*Math.sin(2*Math.PI*hz*(index+1)*t)});
  sample/=sum;
  if(sub)sample+=sub*Math.sin(2*Math.PI*(hz/2)*t);
  buffer[i]=amplitude*(decay?Math.exp(-decay*t):1)*sample+(noise?noise*random():0);
 }
 return buffer;
}
const centsOff=(detected,wanted)=>Math.abs(1200*Math.log2(detected/wanted));

test("an octave of energy under the note does not become the note",()=>{
 // The undertone case: a cabinet or a room resonating an octave down.
 for(const sub of [.1,.15,.18]){
  for(const hz of [41.2,55,73.42]){
   const detected=autoCorrelate(signal(hz,{sub}),RATE);
   assert.notEqual(detected,-1,`${hz} Hz with a ${sub*100}% sub-octave went unread`);
   assert.ok(centsOff(detected,hz)<50,
    `${hz} Hz with a ${sub*100}% sub-octave read as ${detected.toFixed(2)} Hz`);
  }
 }
});

test("a missing or weak fundamental still names the right note",()=>{
 // A bass through a small speaker has almost no energy at the fundamental,
 // and the note is still that note.
 const weak=autoCorrelate(signal(41.2,{harmonics:[.15,1,.7,.4,.2]}),RATE);
 assert.ok(centsOff(weak,41.2)<50,`weak fundamental read as ${weak.toFixed(2)} Hz`);

 const missing=autoCorrelate(signal(41.2,{harmonics:[0,1,.7,.45,.25]}),RATE);
 assert.ok(centsOff(missing,41.2)<50,`missing fundamental read as ${missing.toFixed(2)} Hz`);
});

test("noise degrades the reading gradually rather than catastrophically",()=>{
 /*
  * The old detector was not merely worse under noise, it was unpredictable:
  * ten per cent read a low E as 905 Hz and twenty per cent read it correctly.
  */
 let worst=0;
 for(const noise of [.05,.1,.15,.2]){
  const detected=autoCorrelate(signal(41.2,{noise}),RATE);
  assert.notEqual(detected,-1,`${noise*100}% noise went unread`);
  const off=centsOff(detected,41.2);
  assert.ok(off<50,`${noise*100}% noise read as ${detected.toFixed(2)} Hz (${off.toFixed(0)} cents)`);
  worst=Math.max(worst,off);
 }
 assert.ok(worst<40,`the worst noisy reading was ${worst.toFixed(0)} cents out`);
});

test("a decaying pluck reads the same as a sustained one",()=>{
 for(const decay of [0,3,6,10]){
  const detected=autoCorrelate(signal(41.2,{decay}),RATE);
  assert.ok(centsOff(detected,41.2)<50,
   `decay ${decay} read as ${detected.toFixed(2)} Hz`);
 }
});

test("the reading is accurate enough to tune with",()=>{
 // A tuner needs cents, not semitones. Whole-sample periods alone are worth
 // tens of cents at the top of the range, so the peak is interpolated.
 for(const hz of [41.2,55,82.41,110,146.83,220,440]){
  const detected=autoCorrelate(signal(hz),RATE);
  assert.ok(centsOff(detected,hz)<15,
   `${hz} Hz read as ${detected.toFixed(2)} Hz, ${centsOff(detected,hz).toFixed(0)} cents out`);
 }
});

test("the tracker waits for agreement before it reports anything",()=>{
 const tracker=createPitchTracker();
 assert.equal(tracker.feed(110),-1,"one frame is not enough");
 assert.equal(tracker.feed(110),-1,"nor two");
 assert.ok(Math.abs(tracker.feed(110)-110)<1,"three agreeing frames is");
});

test("one bad frame does not disturb a settled note",()=>{
 /*
  * The old rule accepted any three consecutive frames that matched exactly,
  * which both trusted three identical mistakes and dropped a steady note whose
  * reading wobbled by a single sample of period.
  */
 const tracker=createPitchTracker();
 for(let i=0;i<5;i++)tracker.feed(110);
 const settled=tracker.feed(880);            // one wild frame
 assert.ok(Math.abs(settled-110)<3,`a single outlier moved the reading to ${settled}`);

 // But a real change of note does come through, once it is the majority.
 let latest=settled;
 for(let i=0;i<4;i++)latest=tracker.feed(220);
 assert.ok(Math.abs(latest-220)<3,`the new note was not adopted (${latest})`);
});

test("silence forgets the note rather than holding it",()=>{
 const tracker=createPitchTracker();
 for(let i=0;i<5;i++)tracker.feed(110);
 let quiet=-1;
 for(let i=0;i<5;i++)quiet=tracker.feed(-1);
 assert.equal(quiet,-1,"the note should not survive a run of empty frames");
});

test("a weak fundamental is protected, which is the other side of that trade",()=>{
 /*
  * The limit, stated rather than hidden.
  *
  * A partial an octave under the note and a note with a weak fundamental make
  * the same shape in the curve — a clear peak, and a perfect one at exactly
  * twice its lag. Nothing in the signal says which is the note. The detector is
  * tuned to protect the weak fundamental, because a thin low end is what every
  * small speaker and DI produces while few rooms add a whole octave underneath.
  *
  * So a sub-octave past roughly a fifth of the fundamental is read as the note,
  * and that is the price of the line above passing.
  */
 for(const harmonics of [[.15,1,.7,.4,.2],[0,1,.7,.45,.25],[.05,1,.8,.5]]){
  const detected=autoCorrelate(signal(41.2,{harmonics}),RATE);
  assert.ok(centsOff(detected,41.2)<50,
   `a thin fundamental read as ${detected.toFixed(2)} Hz instead of 41.2`);
 }
});

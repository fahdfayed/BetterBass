import assert from "node:assert/strict";
import test from "node:test";
import {autoCorrelate,centsToNote,labelFor,midiHz,PITCH_RMS_GATE,tensionFor} from "../src/pitch.ts";

const RATE=48000,FFT=4096;

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

import {test} from "node:test";
import assert from "node:assert/strict";
import {
 computeNoteEvent, INITIAL_DETECTOR_STATE, stepDetector, forceCloseNote,
 bassMidiFor, droneVoicing, shouldClick, beatPosition, chordRootPc, weatherLabel,
 noiseEnvelope,
} from "../src/synth.ts";
import {midiHz} from "../src/pitch.ts";

const harmony={ri:0,chordTones:[0,3,7,10],color:4,scale:[0,2,3,5,7,8,10]};

test("computeNoteEvent quantizes to the nearest beat and carries the harmonic function",()=>{
 // A root note played exactly on beat 3 of a 120 BPM take (0.5s per beat).
 const open={midi:36,start:1000,amp:.1};
 const event=computeNoteEvent(open,1200,120,0,harmony,1);
 assert.equal(event.beat,3);
 assert.equal(event.offset,0);
 assert.equal(event.fn,"ROOT");
 assert.equal(event.tension,0);
 assert.equal(event.dur,200);
});

test("computeNoteEvent's meter parameter generalizes the beat count without changing the meter-4 default",()=>{
 const open={midi:40,start:0,amp:.1};
 const default4=computeNoteEvent(open,100,120,0,harmony,1);
 const explicit4=computeNoteEvent(open,100,120,0,harmony,1,4);
 assert.equal(default4.beat,explicit4.beat);
 const inFive=computeNoteEvent(open,100,120,0,harmony,1,5);
 assert.ok(inFive.beat>=1&&inFive.beat<=5);
});

test("stepDetector requires two frames before it commits to a note, then survives a boundary flicker",()=>{
 let state=INITIAL_DETECTOR_STATE;
 const hz=midiHz(45);
 // First frame: not yet stable, no heard effect fired.
 let result=stepDetector(state,{hz,rms:.05,now:0});
 state=result.state;
 assert.equal(result.effects.some(e=>e.type==="heard"),false);
 // Second frame at the same pitch: stability reached.
 result=stepDetector(state,{hz,rms:.05,now:16});
 state=result.state;
 assert.ok(result.effects.some(e=>e.type==="heard"&&e.midi===45));
 // A held note sitting near a semitone boundary can round to the ADJACENT
 // midi on a noisy frame (52 cents from 45 rounds to 46, since >50), but is
 // still close enough to the candidate's own pitch to be the same sustain —
 // this must not be treated as the note ending.
 const flickerHz=midiHz(45)*Math.pow(2,52/1200);
 result=stepDetector(state,{hz:flickerHz,rms:.05,now:32});
 assert.equal(result.effects.some(e=>e.type==="noteOff"),false);
 assert.equal(result.state.activeNote.midi,45);
});

test("stepDetector treats a genuinely different pitch as a new note",()=>{
 let state=INITIAL_DETECTOR_STATE;
 const first=midiHz(40),second=midiHz(52); // an octave apart, well outside tolerance
 state=stepDetector(state,{hz:first,rms:.05,now:0}).state;
 state=stepDetector(state,{hz:first,rms:.05,now:16}).state;
 assert.equal(state.activeNote.midi,40);
 // First frame at the new pitch: not yet stable, old note still open.
 state=stepDetector(state,{hz:second,rms:.05,now:32}).state;
 assert.equal(state.activeNote.midi,40);
 // Second frame at the new pitch: stability reached, old note closes.
 const result=stepDetector(state,{hz:second,rms:.05,now:48});
 assert.ok(result.effects.some(e=>e.type==="noteOff"&&e.note.midi===40));
 assert.ok(result.effects.some(e=>e.type==="heard"&&e.midi===52));
});

test("stepDetector closes a held note and clears 'heard' once enough time has passed with no pitch",()=>{
 let state=INITIAL_DETECTOR_STATE;
 const hz=midiHz(43);
 state=stepDetector(state,{hz,rms:.05,now:0}).state;
 state=stepDetector(state,{hz,rms:.05,now:16}).state;
 assert.ok(state.activeNote);
 // Silence for less than the threshold: nothing closes yet.
 let result=stepDetector(state,{hz:-1,rms:0,now:60});
 assert.equal(result.effects.some(e=>e.type==="noteOff"),false);
 state=result.state;
 // Silence past the threshold: the note closes and "heard" clears.
 result=stepDetector(state,{hz:-1,rms:0,now:200});
 assert.ok(result.effects.some(e=>e.type==="noteOff"));
 assert.ok(result.effects.some(e=>e.type==="heardCleared"));
 assert.equal(result.state.activeNote,null);
});

test("a quiet reading shortly after a loud attack is read as the string being muted, not a second note",()=>{
 /*
  * A real bass player's own account of a false-positive: touching or muting
  * the strings right after playing a note was being scored as a wrong
  * answer. A deliberate pluck is unmistakably louder than the hand settling
  * back onto the strings afterward — this is that contrast, made concrete.
  */
 let state=INITIAL_DETECTOR_STATE;
 const attack=midiHz(28);
 state=stepDetector(state,{hz:attack,rms:.15,now:0}).state;
 state=stepDetector(state,{hz:attack,rms:.15,now:16}).state;
 assert.equal(state.heardMidi,28,"the deliberate attack itself must register");

 // Silence past the threshold clears the note, the way any note-off does.
 state=stepDetector(state,{hz:-1,rms:0,now:32}).state;
 state=stepDetector(state,{hz:-1,rms:0,now:140}).state;
 assert.equal(state.heardMidi,null);

 // A quiet touch on a different string, well within the mute window, at
 // 13% of the attack's loudness -- read as incidental, not a new note.
 const touch=midiHz(33);
 state=stepDetector(state,{hz:touch,rms:.02,now:156}).state;
 const result=stepDetector(state,{hz:touch,rms:.02,now:172});
 assert.equal(result.effects.some(e=>e.type==="heard"),false,
  "a reading this quiet, this soon after a loud attack, should not be scored as a played note");
 assert.equal(result.state.heardMidi,null);
});

test("the mute guard does not swallow a genuinely deliberate quieter note played later",()=>{
 let state=INITIAL_DETECTOR_STATE;
 const attack=midiHz(28);
 state=stepDetector(state,{hz:attack,rms:.15,now:0}).state;
 state=stepDetector(state,{hz:attack,rms:.15,now:16}).state;
 state=stepDetector(state,{hz:-1,rms:0,now:32}).state;
 state=stepDetector(state,{hz:-1,rms:0,now:140}).state;

 // Same quietness as the suppressed case above, but outside the mute
 // window: dynamics vary intentionally, and enough time has passed that
 // this reads as its own new note rather than a lingering hand.
 const later=midiHz(33);
 state=stepDetector(state,{hz:later,rms:.02,now:400}).state;
 const result=stepDetector(state,{hz:later,rms:.02,now:416});
 assert.ok(result.effects.some(e=>e.type==="heard"&&e.midi===33),
  "a deliberate quiet note played with room to breathe must still register");
});

test("forceCloseNote flushes an open note on demand and is a no-op with nothing open",()=>{
 let state=INITIAL_DETECTOR_STATE;
 assert.deepEqual(forceCloseNote(state,10).effects,[]);
 const hz=midiHz(38);
 state=stepDetector(state,{hz,rms:.05,now:0}).state;
 state=stepDetector(state,{hz,rms:.05,now:16}).state;
 const closed=forceCloseNote(state,500);
 assert.equal(closed.effects.length,1);
 assert.equal(closed.effects[0].type,"noteOff");
 assert.equal(closed.effects[0].note.midi,38);
 assert.equal(closed.state.activeNote,null);
});

test("bassMidiFor keeps every pitch class in the same bass-register split",()=>{
 assert.equal(bassMidiFor(0),48); // C -> up an octave
 assert.equal(bassMidiFor(3),51); // D# -> up an octave
 assert.equal(bassMidiFor(4),40); // E -> stays low
 assert.equal(bassMidiFor(11),47); // B -> stays low
});

test("droneVoicing is a root plus a fifth in bassMidiFor's register",()=>{
 const voicing=droneVoicing(9); // A
 assert.equal(voicing.root,bassMidiFor(9));
 assert.equal(voicing.fifth,voicing.root+7);
});

test("shouldClick's '2 & 4' and 'Beat 4' reproduce the original 4/4 beats exactly",()=>{
 for(let beat=1;beat<=4;beat++){
  const expected24=beat===2||beat===4;
  assert.equal(shouldClick("2 & 4",beat,1,beat-1,4),expected24);
  const expectedBeat4=beat===4;
  assert.equal(shouldClick("Beat 4",beat,1,beat-1,4),expectedBeat4);
 }
});

test("shouldClick generalizes sensibly to odd meters instead of only ever matching beat 4",()=>{
 // 5/4: "Beat 4" still exists as a real beat, "2 & 4" picks a middle beat and the last beat.
 assert.equal(shouldClick("Beat 4",4,1,3,5),true);
 assert.equal(shouldClick("2 & 4",5,1,4,5),true);
 // 3/4: there is no beat 4, so it falls back to the last beat rather than never firing.
 assert.equal(shouldClick("Beat 4",3,1,2,3),true);
 assert.equal(shouldClick("Beat 4",1,1,0,3),false);
});

test("beatPosition and chordRootPc agree with the original inline arithmetic",()=>{
 assert.deepEqual(beatPosition(0,4),{beat:1,bar:1});
 assert.deepEqual(beatPosition(5,4),{beat:2,bar:2});
 assert.equal(chordRootPc(2,[0,3,5,0],9),(9+3+12)%12);
});

test("weatherLabel cycles through the four named stages",()=>{
 assert.deepEqual([1,2,3,4].map(weatherLabel),["Stable","Darkening","Increasing tension","Release"]);
});

test("noiseEnvelope decays toward silence and never exceeds unit amplitude",()=>{
 const env=noiseEnvelope(2000);
 const early=Math.abs(env.slice(0,50).reduce((a,v)=>a+Math.abs(v),0)/50);
 const late=Math.abs(env.slice(-50).reduce((a,v)=>a+Math.abs(v),0)/50);
 assert.ok(early>late,"average amplitude should be higher near the start than the end");
 assert.ok([...env].every(v=>v>=-1&&v<=1));
});

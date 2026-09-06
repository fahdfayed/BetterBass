/**
 * BassLab's DSP and scheduling logic, kept free of React and WebAudio so it
 * can be exercised directly by tests/synth.test.mjs — the same split pitch.ts
 * and audio-clock.ts already made for pitch detection and lookahead timing.
 * This is the third piece: what a held note scores as, whether the onset
 * detector thinks a note just started or ended, what to play on which beat,
 * and the shape of the click's noise burst.
 */

import {centsToNote,midiHz,PITCH_MAX_HZ,PITCH_MIN_HZ,tensionFor,labelFor,NOTE_NAMES,type Harmony,type NoteEvent} from "./pitch.ts";

// ============================================================ event scoring

export type OpenNote={midi:number;start:number;amp:number};

/**
 * Turns an open note into a scored NoteEvent: which beat it landed on, how
 * far from the grid, and its harmonic function. `meter` generalizes what was
 * a hardcoded 4 — passing 4 (the default) reproduces the original math
 * exactly; other meters are usable once a caller tracks them for a take.
 */
export function computeNoteEvent(open:OpenNote,end:number,bpm:number,takeStart:number,harmony:Harmony,id:number,meter=4):NoteEvent{
 const pc=(open.midi%12+12)%12;
 const elapsed=(open.start-takeStart)/1000;
 const beatFloat=elapsed/(60/bpm);
 const beat=Math.floor(beatFloat)%meter+1;
 const offset=Math.round((beatFloat-Math.round(beatFloat))*60000/bpm);
 return{
  id,midi:open.midi,n:NOTE_NAMES[pc],oct:Math.floor(open.midi/12)-1,
  start:open.start,end,dur:Math.max(30,end-open.start),amp:open.amp,
  beat,offset,fn:labelFor(pc,harmony),tension:tensionFor(pc,harmony),resolution:"pending",
 };
}

// ================================================ onset / silence detector

export type DetectorState={
 candidateMidi:number|null;
 framesAtCandidate:number;
 activeNote:OpenNote|null;
 heardMidi:number|null;
 lastSoundAt:number|null;
 /** Loudness of the most recent genuine note's onset, and when it happened. */
 attackRms:number;
 attackAt:number|null;
};

export const INITIAL_DETECTOR_STATE:DetectorState={
 candidateMidi:null,framesAtCandidate:0,activeNote:null,heardMidi:null,lastSoundAt:null,
 attackRms:0,attackAt:null,
};

export type DetectorEffect=
 |{type:"pitch";note:ReturnType<typeof centsToNote>}
 |{type:"historyAppend";midi:number}
 |{type:"heard";midi:number;at:number}
 |{type:"heardCleared"}
 |{type:"noteOff";note:OpenNote;end:number};

const STABILITY_FRAMES=2;
/**
 * A true pitch sitting right on a semitone boundary rounds to whichever side
 * the noise pushes it to, which can be just past 50 cents from either
 * neighbour's centre. The tolerance has to clear that worst case — anything
 * under 50 would still reset on the exact flicker it's meant to survive — so
 * it sits a little past it rather than exactly on the edge.
 */
const STABILITY_CENTS=60;
const SILENCE_MS=90;
/**
 * A plucked string is unmistakably louder than the hand settling back onto it
 * afterward — a real bass players' own account of the false-positive this
 * guards against. Within MUTE_WINDOW_MS of a genuine onset, a new candidate
 * quieter than MUTE_REJECT_RATIO of that onset is read as the string being
 * damped, not a second note. Both are conservative on purpose: this only
 * catches noise dramatically quieter than the note that just rang, so a
 * deliberately softer note played with a beat or so of room to breathe is
 * never at risk of being swallowed by it.
 */
const MUTE_WINDOW_MS=250;
const MUTE_REJECT_RATIO=.18;

const centsFromMidi=(hz:number,midi:number)=>1200*Math.log2(hz/midiHz(midi));

/**
 * A held note's rounded-to-nearest-semitone reading can flicker between two
 * adjacent values right at a boundary — a slightly flat string, room noise —
 * which the old check (exact MIDI match, twice in a row) could never survive:
 * every flicker reset the count to 1. This measures how far the raw pitch
 * sits from the CANDIDATE it is already tracking rather than from its own
 * rounded value, so a genuine sustain survives the flicker instead of never
 * reaching the stability threshold.
 *
 * Silence is timestamp-based rather than a frame count for the same reason
 * frame counts are fragile everywhere else: `requestAnimationFrame` doesn't
 * promise a fixed rate, so "5 frames" is a different amount of silence on a
 * 30Hz display than a 144Hz one.
 */
export function stepDetector(state:DetectorState,sample:{hz:number,rms:number,now:number}):{state:DetectorState,effects:DetectorEffect[]}{
 const effects:DetectorEffect[]=[];
 const next:DetectorState={...state};
 if(sample.hz>PITCH_MIN_HZ&&sample.hz<PITCH_MAX_HZ){
  const note=centsToNote(sample.hz);
  effects.push({type:"pitch",note});
  next.lastSoundAt=sample.now;
  if(next.candidateMidi===null||Math.abs(centsFromMidi(sample.hz,next.candidateMidi))>STABILITY_CENTS){
   next.candidateMidi=note.midi;
   next.framesAtCandidate=1;
  }else{
   next.framesAtCandidate+=1;
  }
  if(next.framesAtCandidate>=STABILITY_FRAMES){
   const midi=next.candidateMidi;
   if(next.activeNote&&next.activeNote.midi!==midi){
    effects.push({type:"noteOff",note:next.activeNote,end:sample.now});
    next.activeNote=null;
   }
   if(!next.activeNote)next.activeNote={midi,start:sample.now,amp:sample.rms};
   effects.push({type:"historyAppend",midi});
   if(next.heardMidi!==midi){
    const isMuting=next.attackAt!==null
     &&sample.now-next.attackAt<MUTE_WINDOW_MS
     &&sample.rms<next.attackRms*MUTE_REJECT_RATIO;
    if(!isMuting){
     next.heardMidi=midi;
     next.attackRms=sample.rms;
     next.attackAt=sample.now;
     effects.push({type:"heard",midi,at:sample.now});
    }
   }
  }
 }else{
  next.candidateMidi=null;
  next.framesAtCandidate=0;
  if(next.lastSoundAt!==null&&sample.now-next.lastSoundAt>SILENCE_MS){
   if(next.activeNote){
    effects.push({type:"noteOff",note:next.activeNote,end:sample.now});
    next.activeNote=null;
   }
   if(next.heardMidi!==null){
    next.heardMidi=null;
    effects.push({type:"heardCleared"});
   }
  }
 }
 return{state:next,effects};
}

/**
 * Flushes whatever note is open on demand — ending a take or toggling the
 * microphone off both need this, not just the detector noticing silence on
 * its own. Unlike the original `finishEvent`, this always clears the open
 * note: the original only cleared it while a take was recording, so a note
 * left hanging while not recording could sit stale until the next take
 * started and then be pushed into it with a start time from long before
 * that take began.
 */
export function forceCloseNote(state:DetectorState,end:number):{state:DetectorState,effects:DetectorEffect[]}{
 if(!state.activeNote)return{state,effects:[]};
 return{state:{...state,activeNote:null},effects:[{type:"noteOff",note:state.activeNote,end}]};
}

// ============================================================== bass voice

/**
 * Folds a pitch class into the lab's drone/audition register: C through D♯
 * sit an octave above E through B, so the low end of that split never dips
 * below the open strings while every pitch class stays in reach.
 */
export function bassMidiFor(pc:number):number{
 const p=(pc+12)%12;
 return 36+p+(p<4?12:0);
}

/** The backing band's drone: a root plus a fifth, in the same register. */
export function droneVoicing(root:number):{root:number,fifth:number}{
 const midi=bassMidiFor(root);
 return{root:midi,fifth:midi+7};
}

// =============================================================== groove

export type ClickMode="Every beat"|"2 & 4"|"Beat 4"|"Every 2 bars"|"Disappearing";

/**
 * Every mode used to test a literal beat number (`beat===2||beat===4`),
 * which only means "backbeat" in a four-beat bar — and this lab's meter is
 * user-selectable from 3 to 7. Generalized so "2 & 4" becomes "the middle
 * beat and the last beat" and "Beat 4" becomes "the last beat, or 4 if the
 * bar is long enough to have one" — both resolve to the exact original
 * beats when meter is 4, which is still every existing caller.
 */
export function shouldClick(mode:ClickMode,beat:number,bar:number,step:number,meter:number):boolean{
 switch(mode){
  case "Every beat":return true;
  case "2 & 4":{
   if(meter<=2)return true;
   const mid=Math.round(meter/2);
   return beat===mid||beat===meter;
  }
  case "Beat 4":return beat===Math.min(4,meter);
  case "Every 2 bars":return bar%2===0&&beat===1;
  case "Disappearing":return Math.floor(step/meter)%8<4;
 }
}

export function beatPosition(step:number,meter:number):{beat:number,bar:number}{
 return{beat:step%meter+1,bar:Math.floor(step/meter)%4+1};
}

export function chordRootPc(bar:number,progression:number[],root:number):number{
 return(root+progression[bar-1]+12)%12;
}

export function weatherLabel(bar:number):string{
 return bar===1?"Stable":bar===2?"Darkening":bar===3?"Increasing tension":"Release";
}

// ========================================================== noise envelope

/**
 * The click's noise burst was a straight linear fade — audibly a buzzy ramp
 * rather than a percussive hit, because real transients decay fast at first
 * and slow down rather than falling at a constant rate. This layers a very
 * fast exponential "crack" (most of its decay in the first few percent)
 * under a slower exponential "body", closer to how a struck or plucked
 * transient actually behaves than either curve alone.
 */
export function noiseEnvelope(length:number):Float32Array{
 const out=new Float32Array(length);
 for(let i=0;i<length;i++){
  const t=i/length;
  const body=Math.exp(-t*5.5);
  const crack=Math.exp(-t*40);
  out[i]=(Math.random()*2-1)*(body*.75+crack*.25);
 }
 return out;
}

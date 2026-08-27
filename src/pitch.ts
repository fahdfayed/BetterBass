/**
 * Monophonic pitch detection and harmonic labelling.
 *
 * Kept free of React and of the DOM so it can be exercised directly by
 * tests/pitch.test.mjs — this is the measurement every practice take is scored
 * against, and it was previously unreachable inside a 1,500 line component.
 */

export const NOTE_NAMES=["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];

/** A four-string bass reaches down to 41 Hz; a five-string low B to 31 Hz. */
export const PITCH_MIN_HZ=30,PITCH_MAX_HZ=1000,PITCH_RMS_GATE=.012;

export const midiHz=(midi:number)=>440*Math.pow(2,(midi-69)/12);

export function centsToNote(hz:number){
 const midi=Math.round(69+12*Math.log2(hz/440)),freq=midiHz(midi);
 return {midi,hz,n:NOTE_NAMES[(midi%12+12)%12],oct:Math.floor(midi/12)-1,cents:Math.round(1200*Math.log2(hz/freq))};
}

/**
 * One note the listening engine heard, with everything it worked out about it.
 *
 * `fn` and `tension` are the note's function against the harmony it was played
 * over; `resolution` is filled in once the following note is known, so it is
 * "recovered", "unresolved" or a dash rather than a judgment made on the spot.
 */
export type NoteEvent={
 id:number,midi:number,n:string,oct:number,
 start:number,end:number,dur:number,amp:number,
 beat:number,offset:number,
 fn:string,tension:number,resolution:string,
};

/** The harmony a note is judged against: home, chord tones, modal colour, scale. */
export type Harmony={ri:number,chordTones:number[],color:number,scale:number[]};
export const tensionFor=(ni:number,h:Harmony)=>ni===h.ri?0:h.chordTones.includes(ni)?1:ni===h.color?2:h.scale.includes(ni)?3:4;
export const labelFor=(ni:number,h:Harmony)=>ni===h.ri?"ROOT":h.chordTones.includes(ni)?"CHORD":ni===h.color?"COLOUR":h.scale.includes(ni)?"EXTENSION":"OUTSIDE";

const COARSE_STEP=4,PEAK_RATIO=.9;
// Reused across frames: this runs on every animation frame while the mic is on.
let coarseScores=new Float64Array(0);

/**
 * Autocorrelation pitch detector. Returns the detected frequency, or -1 when the
 * buffer is too quiet or no periodicity stands out.
 */
export function autoCorrelate(b:Float32Array,rate:number){
 let rms=0;for(const x of b)rms+=x*x;rms=Math.sqrt(rms/b.length);
 if(rms<PITCH_RMS_GATE)return -1;
 const minLag=Math.max(2,Math.floor(rate/PITCH_MAX_HZ)),maxLag=Math.min(b.length-1,Math.ceil(rate/PITCH_MIN_HZ));
 if(maxLag<=minLag)return -1;
 // Fixed correlation window. Summing b.length-lag products, as this used to,
 // scored short lags higher purely because they summed more terms — and capped
 // the search at lag 1000, which puts a low E (41 Hz) out of reach entirely.
 const window=Math.min(2048,b.length-maxLag);
 if(window<256)return -1;
 const score=(lag:number,stride:number)=>{let sum=0;for(let i=0;i<window;i+=stride)sum+=b[i]*b[i+lag];return sum};

 // Coarse sweep on every fourth lag over every fourth sample. Correlating the
 // whole range at full resolution costs about four million multiply-adds per
 // frame, on the main thread, sixty times a second.
 const count=Math.floor((maxLag-minLag)/COARSE_STEP)+1;
 if(coarseScores.length<count)coarseScores=new Float64Array(count);
 let globalPeak=-Infinity;
 for(let i=0;i<count;i++){const sum=score(minLag+i*COARSE_STEP,COARSE_STEP);coarseScores[i]=sum;if(sum>globalPeak)globalPeak=sum}
 if(globalPeak<=0)return -1;

 // A sustained note correlates just as strongly at every multiple of its period,
 // so the tallest peak is not the fundamental — it is whichever multiple happens
 // to win on rounding, which can be two or three octaves low. Take the *first*
 // peak that comes within PEAK_RATIO of the tallest one instead.
 const threshold=globalPeak*PEAK_RATIO;
 let chosen=-1;
 for(let i=1;i<count-1;i++){
  if(coarseScores[i]>coarseScores[i-1]&&coarseScores[i]>=coarseScores[i+1]&&coarseScores[i]>threshold){chosen=minLag+i*COARSE_STEP;break}
 }
 if(chosen<0)return -1;

 let best=chosen,peak=-Infinity;
 for(let lag=Math.max(minLag,chosen-COARSE_STEP);lag<=Math.min(maxLag,chosen+COARSE_STEP);lag++){const sum=score(lag,1);if(sum>peak){peak=sum;best=lag}}
 return peak>0?rate/best:-1;
}

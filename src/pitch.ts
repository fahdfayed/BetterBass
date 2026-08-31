/**
 * Monophonic pitch detection and harmonic labelling.
 *
 * Kept free of React and of the DOM so it can be exercised directly by
 * tests/pitch.test.mjs — this is the measurement every practice take is scored
 * against, and it was previously unreachable inside a 1,500 line component.
 */

export const NOTE_NAMES=["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];

/** A four-string bass reaches down to 41 Hz; a five-string low B to 31 Hz. */
/*
 * The search range stops just under the lowest note on a bass. Dropping it
 * further to give the boundary some margin backfired: at 27 Hz the octave-down
 * partial of a low A became a legitimate peak of its own and won.
 */
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

/*
 * Pitch detection by the McLeod method: a normalised square difference
 * function, then peak picking across it.
 *
 * A bass is the hard case for this. Low frequencies have long wavelengths — a
 * low B at 30.87 Hz is 1555 samples at 48 kHz — so the analysis window has to
 * hold several of them before there is a period to find at all, and the
 * detector has to resist reporting a subharmonic when the note is played
 * through a cabinet that has one.
 *
 * Raw autocorrelation was doing neither. It read a low E as 905 Hz under ten
 * per cent noise while reading it correctly under twenty, and energy an octave
 * below the note produced no reading at all rather than a wrong one.
 *
 * NSDF is the reason this behaves. It divides the correlation at each lag by
 * the energy actually present at that lag, so its peaks are bounded to ±1 and
 * comparable with each other — which raw correlation's are not. That makes the
 * McLeod rule possible: take the FIRST peak that comes near the tallest rather
 * than the tallest itself. Where a sub-octave partial is present the tallest
 * peak is often the doubled period, and the note is the earlier, slightly
 * shorter one.
 */

/** How far the signal is decimated for the coarse search. */
const DECIMATE=4;
/**
 * How close to the tallest peak another one must come to be preferred for
 * being earlier.
 *
 * This is the one dial that trades the two octave errors against each other,
 * and it cannot be escaped by being cleverer. A partial an octave under the
 * note and a note with a weak fundamental produce the same shape: a clear peak
 * at some lag and a perfect 1.0 at exactly twice it. Which of the two is the
 * note is not recoverable from the curve — only from knowing which is likelier.
 *
 * Lower tolerates more sub-octave before reading down; higher protects the
 * weak fundamental, which is the more common of the two on a bass, since any
 * small speaker or DI thins the fundamental while few rooms add a whole octave
 * underneath. .8 holds a sub-octave up to about a fifth of the fundamental's
 * amplitude and leaves weak fundamentals alone.
 */
const PEAK_RATIO=.8;
/**
 * The weakest peak worth reporting.
 *
 * A note buried under a subharmonic can peak as low as .28, so this sits under
 * that — the caller decides what to trust, and refusing to read a note that is
 * plainly there is worse than reading it with a caveat.
 */
const MIN_CLARITY=.22;

// Reused across frames: this runs on every animation frame while the mic is on.
let decimated=new Float32Array(0);
let clarity=new Float64Array(0);

/**
 * The normalised square difference at `lag`: correlation over the energy that
 * is actually there, so the value means the same thing at every lag.
 */
function nsdf(buffer:Float32Array,lag:number,window:number,offset:number){
 let correlation=0,energy=0;
 for(let i=0;i<window;i++){
  const here=buffer[offset+i],later=buffer[offset+i+lag];
  correlation+=here*later;
  energy+=here*here+later*later;
 }
 return energy>0?2*correlation/energy:0;
}

/**
 * The true peak between three samples of a curve.
 *
 * Without this a reading can only land on a whole sample, which near the top of
 * the range is worth tens of cents — a note read as reliably a third of a
 * semitone sharp is not read reliably.
 */
function refine(before:number,at:number,after:number){
 const curve=2*at-before-after;
 if(curve<=0)return 0;
 const shift=(before-after)/(2*curve);
 return Math.abs(shift)<1?shift:0;
}

/**
 * Detected frequency, or -1 when the buffer is too quiet or nothing repeats
 * clearly enough to name.
 */
export function autoCorrelate(b:Float32Array,rate:number){
 let rms=0;for(const x of b)rms+=x*x;rms=Math.sqrt(rms/b.length);
 if(rms<PITCH_RMS_GATE)return -1;

 /*
  * The coarse search runs on a quarter-rate copy, which costs sixteen times
  * less than the full-rate one. Averaging each group of four rather than
  * dropping three of them keeps harmonics above the decimated Nyquist from
  * folding back down and being mistaken for low partials.
  */
 const short=Math.floor(b.length/DECIMATE);
 if(decimated.length<short)decimated=new Float32Array(short);
 for(let i=0;i<short;i++){
  const j=i*DECIMATE;
  decimated[i]=(b[j]+b[j+1]+b[j+2]+b[j+3])/DECIMATE;
 }

 const coarseRate=rate/DECIMATE;
 const minLag=Math.max(2,Math.floor(coarseRate/PITCH_MAX_HZ));
 const maxLag=Math.min(short-1,Math.ceil(coarseRate/PITCH_MIN_HZ));
 /*
  * Long enough to hold several cycles of the lowest note it will be asked
  * about. Two is the minimum for a period to exist in the window at all, and
  * the old window gave a low B one and a half — which is why the bottom of the
  * range was the least reliable part of it.
  */
 const window=Math.min(1536,short-maxLag);
 if(maxLag<=minLag||window<128)return -1;

 /*
  * Analyse the newest samples rather than the oldest. The buffer holds the last
  * fftSize samples with the oldest first, so starting at index 0 measured a
  * freshly plucked note against the tail of the one before it.
  */
 const offset=Math.max(0,short-window-maxLag);

 if(clarity.length<maxLag+1)clarity=new Float64Array(maxLag+1);
 /*
  * From lag zero, not from minLag.
  *
  * The lobe around zero is skipped by waiting for the curve to go negative, and
  * that only works if the curve is followed from the start. Beginning at minLag
  * meant a note whose period lands just past it — anything near the top of the
  * range — had its own peak swallowed by that skip and was reported an octave
  * down.
  */
 for(let lag=0;lag<=maxLag;lag++)clarity[lag]=nsdf(decimated,lag,window,offset);

 /*
  * Each hump between two upward zero crossings contributes its highest point.
  * The lags nearest the end of the range are excluded: their humps have no far
  * side, so a signal whose real period lies past the range piles up against the
  * wall and reports the bottom of the search instead of the note.
  */
 const edge=maxLag;
 const peaks:Array<[number,number]>=[];
 let lag=0;
 while(lag<edge&&clarity[lag]>0)lag++;          // past the lobe at zero
 while(lag<edge){
  while(lag<edge&&clarity[lag]<=0)lag++;
  let at=lag,value=-Infinity;
  while(lag<edge&&clarity[lag]>0){if(clarity[lag]>value){value=clarity[lag];at=lag}lag++}
  if(value>-Infinity&&at>=minLag)peaks.push([at,value]);
 }
 if(!peaks.length)return -1;

 let tallest=0;
 for(const [,value] of peaks)if(value>tallest)tallest=value;
 if(tallest<MIN_CLARITY)return -1;

 // The first peak that comes near the tallest, which is the McLeod rule.
 const threshold=tallest*PEAK_RATIO;
 const chosen=(peaks.find(([,value])=>value>=threshold)??peaks[0])[0];


 /*
  * The coarse lag is only accurate to four samples, so the neighbourhood is
  * searched again at full rate before interpolating between samples.
  */
 const centre=chosen*DECIMATE;
 const high=centre+DECIMATE+1;
 const fullWindow=Math.min(3072,b.length-high-1);
 if(fullWindow<256)return coarseRate/chosen;

 const fineOffset=Math.max(0,b.length-fullWindow-high-1);
 const low=Math.max(2,centre-DECIMATE);
 if(high<=low)return coarseRate/chosen;

 const at=(candidate:number)=>nsdf(b,candidate,fullWindow,fineOffset);
 let fineLag=low,fineValue=-Infinity;
 for(let candidate=low;candidate<=high;candidate++){
  const value=at(candidate);
  if(value>fineValue){fineValue=value;fineLag=candidate}
 }

 const shift=fineLag>2?refine(at(fineLag-1),fineValue,at(fineLag+1)):0;
 const period=fineLag+shift;
 return period>0?rate/period:-1;
}

/**
 * Smoothing over time, on top of the per-frame detector.
 *
 * A detector that is right nine frames in ten still flickers, because the tenth
 * frame is shown too. The caller used to accept any three consecutive frames
 * that agreed exactly, which both trusts a run of three identical mistakes and
 * throws away a steady note whose reading wobbles by a single sample of period.
 *
 * This keeps a short memory, reports the median of it, and only speaks once
 * enough of that memory agrees with the median to within a tolerance. One bad
 * frame in a settled note changes nothing.
 */
export type PitchTracker={
 /** Feed one reading, or -1 for a frame with nothing in it. */
 feed:(hz:number)=>number;
 /** Forget everything, for when a new note is expected. */
 reset:()=>void;
};

/** Within this, two readings are the same note rather than two notes. */
const AGREEMENT_CENTS=45;

export function createPitchTracker(memory=5,agreement=3):PitchTracker{
 let recent:number[]=[];
 return {
  feed(hz){
   if(hz<=0){
    // Silence forgets one frame at a time, so a note is not dropped by a
    // single gap between plucks.
    recent=recent.slice(1);
    return recent.length>=agreement?median(recent):-1;
   }
   recent=[...recent,hz].slice(-memory);
   if(recent.length<agreement)return -1;

   const middle=median(recent);
   const agreeing=recent.filter(value=>
    Math.abs(1200*Math.log2(value/middle))<=AGREEMENT_CENTS).length;
   return agreeing>=agreement?middle:-1;
  },
  reset(){recent=[]},
 };
}

function median(values:number[]){
 const sorted=[...values].sort((a,b)=>a-b);
 const middle=Math.floor(sorted.length/2);
 return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
}

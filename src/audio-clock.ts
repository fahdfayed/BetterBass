/**
 * Lookahead scheduler for the metronomes and backing parts.
 *
 * A bare setInterval is not usable as a musical clock: it drifts against the
 * audio hardware and browsers clamp it to roughly one second in a hidden tab.
 * Here the timer only decides *when to queue work*; every sound is queued
 * against ctx.currentTime, which is sample accurate. The tempo is read through
 * a callback on each beat so a tempo change applies to the very next beat
 * instead of being frozen into the closure that started playback.
 */

export type BeatHandlers={
 /** Queue audio for `time`, a value on the AudioContext clock. */
 schedule:(beat:number,time:number)=>void;
 /** Optional React state update, deferred until the beat is actually audible. */
 display?:(beat:number)=>void;
};

export type AudioClockOptions={
 /** How often to look for beats that need queueing. */
 lookaheadMs?:number;
 /** How far past `currentTime` to queue. Must exceed lookaheadMs. */
 scheduleAheadSeconds?:number;
 /** Silence before the first beat, so the first sound is never late. */
 startDelaySeconds?:number;
};

export type AudioClock={stop:()=>void};

const MIN_BPM=20,MAX_BPM=400;
const beatSeconds=(bpm:number)=>60/(Number.isFinite(bpm)?Math.min(MAX_BPM,Math.max(MIN_BPM,bpm)):60);

export function startAudioClock(
 ctx:AudioContext,
 tempo:()=>number,
 handlers:BeatHandlers,
 {lookaheadMs=25,scheduleAheadSeconds=.15,startDelaySeconds=.06}:AudioClockOptions={},
):AudioClock{
 let beat=0,nextTime=ctx.currentTime+startDelaySeconds,stopped=false;
 const displayTimers=new Set<number>();

 const show=(index:number,time:number)=>{
  if(!handlers.display)return;
  const delay=Math.max(0,(time-ctx.currentTime)*1000);
  const timer=window.setTimeout(()=>{displayTimers.delete(timer);if(!stopped)handlers.display?.(index)},delay);
  displayTimers.add(timer);
 };

 const pump=()=>{
  if(stopped)return;
  const period=beatSeconds(tempo());
  // A throttled tab (or a suspended machine) can leave nextTime in the past.
  // Queueing those beats would fire them all at once, so skip whole beats
  // forward instead: the pulse stays in phase and the burst never happens.
  const behind=ctx.currentTime-nextTime;
  if(behind>period){const skipped=Math.floor(behind/period);nextTime+=skipped*period;beat+=skipped}
  const horizon=ctx.currentTime+scheduleAheadSeconds;
  while(nextTime<horizon){
   handlers.schedule(beat,nextTime);
   show(beat,nextTime);
   nextTime+=beatSeconds(tempo());
   beat++;
  }
 };

 pump();
 const timer=window.setInterval(pump,lookaheadMs);
 return {
  stop(){
   stopped=true;
   window.clearInterval(timer);
   displayTimers.forEach(id=>window.clearTimeout(id));
   displayTimers.clear();
  },
 };
}

/**
 * Close an AudioContext after a short fade so stopping never clicks.
 *
 * Callers must pass the context itself rather than reading it back out of a ref
 * inside the timeout: the ref is normally cleared on the same tick, which would
 * leave the context open forever and eventually exhaust the browser's limit.
 */
export function fadeAndClose(ctx:AudioContext,gain?:GainNode,fadeSeconds=.05){
 if(gain){
  try{
   gain.gain.cancelScheduledValues(ctx.currentTime);
   gain.gain.setValueAtTime(Math.max(.0001,gain.gain.value),ctx.currentTime);
   gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+fadeSeconds);
  }catch{/* a closing context rejects further automation; closing is what matters */}
 }
 window.setTimeout(()=>{if(ctx.state!=="closed")void ctx.close()},Math.ceil(fadeSeconds*1000)+30);
}

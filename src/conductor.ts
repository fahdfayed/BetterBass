/**
 * The clock the whole interface obeys.
 *
 * Every site has animation. This one has time feel, which is a different
 * property and the only one that matters on a musical instrument. The
 * transport already runs a real clock with a tempo, a beat and a bar; the
 * conductor publishes that clock to the rest of the document so nothing has to
 * invent its own timing.
 *
 * Two things follow from it.
 *
 * Durations stop being milliseconds somebody picked and become musical values.
 * A press is a thirty-second note, a panel slide is a sixteenth, a route change
 * is an eighth. At 60bpm the interface is languid and at 160 it is urgent,
 * because those are the same interface at different tempos, which is exactly
 * what happens to a band.
 *
 * And navigation lands in time. Click a rail item halfway through a bar and the
 * screen changes on the next eighth, not at the arbitrary instant your finger
 * happened to move. Musicians do not change at random moments; they change on
 * the beat, and an interface that does the same stops feeling like a website.
 *
 * When the transport is stopped, none of this applies: nothing pulses, nothing
 * waits, and navigation is immediate. The pulse is information, so it only
 * exists while there is something to be in time with.
 */

type Clock={
 /** Beats per minute, as the transport currently has it. */
 tempo:number;
 running:boolean;
 /** performance.now() at the last beat the transport reported. */
 markAt:number;
 /** Which beat of the bar that was, 0 to 3. */
 markBeat:number;
};

const clock:Clock={tempo:84,running:false,markAt:0,markBeat:0};

/** Longest a quantised action will ever wait. Beyond this it stops reading as
 *  musical and starts reading as lag, whatever the tempo says. */
const MAX_WAIT_MS=400;

const root=()=>typeof document==="undefined"?null:document.documentElement;

/** Seconds per beat at the current tempo. */
export const beatSeconds=()=>60/clock.tempo;

/**
 * Publish musical time to CSS.
 *
 * Stylesheets can then express a duration as a fraction of a beat, so the whole
 * interface speeds up and slows down together without a single hard-coded
 * millisecond.
 */
function publish(){
 const el=root();if(!el)return;
 const beat=beatSeconds()*1000;
 el.style.setProperty("--beat-ms",`${beat.toFixed(1)}ms`);
 el.style.setProperty("--bar-ms",`${(beat*4).toFixed(1)}ms`);
 el.style.setProperty("--eighth-ms",`${(beat/2).toFixed(1)}ms`);
 el.style.setProperty("--sixteenth-ms",`${(beat/4).toFixed(1)}ms`);
 el.style.setProperty("--thirtysecond-ms",`${(beat/8).toFixed(1)}ms`);
 el.dataset.running=clock.running?"true":"false";
}

/**
 * The transport calls this on every beat it schedules.
 *
 * It is the only writer. The conductor deliberately does not run a clock of its
 * own: two clocks in one program drift apart, and the one that matters is the
 * one making the sound.
 */
export function markBeat(beatOfBar:number,tempo:number){
 clock.markAt=performance.now();
 clock.markBeat=beatOfBar;
 clock.tempo=tempo;
 clock.running=true;
 publish();
 const el=root();
 if(el){
  el.dataset.beat=String(beatOfBar);
  // The downbeat is a different event from the other three, and the interface
  // is allowed to know that.
  el.dataset.downbeat=beatOfBar===0?"true":"false";
 }
}

export function stopClock(){
 clock.running=false;
 publish();
 const el=root();
 if(el){delete el.dataset.beat;delete el.dataset.downbeat}
}

export function setTempo(tempo:number){
 clock.tempo=tempo;
 publish();
}

/** Milliseconds until the next eighth-note boundary, or 0 when stopped. */
export function untilNextEighth(){
 if(!clock.running)return 0;
 const eighth=beatSeconds()*500;
 const since=performance.now()-clock.markAt;
 if(since<0)return 0;
 const wait=eighth-(since%eighth);
 return wait>MAX_WAIT_MS?0:wait;
}

/**
 * Run something in time.
 *
 * Stopped, this is a plain call and costs nothing. Running, it waits for the
 * next eighth so the change lands with the music rather than beside it. The
 * wait is capped, because an interface that makes you wait to feel musical has
 * misunderstood which of the two matters.
 */
export function inTime(run:()=>void){
 const wait=untilNextEighth();
 if(wait<=0){run();return}
 window.setTimeout(run,wait);
}

/** Set the initial values so CSS has something before the first beat. */
export function startConductor(){publish()}

import Glyph from "./Glyph";
import {TEMPO_MAX,TEMPO_MIN,useTransport} from "../useTransport";

/**
 * The transport, along the bottom edge of the book.
 *
 * Playback state used to live inside whichever screen owned it, so leaving a
 * lesson stopped the click and losing your place in a progression meant
 * navigating back to find the controls again. A transport belongs on the
 * chassis, not on the page.
 *
 * It reads left to right the way the strip under a score does: the key you
 * press, where you are, how fast, how it repeats, what it is listening to, and
 * how loud. Nothing here is decorative and nothing here is a link.
 *
 * Two things about how it is drawn.
 *
 * The play key is the one vermillion fill in the chrome, and it is a filled
 * triangle rather than a stroked one, because that is what it is on every
 * piece of equipment that has ever had one. A 1.5px outlined triangle is a
 * website's idea of a play button.
 *
 * Every other icon here is drawn at one stroke weight, from this file, in the
 * same hand: a loop is a circular arrow, a count-in is a raised hand, input
 * off is a barred circle. None of them is a Unicode character standing in for
 * an icon, which is the thing that always looks borrowed.
 */

type Props={
 /** Live input, already resolved by the shell. */
 input:{listening:boolean;detail:string};
 onToggleInput:()=>void;
 inputBusy?:boolean;
};

/* One stroke weight, round joins, 20-unit box. Every icon below shares them. */
const stroke={fill:"none",stroke:"currentColor",strokeWidth:1.5,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};

const LoopIcon=()=>(
 <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true" {...stroke}>
  <path d="M4 8.5a6 6 0 0 1 10.2-3.2M16 11.5A6 6 0 0 1 5.8 14.7"/>
  <path d="M14.6 2.6v2.9h-2.9M5.4 17.4v-2.9h2.9"/>
 </svg>
);

const CountInIcon=()=>(
 <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true" {...stroke}>
  <path d="M7.2 9.4V4.6a1.1 1.1 0 0 1 2.2 0v4M9.4 8.6V3.8a1.1 1.1 0 0 1 2.2 0v4.6M11.6 8.8V5.3a1.1 1.1 0 0 1 2.2 0v5"/>
  <path d="M7.2 9.4 5.6 11a1.4 1.4 0 0 0-.2 1.7l1.7 2.9a3.6 3.6 0 0 0 3.1 1.8h1.5a3.6 3.6 0 0 0 3.6-3.6v-3.5"/>
 </svg>
);

const InputIcon=({live}:{live:boolean})=>(
 <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true" {...stroke}>
  {live
   /* Listening: a capsule with the pickup arc under it. */
   ?<><rect x="7.4" y="2.4" width="5.2" height="9.2" rx="2.6"/>
      <path d="M4.6 9.4a5.4 5.4 0 0 0 10.8 0M10 14.8v2.8"/></>
   /* Off: the same capsule, barred. */
   :<><rect x="7.4" y="2.4" width="5.2" height="9.2" rx="2.6"/>
      <path d="M4.6 9.4a5.4 5.4 0 0 0 10.8 0M10 14.8v2.8M3.4 3.4l13.2 13.2"/></>}
 </svg>
);

const LevelIcon=()=>(
 <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true" {...stroke}>
  <path d="M4 7.6h2.6L10.4 4v12l-3.8-3.6H4z"/>
  <path d="M13.4 7.6a3.4 3.4 0 0 1 0 4.8"/>
 </svg>
);

export default function Transport({input,onToggleInput,inputBusy}:Props){
 const t=useTransport();

 return (
  <div className="transport" role="region" aria-label="Transport">
   {/* ------------------------------------------------------------ the key */}
   {/*
     * The one filled vermillion element in the chrome. It is a key rather than
     * a button: it is the full height of the bar, it is at the corner where a
     * hand reaches for it, and it is the only thing here that changes the
     * state of the whole application.
     */}
   <button
    type="button"
    className={`tKey ${t.running?"on":""}`}
    onClick={t.toggle}
    aria-pressed={t.running}
    aria-label={t.running?"Stop the click":"Start the click"}
   >
    {t.running
     ?<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><rect x="3" y="2.5" width="4.4" height="13" fill="currentColor"/><rect x="10.6" y="2.5" width="4.4" height="13" fill="currentColor"/></svg>
     :<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><path d="M4 2.2 16 9 4 15.8Z" fill="currentColor"/></svg>}
   </button>

   {/* ------------------------------------------------------------ the bar */}
   <div className="tGroup tBar">
    <span className="legend">Bar</span>
    <b className="readout tBarValue">{t.running?String(t.bar+1):"1"}</b>
   </div>

   {/*
     * Four beats, numbered.
     *
     * They were four unlabelled lamps. On a page whose whole argument is that
     * a player reads notation, four anonymous dots are the one place the
     * interface stopped writing things down: a bar of four has numbered beats,
     * so these are numbered, and the one you are on is the filled notehead.
     *
     * The count-in bar fills vermillion instead of ink, so the bar you are not
     * yet playing over is visibly not the take.
     */}
   <div className="tBeats" role="group" aria-label="Beat">
    {[0,1,2,3].map(index=>(
     <i
      key={index}
      className={`tBeat ${t.counting?"counting":""}`}
      data-on={t.running&&t.beat===index?"true":"false"}
      aria-hidden="true"
     >{index+1}</i>
    ))}
    <span className="sr">
     {t.running?`Beat ${t.beat+1} of 4${t.counting?", counting in":""}`:"Stopped"}
    </span>
   </div>

   <div className="barline" aria-hidden="true"/>

   {/* ---------------------------------------------------------- the tempo */}
   {/*
     * Marked the way a score marks it. A player reads a crotchet, an equals
     * sign and a number without decoding anything, which is more than can be
     * said for a label reading TEMPO above a number reading BPM below. The
     * note is a real SMuFL glyph and the number is set in the title face,
     * because that is how an engraver sets a metronome mark.
     *
     * Hidden from the accessible tree on purpose: the input beside it already
     * carries "Tempo in beats per minute" as its name, and a label reading
     * "quarter note equals" would be announced in front of it.
     */}
   <div className="tGroup tTempo">
    <label className="tempoMark" htmlFor="tempoDial" aria-hidden="true">
     <Glyph name="metQuarter"/>
     <span className="tempoEq">=</span>
    </label>
    <input
     id="tempoDial" className="readout tTempoValue"
     type="number" inputMode="numeric"
     min={TEMPO_MIN} max={TEMPO_MAX} value={t.tempo}
     onChange={event=>t.setTempo(Number(event.target.value))}
     aria-label="Tempo in beats per minute"
    />
    <span className="tStepper">
     <button
      type="button" className="tStep" onClick={()=>t.nudgeTempo(-1)}
      disabled={t.tempo<=TEMPO_MIN} aria-label="One BPM slower"
     >
      <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true" {...stroke}><path d="M7.5 2 3.5 6l4 4"/></svg>
     </button>
     <button
      type="button" className="tStep" onClick={()=>t.nudgeTempo(1)}
      disabled={t.tempo>=TEMPO_MAX} aria-label="One BPM faster"
     >
      <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true" {...stroke}><path d="M4.5 2l4 4-4 4"/></svg>
     </button>
    </span>
   </div>

   <div className="barline" aria-hidden="true"/>

   {/* ---------------------------------------------------------- the modes */}
   <div className="tGroup tModes">
    <button
     type="button" className="tMode" aria-pressed={t.loop}
     onClick={()=>t.setLoop(!t.loop)}
    ><LoopIcon/><span>Loop</span></button>
    <button
     type="button" className="tMode" aria-pressed={t.countIn}
     onClick={()=>t.setCountIn(!t.countIn)}
     title="Play one counted bar before the take"
    ><CountInIcon/><span>Count in</span></button>
   </div>

   <div className="barline" aria-hidden="true"/>

   {/* ---------------------------------------------------------- the input */}
   <div className="tGroup tInput">
    <button
     type="button"
     className={`tMode tInputSwitch ${input.listening?"on":""} ${inputBusy?"waiting":""}`}
     aria-pressed={input.listening}
     onClick={onToggleInput}
     aria-busy={inputBusy}
    >
     <InputIcon live={input.listening}/>
     <span>{inputBusy?"Arming":input.listening?"Input live":"Input off"}</span>
    </button>
    <span className="fineprint tInputDetail">
     {input.listening?input.detail:"Nothing is checked until the bass is connected"}
    </span>
   </div>

   {/* ---------------------------------------------------------- the level */}
   {/*
     * The click's own level, not the system's.
     *
     * The three click voices were scheduled at fixed gains, so quietening the
     * metronome against a loud bass meant turning down the whole machine. The
     * fader scales all three together and keeps their relationship, which is
     * what stops the count-in from disappearing before the downbeat does.
     */}
   <div className="tGroup tLevel">
    <LevelIcon/>
    <input
     type="range" min={0} max={100} step={1}
     value={Math.round(t.level*100)}
     onChange={event=>t.setLevel(Number(event.target.value)/100)}
     aria-label="Click level"
     className="tFader"
    />
   </div>
  </div>
 );
}

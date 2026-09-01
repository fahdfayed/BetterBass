import Glyph from "./Glyph";
import {TEMPO_MAX,TEMPO_MIN,useTransport} from "../useTransport";

/**
 * The transport strip, bolted along the bottom edge of every route.
 *
 * Playback state used to live inside whichever screen owned it, so leaving a
 * lesson stopped the click and losing your place in a progression meant
 * navigating back to find the controls again. A transport belongs on the
 * chassis, not on the page.
 *
 * Transport symbols are solid glyphs rather than stroked icons, because that
 * is what they are on every piece of equipment that has ever had them: a
 * filled triangle is play, a filled square is stop. A 1.5px outlined triangle
 * is a website's idea of a play button.
 */

type Props={
 /** Live input, already resolved by the shell. */
 input:{listening:boolean;detail:string};
 onToggleInput:()=>void;
 inputBusy?:boolean;
};

export default function Transport({input,onToggleInput,inputBusy}:Props){
 const t=useTransport();

 return (
  <div className="transport panel" role="region" aria-label="Transport">
   {/* -------------------------------------------------- run */}
   <div className="tGroup tRun">
    <button
     type="button"
     className={`tPlay ${t.running?"on":""}`}
     onClick={t.toggle}
     aria-pressed={t.running}
     aria-label={t.running?"Stop the click":"Start the click"}
    >
     {t.running
      ?<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><rect x="2" y="2" width="12" height="12" fill="currentColor"/></svg>
      :<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M3 1.6 14 8 3 14.4Z" fill="currentColor"/></svg>}
    </button>

    {/* Four lamps, one per beat. The count-in lights oxide so the bar you
        are not yet playing over is visibly not the take. */}
    <div className="tBeats" aria-hidden="true">
     {[0,1,2,3].map(index=>(
      <i
       key={index}
       className={`lamp ${t.counting?"lamp-oxide":""}`}
       data-on={t.running&&t.beat===index?"true":"false"}
      />
     ))}
    </div>

    <div className="tBar">
     <span className="legend">Bar</span>
     <b className="readout">{t.running?String(t.bar+1).padStart(2,"0"):"--"}</b>
    </div>
   </div>

   <div className="groove-v" aria-hidden="true"/>

   {/* -------------------------------------------------- tempo */}
   {/*
     * The tempo, marked the way a score marks it. A player reads a crotchet, an
     * equals sign and a number without decoding anything, which is more than
     * can be said for a label reading TEMPO above a number reading BPM below.
     * The note is a real SMuFL glyph and the number stays in the text face,
     * because that is how engravers set a metronome mark.
     */}
   <div className="tGroup tTempo">
    {/*
      * Hidden from the accessible tree on purpose: the input beside it already
      * carries "Tempo in beats per minute" as its name, and a label reading
      * "quarter note equals" would be read out in front of it.
      */}
    <label className="tempoMark" htmlFor="tempoDial" aria-hidden="true">
     <Glyph name="metQuarter"/>
     <span className="tempoEq">=</span>
    </label>
    <div className="tDial">
     <button
      type="button" className="tStep" onClick={()=>t.nudgeTempo(-1)}
      disabled={t.tempo<=TEMPO_MIN} aria-label="One BPM slower"
     >&minus;</button>
     <input
      id="tempoDial" className="readout readout-lg tTempoValue"
      type="number" inputMode="numeric"
      min={TEMPO_MIN} max={TEMPO_MAX} value={t.tempo}
      onChange={event=>t.setTempo(Number(event.target.value))}
      aria-label="Tempo in beats per minute"
     />
     <button
      type="button" className="tStep" onClick={()=>t.nudgeTempo(1)}
      disabled={t.tempo>=TEMPO_MAX} aria-label="One BPM faster"
     >+</button>
    </div>
   </div>

   <div className="groove-v" aria-hidden="true"/>

   {/* -------------------------------------------------- modes */}
   <div className="tGroup tModes">
    <button
     type="button" className="rocker" aria-pressed={t.loop}
     onClick={()=>t.setLoop(!t.loop)}
    >Loop</button>
    <button
     type="button" className="rocker" aria-pressed={t.countIn}
     onClick={()=>t.setCountIn(!t.countIn)}
     title="Play one counted bar before the take"
    >Count in</button>
   </div>

   <div className="groove-v" aria-hidden="true"/>

   {/* -------------------------------------------------- input */}
   <div className="tGroup tInput">
    <button
     type="button"
     className={`rocker tInputSwitch ${input.listening?"on":""}`}
     aria-pressed={input.listening}
     onClick={onToggleInput}
     aria-busy={inputBusy}
    >
     <i className={`lamp ${input.listening?"":"lamp-oxide"}`}
        data-on={input.listening?"true":"false"} aria-hidden="true"/>
     <span>{inputBusy?"Arming":input.listening?"Input live":"Input off"}</span>
    </button>
    <span className="fineprint tInputDetail">
     {input.listening?input.detail:"Nothing is checked until the bass is connected"}
    </span>
   </div>
  </div>
 );
}

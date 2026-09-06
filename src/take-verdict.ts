import {MODES} from "./harmony-fretboard-data.ts";
import {NOTE_NAMES,type NoteEvent} from "./pitch.ts";
import {degreeAt} from "./theory/degrees.ts";

/** How many times the characteristic tone has to appear to count as stated. */
const COLOUR_USES=2;

/**
 * What the coach has to say about a take.
 *
 * The order the cases are tested in is the substance of it. An outside note
 * that never came back is the first thing worth saying, because it is the one
 * a listener actually heard go wrong. A take that is technically inside but
 * never states the mode's characteristic tone is the second: correct, and
 * anonymous. Only when neither is true is there nothing left to fix but the
 * silence.
 *
 * @param mode   index into MODES
 * @param colour pitch class of that mode's characteristic tone
 */
export function verdict(events:NoteEvent[],mode:number,colour:number){
 if(events.some(e=>e.tension===4&&e.resolution==="unresolved"))return {
  heading:"The departure was audible. The return was not always clear.",
  advice:"At least one outside event lasted into a new metric position without reaching a chord tone. Repeat the rhythmic motif, then resolve by semitone.",
 };

 if(events.filter(e=>e.midi%12===colour).length<COLOUR_USES){
  const characteristic=degreeAt(MODES[mode].s[MODES[mode].c]);
  return {
   heading:`Technically inside, but ${MODES[mode].n} identity is weak: its ${characteristic.names[0]} barely appears.`,
   advice:`Feature the ${characteristic.label} (${NOTE_NAMES[colour]}) twice, including once on beat 1 or 3. Avoid adding more notes.`,
  };
 }

 return {
  heading:"Harmonic intention is readable.",
  advice:"Next pass: preserve the same pitch story while leaving 25% more silence.",
 };
}

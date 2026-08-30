import {useMemo,useState} from "react";
import {useAudition} from "../useAudition";
import {analyseProgression,type ChordFunction} from "../theory/progression-analysis";
import {MODES,PITCH_NAMES,PROGRESSION_PRESETS,recommendScales} from "../harmony-fretboard-data";

/**
 * Read a progression the way the course teaches it.
 *
 * The encyclopedia explains Roman numerals, function, secondary dominants and
 * borrowing, and until now the site never let anyone do any of it to a
 * progression of their own. Type one in and it says which key, what each chord
 * is called there, what job it holds, and which of the chords outside the key
 * have an explanation rather than merely being outside.
 */

const JOB_LABEL:Record<ChordFunction,string>={
 tonic:"HOME",predominant:"DEPARTURE",dominant:"RETURN",
 chromatic:"OUTSIDE",modal:"COLOUR",
};

const MODE_INDEX:Record<string,number>={
 Ionian:0,Dorian:1,Phrygian:2,Lydian:3,Mixolydian:4,Aeolian:5,Locrian:6,
};

type Props={
 /** Play a run of pitch classes over a drone. */
 audition:(pitchClasses:number[],hold?:number)=>void;
 /** Send the progression to the fretboard, centred where the analysis put it. */
 onSendToFretboard:(centre:number,mode:number,chords:string[])=>void;
};

export default function ProgressionAnalyser({audition,onSendToFretboard}:Props){
 const [text,setText]=useState("Dm7 G7 Cmaj7");
 const {playing,play}=useAudition(audition);
 const reading=useMemo(()=>analyseProgression(text),[text]);
 const {key,readings,observations,errors,chords}=reading;

 // Which seven notes the scale advice should be measured against.
 const homeMode=key?.modal?MODE_INDEX[key.modal.name.split(" ")[1]]??0:key?.mode==="minor"?5:0;
 const centre=key?.modal?key.centre:key?.tonic??0;

 const scaleFor=(index:number)=>{
  const chord=chords[index];
  if(!chord||chord.error)return null;
  return recommendScales(chord,chords[index+1],centre,homeMode,key?.modal?"modal":"functional")[0]??null;
 };

 const hearAll=()=>{
  // Root motion, so the progression is heard as a path rather than a stack.
  const roots=readings.filter(r=>r.numeral!=="?").map(r=>r.root);
  if(roots.length)play("roots",roots,.5);
 };

 return (
  <div className="osScreen progressionReader">
   <div className="screenIntro">
    <span>READ A PROGRESSION</span>
    <h1 data-page-heading tabIndex={-1}>What is it doing?</h1>
    <p>Type a progression and it will say which key it is in, what each chord is called there, and what job it holds. Bars, arrows or plain spaces all work.</p>
   </div>

   <div className="progInput">
    <label>
     <span className="label">PROGRESSION</span>
     <input value={text} onChange={event=>setText(event.target.value)} spellCheck={false}
            placeholder="Dm7 G7 Cmaj7" aria-describedby="progHelp"/>
    </label>
    <button type="button" className={`action action-primary ${playing==="roots"?"sounding":""}`}
            onClick={hearAll} disabled={!readings.length} aria-busy={playing==="roots"}>
     {playing==="roots"?"♪ Sounding":"▶ Hear the roots"}</button>
    <p id="progHelp" className="dim">Try <code>| Am9 | D13 | Am9 | E7sus4 |</code> or <code>Cmaj7 A7 Dm7 G7</code>.</p>
   </div>

   <div className="progPresets">
    <span className="label">OR START FROM ONE OF THESE</span>
    <div>{PROGRESSION_PRESETS.map(preset=>(
     <button type="button" key={preset.id} onClick={()=>setText(preset.chords.join(" "))}>
      {preset.name}
     </button>
    ))}</div>
   </div>

   {errors.length>0&&(
    <p className="progError" role="alert">{errors.join(" ")}</p>
   )}

   {key&&readings.length>0&&(
    <>
     <section className="progVerdict">
      <div>
       <span className="label">READS AS</span>
       <h2>{key.modal?key.modal.name:key.name}</h2>
       {key.modal
        ?<p>The {key.modal.collection} collection, heard from {PITCH_NAMES[key.centre]}. The notes belong to {key.modal.collection}; home does not.</p>
        :<p>{readings.filter(r=>r.diatonic).length} of {readings.length} chords belong to it outright.</p>}
      </div>
      <div className="progConfidence">
       <b className="mono">{key.confidence}%</b>
       <small>HOW SURE</small>
       {/* A number nobody can act on is worse than no number, so it says what
           low confidence means rather than leaving it to be guessed at. */}
       <p>{key.confidence>=80?"The progression settles this beyond argument."
          :key.confidence>=45?"Likely, but the progression leaves room for another reading."
          :"Not enough here to be sure — these chords live in several keys."}</p>
      </div>
     </section>

     <div className="progChords">
      {readings.map((chord,index)=>{
       const scale=scaleFor(index);
       return (
        <article key={index} className={`progChord job-${chord.job}`}>
         <header>
          <b>{chord.symbol}</b>
          <i className="mono">{chord.numeral}</i>
         </header>
         <span className="progJob">{JOB_LABEL[chord.job]}</span>
         <p>{chord.note}</p>
         {scale&&(
          <button type="button" aria-busy={playing===`scale${index}`}
                  className={`progScale ${playing===`scale${index}`?"sounding":""}`}
                  onClick={()=>play(`scale${index}`,scale.scale.intervals.map(iv=>(chord.root+iv)%12),.28)}>
           <small>PLAY IT OVER</small>
           <b>{PITCH_NAMES[chord.root]} {scale.scale.name}</b>
           <em>{playing===`scale${index}`?"♪ sounding":"▶ hear the scale"}</em>
          </button>
         )}
        </article>
       );
      })}
     </div>

     {observations.length>0&&(
      <section className="progObservations">
       <span className="label">WHAT HAPPENS</span>
       <ul>{observations.map(line=><li key={line}>{line}</li>)}</ul>
      </section>
     )}

     <div className="progActions">
      <button type="button" className="action action-primary"
              onClick={()=>onSendToFretboard(centre,homeMode,readings.map(r=>r.symbol))}>
       Open this on the fretboard <span aria-hidden="true">→</span>
      </button>
     </div>
    </>
   )}
  </div>
 );
}

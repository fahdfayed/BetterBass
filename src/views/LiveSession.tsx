import {labelFor,NOTE_NAMES as N,tensionFor,type Harmony} from "../pitch";
import {SHORT_NAMES} from "../theory/degrees";

/** A reading from the microphone: which note, which octave, how far off. */
export type PitchReading={n:string,oct:number,cents:number};

/** What the take amounted to, once there is a take to talk about. */
export type TakeReport={inside:number,color:number,out:number,msg:string};

type Props={
 /** What the note is being judged against. */
 harmony:Harmony;
 /** The note being heard right now, or null when nothing is. */
 pitch:PitchReading|null;
 listening:boolean;
 /** True while the browser is asking for the microphone. */
 connecting:boolean;
 chord:string;
 /** The mode's own name, e.g. "Dorian". */
 modeName:string;
 report:TakeReport;
 /** Why the microphone is unavailable, when it is. */
 audioError:string;
 onToggleListening:()=>void;
 onClearTake:()=>void;
};

/**
 * Practising with the microphone open.
 *
 * Everything on the page is phrased as function rather than pitch — what the
 * note is doing against the harmony, not which fret it came from. A player who
 * can only name frets has not learned anything they can use on a different
 * song.
 */
export default function LiveSession(
 {harmony,pitch,listening,connecting,chord,modeName,report,audioError,onToggleListening,onClearTake}:Props
){
 const {ri,chordTones,color}=harmony;
 const heard=pitch?(N.indexOf(pitch.n)+12)%12:null;

 return (
  <div className="osScreen live">
   <div className="liveHead">
    <div>
     <h1 className="k liveTitle" data-page-heading tabIndex={-1}>Live practice · a dorian colour</h1>
     <b className="livePitch">{pitch?pitch.n:"-"}<small>{pitch?pitch.oct:""}</small></b>
     <p>{
      pitch&&heard!==null
       ? `${labelFor(heard,harmony)} · ${SHORT_NAMES[(heard-ri+12)%12]} · ${pitch.cents>=0?"+":""}${pitch.cents} cents`
       : listening
        ? "Listening… play a clear sustained note"
        : "Connect your bass to begin live analysis"
     }</p>
    </div>
    <div className="tuner">
     {/* Clamped short of the ends so the needle stays visible when a note is
         badly out rather than disappearing past the edge. */}
     <i style={{left:`${pitch?Math.max(2,Math.min(98,50+pitch.cents)):50}%`}}/>
     <span>♭</span><b>In tune</b><span>♯</span>
    </div>
   </div>

   <div className="gps">
    <span className="label">Musical gps</span>
    <div><small>Key centre</small><b>{N[ri]}</b></div>
    <div><small>Current chord</small><b>{chord}</b></div>
    <div><small>Home scale</small><b>{N[ri]} {modeName}</b></div>
    <div><small>Chord tones</small><b>{chordTones.map(n=>N[n]).join(" ")}</b></div>
    <div className="colour"><small>Characteristic</small><b>{N[color]} · {SHORT_NAMES[(color-ri+12)%12]}</b></div>
    <div><small>Resolve to</small><b>{chordTones.map(n=>N[n]).join(" / ")}</b></div>
   </div>

   <div className="tensionMeter">
    <span>Home</span><span>Colour</span><span>Tension</span><span>Outside</span><span>Chaos</span>
    <i className={`p${heard!==null?tensionFor(heard,harmony):0}`}/>
   </div>

   <div className="liveGrid">
    <article className="mission">
     <span>Mission 02 / 06</span>
     <h2>Make it sound {modeName}.</h2>
     <p>Four bars. Do not run the scale. Feature <b>{N[color]}</b> at least twice, including once on a strong beat. Maintain your groove.</p>
     <div className="barTrack"><i className="done"/><i className="done"/><i/><i/></div>
     <button className={listening?"stop":connecting?"waiting":""}
             onClick={()=>{if(!connecting)onToggleListening()}}
             aria-disabled={connecting} aria-busy={connecting}>
      {connecting?"ASKING FOR THE MICROPHONE…":listening?"Pause analysis":"Start listening"}
     </button>
     {audioError&&<p className="audioError" role="alert">{audioError}</p>}
    </article>
    <article className="liveReport">
     <span>Live note report</span>
     <div><b>{report.inside}%</b><small>Inside</small></div>
     <div><b>{report.color}</b><small>{N[color]} USES</small></div>
     <div><b>{report.out}</b><small>Outside events</small></div>
     <p>{report.msg}</p>
     <button onClick={onClearTake}>Clear take</button>
    </article>
   </div>
  </div>
 );
}

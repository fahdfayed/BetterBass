import {useEffect,useState} from "react";
import {NOTE_NAMES} from "../pitch";
import IntervalSniper from "./IntervalSniper";
import {type Heard,useHeardNote} from "../useHeardNote";
import {SHORT_NAMES} from "../theory/degrees";

/**
 * Mistake recovery.
 *
 * The premise is the opposite of most ear training: the note is already wrong,
 * and the only question is what the player does next. Nothing here scores the
 * departure, because a bass line that never leaves home has nothing to resolve.
 */
const SHELF=[
 {title:"Note Location Sniper",desc:"Find any called pitch in under two seconds."},
 {title:"Interval Sniper",desc:"Hear the root; play the requested function."},
 {title:"Wrong Note Rescue",desc:"Make a forced outside note sound deliberate."},
 {title:"Target Note Landing",desc:"Hit assigned notes on exact beats and bars."},
 {title:"Enclosure Generator",desc:"Surround chord tones from above and below."},
 {title:"Rhythm Before Notes",desc:"Build music before adding pitch choices."},
 {title:"Fog of War",desc:"Maps disappear as recall improves."},
 {title:"Daily Boss Fight",desc:"Three minutes. No help. No stopping."},
];

type Props={
 /** The harmony the forced note has to be rescued into. */
 chord:string;
 /** Pitch class of the key centre. */
 root:number;
 /** Pitch class the player has been handed, whether they like it or not. */
 forced:number;
 /** What the last attempt earned, empty before the first one. */
 verdict:string;
 onRescue:(pitchClass:number)=>void;
 onLaunch:(game:number)=>void;
 /** The last note the microphone committed. */
 heard:Heard;
 listening:boolean;
 connecting:boolean;
 onListen:()=>void;
 /** Sound a pitch class, so the sniper can give the player their reference. */
 audition:(pitchClasses:number[],hold?:number)=>void;
};

export default function RescueGames({
 chord,root,forced,verdict,onRescue,onLaunch,heard,listening,connecting,onListen,audition,
}:Props){
 /*
  * The panel has always said "play or choose"; only the choosing worked. An
  * ear-training game answered by clicking one of twelve buttons can be passed
  * without touching the instrument, which is the one thing the rest of this
  * site exists to prevent.
  */
 const [played,setPlayed]=useState<number|null>(null);
 useHeardNote(heard,pitchClass=>{setPlayed(pitchClass);onRescue(pitchClass)},listening);

 // A new forced note is a new question, so the last answer stops being shown.
 useEffect(()=>{setPlayed(null)},[forced]);

 return (
  <div className="osScreen">
   <div className="screenIntro">
    <span>MISTAKE RECOVERY TRAINING</span>
    <h1 data-page-heading tabIndex={-1}>Rescue the note.</h1>
    <p>The computer gives you tension. Your job is to give it meaning. There is no penalty for leaving home—only for failing to return.</p>
   </div>

   <div className="rescueGame">
    <div className="forced">
     <span>HARMONY</span>
     <b>{chord}</b>
     <small>FORCED NOTE</small>
     <h2>{NOTE_NAMES[forced]}</h2>
     <em>{SHORT_NAMES[(forced-root+12)%12]} · OUTSIDE</em>
    </div>
    <div className="choose">
     <span>{listening?"PLAY YOUR RESOLUTION":"PLAY OR CHOOSE YOUR RESOLUTION"}</span>
     <h3>You get one note to rescue it.</h3>

     {listening
      ?<p className="rescueEar" role="status">
        <i aria-hidden="true"/>
        {played===null
         ?"Listening. Play the note you would resolve to."
         :`Heard ${NOTE_NAMES[played]}.`}
       </p>
      :<p className="rescueEar off">
        <button type="button" className="action action-primary" onClick={onListen} aria-busy={connecting}>
         {connecting?"Connecting…":"Connect the bass"}
        </button>
        <span>Or answer with the buttons — but the point of this one is the instrument.</span>
       </p>}

     <div>{NOTE_NAMES.map((note,i)=>(
      <button
       key={note}
       className={i===played?"heard":""}
       onClick={()=>{setPlayed(i);onRescue(i)}}
      >{note}</button>
     ))}</div>
     <p className={verdict.startsWith("RECOVERED")?"success":""}>
      {verdict||`Try ${NOTE_NAMES[forced]} → ?`}
     </p>
    </div>
   </div>

   <IntervalSniper root={root} heard={heard} listening={listening}
                   connecting={connecting} onListen={onListen} audition={audition}/>

   <div className="gameShelf">
    {SHELF.map((game,i)=>(
     <article key={game.title}>
      <span>{String(i+1).padStart(2,"0")}</span>
      <b>{game.title}</b>
      <p>{game.desc}</p>
      <button onClick={()=>onLaunch(i)}>LAUNCH →</button>
     </article>
    ))}
   </div>
  </div>
 );
}

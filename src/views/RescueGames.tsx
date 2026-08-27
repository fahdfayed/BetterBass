import {NOTE_NAMES} from "../pitch";
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
};

export default function RescueGames({chord,root,forced,verdict,onRescue,onLaunch}:Props){
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
     <span>PLAY OR CHOOSE YOUR RESOLUTION</span>
     <h3>You get one note to rescue it.</h3>
     <div>{NOTE_NAMES.map((note,i)=><button onClick={()=>onRescue(i)} key={note}>{note}</button>)}</div>
     <p className={verdict.startsWith("RECOVERED")?"success":""}>
      {verdict||`Try ${NOTE_NAMES[forced]} → ?`}
     </p>
    </div>
   </div>

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

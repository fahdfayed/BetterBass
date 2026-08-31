import {useState} from "react";
import GameRunner from "./GameRunner";
import {DRILLS} from "../game/drills";
import {type Heard} from "../useHeardNote";

/**
 * Eight games, all of which are now games.
 *
 * The shelf used to be eight cards whose LAUNCH set some state and opened a
 * different screen: two of them opened the same one in the same state, none
 * kept score, none ended, and none checked a single note you played. The one
 * playable thing on the page was answered by clicking one of twelve buttons.
 *
 * They are rules in ../game/drills now, and one runner plays any of them.
 */

type Props={
 /** Pitch class the drills measure their degrees from. */
 root:number;
 heard:Heard;
 listening:boolean;
 connecting:boolean;
 onListen:()=>void;
 audition:(pitchClasses:number[],hold?:number)=>void;
};

export default function RescueGames({root,heard,listening,connecting,onListen,audition}:Props){
 const [openId,setOpenId]=useState<string|null>(null);
 const open=DRILLS.find(drill=>drill.id===openId);

 if(open)return (
  <div className="osScreen">
   <GameRunner
    drill={open}
    root={root}
    heard={heard}
    listening={listening}
    connecting={connecting}
    onListen={onListen}
    audition={audition}
    onExit={()=>setOpenId(null)}
   />
  </div>
 );

 return (
  <div className="osScreen">
   <div className="screenIntro">
    <span>Play it to pass it</span>
    <h1 data-page-heading tabIndex={-1}>Eight games. All answered on the bass.</h1>
    <p>
     Each one asks for something specific, listens for it, and keeps score. There are
     no multiple-choice buttons here, if the instrument is not connected, nothing can
     be checked.
    </p>
   </div>

   <div className="gameShelf">
    {DRILLS.map((drill,index)=>(
     <article key={drill.id}>
      <span>{String(index+1).padStart(2,"0")}</span>
      <b>{drill.title}</b>
      <p>{drill.desc}</p>
      <small className="gameMeta mono">
       {drill.timed?"With a click":"No click"}
       {drill.session>0?` · ${drill.session}s`:" · OPEN ENDED"}
      </small>
      <button onClick={()=>setOpenId(drill.id)}>Play</button>
     </article>
    ))}
   </div>
  </div>
 );
}

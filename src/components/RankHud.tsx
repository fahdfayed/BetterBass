import type {Rank} from "../game/progression";
import {goToView} from "../router";

/** Rank, XP progress and streak, always visible in the header. */
export default function RankHud({rank,streak}:{rank:Rank;streak:number}){
 const toNext=rank.next?rank.next.at-rank.xp:0;
 return (
  <button
   className="rankHud"
   onClick={()=>goToView("map")}
   title={rank.next
    ? `Level ${rank.level} · ${rank.title}. ${toNext.toLocaleString()} XP to ${rank.next.title}.`
    : `Level ${rank.level} · ${rank.title}. Top rank reached.`}
   aria-label={`Level ${rank.level}, ${rank.title}, ${rank.xp} XP. Open the map.`}
  >
   <span className="rankBadge" aria-hidden="true">{rank.level}</span>
   <span className="rankMeta">
    <span className="rankLine">
     <b>{rank.title}</b>
     <span>{rank.next?`${rank.into}/${rank.span}`:"MAX"}</span>
    </span>
    <span className="meter"><span style={{width:`${rank.percent}%`}}/></span>
   </span>
   {streak>0&&<span className="streakPill" aria-label={`${streak} day streak`}>🔥 {streak}</span>}
  </button>
 );
}

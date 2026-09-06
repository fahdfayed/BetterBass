import {useCallback,useState} from "react";
import {type Drill} from "../game/drills";
import {fightResult,hitDamage,missDamage,START_HP} from "../game/boss";
import {NOTE_NAMES} from "../pitch";
import {type Heard} from "../useHeardNote";
import {type Outcome,useGameEngine} from "./useGameEngine";

/**
 * The one drill with a name bigger than its mechanic used to have. Every
 * other question in ../game/drills still supplies the asking and the
 * judging via useGameEngine — this file only decides what a hit or a miss
 * costs: the boss's health instead of a streak, yours instead of a miss
 * count.
 */

type Props={
 drill:Drill;
 root:number;
 heard:Heard;
 listening:boolean;
 connecting:boolean;
 onListen:()=>void;
 audition:(pitchClasses:number[],hold?:number)=>void;
 onExit:()=>void;
};

export default function BossFight({
 drill,root,heard,listening,connecting,onListen,audition,onExit,
}:Props){
 const [bossHp,setBossHp]=useState(START_HP);
 const [playerHp,setPlayerHp]=useState(START_HP);
 const [streak,setStreak]=useState(0);
 const [said,setSaid]=useState<string|null>(null);

 const onOutcome=useCallback((outcome:Outcome)=>{
  if(outcome.hit){
   setStreak(current=>{
    setBossHp(hp=>Math.max(0,hp-hitDamage(current)));
    return current+1;
   });
   setSaid("Hit.");
   return;
  }
  setStreak(0);
  setPlayerHp(hp=>Math.max(0,hp-missDamage));
  setSaid(outcome.reason==="wrongNote"
   ?`That was ${NOTE_NAMES[((outcome.played%12)+12)%12]}. The boss doesn't wait.`
   :"Too slow. The boss doesn't wait.");
 },[]);

 // HP-defeat stops the engine's own listening immediately, rather than
 // waiting for its 180s timer — a dead boss shouldn't still be judging notes.
 const hpDefeat=bossHp<=0||playerHp<=0;
 const{ask,progress,left,restart}=useGameEngine(drill,root,heard,listening&&!hpDefeat,audition,onOutcome);

 const result=fightResult(bossHp,playerHp,left);
 const finished=result!=="fighting";

 const fight=()=>{setBossHp(START_HP);setPlayerHp(START_HP);setStreak(0);setSaid(null);restart()};

 return (
  <section className="runner beat-ambient bossFight">
   <header>
    <div><h2>{drill.desc}</h2></div>
    <button type="button" className="action action-quiet" onClick={onExit}>← All games</button>
   </header>

   {!listening&&(
    <div className="runnerConnect">
     <p>This is answered on the instrument. Nothing is checked until the bass is connected.</p>
     <button type="button" className="action action-primary" onClick={onListen} aria-busy={connecting}>
      {connecting?"Connecting…":"Connect the bass"}
     </button>
    </div>
   )}

   <div className="bossBars">
    <div className="hpRow boss">
     <span className="label">Boss</span>
     <div className="hpBar"><div className="hpFill" style={{transform:`scaleX(${bossHp/100})`}}/></div>
     <b className="mono">{Math.ceil(bossHp)}</b>
    </div>
    <div className="hpRow player">
     <span className="label">You</span>
     <div className="hpBar"><div className="hpFill" style={{transform:`scaleX(${playerHp/100})`}}/></div>
     <b className="mono">{Math.ceil(playerHp)}</b>
    </div>
   </div>

   <div className="runnerBoard">
    <div className="runnerAsk" aria-live="polite">
     {finished?(
      <>
       <span className="label">{result==="won"?"Boss defeated":"The boss wins"}</span>
       <b>{result==="won"
        ?`Down with ${Math.ceil(left)}s and ${Math.ceil(playerHp)} HP to spare.`
        :playerHp<=0?"Out of health.":"Out of time."}</b>
       <button type="button" className="action action-primary" onClick={fight}>Fight again</button>
      </>
     ):(
      <>
       <span className="label">Play</span>
       <b>{ask?.prompt??"…"}</b>
       {ask?.hint&&<p>{ask.hint}</p>}
       {ask&&ask.notes.length>1&&(
        <p className="runnerSteps">
         {ask.notes.map((note,index)=>(
          <i key={index} className={index<progress?"done":index===progress?"now":""}>
           {NOTE_NAMES[note]}
          </i>
         ))}
        </p>
       )}
      </>
     )}
    </div>

    <div className="runnerSide">
     {said&&!finished&&<p className={`runnerSaid ${said.startsWith("Hit")?"good":"bad"}`} role="status">{said}</p>}
     <div className="runnerScore">
      <div><b className="mono">{streak}</b><small>Combo</small></div>
      <div><b className="mono">{Math.max(0,Math.ceil(left))}</b><small>Seconds</small></div>
     </div>
    </div>
   </div>
  </section>
 );
}

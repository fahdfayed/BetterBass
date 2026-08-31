/** One block of the day's practice route. */
export type SessionBlock={m:number,t:string,d:string,tag:string};

const AXES=["HEAR","SEE","KNOW","PLAY","CREATE"];

type Props={
 /** The day's blocks, in the order they should be played. */
 plan:SessionBlock[];
 /** Score out of 100 on each axis, in AXES order. */
 freedom:number[];
 onStart:()=>void;
};

/**
 * The day's route, assembled from what the player is worst at.
 *
 * The ordering is deliberate: the bottleneck is named before the blocks are
 * listed, so the session reads as an argument rather than a to-do list.
 */
export default function TodaySession({plan,freedom,onStart}:Props){
 return (
  <div className="osScreen">
   <div className="todayHero">
    <div>
     <span className="k">Tuesday · adaptive session 12</span>
     <h1 data-page-heading tabIndex={-1}>Today’s<br/><em>Session</em></h1>
     <p>Built from your weak modes, neglected keys, register bias and tension-control history, not from a fixed lesson order.</p>
     <button className="mega" onClick={onStart}>Start practice <b>→</b></button>
    </div>
    <div className="weakness">
     <span>Primary bottleneck</span>
     <h2>Dorian → Mixolydian recognition</h2>
     <div><b>67%</b><i><em style={{width:"67%"}}/></i></div>
     <ul>
      <li><span>Fretboard recall</span><b>Strong below 9 / weak above 12</b></li>
      <li><span>Chromatic groove</span><b className="warn">Needs work</b></li>
      <li><span>Outside-note control</span><b>67%</b></li>
      <li><span>Practice debt</span><b>Phrygian · E♭ · 5/4</b></li>
     </ul>
    </div>
   </div>

   <div className="sessionStrip">
    {plan.map((block,i)=>(
     <article key={block.t}>
      <span>{String(i+1).padStart(2,"0")}</span>
      <div>
       <small>{block.tag} · {block.m} MIN</small>
       <b>{block.t}</b>
       <p>{block.d}</p>
      </div>
      <button>↗</button>
     </article>
    ))}
   </div>

   <div className="freedomMini">
    <div>
     <span>Freedom score</span>
     <h3>Tension-aware player</h3>
     <p>Next threshold: free improviser</p>
    </div>
    {AXES.map((axis,i)=>(
     <div key={axis}>
      <b>{freedom[i]}</b>
      <span>{axis}</span>
      <i><em style={{height:`${freedom[i]}%`}}/></i>
     </div>
    ))}
   </div>
  </div>
 );
}

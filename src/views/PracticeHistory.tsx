import {useEffect,useState} from "react";
import {fetchPracticeHistory,trendOf,type PracticeSession} from "../practice-history";

const when=(iso:string)=>{
 const then=new Date(iso).getTime();
 if(!Number.isFinite(then))return "";
 const minutes=Math.round((Date.now()-then)/60000);
 if(minutes<1)return "just now";
 if(minutes<60)return `${minutes}m ago`;
 const hours=Math.round(minutes/60);
 if(hours<24)return `${hours}h ago`;
 return `${Math.round(hours/24)}d ago`;
};

/** A change worth showing at all, with its sign made explicit. */
const signed=(value:number)=>`${value>0?"+":""}${value}`;

/**
 * The takes the engine has already scored.
 *
 * This page says progress is tied to passed performance rather than time
 * spent, and then counted lessons. These are the performance: every recorded
 * take is analysed on the server and stored, and until now nothing read any of
 * it back.
 */
export default function PracticeHistory({onRecord}:{onRecord:()=>void}){
 const [state,setState]=useState<"loading"|"ready">("loading");
 const [sessions,setSessions]=useState<PracticeSession[]>([]);

 useEffect(()=>{
  let cancelled=false;
  fetchPracticeHistory().then(list=>{
   if(cancelled)return;
   setSessions(list);
   setState("ready");
  });
  return()=>{cancelled=true};
 },[]);

 if(state==="loading")return (
  <section className="takeHistory">
   <span>RECORDED EVIDENCE</span>
   <p className="dim" role="status">Looking for your recorded takes…</p>
  </section>
 );

 if(!sessions.length)return (
  <section className="takeHistory">
   <span>RECORDED EVIDENCE</span>
   <h2>Nothing recorded yet.</h2>
   <p>The listening engine scores every take it hears — timing against the grid, how much stayed inside, and whether what left came back. Record one and it appears here.</p>
   <button type="button" className="action action-primary" onClick={onRecord}>Open the listening engine</button>
  </section>
 );

 const latest=sessions[0];
 const timingTrend=trendOf(sessions,a=>a.timingScore);
 const insideTrend=trendOf(sessions,a=>a.insidePercent);

 return (
  <section className="takeHistory">
   <span>RECORDED EVIDENCE</span>
   <h2>{sessions.length===1?"One take":`${sessions.length} takes`}, scored as you played them.</h2>

   <div className="takeHeadline">
    <div>
     <b className="mono">{latest.analysis.timingScore}</b>
     <small>TIMING · LATEST</small>
     {timingTrend!==null&&<i className={timingTrend>=0?"up":"down"}>{signed(timingTrend)} vs earlier</i>}
    </div>
    <div>
     <b className="mono">{latest.analysis.insidePercent}%</b>
     <small>INSIDE · LATEST</small>
     {insideTrend!==null&&<i className={insideTrend>=0?"up":"down"}>{signed(insideTrend)} vs earlier</i>}
    </div>
    <div>
     <b className="mono">{latest.analysis.averageGridOffsetMs}<small>ms</small></b>
     <small>MEAN OFF THE GRID</small>
    </div>
   </div>

   <table className="takeTable">
    <caption className="sr">Recorded takes, most recent first</caption>
    <thead>
     <tr><th scope="col">When</th><th scope="col">Notes</th><th scope="col">Timing</th>
      <th scope="col">Inside</th><th scope="col">Left home</th><th scope="col">Returned</th></tr>
    </thead>
    <tbody>
     {sessions.map(session=>{
      const a=session.analysis;
      return (
       <tr key={session.sessionId}>
        <td>{when(session.createdAt)}</td>
        <td className="mono">{a.noteCount}</td>
        <td className="mono">{a.timingScore}</td>
        <td className="mono">{a.insidePercent}%</td>
        <td className="mono">{a.outsideCount}</td>
        {/* A take that never left home has nothing to have returned from, and
            saying 0% there would read as a failure rather than an absence. */}
        <td className="mono">{a.outsideCount?`${a.resolutionRate}%`:"—"}</td>
       </tr>
      );
     })}
    </tbody>
   </table>

   <p className="dim">Timing is distance from the grid, not speed: 100 is dead on it. Inside counts notes that belonged to the harmony. Returned is how much of what left came back to a chord tone.</p>
  </section>
 );
}

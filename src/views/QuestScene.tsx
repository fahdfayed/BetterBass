import {useMemo} from "react";
import type {Quest} from "../quest-data";
import {shortName} from "../theory/degrees";

/**
 * The walk, drawn.
 *
 * The ground is not a backdrop. A waypoint's height is its degree, so the
 * terrain profile is the melodic contour of the lesson — the climb to the
 * summit is the line going up, and the different road home is the line coming
 * down somewhere else. A player watching the figure walk is watching the shape
 * of the phrase they are playing.
 *
 * Everything is drawn from the same numbers the game is judged on, so the
 * picture cannot disagree with the rules.
 */

const W=1000,H=380;
const FLOOR=H-46;      // where degree 0 sits
const CEILING=54;      // where the highest degree of the walk sits

type Props={
 quest:Quest;
 /** Index of the step being asked for. */
 at:number;
 done:boolean;
 /** Set while the last note was wrong, so the figure can show the stumble. */
 missed:boolean;
 misses:number;
 allowed:number;
};

export default function QuestScene({quest,at,done,missed,misses,allowed}:Props){
 const points=useMemo(()=>{
  const degrees=quest.steps.map(step=>step.degree);
  const peak=Math.max(...degrees,1);
  const span=quest.steps.length-1||1;
  return quest.steps.map((step,index)=>({
   ...step,
   index,
   x:40+(index/span)*(W-80),
   y:FLOOR-(step.degree/peak)*(FLOOR-CEILING),
  }));
 },[quest]);

 // A rounded line through the waypoints: the ground the figure walks on.
 const ridge=useMemo(()=>points.map((point,index)=>{
  if(index===0)return `M ${point.x} ${point.y}`;
  const previous=points[index-1];
  const midway=(previous.x+point.x)/2;
  return `C ${midway} ${previous.y} ${midway} ${point.y} ${point.x} ${point.y}`;
 }).join(" "),[points]);

 const here=points[Math.min(at,points.length-1)];
 const walked=done?points.length:at;

 // The stretch already crossed, drawn over the rest.
 const behind=useMemo(()=>{
  if(walked<=0)return "";
  return points.slice(0,walked+1).map((point,index)=>{
   if(index===0)return `M ${point.x} ${point.y}`;
   const previous=points[index-1];
   const midway=(previous.x+point.x)/2;
   return `C ${midway} ${previous.y} ${midway} ${point.y} ${point.x} ${point.y}`;
  }).join(" ");
 },[points,walked]);

 const summary=done
  ?`Arrived home after ${points.length-1} steps.`
  :`At ${here.place}, step ${at+1} of ${points.length}. `+
   `${allowed-misses} wrong turns left.`;

 return (
  <div className={`questScene ${missed?"stumbled":""} ${done?"arrived":""}`}>
   <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`The walk through ${quest.rootName} ${quest.modeName}. ${summary}`}>
    <defs>
     <linearGradient id="questGround" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="var(--quest-fill-top)"/>
      <stop offset="100%" stopColor="var(--quest-fill-bottom)"/>
     </linearGradient>
    </defs>

    {/* Pitch rules. Every degree the walk uses gets a line, so height reads as
        an interval rather than as scenery. */}
    <g className="questRules" aria-hidden="true">
     {[...new Set(quest.steps.map(step=>step.degree))].sort((a,b)=>a-b).map(degree=>{
      const peak=Math.max(...quest.steps.map(step=>step.degree),1);
      const y=FLOOR-(degree/peak)*(FLOOR-CEILING);
      return (
       <g key={degree}>
        <line x1={26} y1={y} x2={W-26} y2={y}/>
        <text x={12} y={y+4}>{shortName(degree)}</text>
       </g>
      );
     })}
    </g>

    {/* The ground under the path. */}
    <path className="questGroundFill" d={`${ridge} L ${points[points.length-1].x} ${H} L ${points[0].x} ${H} Z`}/>
    <path className="questRidge" d={ridge}/>
    {behind&&<path className="questRidgeWalked" d={behind}/>}

    {points.map(point=>{
     const crossed=point.index<walked;
     const standing=point.index===at&&!done;
     const landmark=/far point/.test(point.place);
     return (
      <g key={point.index}
         className={`questMark ${crossed?"crossed":""} ${standing?"standing":""} ${landmark?"landmark":""}`}>
       {point.checkpoint&&(
        // A flag marks somewhere a wrong note sends you back to.
        <g className="questFlag" aria-hidden="true">
         <line x1={point.x} y1={point.y-10} x2={point.x} y2={point.y-40}/>
         <path d={`M ${point.x} ${point.y-40} L ${point.x+20} ${point.y-33} L ${point.x} ${point.y-26} Z`}/>
        </g>
       )}
       <circle cx={point.x} cy={point.y} r={landmark?9:6}/>
       <text x={point.x} y={point.y+26} textAnchor="middle">{shortName(point.degree)}</text>
      </g>
     );
    })}

    {/* The figure. It only ever stands on a waypoint, so its position is the
        game state rather than a separate animation to keep in step. */}
    <g className="questWalker" style={{transform:`translate(${here.x}px, ${here.y-9}px)`}} aria-hidden="true">
     <line className="questLeg" x1={-7} y1={-2} x2={0} y2={-18}/>
     <line className="questLeg" x1={7} y1={-2} x2={0} y2={-18}/>
     <line className="questBody" x1={0} y1={-18} x2={0} y2={-38}/>
     <line className="questArm" x1={-10} y1={-28} x2={10} y2={-32}/>
     <circle className="questHead" cx={0} cy={-46} r={8}/>
    </g>
   </svg>

   <p className="questSceneKey">
    <span><i className="questKeyDot" aria-hidden="true"/> higher ground is a higher degree</span>
    <span><i className="questKeyFlag" aria-hidden="true"/> a flag is somewhere a wrong note sends you back to</span>
   </p>
  </div>
 );
}

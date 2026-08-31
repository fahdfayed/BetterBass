import {useMemo,useState} from "react";
import ExerciseTabs from "../tab/ExerciseTabs";
import {type Chain,DEVICES,PROGRESSIONS,QUALITIES,cycleStudy,deviceStudy,extensionStudy,
 progressionLine,targetStudy} from "../tab/chromatic-library";

/**
 * Drill the chromatic devices, rather than only read about them.
 *
 * The course explains chromatic approaches, enclosures and side-slipping across
 * three lessons carrying four exercises each. That is enough material to
 * understand the devices and far too little to own them: they are hand skills,
 * and hand skills need the same shape aimed at every chord tone of every
 * quality, in every key.
 *
 * The studies are generated from the devices rather than written out, so what
 * this page offers is the whole grid — nine ways of arriving at a note, eleven
 * chord qualities, every chord tone and extension, round the cycle and through
 * ten progressions — instead of a fixed selection somebody had time to typeset.
 */

const STUDY_KINDS=[
 {id:"chord",label:"Across the chord",
  blurb:"One device aimed at each chord tone in turn. Four bars, and the device changes meaning as the target moves."},
 {id:"target",label:"One target, two registers",
  blurb:"The same approach into one chord tone, low then an octave up, so it stops being a shape and becomes a sound."},
 {id:"ext",label:"Above the seventh",
  blurb:"The ninth, eleventh and thirteenth. Chord tones prove the harmony; these say something about it."},
 {id:"cycle",label:"Round the cycle",
  blurb:"Twelve bars, the root up a fourth each time, back where it started. A fourth is one string across."},
 {id:"line",label:"Through a progression",
  blurb:"The device placed where the harmony actually changes, aimed at the guide tones that carry it."},
] as const;

type Kind=typeof STUDY_KINDS[number]["id"];

export default function ChromaticGym(){
 const [deviceId,setDeviceId]=useState(DEVICES[0].id);
 const [qualityId,setQualityId]=useState(QUALITIES[0].id);
 const [kind,setKind]=useState<Kind>("chord");
 const [progressionId,setProgressionId]=useState(PROGRESSIONS[0].id);
 const [chain,setChain]=useState<Chain>("3-7");

 const device=DEVICES.find(d=>d.id===deviceId)!;
 const quality=QUALITIES.find(q=>q.id===qualityId)!;
 const progression=PROGRESSIONS.find(p=>p.id===progressionId)!;

 const exercises=useMemo(()=>{
  if(kind==="line")return [progressionLine(device,progression,chain)];
  if(kind==="ext")return [extensionStudy(device,quality)];
  if(kind==="cycle")return [1,3].map(index=>cycleStudy(device,quality,index));
  if(kind==="target")
   return quality.tones.map((_,index)=>targetStudy(device,quality,index));
  return [deviceStudy(device,quality)];
 },[device,quality,kind,progression,chain]);

 // The count is the argument for the page existing, so it is stated rather
 // than left to be discovered.
 const total=DEVICES.length*QUALITIES.length*(1+quality.tones.length+1+2)
  +DEVICES.length*PROGRESSIONS.length*2;

 return (
  <div className="osScreen chromaticGym">
   <div className="screenIntro">
    <span>CHROMATIC GYM</span>
    <h1 data-page-heading tabIndex={-1}>Every approach, every chord tone, every key.</h1>
    <p>
     A chromatic device is a way of arriving at a note, not a tune — so these are
     generated from the devices themselves. Pick how you want to arrive, what you
     are arriving at, and the studies are written out for you in any of the twelve keys.
    </p>
   </div>

   <div className="gymCount">
    <div><b className="mono">{DEVICES.length}</b><span>DEVICES</span></div>
    <div><b className="mono">{QUALITIES.length}</b><span>CHORD QUALITIES</span></div>
    <div><b className="mono">{total}</b><span>STUDIES</span></div>
    <div><b className="mono">12</b><span>KEYS EACH</span></div>
   </div>

   <section className="gymPick">
    <header><span className="label">01 · HOW YOU ARRIVE</span></header>
    <div className="gymDevices">
     {DEVICES.map(item=>(
      <button
       key={item.id}
       type="button"
       className={`gymChip ${item.id===deviceId?"on":""}`}
       aria-pressed={item.id===deviceId}
       onClick={()=>setDeviceId(item.id)}
      >
       <b>{item.name}</b>
       <small className="mono">{item.offsets.slice(0,-1).map(o=>(o>0?`+${o}`:`${o}`)).join(" ")} → 0</small>
      </button>
     ))}
    </div>
    <div className="gymExplain">
     <p>{device.explain}</p>
     <p className="dim"><span className="label">Where it earns its place</span> {device.use}</p>
    </div>
   </section>

   <section className="gymPick">
    <header><span className="label">02 · WHAT YOU ARE ARRIVING AT</span></header>
    <div className="gymQualities">
     {QUALITIES.map(item=>(
      <button
       key={item.id}
       type="button"
       className={`gymChip ${item.id===qualityId?"on":""}`}
       aria-pressed={item.id===qualityId}
       onClick={()=>setQualityId(item.id)}
      >
       <b>{item.symbol}</b>
       <small>{item.name}</small>
      </button>
     ))}
    </div>
   </section>

   <section className="gymPick">
    <header><span className="label">03 · HOW YOU WANT TO DRILL IT</span></header>
    <div className="gymKinds">
     {STUDY_KINDS.map(item=>(
      <button
       key={item.id}
       type="button"
       className={`gymChip wide ${item.id===kind?"on":""}`}
       aria-pressed={item.id===kind}
       onClick={()=>setKind(item.id)}
      >
       <b>{item.label}</b>
       <small>{item.blurb}</small>
      </button>
     ))}
    </div>
   </section>

   {kind==="line"&&(
    <section className="gymPick">
     <header><span className="label">04 · OVER WHAT HARMONY</span></header>
     <div className="gymDevices">
      {PROGRESSIONS.map(item=>(
       <button
        key={item.id}
        type="button"
        className={`gymChip ${item.id===progressionId?"on":""}`}
        aria-pressed={item.id===progressionId}
        onClick={()=>setProgressionId(item.id)}
       >
        <b>{item.name}</b>
        <small className="mono">{item.steps.map(step=>step.label).join(" · ")}</small>
       </button>
      ))}
     </div>
     <div className="gymExplain">
      <p>{progression.blurb}</p>
      <p className="dim">
       <span className="label">Which guide tone the line starts on</span>{" "}
       The third and the seventh are what carry a chord&rsquo;s quality, and round the
       cycle they connect by a step — the third of ii is the seventh of V. Start on
       either and the line takes whichever is nearer from then on.
      </p>
     </div>
     <div className="gymKinds gymChain">
      {([["3-7","Start on the third"],["7-3","Start on the seventh"]] as const).map(([id,label])=>(
       <button
        key={id}
        type="button"
        className={`gymChip ${id===chain?"on":""}`}
        aria-pressed={id===chain}
        onClick={()=>setChain(id)}
       >
        <b>{label}</b>
       </button>
      ))}
     </div>
    </section>
   )}

   <ExerciseTabs exercises={exercises} label="Chromatic studies"/>
  </div>
 );
}

import {useMemo,useState,memo} from "react";
import NeckScene, {type NeckNote} from "../fretboard-neck-scene";
import {notesInMode,roleFor,type Role} from "../fretboard-neck-geometry";
import {OPEN_STRINGS,positionKeys,TOP_FRET} from "../fretboard-positions";
import {NOTE_NAMES} from "../pitch";
import {MODES} from "../harmony-fretboard-data";
import {type Heard,useHeardNote} from "../useHeardNote";

/**
 * Phase 1 of the 3D neck: rotate/explore, pick a root and mode, click a
 * note to hear it. Phase A adds live mic input: a note you actually play
 * lights up on the neck, the same way clicking one does. Still no backing
 * band or fog filter — see
 * docs/superpowers/specs/2026-09-06-fretboard-neck-3d-design.md for why.
 *
 * A note outside the current mode's scale has no marker to light up at
 * all — this screen only ever draws the scale's own notes, live-heard or
 * not, consistent with everything else about it.
 */

type Props={
 root:number;
 mode:number;
 onSetRoot:(root:number)=>void;
 onSetMode:(mode:number)=>void;
 audition:(pitchClasses:number[],hold?:number)=>void;
 heard:Heard;
 listening:boolean;
 connecting:boolean;
 onListen:()=>void;
};

/** How long a heard or clicked note stays lit — long enough to read as "that one", not a flash. */
const PULSE_MS=600;
const ROLE_COLOR:Record<Role,string>={root:"#c4351a",colour:"#8a6206",scale:"#63701a",outside:"#6a675e"};
const ROLE_LABEL:Record<Role,string>={root:"Root",colour:"Colour",scale:"Scale",outside:"Outside"};
const mod=(value:number)=>((value%12)+12)%12;

function FretboardNeck3D({root,mode,onSetRoot,onSetMode,audition,heard,listening,connecting,onListen}:Props){
 const [pulsingKeys,setPulsingKeys]=useState<Set<string>>(()=>new Set());

 useHeardNote(heard,(_pc,midi)=>{
  const keys=positionKeys(midi);
  setPulsingKeys(keys);
  window.setTimeout(()=>setPulsingKeys(current=>current===keys?new Set():current),PULSE_MS);
 },listening);

 const scale=useMemo(()=>notesInMode(root,mode),[root,mode]);
 const frets=useMemo(()=>Array.from({length:TOP_FRET+1},(_,index)=>index),[]);

 const notes=useMemo(()=>{
  const placed:(NeckNote&{pc:number})[]=[];
  OPEN_STRINGS.forEach((open,stringIndex)=>{
   frets.forEach(fret=>{
    const pc=mod(open+fret);
    if(!scale.includes(pc))return;
    const color=ROLE_COLOR[roleFor(pc,root,mode)];
    placed.push({key:`${stringIndex}:${fret}`,string:stringIndex,fret,pc,color,pulseColor:color});
   });
  });
  return placed;
 },[frets,scale,root,mode]);

 const handleNoteClick=(note:NeckNote&{pc:number})=>{
  audition([note.pc]);
  const keys=new Set([note.key]);
  setPulsingKeys(keys);
  window.setTimeout(()=>setPulsingKeys(current=>current===keys?new Set():current),PULSE_MS);
 };

 return (
  <div className="osScreen neck3d">
   <div className="neck3dControls">
    <label><span className="label">Root</span>
     <select value={root} onChange={event=>onSetRoot(+event.target.value)}>
      {NOTE_NAMES.map((name,index)=><option value={index} key={name}>{name}</option>)}
     </select>
    </label>
    <label><span className="label">Mode</span>
     <select value={mode} onChange={event=>onSetMode(+event.target.value)}>
      {MODES.map((entry,index)=><option value={index} key={entry.n}>{entry.n}</option>)}
     </select>
    </label>
   </div>

   {!listening&&(
    <div className="runnerConnect">
     <p>Connect your bass to see the notes you play light up on the neck.</p>
     <button type="button" className="action action-primary" onClick={onListen} aria-busy={connecting}>
      {connecting?"Connecting…":"Connect the bass"}
     </button>
    </div>
   )}

   <NeckScene notes={notes} pulsingKeys={pulsingKeys} onNoteClick={handleNoteClick}/>

   <div className="neck3dLegend">
    {(Object.keys(ROLE_COLOR) as Role[]).map(role=>(
     <span className="neck3dLegendItem" key={role}>
      <i style={{background:ROLE_COLOR[role]}}/>{ROLE_LABEL[role]}
     </span>
    ))}
   </div>
  </div>
 );
}

export default memo(FretboardNeck3D);

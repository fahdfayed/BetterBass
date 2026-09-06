import {useMemo} from "react";
import {Canvas} from "@react-three/fiber";
import {OrbitControls} from "@react-three/drei";
import {fretPosition,notesInMode,roleFor,type Role} from "../fretboard-neck-geometry";
import {OPEN_STRINGS,TOP_FRET} from "../fretboard-positions";
import {NOTE_NAMES} from "../pitch";
import {MODES} from "../harmony-fretboard-data";

/**
 * Phase 1 of the 3D neck: rotate/explore, pick a root and mode, click a
 * note to hear it. No live pitch, no backing band, no fog filter — see
 * docs/superpowers/specs/2026-09-06-fretboard-neck-3d-design.md for why.
 */

type Props={
 root:number;
 mode:number;
 onSetRoot:(root:number)=>void;
 onSetMode:(mode:number)=>void;
 audition:(pitchClasses:number[],hold?:number)=>void;
};

const SCALE_LENGTH=34;
const STRING_SPACING=0.6;
const ROLE_COLOR:Record<Role,string>={root:"#c4351a",colour:"#8a6206",scale:"#63701a",outside:"#6a675e"};
const ROLE_LABEL:Record<Role,string>={root:"Root",colour:"Colour",scale:"Scale",outside:"Outside"};
const mod=(value:number)=>((value%12)+12)%12;

export default function FretboardNeck3D({root,mode,onSetRoot,onSetMode,audition}:Props){
 const scale=useMemo(()=>notesInMode(root,mode),[root,mode]);
 const frets=useMemo(()=>Array.from({length:TOP_FRET+1},(_,index)=>index),[]);
 const fretXs=useMemo(()=>frets.map(fret=>fretPosition(fret,SCALE_LENGTH)),[frets]);
 const neckLength=fretXs[fretXs.length-1];
 const boardWidth=(OPEN_STRINGS.length-1)*STRING_SPACING;

 const notes=useMemo(()=>{
  const placed:{key:string;x:number;z:number;color:string;pc:number}[]=[];
  OPEN_STRINGS.forEach((open,stringIndex)=>{
   frets.forEach(fret=>{
    const pc=mod(open+fret);
    if(!scale.includes(pc))return;
    const role=roleFor(pc,root,mode);
    const x=fret===0?0:(fretXs[fret-1]+fretXs[fret])/2;
    placed.push({key:`${stringIndex}:${fret}`,x,z:stringIndex*STRING_SPACING,color:ROLE_COLOR[role],pc});
   });
  });
  return placed;
 },[frets,fretXs,scale,root,mode]);

 return (
  <div className="neck3d">
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

   <div className="neck3dCanvas">
    <Canvas camera={{position:[neckLength/2,9,11],fov:45}}>
     <ambientLight intensity={.7}/>
     <directionalLight position={[10,12,8]} intensity={.9}/>
     <OrbitControls target={[neckLength/2,0,boardWidth/2]} makeDefault/>

     <mesh position={[neckLength/2,-0.3,boardWidth/2]}>
      <boxGeometry args={[neckLength+1,0.4,boardWidth+0.6]}/>
      <meshStandardMaterial color="#3a2a1e"/>
     </mesh>

     {fretXs.map((x,index)=>(
      <mesh key={index} position={[x,-0.08,boardWidth/2]}>
       <boxGeometry args={[0.06,0.05,boardWidth+0.4]}/>
       <meshStandardMaterial color="#c8c2b0"/>
      </mesh>
     ))}

     {OPEN_STRINGS.map((_,stringIndex)=>(
      <mesh key={stringIndex} position={[neckLength/2,0,stringIndex*STRING_SPACING]} rotation={[0,0,Math.PI/2]}>
       <cylinderGeometry args={[0.025,0.025,neckLength+1,8]}/>
       <meshStandardMaterial color="#d8d4c4"/>
      </mesh>
     ))}

     {notes.map(note=>(
      <mesh key={note.key} position={[note.x,0.22,note.z]}
            onClick={event=>{event.stopPropagation();audition([note.pc])}}>
       <sphereGeometry args={[0.18,16,16]}/>
       <meshStandardMaterial color={note.color}/>
      </mesh>
     ))}
    </Canvas>
   </div>

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

import {useMemo,useState,memo,Component,type ReactNode} from "react";
import * as THREE from "three";
import {Canvas} from "@react-three/fiber";
import {Html,OrbitControls} from "@react-three/drei";
import {fretPosition,notesInMode,roleFor,type Role} from "../fretboard-neck-geometry";
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

const SCALE_LENGTH=34;
const STRING_SPACING=0.6;
const ROLE_COLOR:Record<Role,string>={root:"#c4351a",colour:"#8a6206",scale:"#63701a",outside:"#6a675e"};
const ROLE_LABEL:Record<Role,string>={root:"Root",colour:"Colour",scale:"Scale",outside:"Outside"};
const mod=(value:number)=>((value%12)+12)%12;

/** The frets a real bass marks with inlay dots — the ones a player actually reads position from. */
const MARKER_FRETS=[3,5,7,9,12,15,17,19];
/** G, D, A, E — same order as OPEN_STRINGS, for the labels at the nut. */
const STRING_NAMES=["G","D","A","E"];

class CanvasErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){
  if(this.state.failed)return <p className="neck3dFallback">3D isn't available in this browser right now.</p>;
  return this.props.children;
 }
}

function FretboardNeck3D({root,mode,onSetRoot,onSetMode,audition,heard,listening,connecting,onListen}:Props){
 const [pulsingKeys,setPulsingKeys]=useState<Set<string>>(()=>new Set());

 useHeardNote(heard,(_pc,midi)=>{
  const keys=positionKeys(midi);
  setPulsingKeys(keys);
  window.setTimeout(()=>setPulsingKeys(current=>current===keys?new Set():current),PULSE_MS);
 },listening);

 const scale=useMemo(()=>notesInMode(root,mode),[root,mode]);
 const frets=useMemo(()=>Array.from({length:TOP_FRET+1},(_,index)=>index),[]);
 const fretXs=useMemo(()=>frets.map(fret=>fretPosition(fret,SCALE_LENGTH)),[frets]);
 const neckLength=fretXs[fretXs.length-1];
 const boardWidth=(OPEN_STRINGS.length-1)*STRING_SPACING;

 const notes=useMemo(()=>{
  const placed:{key:string;x:number;z:number;role:Role;pc:number}[]=[];
  OPEN_STRINGS.forEach((open,stringIndex)=>{
   frets.forEach(fret=>{
    const pc=mod(open+fret);
    if(!scale.includes(pc))return;
    const role=roleFor(pc,root,mode);
    const x=fret===0?0:(fretXs[fret-1]+fretXs[fret])/2;
    placed.push({key:`${stringIndex}:${fret}`,x,z:stringIndex*STRING_SPACING,role,pc});
   });
  });
  return placed;
 },[frets,fretXs,scale,root,mode]);

 const noteGeometry=useMemo(()=>new THREE.SphereGeometry(0.18,16,16),[]);
 const fretGeometry=useMemo(()=>new THREE.BoxGeometry(0.06,0.05,boardWidth+0.4),[boardWidth]);
 const stringGeometry=useMemo(()=>new THREE.CylinderGeometry(0.025,0.025,neckLength+1,8),[neckLength]);

 const roleMaterials=useMemo(()=>{
  const materials:Record<Role,THREE.MeshStandardMaterial>={} as Record<Role,THREE.MeshStandardMaterial>;
  (Object.keys(ROLE_COLOR) as Role[]).forEach(role=>{materials[role]=new THREE.MeshStandardMaterial({color:ROLE_COLOR[role]})});
  return materials;
 },[]);
 const rolePulseMaterials=useMemo(()=>{
  const materials:Record<Role,THREE.MeshStandardMaterial>={} as Record<Role,THREE.MeshStandardMaterial>;
  (Object.keys(ROLE_COLOR) as Role[]).forEach(role=>{materials[role]=new THREE.MeshStandardMaterial({color:"#ffffff",emissive:new THREE.Color(ROLE_COLOR[role]),emissiveIntensity:.8})});
  return materials;
 },[]);
 const fretMaterial=useMemo(()=>new THREE.MeshStandardMaterial({color:"#c8c2b0"}),[]);
 const stringMaterial=useMemo(()=>new THREE.MeshStandardMaterial({color:"#d8d4c4"}),[]);

 const handleNoteClick=(note:{key:string;pc:number})=>{
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

   <div className="neck3dCanvas">
    <CanvasErrorBoundary>
     {/*
      * Looking down the neck from the headstock end, the way a player
      * glances at their own instrument — not a side-on view from whichever
      * string happens to sit at one end of the string-spacing math.
      */}
     <Canvas camera={{position:[-4,10,boardWidth/2-1],fov:55}} frameloop="demand">
      <ambientLight intensity={.7}/>
      <directionalLight position={[10,12,8]} intensity={.9}/>
      <OrbitControls target={[neckLength*.22,0,boardWidth/2]} makeDefault/>

      {/*
       * Real DOM text via drei's `<Html>`, not drei's `<Text>` (troika-three-text):
       * troika needs an explicit local font or it phones home to a CDN this
       * app's CSP blocks, and even a bundled font crashed the WebGL context
       * outright in testing (its SDF-texture path chokes badly enough to lose
       * the whole canvas, not just fail to render text). Html sidesteps all
       * of that — it's the page's own text rendering, using the site's own
       * fonts already, positioned to track the 3D point underneath it.
       */}
      {STRING_NAMES.map((name,stringIndex)=>(
       <Html key={name} position={[-0.8,0,stringIndex*STRING_SPACING]} center>
        <span className="neck3dStringLabel">{name}</span>
       </Html>
      ))}

      {MARKER_FRETS.map(fret=>(
       <Html key={fret} position={[(fretXs[fret-1]+fretXs[fret])/2,-0.3,boardWidth+0.7]} center>
        <span className="neck3dFretLabel">{fret}</span>
       </Html>
      ))}
      <Html position={[0,-0.3,boardWidth+0.7]} center>
       <span className="neck3dFretLabel">0</span>
      </Html>

      <mesh position={[neckLength/2,-0.3,boardWidth/2]}>
       <boxGeometry args={[neckLength+1,0.4,boardWidth+0.6]}/>
       <meshStandardMaterial color="#3a2a1e"/>
      </mesh>

      {fretXs.map((x,index)=>(
       <mesh key={index} position={[x,-0.08,boardWidth/2]} geometry={fretGeometry} material={fretMaterial}/>
      ))}

      {OPEN_STRINGS.map((_,stringIndex)=>(
       <mesh key={stringIndex} position={[neckLength/2,0,stringIndex*STRING_SPACING]} rotation={[0,0,Math.PI/2]}
             geometry={stringGeometry} material={stringMaterial}/>
      ))}

      {notes.map(note=>{
       const pulsing=pulsingKeys.has(note.key);
       return (
        <mesh key={note.key} position={[note.x,0.22,note.z]} scale={pulsing?1.4:1}
              geometry={noteGeometry} material={pulsing?rolePulseMaterials[note.role]:roleMaterials[note.role]}
              onClick={event=>{event.stopPropagation();handleNoteClick(note)}}/>
       );
      })}
     </Canvas>
    </CanvasErrorBoundary>
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

export default memo(FretboardNeck3D);

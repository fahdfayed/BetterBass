import {useMemo,useState,Component,type ReactNode} from "react";
import * as THREE from "three";
import {Canvas} from "@react-three/fiber";
import {Html,OrbitControls} from "@react-three/drei";
import {fretPosition} from "./fretboard-neck-geometry";
import {OPEN_STRINGS,TOP_FRET} from "./fretboard-positions";

/**
 * The 3D neck's physical rendering — board, frets, strings, labels, camera —
 * shared by every screen that shows one. What varies between them (the free
 * exploration screen's whole-scale view, a game's single lit-up target) is
 * just which note markers are drawn and what color they are, so that's all
 * the caller controls.
 */

export type NeckNote={
 key:string;
 /** Index into {@link OPEN_STRINGS}: 0 is the G string, 3 is the low E. */
 string:number;
 fret:number;
 /** Resting color. */
 color:string;
 /** Color while pulsing — usually the same hue, sometimes a hit/miss flash. */
 pulseColor:string;
};

type Props<T extends NeckNote>={
 notes:T[];
 pulsingKeys:Set<string>;
 onNoteClick?:(note:T)=>void;
 /**
  * Start with drag-to-rotate off. A game screen wants this — the neck is
  * there to show a target, not to be driven, and a stray touch while
  * reaching for a string shouldn't spin the camera out from under it.
  * The free-explore screen leaves this off; rotating is the point there.
  */
 defaultLocked?:boolean;
};

const SCALE_LENGTH=34;
const STRING_SPACING=0.6;

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

export default function NeckScene<T extends NeckNote>({notes,pulsingKeys,onNoteClick,defaultLocked=false}:Props<T>){
 const [locked,setLocked]=useState(defaultLocked);
 const frets=useMemo(()=>Array.from({length:TOP_FRET+1},(_,index)=>index),[]);
 const fretXs=useMemo(()=>frets.map(fret=>fretPosition(fret,SCALE_LENGTH)),[frets]);
 const neckLength=fretXs[fretXs.length-1];
 const boardWidth=(OPEN_STRINGS.length-1)*STRING_SPACING;

 const noteGeometry=useMemo(()=>new THREE.SphereGeometry(0.18,16,16),[]);
 const fretGeometry=useMemo(()=>new THREE.BoxGeometry(0.06,0.05,boardWidth+0.4),[boardWidth]);
 const stringGeometry=useMemo(()=>new THREE.CylinderGeometry(0.025,0.025,neckLength+1,8),[neckLength]);
 const fretMaterial=useMemo(()=>new THREE.MeshStandardMaterial({color:"#c8c2b0"}),[]);
 const stringMaterial=useMemo(()=>new THREE.MeshStandardMaterial({color:"#d8d4c4"}),[]);

 // One material per distinct color actually in use, not one per note — a
 // typical neck repeats the same handful of role/target colors many times.
 const baseMaterials=useMemo(()=>new Map<string,THREE.MeshStandardMaterial>(),[]);
 const pulseMaterials=useMemo(()=>new Map<string,THREE.MeshStandardMaterial>(),[]);
 const materialFor=(cache:Map<string,THREE.MeshStandardMaterial>,color:string,pulsing:boolean)=>{
  let material=cache.get(color);
  if(!material){
   material=pulsing
    ?new THREE.MeshStandardMaterial({color:"#ffffff",emissive:new THREE.Color(color),emissiveIntensity:.8})
    :new THREE.MeshStandardMaterial({color});
   cache.set(color,material);
  }
  return material;
 };

 return (
  <div className="neck3dCanvas">
   <button type="button" className={`neck3dLockToggle${locked?" locked":""}`}
           onClick={()=>setLocked(current=>!current)}>
    {locked?"Locked — tap to rotate":"Lock rotation"}
   </button>
   <CanvasErrorBoundary>
    {/*
     * Looking down the neck from the headstock end, the way a player
     * glances at their own instrument — not a side-on view from whichever
     * string happens to sit at one end of the string-spacing math.
     */}
    <Canvas camera={{position:[-4,10,boardWidth/2-1],fov:55}} frameloop="demand">
     <ambientLight intensity={.7}/>
     <directionalLight position={[10,12,8]} intensity={.9}/>
     {/*
      * Slower and damped: the raw defaults turn a light touch or a small
      * mouse move into a full spin, which reads as the neck fighting the
      * player rather than responding to them.
      */}
     <OrbitControls target={[neckLength*.22,0,boardWidth/2]} makeDefault enabled={!locked}
                     enableDamping dampingFactor={.12} rotateSpeed={.5} zoomSpeed={.6} panSpeed={.5}/>

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
      const material=pulsing?materialFor(pulseMaterials,note.pulseColor,true):materialFor(baseMaterials,note.color,false);
      const x=note.fret===0?0:(fretXs[note.fret-1]+fretXs[note.fret])/2;
      const z=note.string*STRING_SPACING;
      return (
       <mesh key={note.key} position={[x,0.22,z]} scale={pulsing?1.4:1}
             geometry={noteGeometry} material={material}
             onClick={onNoteClick&&(event=>{event.stopPropagation();onNoteClick(note)})}/>
      );
     })}
    </Canvas>
   </CanvasErrorBoundary>
  </div>
 );
}

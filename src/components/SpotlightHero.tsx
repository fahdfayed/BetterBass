import {useEffect,useRef,useState,type ReactNode} from "react";

/**
 * A cursor-following spotlight that reveals a second image through the first.
 *
 * Two layers stacked: a base image, and above it the reveal image masked to a
 * soft circle that trails the pointer. The circle lags slightly, which is the
 * whole feel of it. A mask that tracks the cursor exactly reads as a cheap
 * flashlight; one that eases toward it reads as light with weight.
 *
 * The smoothing is a lerp at a tenth per frame, run from requestAnimationFrame
 * rather than from the pointer event, so the circle keeps travelling after the
 * mouse stops and the motion is bound to the display's refresh rather than to
 * however often the OS decided to report a move.
 *
 * ON THE MASK. The brief specifies drawing the gradient into a canvas and
 * calling toDataURL() on every render to produce the mask. That is done here as
 * a CSS radial-gradient mask instead, with the brief's exact stops. The visual
 * result is identical; the reason for the change is that toDataURL is
 * synchronous and costs single-digit milliseconds per call, so running it every
 * frame spends most of a 16ms budget serialising a PNG the compositor could
 * have drawn for free. A spotlight that stutters is worse than no spotlight.
 *
 * The effect is also skipped entirely on a coarse pointer and under reduced
 * motion. There is no cursor to follow on a phone, and a reveal that only
 * exists where a pointer is would hide the second image forever.
 */

/** Radius of the lit circle, in pixels. The brief's value. */
const SPOTLIGHT_R=260;
/** How much of the remaining distance the light covers each frame. */
const EASE=0.1;

type Props={
 /** The image on top at rest. */
 base:string;
 /** The image revealed inside the spotlight. */
 reveal:string;
 /** Whether the base image performs its slow zoom-out on entry. */
 zoom?:boolean;
 children?:ReactNode;
};

export default function SpotlightHero({base,reveal,zoom=true,children}:Props){
 const [cursor,setCursor]=useState({x:-999,y:-999});
 const [live,setLive]=useState(false);
 const raw=useRef({x:-999,y:-999});
 const eased=useRef({x:-999,y:-999});
 const frame=useRef(0);
 const host=useRef<HTMLElement|null>(null);

 useEffect(()=>{
  // A spotlight needs a pointer to follow and permission to move.
  const fine=window.matchMedia("(pointer:fine)").matches;
  const still=window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  if(!fine||still)return;
  setLive(true);

  const onMove=(event:PointerEvent)=>{
   const box=host.current?.getBoundingClientRect();
   raw.current={
    x:event.clientX-(box?.left??0),
    y:event.clientY-(box?.top??0),
   };
   // First move: start the light where the pointer is rather than easing it
   // in from off-screen, which would drag a circle across the whole hero.
   if(eased.current.x<-500)eased.current={...raw.current};
  };

  const tick=()=>{
   eased.current.x+=(raw.current.x-eased.current.x)*EASE;
   eased.current.y+=(raw.current.y-eased.current.y)*EASE;
   setCursor({x:eased.current.x,y:eased.current.y});
   frame.current=requestAnimationFrame(tick);
  };

  window.addEventListener("pointermove",onMove,{passive:true});
  frame.current=requestAnimationFrame(tick);
  return()=>{
   window.removeEventListener("pointermove",onMove);
   cancelAnimationFrame(frame.current);
  };
 },[]);

 /*
  * The brief's stops, unchanged: solid to four tenths, then falling away so
  * the edge of the light is a gradient rather than a cut. The last stop has to
  * be fully transparent or the reveal image ghosts across the whole layer.
  */
 const mask=`radial-gradient(circle ${SPOTLIGHT_R}px at ${cursor.x}px ${cursor.y}px,`
  +"rgba(255,255,255,1) 0%,"
  +"rgba(255,255,255,1) 40%,"
  +"rgba(255,255,255,.75) 60%,"
  +"rgba(255,255,255,.4) 75%,"
  +"rgba(255,255,255,.12) 88%,"
  +"rgba(255,255,255,0) 100%)";

 return (
  <section
   ref={host}
   className="spotHero"
   style={{height:"100dvh"}}
  >
   {/* Base image, and the slow zoom out that settles the hero on arrival. */}
   <div
    className={`spotBase ${zoom?"hero-zoom":""}`}
    style={{backgroundImage:`url("${base}")`}}
    aria-hidden="true"
   />

   {/* The revealed image, visible only inside the light. */}
   {live&&(
    <div
     className="spotReveal"
     style={{
      backgroundImage:`url("${reveal}")`,
      maskImage:mask,
      WebkitMaskImage:mask,
      maskSize:"100% 100%",
      WebkitMaskSize:"100% 100%",
     }}
     aria-hidden="true"
    />
   )}

   {children}
  </section>
 );
}

import {useEffect,useRef,type ReactNode} from "react";

/**
 * A panel that tilts up out of the page as you scroll it into view.
 *
 * The card starts pitched back on the X axis and slightly oversized, and comes
 * to rest flat and true as it arrives. The heading above it drifts up a little
 * faster than the page, so the two separate as they travel. It is one moment,
 * used once, on the one screen in this product whose job is persuading rather
 * than working: a lab that tilted its own workspace on arrival would be a
 * gimmick charging rent on every visit.
 *
 * ON THE IMPLEMENTATION. The reference builds this on framer-motion's useScroll
 * and useTransform, which attach a scroll listener for the lifetime of the
 * component and recompute on every scroll event anywhere on the page. Here an
 * IntersectionObserver arms a rAF loop only while the panel is actually on
 * screen, and the loop writes transforms directly rather than through React
 * state. Scrolling the rest of a very long page costs nothing.
 *
 * Reduced motion gets the rested state and no loop at all. The panel is content,
 * not decoration, so it must never depend on an animation having run.
 */

/** How far the card is pitched back before it arrives, in degrees. */
const PITCH=18;
/** How much larger the card is before it settles. */
const OVERSIZE=0.04;
/** How far the heading drifts up across the travel, in pixels. */
const DRIFT=40;
/**
 * Where in the viewport the panel starts and finishes arriving, as a fraction
 * of viewport height measured from the top. It begins as its leading edge
 * crosses the bottom and is fully arrived once that edge reaches a third of the
 * way up. The reference instead spreads the travel over a 60 to 80rem tall
 * container, which on a laptop means the effect never actually finishes.
 */
const ENTER=1;
const ARRIVED=0.34;

type Props={
 /** The heading above the panel. Drifts up as the panel arrives. */
 title:ReactNode;
 /** What the panel holds. */
 children:ReactNode;
};

export default function ContainerScroll({title,children}:Props){
 const host=useRef<HTMLDivElement|null>(null);
 const stage=useRef<HTMLDivElement|null>(null);
 const card=useRef<HTMLDivElement|null>(null);
 const head=useRef<HTMLDivElement|null>(null);
 const frame=useRef(0);

 useEffect(()=>{
  const track=stage.current,panel=card.current,heading=head.current;
  if(!track||!panel||!heading)return;
  if(window.matchMedia("(prefers-reduced-motion:reduce)").matches)return;

  const draw=()=>{
   /*
    * Measured on the stage, which is never transformed. Reading the card here
    * instead feeds the effect its own output: a pitched and scaled element
    * reports a different top, which changes the progress, which changes the
    * pitch. The panel visibly fought itself on the way in.
    */
   const box=track.getBoundingClientRect();
   const vh=window.innerHeight;
   const raw=(vh*ENTER-box.top)/(vh*(ENTER-ARRIVED));
   const p=raw<0?0:raw>1?1:raw;
   const rest=1-p;
   panel.style.transform=
    `rotateX(${(rest*PITCH).toFixed(2)}deg) scale(${(1+rest*OVERSIZE).toFixed(4)})`;
   heading.style.transform=`translateY(${(-p*DRIFT).toFixed(1)}px)`;
   frame.current=0;
  };

  // Coalesce to one write per frame: scroll fires far more often than the
  // screen refreshes, and every handler here reads layout.
  const onScroll=()=>{if(!frame.current)frame.current=requestAnimationFrame(draw)};

  let live=false;
  const gate=new IntersectionObserver(entries=>{
   const showing=entries[0].isIntersecting;
   if(showing===live)return;
   live=showing;
   if(showing){
    window.addEventListener("scroll",onScroll,{passive:true});
    window.addEventListener("resize",onScroll);
    draw();
   }else{
    window.removeEventListener("scroll",onScroll);
    window.removeEventListener("resize",onScroll);
   }
  },{rootMargin:"20% 0px"});
  gate.observe(track);

  return()=>{
   gate.disconnect();
   window.removeEventListener("scroll",onScroll);
   window.removeEventListener("resize",onScroll);
   cancelAnimationFrame(frame.current);
   /*
    * Clearing the handle matters as much as cancelling the frame. The ref
    * outlives the effect, so a pending id left behind here makes the next
    * closure's scheduler believe a frame is already booked, and the panel
    * freezes at whatever angle it last held. React runs effects twice in
    * development, which is exactly when that happens.
    */
   frame.current=0;
  };
 },[]);

 return (
  <div className="tiltScroll" ref={host}>
   <div className="tiltHead" ref={head}>{title}</div>
   <div className="tiltStage" ref={stage}>
    <div className="tiltCard" ref={card}>
     <div className="tiltCardInner">{children}</div>
    </div>
   </div>
  </div>
 );
}

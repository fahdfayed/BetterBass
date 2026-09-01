import {useCallback,useEffect,useRef,useState} from "react";
import Icon from "../Icon";
import {peersFor} from "../../nav";
import {goToView,useRoute} from "../../router";

/**
 * The section dock: everywhere else you can go from here.
 *
 * A player working in the fretboard map should be able to see, without opening
 * anything, that the backing band and the chromatic gym are one press away.
 * Navigation in this app is otherwise a place you go (the contents, the
 * palette), which is right for moving between sections and wrong for moving
 * between the tools inside one.
 *
 * It lives in the fixed bar along the bottom edge, beside the transport. It was
 * at the foot of the sheet first, which was wrong for the reason that matters
 * most: a working route here is thousands of pixels tall, so "at the bottom of
 * the section" meant scrolling past the entire workspace to reach the control
 * whose only job is leaving that workspace. Navigation that costs a scroll is
 * navigation nobody uses.
 *
 * It shares the bar with the instrument rather than replacing it. The transport
 * starts and stops the thing you came here to do, and the two are not competing
 * for the same moment: one is used while playing, the other between. The bar
 * carries both, the instrument at the left where it already was, the
 * destinations filling the rest.
 *
 * ON THE MAGNIFICATION. The reference implementation drives it with React state
 * per icon and animates width and height. Both are replaced here. Continuous
 * pointer values in state re-render the tree on every mouse move, and width and
 * height are layout properties, so twelve of them changing per frame is twelve
 * reflows per frame. This writes one custom property per element from a single
 * rAF loop and reads it back as transform, which the compositor handles without
 * touching layout. The loop is started by the pointer and stops itself once
 * everything has settled, so it costs nothing while you are not using it.
 *
 * ON THE TOOLTIP. There is one, shared, and it is a sibling of the scrolling
 * row rather than a child of each button. A row that scrolls sideways clips
 * both axes, so a tooltip inside it would be cut off by the bar it is trying to
 * rise out of. It answers to focus as well as hover, because a label only a
 * mouse can reveal is a label a keyboard user does not have.
 */

/** How far from the pointer an item still responds, in pixels. */
const REACH=140;
/** Extra scale on the disc directly under the pointer. */
const PEAK=0.42;
/** How much of the remaining distance the magnification covers each frame. */
const EASE=0.18;
/** Below this, treat the magnification as arrived and stop the loop. */
const SETTLED=0.001;

type Tip={label:string;x:number};

export default function DockTabs(){
 const route=useRoute();
 const peers=peersFor(route.view);

 const host=useRef<HTMLElement|null>(null);
 const row=useRef<HTMLDivElement|null>(null);
 const discs=useRef<HTMLElement[]>([]);
 /** Pointer position in client coordinates, or far away when it has left. */
 const pointer=useRef(-1e5);
 /** Current magnification per item, lerped toward its target. */
 const mags=useRef<number[]>([]);
 /** Cached centres, so the loop does not measure twelve elements per frame. */
 const centres=useRef<number[]>([]);
 const frame=useRef(0);
 const [tip,setTip]=useState<Tip|null>(null);

 const measure=useCallback(()=>{
  centres.current=discs.current.map(el=>{
   const box=el.getBoundingClientRect();
   return box.left+box.width/2;
  });
 },[]);

 const tick=useCallback(()=>{
  let moving=false;
  discs.current.forEach((el,i)=>{
   const distance=Math.abs(pointer.current-(centres.current[i]??0));
   const want=distance<REACH?1-distance/REACH:0;
   const now=mags.current[i]??0;
   const next=now+(want-now)*EASE;
   mags.current[i]=next;
   if(Math.abs(want-next)>SETTLED)moving=true;
   el.style.setProperty("--mag",next.toFixed(4));
  });
  // Keep going while anything is still travelling, and stop once the row has
  // arrived. A permanently running frame loop for a navigation strip is not a
  // cost this page should carry when nobody is pointing at it.
  frame.current=moving?requestAnimationFrame(tick):0;
 },[]);

 const start=useCallback(()=>{
  if(!frame.current)frame.current=requestAnimationFrame(tick);
 },[tick]);

 useEffect(()=>{
  // No pointer to follow, or motion turned off: the dock still lists and still
  // navigates, it simply does not lift.
  const fine=window.matchMedia("(pointer:fine)").matches;
  const still=window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  if(!fine||still)return;
  const element=row.current;
  if(!element)return;

  const onEnter=()=>{measure();start()};
  const onMove=(event:PointerEvent)=>{pointer.current=event.clientX;start()};
  const onLeave=()=>{pointer.current=-1e5;start()};

  element.addEventListener("pointerenter",onEnter);
  element.addEventListener("pointermove",onMove,{passive:true});
  element.addEventListener("pointerleave",onLeave);
  // The row scrolls sideways when it does not fit, which moves every centre.
  element.addEventListener("scroll",measure,{passive:true});
  window.addEventListener("resize",measure);

  return()=>{
   element.removeEventListener("pointerenter",onEnter);
   element.removeEventListener("pointermove",onMove);
   element.removeEventListener("pointerleave",onLeave);
   element.removeEventListener("scroll",measure);
   window.removeEventListener("resize",measure);
   cancelAnimationFrame(frame.current);
   frame.current=0;
  };
 },[measure,start,peers?.items.length]);

 /** Park the tooltip over whichever control is being pointed at or focused. */
 const raise=(label:string)=>(event:{currentTarget:HTMLElement})=>{
  const bar=host.current?.getBoundingClientRect();
  const box=event.currentTarget.getBoundingClientRect();
  setTip({label,x:box.left+box.width/2-(bar?.left??0)});
 };

 // A section with nowhere else to go does not get a dock.
 if(!peers||peers.items.length<2)return null;

 return (
  <nav
   className="dockTabs"
   aria-label={`Elsewhere in ${peers.label}`}
   ref={host}
   onMouseLeave={()=>setTip(null)}
  >
   <div className="dockTabsRow" ref={row}>
    {peers.items.map((item,index)=>{
     const here=item.view===route.view;
     return (
      <button
       key={item.view}
       type="button"
       className="dockTab"
       aria-current={here?"page":undefined}
       aria-label={item.label}
       onClick={()=>goToView(item.view)}
       onMouseEnter={raise(item.label)}
       onFocus={raise(item.label)}
       onBlur={()=>setTip(null)}
      >
       <span
        className="dockTabDisc"
        ref={el=>{if(el)discs.current[index]=el}}
       >
        <Icon name={item.icon}/>
       </span>
      </button>
     );
    })}
   </div>
   {tip&&(
    <span className="dockTabTip" style={{left:tip.x}} aria-hidden="true">
     {tip.label}
    </span>
   )}
  </nav>
 );
}

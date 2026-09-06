/**
 * Sections arrive as you reach them.
 *
 * Everything used to animate on load, which meant the whole screen played its
 * entrance at once and anything below the fold had finished moving before it
 * was ever looked at. This watches instead, and each block rises the first time
 * it comes into view.
 *
 * One observer for the whole document rather than a hook per screen: there are
 * twenty-three of them, several predate the current component style, and none
 * of them should have to know that this exists.
 *
 * The hiding is done by a class on the root element that only this file sets.
 * If the script never runs — an error earlier in the bundle, an old browser,
 * scripting switched off — nothing is hidden and every section is simply
 * visible, which is the correct failure.
 */

const READY="reveal-ready";
const SEEN="revealed";

const SELECTOR=[
 ".osScreen > section",
 ".osScreen > article",
 ".osScreen > .gameShelf > article",
 ".screenIntro",
 ".runner",
 ".sniper",
 ".techArea",
 ".techDrills",
].join(",");

export function startReveals(){
 if(typeof window==="undefined"||!("IntersectionObserver" in window))return;

 // Somebody who has asked for less motion gets none of this, and nothing is
 // ever hidden in the first place.
 const still=window.matchMedia("(prefers-reduced-motion: reduce)");
 if(still.matches)return;

 document.documentElement.classList.add(READY);

 const shown=new WeakSet<Element>();

 /** Stop hiding anything, permanently. Nothing here is worth a blank screen. */
 const giveUp=()=>{
  document.documentElement.classList.remove(READY);
  for(const node of document.querySelectorAll(SELECTOR))node.classList.add(SEEN);
 };

 const watcher=new IntersectionObserver(entries=>{
  delivered=true;
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   entry.target.classList.add(SEEN);
   shown.add(entry.target);
   // Once a thing has arrived it has arrived; re-animating on the way back up
   // is the sort of motion people turn off.
   watcher.unobserve(entry.target);
  }
 },{
  // A little before the edge, so a block is already settling by the time it is
  // properly in view rather than starting to move once it is.
  rootMargin:"0px 0px -12% 0px",
  threshold:.08,
 });

 const observe=(root:ParentNode)=>{
  for(const node of root.querySelectorAll(SELECTOR)){
   if(shown.has(node))continue;
   /*
    * Anything already on screen when it is first seen is marked without being
    * watched. Otherwise the first paint of a route shows its top sections
    * blank for a frame before the observer's first callback.
    */
   const box=node.getBoundingClientRect();
   if(box.top<window.innerHeight&&box.bottom>0){
    node.classList.add(SEEN);
    shown.add(node);
    continue;
   }
   watcher.observe(node);
  }
 };

 observe(document);

 /*
  * A watchdog, because hiding content is only acceptable while something is
  * reliably unhiding it.
  *
  * An observer that never delivers a callback leaves every section below the
  * fold invisible for good. That is not hypothetical: it is exactly what
  * happens in a browser view that is not compositing, and it would happen for
  * anyone whose browser has the constructor but does not run it. If nothing
  * has arrived shortly after start-up, the whole mechanism switches itself off
  * and every section is simply shown.
  */
 let delivered=false;
 window.setTimeout(()=>{
  if(delivered)return;
  giveUp();
 },2000);

 /*
  * A safety net for anything scrolled straight past.
  *
  * IntersectionObserver reports threshold crossings, and a jump to the bottom
  * of a long page — the End key, dragging the scrollbar, following an anchor —
  * takes a section from below the viewport to above it within a single frame.
  * The ratio is zero before and zero after, so no callback is ever delivered
  * and that section stays hidden until somebody scrolls back up to it.
  *
  * This reveals only what is already fully above the viewport, so it can never
  * pre-empt the animation for something still on its way in. It is throttled to
  * one frame and reads a handful of boxes, which is cheap enough to be a net
  * rather than a mechanism.
  */
 let queued=false;
 const sweepPassed=()=>{
  queued=false;
  for(const node of document.querySelectorAll(SELECTOR)){
   if(node.classList.contains(SEEN))continue;
   if(node.getBoundingClientRect().bottom>=0)continue;
   node.classList.add(SEEN);
   shown.add(node);
   watcher.unobserve(node);
  }
 };
 const onScroll=()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(sweepPassed);
 };
 window.addEventListener("scroll",onScroll,{passive:true});

 // Screens are swapped by the router rather than by a page load, so new
 // sections appear without anything else telling us.
 const dom=new MutationObserver(records=>{
  for(const record of records)
   for(const node of record.addedNodes)
    if(node instanceof Element)observe(node.parentNode??document);
 });
 dom.observe(document.body,{childList:true,subtree:true});

 // If the preference changes mid-session, stop hiding things immediately.
 still.addEventListener("change",event=>{
  if(!event.matches)return;
  watcher.disconnect();dom.disconnect();
  window.removeEventListener("scroll",onScroll);
  giveUp();
 });
}

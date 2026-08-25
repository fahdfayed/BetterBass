import {useEffect} from "react";

/**
 * Reveal-on-scroll for anything carrying `.reveal` inside the current page.
 *
 * One observer for the whole page rather than one per element, re-scanned when
 * `key` changes (i.e. on navigation). Elements are unobserved once seen so a
 * long page does not keep a growing observer set alive.
 *
 * Progressive enhancement: motion.css only hides `.reveal` under `html.js`, so
 * if this never runs the content is visible rather than stuck invisible.
 */
export function useReveal(key:unknown){
 useEffect(()=>{
  const targets=Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.seen)"));
  if(!targets.length)return;

  if(!("IntersectionObserver" in window)){
   targets.forEach(node=>node.classList.add("seen"));
   return;
  }

  const observer=new IntersectionObserver((entries,self)=>{
   entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    entry.target.classList.add("seen");
    self.unobserve(entry.target);
   });
  },{rootMargin:"0px 0px -8% 0px",threshold:.08});

  targets.forEach(node=>observer.observe(node));
  return()=>observer.disconnect();
 },[key]);
}

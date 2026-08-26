import {useSyncExternalStore} from "react";

/**
 * Ground selection: the dark studio default, or cream for lit rooms.
 *
 * The choice is written to the root element as data-theme and to localStorage,
 * and applied before first paint from index.html so the page never flashes the
 * wrong ground on load.
 */

export type Theme="dark"|"cream";

const KEY="basslab-theme";
const EVENT="basslab-theme-change";

const readStore=()=>{
 try{return localStorage.getItem(KEY)}catch{return null}
};

export function currentTheme():Theme{
 if(typeof document==="undefined")return "dark";
 return document.documentElement.dataset.theme==="cream"?"cream":"dark";
}

export function applyTheme(theme:Theme){
 if(typeof document==="undefined")return;
 if(theme==="cream")document.documentElement.dataset.theme="cream";
 else delete document.documentElement.dataset.theme;
 // The browser chrome around the page should match the ground it frames.
 document.querySelector('meta[name="theme-color"]')?.setAttribute("content",theme==="cream"?"#f5f0e8":"#08080a");
 try{localStorage.setItem(KEY,theme)}catch{/* storage may be unavailable */}
 window.dispatchEvent(new Event(EVENT));
}

/** Called once at start-up, before React mounts. */
export function initTheme(){
 const saved=readStore();
 if(saved==="cream"||saved==="dark"){applyTheme(saved);return}
 // No stored preference: follow the operating system.
 const prefersLight=typeof window!=="undefined"&&window.matchMedia("(prefers-color-scheme: light)").matches;
 applyTheme(prefersLight?"cream":"dark");
}

export const toggleTheme=()=>applyTheme(currentTheme()==="cream"?"dark":"cream");

const subscribe=(onChange:()=>void)=>{
 window.addEventListener(EVENT,onChange);
 window.addEventListener("storage",onChange);
 return()=>{window.removeEventListener(EVENT,onChange);window.removeEventListener("storage",onChange)};
};

export function useTheme(){
 return useSyncExternalStore(subscribe,currentTheme,()=>"dark" as Theme);
}

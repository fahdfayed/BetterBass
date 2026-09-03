import {inTime} from "./conductor";
import {useSyncExternalStore} from "react";

/**
 * Minimal History-API router.
 *
 * The whole studio used to live at "/" as React state: no back button, no deep
 * links, and a reload always dropped you back on the dashboard. Every view now
 * has an address, so a lesson or a lab can be bookmarked and shared, and the
 * browser's own navigation works the way people expect.
 *
 * Deliberately dependency-free — this needs one map and two functions, not a
 * routing library.
 */

export type Route={view:string;params:Record<string,string>;path:string};

type Pattern={path:string;view:string};

// Order matters: static segments are matched before dynamic ones.
const ROUTES:Pattern[]=[
 {path:"/",view:"course"},
 {path:"/map",view:"map"},
 {path:"/course",view:"roadmap"},
 {path:"/course/:lesson",view:"courseLesson"},
 {path:"/practice",view:"practice"},
 {path:"/practice/manual",view:"manual"},
 {path:"/practice/today",view:"today"},
 {path:"/practice/live",view:"live"},
 {path:"/coach",view:"coach"},
 {path:"/coach/plan",view:"adaptive"},
 {path:"/maqam",view:"maqam"},
 {path:"/slap",view:"slap"},
 {path:"/masterclass/jaco",view:"jaco"},
 {path:"/labs",view:"tools"},
 {path:"/labs/fretboard",view:"fret"},
 {path:"/labs/band",view:"runtime"},
 {path:"/labs/analyze",view:"engine"},
 {path:"/labs/outside",view:"advanced"},
 {path:"/labs/theory",view:"reference"},
 {path:"/labs/progression",view:"progression"},
 {path:"/labs/chromatic",view:"chromatic"},
 {path:"/labs/technique",view:"technique"},
 {path:"/labs/quest",view:"quest"},
 {path:"/labs/games",view:"games"},
 {path:"/labs/tabs",view:"tabs"},
 {path:"/progress",view:"courseProgress"},
];

/**
 * Broadcast on every route change. Exported because the error boundary listens
 * for it too: leaving a broken address is what releases the crash screen.
 */
export const ROUTE_EVENT="basslab-route";
const FALLBACK:Route={view:"course",params:{},path:"/"};

const segments=(path:string)=>path.replace(/\/+$/,"").split("/").filter(Boolean);

function matchPath(path:string):Route|null{
 const parts=segments(path);
 for(const candidate of ROUTES){
  const shape=segments(candidate.path);
  if(shape.length!==parts.length)continue;
  const params:Record<string,string>={};
  let matched=true;
  for(let i=0;i<shape.length;i++){
   const piece=shape[i];
   if(piece.startsWith(":"))params[piece.slice(1)]=decodeURIComponent(parts[i]);
   else if(piece!==parts[i]){matched=false;break}
  }
  if(matched)return {view:candidate.view,params,path};
 }
 return null;
}

/** The address for a view, so navigation stays declarative at the call site. */
export function pathForView(view:string,params:Record<string,string|number>={}){
 const candidate=ROUTES.find(route=>route.view===view);
 if(!candidate)return "/";
 return candidate.path.split("/").map(piece=>piece.startsWith(":")?encodeURIComponent(String(params[piece.slice(1)]??"")):piece).join("/")||"/";
}

export function currentRoute():Route{
 if(typeof window==="undefined")return FALLBACK;
 return matchPath(window.location.pathname)??FALLBACK;
}

/**
 * Apply a route change.
 *
 * This used to run inside a View Transition, and does not any more. The turn
 * between two pages is a real sheet of paper now (page-turn.css), so the API
 * was drawing nothing — and it was not free to keep:
 *
 *   - Its update callback runs at the next rendering opportunity, not
 *     synchronously. A document that is not being rendered — a background tab,
 *     a hidden embed — has few of those, so the address changed a whole click
 *     late and the screen followed the click before it.
 *   - It aborts outright when the document is hidden or another transition is
 *     still in flight, which is why every navigation used to reject `ready`
 *     with InvalidStateError.
 *
 * A route change is now what it looks like: update the address, tell the app.
 */
function applyRoute(update:()=>void){update()}

export function navigate(path:string,{replace=false}={}){
 if(typeof window==="undefined")return;
 if(path===window.location.pathname+window.location.search)return;
 /*
  * Land in time.
  *
  * While the transport runs, a route change waits for the next eighth rather
  * than happening at the arbitrary instant a finger moved. Musicians do not
  * change at random moments. Stopped, this is immediate and costs nothing.
  */
 inTime(()=>applyRoute(()=>{
  if(replace)window.history.replaceState({},"",path);
  else window.history.pushState({},"",path);
  window.dispatchEvent(new Event(ROUTE_EVENT));
 }));
}

/** Navigate by view id, keeping call sites free of URL strings. */
export const goToView=(view:string,params?:Record<string,string|number>)=>navigate(pathForView(view,params));

let snapshot=FALLBACK;
const readSnapshot=()=>{
 const next=currentRoute();
 // useSyncExternalStore compares by identity, so only replace the cached object
 // when the address actually changed; otherwise React re-renders on every check.
 if(next.path!==snapshot.path||next.view!==snapshot.view)snapshot=next;
 return snapshot;
};

const subscribe=(onChange:()=>void)=>{
 // Back and forward take the same path as a click.
 const onPop=()=>applyRoute(onChange);
 window.addEventListener("popstate",onPop);
 window.addEventListener(ROUTE_EVENT,onChange);
 return()=>{window.removeEventListener("popstate",onPop);window.removeEventListener(ROUTE_EVENT,onChange)};
};

export function useRoute():Route{
 return useSyncExternalStore(subscribe,readSnapshot,()=>FALLBACK);
}

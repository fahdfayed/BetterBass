import {useEffect,useState,type ReactNode} from "react";
import CommandPalette from "./CommandPalette";
import Transport from "./Transport";
import DockTabs from "./ui/dock-tabs";
import {breadcrumbFor,destinationFor,NAV,sectionFor} from "../nav";
import {goToView,useRoute} from "../router";
import {useTransport} from "../useTransport";
import {useReveal} from "../useReveal";

/**
 * The stand.
 *
 * Read above, play below.
 *
 * This replaces a three-column workstation that had survived two changes of
 * visual world without anyone questioning it: a permanent rail hard left, a
 * context column hard right, and a transport strip along the bottom. That is
 * the arrangement every web application ships, and it is not the arrangement a
 * player works in. Somebody at a stand has a chart in front of them and the
 * instrument below it in their hands. Nothing is parked down the side.
 *
 * So there is no sidebar. Navigation is the contents, reached from the head of
 * the chart or by the command palette, and it is a place you go between tunes
 * rather than a column that costs you fifty-six pixels on every screen forever.
 *
 * The head of the chart carries what a lead sheet carries: what this is, what
 * key it is in, what tempo, and how far through. That metadata used to be
 * scattered through a context panel on the right; on paper it belongs at the
 * top, and putting it there is what let the panel go.
 *
 * The dock is the instrument. Transport, input, and on the routes that have one,
 * the neck sticks to the bottom of the viewport above it. Everything in the dock
 * is playing. Everything above it is reading, and it scrolls.
 */

type Props={
 course:{percent:number;index:number;total:number;title:string};
 /**
  * What the head of the chart prints.
  *
  * A lead sheet states its key, its meter, its tempo and its feel before the
  * first bar, and a player reads all of it in one glance. Three facts was a
  * caption; this is a head.
  */
 chart:{
  keyName:string;
  keyIndex:number;
  onKey:(index:number)=>void;
  keyOptions:string[];
  sound:string;
  soundIndex:number;
  onSound:(index:number)=>void;
  soundOptions:string[];
  meter:number;
  chord:string;
  feel:string;
 };
 input:{listening:boolean;detail:string};
 /** Connect or disconnect the instrument. The dock owns this control. */
 onToggleInput:()=>void;
 inputBusy?:boolean;
 actions:ReactNode;
 children:ReactNode;
};

/**
 * Reading routes hold a music system's measure; workspaces take the sheet.
 * Listing the narrow ones is the shorter and more stable list. The map is a
 * spatial training surface, not a reading document, so it deliberately takes
 * the wide measure.
 */
const READING_VIEWS=new Set(["course","roadmap","courseProgress"]);

/**
 * What the centre pill lists: the sections themselves, named by the section.
 *
 * It listed each group's first screen before, which meant the pill read "Arabic
 * maqam" where it meant Specialties, and slap bass and the Jaco masterclass,
 * the two screens sitting beside maqam in that group, were reachable from
 * nowhere a player would look. Naming the group makes the whole group findable:
 * the pill takes you into the section, and the dock along the bottom lists what
 * is inside it.
 *
 * Everything else stays in the contents, because a pill that lists twenty-four
 * routes is a menu bar wearing a rounded border.
 */
const PILL=NAV.map(group=>({label:group.label,item:group.items[0]}))
 .filter(entry=>entry.item)
 .slice(0,5);

export default function AppShell({course,chart,input,onToggleInput,inputBusy,actions,children}:Props){
 const route=useRoute();
 const [palette,setPalette]=useState(false);
 const section=sectionFor(route.view);
 /* Which section the pill should mark as current. */
 const group=destinationFor(route.view)?.group;
 const {here}=breadcrumbFor(route.view);
 const transport=useTransport();

 useReveal(route.path);

 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   const target=event.target as HTMLElement|null;
   const typing=target&&(target.tagName==="INPUT"||target.tagName==="TEXTAREA"||target.isContentEditable);
   if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setPalette(value=>!value)}
   else if(event.key==="/"&&!typing&&!palette){event.preventDefault();setPalette(true)}
  };
  window.addEventListener("keydown",onKey);
  return()=>window.removeEventListener("keydown",onKey);
 },[palette]);

 // Land on the content rather than in the chrome.
 useEffect(()=>{
  document.querySelector<HTMLElement>("[data-page-heading]")?.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:"instant" as ScrollBehavior});
 },[route.path]);

 return (
  <>
   <div className="stand">
    <a className="sr" href="#main">Skip to content</a>

    {/* ------------------------------------------------------------ the nav */}
    <nav className="navBar" aria-label="Main">
     <button type="button" className="navMark" onClick={()=>goToView("course")}>
      <svg viewBox="0 0 256 256" width="24" height="24" aria-hidden="true" fill="currentColor">
       <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z"/>
      </svg>
      <span className="navMarkWord">Outside In</span>
     </button>

     <div className="navPill">
      {PILL.map(entry=>(
       <button
        key={entry.item.view}
        type="button"
        aria-current={group===entry.label?"page":undefined}
        onClick={()=>goToView(entry.item.view)}
       >
        {entry.label}
       </button>
      ))}
     </div>

     <div className="navRight">
      {actions}
      <button
       type="button"
       className="navMenu"
       onClick={()=>setPalette(true)}
       aria-haspopup="dialog"
      >
       <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
        <path d="M1 3h14M1 8h14M1 13h9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
       </svg>
       <span className="navMenuLabel">Contents</span>
       <kbd className="navMenuKey">/</kbd>
      </button>
     </div>
    </nav>

    {/* ------------------------------------------------------------- the sheet */}
    <main
     className={`sheet page ${READING_VIEWS.has(route.view)?"reading":"wide"}`}
     id="main"
     key={route.path}
    >
     {children}
    </main>
   </div>

   {/* ------------------------------------------------------------- the dock */}
   <div className="dock" role="region" aria-label="Instrument and destinations">
    <Transport input={input} onToggleInput={onToggleInput} inputBusy={inputBusy}/>
    <DockTabs/>
   </div>

   <CommandPalette open={palette} onClose={()=>setPalette(false)}/>
  </>
 );
}
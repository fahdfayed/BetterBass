import {useCallback,useEffect,useState,type ReactNode} from "react";
import CommandPalette from "./CommandPalette";
import Transport from "./Transport";
import {LeafSlotProvider} from "./PageLeaf";
import Icon from "./Icon";
import PageTurn from "./PageTurn";
import {ALL_DESTINATIONS,destinationFor,NAV,peersFor,type IconName} from "../nav";
import {goToView,useRoute} from "../router";
import {useReveal} from "../useReveal";

/**
 * The book.
 *
 * It lies open on a stand. The left page carries the section you have opened
 * to and everything in it; the right page carries the work; the binding runs
 * between them; and the instrument is the strip along the bottom edge, where
 * your hands already are.
 *
 * This replaces a shell built for a dark photographic world: a nav bar
 * floating clear of the top edge over a full-bleed image, sections listed in a
 * glass pill at the centre of it, and a magnifying dock of section peers
 * sharing the bottom bar with the transport. Three of those four things are
 * gone, and each for the same reason — they were arrangements that suit an
 * interface floating over a picture, and there is no picture any more.
 *
 * WHAT MOVED, AND WHY.
 *
 * The section list left the floating pill and became the tabs across the head
 * of the right page. A tab is what a section divider is in a bound book, it
 * says which one you are in without a second mark, and it does not need to
 * float over anything to stay reachable.
 *
 * The peer dock left the bottom bar and became the left page. It listed where
 * else you could go inside the current section, magnifying under the pointer,
 * and it was competing with the transport for the one strip a player's hands
 * are near. On paper the contents of a section belong on the facing page.
 * That also gives the transport the whole width, which is what it needed.
 *
 * The contents control and the command palette stay exactly as they were. A
 * tab row lists five sections; twenty-six routes need a search field, and that
 * is what the palette is.
 */

type Props={
 input:{listening:boolean;detail:string};
 /** Connect or disconnect the instrument. The dock owns this control. */
 onToggleInput:()=>void;
 inputBusy?:boolean;
 actions:ReactNode;
 children:ReactNode;
};

/*
 * The course and chart props this component used to declare are gone.
 *
 * Neither was ever rendered. `chart` described a lead-sheet head — key, meter,
 * chord, feel, and the callbacks to change them — and `course` carried the
 * percentage through the course; the shell accepted both and printed neither,
 * so eleven fields were computed on every render of the application and thrown
 * away. The routes that need any of it already read it from their own state.
 */

/**
 * Reading routes hold a music system's measure; workspaces take the sheet.
 * Listing the narrow ones is the shorter and more stable list. The map is a
 * spatial training surface rather than a reading document, so it deliberately
 * takes the wide measure.
 */
const READING_VIEWS=new Set(["course","roadmap","courseProgress"]);

/**
 * The five tabs, named by the section.
 *
 * They listed each group's first screen once, which meant the row read "Arabic
 * maqam" where it meant Specialties, and slap bass and the Jaco masterclass —
 * the two screens sitting beside maqam in that group — were reachable from
 * nowhere a player would look. Naming the group makes the whole group
 * findable: the tab opens the section, and the left page lists what is in it.
 */
const TABS=NAV.map(group=>({label:group.label,item:group.items[0]}))
 .filter(entry=>entry.item)
 .slice(0,5);

/**
 * The note pencilled at the foot of the left page.
 *
 * One per section, in the product's own voice: what this part of the book is
 * asking of you, stated rather than encouraged. It is written by hand because
 * it is the one thing on the page that is not the interface talking — it is
 * the instruction a player writes to himself in a margin, which is why it is
 * never load-bearing and never the only place something is said.
 */
/*
 * The index cut into the fore-edge of the book.
 *
 * Four places a player goes mid-lesson, always in the same order and always in
 * the same position, so the one you want is reached for rather than read for.
 * They are the four questions that interrupt playing — what is this called,
 * where am I in the course, can I hear it, and what have I proved — and each
 * one already has a screen.
 */
const INDEX:Array<{view:string;label:string;icon:IconName}>=[
 {view:"reference",label:"Theory",icon:"theory"},
 {view:"map",label:"Map",icon:"map"},
 {view:"games",label:"Ear",icon:"games"},
 {view:"courseProgress",label:"Log",icon:"progress"},
];

/*
 * The reading order of the whole book, so a turn knows which way to go.
 *
 * ALL_DESTINATIONS is already the order the contents list prints and the order
 * the course opens in, which makes it the right authority: moving to a later
 * entry turns the page forward, and moving to an earlier one turns it back.
 */
const READING_ORDER=new Map(ALL_DESTINATIONS.map((entry,index)=>[entry.view,index]));

const FOCUS:Record<string,string[]>={
 Learn:["Read it once.","Play it slowly.","Then read it again."],
 Practice:["Clarity over speed.","Always neutral."],
 Specialties:["Listen deeply.","Play expressively."],
 Labs:["Start with the","smallest useful step.","Keep it musical."],
 You:["Six movements.","One standard","at a time."],
};

export default function AppShell({input,onToggleInput,inputBusy,actions,children}:Props){
 const route=useRoute();
 const [palette,setPalette]=useState(false);
 /*
  * State rather than a ref, because the portal in PageLeaf has to re-render
  * once the node exists. A ref would hold the element and tell nobody.
  */
 const [leafSlot,setLeafSlot]=useState<HTMLElement|null>(null);
 const slotRef=useCallback((node:HTMLElement|null)=>setLeafSlot(node),[]);

 const group=destinationFor(route.view)?.group;
 /*
  * What the left page lists.
  *
  * peersFor answers with the tools inside a sub-section when there is one —
  * the twelve labs, the two screens under the practice studio — and with
  * nothing at all when a destination has neither children nor siblings. The
  * section's own items are the fallback, so every route in the book has a
  * contents page rather than an empty one.
  */
 const peers=peersFor(route.view)?.items
  ??NAV.find(candidate=>candidate.label===group)?.items
  ??[];
 const focus=FOCUS[group??"Learn"]??FOCUS.Learn;

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
  <LeafSlotProvider value={leafSlot}>
   <div className="stand">
    <a className="sr" href="#main">Skip to content</a>

    <div className="book">
     {/* ==================================================== the left page */}
     <aside className="leaf" aria-label="Section contents">
      <button type="button" className="wordmark" onClick={()=>goToView("course")}>
       Outside <em>In</em>
      </button>

      {/*
        * Where a route prints its own left page. Empty on routes that do not,
        * and the default below takes over — decided by the adjacent-sibling
        * rule in book.css rather than by a flag set during render.
        */}
      <div className="leafSlot" ref={slotRef}/>

      <div className="leafDefault">
       <p className="sectionMark">{group??"Learn"}</p>
       <hr className="redRule"/>

       {/*
         * The section's contents, set on staves.
         *
         * An ordered list, and the numbers are information rather than
         * decoration: these are the screens of one section in the order the
         * course puts them in, and "which one am I on" is the question the
         * left page exists to answer.
         */}
       {peers.length>1&&<ol className="leafList">
        {peers.map((peer,index)=>{
         const here=peer.view===route.view;
         return (
          <li key={peer.view}>
           <button
            type="button"
            className={`leafItem staveRow ${here?"is-here":""}`}
            aria-current={here?"page":undefined}
            onClick={()=>goToView(peer.view)}
           >
            <i className="clef clef-bass" aria-hidden="true"/>
            <b className="leafNum">{String(index+1).padStart(2,"0")}</b>
            <span className="leafText">
             <span className="leafName">{peer.label}</span>
             <small className="leafBlurb">{peer.blurb}</small>
            </span>
            {here&&<span className="leafHere" aria-hidden="true">
             <svg viewBox="0 0 10 12" width="9" height="11"><path d="M1 1l7 5-7 5Z" fill="currentColor"/></svg>
            </span>}
           </button>
          </li>
         );
        })}
       </ol>}
      </div>

      {/*
        * The pencilled note sits at the foot of the verso on every page,
        * including the ones that print their own left page. It used to live
        * inside the default block, so a route that filled the slot -- home,
        * for one -- hid it along with the contents list and ended its page in
        * a third of a column of blank paper.
        */}
      <p className="leafFocus annot">
       {focus.map(line=><span key={line}>{line}</span>)}
      </p>
     </aside>

     {/* ======================================================= the binding */}
     {/*
       * The spine. Decorative in the sense that it carries no control, and
       * structural in the sense that it is the reason two pages read as one
       * book rather than as a sidebar beside a panel. The rings are drawn
       * here rather than in CSS pseudo-elements so their spacing can be set
       * from one place and stay put as the page grows.
       */}
     <div className="spine" aria-hidden="true">
      <i className="spineRing"/>
      <i className="spineRing"/>
     </div>

     {/* =================================================== the right page */}
     <div className="recto">
      <nav className="tabs" aria-label="Main">
       {TABS.map(entry=>(
        <button
         key={entry.item.view}
         type="button"
         className="tab"
         aria-current={group===entry.label?"page":undefined}
         onClick={()=>goToView(entry.item.view)}
        >
         {entry.label}
        </button>
       ))}

       <div className="tabsEnd">
        {actions}
        <button
         type="button"
         className="contents"
         onClick={()=>setPalette(true)}
         aria-haspopup="dialog"
        >
         <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
          <path d="M1 3h14M1 8h14M1 13h9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
         </svg>
         <span className="contentsLabel">Contents</span>
         <kbd className="contentsKey">/</kbd>
        </button>
       </div>
      </nav>

      <main
       className={`sheet page ${READING_VIEWS.has(route.view)?"reading":"wide"}`}
       id="main"
       key={route.path}
      >
       {children}
      </main>
     </div>

     {/*
       * The leaf that goes over, in the working page's own grid cell so its
       * hinge lands on the binding without measuring anything.
       */}
     <PageTurn at={route.path} order={READING_ORDER.get(route.view)}/>

     {/* ================================================== the fore-edge = */}
     <nav className="indexRail" aria-label="Index">
      {INDEX.map(entry=>(
       <button
        key={entry.view}
        type="button"
        className="indexTab"
        aria-current={route.view===entry.view?"page":undefined}
        onClick={()=>goToView(entry.view)}
       >
        <Icon name={entry.icon}/>
        <span className="indexLabel">{entry.label}</span>
       </button>
      ))}
     </nav>
    </div>

    {/* ========================================================== the dock */}
    <div className="dock" role="region" aria-label="Instrument">
     <Transport input={input} onToggleInput={onToggleInput} inputBusy={inputBusy}/>
    </div>
   </div>

   <CommandPalette open={palette} onClose={()=>setPalette(false)}/>
  </LeafSlotProvider>
 );
}

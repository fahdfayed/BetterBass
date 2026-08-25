import {useEffect,useState,type ReactNode} from "react";
import AuroraField from "./AuroraField";
import CommandPalette from "./CommandPalette";
import Icon from "./Icon";
import {breadcrumbFor,NAV,sectionFor} from "../nav";
import {goToView,navigate,pathForView,useRoute} from "../router";
import {useReveal} from "../useReveal";

type Props={
 /** Course state for the sidebar summary. */
 course:{percent:number;index:number;total:number;title:string};
 /** Live input state for the sidebar footer. */
 input:{listening:boolean;detail:string};
 /** Global controls that belong in the header (voice, language, connect). */
 actions:ReactNode;
 children:ReactNode;
};

/** Each unit gets its own accent, so position in the course reads as colour. */
const unitAccent=(index:number,total:number)=>{
 const unit=Math.min(6,Math.max(1,Math.ceil(((index+1)/Math.max(1,total))*6)));
 return {"--accent":`var(--unit-${unit})`,"--accent-2":`var(--unit-${Math.min(6,unit+1)})`} as React.CSSProperties;
};

export default function AppShell({course,input,actions,children}:Props){
 const route=useRoute();
 const [menuOpen,setMenuOpen]=useState(false);
 const [paletteOpen,setPaletteOpen]=useState(false);
 const section=sectionFor(route.view);
 const {trail,here}=breadcrumbFor(route.view);

 useReveal(route.path);

 // Cmd/Ctrl-K anywhere, except while typing into a field.
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   const target=event.target as HTMLElement|null;
   const typing=target&&(target.tagName==="INPUT"||target.tagName==="TEXTAREA"||target.isContentEditable);
   if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setPaletteOpen(open=>!open)}
   else if(event.key==="/"&&!typing&&!paletteOpen){event.preventDefault();setPaletteOpen(true)}
  };
  window.addEventListener("keydown",onKey);
  return()=>window.removeEventListener("keydown",onKey);
 },[paletteOpen]);

 // Close the mobile drawer on navigation; leaving it open hides the new page.
 useEffect(()=>{setMenuOpen(false)},[route.path]);

 // Send focus to the page heading on navigation so screen readers and keyboard
 // users land on the new content instead of staying in the sidebar.
 useEffect(()=>{
  const heading=document.querySelector<HTMLElement>("[data-page-heading]");
  heading?.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:"instant" as ScrollBehavior});
 },[route.path]);

 return (
  <>
   <AuroraField/>
   <div className="shell courseOs" data-translate-root style={unitAccent(course.index,course.total)}>
    <a className="visuallyHidden" href="#main">Skip to content</a>

    <aside className={`sideNav ${menuOpen?"open":""}`}>
     <button className="brand" onClick={()=>goToView("course")}>
      <span className="brandMark">OI</span>
      <span className="brandText"><strong>Outside In</strong><small>Bass learning studio</small></span>
     </button>

     <button className="navSearch" onClick={()=>setPaletteOpen(true)}>
      <Icon name="search"/><span>Jump to…</span><kbd data-no-translate>⌘K</kbd>
     </button>

     <div className="navGroups">
      {NAV.map(group=>(
       <section className="navGroup" key={group.label}>
        <span className="eyebrow">{group.label}</span>
        {group.items.map(item=>{
         const isSection=section?.view===item.view;
         return (
          <div key={item.view}>
           <button
            className="navLink"
            aria-current={route.view===item.view?"page":undefined}
            onClick={()=>goToView(item.view)}
           >
            <Icon name={item.icon}/><span>{item.label}</span>
           </button>
           {item.children&&(
            <div className={`navSub ${isSection?"open":""}`}>
             <div className="navSubInner">
              {item.children.map(child=>(
               <button
                key={child.view}
                aria-current={route.view===child.view?"page":undefined}
                onClick={()=>child.view==="courseLesson"
                 ?navigate(pathForView("courseLesson",{lesson:course.index+1}))
                 :goToView(child.view)}
               >
                {child.label}
               </button>
              ))}
             </div>
            </div>
           )}
          </div>
         );
        })}
       </section>
      ))}
     </div>

     <div className="sideFoot">
      <section className="card" style={{padding:"var(--s-4)"}}>
       <div className="row" style={{justifyContent:"space-between",marginBottom:"var(--s-2)"}}>
        <span className="eyebrow">Progress</span>
        <b className="mono" style={{fontSize:"var(--step-0)"}}>{course.percent}%</b>
       </div>
       <div className="meter"><span style={{width:`${course.percent}%`}}/></div>
       <p className="muted" style={{fontSize:"var(--step--1)",marginTop:"var(--s-3)"}}>
        Lesson {course.index+1} of {course.total}
       </p>
       <strong style={{fontSize:"var(--step-0)",display:"block",marginBottom:"var(--s-3)"}}>{course.title}</strong>
       <button className="btn primary sheen" style={{width:"100%"}} onClick={()=>navigate(pathForView("courseLesson",{lesson:course.index+1}))}>
        Continue <span className="arrow">→</span>
       </button>
      </section>

      <div className="inputState">
       <i className={`inputDot ${input.listening?"live":""}`}/>
       <span>{input.listening?"Bass input active":"Bass input off"}<small>{input.detail}</small></span>
      </div>
     </div>
    </aside>

    {menuOpen&&<div className="paletteScrim" style={{zIndex:50,paddingTop:0}} onMouseDown={()=>setMenuOpen(false)} role="presentation"/>}

    <div className="stack" style={{minWidth:0}}>
     <header className="topBar">
      <button className="btn ghost navToggle" onClick={()=>setMenuOpen(open=>!open)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
       <Icon name="menu"/>
      </button>
      <nav className="crumbs" aria-label="Breadcrumb">
       {trail.map(step=>(
        <span key={step.path} className="row" style={{gap:"var(--s-2)"}}>
         <button onClick={()=>navigate(step.path)}>{step.label}</button>
         <span className="sep">/</span>
        </span>
       ))}
       <span className="here">{here}</span>
      </nav>
      <div className="topActions">{actions}</div>
     </header>

     <main className="page viewEnter" id="main" key={route.path}>
      {children}
     </main>
    </div>
   </div>

   <CommandPalette open={paletteOpen} onClose={()=>setPaletteOpen(false)}/>
  </>
 );
}

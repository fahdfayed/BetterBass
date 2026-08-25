import {useEffect,useState,type ReactNode} from "react";
import CommandPalette from "./CommandPalette";
import Icon from "./Icon";
import {breadcrumbFor,NAV,sectionFor} from "../nav";
import {goToView,navigate,pathForView,useRoute} from "../router";
import {useReveal} from "../useReveal";

type Props={
 course:{percent:number;index:number;total:number;title:string};
 input:{listening:boolean;detail:string};
 actions:ReactNode;
 children:ReactNode;
};

export default function AppShell({course,input,actions,children}:Props){
 const route=useRoute();
 const [open,setOpen]=useState(false);
 const [palette,setPalette]=useState(false);
 const section=sectionFor(route.view);
 const {trail,here}=breadcrumbFor(route.view);

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

 useEffect(()=>{setOpen(false)},[route.path]);

 // Focus the new page's heading on navigation, so keyboard and screen-reader
 // users land on the content rather than staying in the rail.
 useEffect(()=>{
  document.querySelector<HTMLElement>("[data-page-heading]")?.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:"instant" as ScrollBehavior});
 },[route.path]);

 return (
  <>
   <div className="shell" data-translate-root>
    <a className="sr" href="#main">Skip to content</a>

    <nav className={`rail ${open?"open":""}`} aria-label="Main">
     <div className="railTop">
      <button className="mark" onClick={()=>goToView("course")} aria-label="Bass Lab home">
       <span className="markGlyph" aria-hidden="true">OI</span>
       <span className="markWord railLabel">Outside In</span>
      </button>
      <button className="railFind" onClick={()=>setPalette(true)}>
       <Icon name="search"/>
       <span className="railLabel">Search</span>
       <kbd className="railLabel" data-no-translate>⌘K</kbd>
      </button>
     </div>

     <div className="railNav">
      {NAV.map(group=>(
       <div className="railGroup" key={group.label}>
        <span className="railGroupName">{group.label}</span>
        {group.items.map(item=>{
         const active=section?.view===item.view;
         return (
          <div key={item.view}>
           <button
            className="railLink"
            aria-current={route.view===item.view?"page":undefined}
            onClick={()=>goToView(item.view)}
           >
            <Icon name={item.icon}/>
            <span className="railLabel">{item.label}</span>
           </button>
           {item.children&&(
            <div className={`railSub ${active?"on":""}`}>
             <div className="railSubInner">
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
       </div>
      ))}
     </div>

     <div className="railFoot">
      <div className="meter" aria-hidden="true"><span style={{width:`${course.percent}%`}}/></div>
      <div className="railState">
       <span className={`railDot ${input.listening?"live":""}`}/>
       <span className="railLabel">{input.listening?input.detail:"Input off"}</span>
      </div>
     </div>
    </nav>

    {open&&<div className="palScrim" style={{zIndex:30,paddingTop:0}} onMouseDown={()=>setOpen(false)} role="presentation"/>}

    <div className="stack">
     <header className="head">
      <button className="action-quiet railToggle" onClick={()=>setOpen(value=>!value)} aria-label="Navigation" aria-expanded={open}>
       <Icon name="menu"/>
      </button>
      <nav className="where" aria-label="Breadcrumb">
       {trail.map(step=>(
        <span key={step.path} className="where" style={{gap:"var(--s3)"}}>
         <button onClick={()=>navigate(step.path)}>{step.label}</button>
         <span className="sep">/</span>
        </span>
       ))}
       <span className="now">{here}</span>
      </nav>
      <div className="headActions">{actions}</div>
     </header>

     <main className="page" id="main" key={route.path}>{children}</main>
    </div>
   </div>

   <CommandPalette open={palette} onClose={()=>setPalette(false)}/>
  </>
 );
}

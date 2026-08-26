import {useEffect,useMemo,useRef,useState} from "react";
import Icon from "./Icon";
import {searchDestinations} from "../nav";
import {goToView} from "../router";

/**
 * Cmd/Ctrl-K jump-to-anywhere.
 *
 * With eighteen destinations, ten of them two clicks deep, search is the
 * shortest path to most of them — and it stays fast once someone knows the app
 * well enough to stop reading the sidebar.
 */
export default function CommandPalette({open,onClose}:{open:boolean;onClose:()=>void}){
 const [query,setQuery]=useState("");
 const [active,setActive]=useState(0);
 const inputRef=useRef<HTMLInputElement>(null);
 const listRef=useRef<HTMLUListElement>(null);
 const results=useMemo(()=>searchDestinations(query),[query]);

 useEffect(()=>{if(open){setQuery("");setActive(0);inputRef.current?.focus()}},[open]);
 useEffect(()=>{setActive(0)},[query]);

 // Keep the highlighted row in view when arrowing past the fold.
 useEffect(()=>{
  if(!open)return;
  listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({block:"nearest"});
 },[active,open]);

 if(!open)return null;

 const choose=(index:number)=>{
  const target=results[index];
  if(!target)return;
  goToView(target.view);
  onClose();
 };

 const onKeyDown=(event:React.KeyboardEvent)=>{
  if(event.key==="ArrowDown"){event.preventDefault();setActive(index=>Math.min(results.length-1,index+1))}
  else if(event.key==="ArrowUp"){event.preventDefault();setActive(index=>Math.max(0,index-1))}
  else if(event.key==="Enter"){event.preventDefault();choose(active)}
  else if(event.key==="Escape"){event.preventDefault();onClose()}
 };

 return (
  <div className="palScrim" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
   <div className="pal" role="dialog" aria-modal="true" aria-label="Jump to">
    <input
     ref={inputRef}
     className="palInput"
     type="text"
     placeholder="Jump to a lesson, lab or routine…"
     value={query}
     onChange={event=>setQuery(event.target.value)}
     onKeyDown={onKeyDown}
     role="combobox"
     aria-expanded="true"
     aria-controls="palette-results"
     aria-activedescendant={results[active]?`palette-option-${active}`:undefined}
     autoComplete="off"
     spellCheck={false}
    />
    {results.length===0
     ? <p className="palEmpty">Nothing matches “{query}”.</p>
     : <ul className="palList" id="palette-results" role="listbox" ref={listRef}>
        {results.map((item,index)=>(
         <li key={item.view} role="none">
          <button
           type="button"
           id={`palette-option-${index}`}
           role="option"
           aria-selected={index===active}
           data-index={index}
           data-active={index===active}
           className="palItem"
           onMouseMove={()=>setActive(index)}
           onClick={()=>choose(index)}
          >
           <Icon name={item.icon}/>
           <span>{item.label}</span>
           <span className="palWhere">{item.parent?`${item.group} · ${item.parent}`:item.group}</span>
          </button>
         </li>
        ))}
       </ul>}
   </div>
  </div>
 );
}

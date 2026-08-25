"use client";

import {useEffect,useRef,useSyncExternalStore} from "react";

const STORAGE_KEY="basslab-language";
const subscribeLanguage=(callback:()=>void)=>{window.addEventListener("storage",callback);window.addEventListener("basslab-language",callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener("basslab-language",callback)}};
const languageSnapshot=()=>window.localStorage.getItem(STORAGE_KEY)==="ar-EG";
const serverLanguageSnapshot=()=>false;

export function useEgyptianArabic(){return useSyncExternalStore(subscribeLanguage,languageSnapshot,serverLanguageSnapshot)}

export default function EgyptianArabicToggle(){
 const arabic=useEgyptianArabic(),originalsRef=useRef(new Map<Text,string>()),expectedRef=useRef(new Map<Text,string>());
 useEffect(()=>{
  let cancelled=false,observer:MutationObserver|null=null;
  const run=async()=>{
   const root=document.querySelector<HTMLElement>(".courseOs");if(!root)return;
   root.classList.toggle("egyptian-arabic",arabic);document.documentElement.lang=arabic?"ar-EG":"en";document.documentElement.dir=arabic?"rtl":"ltr";
   const translate=arabic?(await import("./egyptian-translator")).toEgyptianArabic:(value:string)=>value;
   if(cancelled)return;
   const originals=originalsRef.current,expected=expectedRef.current,isExcluded=(node:Text)=>node.parentElement?.closest("[data-no-translate],script,style,code")!==null;
   const translateAttribute=(element:HTMLElement,name:"aria-label"|"title"|"placeholder")=>{
    const dataName=`data-egyptian-${name}`,current=element.getAttribute(name);
    if(arabic){if(current&&!element.hasAttribute(dataName))element.setAttribute(dataName,current);const original=element.getAttribute(dataName);if(original)element.setAttribute(name,translate(original))}
    else{const original=element.getAttribute(dataName);if(original)element.setAttribute(name,original)}
   };
   const applyText=(node:Text)=>{
    if(isExcluded(node))return;const current=node.nodeValue??"";
    if(arabic){const previousExpected=expected.get(node),previousOriginal=originals.get(node);if(previousOriginal===undefined||current!==previousExpected&&current!==previousOriginal)originals.set(node,current);const translated=translate(originals.get(node)??current);expected.set(node,translated);if(current!==translated)node.nodeValue=translated}
    else if(originals.has(node)){const original=originals.get(node)!;expected.delete(node);if(current!==original)node.nodeValue=original}
   };
   const applyTree=(node:Node)=>{
    if(node.nodeType===Node.TEXT_NODE){applyText(node as Text);return}if(node.nodeType!==Node.ELEMENT_NODE)return;
    const element=node as HTMLElement;if(element.closest("[data-no-translate]"))return;
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let text=walker.nextNode();while(text){applyText(text as Text);text=walker.nextNode()}
    element.querySelectorAll<HTMLElement>("[aria-label],[title],[placeholder]").forEach(item=>{translateAttribute(item,"aria-label");translateAttribute(item,"title");translateAttribute(item,"placeholder")});
   };
   applyTree(root);observer=new MutationObserver(records=>records.forEach(record=>{if(record.type==="characterData")applyText(record.target as Text);record.addedNodes.forEach(applyTree)}));observer.observe(root,{subtree:true,childList:true,characterData:true});
   window.dispatchEvent(new CustomEvent("basslab-language",{detail:{language:arabic?"ar-EG":"en"}}));
  };
  void run();return()=>{cancelled=true;observer?.disconnect()};
 },[arabic]);
 const toggle=()=>{const next=!arabic;window.localStorage.setItem(STORAGE_KEY,next?"ar-EG":"en");window.dispatchEvent(new CustomEvent("basslab-language",{detail:{language:next?"ar-EG":"en"}}))};
 return <button data-no-translate className="egyptianToggle" aria-pressed={arabic} onClick={toggle} title={arabic?"Switch the whole site to English":"حوّل الموقع كله للمصري"}><span>{arabic?"EN":"مصري"}</span><small>{arabic?"English":"Egyptian Arabic"}</small></button>;
}

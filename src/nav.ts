import {pathForView} from "./router";

/**
 * One description of every destination, shared by the sidebar, the breadcrumbs
 * and the command palette. Previously the navigation lived in three unrelated
 * literals and ten of the eighteen views appeared in none of them.
 */

export type Destination={
 view:string;
 label:string;
 /** Shown in the palette and on hub cards. */
 blurb:string;
 icon:IconName;
 /** Extra palette search terms — what someone would actually type. */
 keywords?:string[];
 children?:Destination[];
};

export type NavGroup={label:string;items:Destination[]};

export type IconName=
 |"home"|"course"|"practice"|"coach"|"maqam"|"slap"|"labs"|"progress"
 |"fretboard"|"band"|"analyze"|"outside"|"theory"|"games"|"search"|"menu"|"map";

export const NAV:NavGroup[]=[
 {label:"Learn",items:[
  {view:"course",label:"Home",blurb:"Your next step and today's route",icon:"home",keywords:["dashboard","start","overview"]},
  {view:"map",label:"The map",blurb:"Six territories and the route through them",icon:"map",keywords:["map","territory","territories","route","units","unlock","overview"]},
  {view:"roadmap",label:"Full course",blurb:"All 28 lessons across six units",icon:"course",keywords:["curriculum","lessons","syllabus","map"],children:[
   {view:"courseLesson",label:"Current lesson",blurb:"The lesson you are working through",icon:"course",keywords:["continue","resume"]},
  ]},
 ]},
 {label:"Practice",items:[
  {view:"practice",label:"Practice studio",blurb:"Build and run a hands-free routine",icon:"practice",keywords:["routine","session","timer","hands free"],children:[
   {view:"today",label:"Today's plan",blurb:"The blocks scheduled for this session",icon:"practice",keywords:["plan","blocks","schedule"]},
   {view:"live",label:"Live session",blurb:"Run the routine with spoken cues",icon:"practice",keywords:["run","start","cues"]},
  ]},
  {view:"coach",label:"Live coach",blurb:"Listen, detect and correct your playing",icon:"coach",keywords:["listen","feedback","microphone","correct"],children:[
   {view:"adaptive",label:"Adaptive plan",blurb:"A route built from your weakest areas",icon:"progress",keywords:["personal","weakness","diagnostic"]},
  ]},
 ]},
 {label:"Specialties",items:[
  {view:"maqam",label:"Arabic maqam",blurb:"Sayr, hand routes and backing",icon:"maqam",keywords:["arabic","maqam","quarter tone","egyptian","oriental"]},
  {view:"slap",label:"Slap bass",blurb:"Beginner through advanced routines",icon:"slap",keywords:["thumb","pop","funk","technique"]},
 ]},
 {label:"Labs",items:[
  {view:"tools",label:"Tool library",blurb:"Every focused tool in one place",icon:"labs",keywords:["tools","all"],children:[
   {view:"fret",label:"Fretboard map",blurb:"See functions across the whole neck",icon:"fretboard",keywords:["neck","notes","positions","harmony"]},
   {view:"runtime",label:"Backing band",blurb:"Vamps, progressions and tempo",icon:"band",keywords:["play along","jam","backing","drums","metronome"]},
   {view:"engine",label:"Record & analyze",blurb:"Capture a take and inspect every note",icon:"analyze",keywords:["record","take","analysis","timing"]},
   {view:"advanced",label:"Outside lab",blurb:"Motif, enclosure and side-slip work",icon:"outside",keywords:["outside","tension","chromatic","motif"]},
   {view:"reference",label:"Theory reference",blurb:"Look up a scale, mode or chord",icon:"theory",keywords:["theory","scales","modes","chords","reference"]},
   {view:"games",label:"Training games",blurb:"Ear, interval and target recall",icon:"games",keywords:["game","ear","quiz","drill"]},
  ]},
 ]},
 {label:"You",items:[
  {view:"courseProgress",label:"Progress",blurb:"What you have proved so far",icon:"progress",keywords:["stats","history","achievements"]},
 ]},
];

/** Flattened, for the palette and for reverse lookups. */
export const ALL_DESTINATIONS:Array<Destination&{group:string;parent?:string}>=NAV.flatMap(group=>
 group.items.flatMap(item=>[
  {...item,group:group.label},
  ...(item.children??[]).map(child=>({...child,group:group.label,parent:item.label})),
 ]),
);

const BY_VIEW=new Map(ALL_DESTINATIONS.map(item=>[item.view,item]));
export const destinationFor=(view:string)=>BY_VIEW.get(view);

/** Which top-level nav entry should read as active for the current view. */
export function sectionFor(view:string){
 for(const group of NAV)for(const item of group.items){
  if(item.view===view||item.children?.some(child=>child.view===view))return item;
 }
 return undefined;
}

export function breadcrumbFor(view:string){
 const section=sectionFor(view),here=destinationFor(view);
 const trail:Array<{label:string;path:string}>=[];
 if(section&&section.view!==view)trail.push({label:section.label,path:pathForView(section.view)});
 return {trail,here:here?.label??"Bass Lab"};
}

/** Ranked palette search: exact prefix beats word start beats substring. */
export function searchDestinations(query:string){
 const q=query.trim().toLowerCase();
 if(!q)return ALL_DESTINATIONS;
 const scored=ALL_DESTINATIONS.map(item=>{
  const haystacks=[item.label,item.blurb,...(item.keywords??[])].map(text=>text.toLowerCase());
  let best=0;
  haystacks.forEach((text,index)=>{
   const weight=index===0?3:1;
   if(text===q)best=Math.max(best,10*weight);
   else if(text.startsWith(q))best=Math.max(best,6*weight);
   else if(new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}`).test(text))best=Math.max(best,4*weight);
   else if(text.includes(q))best=Math.max(best,2*weight);
  });
  return {item,score:best};
 });
 return scored.filter(entry=>entry.score>0).sort((a,b)=>b.score-a.score).map(entry=>entry.item);
}

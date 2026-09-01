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
 |"fretboard"|"band"|"analyze"|"outside"|"theory"|"games"|"search"|"menu"|"map"|"tabs"|"masterclass";

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
   {view:"live",label:"Live session",blurb:"Spoken cues, live analysis and a tuner",icon:"practice",keywords:["run","start","cues","tuner","tuning","in tune","cents","pitch","intonation","sharp","flat"]},
  ]},
  {view:"coach",label:"Live coach",blurb:"Listen, detect and correct your playing",icon:"coach",keywords:["listen","feedback","microphone","correct"],children:[
   {view:"adaptive",label:"Adaptive plan",blurb:"A route built from your weakest areas",icon:"progress",keywords:["personal","weakness","diagnostic"]},
  ]},
 ]},
 {label:"Specialties",items:[
  {view:"maqam",label:"Arabic maqam",blurb:"Sayr, hand routes and backing",icon:"maqam",keywords:["arabic","maqam","quarter tone","egyptian","oriental"]},
  {view:"slap",label:"Slap bass",blurb:"Beginner through advanced routines",icon:"slap",keywords:["thumb","pop","funk","technique"]},
  {view:"jaco",label:"Jaco masterclass",blurb:"Eight techniques, with the exercises to build them",icon:"masterclass",keywords:["jaco","pastorius","fretless","harmonics","tenths","bebop","weather report","masterclass","portrait of tracy","donna lee"]},
 ]},
 {label:"Labs",items:[
  {view:"tools",label:"Tool library",blurb:"Every focused tool in one place",icon:"labs",keywords:["tools","all"],children:[
   {view:"fret",label:"Fretboard map",blurb:"See functions across the whole neck",icon:"fretboard",keywords:["neck","notes","positions","harmony"]},
   {view:"runtime",label:"Backing band",blurb:"Vamps, progressions and tempo",icon:"band",keywords:["play along","jam","backing","drums","metronome"]},
   {view:"engine",label:"Record & analyze",blurb:"Capture a take and inspect every note",icon:"analyze",keywords:["record","take","analysis","timing"]},
   {view:"advanced",label:"Outside lab",blurb:"Motif, enclosure and side-slip work",icon:"outside",keywords:["outside","tension","chromatic","motif"]},
   {view:"reference",label:"Theory reference",blurb:"Look up a scale, mode or chord",icon:"theory",keywords:["theory","scales","modes","chords","reference"]},
   {view:"quest",label:"The long way home",blurb:"Play the lesson note by note; wrong notes cost ground",icon:"games",keywords:["game","quest","play","bass input","listen","note","story","journey","walk","adventure","checkpoint","lives","map"]},
   {view:"technique",label:"The hands",blurb:"Position, tension, muting and how to practise",icon:"outside",keywords:["technique","hands","posture","ergonomics","injury","tension","left hand","right hand","muting","shifting","fingering","practice","warm up","independence"]},
   {view:"progression",label:"Progression reader",blurb:"Type a progression and read what it is doing",icon:"course",keywords:["progression","chords","roman numerals","numerals","key","function","analyse","analyze","ii-v-i","changes","borrowed"]},
   {view:"chromatic",label:"Chromatic gym",blurb:"Every approach, chord tone and key",icon:"outside",keywords:["chromatic","approach","enclosure","bebop","target","drill","exercises","lines","jazz"]},
   {view:"games",label:"Training games",blurb:"Rescue a wrong note, snipe an interval, by ear",icon:"games",keywords:["game","ear","quiz","drill","interval","sniper","rescue","recovery","recall","by ear","listen"]},
   {view:"tabs",label:"Tab studio",blurb:"Open a Guitar Pro file, or write your own",icon:"tabs",keywords:["tab","tabs","guitar pro","gp5","gp4","gpx","musicxml","import","upload","notation","songsterr","write"]},
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

/**
 * Everywhere else you can go from where you are, for the dock at the foot of a
 * section.
 *
 * A hub with tools under it answers with the hub and its tools, so that the
 * fretboard map lists the other ten labs and the library itself. Anything else
 * answers with the rest of its group, which is what "the other ones like this"
 * means for a screen that has no children of its own. A group of one answers
 * with nothing, and the dock does not render.
 */
export function peersFor(view:string):{label:string;items:Destination[]}|undefined{
 const section=sectionFor(view);
 if(!section)return undefined;
 if(section.children?.length)return {label:section.label,items:[section,...section.children]};
 const group=NAV.find(candidate=>candidate.items.includes(section));
 if(!group||group.items.length<2)return undefined;
 return {label:group.label,items:group.items};
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

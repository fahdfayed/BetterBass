import {EMPTY_INPUT,type GameInput} from "./progression";

/**
 * Reads the parts of the game state that live in localStorage rather than in
 * BassLab's own React state. Kept apart from progression.ts so that module stays
 * free of browser APIs and directly testable under Node.
 *
 * Everything is defensive: this state is written by several different screens,
 * survives across versions and can be hand-edited.
 */

const read=(key:string)=>{
 try{
  const raw=localStorage.getItem(key);
  return raw?JSON.parse(raw) as unknown:null;
 }catch{return null}
};

const numberArray=(value:unknown)=>Array.isArray(value)?value.filter((item):item is number=>typeof item==="number"&&Number.isFinite(item)):[];

export type StoredGameState=Pick<GameInput,"beastDays"|"tempoRung"|"slapPasses"|"coachPasses">;

export function readStoredGameState():StoredGameState{
 const beast=read("basslab-beast") as {completedDays?:unknown;tempoRung?:unknown}|null;
 const passes=read("slaplab-passes");
 const coach=read("basslab-performance-coach-v1") as {attempts?:unknown}|null;

 const slapPasses:Record<string,string[]>={};
 if(passes&&typeof passes==="object"&&!Array.isArray(passes)){
  for(const [drill,dates] of Object.entries(passes as Record<string,unknown>)){
   if(Array.isArray(dates))slapPasses[drill]=dates.filter((date):date is string=>typeof date==="string");
  }
 }

 const rung=beast?.tempoRung;
 const attempts=coach?.attempts;

 return {
  beastDays:numberArray(beast?.completedDays),
  tempoRung:typeof rung==="number"&&Number.isFinite(rung)?Math.max(1,Math.min(10,Math.round(rung))):EMPTY_INPUT.tempoRung,
  slapPasses,
  coachPasses:typeof attempts==="number"&&Number.isFinite(attempts)?Math.max(0,Math.round(attempts)):0,
 };
}

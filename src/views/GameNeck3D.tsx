import {memo,useEffect,useMemo,useState} from "react";
import NeckScene, {type NeckNote} from "../fretboard-neck-scene";
import {positionsForPitchClass} from "../fretboard-positions";
import {type Ask} from "../game/drills";
import {type LastOutcome,targetPitchClass} from "./game-neck-target";

/**
 * The 3D neck as a drill's target board: the note (or notes, one octave
 * choice at a time as the sequence advances) the player needs to find next,
 * lit up everywhere it can be played — not just one fingering — so the
 * screen teaches "where is a G", not "where is this one G". A hit or miss
 * flashes that same marker set, then the next question's marker takes over.
 */

/** --caution: waiting for the right note. */
const TARGET="#8a6206";
/** --moss/--lime: that was the one. */
const HIT="#63701a";
/** --stop/--red: that wasn't it. */
const MISS="#8f2f14";
/** Long enough to read as "that one", not a flash — matches the free-explore screen's own pulse. */
const FLASH_MS=600;

type Props={
 ask:Ask|null;
 /** Index of the next expected note in `ask.notes`, for a multi-note sequence. */
 progress:number;
 lastOutcome:LastOutcome|null;
};

const notesForPc=(pc:number,color:string):NeckNote[]=>
 positionsForPitchClass(pc).map(place=>({key:`${place.string}:${place.fret}`,string:place.string,fret:place.fret,color,pulseColor:color}));

function GameNeck3D({ask,progress,lastOutcome}:Props){
 const [flash,setFlash]=useState<{pc:number;color:string}|null>(null);

 useEffect(()=>{
  if(!lastOutcome||lastOutcome.pc===null)return;
  const entry={pc:lastOutcome.pc,color:lastOutcome.hit?HIT:MISS};
  setFlash(entry);
  const id=window.setTimeout(()=>setFlash(current=>current===entry?null:current),FLASH_MS);
  return ()=>window.clearTimeout(id);
 },[lastOutcome]);

 const targetPc=targetPitchClass(ask,progress);
 const targetNotes=useMemo(()=>targetPc===null?[]:notesForPc(targetPc,TARGET),[targetPc]);
 const flashNotes=useMemo(()=>flash?notesForPc(flash.pc,flash.color):[],[flash]);

 const notes=useMemo(()=>{
  const merged=new Map(targetNotes.map(note=>[note.key,note]));
  for(const note of flashNotes)merged.set(note.key,note);
  return [...merged.values()];
 },[targetNotes,flashNotes]);

 const pulsingKeys=useMemo(()=>new Set(flashNotes.map(note=>note.key)),[flashNotes]);

 return <NeckScene notes={notes} pulsingKeys={pulsingKeys}/>;
}

export default memo(GameNeck3D);

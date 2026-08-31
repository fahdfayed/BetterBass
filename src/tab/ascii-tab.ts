import type {Bar,Duration,Event,TabExercise} from "./notation.ts";

/**
 * Reads the plain-text tab the Beast passages are written in.
 *
 *     G|--------------------|
 *     D|--------------------|
 *     A|--------------------|
 *     E|--3-5-7--4-6-8------|
 *
 * That notation carries pitch but no rhythm, so the spacing has to supply it.
 * These passages are written with single dashes inside a group and a wider gap
 * between groups, which is exactly where a player would feel the bar line — so
 * the gaps are read as phrasing rather than thrown away.
 */

// Written top to bottom the way tab is read, which is highest string first.
const STRING_FOR_LABEL:Record<string,number>={G:1,D:2,A:3,E:4};

/** The highest fret a written number can mean before it must be two notes. */
const MAX_FRET=24;

type Hit={column:number;width:number;string:number;fret:number};

const PIPED=/^\s*([GDAE])\s*\|(.*)$/;

/*
 * The same tab without the pipe, which is what most exported and hand-written
 * tab actually looks like:
 *
 *     G                    1        11 3 2
 *     D        30     0 13
 *
 * A bare letter followed by text is far too easy to match by accident — a
 * sentence beginning "A " would become a string — so the rest of the line has
 * to consist only of the characters tab is made of, and contain at least one
 * fret.
 */
const BARE=/^\s*([GDAE])[ 	]+(.*)$/;
const LANE_SHAPED=/^[\d\s|\-–hpbrsvx^~/\().*]*$/;

function laneOf(raw:string){
 const piped=PIPED.exec(raw);
 if(piped)return {string:piped[1],lane:piped[2]};
 const bare=BARE.exec(raw);
 if(bare&&/\d/.test(bare[2])&&LANE_SHAPED.test(bare[2]))return {string:bare[1],lane:bare[2]};
 return null;
}

function hits(tab:string):Hit[]{
 const found:Hit[]=[];
 for(const raw of tab.split("\n")){
  const read=laneOf(raw);
  if(!read)continue;
  const string=STRING_FOR_LABEL[read.string];
  const lane=read.lane.replace(/\|\s*$/,"");
  for(let i=0;i<lane.length;){
   if(!/\d/.test(lane[i])){i++;continue}
   /*
    * A fret is at most two digits, and reading further invents notes that do
    * not exist: proportionally spaced tab packs neighbouring notes together
    * with no dash between them, so "0134" is four notes rather than fret 134.
    * Two digits are taken when they name a real fret and one when they do not,
    * which keeps "10" a single note and splits "34" into two. A pair only
    * counts when it starts with 1 or 2, because frets under ten are written as
    * one digit — so "0134" is 0, 1, 3, 4 rather than fret 1 followed by 34.
    */
   const pair=lane.slice(i,i+2);
   const digits=/^[12]\d$/.test(pair)&&Number(pair)<=MAX_FRET?pair:lane[i];
   found.push({column:i,width:digits.length,string,fret:Number(digits)});
   i+=digits.length;
  }
 }
 return found.sort((a,b)=>a.column-b.column||b.string-a.string);
}

/** Split on the wide gaps the author used to separate groups. */
function group(found:Hit[]):Hit[][]{
 const groups:Hit[][]=[];
 let current:Hit[]=[];
 found.forEach((hit,i)=>{
  if(i>0){
   const previous=found[i-1];
   const gap=hit.column-(previous.column+previous.width);
   if(gap>=2&&current.length){groups.push(current);current=[]}
  }
  current.push(hit);
 });
 if(current.length)groups.push(current);
 return groups;
}

export type ParsedTab={bars:Bar[];ts:[number,number]};

/**
 * Turn plain-text tab into bars.
 *
 * When every group is the same length the groups become the bars, which keeps
 * a ladder of three-note cells reading as three-note cells. When they are not —
 * riffs, pedal figures — the passage is barred as straight eighths instead,
 * because guessing a meter from ragged spacing would only invent a rhythm the
 * author did not write.
 */
export function parseAsciiTab(tab:string):ParsedTab{
 const found=hits(tab);
 if(found.length===0)return {bars:[],ts:[4,4]};

 const groups=group(found);
 const sizes=new Set(groups.map(g=>g.length));
 const size=groups[0].length;
 const even=sizes.size===1&&size>=2&&size<=8&&groups.length>1;

 const note=(hit:Hit,d:Duration):Event=>({t:"f",string:hit.string,fret:hit.fret,d});

 if(even){
  // One group to a bar. Up to six notes read comfortably as quarters; beyond
  // that the cell is a subdivision, not a set of beats.
  const d:Duration=size<=6?4:8;
  return {bars:groups.map(g=>g.map(hit=>note(hit,d))),ts:[size,d===4?4:8]};
 }

 const bars:Bar[]=[];
 for(let i=0;i<found.length;i+=8)bars.push(found.slice(i,i+8).map(hit=>note(hit,8)));
 // Round the last bar out so it does not render as a stub. A seven-note figure
 // is still a bar of four; the eighth slot is simply silent.
 const tail=bars[bars.length-1];
 while(tail.length>0&&tail.length<8)tail.push({t:"r",d:8});
 return {bars,ts:[4,4]};
}

/** Build a playable exercise from plain-text tab. */
export function exerciseFromAsciiTab(
 spec:{id:string;title:string;brief:string;pass:string;tab:string;tempo?:number;rootName?:string},
):TabExercise{
 const {bars,ts}=parseAsciiTab(spec.tab);
 return {
  id:spec.id,
  title:spec.title,
  brief:spec.brief,
  pass:spec.pass,
  // Nothing here is written in degrees, so the root only labels the exercise.
  root:28,
  rootName:spec.rootName??"As written",
  tempo:spec.tempo??60,
  ts,
  bars,
  loop:true,
 };
}

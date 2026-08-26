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

type Hit={column:number;width:number;string:number;fret:number};

const TAB_LINE=/^\s*([GDAE])\s*\|(.*)$/;

function hits(tab:string):Hit[]{
 const found:Hit[]=[];
 for(const raw of tab.split("\n")){
  const match=TAB_LINE.exec(raw);
  if(!match)continue;
  const string=STRING_FOR_LABEL[match[1]];
  const lane=match[2].replace(/\|\s*$/,"");
  for(let i=0;i<lane.length;i++){
   if(!/\d/.test(lane[i]))continue;
   // Only the first digit of a number starts a note; "10" is one note, not two.
   if(i>0&&/\d/.test(lane[i-1]))continue;
   const digits=/^\d+/.exec(lane.slice(i))![0];
   found.push({column:i,width:digits.length,string,fret:Number(digits)});
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

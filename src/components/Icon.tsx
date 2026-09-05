import type {IconName} from "../nav";

/** Single-stroke 24px icon set. Stroke and size come from CSS, not props. */
const PATHS:Record<IconName,string[]>={
 home:["M3 10.5 12 3l9 7.5","M5.5 9v12h13V9"],
 course:["M4 5.5c2.8-.9 5.4-.4 8 1.5v13c-2.6-1.9-5.2-2.4-8-1.5z","M20 5.5c-2.8-.9-5.4-.4-8 1.5v13c2.6-1.9 5.2-2.4 8-1.5z"],
 practice:["M8 5.5v13l11-6.5z"],
 coach:["M3 12h3l2.2-5 3.6 10 2.7-7 2 4H21"],
 maqam:["M9 18V6l10-2v12","M9 18c0 1.4-1.6 2.5-3.5 2.5S2 19.4 2 18s1.6-2.5 3.5-2.5S9 16.6 9 18Z","M19 16c0 1.4-1.6 2.5-3.5 2.5S12 17.4 12 16s1.6-2.5 3.5-2.5S19 14.6 19 16Z"],
 slap:["M13 2 5 13h6l-1 9 9-13h-6z"],
 progress:["M4 20V10","M10 20V4","M16 20v-7","M22 20H2"],
 fretboard:["M3 5v14","M8 5v14","M13 5v14","M18 5v14","M2 8h20","M2 12h20","M2 16h20"],
 band:["M12 3v12","M12 15a3 3 0 1 1-3 3","M20 6v9","M20 15a2.5 2.5 0 1 1-2.5 2.5"],
 analyze:["M3 18V9","M8 18V5","M13 18v-6","M18 18V8","M2 21h20"],
 outside:["M4 16c3-8 6 8 9 0s6-8 8-4"],
 theory:["M5 4h11l3 3v13H5z","M9 9h6","M9 13h6","M9 17h4"],
 games:["M7 11h4","M9 9v4","M15.5 10.5h.01","M18 13h.01","M6 7h12a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4c-2 0-2.5-2-6-2s-4 2-6 2a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4Z"],
 tabs:["M3 6h18","M3 10h18","M3 14h18","M3 18h18","M8 6v4","M14 14v4"],
 masterclass:["M9 3v7a3 3 0 0 0 6 0V3","M12 13v8"],
 search:["M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z","M21 21l-4.3-4.3"],
 menu:["M4 7h16","M4 12h16","M4 17h16"],
};

export default function Icon({name}:{name:IconName}){
 return (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
   {PATHS[name].map((d,index)=><path d={d} key={index}/>)}
  </svg>
 );
}

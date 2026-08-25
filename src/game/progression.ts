/**
 * Course territories.
 *
 * The six units of the course, laid out as a route with unlock gates. This is
 * navigation, not scoring: it answers "where am I, what is open, and what has to
 * happen before the next thing opens".
 *
 * Free of React and the DOM so tests/progression.test.mjs can run it directly.
 */

/* --------------------------------------------------------- territories ---- */

export type Territory={
 id:number;
 name:string;
 subtitle:string;
 /** Inclusive lesson index range. */
 range:[number,number];
 /** Position on the 100x100 map. */
 x:number;
 y:number;
};

/** Positions trace a winding route up the map, so the path reads as a journey. */
export const TERRITORIES:Territory[]=[
 {id:1,name:"The Inside Foundation",subtitle:"Establish home before studying modes",range:[0,3],x:13,y:83},
 {id:2,name:"How Modes Work",subtitle:"Interval environments, not scale shapes",range:[4,7],x:34,y:64},
 {id:3,name:"The Seven Modal Sounds",subtitle:"Make every mode's identity audible",range:[8,14],x:23,y:39},
 {id:4,name:"Modal Improvisation",subtitle:"Grooves, motifs, fills and phrases",range:[15,19],x:52,y:24},
 {id:5,name:"Harmony in Motion",subtitle:"Modal thinking against chord gravity",range:[20,23],x:77,y:42},
 {id:6,name:"Controlled Outside Playing",subtitle:"Leave deliberately, return with authority",range:[24,27],x:88,y:76},
];

export type TerritoryState=Territory&{
 total:number;
 done:number;
 percent:number;
 unlocked:boolean;
 complete:boolean;
 current:boolean;
 /** Lessons still needed before this opens; 0 when already unlocked. */
 lessonsToUnlock:number;
};

export function territoryStates(lessonsCompleted:number,currentLesson:number):TerritoryState[]{
 return TERRITORIES.map(territory=>{
  const total=territory.range[1]-territory.range[0]+1;
  const done=Math.max(0,Math.min(total,lessonsCompleted-territory.range[0]));
  return {
   ...territory,
   total,
   done,
   percent:Math.round((done/total)*100),
   unlocked:lessonsCompleted>=territory.range[0],
   complete:done===total,
   current:currentLesson>=territory.range[0]&&currentLesson<=territory.range[1],
   lessonsToUnlock:Math.max(0,territory.range[0]-lessonsCompleted),
  };
 });
}

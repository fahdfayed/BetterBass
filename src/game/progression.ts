/**
 * Progression engine.
 *
 * Every number here is derived from state the app already stores — completed
 * lessons, jury scores, the key matrix, the 30-day programme, slap passes. No
 * new counters are invented, so an existing history lights the whole system up
 * the first time it is opened.
 *
 * Free of React and the DOM so tests/progression.test.mjs can run it directly.
 *
 * Design rule: XP is awarded for *proven* work — a jury passed, a rep logged
 * clean, a key actually mastered — never for time spent. Rewarding minutes would
 * quietly teach grinding, which is the opposite of what the course asks for.
 */

export type GameInput={
 /** Lessons whose jury has been passed. */
 lessonsCompleted:number;
 totalLessons:number;
 /** Five jury axes, 0..100. */
 juryScores:number[];
 /** Five freedom axes, 0..100. */
 freedom:number[];
 /** Twelve keys, 0..100. */
 keyMatrix:number[];
 /** Day numbers completed in the 30-day programme. */
 beastDays:number[];
 /** Tempo ladder rung, 1..10. */
 tempoRung:number;
 /** Slap drill id to the ISO dates it was passed. */
 slapPasses:Record<string,string[]>;
 /** Live-coach blocks passed. */
 coachPasses:number;
};

export const EMPTY_INPUT:GameInput={
 lessonsCompleted:0,totalLessons:28,juryScores:[],freedom:[],keyMatrix:[],
 beastDays:[],tempoRung:1,slapPasses:{},coachPasses:0,
};

/* ------------------------------------------------------------------ XP ---- */

export const XP_RATES={
 lesson:100,
 beastDay:25,
 slapPass:40,
 coachPass:30,
 tempoRung:20,
 keyMastered:15,
} as const;

export type XpSource={label:string;count:number;each:number;xp:number};

const KEY_MASTERY_THRESHOLD=80;

export const masteredKeys=(keyMatrix:number[])=>keyMatrix.filter(score=>score>=KEY_MASTERY_THRESHOLD).length;

export const slapPassCount=(passes:Record<string,string[]>)=>
 Object.values(passes??{}).reduce((sum,dates)=>sum+(Array.isArray(dates)?dates.length:0),0);

export function xpBreakdown(input:GameInput):{total:number;sources:XpSource[]}{
 const rungs=Math.max(0,(input.tempoRung||1)-1);
 const sources:XpSource[]=[
  {label:"Lessons passed",count:input.lessonsCompleted,each:XP_RATES.lesson,xp:0},
  {label:"Programme days",count:input.beastDays.length,each:XP_RATES.beastDay,xp:0},
  {label:"Slap drills passed",count:slapPassCount(input.slapPasses),each:XP_RATES.slapPass,xp:0},
  {label:"Coach blocks passed",count:input.coachPasses,each:XP_RATES.coachPass,xp:0},
  {label:"Tempo rungs climbed",count:rungs,each:XP_RATES.tempoRung,xp:0},
  {label:"Keys mastered",count:masteredKeys(input.keyMatrix),each:XP_RATES.keyMastered,xp:0},
 ].map(source=>({...source,xp:Math.max(0,source.count)*source.each}));
 return {total:sources.reduce((sum,source)=>sum+source.xp,0),sources};
}

/* ---------------------------------------------------------------- rank ---- */

/**
 * Venue ladder. Early levels arrive quickly and the last one takes real work —
 * the standard shape for keeping a long course moving.
 */
export const LEVELS=[
 {level:1,title:"Bedroom",at:0},
 {level:2,title:"Garage",at:300},
 {level:3,title:"Rehearsal Room",at:800},
 {level:4,title:"Open Mic",at:1500},
 {level:5,title:"Club",at:2500},
 {level:6,title:"Session Call",at:3800},
 {level:7,title:"Studio",at:5400},
 {level:8,title:"Festival",at:7400},
 {level:9,title:"Headliner",at:9800},
] as const;

export type Rank={
 level:number;
 title:string;
 xp:number;
 /** XP earned inside the current level. */
 into:number;
 /** XP the current level spans; null at the cap. */
 span:number|null;
 /** 0..100 through the current level; 100 at the cap. */
 percent:number;
 next:{level:number;title:string;at:number}|null;
};

export function rankFor(xp:number):Rank{
 const total=Math.max(0,Math.floor(Number.isFinite(xp)?xp:0));
 let index=0;
 for(let i=0;i<LEVELS.length;i++)if(total>=LEVELS[i].at)index=i;
 const current=LEVELS[index],next=LEVELS[index+1]??null;
 const into=total-current.at;
 const span=next?next.at-current.at:null;
 return {
  level:current.level,
  title:current.title,
  xp:total,
  into,
  span,
  percent:span?Math.min(100,Math.round((into/span)*100)):100,
  next:next?{level:next.level,title:next.title,at:next.at}:null,
 };
}

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

/* -------------------------------------------------------------- streak ---- */

const uniqueDays=(days:number[])=>[...new Set((days??[]).filter(day=>Number.isFinite(day)))].sort((a,b)=>a-b);

/** Longest run of consecutive days in the 30-day programme. */
export function longestStreak(days:number[]){
 const sorted=uniqueDays(days);
 let best=0,run=0,previous=Number.NaN;
 for(const day of sorted){
  run=day===previous+1?run+1:1;
  if(run>best)best=run;
  previous=day;
 }
 return best;
}

/** Run ending at the most recently completed day. */
export function currentStreak(days:number[]){
 const sorted=uniqueDays(days);
 let run=0;
 for(let i=sorted.length-1;i>=0;i--){
  if(i===sorted.length-1||sorted[i]===sorted[i+1]-1)run++;
  else break;
 }
 return run;
}

/* -------------------------------------------------------------- badges ---- */

export type BadgeTier="bronze"|"silver"|"gold";

export type Badge={
 id:string;
 name:string;
 description:string;
 tier:BadgeTier;
 earned:boolean;
 /** Progress toward earning, 0..100. */
 percent:number;
 /** Human-readable progress, e.g. "7 / 12 keys". */
 detail:string;
};

const badge=(
 id:string,name:string,description:string,tier:BadgeTier,
 have:number,need:number,unit:string,
):Badge=>{
 const held=Math.max(0,Number.isFinite(have)?have:0);
 return {
  id,name,description,tier,
  earned:held>=need,
  percent:Math.min(100,Math.round((held/need)*100)),
  detail:`${Math.min(held,need)} / ${need} ${unit}`,
 };
};

export function badgesFor(input:GameInput):Badge[]{
 // Jury and freedom axes are seeded with placeholder values before anything has
 // actually been assessed, so they only count once a jury has really been sat.
 // Without this, a brand new profile is handed "No Weak Link" for doing nothing,
 // which is exactly the kind of unearned reward this system must not give.
 const assessed=input.lessonsCompleted>=1;
 const juryFloor=assessed&&input.juryScores.length?Math.min(...input.juryScores):0;
 const freedomFloor=assessed&&input.freedom.length?Math.min(...input.freedom):0;
 const half=Math.ceil(input.totalLessons/2);
 return [
  badge("first-pass","First Pass","Pass your first lesson jury.","bronze",input.lessonsCompleted,1,"lessons"),
  badge("foundation","Foundation Laid","Complete every lesson in Unit 1.","bronze",input.lessonsCompleted,4,"lessons"),
  badge("halfway","Halfway Home",`Pass ${half} lesson juries.`,"silver",input.lessonsCompleted,half,"lessons"),
  badge("graduate","Full Course","Pass every lesson jury in the course.","gold",input.lessonsCompleted,input.totalLessons,"lessons"),
  badge("twelve-keys","All Twelve","Reach 80 or better in all twelve keys.","gold",masteredKeys(input.keyMatrix),12,"keys"),
  badge("week-one","Seven Straight","Seven consecutive days of the programme.","bronze",longestStreak(input.beastDays),7,"days"),
  badge("iron-month","Iron Month","All thirty days of the programme.","gold",input.beastDays.length,30,"days"),
  badge("tempo-top","Top of the Ladder","Reach tempo rung 10 clean.","silver",input.tempoRung,10,"rungs"),
  badge("slap-ten","Thumb Fluent","Log ten clean slap drill passes.","silver",slapPassCount(input.slapPasses),10,"passes"),
  badge("no-weak-link","No Weak Link","Every jury axis at 70 or better.","silver",juryFloor,70,"minimum"),
  badge("free-player","Free Player","Every freedom axis at 85 or better.","gold",freedomFloor,85,"minimum"),
  badge("coached","Coached","Pass ten live-coach blocks.","bronze",input.coachPasses,10,"blocks"),
 ];
}

/* ------------------------------------------------------------ snapshot ---- */

export type Progression={
 xp:number;
 sources:XpSource[];
 rank:Rank;
 territories:TerritoryState[];
 badges:Badge[];
 badgesEarned:number;
 streak:number;
 bestStreak:number;
 keysMastered:number;
};

/** Everything the interface needs, from one pass over the stored state. */
export function progressionFor(input:GameInput,currentLesson:number):Progression{
 const {total,sources}=xpBreakdown(input);
 const badges=badgesFor(input);
 return {
  xp:total,
  sources,
  rank:rankFor(total),
  territories:territoryStates(input.lessonsCompleted,currentLesson),
  badges,
  badgesEarned:badges.filter(item=>item.earned).length,
  streak:currentStreak(input.beastDays),
  bestStreak:longestStreak(input.beastDays),
  keysMastered:masteredKeys(input.keyMatrix),
 };
}

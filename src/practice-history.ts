/**
 * The takes the listening engine has already scored.
 *
 * Every recorded take is posted to the Node API, analysed there and stored
 * against the learner. Nothing read it back, so the site was scoring practice
 * and never showing anyone the result. This is the read side.
 *
 * The learner id and the API base are read the same way NodeRuntimeShell reads
 * them, rather than threaded through the tree, because that is the only place
 * either value is decided and both are plain storage lookups.
 */

/** What the server works out about a take. Mirrors analyzePracticeTake. */
export type TakeAnalysis={
 noteCount:number;
 durationMs:number;
 /** Mean distance from the grid, in milliseconds. */
 averageGridOffsetMs:number;
 /** 100 is dead on the grid; it floors at 0. */
 timingScore:number;
 insidePercent:number;
 outsideCount:number;
 /**
  * Share of outside notes that reached a chord tone, 0–100 — or null when the
  * take never left home, which is an absence rather than a score of zero.
  */
 resolutionRate:number|null;
 functionCounts:Record<string,number>;
};

export type PracticeSession={
 sessionId:string;
 source?:string;
 createdAt:string;
 analysis:TakeAnalysis;
};

const LEARNER_KEY="basslab-node-learner-id";

const apiBase=()=>
 (window as {__BASSLAB_NODE_RUNTIME__?:{apiBase:string}}).__BASSLAB_NODE_RUNTIME__?.apiBase??"/api/v1";

const learnerId=()=>{
 // Storage throws outright where it is blocked, so this has to fall back
 // rather than take the page down with it.
 try{return localStorage.getItem(LEARNER_KEY)}catch{return null}
};

/**
 * The most recent takes, newest first.
 *
 * Returns an empty list rather than throwing when there is no learner yet, the
 * API is unreachable or the response is not what it should be: a practice
 * history that cannot load is a section with nothing in it, not a broken page.
 */
export async function fetchPracticeHistory(limit=8):Promise<PracticeSession[]>{
 const learner=learnerId();
 if(!learner)return [];
 try{
  const response=await fetch(`${apiBase()}/sessions/${encodeURIComponent(learner)}?limit=${limit}`,
   {headers:{"content-type":"application/json"}});
  if(!response.ok)return [];
  const body=await response.json() as {sessions?:unknown};
  if(!Array.isArray(body.sessions))return [];
  return body.sessions.filter(isSession);
 }catch{return []}
}

const isSession=(value:unknown):value is PracticeSession=>{
 if(!value||typeof value!=="object")return false;
 const session=value as Partial<PracticeSession>;
 return typeof session.sessionId==="string"
   &&typeof session.createdAt==="string"
   &&!!session.analysis
   &&typeof session.analysis.timingScore==="number";
};

/**
 * Which way a run of takes is going.
 *
 * Compares the two most recent against the two before them, and says nothing
 * at all until there are four — two takes is a pair of numbers, not a trend,
 * and telling somebody they are improving on that evidence is a lie.
 */
export function trendOf(sessions:PracticeSession[],read:(a:TakeAnalysis)=>number):number|null{
 if(sessions.length<4)return null;
 const mean=(list:PracticeSession[])=>list.reduce((sum,s)=>sum+read(s.analysis),0)/list.length;
 return Math.round(mean(sessions.slice(0,2))-mean(sessions.slice(2,4)));
}

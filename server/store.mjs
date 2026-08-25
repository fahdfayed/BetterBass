import {mkdir,readFile,rename,writeFile} from "node:fs/promises";
import {dirname} from "node:path";

export const ALLOWED_STATE_KEYS=new Set([
 "basslab-adaptive",
 "basslab-lessons",
 "basslab-course",
 "basslab-last-take",
 "basslab-beast",
 "basslab-performance-coach-v1",
 "slaplab-passes",
]);

// Learner ids index a plain object, so any name that resolves to an inherited
// member of Object.prototype must be refused: writing to learners["__proto__"]
// would otherwise mutate Object.prototype for the whole process.
export const RESERVED_LEARNER_IDS=new Set(["__proto__","constructor","prototype"]);

const EMPTY=()=>({schemaVersion:1,learners:Object.create(null)});
const now=()=>new Date().toISOString();

export function validateLearnerId(value){return typeof value==="string"&&/^[A-Za-z0-9_-]{8,100}$/.test(value)&&!RESERVED_LEARNER_IDS.has(value)}
export function validateRecords(records){
 if(!records||typeof records!=="object"||Array.isArray(records))return "records must be an object";
 let total=0;
 for(const [key,value] of Object.entries(records)){
  if(!ALLOWED_STATE_KEYS.has(key))return `unsupported state key: ${key}`;
  if(typeof value!=="string")return `${key} must be a serialized string`;
  total+=value.length;if(value.length>750_000)return `${key} is too large`;
 }
 if(total>2_000_000)return "state payload is too large";
 return null;
}

export function analyzePracticeTake(input){
 const events=Array.isArray(input)?input.filter(event=>event&&typeof event==="object").slice(0,5000):[];
 const offsets=events.map(event=>Math.abs(Number(event.offset))).filter(Number.isFinite);
 const tensions=events.map(event=>Number(event.tension)).filter(Number.isFinite);
 const outside=events.filter(event=>Number(event.tension)===4);
 const resolved=outside.filter(event=>event.resolution==="recovered").length;
 const start=Math.min(...events.map(event=>Number(event.start)).filter(Number.isFinite));
 const end=Math.max(...events.map(event=>Number(event.end)).filter(Number.isFinite));
 const averageGridOffsetMs=offsets.length?Math.round(offsets.reduce((sum,value)=>sum+value,0)/offsets.length):null;
 const insidePercent=tensions.length?Math.round(tensions.filter(value=>value<4).length/tensions.length*100):null;
 const resolutionRate=outside.length?Math.round(resolved/outside.length*100):null;
 const functionCounts=events.reduce((counts,event)=>{const candidate=typeof event.fn==="string"?event.fn.toUpperCase():"",key=/^[A-Z][A-Z _/-]{0,39}$/.test(candidate)?candidate:"UNLABELLED";counts[key]=(counts[key]??0)+1;return counts},Object.create(null));
 return {
  noteCount:events.length,
  durationMs:Number.isFinite(start)&&Number.isFinite(end)?Math.max(0,Math.round(end-start)):0,
  averageGridOffsetMs,
  timingScore:averageGridOffsetMs===null?null:Math.max(0,Math.min(100,100-averageGridOffsetMs)),
  insidePercent,
  outsideCount:outside.length,
  resolutionRate,
  functionCounts,
 };
}

export class JsonLearnerStore{
 constructor(filePath){this.filePath=filePath;this.data=EMPTY();this.queue=Promise.resolve();this.ready=this.#load();this.ready.catch(()=>{})}
 async #load(){try{const parsed=JSON.parse(await readFile(this.filePath,"utf8"));if(!parsed||parsed.schemaVersion!==1||!parsed.learners||typeof parsed.learners!=="object")throw new Error("Unsupported Bass Lab data schema");const learners=Object.create(null);for(const [id,record] of Object.entries(parsed.learners))if(validateLearnerId(id))learners[id]=record;this.data={schemaVersion:1,learners}}catch(error){if(error?.code!=="ENOENT")throw error}}
 async #save(){await mkdir(dirname(this.filePath),{recursive:true});const temporary=`${this.filePath}.${process.pid}.${Date.now()}.tmp`;await writeFile(temporary,`${JSON.stringify(this.data,null,2)}\n`,{mode:0o600});await rename(temporary,this.filePath)}
 async #read(){await this.ready;await this.queue;return this.data}
 // this.queue only ever tracks completion, never failure: a rejected queue would
 // be re-thrown into every later read and would surface as an unhandled rejection.
 async #mutate(change){await this.ready;const run=this.queue.then(async()=>{const result=change(this.data);await this.#save();return result});this.queue=run.then(()=>undefined,()=>undefined);return run}
 async getState(learnerId){const data=await this.#read(),learner=data.learners[learnerId];return {learnerId,records:structuredClone(learner?.records??{}),updatedAt:learner?.updatedAt??null}}
 async putState(learnerId,records){return this.#mutate(data=>{const stamp=now(),existing=data.learners[learnerId]??{createdAt:stamp,records:{},sessions:[]};existing.records={...existing.records,...records};existing.updatedAt=stamp;data.learners[learnerId]=existing;return {learnerId,records:structuredClone(existing.records),updatedAt:stamp}})}
 async appendSession(learnerId,session){return this.#mutate(data=>{const stamp=now(),existing=data.learners[learnerId]??{createdAt:stamp,records:{},sessions:[]},sessionId=String(session.sessionId),found=existing.sessions.find(item=>item.sessionId===sessionId);if(found)return {session:structuredClone(found),created:false};const saved={sessionId,source:session.source??"browser",createdAt:stamp,context:session.context??{},analysis:analyzePracticeTake(session.events)};existing.sessions=[saved,...existing.sessions].slice(0,250);existing.updatedAt=stamp;data.learners[learnerId]=existing;return {session:structuredClone(saved),created:true}})}
 async getSessions(learnerId,limit=25){const data=await this.#read(),sessions=data.learners[learnerId]?.sessions??[];return structuredClone(sessions.slice(0,Math.max(1,Math.min(100,limit))))}
}

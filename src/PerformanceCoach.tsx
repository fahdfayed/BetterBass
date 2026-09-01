/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {saveLearningState} from "./learning-storage";
import {speakCoach,stopCoachSpeech} from "./speech";
import {SHORT_NAMES as DEGREES} from "./theory/degrees";

const NOTES=["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
const AXES=["HEAR","SEE","KNOW","PLAY","CREATE"] as const;
type Axis=typeof AXES[number];
type CoachTab="TODAY"|"ASSESS"|"EVIDENCE"|"HISTORY";

type TakeEvent={midi:number;offset:number;tension:number;resolution:string;start:number;end:number;dur:number;beat:number};
type Attempt={id:string;axis:Axis;score:number;label:string;detail:string;source:string;at:number};
type KeyStat={correct:number;total:number;lastAt:number|null;streak:number};
type ExerciseStep={at:number;cue:string;detail:string;spoken?:string;target?:number[]};
type DetectorSpec={
 allowed:number[];
 stable:number[];
 required:number[];
 minEvents:number;
 timingTolerance:number;
 maxOutsideRate:number;
 minCoverage:number;
 passScore:number;
 minOutside?:number;
 minRange?:number;
 motifRepeats?:number;
 requireRecovery?:boolean;
};
type CoachBlock={id:string;title:string;minutes:number;axis:Axis|"REPAIR"|"PROVE";reason:string;task:string;pass:string;tool:string;done:boolean;steps?:ExerciseStep[];listenFor?:string[];autoCorrection?:string;detector?:DetectorSpec};
type CoachSession={id:string;createdAt:number;duration:number;key:number;bpm?:number;blocks:CoachBlock[]};
type SessionHistory={id:string;at:number;duration:number;completed:number;total:number;focus:string};
type CoachState={attempts:Attempt[];keyStats:KeyStat[];activeSession:CoachSession|null;sessions:SessionHistory[];antiHabit:boolean};
type ExternalEvidence={beastDays:number;beastLogs:number;beastErrors:Record<string,number>;lastTake:TakeEvent[]};
type BlockAnalysis={score:number;pass:boolean;events:number;timing:number;coverage:number;inside:number;recovery:number;range:number;motifRepeats:number;issue:string;correction:string};
type RunnerPhase="preparing"|"countdown"|"block"|"repair"|"transition"|"finished";
type RunnerResult={blockId:string;title:string;score:number;pass:boolean;repaired:boolean;detail:string};
type RunnerView={active:boolean;session:CoachSession|null;phase:RunnerPhase;blockIndex:number;secondsLeft:number;elapsed:number;tempo:number;cue:string;detail:string;correction:string;events:number;analysis:BlockAnalysis|null;results:RunnerResult[]};
type RunnerRuntime={session:CoachSession;phase:RunnerPhase;blockIndex:number;stageStartedAt:number;stageDuration:number;blockStartedAt:number;tempo:number;lastBeat:number;lastStep:number;lastFeedbackAt:number;lastCorrectionAt:number;lastReferenceAt:number;referenceIndex:number;currentTarget:number|null;lastEventCount:number;repairUsed:boolean;results:RunnerResult[]};

type Props={
 root:number;
 modeName:string;
 courseTitle:string;
 courseCompleted:number;
 courseTotal:number;
 events:TakeEvent[];
 livePitch:{n:string;oct:number;cents:number;hz:number}|null;
 listening:boolean;
 recording:boolean;
 onStartRecording:()=>Promise<boolean|void>;
 onStopRecording:()=>void;
 onSetRoot:(key:number)=>void;
 modeIntervals:number[];
 characterInterval:number;
 onOpen:(tool:string)=>void;
 onAudition:(notes:number[])=>void;
};

const STORAGE="basslab-performance-coach-v1";
const EMPTY_KEYS=()=>Array.from({length:12},()=>({correct:0,total:0,lastAt:null,streak:0}));
const DEFAULT_STATE:CoachState={attempts:[],keyStats:EMPTY_KEYS(),activeSession:null,sessions:[],antiHabit:false};
const KNOWLEDGE=[
 {q:"What makes an outside note sound intentional?",a:1,o:["Its rarity","A clear destination and rhythmic placement","Playing it loudly","Moving immediately to another outside note"]},
 {q:"Over a static Dm7 vamp, which pitch most clearly identifies Dorian?",a:2,o:["C","A","B natural","E♭"]},
 {q:"When should a tempo rung increase?",a:3,o:["After one clean pass","When the exercise feels familiar","Every five minutes","After three consecutive clean repetitions"]},
 {q:"What should be chosen before a chromatic approach?",a:0,o:["The destination","The fastest fingering","A new scale","The highest available fret"]},
 {q:"Why can the same pitch be inside in one bar and outside in the next?",a:2,o:["Bass tuning changes","Tempo changes its spelling","Harmonic function changes with the current root or chord","Every pitch has two fixed meanings"]},
 {q:"Which variable makes identical tension pitches feel most exposed?",a:1,o:["Instrument colour alone","Long duration on a strong beat","Using the index finger","Playing below fret five"]},
 {q:"What should survive during a semitone side-slip?",a:3,o:["The original key signature","Only the root","The fret number","Motif rhythm and contour"]},
 {q:"A correct phrase becomes tense and rushed. Is it a pass?",a:0,o:["No, body tension and time are part of the result","Yes, the notes were correct","Yes, above 80 BPM","Only if it ended on root"]},
];

const clamp=(value:number,min=0,max=100)=>Math.max(min,Math.min(max,value));
const uid=(prefix:string)=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const daysSince=(at:number|null)=>at?Math.max(0,Math.floor((Date.now()-at)/86400000)):null;
const formatDate=(at:number)=>new Intl.DateTimeFormat("en",{month:"short",day:"numeric",year:"numeric"}).format(at);
const shuffle=<T,>(items:T[])=>[...items].sort(()=>Math.random()-.5);
const optionsAround=(correct:number,pool:number[])=>shuffle([correct,...shuffle(pool.filter(x=>x!==correct)).slice(0,3)]);
const masteryLabel=(score:number|undefined)=>score===undefined?"Unassessed":score>=90?"Automatic":score>=80?"Musical":score>=70?"Playable":score>=60?"Understood":score>=45?"Learned":"Foundation";
const pc=(midi:number)=>(midi%12+12)%12;
const noteAt=(key:number,interval:number)=>NOTES[(key+interval+120)%12];
const noteList=(key:number,intervals:number[])=>intervals.map(interval=>`${noteAt(key,interval)} (${DEGREES[(interval+12)%12]})`).join(" · ");
const timeLabel=(seconds:number)=>`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
const timeline=(minutes:number,steps:Array<Omit<ExerciseStep,"at">>):ExerciseStep[]=>{
 const positions=[0,.18,.42,.66,.84];
 return steps.map((step,index)=>({...step,at:Math.min(minutes*60-12,Math.round(minutes*60*(positions[index]??index/steps.length)))}));
};
const defaultDetector=(minutes:number,modeIntervals:number[],characterInterval:number):DetectorSpec=>({
 allowed:modeIntervals,
 stable:[0,modeIntervals.includes(3)?3:4,7,modeIntervals.includes(10)?10:11].filter(interval=>modeIntervals.includes(interval)),
 required:[0,characterInterval],
 minEvents:Math.max(8,minutes*5),
 timingTolerance:115,
 maxOutsideRate:.12,
 minCoverage:2,
 passScore:72,
});
const getSteps=(block:CoachBlock)=>block.steps?.length?block.steps:timeline(block.minutes,[
 {cue:"Establish the target",detail:block.task},
 {cue:"Repeat slowly",detail:"Use clear quarter notes and leave one beat of silence after every four notes."},
 {cue:"Connect the material",detail:"Keep the pulse while changing register once."},
 {cue:"Apply it musically",detail:"Use short phrases; every phrase must have a clear ending."},
 {cue:"Proof pass",detail:block.pass},
]);
const getDetector=(block:CoachBlock,modeIntervals:number[],characterInterval:number)=>block.detector||defaultDetector(block.minutes,modeIntervals,characterInterval);

function repeatedContourCount(events:TakeEvent[]){
 if(events.length<6)return 0;
 const cells=new Map<string,number>();
 for(let index=0;index<=events.length-3;index++){
  const a=events[index].midi,b=events[index+1].midi,c=events[index+2].midi;
  const shape=`${Math.sign(b-a)}:${Math.min(7,Math.abs(b-a))}|${Math.sign(c-b)}:${Math.min(7,Math.abs(c-b))}`;
  cells.set(shape,(cells.get(shape)||0)+1);
 }
 return Math.max(0,...cells.values())-1;
}

function speakText(message:string,interrupt=false){
 void speakCoach(message,{interrupt});
}

function outputTone(ctx:AudioContext,frequency:number,duration=.12,volume=.04,type:OscillatorType="sine"){
 if(ctx.state==="suspended")void ctx.resume();
 const oscillator=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;
 oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,now);
 gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(Math.max(.001,volume),now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
 oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(now);oscillator.stop(now+duration+.02);
}

function playCoachBeat(ctx:AudioContext,accent:boolean,key:number){
 outputTone(ctx,accent?1320:880,.045,accent ? .045 : .025,"square");
 if(accent){
  const midi=36+key,frequency=440*Math.pow(2,(midi-69)/12);
  outputTone(ctx,frequency,.2,.035,"sine");
 }
}

function playReference(ctx:AudioContext,key:number,interval:number){
 const midi=48+(key+interval)%12,frequency=440*Math.pow(2,(midi-69)/12);
 outputTone(ctx,frequency,.72,.055,"sine");
}

function analyzeEvents(block:CoachBlock,raw:TakeEvent[],key:number,tempo:number,startMs:number,modeIntervals:number[],characterInterval:number,expectedFactor=1):BlockAnalysis{
 const detector=getDetector(block,modeIntervals,characterInterval);
 const events=raw.filter(event=>event.midi>=28&&event.midi<=67&&event.start>=startMs);
 const allowed=new Set(detector.allowed.map(interval=>(key+interval)%12));
 const stable=new Set(detector.stable.map(interval=>(key+interval)%12));
 const required=detector.required.map(interval=>(key+interval)%12);
 const seen=new Set(events.map(event=>pc(event.midi)));
 const missing=required.filter(note=>!seen.has(note));
 const coverage=required.length?Math.round((required.length-missing.length)/required.length*100):100;
 const gridMs=30000/tempo;
 const timing=events.length?Math.round(events.reduce((sum,event)=>{const relative=event.start-startMs;return sum+Math.abs(relative-Math.round(relative/gridMs)*gridMs)},0)/events.length):999;
 const timingScore=clamp(Math.round(100-timing*.72));
 const outside=events.filter(event=>!allowed.has(pc(event.midi)));
 let recovered=0;
 outside.forEach(event=>{if(events.some(next=>next.start>event.start&&next.start-event.end<=1400&&stable.has(pc(next.midi))))recovered++});
 const recovery=outside.length?Math.round(recovered/outside.length*100):detector.minOutside?0:100;
 const inside=events.length?Math.round((events.length-outside.length)/events.length*100):0;
 const range=events.length?Math.max(...events.map(event=>event.midi))-Math.min(...events.map(event=>event.midi)):0;
 const motifRepeats=repeatedContourCount(events);
 const expectedEvents=Math.max(3,Math.ceil(detector.minEvents*expectedFactor));
 const densityScore=clamp(Math.round(events.length/expectedEvents*100));
 const rangeScore=detector.minRange?clamp(Math.round(range/detector.minRange*100)):100;
 const motifScore=detector.motifRepeats?clamp(Math.round(motifRepeats/detector.motifRepeats*100)):100;
 const score=Math.round(timingScore*.25+inside*.2+coverage*.2+densityScore*.15+recovery*.1+rangeScore*.05+motifScore*.05);
 const outsideRate=events.length?outside.length/events.length:0;
 let issue="The take is meeting the current target.",correction="Keep the same tempo, sound and amount of space.";
 if(events.length<Math.min(4,expectedEvents)){
  issue="Not enough clear bass events are reaching the detector.";
  correction="Play one clean note at a time. Use a clean D I or audio-interface input, raise input level slightly, and mute unused strings.";
 }else if(timing>detector.timingTolerance){
  issue=`Average placement is ${timing} milliseconds from the nearest eighth-note grid.`;
  correction="The tempo will drop six B P M. Play only root and fifth on quarter notes until the click feels centred.";
 }else if(missing.length){
  issue=`The required ${missing.map(note=>NOTES[note]).join(" and ")} ${missing.length===1?"has":"have"} not been heard enough.`;
  correction=`Feature ${missing.map(note=>NOTES[note]).join(" then ")} in the next phrase, then resolve to ${noteAt(key,detector.stable[0]||0)}.`;
 }else if(outsideRate>detector.maxOutsideRate){
  issue=`Outside notes are ${Math.round(outsideRate*100)} percent of detected events; the limit is ${Math.round(detector.maxOutsideRate*100)} percent.`;
  correction=`Reduce the pitch set to ${noteList(key,detector.stable.slice(0,3))}. Add only one outside note before a stable target.`;
 }else if((detector.minOutside||0)>outside.length){
  issue="The phrase has not yet made a deliberate departure from the mode.";
  correction=`Add one chromatic approach, hold it for no more than one beat, then land on ${noteAt(key,detector.stable[0]||0)}.`;
 }else if(detector.requireRecovery&&outside.length&&recovery<80){
  issue=`Only ${recovery} percent of outside notes reached a stable target within 1.4 seconds.`;
  correction=`Choose the destination first: ${detector.stable.slice(0,3).map(interval=>noteAt(key,interval)).join(", ")}. Approach it by semitone without stopping the pulse.`;
 }else if(detector.minRange&&range<detector.minRange){
  issue=`Detected range is ${range} semitones; this block requires at least ${detector.minRange}.`;
  correction="Repeat the same target one octave higher. Keep the rhythm identical so only register changes.";
 }else if(detector.motifRepeats&&motifRepeats<detector.motifRepeats){
  issue="No three-note contour has repeated enough to establish a motif.";
  correction="Choose three notes. Repeat their rhythm and contour twice before changing the ending.";
 }
 const pass=score>=detector.passScore&&events.length>=expectedEvents&&coverage>=Math.min(100,detector.minCoverage/Math.max(1,required.length)*100)&&timing<=detector.timingTolerance&&outsideRate<=detector.maxOutsideRate&&outside.length>=(detector.minOutside||0)&&(!detector.requireRecovery||!outside.length||recovery>=80)&&(!detector.minRange||range>=detector.minRange)&&(!detector.motifRepeats||motifRepeats>=detector.motifRepeats);
 return{score,pass,events:events.length,timing,coverage,inside,recovery,range,motifRepeats,issue,correction};
}

function axisBlueprint(axis:Axis,minutes:number,key:number,modeName:string,modeIntervals:number[],characterInterval:number,courseTitle:string){
 const detector=defaultDetector(minutes,modeIntervals,characterInterval);
 const root=noteAt(key,0),colour=noteAt(key,characterInterval),third=noteAt(key,modeIntervals.includes(3)?3:4),fifth=noteAt(key,7),seventh=noteAt(key,modeIntervals.includes(10)?10:11);
 if(axis==="HEAR")return{
  title:"Hear → echo → resolve",tool:"hear",task:`Against a ${root} drone, hear and echo ${root}, ${colour}, ${third}, ${fifth} and ${seventh}; do not search by running the scale.`,pass:`At least ${detector.minEvents} clean events, every called function heard, mean timing within 125 ms and no scale-search runs.`,
  listenFor:[`Correct response pitch after each sounded target`,`Root ${root} and characteristic ${colour} both present`,`Clear attack after the listening gap`,`No more than 10% notes outside ${root} ${modeName}`],
  autoCorrection:`A wrong response triggers the target name and a second reference tone. Timing drift lowers the click by 6 BPM.`,
  steps:timeline(minutes,[
   {cue:"Root calibration",detail:`Listen to ${root}, wait for the tone to stop, then echo it four times with two beats of space.`,spoken:"Listen to the reference, then echo it four times after it stops.",target:[0]},
   {cue:"Characteristic colour",detail:`Hear and echo ${colour}, the ${DEGREES[characterInterval]} that identifies ${modeName}. Alternate ${root} → ${colour}; four cycles.`,spoken:`New colour tone. Echo it, then alternate it with the root for four cycles.`,target:[characterInterval]},
   {cue:"Quality contrast",detail:`Echo ${third}, then play ${root} → ${third} → ${colour}. Leave one full beat after each three-note answer.`,spoken:"Echo the quality tone, then connect root, quality and colour.",target:[modeIntervals.includes(3)?3:4]},
   {cue:"Stable targets",detail:`Echo ${fifth} and ${seventh}. After each, choose the nearest route back to ${root}; do not add more than one connector.`,spoken:"Echo the stable target, then return to the root by the shortest route.",target:[7,modeIntervals.includes(10)?10:11]},
   {cue:"Blind proof",detail:`The app cycles the five targets. Respond only after the tone ends; one clear note per call, then finish on ${root}.`,spoken:"Blind proof. One response per reference tone. Finish on home.",target:[0,characterInterval,modeIntervals.includes(3)?3:4,7,modeIntervals.includes(10)?10:11]},
  ]),detector:{...detector,required:[0,characterInterval,modeIntervals.includes(3)?3:4,7],timingTolerance:125,minCoverage:4,maxOutsideRate:.1}
 };
 if(axis==="SEE")return{
  title:"Two-register target retrieval",tool:"fret",task:`Retrieve ${root}, ${third}, ${colour}, ${fifth} and ${seventh} in a low octave and again at least 12 semitones higher. Pitch and octave are detected; fingering remains your responsibility.`,pass:`All five pitch classes, at least a 12-semitone range, ${detector.minEvents} events and mean placement within 120 ms.`,
  listenFor:[`Every called pitch class`,`A range of at least one octave`,`No chromatic searching between targets`,`Attack lands on the next click after the cue`],
  autoCorrection:`A missing note is named aloud. A narrow range triggers “repeat one octave higher.” Chromatic hunting reduces the note pool.`,
  steps:timeline(minutes,[
   {cue:"Low root map",detail:`Play ${root} below middle C four times. Use a different string or position when possible; stop the string cleanly after each note.`,target:[0]},
   {cue:"Find the quality",detail:`Locate ${third} low, then ${third} one octave higher. Alternate the two registers for four cycles without connector notes.`,target:[modeIntervals.includes(3)?3:4]},
   {cue:"Find the colour",detail:`Locate ${colour} in two octaves. Play ${root} → ${colour}, pause one beat, then repeat in the higher register.`,target:[characterInterval]},
   {cue:"Stable pair",detail:`Call-and-play ${fifth}, then ${seventh}, in both registers. One note only after each cue, no scale search.`,target:[7,modeIntervals.includes(10)?10:11]},
   {cue:"Random retrieval proof",detail:`Cycle ${root}, ${third}, ${colour}, ${fifth}, ${seventh}. Each answer must begin within one beat and alternate low/high register.`,target:[0,modeIntervals.includes(3)?3:4,characterInterval,7,modeIntervals.includes(10)?10:11]},
  ]),detector:{...detector,required:[0,modeIntervals.includes(3)?3:4,characterInterval,7,modeIntervals.includes(10)?10:11],minCoverage:5,minRange:12,timingTolerance:120,maxOutsideRate:.08}
 };
 if(axis==="KNOW")return{
  title:"Function grammar on the bass",tool:"know",task:`Prove ${courseTitle} as sound: home (${root}) → modal colour (${colour}) → deliberate tension → stable destination. The app scores the musical sequence, not a verbal essay.`,pass:`Home and ${modeName} colour are clear, one outside event resolves within 1.4 seconds, and the sequence repeats without losing time.`,
  listenFor:[`Home before departure`,`Characteristic ${colour} before added tension`,`At least one intentional outside event`,`Return to ${root}, ${third}, ${fifth} or ${seventh}`],
  autoCorrection:`If the function order becomes unclear, the coach removes outside notes and calls the exact home-colour-target sequence.`,
  steps:timeline(minutes,[
   {cue:"State home",detail:`Play ${root} → ${third} → ${fifth} → ${seventh} as half notes for four loops. Say “home, quality, support, seventh” while you play; speech is a self-check, not scored.`,target:[0,modeIntervals.includes(3)?3:4,7,modeIntervals.includes(10)?10:11]},
   {cue:"State modal identity",detail:`Insert ${colour} between ${root} and ${fifth}. Repeat the same rhythm six times until ${modeName} is audible without a scale run.`,target:[characterInterval]},
   {cue:"Choose destination first",detail:`Choose ${root}, ${third} or ${fifth}. Play one chromatic neighbour immediately before it; keep the destination on the click.`,target:[0,modeIntervals.includes(3)?3:4,7]},
   {cue:"Departure and return",detail:`Two bars home, one outside note for one beat, immediate stable target, then one bar home. Repeat with a different destination.`,target:[0,modeIntervals.includes(3)?3:4,7]},
   {cue:"Function proof",detail:`Perform home → ${colour} → one outside approach → stable target four times. Do not stop or add a scale run.`,target:[0,characterInterval,modeIntervals.includes(3)?3:4,7]},
  ]),detector:{...detector,required:[0,characterInterval],minOutside:1,requireRecovery:true,maxOutsideRate:.18,timingTolerance:115}
 };
 if(axis==="PLAY")return{
  title:"Pocket under harmonic pressure",tool:"listen",task:`Hold a ${root} ${modeName} pocket while moving chord tones → ${colour} → one chromatic departure → complete return.`,pass:`Mean eighth-grid offset ≤95 ms, ${detector.minEvents} events, outside density ≤20% and at least 80% of departures resolve within 1.4 seconds.`,
  listenFor:[`Onset distance from the eighth-note grid`,`Use of ${colour}`,`Outside-note duration and density`,`Stable target after every departure`],
  autoCorrection:`Timing above 95 ms drops 6 BPM. Unresolved departures trigger a root/fifth repair loop before the next attempt.`,
  steps:timeline(minutes,[
   {cue:"Lock the skeleton",detail:`Quarter notes: ${root} → ${fifth} → ${third} → ${fifth}. Eight loops, identical attack and length; leave beat 4 empty every second bar.`,target:[0,7,modeIntervals.includes(3)?3:4]},
   {cue:"Add modal colour",detail:`Keep the rhythm. Replace one ${fifth} with ${colour} every two bars; do not increase note density.`,target:[characterInterval]},
   {cue:"Approach the target",detail:`Choose ${root} or ${third}; precede it with one chromatic note on the “and” before the click. Six clean landings.`,target:[0,modeIntervals.includes(3)?3:4]},
   {cue:"Pressure loop",detail:`Two bars inside, one outside event for no more than one beat, two bars home. Preserve the original bass rhythm for four cycles.`,target:[0,modeIntervals.includes(3)?3:4,7]},
   {cue:"Unbroken proof",detail:`One continuous groove: establish home, feature ${colour}, make two departures, resolve each, then end with two clean bars.`,target:[0,characterInterval,modeIntervals.includes(3)?3:4,7]},
  ]),detector:{...detector,required:[0,characterInterval],minOutside:1,requireRecovery:true,maxOutsideRate:.2,timingTolerance:95,passScore:76}
 };
 return{
  title:"Motif survival test",tool:"create",task:`Build a three-note motif from ${root}, ${third} and ${colour}; repeat its contour, change register, make one chromatic version, then return to the original.`,pass:`The detector finds at least three repeated contours, a 12-semitone range, ${colour}, one recovered departure and mean placement within 110 ms.`,
  listenFor:[`Repeated three-note interval contour`,`Characteristic ${colour}`,`Register change of at least one octave`,`Recovered chromatic version`,`Space between motif statements`],
  autoCorrection:`If no motif recurs, the coach calls a fixed ${root}-${third}-${colour} cell. If register or recovery is missing, it prescribes only that variable.`,
  steps:timeline(minutes,[
   {cue:"Write the identity",detail:`Motif: ${root} → ${third} → ${colour}. Choose one rhythm and repeat it exactly four times with one beat of space.`,target:[0,modeIntervals.includes(3)?3:4,characterInterval]},
   {cue:"Change only the ending",detail:`Keep the first two notes and rhythm; replace the last note with ${fifth}. Alternate original and new ending four times.`,target:[0,modeIntervals.includes(3)?3:4,7]},
   {cue:"Change only register",detail:`Play the original motif one octave higher, then answer in the low register. Keep contour and rhythm unchanged.`,target:[0,modeIntervals.includes(3)?3:4,characterInterval]},
   {cue:"Outside version",detail:`Move the entire motif up one semitone for one statement. Return immediately to the original ${root} motif without changing rhythm.`,target:[0,modeIntervals.includes(3)?3:4,characterInterval]},
   {cue:"Musical proof",detail:`Original → altered ending → high register → outside version → original. Leave space and finish on ${root}.`,target:[0,modeIntervals.includes(3)?3:4,characterInterval,7]},
  ]),detector:{...detector,required:[0,characterInterval],minOutside:1,requireRecovery:true,maxOutsideRate:.24,minRange:12,motifRepeats:3,timingTolerance:110,passScore:75}
 };
}

export default function PerformanceCoach({root,modeName,courseTitle,courseCompleted,courseTotal,events,livePitch,listening,recording,onStartRecording,onStopRecording,onSetRoot,modeIntervals,characterInterval,onOpen,onAudition}:Props){
 const [tab,setTab]=useState<CoachTab>("TODAY");
 const [data,setData]=useState<CoachState>(DEFAULT_STATE);
 const [loaded,setLoaded]=useState(false);
 const [external,setExternal]=useState<ExternalEvidence>({beastDays:0,beastLogs:0,beastErrors:{},lastTake:[]});
 const [duration,setDuration]=useState(60);
 const [assessment,setAssessment]=useState<Axis>("HEAR");
 const [questionNumber,setQuestionNumber]=useState(1);
 const [correctCount,setCorrectCount]=useState(0);
 const [feedback,setFeedback]=useState("");
 const [earInterval,setEarInterval]=useState(9);
 const [earOptions,setEarOptions]=useState(()=>optionsAround(9,Array.from({length:12},(_,i)=>i)));
 const [seePrompt,setSeePrompt]=useState(()=>({string:0,target:6,correct:2,options:[2,4,7,9]}));
 const [knowIndex,setKnowIndex]=useState(0);
 const [selectedKey,setSelectedKey]=useState(root);
 const [keyInterval,setKeyInterval]=useState(3);
 const [keyOptions,setKeyOptions]=useState(()=>optionsAround((root+3)%12,Array.from({length:12},(_,i)=>i)));
 const [keyFeedback,setKeyFeedback]=useState("");
 const [keyRun,setKeyRun]=useState({correct:0,total:0});
 const [createChecks,setCreateChecks]=useState([false,false,false,false,false]);
 const [timerBlock,setTimerBlock]=useState<string|null>(null);
 const [timerSeconds,setTimerSeconds]=useState(0);
 const [timerRunning,setTimerRunning]=useState(false);
 const [runner,setRunner]=useState<RunnerView>({active:false,session:null,phase:"preparing",blockIndex:0,secondsLeft:0,elapsed:0,tempo:68,cue:"",detail:"",correction:"",events:0,analysis:null,results:[]});
 const liveEventsRef=useRef(events);
 const sessionRef=useRef<CoachSession|null>(null);
 const runnerRuntimeRef=useRef<RunnerRuntime|null>(null);
 const cueAudioRef=useRef<AudioContext|null>(null);
 const outputTimersRef=useRef<number[]>([]);
 const callbacksRef=useRef({onStopRecording,onSetRoot});

 useEffect(()=>{
  try{
   const stored=JSON.parse(localStorage.getItem(STORAGE)||"null");
   if(stored){
    setData({...DEFAULT_STATE,...stored,keyStats:Array.from({length:12},(_,i)=>stored.keyStats?.[i]||EMPTY_KEYS()[i])});
   }
   const beast=JSON.parse(localStorage.getItem("basslab-beast")||"null");
   const lastTake=JSON.parse(localStorage.getItem("basslab-last-take")||"[]");
   setExternal({
    beastDays:Array.isArray(beast?.completedDays)?beast.completedDays.length:0,
    beastLogs:beast?.logs?Object.keys(beast.logs).length:0,
    beastErrors:beast?.errorCounts||{},
    lastTake:Array.isArray(lastTake)?lastTake:[],
   });
  }catch{}
  setLoaded(true);
 },[]);

 useEffect(()=>{if(loaded)saveLearningState(STORAGE,JSON.stringify(data))},[data,loaded]);
 useEffect(()=>{liveEventsRef.current=events},[events]);
 useEffect(()=>{sessionRef.current=data.activeSession},[data.activeSession]);
 useEffect(()=>{callbacksRef.current={onStopRecording,onSetRoot}},[onStopRecording,onSetRoot]);
 useEffect(()=>{
  if(!timerRunning||!timerBlock)return;
  const timer=window.setInterval(()=>setTimerSeconds(value=>Math.max(0,value-1)),1000);
  return()=>window.clearInterval(timer);
 },[timerRunning,timerBlock]);
 // Stopping the clock is a side effect, so it cannot live inside the updater:
 // React re-runs updaters (twice under StrictMode) to check that they are pure.
 useEffect(()=>{if(timerRunning&&timerSeconds===0)setTimerRunning(false)},[timerRunning,timerSeconds]);

 const take=events.length?events:external.lastTake;
 const takeMetrics=useMemo(()=>{
  if(take.length<4)return null;
  const outside=take.filter(e=>e.tension===4),recovered=outside.filter(e=>e.resolution==="recovered").length;
  const meanOffset=Math.round(take.reduce((sum,e)=>sum+Math.abs(e.offset||0),0)/take.length);
  const timing=clamp(Math.round(100-meanOffset*.72),25,100);
  const recovery=outside.length?Math.round(recovered/outside.length*100):55;
  const completeness=clamp(Math.round(take.length/24*100),30,100);
  const playScore=Math.round(timing*.48+recovery*.37+completeness*.15);
  const starts=take.filter((event,index)=>index===0||event.start-take[index-1].end>500);
  const rootStarts=starts.length?Math.round(starts.filter(e=>(e.midi%12+12)%12===root).length/starts.length*100):0;
  const ascending=take.length>1?Math.round(take.slice(1).filter((e,i)=>e.midi>take[i].midi).length/(take.length-1)*100):0;
  const strongStarts=starts.length?Math.round(starts.filter(e=>(e.beat===1||e.beat===3)&&Math.abs(e.offset)<110).length/starts.length*100):0;
  const first=take[0].start,last=take[take.length-1].end,total=Math.max(1,last-first),sounding=take.reduce((sum,e)=>sum+(e.dur||Math.max(0,e.end-e.start)),0);
  const silence=clamp(Math.round((1-sounding/total)*100));
  const range=Math.max(...take.map(e=>e.midi))-Math.min(...take.map(e=>e.midi));
  return{outside:outside.length,recovered,recovery,meanOffset,timing,completeness,playScore,rootStarts,ascending,strongStarts,silence,range,events:take.length};
 },[take,root]);

 const scores=useMemo(()=>Object.fromEntries(AXES.map(axis=>{
  const attempts=data.attempts.filter(a=>a.axis===axis).slice(0,6);
  if(!attempts.length)return[axis,undefined];
  const weights=attempts.map((_,i)=>Math.pow(.82,i));
  return[axis,Math.round(attempts.reduce((sum,a,i)=>sum+a.score*weights[i],0)/weights.reduce((a,b)=>a+b,0))];
 })) as Record<Axis,number|undefined>,[data.attempts]);
 const scoredAxes=AXES.filter(axis=>scores[axis]!==undefined);
 const overall=scoredAxes.length===5?Math.round(AXES.reduce((sum,axis)=>sum+(scores[axis]||0),0)/5):null;
 const topError=Object.entries(external.beastErrors).sort((a,b)=>b[1]-a[1])[0];
 const attemptedKeys=data.keyStats.map((stat,index)=>({...stat,index})).filter(stat=>stat.total>0);
 const weakestKey=attemptedKeys.length?[...attemptedKeys].sort((a,b)=>a.correct/a.total-b.correct/b.total)[0].index:selectedKey;
 const habitRule=!takeMetrics?"Record one uninterrupted take to reveal a real anti-habit.":takeMetrics.rootStarts>=60?"No phrase may begin on the root.":takeMetrics.ascending>=65?"Every fill must descend or remain level.":takeMetrics.strongStarts>=70?"Begin phrases after beat 1; use &2 or &4.":takeMetrics.silence<20?"Leave one complete beat of silence in every bar.":takeMetrics.range<7?"Use two registers at least an octave apart.":"Preserve one motif while changing only its ending.";
 const habitMetrics=takeMetrics?[
  {label:"Root-start phrases",value:takeMetrics.rootStarts},
  {label:"Ascending moves",value:takeMetrics.ascending},
  {label:"Strong-beat starts",value:takeMetrics.strongStarts},
  {label:"Silence",value:takeMetrics.silence},
  {label:"Outside recovery",value:takeMetrics.recovery},
 ]:[];

 const mastery=useMemo(()=>[
  {name:"Note-location command",score:scores.SEE,source:"Fretboard tests + key transfer"},
  {name:"Mode identity by ear",score:scores.HEAR,source:"Blind listening tests"},
  {name:"Explain harmonic function",score:scores.KNOW,source:"Theory decisions"},
  {name:"Time under harmonic pressure",score:scores.PLAY,source:"Recorded event analysis"},
  {name:"Intentional outside resolution",score:scores.PLAY===undefined||scores.CREATE===undefined?undefined:Math.round((scores.PLAY+scores.CREATE)/2),source:"Recording + creative proof"},
  {name:"Spontaneous musical creation",score:scores.CREATE,source:"Constraint-based proof takes"},
 ],[scores]);

 const debts=useMemo(()=>{
  const rows:{name:string;why:string;age:number|null;priority:"NOW"|"DUE"|"BUILD"}[]=[];
  AXES.forEach(axis=>{
   const latest=data.attempts.find(a=>a.axis===axis);
   if(!latest)rows.push({name:`${axis} baseline`,why:"No scored evidence yet",age:null,priority:"Build"});
   else if((scores[axis]||0)<70||daysSince(latest.at)!==null&&(daysSince(latest.at) as number)>10)rows.push({name:`${axis} transfer`,why:(scores[axis]||0)<70?`Current evidence ${scores[axis]}`:"Evidence is aging",age:daysSince(latest.at),priority:(scores[axis]||0)<60?"NOW":"DUE"});
  });
  if(topError)rows.push({name:`Beast repair · ${topError[0]}`,why:`Logged ${topError[1]} time${topError[1]===1?"":"s"}`,age:0,priority:"NOW"});
  if(!attemptedKeys.length)rows.push({name:"12-key transfer",why:"No key has a verified trial",age:null,priority:"Build"});
  return rows.slice(0,6);
 },[data.attempts,scores,topError,attemptedKeys.length]);

 const saveAttempt=(axis:Axis,score:number,label:string,detail:string,source:string)=>{
  const attempt:Attempt={id:uid("proof"),axis,score:clamp(Math.round(score)),label,detail,source,at:Date.now()};
  setData(previous=>({...previous,attempts:[attempt,...previous.attempts].slice(0,120)}));
 };

 const resetObjectiveQuestion=(axis:Axis)=>{
  setFeedback("");
  if(axis==="HEAR"){
   const interval=shuffle([1,2,3,4,5,6,7,8,9,10,11])[0];
   setEarInterval(interval);setEarOptions(optionsAround(interval,Array.from({length:12},(_,i)=>i)));
  }
  if(axis==="SEE"){
   const string=shuffle([0,1,2,3])[0],open=[4,9,2,7][string],target=shuffle([0,1,2,3,4,5,6,7,8,9,10,11])[0],correct=(target-open+12)%12;
   const fretPool=Array.from({length:13},(_,i)=>i);
   setSeePrompt({string,target,correct,options:optionsAround(correct,fretPool)});
  }
  if(axis==="KNOW")setKnowIndex(index=>(index+1+Math.floor(Math.random()*(KNOWLEDGE.length-1)))%KNOWLEDGE.length);
 };

 const answerObjective=(right:boolean,detail:string)=>{
  const nextCorrect=correctCount+(right?1:0);
  setFeedback(right?`CORRECT · ${detail}`:`NOT YET · ${detail}`);
  if(questionNumber>=5){
   const score=nextCorrect*20;
   saveAttempt(assessment,score,`${assessment} five-question proof`,`${nextCorrect}/5 correct · ${detail}`,assessment==="HEAR"?"Blind audio test":assessment==="SEE"?"Fretboard location test":"Harmonic decision test");
   setQuestionNumber(1);setCorrectCount(0);
   window.setTimeout(()=>resetObjectiveQuestion(assessment),500);
   return;
  }
  setCorrectCount(nextCorrect);setQuestionNumber(value=>value+1);
  window.setTimeout(()=>resetObjectiveQuestion(assessment),500);
 };

 const selectAssessment=(axis:Axis)=>{setAssessment(axis);setQuestionNumber(1);setCorrectCount(0);setFeedback("");resetObjectiveQuestion(axis)};
 const logPlayProof=()=>{if(takeMetrics)saveAttempt("PLAY",takeMetrics.playScore,"Recorded execution proof",`${takeMetrics.events} events · ${takeMetrics.meanOffset} ms mean offset · ${takeMetrics.recovered}/${takeMetrics.outside} outside recoveries`,"Listening Engine")};
 const logCreateProof=()=>{
  if(!takeMetrics)return;
  const self=Math.round(createChecks.filter(Boolean).length/5*100),audioScore=Math.round(takeMetrics.playScore*.55+takeMetrics.recovery*.45),score=Math.round(audioScore*.6+self*.4);
  saveAttempt("CREATE",score,"Constraint-based creation proof",`${createChecks.filter(Boolean).length}/5 musical criteria · ${takeMetrics.events} detected events · ${takeMetrics.recovery}% outside recovery`,"Recorded take + structured audit");
  setCreateChecks([false,false,false,false,false]);
 };

 const nextKeyQuestion=(key=selectedKey)=>{
  const interval=shuffle([1,2,3,4,5,6,7,8,9,10,11])[0],correct=(key+interval)%12;
  setKeyInterval(interval);setKeyOptions(optionsAround(correct,Array.from({length:12},(_,i)=>i)));setKeyFeedback("");
 };
 const chooseKey=(key:number)=>{setSelectedKey(key);setKeyRun({correct:0,total:0});nextKeyQuestion(key)};
 const answerKey=(note:number)=>{
  const correct=(selectedKey+keyInterval)%12,right=note===correct,nextRun={correct:keyRun.correct+(right?1:0),total:keyRun.total+1};
  setKeyFeedback(right?`CORRECT · ${DEGREES[keyInterval]} of ${NOTES[selectedKey]} is ${NOTES[correct]}.`:`NOT YET · ${DEGREES[keyInterval]} of ${NOTES[selectedKey]} is ${NOTES[correct]}.`);
  setData(previous=>{
   const keyStats=previous.keyStats.map((stat,index)=>index===selectedKey?{correct:stat.correct+(right?1:0),total:stat.total+1,lastAt:Date.now(),streak:right?stat.streak+1:0}:stat);
   let attempts=previous.attempts;
   if(nextRun.total===5){
    const score=nextRun.correct*20,attempt:Attempt={id:uid("key"),axis:"SEE",score,label:`${NOTES[selectedKey]} transfer proof`,detail:`${nextRun.correct}/5 function-to-note targets`,source:"12-key matrix",at:Date.now()};
    attempts=[attempt,...attempts].slice(0,120);
   }
   return{...previous,keyStats,attempts};
  });
  if(nextRun.total===5)setKeyRun({correct:0,total:0});else setKeyRun(nextRun);
  window.setTimeout(()=>nextKeyQuestion(),550);
 };

 const generateSession=()=>{
  const untested=AXES.filter(axis=>scores[axis]===undefined),ranked=[...AXES].sort((a,b)=>(scores[a]??-1)-(scores[b]??-1)),focus=(untested[0]||ranked[0]),secondary=(untested[1]||ranked.find(axis=>axis!==focus)||"CREATE");
  const splits=duration===12?[2,3,2,2,3]:duration===30?[4,8,6,6,6]:duration===45?[5,12,8,9,11]:duration===90?[8,23,16,18,25]:[6,15,11,12,16];
  const first=axisBlueprint(focus,splits[1],weakestKey,modeName,modeIntervals,characterInterval,courseTitle);
  const transfer=axisBlueprint("SEE",splits[2],weakestKey,modeName,modeIntervals,characterInterval,courseTitle);
  const second=axisBlueprint(secondary,splits[3],weakestKey,modeName,modeIntervals,characterInterval,courseTitle);
  const rootNote=noteAt(weakestKey,0),thirdInterval=modeIntervals.includes(3)?3:4,thirdNote=noteAt(weakestKey,thirdInterval),fifthNote=noteAt(weakestKey,7),colourNote=noteAt(weakestKey,characterInterval);
  const repairDetector={...defaultDetector(splits[0],modeIntervals,characterInterval),required:[0,thirdInterval,7],minCoverage:3,maxOutsideRate:.08,timingTolerance:135,passScore:68};
  const proveDetector={...defaultDetector(splits[4],modeIntervals,characterInterval),required:[0,characterInterval,thirdInterval],minCoverage:3,minOutside:1,requireRecovery:true,maxOutsideRate:.25,minRange:12,motifRepeats:2,timingTolerance:110,passScore:76};
  const sessionBpm=Math.round(clamp(58+(scores.PLAY??45)*.3,58,86));
  const blocks:CoachBlock[]=[
   {id:uid("block"),title:"Body reset + clean retrieval",minutes:splits[0],axis:"Repair",reason:topError?`Most frequent manual error: ${topError[0]}`:"No manual error pattern is logged; begin with a neutral control baseline",task:`Reset posture, then play ${rootNote}-${thirdNote}-${fifthNote} forward and backward without connector notes. ${topError?`Apply stop → isolate → rewind to ${topError[0]}.`:"Use the MILLPAD rule: say the function, hear it, then play it."}`,pass:`The detector hears ${repairDetector.minEvents} clean events, all three targets, ≤8% outside notes and mean placement within 135 ms. Body looseness is confirmed by your spoken self-check, not claimed as an audio measurement.`,tool:"practice",done:false,
    listenFor:[`${rootNote}, ${thirdNote} and ${fifthNote} without chromatic searching`,`Consistent quarter-note placement`,`Clean note separation and enough events to judge`,`Body comfort is prompted as a self-check only`],autoCorrection:`A missing target is named. Timing drift lowers tempo. Extra pitches reduce the loop to ${rootNote} and ${fifthNote}.`,
    steps:timeline(splits[0],[
     {cue:"Body gate",detail:"For 20 seconds: bass balanced without the fretting hand, shoulders down, thumb light, jaw unclenched. Say “ready” only when a deep breath does not move the instrument.",spoken:"Body gate. Let the bass balance itself. Drop shoulders, loosen thumb and jaw, and take one slow breath."},
     {cue:"Two-note calibration",detail:`Quarter notes at ${sessionBpm} BPM: ${rootNote} for four clicks, ${fifthNote} for four clicks. Repeat twice; release each note before the next attack.`,target:[0,7]},
     {cue:"Add quality",detail:`Play ${rootNote} → ${thirdNote} → ${fifthNote} → ${thirdNote} as quarter notes. Four loops; stop immediately after any unwanted pitch, then restart one note before it.`,target:[0,thirdInterval,7]},
     {cue:"Reverse retrieval",detail:`Play ${fifthNote} → ${thirdNote} → ${rootNote}. Alternate forward and reverse for six clean loops without changing tempo.`,target:[0,thirdInterval,7]},
     {cue:"Three clean proof loops",detail:`Forward, reverse, then forward again. No connector notes. After each loop say “loose” or “reset”; the app scores notes and time only.`,target:[0,thirdInterval,7]},
    ]),detector:repairDetector},
   {id:uid("block"),minutes:splits[1],axis:focus,reason:scores[focus]===undefined?`${focus} has no verified baseline`:`Lowest current evidence: ${focus} ${scores[focus]}`,done:false,...first},
   {id:uid("block"),...transfer,title:`${rootNote} two-register transfer`,minutes:splits[2],axis:"SEE",reason:data.keyStats[weakestKey].total?`Weakest tested key · ${Math.round(data.keyStats[weakestKey].correct/data.keyStats[weakestKey].total*100)}%`:`${rootNote} has no verified key trial`,done:false},
   {id:uid("block"),minutes:splits[3],axis:secondary,reason:scores[secondary]===undefined?`${secondary} is still untested`:`Secondary bottleneck: ${secondary} ${scores[secondary]}`,done:false,...second},
   {id:uid("block"),title:"Unedited musical proof",minutes:splits[4],axis:"Prove",reason:data.antiHabit?`Anti-habit active: ${habitRule}`:"Transfer every repair into one continuous piece",task:`One uninterrupted ${rootNote} ${modeName} take: home → motif → ${colourNote} → one deliberate departure → complete return. ${data.antiHabit?habitRule:"Leave at least one beat of silence every two bars."}`,pass:`At least ${proveDetector.minEvents} events, ${colourNote}, one recovered outside note, a repeated contour, octave range and mean placement within 110 ms. No restart.`,tool:"listen",done:false,
    listenFor:[`Home established with ${rootNote}, ${thirdNote} and ${fifthNote}`,`${colourNote} makes ${modeName} audible`,`At least one repeated three-note contour`,`Outside note reaches a stable target within 1.4 seconds`,`Range spans at least one octave`],autoCorrection:"The coach corrects one variable at a time: tempo, missing colour, motif, range or recovery. A failed proof receives one automatic 90-second repair, then the session moves on.",
    steps:timeline(splits[4],[
     {cue:"Establish home",detail:`Two bars using only ${rootNote}, ${thirdNote}, ${fifthNote} and one beat of silence per bar. No fills yet.`,target:[0,thirdInterval,7]},
     {cue:"State the motif",detail:`Choose a three-note cell containing ${colourNote}. Repeat it three times with the same rhythm; change only the ending on the fourth statement.`,target:[0,thirdInterval,characterInterval,7]},
     {cue:"Develop register",detail:"Move the motif one octave higher, answer it low, then leave one full bar of space. Preserve the original contour.",target:[0,thirdInterval,characterInterval,7]},
     {cue:"Deliberate departure",detail:`Use one chromatic note for no more than one beat. Resolve to ${rootNote}, ${thirdNote} or ${fifthNote} without losing the motif rhythm.`,target:[0,thirdInterval,7]},
     {cue:"Complete return",detail:`Return to the original register and motif, reduce density, feature ${colourNote} once, and finish on ${rootNote}. Do not restart.`,target:[0,characterInterval]},
    ]),detector:proveDetector},
  ];
  setData(previous=>({...previous,activeSession:{id:uid("session"),createdAt:Date.now(),duration,key:weakestKey,bpm:sessionBpm,blocks}}));
  setTimerRunning(false);setTimerBlock(null);setTimerSeconds(0);setTab("TODAY");
 };

 const toggleBlock=(id:string)=>setData(previous=>previous.activeSession?{...previous,activeSession:{...previous.activeSession,blocks:previous.activeSession.blocks.map(block=>block.id===id?{...block,done:!block.done}:block)}}:previous);
 const startBlockTimer=(block:CoachBlock)=>{setTimerBlock(block.id);setTimerSeconds(block.minutes*60);setTimerRunning(true)};
 const finishSession=()=>setData(previous=>{
  if(!previous.activeSession)return previous;
  const active=previous.activeSession,completed=active.blocks.filter(block=>block.done).length;
  const history:SessionHistory={id:active.id,at:Date.now(),duration:active.duration,completed,total:active.blocks.length,focus:active.blocks.filter(b=>AXES.includes(b.axis as Axis)).map(b=>b.axis).join(" + ")};
  return{...previous,activeSession:null,sessions:[history,...previous.sessions].slice(0,40)};
 });
 const session=data.activeSession,completedBlocks=session?.blocks.filter(block=>block.done).length||0;
 const formatTimer=(seconds:number)=>`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;

 const clearOutputTimers=()=>{outputTimersRef.current.forEach(timer=>window.clearTimeout(timer));outputTimersRef.current=[]};
 const closeCueAudio=()=>{const ctx=cueAudioRef.current;cueAudioRef.current=null;if(ctx&&ctx.state!=="closed")void ctx.close()};
 const startHandsFree=async()=>{
  const active=sessionRef.current;
  if(!active||runner.active)return;
  clearOutputTimers();
  callbacksRef.current.onSetRoot(active.key);
  setRunner(previous=>({...previous,active:true,session:active,phase:"preparing",blockIndex:0,secondsLeft:6,elapsed:0,tempo:active.bpm||68,cue:"Connecting the listener",detail:"Choose your clean bass input once. The complete routine will run without controls after permission is granted.",correction:"",events:0,analysis:null,results:[]}));
  try{
   const ctx=new AudioContext();cueAudioRef.current=ctx;await ctx.resume();
   speakText(`Hands free session preparing. ${active.duration} minutes in ${NOTES[active.key]}. Keep the bass in your hands.`,true);
   const started=await onStartRecording();
   if(started===false)throw new Error("Input unavailable");
   const now=performance.now();
   runnerRuntimeRef.current={session:active,phase:"countdown",blockIndex:0,stageStartedAt:now,stageDuration:6,blockStartedAt:now,tempo:active.bpm||68,lastBeat:-1,lastStep:-1,lastFeedbackAt:now,lastCorrectionAt:0,lastReferenceAt:0,referenceIndex:0,currentTarget:null,lastEventCount:0,repairUsed:false,results:[]};
   setRunner(previous=>({...previous,phase:"countdown",secondsLeft:6,cue:"Ready position",detail:"Six seconds. Set both hands, mute unused strings and wait for the first spoken cue."}));
  }catch{
   closeCueAudio();
   runnerRuntimeRef.current=null;
   setRunner(previous=>({...previous,active:false,phase:"preparing",correction:"The input could not start. Allow microphone access and select the clean audio-interface channel, then start again."}));
  }
 };
 const stopHandsFree=()=>{
  clearOutputTimers();
  stopCoachSpeech();
  if(runner.phase!=="finished")callbacksRef.current.onStopRecording();
  runnerRuntimeRef.current=null;closeCueAudio();
  setRunner(previous=>({...previous,active:false,session:null,phase:"preparing",cue:"",detail:"",correction:""}));
 };

 useEffect(()=>{
  if(!runner.active)return;
  const beginBlock=(runtime:RunnerRuntime,now:number)=>{
   const block=runtime.session.blocks[runtime.blockIndex],steps=getSteps(block);
   runtime.phase="block";runtime.stageStartedAt=now;runtime.stageDuration=block.minutes*60;runtime.blockStartedAt=now;runtime.lastBeat=-1;runtime.lastStep=0;runtime.lastFeedbackAt=now;runtime.lastCorrectionAt=0;runtime.lastReferenceAt=0;runtime.referenceIndex=0;runtime.currentTarget=null;runtime.lastEventCount=0;runtime.repairUsed=false;
   const first=steps[0];
   if(block.axis==="HEAR"&&cueAudioRef.current&&first.target?.length){runtime.currentTarget=first.target[0];runtime.referenceIndex=1;runtime.lastReferenceAt=now;playReference(cueAudioRef.current,runtime.session.key,first.target[0]);const outputTimer=window.setTimeout(()=>speakText(`Block ${runtime.blockIndex+1}. ${block.title}. ${first.spoken||"Echo that reference now."}`,true),850);outputTimersRef.current.push(outputTimer)}else speakText(`Block ${runtime.blockIndex+1}. ${block.title}. ${first.spoken||`${first.cue}. ${first.detail}`}`,true);
   setRunner(previous=>({...previous,phase:"block",blockIndex:runtime.blockIndex,secondsLeft:runtime.stageDuration,elapsed:0,tempo:runtime.tempo,cue:first.cue,detail:first.detail,correction:"Listening continuously. No buttons are required.",events:0,analysis:null,results:runtime.results}));
  };
  const finishStage=(runtime:RunnerRuntime,block:CoachBlock,analysis:BlockAnalysis,repaired:boolean,now:number)=>{
   const result:RunnerResult={blockId:block.id,title:block.title,score:analysis.score,pass:analysis.pass,repaired,detail:`${analysis.events} events · ${analysis.timing} ms · ${analysis.inside}% inside · ${analysis.recovery}% recovery`};
   runtime.results=[...runtime.results,result];
   const isLast=runtime.blockIndex===runtime.session.blocks.length-1;
   setData(previous=>{
    const active=previous.activeSession;
    const blocks=active?.blocks.map(item=>item.id===block.id?{...item,done:analysis.pass}:item)||[];
    let attempts=previous.attempts;
    const proofAxis=AXES.includes(block.axis as Axis)?block.axis as Axis:block.axis==="PROVE"?"Create":null;
    if(proofAxis){
     const attempt:Attempt={id:uid("handsfree"),axis:proofAxis,score:analysis.score,label:`Hands-free · ${block.title}`,detail:result.detail,source:repaired?"Listening coach · repair pass":"Listening coach · continuous pass",at:Date.now()};
     attempts=[attempt,...attempts].slice(0,120);
    }
    if(isLast){
     const completed=runtime.results.filter(item=>item.pass).length;
     const history:SessionHistory={id:runtime.session.id,at:Date.now(),duration:runtime.session.duration,completed,total:runtime.session.blocks.length,focus:runtime.session.blocks.filter(item=>AXES.includes(item.axis as Axis)).map(item=>item.axis).join(" + ")};
     return{...previous,attempts,activeSession:null,sessions:[history,...previous.sessions].slice(0,40)};
    }
    return{...previous,attempts,activeSession:active?{...active,blocks}:active};
   });
   if(isLast){
    runtime.phase="finished";
    callbacksRef.current.onStopRecording();
    clearOutputTimers();closeCueAudio();
    const passed=runtime.results.filter(item=>item.pass).length;
    speakText(`Session complete. ${passed} of ${runtime.session.blocks.length} blocks passed. Your take and corrections have been stored.`,true);
    setRunner(previous=>({...previous,phase:"finished",secondsLeft:0,elapsed:runtime.session.duration*60,cue:"Session complete",detail:`${passed} of ${runtime.session.blocks.length} blocks met the listening standard.`,correction:analysis.pass?"The final proof passed.":`Final priority for next time: ${analysis.issue}`,events:analysis.events,analysis,results:runtime.results}));
    return;
   }
   runtime.blockIndex+=1;runtime.phase="transition";runtime.stageStartedAt=now;runtime.stageDuration=6;runtime.lastBeat=-1;runtime.lastStep=-1;runtime.lastFeedbackAt=now;runtime.lastReferenceAt=0;runtime.referenceIndex=0;runtime.currentTarget=null;runtime.repairUsed=false;
   const next=runtime.session.blocks[runtime.blockIndex];
   speakText(`${analysis.pass?`Block passed at ${analysis.score}`:`Block recorded at ${analysis.score}`}. Release both hands. ${next.title} begins in six seconds.`,true);
   setRunner(previous=>({...previous,phase:"transition",blockIndex:runtime.blockIndex,secondsLeft:6,elapsed:0,tempo:runtime.tempo,cue:analysis.pass?"Block passed":"Block recorded · continuing",detail:`Next: ${next.title}. Reset both hands; the coach will start it automatically.`,correction:analysis.pass?"No repair needed.":analysis.correction,events:analysis.events,analysis,results:runtime.results}));
  };
  const timer=window.setInterval(()=>{
   const runtime=runnerRuntimeRef.current,ctx=cueAudioRef.current;
   if(!runtime||runtime.phase==="finished")return;
   const now=performance.now();
   if(runtime.phase==="countdown"){
    const remaining=Math.max(0,Math.ceil(runtime.stageDuration-(now-runtime.stageStartedAt)/1000));
    if(remaining<=4&&remaining!==runtime.lastBeat){runtime.lastBeat=remaining;if(remaining>0)speakText(String(remaining),true)}
    setRunner(previous=>({...previous,secondsLeft:remaining}));
    if(remaining===0)beginBlock(runtime,now);
    return;
   }
   if(runtime.phase==="transition"){
    const remaining=Math.max(0,Math.ceil(runtime.stageDuration-(now-runtime.stageStartedAt)/1000));
    if(remaining<=3&&remaining!==runtime.lastBeat){runtime.lastBeat=remaining;if(remaining>0)speakText(String(remaining),true)}
    setRunner(previous=>({...previous,secondsLeft:remaining}));
    if(remaining===0)beginBlock(runtime,now);
    return;
   }
   const block=runtime.session.blocks[runtime.blockIndex];
   const elapsed=Math.max(0,(now-runtime.stageStartedAt)/1000),remaining=Math.max(0,Math.ceil(runtime.stageDuration-elapsed));
   const beatLength=60/runtime.tempo,beatIndex=Math.floor(elapsed/beatLength);
   if(ctx&&beatIndex!==runtime.lastBeat){runtime.lastBeat=beatIndex;playCoachBeat(ctx,beatIndex%4===0,runtime.session.key)}
   const blockEvents=liveEventsRef.current.filter(event=>event.midi>=28&&event.midi<=67&&event.start>=runtime.blockStartedAt);
   if(runtime.phase==="block"){
    const steps=getSteps(block);let stepIndex=0;
    steps.forEach((step,index)=>{if(elapsed>=step.at)stepIndex=index});
    const step=steps[stepIndex];
    if(stepIndex!==runtime.lastStep){
     runtime.lastStep=stepIndex;
     if(block.axis==="HEAR"&&ctx&&step.target?.length){
      runtime.currentTarget=step.target[0];runtime.referenceIndex=1;runtime.lastReferenceAt=now;playReference(ctx,runtime.session.key,step.target[0]);
      const outputTimer=window.setTimeout(()=>speakText(step.spoken||"Echo that reference now.",true),850);outputTimersRef.current.push(outputTimer);
     }else{runtime.currentTarget=null;speakText(step.spoken||`${step.cue}. ${step.detail}`,true)}
    }
    if(block.axis==="HEAR"&&ctx&&step.target?.length&&now-runtime.lastReferenceAt>=9000){
     const target=step.target[runtime.referenceIndex%step.target.length];runtime.currentTarget=target;runtime.referenceIndex+=1;runtime.lastReferenceAt=now;playReference(ctx,runtime.session.key,target);
     const outputTimer=window.setTimeout(()=>speakText("Echo the reference now. One clear note, then wait.",true),850);outputTimersRef.current.push(outputTimer);
    }
    const latest=blockEvents[blockEvents.length-1];
    if(latest&&blockEvents.length>runtime.lastEventCount){
     runtime.lastEventCount=blockEvents.length;
     if(step.target?.length&&(block.axis==="HEAR"||block.axis==="SEE"||block.axis==="REPAIR")&&now-runtime.lastCorrectionAt>5500){
      const expected=block.axis==="HEAR"&&runtime.currentTarget!==null?[runtime.currentTarget]:step.target;
      const targetPcs=expected.map(interval=>(runtime.session.key+interval)%12);
      if(!targetPcs.includes(pc(latest.midi))){
       runtime.lastCorrectionAt=now;
       const correction=`I heard ${NOTES[pc(latest.midi)]}. This phase wants ${targetPcs.map(note=>NOTES[note]).join(" or ")}. Pause one beat and answer cleanly.`;
       speakText(correction,true);
       setRunner(previous=>({...previous,correction}));
      }
     }
    }
    const feedbackEvery=Math.min(45,Math.max(25,runtime.stageDuration/4));
    if(elapsed>=20&&now-runtime.lastFeedbackAt>=feedbackEvery*1000){
     runtime.lastFeedbackAt=now;
     const factor=Math.max(.2,Math.min(1,elapsed/runtime.stageDuration));
     const fullDetector=getDetector(block,modeIntervals,characterInterval),phaseTargets=step.target?.length?step.target:fullDetector.required;
     const phaseBlock={...block,detector:{...fullDetector,required:phaseTargets,minCoverage:phaseTargets.length}};
     const analysis=analyzeEvents(phaseBlock,liveEventsRef.current,runtime.session.key,runtime.tempo,runtime.blockStartedAt,modeIntervals,characterInterval,factor);
     let correction=analysis.correction;
     if(analysis.events>=6&&analysis.timing>getDetector(block,modeIntervals,characterInterval).timingTolerance&&runtime.tempo>48){
      runtime.tempo=Math.max(48,runtime.tempo-6);correction=`Tempo reduced to ${runtime.tempo} B P M. ${analysis.correction}`;
     }
     speakText(analysis.pass?`Good. ${analysis.events} clear events. Keep the same pulse and pitch set.`:`Correction. ${correction}`,true);
     setRunner(previous=>({...previous,tempo:runtime.tempo,correction,analysis,events:analysis.events}));
    }
   }else if(now-runtime.lastFeedbackAt>=30000){
    runtime.lastFeedbackAt=now;
    const factor=Math.max(.25,Math.min(1,elapsed/runtime.stageDuration));
    const analysis=analyzeEvents(block,liveEventsRef.current,runtime.session.key,runtime.tempo,runtime.blockStartedAt,modeIntervals,characterInterval,factor);
    speakText(analysis.pass?"Repair is now meeting the target. Keep it simple until time expires.":analysis.correction,true);
    setRunner(previous=>({...previous,correction:analysis.correction,analysis,events:analysis.events}));
   }
   const currentStep=runtime.phase==="block"?getSteps(block)[Math.max(0,runtime.lastStep)]:null;
   setRunner(previous=>({...previous,phase:runtime.phase,blockIndex:runtime.blockIndex,secondsLeft:remaining,elapsed:Math.floor(elapsed),tempo:runtime.tempo,cue:runtime.phase==="repair"?"Automatic 90-second repair":currentStep?.cue||previous.cue,detail:runtime.phase==="repair"?previous.correction:currentStep?.detail||previous.detail,events:blockEvents.length,results:runtime.results}));
   if(remaining>0)return;
   const expectedFactor=runtime.phase==="repair"?Math.min(1,90/(block.minutes*60)):1;
   const analysis=analyzeEvents(block,liveEventsRef.current,runtime.session.key,runtime.tempo,runtime.blockStartedAt,modeIntervals,characterInterval,expectedFactor);
   if(runtime.phase==="block"&&!analysis.pass&&!runtime.repairUsed){
    runtime.phase="repair";runtime.repairUsed=true;runtime.stageStartedAt=now;runtime.stageDuration=90;runtime.blockStartedAt=now;runtime.lastBeat=-1;runtime.lastStep=-1;runtime.lastFeedbackAt=now;runtime.lastReferenceAt=0;runtime.referenceIndex=0;runtime.currentTarget=null;runtime.lastEventCount=0;runtime.tempo=Math.max(48,runtime.tempo-6);
    speakText(`Block score ${analysis.score}. Automatic repair begins now for ninety seconds. ${analysis.correction}`,true);
    setRunner(previous=>({...previous,phase:"repair",secondsLeft:90,elapsed:0,tempo:runtime.tempo,cue:"Automatic 90-second repair",detail:analysis.correction,correction:analysis.correction,events:0,analysis}));
    return;
   }
   finishStage(runtime,block,analysis,runtime.phase==="repair",now);
  },250);
  return()=>window.clearInterval(timer);
 },[runner.active,modeIntervals,characterInterval]);

 const runnerSession=runner.session||session;
 const runnerBlock=runnerSession?.blocks[Math.min(runner.blockIndex,Math.max(0,(runnerSession?.blocks.length||1)-1))];
 const runnerProgress=runner.phase==="finished"?100:runnerSession?Math.round((runner.blockIndex+(runnerBlock&&runner.phase==="block"?Math.min(1,runner.elapsed/(runnerBlock.minutes*60)):0))/runnerSession.blocks.length*100):0;

 return <div className="coachScreen osScreen">
  <header className="coachHero">
   <div><h1 data-page-heading tabIndex={-1}>Play the bass.<br/><em>The coach runs itself.</em></h1><p>Press Start once. Spoken cues, click, reference tones, continuous note detection, automatic tempo changes, corrective repair loops and block transitions continue until the routine is finished.</p></div>
   <aside><small>Player state</small><b>{overall===null?`${scoredAxes.length}/5`:overall}</b><span>{overall===null?"Axes verified":"Evidence score"}</span><p>{overall===null?`${5-scoredAxes.length} baseline${5-scoredAxes.length===1?"":"s"} still need proof.`:`Current stage · ${masteryLabel(overall)}`}</p><button onClick={()=>setTab("ASSESS")}>{overall===null?"Continue baseline":"Retest a skill"}</button></aside>
  </header>
  <nav className="coachTabs" aria-label="Adaptive coach sections">{(["TODAY","ASSESS","EVIDENCE","HISTORY"] as CoachTab[]).map(name=><button className={tab===name?"active":""} onClick={()=>setTab(name)} key={name}>{name}</button>)}</nav>

  {tab==="TODAY"&&<section className="coachToday">
   <div className="coachControlStrip"><div><small>Session length</small><div>{[12,30,45,60,90].map(value=><button className={duration===value?"active":""} onClick={()=>setDuration(value)} key={value}>{value} MIN</button>)}</div></div><article><small>Next-session logic</small><p>Untested axis → weakest verified axis → weakest key → Beast repair → unedited musical proof.</p></article><button onClick={generateSession}>{session?"Rebuild from latest evidence":"Generate from evidence"}</button></div>
   {!session?<div className="coachEmpty"><h2>Prove something first, or let untested skills lead.</h2><p>The generator will never pretend that missing data is a weakness. It schedules a baseline when evidence is absent and repair work when evidence is low.</p><button onClick={generateSession}>BUILD {duration}-MINUTE SESSION</button></div>:<>
    <div className="sessionEvidenceHead"><div><h2>{NOTES[session.key]} transfer with {session.blocks[1].axis} priority.</h2><p>Generated {formatDate(session.createdAt)}. Every block now contains timed instructions, measurable listening targets and its automatic correction rule.</p></div><div><b>{completedBlocks}/{session.blocks.length}</b><span>Blocks passed</span><i><em style={{width:`${completedBlocks/session.blocks.length*100}%`}}/></i></div></div>
    <section className="handsFreeLaunch"><header><h2>The coach listens, speaks, waits, corrects and advances.</h2><p>It starts the microphone once, gives every cue aloud, runs click and reference tones, scores continuously, lowers tempo when timing drifts and inserts one 90-second repair when a block misses its target.</p></header><div className="handsFreeFacts"><div><b>01</b><span>Continuous input<small>Pitch · octave · onset · duration</small></span></div><div><b>02</b><span>Spoken timeline<small>No timer or Next buttons</small></span></div><div><b>03</b><span>Live correction<small>Exact note or timing repair</small></span></div><div><b>04</b><span>Auto-advance<small>Pass, repair, continue, store</small></span></div></div><aside><p><b>Input setup</b> Use headphones and a clean DI/audio-interface signal. Speaker audio can leak reference tones or speech into the mic. Monophonic playing and clean muting give the most reliable detection.</p><button onClick={startHandsFree} disabled={runner.active}>{listening?"Start hands-free session":"Connect input + start hands-free"}</button></aside></section>
    <div className="coachBlocks">{session.blocks.map((block,index)=>{const steps=getSteps(block);return <article className={`${block.done?"done":""} ${timerBlock===block.id?"timing":""}`} key={block.id}><header><i>{block.done?"✓":String(index+1).padStart(2,"0")}</i><div><small>{block.axis} · {block.minutes} MIN · AUTO-COACHED</small><h3>{block.title}</h3></div><b>{timerBlock===block.id?formatTimer(timerSeconds):`${block.minutes}:00`}</b></header><dl><div><dt>Why now</dt><dd>{block.reason}</dd></div><div><dt>Exact task</dt><dd>{block.task}</dd></div><div><dt>Pass</dt><dd>{block.pass}</dd></div></dl><section className="exerciseTimeline"><header><span>Minute-by-minute routine</span><small>The cue is spoken at each timestamp</small></header>{steps.map((step,stepIndex)=><div key={`${block.id}-${step.at}-${step.cue}`}><time>{timeLabel(step.at)}</time><i>{String(stepIndex+1).padStart(2,"0")}</i><p><b>{step.cue}</b><span>{step.detail}</span></p></div>)}</section><div className="listenGrid"><section><span>The app listens for</span>{(block.listenFor||["Required pitch classes","Timing against the click","Enough clean note events","Stable endings"]).map(item=><p key={item}>✓ {item}</p>)}</section><section><span>If it hears a problem</span><p>{block.autoCorrection||"It names the missing target, simplifies the pitch set and lowers tempo when timing is outside tolerance."}</p></section></div><footer><button onClick={()=>block.tool==="coach"?setTab("EVIDENCE"):onOpen(block.tool)}>Open workspace</button><button onClick={()=>timerBlock===block.id?setTimerRunning(value=>!value):startBlockTimer(block)}>{timerBlock===block.id?(timerRunning?"Pause timer":"Resume timer"):"Manual timer"}</button><button className={block.done?"passed":""} onClick={()=>toggleBlock(block.id)}>{block.done?"PASSED ✓":"Manual pass"}</button></footer></article>})}</div>
    <div className="sessionFinish"><div><span>Manual fallback</span><p>The hands-free runner stores the result automatically. These controls remain only for silent/manual practice outside the automated routine.</p></div><button disabled={completedBlocks!==session.blocks.length} onClick={finishSession}>Finish manual session</button></div>
   </>}
  </section>}

  {tab==="ASSESS"&&<section className="coachAssess">
   <header><div><h2>Test the skill, not your confidence.</h2><p>HEAR, SEE and KNOW use scored questions. PLAY uses detected note events. CREATE blends the recording with a strict musical audit.</p></div><div className="axisPicker">{AXES.map(axis=><button className={assessment===axis?"active":""} onClick={()=>selectAssessment(axis)} key={axis}><b>{scores[axis]??"-"}</b><span>{axis}</span><small>{masteryLabel(scores[axis])}</small></button>)}</div></header>
   <div className="assessmentStage">
    <div className="assessmentMeta"><span>{assessment} PROOF</span><b>{assessment==="PLAY"||assessment==="CREATE"?take.length:`${questionNumber}/5`}</b><small>{assessment==="PLAY"||assessment==="CREATE"?"Detected events":"Question"}</small></div>
    {assessment==="HEAR"&&<article><h2>Which function did you hear above {NOTES[root]}?</h2><p>Listen first. Do not use the fretboard. Name the interval before checking the pitch.</p><button className="hearPrompt" onClick={()=>onAudition([root,(root+earInterval)%12,root])}>▶ HEAR QUESTION</button><div className="answerGrid">{earOptions.map(interval=><button onClick={()=>answerObjective(interval===earInterval,`${DEGREES[earInterval]} above ${NOTES[root]} is ${NOTES[(root+earInterval)%12]}.`)} key={interval}>{DEGREES[interval]}</button>)}</div></article>}
    {assessment==="SEE"&&<article><h2>Where is {NOTES[seePrompt.target]} on the {["E","A","D","G"][seePrompt.string]} string?</h2><p>Choose the first occurrence from open string through fret 12. Answer within two seconds, then verify on bass.</p><div className="answerGrid fretAnswers">{seePrompt.options.map(fret=><button onClick={()=>answerObjective(fret===seePrompt.correct,`${NOTES[seePrompt.target]} is fret ${seePrompt.correct} on the ${["E","A","D","G"][seePrompt.string]} string.`)} key={fret}>FRET {fret}</button>)}</div></article>}
    {assessment==="KNOW"&&<article><h2>{KNOWLEDGE[knowIndex].q}</h2><p>Choose the explanation that would let you predict the result in another key.</p><div className="answerGrid knowledgeAnswers">{KNOWLEDGE[knowIndex].o.map((option,index)=><button onClick={()=>answerObjective(index===KNOWLEDGE[knowIndex].a,KNOWLEDGE[knowIndex].o[KNOWLEDGE[knowIndex].a])} key={option}>{option}</button>)}</div></article>}
    {assessment==="PLAY"&&<article><h2>{takeMetrics?`${takeMetrics.playScore}/100 from detected events.`:"A recording is required."}</h2>{takeMetrics?<><div className="metricGrid"><div><b>{takeMetrics.events}</b><span>Events</span></div><div><b>{takeMetrics.meanOffset}ms</b><span>Mean offset</span></div><div><b>{takeMetrics.recovered}/{takeMetrics.outside}</b><span>Recoveries</span></div><div><b>{takeMetrics.timing}</b><span>Time score</span></div></div><p>The score combines timing stability, deliberate outside recovery and enough detected material to judge a real phrase.</p><button className="coachPrimary" onClick={logPlayProof}>Log this take as play proof</button></>:<><p>Open the Listening Engine, record at least 16 clear monophonic events, include one deliberate outside note and finish the take.</p><button className="coachPrimary" onClick={()=>onOpen("listen")}>Open listening engine</button></>}</article>}
    {assessment==="CREATE"&&<article><h2>{takeMetrics?"Audit the music, not the intention.":"Record an unedited creation proof."}</h2>{takeMetrics?<><div className="creationAudit">{["Home is audible before departure","One motif survives at least three transformations","Outside material has a planned duration","The pocket survives the harder pitch language","Harmony, rhythm and register return together"].map((label,index)=><label key={label}><input type="checkbox" checked={createChecks[index]} onChange={()=>setCreateChecks(values=>values.map((value,i)=>i===index?!value:value))}/><i>{createChecks[index]?"✓":"·"}</i><span>{label}</span></label>)}</div><p>Recorded event evidence provides 60% of the result. This structured audit provides 40%; unchecked claims receive no credit.</p><button className="coachPrimary" onClick={logCreateProof}>Log creation proof</button></>:<><p>Use the Listening Engine’s boss fight: establish home, develop one motif, leave by a named device, create a unique climax and return completely.</p><button className="coachPrimary" onClick={()=>onOpen("listen")}>Record creation take</button></>}</article>}
    {feedback&&<p className={`assessmentFeedback ${feedback.startsWith("CORRECT")?"correct":""}`}>{feedback}</p>}
   </div>
  </section>}

  {tab==="EVIDENCE"&&<section className="coachEvidence">
   <div className="evidenceSummary"><article><span>Verified freedom axes</span><div>{AXES.map(axis=><div key={axis}><b>{scores[axis]??"-"}</b><small>{axis}</small><i><em style={{width:`${scores[axis]||0}%`}}/></i><span>{data.attempts.filter(a=>a.axis===axis).length} proof{data.attempts.filter(a=>a.axis===axis).length===1?"":"s"}</span></div>)}</div></article><aside><span>Connected evidence</span><dl><div><dt>Course</dt><dd>{courseCompleted}/{courseTotal} lessons passed</dd></div><div><dt>Beast</dt><dd>{external.beastDays}/30 days · {external.beastLogs} logs</dd></div><div><dt>Last take</dt><dd>{take.length} detected events</dd></div><div><dt>Assessments</dt><dd>{data.attempts.length} stored proofs</dd></div></dl></aside></div>
   <div className="evidenceGrid"><article className="debtBoard"><span>Practice debt · calculated</span>{debts.length?debts.map(row=><div key={row.name}><b className={row.priority.toLowerCase()}>{row.priority}</b><p><strong>{row.name}</strong><small>{row.why}</small></p><em>{row.age===null?"Untested":row.age===0?"Current":`${row.age}D AGO`}</em></div>):<p className="clearDebt">No urgent debt. Retest the oldest verified skill.</p>}</article><article className="masteryBoard"><span>Mastery ladder · from proof</span>{mastery.map(item=><div key={item.name}><p><b>{item.name}</b><small>{item.source}</small></p><i><em style={{width:`${item.score||0}%`}}/></i><strong>{masteryLabel(item.score)}</strong></div>)}</article></div>
   <section className="keyEvidence"><header><div><h2>Each number must be earned.</h2><p>Select a key and answer five function-to-note prompts. Untested keys remain blank instead of inheriting a fabricated score.</p></div><div><b>{keyRun.correct}/{keyRun.total}</b><small>Current run</small></div></header><div className="earnedKeyMatrix">{NOTES.map((note,index)=>{const stat=data.keyStats[index],score=stat.total?Math.round(stat.correct/stat.total*100):null;return <button className={selectedKey===index?"active":""} onClick={()=>chooseKey(index)} key={note}><b>{note}</b><span>{score??"-"}</span><small>{stat.total?`${stat.total} TRIALS`:"Untested"}</small></button>})}</div><div className="keyChallenge"><article><small>Selected key</small><b>{NOTES[selectedKey]}</b><span>{data.keyStats[selectedKey].total?`${Math.round(data.keyStats[selectedKey].correct/data.keyStats[selectedKey].total*100)}% verified`:"No evidence yet"}</span></article><div><h3>What is {DEGREES[keyInterval]} of {NOTES[selectedKey]}?</h3><div>{keyOptions.map(note=><button onClick={()=>answerKey(note)} key={note}>{NOTES[note]}</button>)}</div>{keyFeedback&&<p>{keyFeedback}</p>}</div></div></section>
   <section className="habitEvidence"><div><h2>{takeMetrics?"Patterns detected from the latest take.":"No habit claims without a take."}</h2>{takeMetrics?<div>{habitMetrics.map(metric=><article key={metric.label}><b>{metric.value}%</b><span>{metric.label}</span><i><em style={{width:metric.value+"%"}}/></i></article>)}</div>:<p>Record at least 16 events. The coach will measure phrase starts, contour, metric placement, silence and recovery.</p>}</div><aside><span>Anti-habit prescription</span><p>{habitRule}</p><label><input type="checkbox" checked={data.antiHabit} onChange={event=>setData(previous=>({...previous,antiHabit:event.target.checked}))}/><i/><b>{data.antiHabit?"Active in next session":"Activate"}</b></label></aside></section>
  </section>}

  {tab==="HISTORY"&&<section className="coachHistory">
   <header><h2>A trail you can challenge.</h2><p>Every score names its source and date. Newer evidence has more weight, but older attempts stay visible.</p></header>
   <div className="historyGrid"><article><span>Assessment attempts</span>{data.attempts.length?data.attempts.map(attempt=><div key={attempt.id}><b className={`axis-${attempt.axis.toLowerCase()}`}>{attempt.score}</b><p><strong>{attempt.label}</strong><small>{attempt.detail}</small></p><em>{attempt.source}<small>{formatDate(attempt.at)}</small></em></div>):<p className="emptyLedger">No attempts stored. Begin in Assess.</p>}</article><article><span>Practice sessions</span>{data.sessions.length?data.sessions.map(sessionRow=><div key={sessionRow.id}><b>{sessionRow.completed}/{sessionRow.total}</b><p><strong>{sessionRow.duration}-minute session</strong><small>{sessionRow.focus||"Integrated practice"}</small></p><em>{sessionRow.completed===sessionRow.total?"Completed":"Partial"}<small>{formatDate(sessionRow.at)}</small></em></div>):<p className="emptyLedger">No generated session has been finished yet.</p>}</article></div>
  </section>}
  {runner.active&&runnerSession&&runnerBlock&&<section className={`handsFreeRunner ${runner.phase}`} role="dialog" aria-modal="true" aria-label="Hands-free practice runner">
   <header><div><span>HANDS-FREE PRACTICE · {NOTES[runnerSession.key]} {modeName}</span><b>{runner.phase==="preparing"?"Preparing input":runner.phase==="countdown"?"Starting":runner.phase==="transition"?"Reset between blocks":runner.phase==="repair"?"Automatic repair":runner.phase==="finished"?"Routine complete":"Listening + coaching"}</b></div><div className="runnerInput"><i className={listening?"online":""}/><span>{recording?"Take recording":listening?"Input listening":"Waiting for input"}<small>{livePitch?`${livePitch.n}${livePitch.oct} · ${Math.round(livePitch.hz)} Hz · ${livePitch.cents>=0?"+":""}${livePitch.cents}¢`:"Play one clear bass note"}</small></span></div>{runner.phase!=="finished"?<button onClick={stopHandsFree}>■ EMERGENCY STOP</button>:<button onClick={stopHandsFree}>Return to coach</button>}</header>
   <div className="runnerProgress"><i><em style={{width:`${runnerProgress}%`}}/></i><span>BLOCK {Math.min(runner.blockIndex+1,runnerSession.blocks.length)} / {runnerSession.blocks.length}</span><b>{runnerProgress}% SESSION</b></div>
   <main><aside><span>Time remaining</span><b>{formatTimer(runner.secondsLeft)}</b><small>{runner.phase==="repair"?"Repair extension":`${runner.tempo} BPM · CLICK + ROOT ON BEAT 1`}</small><div><span>Detected now</span><strong>{livePitch?`${livePitch.n}${livePitch.oct}`:"-"}</strong></div><div><span>Events this block</span><strong>{runner.events}</strong></div></aside><article><h1>{runner.cue}</h1><p>{runner.detail}</p><section className="runnerCorrection"><small>{runner.analysis?.pass?"Coach status · on target":"Live coach"}</small><b>{runner.correction||"Listening. Keep playing until the next spoken cue."}</b></section>{runner.analysis&&<div className="runnerMetrics"><div><b>{runner.analysis.score}</b><span>Live score</span></div><div><b>{runner.analysis.timing>=999?"-":`${runner.analysis.timing}ms`}</b><span>Grid offset</span></div><div><b>{runner.analysis.coverage}%</b><span>Target coverage</span></div><div><b>{runner.analysis.recovery}%</b><span>Recovery</span></div></div>}</article></main>
   <footer><span>Keep both hands on the bass</span><p>The next cue, correction, tempo change, repair and block transition happen automatically. Only Emergency Stop interrupts the routine.</p><div>{runner.results.map(result=><i className={result.pass?"passed":""} key={result.blockId}>{result.pass?"✓":"·"} {result.score}</i>)}{runnerSession.blocks.slice(runner.results.length).map(block=><i key={block.id}>·</i>)}</div></footer>
  </section>}
 </div>;
}

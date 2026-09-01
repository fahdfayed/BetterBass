import {lazy,Suspense,useEffect,useMemo,useRef,useState} from "react";
import {fadeAndClose,startAudioClock,type AudioClock} from "./audio-clock";
import AppShell from "./components/AppShell";
import Home from "./views/Home";
import WorldMap from "./views/WorldMap";
const TabStudio=lazy(()=>import("./tab/TabStudio"));
const JacoMasterclass=lazy(()=>import("./views/JacoMasterclass"));
import ThemeToggle from "./components/ThemeToggle";
import CourseLibrary from "./views/CourseLibrary";
import LessonWorkspace from "./views/LessonWorkspace";
import LessonTools,{WORKSPACE_LABELS} from "./views/LessonTools";
import PacedReader from "./views/PacedReader";
import ChromaticGym from "./views/ChromaticGym";
import TechniqueLab from "./views/TechniqueLab";
import NoteQuest from "./views/NoteQuest";
import ToolLibrary from "./views/ToolLibrary";
import CourseProgress from "./views/CourseProgress";
import TodaySession from "./views/TodaySession";
import RescueGames from "./views/RescueGames";
import LiveSession from "./views/LiveSession";
import ImprovisationLab from "./views/ImprovisationLab";
import AdaptivePlan from "./views/AdaptivePlan";
import BackingBand from "./views/BackingBand";
import ListeningEngine from "./views/ListeningEngine";
import ProgressionAnalyser from "./views/ProgressionAnalyser";
import {territoryStates} from "./game/progression";
import {MODES} from "./harmony-fretboard-data";
import Formula from "./components/Formula";
import {degreeAt,SHORT_NAMES as DEG} from "./theory/degrees";
import {goToView,navigate,pathForView,useRoute} from "./router";
import {autoCorrelate,centsToNote,createPitchTracker,labelFor,midiHz,NOTE_NAMES,PITCH_MAX_HZ,PITCH_MIN_HZ,PITCH_RMS_GATE,tensionFor,type Harmony,type NoteEvent} from "./pitch";
import {COURSE_LESSONS,COURSE_UNITS} from "./course-data";
import {lessonContext} from "./course-context";
import {LESSON_DETAILS} from "./course-details";
import {LEARNING_STATE_EVENT,saveLearningState} from "./learning-storage";
import VoiceControl from "./VoiceControl";

const BeastPractice=lazy(()=>import("./BeastPractice"));
const PerformanceCoach=lazy(()=>import("./PerformanceCoach"));
const MaqamLab=lazy(()=>import("./MaqamLab"));
const SlapLab=lazy(()=>import("./SlapLab"));
const HarmonyFretboard=lazy(()=>import("./HarmonyFretboard"));
const TheoryReference=lazy(()=>import("./TheoryReference"));

const N=NOTE_NAMES;
const STRINGS=[{name:"E",open:4},{name:"A",open:9},{name:"D",open:2},{name:"G",open:7}];
function courseRole(iv:number,character:number[]){if(iv===0)return "TONAL ANCHOR";if(character.includes(iv))return "DEFINING COLOUR";if(iv===3||iv===4)return "QUALITY TONE";if(iv===10||iv===11)return "CHORD FAMILY / DIRECTION";if(iv===7)return "STABLE SUPPORT";if(iv===1||iv===6||iv===8)return "ACTIVE TENSION";return "MODAL COLOUR / PATH"}
function courseBehavior(iv:number,character:number[]){if(iv===0)return "Rest, repeat or receive the final resolution.";if(character.includes(iv))return "Expose against home; repeat selectively so its identity is heard.";if(iv===3||iv===4)return "State major or minor quality before adding decoration.";if(iv===10)return "Define the seventh-chord family; often descend or return to 1.";if(iv===11)return "Hear strong semitone pull upward into 1.";if(iv===7)return "Stabilize the line without defining major or minor by itself.";if(iv===1)return "Very exposed above home; duration and destination must be deliberate.";if(iv===6)return "Tritone pressure; context decides colour versus outside tension.";return "Connect structural tones, colour the harmony or develop a motif."}
function fretLabel(pc:number,open:number){const fret=(pc-open+12)%12;return fret===0?"Open / 12":String(fret)}
const sessions=[{m:8,t:"Ear calibration",d:"Drone degree: inside / outside → name function",tag:"Hear"},{m:12,t:"Dorian colour control",d:"Feature 6 twice without running the scale",tag:"Create"},{m:15,t:"Chromatic approaches",d:"Approach 1, ♭3, 5 and ♭7 from both sides",tag:"Know"},{m:10,t:"Side-slip mission",d:"One beat +1 semitone; return on a strong beat",tag:"Play"},{m:10,t:"Free jam",d:"Build low → tension → climax → home",tag:"Create"},{m:5,t:"Recorded jury",d:"No diagrams. Label every departure afterward",tag:"Prove"}];
const NAV_GROUPS=[
 {label:"Learn",items:[{id:"course",icon:"home",label:"Home"},{id:"roadmap",icon:"course",label:"Full course"}]},
 {label:"Practice",items:[{id:"practice",icon:"practice",label:"Practice studio"},{id:"coach",icon:"coach",label:"Live coach"}]},
 {label:"Specialties",items:[{id:"maqam",icon:"maqam",label:"Arabic maqam"},{id:"slap",icon:"slap",label:"Slap bass"}]},
 {label:"Your space",items:[{id:"tools",icon:"library",label:"Tool library"},{id:"courseProgress",icon:"progress",label:"Progress"}]},
];
const VIEW_META:Record<string,{eyebrow:string,title:string}>={
 course:{eyebrow:"Your learning path",title:"Home"},courseLesson:{eyebrow:"Guided course",title:"Current lesson"},roadmap:{eyebrow:"28-LESSON CURRICULUM",title:"Full course"},
 practice:{eyebrow:"Hands-free training",title:"Practice studio"},coach:{eyebrow:"Listening + feedback",title:"Live coach"},maqam:{eyebrow:"Arabic music",title:"Maqam lab"},slap:{eyebrow:"Technique + groove",title:"Slap bass"},
 tools:{eyebrow:"All existing tools",title:"Tool library"},courseProgress:{eyebrow:"Your development",title:"Progress"},fret:{eyebrow:"Harmony tool",title:"Fretboard map"},runtime:{eyebrow:"Play with a band",title:"Backing band"},
 engine:{eyebrow:"Record + understand",title:"Take analysis"},advanced:{eyebrow:"Controlled tension",title:"Improvisation lab"},chromatic:{eyebrow:"Approach and arrive",title:"Chromatic gym"},technique:{eyebrow:"Before the notes",title:"The hands"},quest:{eyebrow:"Play it to pass it",title:"The long way home"},reference:{eyebrow:"Look something up",title:"Theory reference"},adaptive:{eyebrow:"Personal curriculum",title:"Adaptive plan"},
 progression:{eyebrow:"Read a progression",title:"Progression reader"},
 today:{eyebrow:"Today's training",title:"Practice plan"},live:{eyebrow:"Real-time practice",title:"Live session"},games:{eyebrow:"Ear + fretboard",title:"Training games"},
};
const NAV_ACTIVE:Record<string,string[]>={course:["course"],roadmap:["roadmap","courseLesson"],practice:["practice","today","live"],coach:["coach","adaptive"],maqam:["maqam"],slap:["slap"],tools:["tools","fret","runtime","engine","advanced","reference","games","progression"],courseProgress:["courseProgress"]};

function ToolLoading(){return <div className="toolLoading" role="status"><i/><span>Opening your workspace…</span></div>}
const outsideLevels=["Chromatic approach","Two-note enclosure","Chromatic passing run","½-beat side-slip","Two-beat side-slip","Outside motif","Semitone sequence","Outside pentatonic","Superimposed triad","Free controlled phrase"];
let eventSequence=0;
const eventId=()=>++eventSequence;
const numberArray=(value:unknown,length:number,fallback:number[])=>Array.isArray(value)&&value.length===length&&value.every(x=>typeof x==="number"&&Number.isFinite(x))?value as number[]:fallback;
const clampIndex=(value:unknown,low:number,high:number)=>{const n=typeof value==="number"&&Number.isFinite(value)?Math.round(value):low;return Math.min(high,Math.max(low,n))};

export default function BassLab(){
 const [root,setRoot]=useState(9),[mode,setMode]=useState(1),[chord,setChord]=useState("Am7"),[fbView,setFbView]=useState("priority"),[fog,setFog]=useState(2),[picked,setPicked]=useState<number|null>(null),[listening,setListening]=useState(false),[pitch,setPitch]=useState<{n:string,oct:number,cents:number,hz:number}|null>(null),[history,setHistory]=useState<number[]>([]),[level,setLevel]=useState(1),[outsideBeat,setOutsideBeat]=useState(0),[weights,setWeights]=useState([60,55,45,70,80,75,62]),[plan,setPlan]=useState(sessions),[freedom,setFreedom]=useState([72,89,94,86,63]),[events,setEvents]=useState<NoteEvent[]>([]),[bpm,setBpm]=useState(80),[calibrated,setCalibrated]=useState(false),[noise,setNoise]=useState(0),[audioError,setAudioError]=useState(""),[exercise,setExercise]=useState(0),[recording,setRecording]=useState(false),[playing,setPlaying]=useState(false),[style,setStyle]=useState("Psychedelic"),[meter,setMeter]=useState(4),[clickMode,setClickMode]=useState("2 & 4"),[density,setDensity]=useState(2),[bar,setBar]=useState(1),[beat,setBeat]=useState(1),[weather,setWeather]=useState("Stable"),[progression,setProgression]=useState([0,0,5,0]),[diagStep,setDiagStep]=useState(0),[diag,setDiag]=useState([0,0,0,0,0]),[adaptiveReady,setAdaptiveReady]=useState(false),[keyMatrix,setKeyMatrix]=useState([78,42,69,45,75,57,41,81,44,86,48,71]),[antiHabit,setAntiHabit]=useState(false),[reviewDays,setReviewDays]=useState([3,11,18,7,22]);
 const [courseIndex,setCourseIndex]=useState(0),[courseStep,setCourseStep]=useState(0),[courseCompleted,setCourseCompleted]=useState(0),[showToolkit,setShowToolkit]=useState(false),[practiceTempo,setPracticeTempo]=useState(60),[juryScores,setJuryScores]=useState([70,70,70,70,70]);
 const route=useRoute(),view=route.view;
 // Navigating by view id keeps every existing call site working while the URL
 // becomes the single source of truth for which screen is open.
 const setView=(next:string)=>next==="courseLesson"?navigate(pathForView("courseLesson",{lesson:courseIndex+1})):goToView(next);
 useEffect(()=>{if(route.view!=="courseLesson")return;const lesson=Number.parseInt(route.params.lesson??"",10);if(Number.isFinite(lesson))setCourseIndex(clampIndex(lesson-1,0,COURSE_LESSONS.length-1))},[route.view,route.params.lesson]);
 // Both are written from outside the improvisation lab: the enclosure game
 // opens it on a chosen tab, and the lesson jury writes into its feedback line.
 const [labMode,setLabMode]=useState("motif");
 // Between the click and the browser's permission answer there is a wait the
 // player can see nothing of, and on a first visit it is the longest pause in
 // the app. The buttons that start listening read from this.
 const [connecting,setConnecting]=useState(false);
 /*
  * The workspace follows the lesson.
  *
  * Its panes are the fretboard, the band and the ear pad, and they were opening
  * on whatever key the player last left them in — so the Lydian lesson showed
  * its fretboard in Dorian, and the pane that says the band follows the
  * lesson's key and mode was telling the truth about nothing. This sets the
  * ground when the lesson changes, and not on every render, so a player who
  * moves the key inside a lesson keeps their change until they leave it.
  */
 useEffect(()=>{
  const ground=lessonContext(courseIndex);
  setRoot(ground.root);
  setMode(ground.mode);
  setChord(ground.chord);
 },[courseIndex]);

 const territories=useMemo(()=>territoryStates(courseCompleted,courseIndex),[courseCompleted,courseIndex]);
 const audio=useRef<{ctx:AudioContext,stream:MediaStream,raf:number}|null>(null),eventRef=useRef<{midi:number,start:number,amp:number}|null>(null),eventsRef=useRef<NoteEvent[]>([]),recordRef=useRef(false),runtimeRef=useRef<{ctx:AudioContext,clock:AudioClock,master:GainNode}|null>(null),auditionRef=useRef<AudioContext|null>(null); const ri=root, scale=useMemo(()=>MODES[mode].s.map(x=>(x+ri)%12),[mode,ri]), color=(ri+MODES[mode].s[MODES[mode].c])%12, chordTones=useMemo(()=>[0,3,7,10].map(x=>(x+ri)%12),[ri]);
 // The microphone loop and the backing band both outlive the render that starts
 // them, so anything they read has to come from a ref. Reading the state values
 // directly would freeze them at whatever they were when playback began.
 /*
  * The last note the microphone committed, as an event rather than a value.
  *
  * `history` is deduplicated — it only appends when the pitch changes — so a
  * note played twice in a row appears once, and anything waiting on it would
  * sit there while the player repeated themselves. This fires on every onset,
  * counting a repeat after silence as a new one.
  */
 /**
  * A progression sent to the fretboard from somewhere else.
  *
  * The reader used to set a root and navigate, which the board ignored — it
  * owns its own centre and its own chords, so you arrived on the default vamp
  * having asked to see your own progression.
  */
 const [sentToFretboard,setSentToFretboard]=useState<string[]|undefined>();
 const [fretCentre,setFretCentre]=useState<number|undefined>();
 const [heard,setHeard]=useState<{midi:number;at:number}|null>(null);
 const heardRef=useRef(-1);
 const takeStartRef=useRef(0),bpmRef=useRef(bpm),noiseRef=useRef(noise),calibrationRef=useRef<{until:number,samples:number[]}|null>(null);
 const runtimeSettingsRef=useRef({bpm,meter,style,clickMode,density,progression,ri});
 const harmonyRef=useRef<Harmony>({ri,chordTones,color,scale});
 useEffect(()=>{bpmRef.current=bpm},[bpm]);
 useEffect(()=>{noiseRef.current=noise},[noise]);
 useEffect(()=>{harmonyRef.current={ri,chordTones,color,scale}},[ri,chordTones,color,scale]);
 useEffect(()=>{runtimeSettingsRef.current={bpm,meter,style,clickMode,density,progression,ri}},[bpm,meter,style,clickMode,density,progression,ri]);
 useEffect(()=>()=>{if(audio.current){cancelAnimationFrame(audio.current.raf);audio.current.stream.getTracks().forEach(t=>t.stop());void audio.current.ctx.close()}if(runtimeRef.current){runtimeRef.current.clock.stop();void runtimeRef.current.ctx.close()}if(auditionRef.current){void auditionRef.current.close();auditionRef.current=null}},[]);
 // Saved state is untrusted: it survives across versions and can be hand-edited.
 // Restoring it unchecked used to put null into state and crash the next render
 // outside the try, leaving a blank page with no way back.
 useEffect(()=>{try{const p=JSON.parse(localStorage.getItem("basslab-adaptive")||"null");if(p&&typeof p==="object"){setFreedom(numberArray(p.freedom,5,[72,89,94,86,63]));setKeyMatrix(numberArray(p.matrix,12,[78,42,69,45,75,57,41,81,44,86,48,71]));setDiag(numberArray(p.diag,5,[76,82,71,68,64]));setAdaptiveReady(true)}}catch{}},[]);
 useEffect(()=>{try{const p=JSON.parse(localStorage.getItem("basslab-course")||"null");if(p&&typeof p==="object"){const done=clampIndex(p.completed,0,COURSE_LESSONS.length);setCourseCompleted(done);setCourseIndex(clampIndex(p.index??done,0,COURSE_LESSONS.length-1));setCourseStep(clampIndex(p.step,0,5))}}catch{}},[]);
 useEffect(()=>{setJuryScores([70,70,70,70,70]);setPracticeTempo(55+COURSE_LESSONS[courseIndex].unit*5)},[courseIndex]);
 const finishEvent=(end:number)=>{const e=eventRef.current;if(!e||!recordRef.current)return;const pc=(e.midi%12+12)%12,liveBpm=bpmRef.current,elapsed=(e.start-takeStartRef.current)/1000,beatFloat=elapsed/(60/liveBpm),beat=Math.floor(beatFloat)%4+1,offset=Math.round((beatFloat-Math.round(beatFloat))*60000/liveBpm),harmony=harmonyRef.current,t=tensionFor(pc,harmony),next:NoteEvent={id:eventId(),midi:e.midi,n:N[pc],oct:Math.floor(e.midi/12)-1,start:e.start,end,dur:Math.max(30,end-e.start),amp:e.amp,beat,offset,fn:labelFor(pc,harmony),tension:t,resolution:"pending"};eventsRef.current=[...eventsRef.current,next];setEvents([...eventsRef.current]);eventRef.current=null};
 const startAudio=async()=>{if(listening){finishEvent(performance.now());if(audio.current){cancelAnimationFrame(audio.current.raf);audio.current.stream.getTracks().forEach(t=>t.stop());audio.current.ctx.close();audio.current=null}setListening(false);return false}setConnecting(true);try{const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}}),ctx=new AudioContext(),src=ctx.createMediaStreamSource(stream),an=ctx.createAnalyser();/*
    * 8192 rather than 4096: a low B is 1555 samples long at 48 kHz, and a
    * period detector cannot see a period it does not hold several cycles of.
    */
   an.fftSize=8192;an.smoothingTimeConstant=.15;src.connect(an);const b=new Float32Array(an.fftSize);let stable=-1,frames=0,silence=0;const tracker=createPitchTracker();const tick=()=>{an.getFloatTimeDomainData(b);let rms=0;for(const x of b)rms+=x*x;rms=Math.sqrt(rms/b.length);
  const measuring=calibrationRef.current;
  if(measuring){measuring.samples.push(rms);if(performance.now()>=measuring.until){calibrationRef.current=null;const sorted=[...measuring.samples].sort((a,z)=>a-z),floor=sorted[Math.floor(sorted.length*.9)]??0;setNoise(floor);setCalibrated(true)}if(audio.current)audio.current.raf=requestAnimationFrame(tick);return}
  const raw=autoCorrelate(b,ctx.sampleRate);const loud=rms>Math.max(PITCH_RMS_GATE,noiseRef.current*1.8);const hz=tracker.feed(loud?raw:-1);if(hz>PITCH_MIN_HZ&&hz<PITCH_MAX_HZ){silence=0;const p=centsToNote(hz);setPitch(p);if(p.midi===stable)frames++;else{stable=p.midi;frames=1}if(frames>=2){if(eventRef.current&&eventRef.current.midi!==p.midi)finishEvent(performance.now());if(!eventRef.current)eventRef.current={midi:p.midi,start:performance.now(),amp:rms};setHistory(h=>h[h.length-1]===p.midi?h:[...h.slice(-63),p.midi]);if(heardRef.current!==p.midi){heardRef.current=p.midi;setHeard({midi:p.midi,at:performance.now()})}}}else if(++silence>5&&eventRef.current){finishEvent(performance.now());stable=-1;frames=0}if(silence>5)heardRef.current=-1;if(audio.current)audio.current.raf=requestAnimationFrame(tick)};audio.current={ctx,stream,raf:requestAnimationFrame(tick)};setAudioError("");setConnecting(false);setListening(true);return true}catch(error){setConnecting(false);setPitch(null);setListening(false);setAudioError(error instanceof DOMException&&(error.name==="NotAllowedError"||error.name==="SecurityError")?"Microphone access was blocked. Allow it for this site, then choose your audio-interface input and try again.":"The audio input could not start. Check that an input device is connected and free, then try again.");return false}};
 // Measure the real noise floor from the running input. The previous fixed .006
 // sat below the detector's own gate, so calibrating changed nothing at all.
 const calibrate=async()=>{if(!listening){const started=await startAudio();if(!started)return}setCalibrated(false);calibrationRef.current={until:performance.now()+1800,samples:[]}};
 const beginTake=async()=>{eventsRef.current=[];setEvents([]);setHistory([]);takeStartRef.current=performance.now();recordRef.current=true;setRecording(true);if(!listening){const started=await startAudio();if(!started){recordRef.current=false;setRecording(false);return false}}return true};
 const endTake=()=>{finishEvent(performance.now());recordRef.current=false;setRecording(false);const ev=eventsRef.current.map((e,i,a)=>{const nxt=a[i+1],resolved=e.tension===4&&nxt&&nxt.tension<=1&&nxt.start-e.end<900?"recovered":e.tension===4?"unresolved":"-";return {...e,resolution:resolved}});eventsRef.current=ev;setEvents([...ev]);saveLearningState("basslab-last-take",JSON.stringify(ev));};
 // Render reads the harmony directly; only the microphone loop goes via the ref.
 const harmony:Harmony={ri,chordTones,color,scale};
 const tension=(ni:number)=>tensionFor(ni,harmony);
 const label=(ni:number)=>labelFor(ni,harmony);
 const analyze=()=>{if(!history.length)return {inside:0,color:0,out:0,msg:"Play something first."};const pcs=history.map(m=>(m%12+12)%12),ins=pcs.filter(n=>scale.includes(n)).length,col=pcs.filter(n=>n===color).length,out=pcs.length-ins;return {inside:Math.round(ins/pcs.length*100),color:col,out,msg:col<2?`You used the ${MODES[mode].n} colour ${N[color]} only ${col} time${col===1?'':'s'}. Try again: hit it twice, once on a strong beat.`:`Mode identity detected: ${N[color]} appeared ${col} times. Now reduce scale-running and develop one motif.`}}
 const A=analyze();
 const generate=()=>{const labels=["Interval sniper","Upper-register recall","Characteristic-tone groove","Enclosure targets","Outside phrase length","Silence mission","Boss fight"],total=60,sum=weights.reduce((a,b)=>a+b,0);setPlan(weights.map((w,i)=>({m:Math.max(4,Math.round(total*w/sum)),t:labels[i],d:["Random roots; answer by function","Frets 12-20 only","Max 4 pitches; feature modal colour","Every third target enclosed","Outside for 1 beat; resolve","Leave at least 35% space","No diagrams; combine today’s work"][i],tag:["HEAR","SEE","CREATE","KNOW","PLAY","GROOVE","PROVE"][i]})))};
 const tone=(ctx:AudioContext,f:number,when:number,dur:number,vol:number,type:OscillatorType="sine",out?:AudioNode)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,when);g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(vol,when+.006);g.gain.exponentialRampToValueAtTime(.0001,when+dur);o.connect(g).connect(out||ctx.destination);o.start(when);o.stop(when+dur+.02)};
 // One reusable context: browsers cap how many can exist at once, so building a
 // fresh one per audition made repeated presses fail silently once the cap hit.
 const audition=(pcs:number[],hold=.34,droneRoot=ri)=>{
  let ctx=auditionRef.current;
  if(!ctx||ctx.state==="closed"){ctx=new AudioContext();auditionRef.current=ctx}
  if(ctx.state==="suspended")void ctx.resume();
  const now=ctx.currentTime+.05;
  baseDrone(ctx,now,pcs.length*hold+.45,droneRoot);
  pcs.forEach((pc,i)=>{const midi=36+((pc+12)%12)+((pc+12)%12<4?12:0);tone(ctx,midiHz(midi),now+.18+i*hold,hold*.82,.18,"triangle")});
 };
 const baseDrone=(ctx:AudioContext,when:number,dur:number,droneRoot=ri)=>{const midi=36+droneRoot+(droneRoot<4?12:0);tone(ctx,midiHz(midi),when,dur,.045,"sine");tone(ctx,midiHz(midi+7),when,dur,.018,"sine")};
 const noiseHit=(ctx:AudioContext,when:number,vol:number,out:AudioNode)=>{const len=Math.floor(ctx.sampleRate*.08),buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=buf;g.gain.value=vol;s.connect(g).connect(out);s.start(when)};
 const stopRuntime=()=>{const runtime=runtimeRef.current;if(runtime){runtimeRef.current=null;runtime.clock.stop();fadeAndClose(runtime.ctx,runtime.master)}setPlaying(false);setBar(1);setBeat(1);setWeather("Stable")};
 const startRuntime=()=>{
  if(playing){stopRuntime();return}
  const ctx=new AudioContext(),master=ctx.createGain();master.gain.value=.22;master.connect(ctx.destination);
  // Every value the pulse needs comes from runtimeSettingsRef, so changing tempo,
  // style, meter or progression takes effect on the next beat instead of being
  // frozen into the closure until the band is stopped and restarted.
  const schedule=(step:number,when:number)=>{
   const {meter,style,clickMode,density,progression,ri,bpm}=runtimeSettingsRef.current;
   const b=step%meter+1,ba=Math.floor(step/meter)%4+1,sec=60/bpm;
   const rootPc=(ri+progression[ba-1]+12)%12,rootMidi=36+rootPc+(rootPc<4?12:0);
   const shouldClick=clickMode==="Every beat"||clickMode==="2 & 4"&&(b===2||b===4)||clickMode==="Beat 4"&&b===4||clickMode==="Every 2 bars"&&ba%2===0&&b===1||clickMode==="Disappearing"&&Math.floor(step/meter)%8<4;
   if(shouldClick)tone(ctx,b===1?1400:950,when,.045,.16,"square",master);
   if(b===1){tone(ctx,midiHz(rootMidi),when,sec*meter*.92,.08,"sine",master);[0,3,7,10].slice(0,density+1).forEach((iv,i)=>tone(ctx,midiHz(rootMidi+12+iv),when+i*.008,sec*meter*.8,.025,"triangle",master))}
   if(style!=="Ambient"){if(b===1||b===3)tone(ctx,55,when,.09,.22,"sine",master);if(b===2||b===4)noiseHit(ctx,when,.13,master);if(style==="Funk"||style==="Disco")noiseHit(ctx,when+sec/2,.045,master)}
  };
  const display=(step:number)=>{
   const {meter}=runtimeSettingsRef.current,b=step%meter+1,ba=Math.floor(step/meter)%4+1;
   setBeat(b);setBar(ba);
   if(b===1)setWeather(ba===1?"Stable":ba===2?"Darkening":ba===3?"Increasing tension":"Release");
  };
  const clock=startAudioClock(ctx,()=>runtimeSettingsRef.current.bpm,{schedule,display});
  runtimeRef.current={ctx,clock,master};setPlaying(true);
 };
 const randomJam=()=>{const styles=["Psychedelic","Funk","Grunge","Fusion","Ambient","Reggae","Disco"],meters=[4,4,4,5,7];setStyle(styles[Math.floor(Math.random()*styles.length)]);setMeter(meters[Math.floor(Math.random()*meters.length)]);setBpm(70+Math.floor(Math.random()*45));setRoot(Math.floor(Math.random()*12));setMode(Math.floor(Math.random()*7));setProgression([[0,0,5,0],[0,3,5,0],[0,-2,-4,0],[0,1,0,0]][Math.floor(Math.random()*4)])};
 const answerDiagnostic=(score:number)=>{const next=diag.map((v,i)=>i===diagStep?score:v);setDiag(next);if(diagStep<4)setDiagStep(diagStep+1);else{const ev=events.length?events:eventsRef.current,inside=ev.length?Math.round(ev.filter(e=>e.tension<4).length/ev.length*100):72,timing=ev.length?Math.max(35,100-Math.round(ev.reduce((a,e)=>a+Math.abs(e.offset),0)/ev.length)):68,resolution=ev.filter(e=>e.tension===4).length?Math.round(ev.filter(e=>e.resolution==="recovered").length/ev.filter(e=>e.tension===4).length*100):64,computed=[Math.round((next[0]+next[1])/2),next[2],Math.round((next[1]+inside)/2),timing,Math.round((next[3]+next[4]+resolution)/3)];setFreedom(computed);setAdaptiveReady(true);saveLearningState("basslab-adaptive",JSON.stringify({freedom:computed,matrix:keyMatrix,diag:next,date:Date.now()}))}};
 const buildAdaptiveDay=()=>{const weakest=freedom.indexOf(Math.min(...freedom)),weakKey=keyMatrix.indexOf(Math.min(...keyMatrix)),axis=["Ear","Fretboard","Theory","Execution","Creation"][weakest];const p=[{m:8,t:`${N[weakKey]} ear calibration`,d:`Identify degree, function and best resolution in ${N[weakKey]}`,tag:"Hear"},{m:10,t:"Upper-register recall",d:"Frets 12-20; random targets; two-second limit",tag:"SEE"},{m:12,t:`${axis} repair block`,d:"One constraint, three clean passes, immediate transfer",tag:"Focus"},{m:10,t:"Chromatic recovery",d:"One forced outside note every two bars",tag:"Play"},{m:15,t:"Anti-habit mission",d:antiHabit?"No beat 1, no root starts, no ascending fills":"Build one motif through inside and outside versions",tag:"Create"},{m:5,t:"Boss fight",d:"No visual help; score all five Freedom axes",tag:"Prove"}];setPlan(p);setView("today")};
 const course=COURSE_LESSONS[courseIndex],courseDetail=LESSON_DETAILS[courseIndex],courseUnit=COURSE_UNITS[course.unit-1],courseSteps=["LEARN","HEAR","MAP","PRACTICE","APPLY","PASS"],coursePct=Math.round(courseCompleted/COURSE_LESSONS.length*100),mapTargets=Array.from(new Set([0,...course.character])).slice(0,4),juryAverage=Math.round(juryScores.reduce((a,b)=>a+b,0)/juryScores.length),juryMinimum=Math.min(...juryScores),juryPassed=juryAverage>=80&&juryMinimum>=70,weakJury=["HEAR","KNOW","SEE","PLAY","CREATE"][juryScores.indexOf(juryMinimum)],toolMeta:Record<string,{name:string,desc:string}>={runtime:{name:"Backing Band",desc:"Apply the current lesson over a musical vamp."},live:{name:"Live Coach",desc:"Connect bass and receive function-aware feedback."},engine:{name:"Record & Analyze",desc:"Capture the required take and inspect every event."},fret:{name:"Fretboard Map",desc:"See the lesson’s functions across the full neck."},games:{name:"Ear & Target Games",desc:"Test interval, target and resolution recall."},advanced:{name:"Advanced Lab",desc:"Use the focused motif, enclosure or voice-leading tool."}};
 const courseStageGuides=[
  {title:"Understand the idea",body:"Read the core concept and put it into your own words.",finish:"You can explain it without looking."},
  {title:"Recognise the sound",body:"Listen, predict and sing before touching the bass.",finish:"You hear the colour before you play it."},
  {title:"Find it on the neck",body:"Map the same musical function in more than one register.",finish:"You can locate it without one memorised shape."},
  {title:"Build reliable control",body:"Use the exact drills and tempo ladder for this lesson.",finish:"You earn three clean repetitions."},
  {title:"Use it in music",body:"Play the idea inside a complete 16-bar musical statement.",finish:"The idea survives groove, phrasing and recovery."},
  {title:"Prove it transfers",body:"Record one take and score what the performance actually shows.",finish:"Average 80+, every skill area 70+, then transfer key."},
 ];
 const courseLearnMinutes=Math.round(course.duration*.28),courseHearMinutes=Math.round(course.duration*.2),coursePlayMinutes=Math.round(course.duration*.38),courseProveMinutes=course.duration-courseLearnMinutes-courseHearMinutes-coursePlayMinutes;
 const courseTodayFlow=[
  {n:"01",name:"Learn",minutes:courseLearnMinutes,task:"Read the core idea, name every term and explain the essential contrast in your own words.",exit:"You can teach the idea aloud without reading and give one correct example plus one common failure."},
  {n:"02",name:"Hear",minutes:courseHearMinutes,task:"Hear, imagine and sing the defining function before you find it on the bass.",exit:"You can predict the colour, identify it in an A/B contrast and sing its return to home."},
  {n:"03",name:"Play",minutes:coursePlayMinutes,task:"Map two neck regions, then complete the written setup, task, dose and tempo ladder.",exit:"You earn three consecutive clean passes in two distant keys with time, touch and target intact."},
  {n:"04",name:"Prove",minutes:courseProveMinutes,task:"Record the application mission as one uninterrupted take and score the stated evidence.",exit:"The take reaches 80/100, no category is below 70, and you can name the intended target and resolution."},
 ];
 const storeCourse=(index:number,step:number,completed:number)=>saveLearningState("basslab-course",JSON.stringify({index,step,completed,date:Date.now()}));
 const openCourseLesson=(i:number)=>{if(i>courseCompleted)return;const m=MODES.findIndex(x=>COURSE_LESSONS[i].title.startsWith(x.n));if(m>=0)setMode(m);setCourseIndex(i);setCourseStep(0);setView("courseLesson");storeCourse(i,0,courseCompleted)};
 const advanceCourse=()=>{if(courseStep<5){const s=courseStep+1;setCourseStep(s);storeCourse(courseIndex,s,courseCompleted);return}if(!juryPassed)return;const done=Math.max(courseCompleted,courseIndex+1),next=Math.min(COURSE_LESSONS.length-1,courseIndex+1);setCourseCompleted(done);setCourseIndex(next);setCourseStep(0);storeCourse(next,0,done);setView(done===COURSE_LESSONS.length?"courseProgress":"courseLesson")};
 const openCourseTool=(tool:string)=>{setView(tool);if(tool==="runtime"){setProgression([0,0,0,0]);setBpm(80)}if(tool==="engine")setExercise(course.unit<6?0:Math.min(4,course.unit-2))};
 const openCoachTool=(tool:string)=>{if(tool==="coach"){setView("coach");return}if(tool==="hear"){setExercise(0);setView("engine");return}if(tool==="listen"){setExercise(4);setView("engine");return}if(tool==="fret"){setView("fret");return}if(tool==="know"){setView("reference");return}if(tool==="create"){setView("advanced");return}if(tool==="practice"){setView("practice");return}setView(tool)};
 const pageMeta=VIEW_META[view]??{eyebrow:"Bass lab",title:"Practice"};
 const showHarmonicControls=["courseLesson","coach","fret","runtime","engine","live","advanced","games","reference"].includes(view);
  const headerActions=<>
  {false&&<div className="head-selects">
   <label><span className="label">Key</span><select aria-label="Key centre" value={root} onChange={e=>{setRoot(+e.target.value);setChord(`${N[+e.target.value]}m7`)}}>{N.map((n,i)=><option value={i} key={n}>{n}</option>)}</select></label>
   <label><span className="label">Sound</span><select aria-label="Home mode" value={mode} onChange={e=>setMode(+e.target.value)}>{MODES.map((m,i)=><option value={i} key={m.n}>{m.n}</option>)}</select></label>
  </div>}
  <ThemeToggle/>
  <VoiceControl/>
 </>;

 return <AppShell
  course={{percent:coursePct,index:courseIndex,total:COURSE_LESSONS.length,title:course.title}}
  chart={{
   keyName:N[root],keyIndex:root,onKey:index=>{setRoot(index);setChord(`${N[index]}m7`)},keyOptions:N,
   sound:MODES[mode].n,soundIndex:mode,onSound:setMode,soundOptions:MODES.map(m=>m.n),
   meter,chord,feel:style,
  }}
  input={{listening,detail:pitch?`${pitch.n}${pitch.oct} at ${Math.round(pitch.hz)} Hz`:"Connect only when a tool asks"}}
  onToggleInput={()=>void startAudio()}
  inputBusy={connecting}
  actions={headerActions}
 >

 {view==="today"&&<TodaySession plan={plan} freedom={freedom}
  onStart={()=>{setView("live");startAudio()}}/>}

 {view==="adaptive"&&<AdaptivePlan
  ready={adaptiveReady} step={diagStep} freedom={freedom}
  reviewDays={reviewDays} keyMatrix={keyMatrix} antiHabit={antiHabit}
  onAnswer={answerDiagnostic} onAntiHabit={setAntiHabit} onGenerate={buildAdaptiveDay}
  onPractiseKey={i=>setKeyMatrix(keyMatrix.map((v,j)=>j===i?Math.min(100,v+3):v))}
  onRetake={()=>{setAdaptiveReady(false);setDiagStep(0)}}/>}

 {view==="runtime"&&<BackingBand
  root={ri} mode={mode} playing={playing} bar={bar} beat={beat}
  onToggleBand={startRuntime} onRandomise={randomJam}
  style={style} onStyle={setStyle} meter={meter} onMeter={setMeter}
  clickMode={clickMode} onClickMode={setClickMode}
  density={density} onDensity={setDensity}
  weather={weather} onWeather={setWeather}
  progression={progression} onProgression={setProgression}
  bpm={bpm} onBpm={next=>{if(playing)stopRuntime();setBpm(next)}}/>}

 {view==="engine"&&<ListeningEngine
  harmony={harmony} mode={mode}
  listening={listening} connecting={connecting} calibrated={calibrated} noise={noise} hearing={!!pitch}
  audioError={audioError} onCalibrate={calibrate}
  exercise={exercise} onExercise={setExercise}
  bpm={bpm} onBpm={setBpm}
  recording={recording} onBeginTake={beginTake} onEndTake={endTake}
  onClear={()=>{eventsRef.current=[];setEvents([])}}
  events={events} takeStart={takeStartRef.current}/>}

 {view==="live"&&<LiveSession harmony={harmony} pitch={pitch} listening={listening}
  chord={chord} modeName={MODES[mode].n} report={A} connecting={connecting} audioError={audioError}
  onToggleListening={startAudio} onClearTake={()=>setHistory([])}/>}

 {view==="fret"&&<Suspense fallback={<ToolLoading/>}><HarmonyFretboard centre={fretCentre} progression={sentToFretboard} livePitch={pitch} listening={listening} homeMode={mode} displayMode={fbView} fog={fog} selectedPc={picked} onSetRoot={setRoot} onSetMode={setMode} onSetChord={setChord} onDisplayMode={setFbView} onFog={setFog} onSelectPc={setPicked} onAudition={audition}/></Suspense>} 


 {view==="games"&&<RescueGames root={ri}
   heard={heard} listening={listening} connecting={connecting}
   onListen={()=>void startAudio()} audition={audition}/>}



 {view==="advanced"&&<ImprovisationLab
  harmony={harmony} mode={mode} events={events} recording={recording}
  onBeginTake={beginTake} onEndTake={endTake} audition={audition}
  onLoadIntoBand={semitones=>{setProgression([0,semitones,0,0]);setStyle("Psychedelic");setView("runtime")}}
  tab={labMode} onTabChange={setLabMode}/>}

 {view==="progression"&&<ProgressionAnalyser audition={audition}
  onSendToFretboard={(centre,homeMode,list)=>{
   setRoot(centre);setMode(homeMode);setChord(list[0]??"Am7");
   setFretCentre(centre);setSentToFretboard(list.length?list:undefined);
   setView("fret");
  }}/>}
 {view==="tabs"&&<Suspense fallback={<ToolLoading/>}><TabStudio/></Suspense>}
 {view==="jaco"&&<Suspense fallback={<ToolLoading/>}><JacoMasterclass/></Suspense>}

 {view==="map"&&<WorldMap
  territories={territories}
  lessonTitles={COURSE_LESSONS.map(lesson=>lesson.title)}
  currentLesson={courseIndex}
  onOpenLesson={openCourseLesson}
 />}

 {view==="course"&&<Home
  percent={coursePct}
  completed={courseCompleted}
  lesson={{index:courseIndex,total:COURSE_LESSONS.length,unit:course.unit,title:course.title,outcome:course.outcome,duration:course.duration}}
  stage={{index:courseStep,names:courseSteps}}
  flow={courseTodayFlow}
  units={COURSE_UNITS}
  onOpenLesson={()=>setView("courseLesson")}
  onOpenUnit={openCourseLesson}
 />}

 {view==="chromatic"&&<ChromaticGym/>}
 {view==="technique"&&<TechniqueLab/>}
 {view==="quest"&&<NoteQuest lesson={courseIndex} heard={heard} listening={listening}
   connecting={connecting} onListen={()=>void startAudio()}
   onPickLesson={setCourseIndex} audition={audition}/>}
 {view==="tools"&&<ToolLibrary onOpen={setView}/>}

 {view==="courseLesson"&&<LessonWorkspace
  lesson={{index:courseIndex,total:COURSE_LESSONS.length,title:course.title,unit:course.unit,outcome:course.outcome,duration:course.duration}}
  stageIndex={courseStep}
  stageNames={courseSteps}
  stageReached={courseStep}
  guide={courseStageGuides[courseStep]}
  onStage={setCourseStep}
  onAdvance={advanceCourse}
  advanceLabel={courseStep===5?(juryPassed?"Pass lesson":"Score to pass"):"Complete stage"}
  canAdvance={!(courseStep===5&&!juryPassed)}
  blockedReason={courseStep===5&&!juryPassed?`Jury average ${juryAverage} · needs 80+ with every area 70+`:undefined}
  onPrevLesson={()=>openCourseLesson(courseIndex-1)}
  onNextLesson={()=>openCourseLesson(courseIndex+1)}
  hasPrev={courseIndex>0}
  hasNext={courseIndex+1<=courseCompleted&&courseIndex+1<COURSE_LESSONS.length}
  workspaceLabel={WORKSPACE_LABELS[courseStep]}
  workspace={<LessonTools stage={courseStep} bridge={{livePitch:pitch,
   root,mode,fbView,fog,picked,setRoot,setMode,setChord,setFbView,setFog,setPicked,audition,
   playing,startRuntime,bpm,setBpm,bar,beat,
   recording,beginTake:()=>void beginTake(),endTake,eventCount:events.length,listening,
   lessonIndex:courseIndex,intervals:course.intervals,character:course.character,noteName:(pc:number)=>N[pc],
  }}/>}
  instruction={<>
   {courseStep===0&&<PacedReader className="learnStage" revealAll={courseIndex<courseCompleted}>
    <section className="prerequisiteCheck"><header><h2>Check the foundation.</h2><p>These come from earlier lessons. Attempt each on the bass or with your voice before revealing more material. Anything you cannot do here will cost you later in this one.</p></header><div>{courseDetail.prerequisites.map((x,i)=><label key={x}><input type="checkbox"/><i>{String(i+1).padStart(2,"0")}</i><span>{x}</span></label>)}</div></section>
    <article className="courseTheory"><h2>{course.outcome}</h2>{course.concept.map((p,i)=><p key={i}>{p}</p>)}</article>
    <aside><span>Function formula</span><b><Formula formula={course.formula}/></b><div><small>Essential distinction</small><p>{course.distinction}</p></div></aside>
    <section className="lessonVocabulary"><header><h2>Terms you must be able to use.</h2></header><div>{courseDetail.terms.map((x,i)=><article key={x.name}><i>{String(i+1).padStart(2,"0")}</i><b>{x.name}</b><p>{x.definition}</p></article>)}</div></section>
    <section className="workedExample"><header><h2>Turn the formula into musical jobs.</h2><p>Read each row across. Note name is local; degree and function are what let the idea transpose.</p></header><div className="theoryTableWrap"><table><thead><tr><th>Degree</th><th>Note</th><th>Role</th><th>What to hear / do</th></tr></thead><tbody>{course.intervals.map((iv,i)=><tr className={course.character.includes(iv)?"character":""} key={`${iv}-${i}`}><td>{DEG[iv]}</td><td>{N[(ri+iv)%12]}</td><td>{courseRole(iv,course.character)}</td><td>{courseBehavior(iv,course.character)}</td></tr>)}</tbody></table></div></section>
    <section className="theoryDiagnosis"><article><span>Bassist’s perspective</span><p>{courseDetail.bassFocus}</p></article><article className="myth"><span>Common misconception</span><p>{courseDetail.misconception}</p></article><article className="fix"><span>Correction</span><p>{courseDetail.correction}</p></article></section>
    <section className="troubleshooting"><header><h2>Symptom, cause, and the one thing to change.</h2><p>Find the row that matches what you are hearing. Change only what the fix names, if two things change at once you will not know which one worked.</p></header><div className="theoryTableWrap"><table><thead><tr><th>What you hear</th><th>WHY</th><th>What to change</th></tr></thead><tbody>{courseDetail.commonErrors.map(e=><tr key={e.symptom}><td>{e.symptom}</td><td>{e.cause}</td><td>{e.fix}</td></tr>)}</tbody></table></div></section>
    <article className="sayIt"><b>Teach it back</b><p>Without looking at the formula, explain: where is home, which tones carry structure, which tone or behavior defines this lesson, and what would make it fail musically?</p></article>
   </PacedReader>}
   {courseStep===1&&<PacedReader className="hearStage" revealAll={courseIndex<courseCompleted}><article><h2>Build an internal prediction.</h2><p>Listening is not passive exposure. Every round has a prediction, a sound and a verbal answer. Keep the bass muted until the imagined pitch feels specific.</p></article>
    <div className="courseHearCards"><button onClick={()=>audition([ri,ri,(ri+7)%12,ri],.48)}><small>Reference</small><b>Establish home</b><span>{N[ri]} root + fifth. Sing home after the sound stops.</span><em>▶ HEAR</em></button><button onClick={()=>audition(course.intervals.map(x=>(ri+x)%12),.26)}><small>Collection</small><b>Hear the formula</b><span>{course.formula}</span><em>▶ HEAR</em></button><button onClick={()=>audition([ri,...course.character.map(x=>(ri+x)%12),ri],.55)}><small>Identity</small><b>COLOUR → HOME</b><span>{course.character.map(x=>`${DEG[x]} (${N[(ri+x)%12]})`).join(" · ")}</span><em>▶ HEAR</em></button></div>
    <section className="earLadder"><header><h2>Reference → recognition → recall → creation.</h2><p>{courseDetail.earCue}</p></header><div>{[
      ["01","REFERENCE","Hear home, then the lesson degree, then home again.","5 repetitions · name stable / colour / tension",()=>audition([ri,...course.character.map(x=>(ri+x)%12),ri],.55)],
      ["02","PREDICT","Sing the defining degree before pressing play. Correct once, never fish.","5 trials · 4 accurate before verification",()=>audition(course.character.map(x=>(ri+x)%12),.6)],
      ["03","RECOGNIZE","Hear the degree inside a short environment and identify its function, not only its note name.","8 trials · 6 correct with no visual help",()=>audition(course.intervals.slice(0,Math.min(6,course.intervals.length)).map(x=>(ri+x)%12),.3)],
      ["04","CREATE","Sing a two-bar phrase that makes the lesson audible; only then reproduce it on bass.","3 original phrases · pitch and rhythm both retained",()=>audition([ri,(ri+course.character[0])%12,(ri+7)%12,ri],.42)]
    ].map(x=><button key={x[0] as string} onClick={x[4] as ()=>void}><i>{x[0] as string}</i><span>{x[1] as string}</span><p>{x[2] as string}</p><small>{x[3] as string}</small><b>▶ CHECK SOUND</b></button>)}</div></section>
    {courseDetail.listening&&<section className="listeningList"><header><h2>The sound already exists. Go and find it.</h2><p>Listen once without an instrument. You are looking for the degree this lesson is about, not for the whole arrangement.</p></header><div>{courseDetail.listening.map(r=><article key={r.title+r.artist}><b>{r.title}</b><small>{r.artist}</small><p>{r.hear}</p></article>)}</div></section>}
    <div className="earQuestions"><b>After every listen</b><ol><li>Where did home feel strongest: beginning, middle or ending?</li><li>Which pitch carried identity, and what interval was it?</li><li>Was its effect caused by harmony, duration, metric placement, or a combination?</li><li>Can you sing the strongest resolution before checking it?</li></ol></div>
    <div className="stagePass"><b>Pass this stage when</b><p>You complete Level 3 at least 6/8 and can sing one original Level 4 phrase before touching the instrument.</p></div>
   </PacedReader>}
   {courseStep===2&&<PacedReader className="mapStage" revealAll={courseIndex<courseCompleted}><article><h2>One sound. Several physical routes.</h2><p>Say degree, note name and expected function before every click. The objective is not one memorized box; it is direct access from sound to any useful register.</p></article>
    <div className="courseIntervalMap">{course.intervals.map((iv,i)=><button className={course.character.includes(iv)?"character":""} onClick={()=>audition([ri,(ri+iv)%12,ri],.5)} key={`${iv}-${i}`}><small>{DEG[iv]}</small><b>{N[(ri+iv)%12]}</b><span>{iv===0?"Home":course.character.includes(iv)?"Defining colour":courseRole(iv,course.character)}</span></button>)}</div>
    <section className="functionBreakdown"><header><h2>Know what each degree contributes.</h2></header><div className="theoryTableWrap"><table><thead><tr><th>Degree</th><th>NOTE IN {N[ri]}</th><th>Function</th><th>Default behaviour</th></tr></thead><tbody>{course.intervals.map((iv,i)=><tr className={course.character.includes(iv)?"character":""} key={`${iv}-map-${i}`}><td>{DEG[iv]}</td><td>{N[(ri+iv)%12]}</td><td>{courseRole(iv,course.character)}</td><td>{courseBehavior(iv,course.character)}</td></tr>)}</tbody></table></div></section>
    <section className="stringRouteMap"><header><h2>Root and identity tones below fret 12.</h2><p>Say the fret before looking. “Open / 12” reminds you that the same pitch class has two useful register choices.</p></header><div className="theoryTableWrap"><table><thead><tr><th>String</th>{mapTargets.map(iv=><th key={iv}>{DEG[iv]} · {N[(ri+iv)%12]}</th>)}</tr></thead><tbody>{STRINGS.map(s=><tr key={s.name}><td>{s.name} STRING</td>{mapTargets.map(iv=><td key={iv}>FRET {fretLabel((ri+iv)%12,s.open)}</td>)}</tr>)}</tbody></table></div></section>
    <section className="routeAssignments"><article><i>01</i><b>Vertical box</b><p>Stay between frets 5-9. Play only the structural tones first; add defining colour on the second pass.</p><small>PASS · 3 clean phrases without leaving position</small></article><article><i>02</i><b>Horizontal line</b><p>Choose one string. Travel from the lowest available lesson tone to fret 15 while naming every degree.</p><small>PASS · no pause longer than one beat</small></article><article><i>03</i><b>Diagonal route</b><p>Begin below fret 5 and end above fret 12 using at least three strings and no audible position panic.</p><small>PASS · 3 different smooth routes</small></article><article><i>04</i><b>Transfer</b><p>{courseDetail.transfer}</p><small>PASS · sound and function survive the new key</small></article></section>
    <div className="mapProtocol"><b>Fog-of-war protocol</b><span>Round 1: all notes visible</span><span>Round 2: roots only</span><span>Round 3: defining colour only</span><span>Round 4: blank neck</span></div>
   </PacedReader>}
   {courseStep===3&&<PacedReader className="practiceStage" revealAll={courseIndex<courseCompleted}><header><h2>Exact work. Measurable passes.</h2><p>Practice is ordered from preparation to controlled execution to musical use. Advance only after three clean repetitions, not after one lucky attempt.</p></header><aside className="questLaunch"><div><span>Prove it on the instrument</span><b>Walk this lesson one note at a time.</b><p>The path asks for a note, listens, and does not move until it hears the right one. A wrong turn costs ground back to the last place worth standing.</p></div><button type="button" className="action action-primary" onClick={()=>setView("quest")}>Open the walk <svg className="caret" viewBox="0 0 12 12" width="9" height="9" aria-hidden="true"><path d="M2 1 10 6 2 11Z" fill="currentColor"/></svg></button></aside>
    <section className="sessionRecipe"><article><b>05</b><span>min · prepare</span><p>Sing targets, clap the rhythm and play the structural skeleton without a track.</p></article><article><b>10</b><span>min · slow control</span><p>Work below performance tempo. Stop only to name the cause of an error.</p></article><article><b>10</b><span>min · musical context</span><p>Add the vamp, dynamics, rests and phrase shape while preserving the task.</p></article><article><b>05</b><span>min · record</span><p>Capture one uninterrupted take and write one evidence-based correction.</p></article></section>
    <section className="tempoLadder"><header><div><h3>{practiceTempo} BPM</h3></div><p>Pass the exercise three times at one tempo. A failed third attempt resets the count; reduce 10 BPM if technique changes the groove.</p></header><div>{[0,10,20,30,40].map((add,i)=>{const tempo=55+course.unit*5+add;return <button className={practiceTempo===tempo?"active":""} key={tempo} onClick={()=>setPracticeTempo(tempo)}><i>{i+1}</i><b>{tempo}</b><span>BPM</span></button>})}</div></section>
    <div className="exerciseGrid">{course.exercises.map((x,i)=><article key={x.name}><i>{String(i+1).padStart(2,"0")}</i><h3>{x.name}</h3><dl><div><dt>Setup</dt><dd>{x.setup}</dd></div><div><dt>Task</dt><dd>{x.task}</dd></div><div><dt>Dose</dt><dd>{x.dose}</dd></div><div><dt>Pass</dt><dd>{x.pass}</dd></div></dl><label className="practiceLog"><input type="checkbox"/><span>3 CLEAN PASSES LOGGED</span></label><button onClick={()=>openCourseTool(course.tools[Math.min(i,course.tools.length-1)])}>Open recommended tool</button></article>)}</div>
    <section className="diagnosticStrip"><article><h3>{courseDetail.misconception}</h3><p>Do not solve this by playing faster or adding notes. Record one slow attempt and locate the first moment the intention became unclear.</p></article><article><h3>Separate the layers.</h3><p>Play rhythm on one note, then the target skeleton without rhythm, then combine them. The layer that fails alone is the real practice assignment.</p></article><article><h3>{courseDetail.correction}</h3><p>Return at least 10 BPM below the failure point and earn three consecutive passes.</p></article></section>
    <div className="stagePass"><b>Pass this stage when</b><p>All three exercise checkboxes are earned at one tempo, and at least one exercise also passes in a second key or register.</p></div>
   </PacedReader>}
   {courseStep===4&&<PacedReader className="applyStage" revealAll={courseIndex<courseCompleted}><article><h2>{course.application}</h2><p>The concept is learned only when it survives groove, phrasing, listening and choice. Record one uninterrupted 16-bar take; recovery is part of the mission.</p></article>
    <section className="missionSetup"><div><small>Key / centre</small><b>{N[ri]}</b><span>Keep this audible without leaning on root every beat.</span></div><div><small>Primary function</small><b>{course.character.map(x=>DEG[x]).join(" · ")}</b><span>{course.character.map(x=>N[(ri+x)%12]).join(" · ")} in the selected key.</span></div><div><small>Tempo</small><b>{practiceTempo}</b><span>BPM · lower it if the pocket changes during the new concept.</span></div><div><small>Take length</small><b>16</b><span>BARS · no restart after an unexpected note.</span></div></section>
    <div className="applicationSequence"><div><b>1-4</b><span>State</span><p>Establish home, chord quality and one repeatable groove cell. No new lesson device yet.</p><small>Listener should know the centre by bar 4.</small></div><div><b>5-8</b><span>Develop</span><p>Repeat the groove idea with one rhythmic, register or ending variation. Preserve its identity.</p><small>Change one variable, not everything.</small></div><div><b>9-12</b><span>Apply</span><p>Introduce only this lesson’s concept: {course.outcome.toLowerCase()}</p><small>Intention must be nameable after the take.</small></div><div><b>13-16</b><span>Return</span><p>Reduce density, settle register and make the final harmonic destination inevitable.</p><small>Final bar must sound complete without a visual label.</small></div></div>
    <section className="missionVariations"><header><h3>Same lesson. Different pressure.</h3></header><div>{courseDetail.variations.map((x,i)=><article key={x}><i>{String(i+1).padStart(2,"0")}</i><b>{x}</b><p>{["Constraint reveals whether the core idea is genuinely understood.","A new placement prevents one memorized route from becoming the answer.","The third take tests whether musical identity survives transfer."][i]}</p></article>)}</div></section>
    <div className="applyRules"><b>Non-negotiables</b><span>No scale run longer than four notes</span><span>At least 20% silence</span><span>One motif must return</span><span>Groove may not stop</span></div>
    <section className="afterTake"><b>After the take · answer with timestamps</b><ol><li>At which bar did the listener first hear home?</li><li>Where did the lesson’s defining behavior become unmistakable?</li><li>Which note had the most tension, and why: function, beat, duration, accent or register?</li><li>Did the ending resolve harmony, rhythm and register together?</li></ol></section>
   </PacedReader>}
   {courseStep===5&&<PacedReader className="passStage" revealAll={courseIndex<courseCompleted}><article><h2>{course.assessment}</h2><p>Use one unedited recording. Score evidence from that take, not how well you believe you understand the page.</p></article>
    <section className="juryBrief"><article><span>Setup</span><p>{course.exercises[course.exercises.length-1].setup}</p></article><article><span>Performance task</span><p>{course.application}</p></article><article><span>Transfer proof</span><p>{courseDetail.transfer}</p></article><article><span>Pass evidence</span><p>{course.assessment}</p></article></section>
    <section className="lessonOutcomes"><header><h2>Can you do these now?</h2><p>These are the outcomes this lesson set out to teach. The five areas below judge how well; these judge whether.</p></header><div>{courseDetail.selfCheck.map((x,i)=><label key={x}><input type="checkbox"/><i>{String(i+1).padStart(2,"0")}</i><span>{x}</span></label>)}</div></section><div className="passChecklist">{[["HEAR","Identify or sing the defining function before playing."],["KNOW","Explain why it works, what it contrasts with and its common failure mode."],["SEE","Locate every required function in two neck regions without a diagram."],["PLAY","Execute the guided behavior at tempo without losing time or touch."],["CREATE","Use it in an original phrase with motif, space and deliberate resolution."]].map(x=><label key={x[0]}><input type="checkbox"/><i>✓</i><b>{x[0]}</b><span>{x[1]}</span></label>)}</div>
    <section className="juryScoring"><header><div><h2>Score what the take proves.</h2></div><p>80 average required. No axis may fall below 70. If one axis is weak, the retake prescription changes instead of repeating the whole lesson blindly.</p></header><div>{[
      ["HEAR","Could you predict and recognize the sound without visual help?"],
      ["KNOW","Could you explain degree, context, contrast and failure mode?"],
      ["SEE","Could you locate it across registers without one memorized box?"],
      ["PLAY","Did time, articulation and execution remain controlled?"],
      ["CREATE","Did the concept become an original musical statement?"]
    ].map((x,i)=><label key={x[0]}><div><b>{x[0]}</b><p>{x[1]}</p></div><input aria-label={`${x[0]} score`} type="range" min="50" max="100" value={juryScores[i]} onChange={e=>setJuryScores(juryScores.map((v,j)=>j===i?+e.target.value:v))}/><strong>{juryScores[i]}</strong></label>)}</div></section>
    <section className={`juryResult ${juryPassed?"passed":"needsWork"}`}><div><small>{juryPassed?"Jury status · pass":"Jury status · retake"}</small><b>{juryAverage}</b><span>AVERAGE · LOWEST {juryMinimum}</span></div><article><h3>{juryPassed?"Lesson standard reached.":`${weakJury} is the current bottleneck.`}</h3><p>{juryPassed?"Complete the transfer proof in the second key, then continue. Mastery will still require future review and musical use.":weakJury==="HEAR"?"Return to the four-level ear ladder. Sing before every verification and retake without visual labels.":weakJury==="KNOW"?"Teach the concept aloud using root, function, contrast and one failure example before replaying.":weakJury==="SEE"?"Use the string-by-string map, then repeat with a blank neck in two registers.":weakJury==="PLAY"?"Reduce 10 BPM, separate rhythm from pitch, and earn three consecutive clean passes.":"Use a four-pitch limit, repeat one motif and record a new take that is not a scale run."}</p></article></section>
    <div className="juryThreshold"><b>Pass standard</b><strong>80 / 100</strong><p>Average ≥80, every axis ≥70, plus one second-key transfer. A checkbox alone is not evidence.</p></div>
   </PacedReader>}
  </>}
 />}

 {view==="roadmap"&&<CourseLibrary
  lessons={COURSE_LESSONS.map((lesson,index)=>({index,unit:lesson.unit,title:lesson.title,tag:lesson.tag,duration:lesson.duration,outcome:lesson.outcome}))}
  units={COURSE_UNITS}
  completed={courseCompleted}
  current={courseIndex}
  onOpen={openCourseLesson}
 />}

 {view==="practice"&&<Suspense fallback={<ToolLoading/>}><BeastPractice currentLesson={course.title} courseTools={course.tools} toolMeta={toolMeta} onOpenTool={openCourseTool}/></Suspense>} 

 {view==="coach"&&<Suspense fallback={<ToolLoading/>}><PerformanceCoach root={root} modeName={MODES[mode].n} courseTitle={course.title} courseCompleted={courseCompleted} courseTotal={COURSE_LESSONS.length} events={events} livePitch={pitch} listening={listening} recording={recording} onStartRecording={beginTake} onStopRecording={endTake} onSetRoot={key=>{setRoot(key);setChord(`${N[key]}m7`)}} modeIntervals={MODES[mode].s} characterInterval={MODES[mode].s[MODES[mode].c]} onOpen={openCoachTool} onAudition={notes=>audition(notes,.35)}/></Suspense>} 

 {view==="maqam"&&<Suspense fallback={<ToolLoading/>}><MaqamLab livePitch={pitch} listening={listening} onToggleListening={startAudio}/></Suspense>} 
 {view==="slap"&&<Suspense fallback={<ToolLoading/>}><SlapLab livePitch={pitch} listening={listening} onToggleListening={startAudio} events={events}/></Suspense>} 

 {view==="courseProgress"&&<CourseProgress
  percent={coursePct} completed={courseCompleted} lessonIndex={courseIndex}
  lessonTitle={course.title} unitNumber={course.unit} unitTitle={courseUnit.title}
  onContinue={()=>setView("courseLesson")} onRecordTake={()=>setView("engine")}/>}

 {view==="reference"&&<Suspense fallback={<ToolLoading/>}><TheoryReference root={root} onSetMode={setMode} onAudition={audition}/></Suspense>}

 </AppShell>
}

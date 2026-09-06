"use client";
import ExerciseTabs from "./tab/ExerciseTabs";
import {maqamTab} from "./tab/lab-exercises";

import {useEffect,useMemo,useRef,useState} from "react";
import {startAudioClock,type AudioClock} from "./audio-clock";
import {speakCoach,stopCoachSpeech} from "./speech";

type LivePitch={n:string;oct:number;cents:number;hz:number}|null;
type Props={
 livePitch:LivePitch;
 listening:boolean;
 onToggleListening:()=>Promise<boolean>;
};
type PathMode="fretted"|"microtonal";
type Maqam={
 id:string; name:string; ar:string; family:string; level:string; rootJins:string; upperJins:string;
 ghammaz:number; cents:number[]; degrees:string[]; character:string; summaryAr:string; sayr:string;
 avoid:string; fretted:string; micro:string; recommendedRoot:number; rootOffset?:number; nonOctave?:boolean;
};
type ExerciseStep={at:number;label:string;instruction:string;target?:number};
type Exercise={id:string;minutes:number;title:string;ar:string;goal:string;setup:string;pass:string;steps:ExerciseStep[]};
type ExerciseGuide={before:string;count:string;listen:string;mistake:string;repair:string;next:string};

const NOTES=["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
const SOLFEGE=["دو","دو♯","ري","مي♭","مي","فا","فا♯","صول","لا♭","لا","سي♭","سي"];
const TABS=[
 ["explore","EXPLORE","افهم","01","Hear the identity and understand its ajnas, stations and sayr.","Sing the tonic and lower jins, then name the ghammaz and the main mistake to avoid."],
 ["fretboard","FRETBOARD","مواضع اليد","02","Turn the sound into one safe hand route and one deliberate shift.","Play the route up and down twice with centred targets, silent shifts and a relaxed thumb."],
 ["practice","PRACTICE","تدرّب","03","Use a timed routine to make intonation and melodic order repeatable.","Complete the chosen routine’s printed pass condition without touching the screen."],
 ["switch","SWITCH","التحويل","04","Hold a shared station and introduce only the destination evidence.","Four of five switches preserve pulse, pivot and a convincing destination cadence."],
 ["backing","BACKING","الإيقاع","05","Place the learned route inside iqa‘, form, space and a full musical return.","The returning tonic is unmistakable after a complete 4-, 8- or 16-bar form."],
] as const;

const MAQAMAT:Maqam[]=[
 {id:"bayati",name:"Bayati",ar:"بياتي",family:"Bayati family",level:"Start here",rootJins:"Jins Bayati",upperJins:"Nahawand or Rast on degree 4",ghammaz:3,cents:[0,150,300,500,700,800,1000,1200],degrees:["1","2↓","♭3","4","5","♭6","♭7","8"],character:"Warm, vocal and grounded. The half-flat second is the first identity test.",summaryAr:"مقام دافئ وغنائي. ثبّت جنس البياتي في القرار، واعتنِ بدرجة الثانية نصف بيمول قبل الصعود إلى الغمّاز.",sayr:"Establish the lower Bayati jins, lean on the fourth, reveal the upper jins, then descend through the half-flat second into home.",avoid:"Do not treat the 150-cent second as an out-of-tune major second. It is a controlled destination whose exact height follows style and teacher.",fretted:"Anchor the second one fret above the tonic, then bend it about +50¢. Release the bend before returning to the tonic.",micro:"On fretless bass, hear the second between the minor and major second; arrive from below and check it against the drone.",recommendedRoot:2},
 {id:"rast",name:"Rast",ar:"راست",family:"Rast family",level:"Core",rootJins:"Jins Rast",upperJins:"Rast or Nahawand around degree 5",ghammaz:4,cents:[0,200,350,500,700,900,1050,1200],degrees:["1","2","3↓","4","5","6","7↓","8"],character:"Stable, open and authoritative. Its half-flat third and seventh keep it distinct from a Western major scale.",summaryAr:"مقام راسخ ومفتوح. الثالثة والسابعة نصف بيمول هما لون المقام، والدرجة الخامسة مركز مهم للصعود والتحويل.",sayr:"State tonic-second-half-flat third clearly, expand to the fifth, explore the upper jins, then let the half-flat seventh guide the descent.",avoid:"A plain major third erases the core Rast colour; a minor third makes the lower jins sound too dark.",fretted:"Play the lower chromatic anchor for degrees 3 and 7, then bend each roughly +50¢ while the tonic drone continues.",micro:"Use the drone to place the third and seventh as expressive centres, not fixed equal-tempered compromises.",recommendedRoot:0},
 {id:"hijaz",name:"Hijaz",ar:"حجاز",family:"Hijaz family",level:"Core",rootJins:"Jins Hijaz",upperJins:"Nahawand or Rast above the ghammaz",ghammaz:3,cents:[0,100,400,500,700,800,1000,1200],degrees:["1","♭2","3","4","5","♭6","♭7","8"],character:"Focused and high-contrast. The semitone followed by the wide leap must still sing as one connected jins.",summaryAr:"لون واضح ومشدود. صِل بين القرار ونصف الدرجة ثم الثالثة الكبيرة من دون أن يتحول التمرين إلى شكل آلي.",sayr:"Circle the first four notes, emphasize the fourth, open the upper register only after Hijaz is unmistakable, then resolve by ♭2-1.",avoid:"Do not exaggerate the wide step by clipping the ♭2 or attacking the third too hard; sing the whole lower jins as one phrase.",fretted:"This is fully available on a standard fretted bass. Keep fingers 1-2 ready for the tight semitone and shift cleanly into the major third.",micro:"Use small slides and vocal ornaments, but keep the four structural pitches centred.",recommendedRoot:2},
 {id:"nahawand",name:"Nahawand",ar:"نهاوند",family:"Nahawand family",level:"Bridge",rootJins:"Jins Nahawand",upperJins:"Hijaz or Kurd on degree 5",ghammaz:4,cents:[0,200,300,500,700,800,1100,1200],degrees:["1","2","♭3","4","5","♭6","7","8"],character:"Minor-coloured and highly useful for connecting Western ears to maqam phrasing.",summaryAr:"مقام ذو طابع صغير، لكنه لا يختصر في السلم الهارموني الصغير؛ الجملة والمسار والزخرفة هي التي تثبت هويته.",sayr:"Build the lower minor jins, rest on the fifth, expose the upper tension, then descend with a clear melodic answer.",avoid:"Running harmonic minor evenly does not establish maqam behavior. Give the lower jins time, repetition and cadential weight.",fretted:"No microtonal adjustment is required for this teaching form; concentrate on shifts, phrase shape and the raised seventh’s pull.",micro:"Fretless players can shade ornaments around stable pitches without moving the structural targets.",recommendedRoot:2},
 {id:"kurd",name:"Kurd",ar:"كرد",family:"Kurd family",level:"Bridge",rootJins:"Jins Kurd",upperJins:"Nahawand on degree 4 or 5",ghammaz:3,cents:[0,100,300,500,700,800,1000,1200],degrees:["1","♭2","♭3","4","5","♭6","♭7","8"],character:"Dark and direct. Its first four notes resemble Phrygian, but its melodic treatment and cadences remain the lesson.",summaryAr:"مقام داكن ومباشر. لا يكفي عزف فريجيان صعوداً وهبوطاً؛ كرّر جنس الكرد واصنع قفلات واضحة إلى القرار.",sayr:"Make the tonic-♭2 tension audible, answer through ♭3-4, develop near the fourth or fifth, then descend without rushing the cadence.",avoid:"Do not lean so long on ♭2 that it becomes a new tonic. The root must remain acoustically and rhythmically stronger.",fretted:"Fully playable on frets. Use a compact four-fret cell and shift rather than forcing a wide left-hand stretch.",micro:"Use ornaments as phrasing choices, not as substitutes for a stable tonal centre.",recommendedRoot:2},
 {id:"ajam",name:"Ajam",ar:"عجم",family:"Ajam family",level:"Foundation",rootJins:"Jins Ajam",upperJins:"Ajam or Rast above degree 5",ghammaz:4,cents:[0,200,400,500,700,900,1100,1200],degrees:["1","2","3","4","5","6","7","8"],character:"Bright and declarative. Familiar pitch material makes it ideal for learning maqam grammar without intonation pressure.",summaryAr:"مقام مشرق وواضح. استخدمه لتعلّم فكرة الجنس والغمّاز والمسار بدلاً من الاكتفاء بعزف السلم الكبير.",sayr:"State the lower Ajam jins as a phrase, pause on the fifth, shape the upper answer, and return with a deliberate cadence.",avoid:"Major-scale fingering alone is not a maqam performance; articulation, repeated cells and destinations must reveal a melodic route.",fretted:"Fully playable. Use it to perfect hand economy and phrase architecture before adding quarter-tone bends.",micro:"Keep stable centres, then add tasteful slides into the third and tonic.",recommendedRoot:0},
 {id:"saba",name:"Saba",ar:"صبا",family:"Independent",level:"Advanced",rootJins:"Jins Saba",upperJins:"Overlapping Hijaz from degree 3; later routes vary",ghammaz:2,cents:[0,150,300,400,700,800,1000],degrees:["1","2↓","♭3","♭4","5*","♭6*","♭7*"],character:"Tense, intimate and non-octave-equivalent in important practice. Learn the lower jins before asking for a universal scale formula.",summaryAr:"مقام شديد الحساسية. ابدأ بجنس الصبا في المنطقة المنخفضة، ولا تفترض أن الصعود والهبوط نسخة واحدة داخل أوكتاف ثابت.",sayr:"Dwell in the compressed lower tetrachord, emphasize its expressive third, touch the overlapping Hijaz colour, then return without forcing an octave symmetry.",avoid:"The upper starred notes are only a practice route, not a universal Saba scale. Repertoire, regional style and teacher determine the full path.",fretted:"Use the lower chromatic fret as the anchor for the half-flat second and bend +50¢. Keep the next two notes only one semitone apart.",micro:"Map the lower four notes first: 0, 150, 300 and 400 cents. Let the ear lead before extending the route.",recommendedRoot:2,nonOctave:true},
 {id:"sikah",name:"Sikah",ar:"سيكاه",family:"Sikah family",level:"Advanced",rootJins:"Jins Sikah",upperJins:"Rast or Hijaz according to route",ghammaz:3,cents:[0,150,350,550,700,850,1050,1200],degrees:["1↓","2↓","3","4","5↓","6↓","7↓","8↓"],character:"A microtonal tonic changes the entire hand map: the home note itself often sits between equal-tempered frets.",summaryAr:"في السيكاه يكون القرار نفسه درجة دقيقة بين دَرَجتي النظام المتساوي. اسمع القرار أولاً ثم ابنِ الجنس حوله.",sayr:"Establish the microtonal tonic repeatedly, make the third or fourth a contrasting station, and prove the tonic again after every expansion.",avoid:"Never tune the tonic by eye alone. Its exact intonation varies; use a reference performance, teacher and drone.",fretted:"Choose the lower adjacent fret and bend the tonic about +50¢, or tune a dedicated string reference. Every return must reproduce the same height.",micro:"On fretless, mark the tonic by ear against a drone and test it after silence. This lab uses E half-flat as the recommended starting centre.",recommendedRoot:4,rootOffset:-50},
];

const EXERCISES:Exercise[]=[
 {id:"jins-lock",minutes:4,title:"Root + jins lock",ar:"تثبيت القرار والجنس",goal:"Make the lower jins recognizable before the full maqam appears.",setup:"Drone at practice root · 56 BPM · one octave below middle C · clean tone",pass:"3 rounds: tonic returns within ±15¢; lower jins stays continuous; no pause before the cadence.",steps:[
  {at:0,label:"00:00-00:30 · LISTEN",instruction:"Hands off. Hear the drone, sing the tonic, then sing the lower jins."},
  {at:30,label:"00:30-01:20 · ROOT",instruction:"Play four long tonics. Let every note settle before the next attack.",target:0},
  {at:80,label:"01:20-02:20 · LOWER JINS",instruction:"Play degrees one, two, three, four, then descend. Repeat without speeding up.",target:1},
  {at:140,label:"02:20-03:20 · QUESTION / ANSWER",instruction:"Two beats ascending, two beats descending. End every answer on the tonic.",target:2},
  {at:200,label:"03:20-04:00 · PROOF",instruction:"One unbroken lower-jins phrase, then hold the tonic for four seconds.",target:0},
 ]},
 {id:"intonation",minutes:5,title:"Quarter-tone intonation",ar:"ضبط أرباع الأصوات",goal:"Reproduce the selected half-flat pitch without looking at the screen.",setup:"Headphones strongly recommended · drone only · no percussion · very light fretting-hand pressure",pass:"8 of the final 10 attacks centre within ±15¢; no bend overshoot; release returns cleanly to the anchor fret.",steps:[
  {at:0,label:"00:00-00:40 · REFERENCE",instruction:"Hear tonic, target, tonic. Sing the target before touching the bass.",target:1},
  {at:40,label:"00:40-01:40 · SLOW ARRIVAL",instruction:"Start at the lower fret anchor and bend slowly until the coach says centred.",target:1},
  {at:100,label:"01:40-02:40 · DIRECT ATTACK",instruction:"Mute, reset, then land directly on the target. Leave two seconds of silence between attempts.",target:1},
  {at:160,label:"02:40-03:40 · IN CONTEXT",instruction:"Alternate tonic, microtone, next structural degree, microtone, tonic.",target:1},
  {at:220,label:"03:40-05:00 · BLIND TEST",instruction:"Do not look down. Ten measured attacks; the coach corrects low, high or wrong note.",target:1},
 ]},
 {id:"sayr",minutes:6,title:"Sayr ladder",ar:"مسار المقام",goal:"Turn the pitch collection into an audible melodic course.",setup:"Drone + light Maqsum · 64 BPM · four two-bar phrases",pass:"Lower jins arrives first; ghammaz is emphasized before the upper register; final descent clearly restores home.",steps:[
  {at:0,label:"00:00-01:00 · LOWER WORLD",instruction:"Improvise using only the first four degrees. Repeat one cell until the maqam is clear.",target:1},
  {at:60,label:"01:00-02:00 · GHAMMAZ",instruction:"Climb to the ghammaz and hold it. Do not reveal the octave yet.",target:3},
  {at:120,label:"02:00-03:20 · UPPER ANSWER",instruction:"Add degrees five through seven as an answer to the original cell.",target:4},
  {at:200,label:"03:20-04:40 · CONTROLLED PEAK",instruction:"Reach the highest note once; descend immediately to the ghammaz.",target:6},
  {at:280,label:"04:40-06:00 · HOME CADENCE",instruction:"Remove upper notes one by one and end with a two-second tonic.",target:0},
 ]},
 {id:"bridge",minutes:8,title:"Ghammaz bridge",ar:"جسر الغمّاز",goal:"Make the ghammaz a real station and a doorway to a second jins.",setup:"Drone + Wahda · 58 BPM · two-register hand route",pass:"Pivot remains audible through the shift; new jins appears after the pivot; hand movement is silent and rhythm remains intact.",steps:[
  {at:0,label:"00:00-01:30 · STATION",instruction:"Lower jins to ghammaz, hold, then descend. Repeat four times.",target:3},
  {at:90,label:"01:30-03:00 · SHIFT WITHOUT SOUND",instruction:"Keep the pivot finger as a guide. Release pressure, move the thumb, then place the new position.",target:3},
  {at:180,label:"03:00-04:30 · UPPER JINS",instruction:"Begin every upper phrase on the ghammaz and return there after three notes.",target:4},
  {at:270,label:"04:30-06:00 · TWO DIRECTIONS",instruction:"One phrase rises through the bridge; the next descends through it. No isolated scale runs.",target:3},
  {at:360,label:"06:00-08:00 · EIGHT-BAR FORM",instruction:"Two bars lower, two bars bridge, two bars upper, two bars full return.",target:0},
 ]},
 {id:"switch",minutes:10,title:"Maqam switch",ar:"تمرين التحويل",goal:"Change the active jins at a shared pivot without losing pulse or hand orientation.",setup:"Drone + Maqsum · 68 BPM · selected FROM → TO route",pass:"4 of 5 switches introduce only the planned changed tones; pivot is held; destination maqam resolves intentionally.",steps:[
  {at:0,label:"00:00-02:00 · FROM",instruction:"Establish only the source maqam. Make its characteristic degree obvious.",target:1},
  {at:120,label:"02:00-03:30 · PIVOT",instruction:"Approach the shared station from below and above. Hold it for two beats.",target:3},
  {at:210,label:"03:30-05:30 · CHANGE ONE TONE",instruction:"After the pivot, introduce the first pitch that belongs to the destination route.",target:4},
  {at:330,label:"05:30-07:30 · COMPLETE DESTINATION",instruction:"Answer with the destination lower jins, then cadence to its tonic or back to home.",target:5},
  {at:450,label:"07:30-10:00 · FIVE SWITCHES",instruction:"Five uninterrupted eight-bar rounds. The coach counts; you keep both hands on the bass.",target:0},
 ]},
 {id:"taqsim",minutes:12,title:"Taqsim proof",ar:"تقسيم موجّه",goal:"Create a complete solo arc with silence, development, modulation and return.",setup:"Drone + optional Sama‘i Thaqil · start 52 BPM · record the full take",pass:"Home is clear in minute 1; one motif develops; one planned switch succeeds; final minute unmistakably returns; at least 25% silence.",steps:[
  {at:0,label:"00:00-02:00 · DECLARE HOME",instruction:"Lower register only. State tonic and lower jins with space between phrases.",target:0},
  {at:120,label:"02:00-04:00 · DEVELOP",instruction:"Choose one three-note motif. Repeat, vary its ending, then leave silence."},
  {at:240,label:"04:00-06:00 · CLIMB",instruction:"Move toward the ghammaz. Shift once, slowly, without breaking the pulse.",target:3},
  {at:360,label:"06:00-08:00 · OPEN",instruction:"Reveal the upper jins and one register peak. Do not stay at maximum intensity.",target:5},
  {at:480,label:"08:00-10:00 · SWITCH",instruction:"Use the planned pivot. Introduce the destination colour after the held common tone.",target:4},
  {at:600,label:"10:00-12:00 · RETURN",instruction:"Reduce density, descend through the lower jins, and let the final tonic ring.",target:0},
 ]},
];

const EXERCISE_GUIDANCE:Record<string,ExerciseGuide>={
 "jins-lock":{before:"Tune the bass, choose the maqam and root, start with a drone only, and sing tonic-lower jins-tonic before the clock begins.",count:"Treat each phrase as four slow beats: ascend for beats 1-2, descend for beats 3-4, then leave one full breath before the next phrase.",listen:"The tonic must feel final and the lower jins must already identify the maqam. Every return should settle within ±15¢ without a last-second correction.",mistake:"You run the entire octave, reveal the upper jins too early, pause before the cadence, or treat the target microtone as a passing accident.",repair:"Return only to tonic plus the first four degrees. Reduce 10 BPM, sing the failed direction, earn three clean lower-jins cadences, then resume at the failed timed step.",next:"Repeat once in a second comfortable root. Then choose Quarter-tone intonation for pitch control or Sayr ladder for melodic expansion."},
 intonation:{before:"Use headphones, a clean direct bass input and drone only. Locate the lower fret anchor, relax the thumb and hear tonic-target-tonic three times before touching the string.",count:"One attempt lasts four beats: arrive on beat 1, hold through beat 2, release on beat 3, stay silent on beat 4. The blind test contains ten separate attempts.",listen:"A direct, repeatable centre within ±15¢, no overshoot and the same target height after silence. The bend should sound intentional, not searched for.",mistake:"You stare at the meter, squeeze with the thumb, overshoot and fall back, or allow the reference tone from speakers to enter the microphone.",repair:"Stop at the nearest attempt. Hear and sing the target, slide slowly from the anchor twice, then make three direct attacks with eyes closed before the timed routine continues.",next:"Apply the centred pitch inside tonic-microtone-next degree-tonic, then use Root + jins lock or Sayr ladder so intonation serves a phrase."},
 sayr:{before:"Complete one clean lower-jins cadence first. Select a light Maqsum, mark the ghammaz note and its hand position, and decide which three-note cell will be repeated.",count:"Think in five one-minute destinations: lower world, ghammaz, upper answer, one peak, home. Count two-bar questions and two-bar answers inside each destination.",listen:"The lower identity arrives before the upper register, the ghammaz sounds like a station, one peak is enough and the final descent reduces tension progressively.",mistake:"The exercise becomes an even scale, the octave appears before the ghammaz is established, every phrase climbs, or the ending simply stops instead of cadencing.",repair:"Go back to the last clear station, not minute zero. Restrict yourself to the previous four degrees, repeat the motif three times, then reopen one new degree.",next:"Run the same sayr with a different three-note motif. Then practise Ghammaz bridge if the hand shift is weak, or Maqam switch if the stations are secure."},
 bridge:{before:"Map the lower route and upper route separately. Circle the ghammaz as the shared note, rehearse the shift without sound and use Wahda at 58 BPM.",count:"Use the eight-bar form throughout: 2 bars lower, 2 approach/hold, 2 upper, 2 return. Say the section name on the first beat of each pair.",listen:"The pivot remains audible during the move, the thumb and hand travel together, the first upper note arrives after the station and no slide or squeak interrupts time.",mistake:"You jump directly into the upper shape, lose the pivot during the shift, stretch instead of moving the hand, or arrive rhythmically late after looking down.",repair:"Freeze on the ghammaz. Release pressure, move the silent hand three times, play pivot→first upper note for three clean pairs, then rejoin at bars 3-4.",next:"Transpose the same bridge to one nearby root. When the shift remains silent, use the Maqam switch routine to change melodic identity at that station."},
 switch:{before:"Choose one printed FROM→TO route, hear both maqamat separately, name the pivot and the first two changed tones, then rehearse the eight-bar route verbally.",count:"Bars 1-2 establish, 3-4 approach, bar 5 holds for two beats, bar 6 reveals one changed tone, bar 7 confirms and bar 8 cadences. Keep counting through the hold.",listen:"Source identity is undeniable before departure; the pivot remains common; only planned changed tones reveal the destination; the final cadence states whether you stayed or returned.",mistake:"You swap full scale shapes at once, introduce the destination before the pivot, stop the pulse during the hand move, or end without confirming a tonal centre.",repair:"Return to bar 5. Hold the pivot, sing the first changed tone, play only pivot→changed tone→destination tonic three times, then restart at bar 3 rather than bar 1.",next:"Complete five uninterrupted switches. Then use the backing section’s 8- or 16-bar form and make the same destination audible without visual labels."},
 taqsim:{before:"Record one continuous take. Choose a home maqam, one three-note motif, one planned pivot and a single destination; set a comfortable drone and decide whether percussion will enter.",count:"Follow six two-minute chapters: home, develop, climb, open, switch, return. Count phrases in four-bar spans and leave at least one full bar of silence in every chapter.",listen:"Home is clear in minute 1, the motif remains recognizable through variation, intensity reaches one peak, the switch has evidence and the final minute restores the opening centre.",mistake:"Density stays constant, new ideas replace development, the modulation is an unexplained scale change, silence disappears, or a miss causes you to restart the take.",repair:"Finish the take. Mark the chapter and nearest four-bar checkpoint where identity failed, repair only that phrase for three clean repetitions, then record one new full proof.",next:"Score the unedited take against the pass statement. Repeat only the weakest chapter before attempting another full 12-minute proof in a new root."},
};

const IQAA={
 maqsum:{name:"Maqsum",ar:"مقسوم",meter:"4/4",pattern:["D","-","T","T","D","-","T","-"]},
 malfuf:{name:"Malfuf",ar:"ملفوف",meter:"2/4",pattern:["D","-","T","-","T","-","D","-"]},
 wahda:{name:"Wahda",ar:"وحدة",meter:"4/4",pattern:["D","-","-","-","T","-","-","-"]},
 samai:{name:"Sama‘i Thaqil",ar:"سماعي ثقيل",meter:"10/8",pattern:["D","-","-","T","-","D","D","-","T","-"]},
} as const;
type IqaKey=keyof typeof IQAA;

const mod=(n:number,m:number)=>((n%m)+m)%m;
const signedDistance=(a:number,b:number)=>{let d=mod(a-b,1200);if(d>600)d-=1200;return d};
const formatTime=(seconds:number)=>`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(Math.floor(seconds%60)).padStart(2,"0")}`;
const pitchName=(pc:number)=>NOTES[mod(pc,12)];
const midiFrequency=(midi:number,cents=0)=>440*Math.pow(2,(midi-69+cents/100)/12);

function speak(text:string){
 void speakCoach(text,{interrupt:true});
}

export default function MaqamLab({livePitch,listening,onToggleListening}:Props){
 const [tab,setTab]=useState<(typeof TABS)[number][0]>("explore");
 const [maqamId,setMaqamId]=useState("bayati");
 const [root,setRoot]=useState(2);
 const [pathMode,setPathMode]=useState<PathMode>("fretted");
 const [zone,setZone]=useState("low");
 const [targetDegree,setTargetDegree]=useState(1);
 const [fromId,setFromId]=useState("bayati");
 const [toId,setToId]=useState("hijaz");
 const [pivotOffset,setPivotOffset]=useState(5);
 const [exerciseId,setExerciseId]=useState("jins-lock");
 const [running,setRunning]=useState(false);
 const [elapsed,setElapsed]=useState(0);
 const [runStep,setRunStep]=useState(0);
 const [runResult,setRunResult]=useState("");
 const [iqa,setIqa]=useState<IqaKey>("maqsum");
 const [tempo,setTempo]=useState(64);
 const [droneVolume,setDroneVolume]=useState(46);
 const [drumVolume,setDrumVolume]=useState(42);
 const [formBars,setFormBars]=useState(8);
 const [backing,setBacking]=useState(false);
 const [backingStep,setBackingStep]=useState(0);
 const [backingBar,setBackingBar]=useState(1);
 const [backingPrompt,setBackingPrompt]=useState("ESTABLISH THE LOWER JINS");
 const runStartRef=useRef(0),spokenStepRef=useRef(-1);
 const runnerTimerRef=useRef<number|null>(null);
 const correctionRef=useRef({status:"",count:0,lastSpoken:0});
 const scoreRef=useRef({hits:0,total:0});
 const backingRef=useRef<{ctx:AudioContext;clock:AudioClock;master:GainNode;osc:OscillatorNode[]} | null>(null);
 const backingSettingsRef=useRef({tempo,droneVolume,drumVolume,iqa,formBars});

 const maqam=useMemo(()=>MAQAMAT.find(x=>x.id===maqamId)??MAQAMAT[0],[maqamId]);
 const from=useMemo(()=>MAQAMAT.find(x=>x.id===fromId)??MAQAMAT[0],[fromId]);
 const to=useMemo(()=>MAQAMAT.find(x=>x.id===toId)??MAQAMAT[2],[toId]);
 const exercise=useMemo(()=>EXERCISES.find(x=>x.id===exerciseId)??EXERCISES[0],[exerciseId]);
 const exerciseGuide=EXERCISE_GUIDANCE[exercise.id],maqamFlowIndex=Math.max(0,TABS.findIndex(x=>x[0]===tab)),maqamFlowStep=TABS[maqamFlowIndex],nextMaqamTab=TABS[maqamFlowIndex+1];
 const rootBaseCents=root*100+(maqam.rootOffset??0);

 useEffect(()=>{backingSettingsRef.current={tempo,droneVolume,drumVolume,iqa,formBars}},[tempo,droneVolume,drumVolume,iqa,formBars]);
 useEffect(()=>()=>{
  if(runnerTimerRef.current)window.clearInterval(runnerTimerRef.current);
  if(backingRef.current){backingRef.current.clock.stop();backingRef.current.osc.forEach(x=>{try{x.stop()}catch{}});void backingRef.current.ctx.close()}
  stopCoachSpeech();
 },[]);

 const selectMaqam=(id:string)=>{
  const next=MAQAMAT.find(x=>x.id===id)??MAQAMAT[0];
  setMaqamId(next.id);setRoot(next.recommendedRoot);setTargetDegree(Math.min(1,next.cents.length-1));
 };

 const toneInfo=(m:Maqam,tone:number,rootPc=root)=>{
  const absolute=mod(rootPc*100+(m.rootOffset??0)+tone,1200);
  const anchor=mod(Math.floor((absolute+.001)/100),12);
  const bend=Math.round(absolute-anchor*100);
  return {absolute,anchor,bend,name:pitchName(anchor),arabic:SOLFEGE[anchor]};
 };

 const audition=async(m=maqam,rootPc=root)=>{
  const Ctx=window.AudioContext||window.webkitAudioContext;
  const ctx=new Ctx();
  const master=ctx.createGain();master.gain.value=.16;master.connect(ctx.destination);
  const baseMidi=36+mod(rootPc,12);
  const contour=[...m.cents,...m.cents.slice(0,-1).reverse()];
  contour.forEach((c,i)=>{
   const osc=ctx.createOscillator(),gain=ctx.createGain(),when=ctx.currentTime+.08+i*.27;
   osc.type="triangle";osc.frequency.value=midiFrequency(baseMidi,c+(m.rootOffset??0));
   gain.gain.setValueAtTime(.001,when);gain.gain.exponentialRampToValueAtTime(.28,when+.018);gain.gain.exponentialRampToValueAtTime(.001,when+.23);
   osc.connect(gain);gain.connect(master);osc.start(when);osc.stop(when+.25);
  });
  const drone=ctx.createOscillator(),dg=ctx.createGain();drone.type="sine";drone.frequency.value=midiFrequency(baseMidi,m.rootOffset??0);dg.gain.value=.12;drone.connect(dg);dg.connect(master);drone.start();drone.stop(ctx.currentTime+contour.length*.27+.25);
  window.setTimeout(()=>ctx.close(),contour.length*270+700);
 };

 const currentRunnerTarget=exercise.steps[runStep]?.target??targetDegree;
 const currentRunnerTone=maqam.cents[Math.min(currentRunnerTarget,maqam.cents.length-1)]??0;
 const runnerTargetAbsolute=mod(rootBaseCents+currentRunnerTone,1200);
 const pitchEvaluation=(()=>{
  if(!livePitch)return null;
  const pc=NOTES.indexOf(livePitch.n);
  if(pc<0)return null;
  const heard=mod(pc*100+livePitch.cents,1200),delta=Math.round(signedDistance(heard,runnerTargetAbsolute));
  const target=toneInfo(maqam,currentRunnerTone);
  if(Math.abs(delta)<=12)return {status:"Centered",delta,target};
  if(Math.abs(delta)>85)return {status:"Wrong note",delta,target};
  return {status:delta<0?"LOW":"High",delta,target};
 })();

 useEffect(()=>{
  if(!running||!pitchEvaluation)return;
  scoreRef.current.total++;
  if(pitchEvaluation.status==="Centered")scoreRef.current.hits++;
  const c=correctionRef.current;
  if(c.status===pitchEvaluation.status)c.count++;else{c.status=pitchEvaluation.status;c.count=1}
  const now=Date.now();
  if(c.count>=10&&pitchEvaluation.status!=="Centered"&&now-c.lastSpoken>6500){
   const correction=pitchEvaluation.status==="Wrong note"?`Find ${pitchEvaluation.target.name}`:pitchEvaluation.status==="LOW"?`Raise the pitch about ${Math.min(80,Math.abs(pitchEvaluation.delta))} cents`:`Lower the pitch about ${Math.min(80,Math.abs(pitchEvaluation.delta))} cents`;
   speak(correction);c.lastSpoken=now;c.count=0;
  }
 },[livePitch,pitchEvaluation,running]);

 const stopRunner=(completed=false)=>{
  if(runnerTimerRef.current){window.clearInterval(runnerTimerRef.current);runnerTimerRef.current=null}
  setRunning(false);
  const score=scoreRef.current.total?Math.round(scoreRef.current.hits/scoreRef.current.total*100):0;
  setRunResult(completed?`ROUTINE COMPLETE · INTONATION WINDOW ${score}% · ${exercise.pass}`:`ROUTINE STOPPED AT ${formatTime(elapsed)} · Your place is saved on this exercise.`);
  stopCoachSpeech();
 };

 const startRunner=async()=>{
  setRunResult("");setElapsed(0);setRunStep(0);spokenStepRef.current=0;scoreRef.current={hits:0,total:0};correctionRef.current={status:"",count:0,lastSpoken:0};
  if(!listening){const connected=await onToggleListening();if(!connected){setRunResult("MICROPHONE REQUIRED · Select your bass/audio-interface input, then start again.");return}}
  runStartRef.current=performance.now();setRunning(true);
  speak(`${exercise.title}. ${exercise.steps[0].instruction}`);
  runnerTimerRef.current=window.setInterval(()=>{
   const sec=(performance.now()-runStartRef.current)/1000;
   setElapsed(sec);
   const nextStep=exercise.steps.reduce((found,step,i)=>sec>=step.at?i:found,0);
   // Speaking from inside the updater made the coach talk over itself: React
   // re-runs updaters to check they are pure, twice under StrictMode.
   if(nextStep!==spokenStepRef.current){
    spokenStepRef.current=nextStep;
    speak(`${exercise.steps[nextStep].label}. ${exercise.steps[nextStep].instruction}`);
    setRunStep(nextStep);
   }
   if(sec>=exercise.minutes*60){stopRunner(true)}
  },250);
 };

 const playPercussion=(ctx:AudioContext,dest:AudioNode,kind:string,volume:number,when?:number)=>{
  const now=when??ctx.currentTime+.01;
  if(kind==="D"){
   const osc=ctx.createOscillator(),g=ctx.createGain();osc.type="sine";osc.frequency.setValueAtTime(120,now);osc.frequency.exponentialRampToValueAtTime(62,now+.14);g.gain.setValueAtTime(volume,now);g.gain.exponentialRampToValueAtTime(.001,now+.22);osc.connect(g);g.connect(dest);osc.start(now);osc.stop(now+.24);
  }else if(kind==="T"){
   const buffer=ctx.createBuffer(1,ctx.sampleRate*.08,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,3);
   const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=buffer;filter.type="highpass";filter.frequency.value=1400;g.gain.setValueAtTime(volume*.7,now);g.gain.exponentialRampToValueAtTime(.001,now+.075);src.connect(filter);filter.connect(g);g.connect(dest);src.start(now);
  }
 };

 const stopBacking=()=>{
  const r=backingRef.current;if(!r)return;
  r.clock.stop();r.osc.forEach(x=>{try{x.stop()}catch{}});void r.ctx.close();backingRef.current=null;setBacking(false);setBackingStep(0);setBackingBar(1);
 };

 const startBacking=()=>{
  if(backingRef.current){stopBacking();return}
  const Ctx=window.AudioContext||window.webkitAudioContext,ctx=new Ctx(),master=ctx.createGain();master.gain.value=.72;master.connect(ctx.destination);
  const baseMidi=36+mod(root,12),oscillators:OscillatorNode[]=[];
  [
   {ratio:1,type:"sine" as OscillatorType,level:.17},
   {ratio:1.5,type:"triangle" as OscillatorType,level:.055},
   {ratio:2,type:"sine" as OscillatorType,level:.035},
  ].forEach(x=>{const osc=ctx.createOscillator(),g=ctx.createGain();osc.type=x.type;osc.frequency.value=midiFrequency(baseMidi,maqam.rootOffset??0)*x.ratio;g.gain.value=x.level*droneVolume/50;osc.connect(g);g.connect(master);osc.start();oscillators.push(osc)});
   const runtime={ctx,clock:{stop(){}} as AudioClock,master,osc:oscillators};backingRef.current=runtime;setBacking(true);
   const prompts=["ESTABLISH THE LOWER JINS","LEAN ON THE GHAMMAZ","REVEAL THE UPPER JINS","DESCEND AND PROVE HOME"];
   // Each pattern step is half a beat, so the clock runs at twice the tempo. It
   // queues percussion against the audio clock rather than firing a chained
   // setTimeout, which accumulated the callback’s own latency on every step.
   const patternStep=(index:number)=>{const pattern=IQAA[backingSettingsRef.current.iqa].pattern;return {pattern,at:index%pattern.length}};
   const schedule=(index:number,when:number)=>{
    const settings=backingSettingsRef.current,{pattern,at}=patternStep(index);
    playPercussion(ctx,master,pattern[at],settings.drumVolume/100*.42,when);
    if(at===Math.floor(pattern.length/2)){
     const tone=maqam.cents[Math.min(maqam.ghammaz,maqam.cents.length-1)],o=ctx.createOscillator(),g=ctx.createGain();
     o.type="triangle";o.frequency.value=midiFrequency(baseMidi,tone+(maqam.rootOffset??0));
     g.gain.setValueAtTime(.06*settings.droneVolume/50,when);g.gain.exponentialRampToValueAtTime(.001,when+.24);
     o.connect(g);g.connect(master);o.start(when);o.stop(when+.26);
    }
   };
   const display=(index:number)=>{
    const settings=backingSettingsRef.current,{pattern,at}=patternStep(index);
    setBackingStep(at);
    if(at!==0)return;
    const bar=Math.floor(index/pattern.length)%settings.formBars+1;
    setBackingBar(bar);
    setBackingPrompt(prompts[Math.floor((bar-1)/Math.max(1,settings.formBars/4))%4]);
   };
   runtime.clock=startAudioClock(ctx,()=>backingSettingsRef.current.tempo*2,{schedule,display});
 };

 const zones:Record<string,[number,number]>= {low:[0,5],middle:[5,10],upper:[9,15],full:[0,15]};
 const [zoneStart,zoneEnd]=zones[zone];
 const stringDefs=[{name:"G",midi:43},{name:"D",midi:38},{name:"A",midi:33},{name:"E",midi:28}];
 const handRoute=(()=>{
  type RouteStep={string:string;fret:number;finger:string;shifted:boolean;degree:string;info:ReturnType<typeof toneInfo>};
  const build=(index:number,lastFret:number):RouteStep[]=>{
   if(index>=maqam.cents.length)return [];
   const info=toneInfo(maqam,maqam.cents[index]),candidates=stringDefs.flatMap(s=>Array.from({length:zoneEnd-zoneStart+1},(_,k)=>zoneStart+k).filter(f=>mod(s.midi+f,12)===info.anchor).map(f=>({string:s.name,fret:f})));
   const choice=(candidates.length?candidates:[{string:"-",fret:0}]).sort((a,b)=>Math.abs(a.fret-lastFret)-Math.abs(b.fret-lastFret))[0];
   const step={...choice,finger:choice.fret===0?"Open":String(Math.min(4,Math.max(1,choice.fret-zoneStart+1))),shifted:Math.abs(choice.fret-lastFret)>3,degree:maqam.degrees[index],info};
   return [step,...build(index+1,choice.fret)];
  };
  return build(0,(zoneStart+zoneEnd)/2);
 })();

 const toRoot=mod(root+pivotOffset,12);
 const sourceTones=from.cents.map((c,i)=>({tone:toneInfo(from,c,root),degree:from.degrees[i]}));
 const destinationTones=to.cents.map((c,i)=>({tone:toneInfo(to,c,toRoot),degree:to.degrees[i]}));
 const common=sourceTones.filter(a=>destinationTones.some(b=>Math.abs(signedDistance(a.tone.absolute,b.tone.absolute))<=25));
 const changed=destinationTones.filter(b=>!sourceTones.some(a=>Math.abs(signedDistance(a.tone.absolute,b.tone.absolute))<=25));
 const pivotPc=mod(root+pivotOffset,12);

 const setPreset=(a:string,b:string,offset:number)=>{setFromId(a);setToId(b);setPivotOffset(offset)};

 return <div className="maqamLab">
  <section className="maqamHero">
   <div><h1 data-page-heading tabIndex={-1}>Don’t memorize a scale.<br/><em>Learn how the maqam moves.</em></h1><p>A bass-first laboratory for ajnas, sayr, quarter-tone intonation, hand routes, modulation and uninterrupted guided practice.</p></div>
   <aside><small>Selected maqam</small><b>{maqam.name}<i>{maqam.ar}</i></b><p>{maqam.rootJins} · {maqam.family}</p><button onClick={()=>audition()}>▶ HEAR ASCENT + RETURN</button></aside>
  </section>

  <nav className="maqamTabs">{TABS.map(x=><button key={x[0]} className={tab===x[0]?"active":""} onClick={()=>setTab(x[0])}><b>{x[1]}</b><small>{x[2]}</small></button>)}</nav>
  <section className="maqamFlowRail">{TABS.map((x,i)=><article className={i<maqamFlowIndex?"done":i===maqamFlowIndex?"active":""} key={x[0]}><b>{i<maqamFlowIndex?"✓":x[3]}</b><div><span>{x[1]} · {x[2]}</span><p>{x[4]}</p>{i===maqamFlowIndex&&<small><em>Move on when</em>{x[5]}</small>}</div></article>)}</section>

  <div className="maqamControlBar">
   <label>Maqam<select value={maqamId} onChange={e=>selectMaqam(e.target.value)}>{MAQAMAT.map(x=><option value={x.id} key={x.id}>{x.name} · {x.ar}</option>)}</select></label>
   <label>Practice root<select value={root} onChange={e=>setRoot(+e.target.value)}>{NOTES.map((x,i)=><option value={i} key={x}>{x} · {SOLFEGE[i]}</option>)}</select></label>
   <div className="pathToggle"><span>Instrument path</span><button className={pathMode==="fretted"?"active":""} onClick={()=>setPathMode("fretted")}>Fretted</button><button className={pathMode==="microtonal"?"active":""} onClick={()=>setPathMode("microtonal")}>Fretless / true pitch</button></div>
  </div>

  {tab==="explore"&&<div className="maqamExplore">
   <section className="maqamPrinciple"><h2>A maqam is more than an octave scale.</h2><p>Its identity comes from connected pitch cells called <b>ajnas</b>, characteristic melodic phrases, important resting points, modulation possibilities, ornamentation and a customary melodic course, the <b>sayr</b>.</p><p dir="rtl" lang="ar">المقام ليس سلّماً فقط. هويته تأتي من الأجناس والجمل المميزة ودرجات الاستقرار والغمّاز والزخرفة ومسار اللحن.</p><div><b>JINS · جنس<small>A 3-5 note melodic unit with its own tonic and emphasis.</small></b><b>GHAMMAZ · غمّاز<small>A secondary station and frequent doorway to another jins.</small></b><b>SAYR · سير<small>The typical path: what appears first, where it rises, and how it returns.</small></b></div></section>

   <section className="maqamCards">{MAQAMAT.map(x=><button key={x.id} className={maqam.id===x.id?"active":""} onClick={()=>selectMaqam(x.id)}><small>{x.level}</small><b>{x.name}<i>{x.ar}</i></b><span>{x.rootJins}</span><em>{x.cents.some(c=>c%100!==0)||(x.rootOffset??0)!==0?"Microtonal":"12-TONE FRIENDLY"}</em></button>)}</section>

   <section className="maqamProfile">
    <header><div><h2>{maqam.name}<i>{maqam.ar}</i></h2><p>{maqam.character}</p></div><button onClick={()=>audition()}>▶ HEAR EXACT-CENT MAP</button></header>
    <div className="maqamDegrees">{maqam.cents.map((c,i)=>{const info=toneInfo(maqam,c);return <button key={`${c}-${i}`} className={targetDegree===i?"active":i===maqam.ghammaz?"ghammaz":""} onClick={()=>setTargetDegree(i)}><small>{maqam.degrees[i]}</small><b>{pathMode==="fretted"?info.name:`${c+(maqam.rootOffset??0)}¢`}</b><span>{pathMode==="fretted"?(info.bend?`${info.bend>0?"+":""}${info.bend}¢ bend`:`${info.name} fret`):`${info.name} anchor ${info.bend>=0?"+":""}${info.bend}¢`}</span></button>})}</div>
    {(()=>{
     const written=maqamTab(maqam.id);
     // Only the equal-tempered maqamat can be written as frets. For the rest the
     // cents map above is the accurate instrument, and a tab would misspell the
     // very interval that identifies the maqam.
     return written
      ?<ExerciseTabs exercises={[written]}/>
      :<p className="maqamCaution">{maqam.name} turns on intervals that sit between the frets, so it has no written tab. Work it from the cent map and the drone above.</p>;
    })()}
    {maqam.nonOctave&&<p className="maqamCaution">* Saba’s upper notes here are a guided practice route, not a universal octave formula. Learn the lower jins and repertoire-specific sayr first.</p>}
    <div className="maqamAnatomy">
     <article><h3>{maqam.rootJins}</h3><p>Root at {pitchName(root)} · first station at degree {maqam.ghammaz+1}, {toneInfo(maqam,maqam.cents[maqam.ghammaz]).name}.</p></article>
     <i>→</i><article><h3>{toneInfo(maqam,maqam.cents[maqam.ghammaz]).name}</h3><p>Pause here before changing register or introducing another jins.</p></article>
     <i>→</i><article><h3>{maqam.upperJins}</h3><p>Possibility, not an automatic chord-scale rule. The melodic route decides when it appears.</p></article>
    </div>
    <div className="maqamExplanation">
     <article><span>Sayr · melodic course</span><p>{maqam.sayr}</p></article>
     <article><span>{pathMode==="fretted"?"Fretted-bass method":"Fretless / microtonal method"}</span><p>{pathMode==="fretted"?maqam.fretted:maqam.micro}</p></article>
     <article className="avoid"><span>Do not do this</span><p>{maqam.avoid}</p></article>
     <article className="arabic" dir="rtl" lang="ar"><span>شرح مختصر</span><p>{maqam.summaryAr}</p></article>
    </div>
   </section>
  </div>}

  {tab==="fretboard"&&<div className="maqamFretTab">
   <section className="handIntro"><div><h2>Anchor the fret. Then create the pitch.</h2><p>Highlighted cells are the lower equal-tempered anchors. A <b>+50¢</b> badge means bend or slide halfway toward the next fret, never squeeze harder with the thumb.</p></div><aside><b>Safe hand rule</b><p>Keep the thumb mobile and wrist neutral. If four frets feel forced, release pressure and shift the whole hand; do not stretch through pain.</p></aside></section>
   <div className="zoneButtons">{[["low","LOW · 0-5"],["middle","MIDDLE · 5-10"],["upper","UPPER · 9-15"],["full","FULL · 0-15"]].map(x=><button className={zone===x[0]?"active":""} onClick={()=>setZone(x[0])} key={x[0]}>{x[1]}</button>)}</div>
   <section className="maqamFretboard"><header><b>String</b>{Array.from({length:16},(_,i)=><span key={i}>{i}</span>)}</header>{stringDefs.map(s=><div className="fretString" key={s.name}><b>{s.name}</b>{Array.from({length:16},(_,f)=>{const pc=mod(s.midi+f,12),toneIndex=maqam.cents.findIndex(c=>toneInfo(maqam,c).anchor===pc),active=toneIndex>=0,inZone=f>=zoneStart&&f<=zoneEnd,info=active?toneInfo(maqam,maqam.cents[toneIndex]):null;return <button disabled={!active} onClick={()=>active&&setTargetDegree(toneIndex)} key={f} className={`${active?"tone":""} ${inZone?"inZone":"dim"} ${toneIndex===0?"root":""} ${toneIndex===maqam.ghammaz?"bridge":""} ${targetDegree===toneIndex&&active?"selected":""}`}><small>{active?maqam.degrees[toneIndex]:""}</small><span>{active?pitchName(pc):"·"}</span>{info&&info.bend!==0&&<em>{info.bend>0?"+":""}{info.bend}¢</em>}</button>})}</div>)}</section>
   <div className="fretLegend"><span><i className="root"/> TONIC</span><span><i className="bridge"/> GHAMMAZ</span><span><i className="micro"/> MICROTONAL ANCHOR + BEND</span><p>Click any highlighted note to make it the live intonation target.</p></div>
   <section className="handRoute"><header><h2>{pitchName(root)} {maqam.name} · {zone.toUpperCase()} POSITION</h2><p>This is a movement suggestion, not a fixed fingering law. Keep one finger over the pivot while the thumb travels with the hand.</p></header><div>{handRoute.map((x,i)=><article key={i} className={x.shifted?"shift":""}><small>{x.degree}</small><b>{x.string} STRING · {x.fret===0?"Open":`FRET ${x.fret}`}</b><span>{x.finger==="Open"?"Open string":`FINGER ${x.finger}`}{x.info.bend?` · BEND ${x.info.bend>0?"+":""}${x.info.bend}¢`:" · CENTRE"}</span>{x.shifted&&<em>Shift hand</em>}</article>)}</div>
    <aside><b>Shift sequence</b><ol><li>Finish the old note.</li><li>Release finger pressure but keep skin contact.</li><li>Move thumb and hand as one unit.</li><li>Land near the ghammaz; listen before pressing harder.</li></ol></aside>
   </section>
  </div>}

  {tab==="switch"&&<div className="maqamSwitch">
   <section className="switchIntro"><h2>Keep the shared station.<br/>Change the melodic evidence.</h2><p>Real modulation is not merely replacing one same-root scale with another. It changes emphasis, introduces a new jins at a pivot, and proves the new destination by phrase behavior.</p></section>
   <section className="switchPresets"><span>Common practice routes</span><div><button onClick={()=>setPreset("bayati","hijaz",5)}>BAYATI → HIJAZ <small>On degree 4</small></button><button onClick={()=>setPreset("rast","nahawand",7)}>RAST → NAHAWAND <small>On degree 5</small></button><button onClick={()=>setPreset("nahawand","hijaz",7)}>NAHAWAND → HIJAZ <small>On degree 5</small></button><button onClick={()=>setPreset("kurd","nahawand",0)}>KURD → NAHAWAND <small>Same tonic study</small></button></div></section>
   <section className="switchBuilder">
    <div className="switchSelectors"><label>From<select value={fromId} onChange={e=>{setFromId(e.target.value);setPivotOffset(0)}}>{MAQAMAT.map(x=><option key={x.id} value={x.id}>{x.name} · {x.ar}</option>)}</select></label><i>→</i><label>TO<select value={toId} onChange={e=>{setToId(e.target.value);setPivotOffset(0)}}>{MAQAMAT.map(x=><option key={x.id} value={x.id}>{x.name} · {x.ar}</option>)}</select></label><label>Pivot location<select value={pivotOffset} onChange={e=>setPivotOffset(+e.target.value)}><option value="0">Same tonic</option><option value="5">Source degree 4</option><option value="7">Source degree 5</option></select></label></div>
    <div className="pivotStatement"><small>Hold this station</small><b>{pitchName(pivotPc)}<i>{SOLFEGE[pivotPc]}</i></b><p>{pitchName(root)} {from.name} → {pitchName(toRoot)} {to.name}</p><button onClick={()=>audition(to,toRoot)}>▶ HEAR DESTINATION MAP</button></div>
   </section>
   <section className="toneChange"><article><span>Shared / near-shared pitches</span><div>{common.length?common.map((x,i)=><b key={i}>{x.tone.name}<small>{x.degree}{x.tone.bend?` · ${x.tone.bend>0?"+":""}${x.tone.bend}¢`:""}</small></b>):<p>No exact common pitch at this simplified route. Use the chosen station as a melodic hand-off.</p>}</div></article><article className="changed"><span>Destination evidence to introduce</span><div>{changed.map((x,i)=><b key={i}>{x.tone.name}<small>{x.degree}{x.tone.bend?` · ${x.tone.bend>0?"+":""}${x.tone.bend}¢`:""}</small></b>)}</div></article></section>
   <section className="eightBar"><header><h2>One switch. No guesswork.</h2></header><div>{[
    ["1-2","ESTABLISH",`${pitchName(root)} ${from.name}: repeat the lower ${from.rootJins}.`],
    ["3-4","APPROACH",`Climb toward ${pitchName(pivotPc)}; make the source identity clear before leaving.`],
    ["5","HOLD",`Hold ${pitchName(pivotPc)} for two beats. Keep that finger as the visual and aural guide.`],
    ["6","REVEAL",`Introduce ${changed.slice(0,2).map(x=>x.tone.name).join(" then ")||"the destination colour"}; do not run the whole scale.`],
    ["7","CONFIRM",`Answer with ${to.rootJins} around ${pitchName(toRoot)}.`],
    ["8","CADENCE",`Resolve to ${pitchName(toRoot)} to stay, or retrace the pivot to ${pitchName(root)} to return.`],
   ].map(x=><article key={x[0]}><b>BAR {x[0]}</b><span>{x[1]}</span><p>{x[2]}</p></article>)}</div><aside><b>Hand move</b><p>Keep the pivot finger lightly touching its string. Release pressure, move the thumb with the hand, and place only the destination’s changed degrees. The common tones do not need to be relearned.</p></aside></section>
  </div>}

  {tab==="practice"&&<div className="maqamPractice">
   <section className="practicePromise"><div><h2>Press start once.<br/>Keep both hands on the bass.</h2><p>The coach speaks every phase, advances the clock, listens to pitch, and gives low / high / wrong-note corrections. The only control left on screen is stop.</p></div><aside><b>Best signal</b><p>Bass → audio interface → browser input. Use headphones when the backing track is active so the microphone hears the bass, not the speakers.</p></aside></section>
   <section className="exercisePicker">{EXERCISES.map(x=><button disabled={running} className={exercise.id===x.id?"active":""} key={x.id} onClick={()=>{setExerciseId(x.id);setRunResult("")}}><small>{x.minutes} MIN</small><b>{x.title}</b><span>{x.ar}</span><p>{x.goal}</p></button>)}</section>
   <section className="maqamRoutineGuide"><article><small>Before start</small><p>{exerciseGuide.before}</p></article><article><small>Count the form</small><p>{exerciseGuide.count}</p></article><article><small>Listen for</small><p>{exerciseGuide.listen}</p></article><article><small>Common failure</small><p>{exerciseGuide.mistake}</p></article><article><small>Repair without restarting</small><p>{exerciseGuide.repair}</p></article><article><small>Then continue</small><p>{exerciseGuide.next}</p></article></section>
   <section className={`routineConsole ${running?"running":""}`}>
    <header><div><h2>{exercise.title}<i>{exercise.ar}</i></h2><p>{exercise.setup}</p></div><div className="routineClock"><b>{formatTime(elapsed)}</b><small>/ {exercise.minutes}:00</small></div></header>
    <div className="routineProgress"><i><em style={{width:`${Math.min(100,elapsed/(exercise.minutes*60)*100)}%`}}/></i>{exercise.steps.map((x,i)=><span className={i<runStep?"done":i===runStep?"active":""} key={x.at}>{i+1}</span>)}</div>
    <div className="currentCue"><small>{exercise.steps[runStep].label}</small><b>{exercise.steps[runStep].instruction}</b></div>
    <div className="listenerPanel">
     <div><small>Listening target</small><b>{toneInfo(maqam,currentRunnerTone).name}<i>{maqam.degrees[currentRunnerTarget]??"1"}</i></b><span>{toneInfo(maqam,currentRunnerTone).bend?`Fret anchor + ${toneInfo(maqam,currentRunnerTone).bend}¢`:`Centred equal-tempered pitch`}</span></div>
     <div className={`intonationMeter ${pitchEvaluation?.status.toLowerCase().replace(" ","")??"idle"}`}><span>−50¢</span><i><em style={{left:`${pitchEvaluation?Math.max(0,Math.min(100,50+pitchEvaluation.delta)) :50}%`}}/></i><span>+50¢</span></div>
     <div className="listenerVerdict"><small>{listening?"Input active":"Input off"}</small><b>{pitchEvaluation?.status??"Play target"}</b><span>{livePitch?`${livePitch.n}${livePitch.oct} · ${livePitch.cents>0?"+":""}${livePitch.cents}¢ · ${Math.round(livePitch.hz)} Hz`:"Waiting for a stable bass note"}</span></div>
    </div>
    {!running?<button className="startRoutine" onClick={startRunner}>● START {exercise.minutes}-MIN HANDS-FREE ROUTINE</button>:<button className="stopRoutine" onClick={()=>stopRunner(false)}>■ STOP ROUTINE</button>}
    {runResult&&<p className="runResult">{runResult}</p>}
   </section>
   <section className="routineDetail"><header><h2>Know exactly what will happen.</h2></header><div>{exercise.steps.map((x,i)=><article key={x.at}><b>{String(i+1).padStart(2,"0")}</b><div><small>{x.label}</small><h3>{x.instruction}</h3>{x.target!==undefined&&<p>Listener target: degree {maqam.degrees[Math.min(x.target,maqam.degrees.length-1)]} of {maqam.name}.</p>}</div></article>)}</div><aside><span>Pass condition</span><p>{exercise.pass}</p></aside></section>
  </div>}

  {tab==="backing"&&<div className="maqamBacking">
   <section className="backingIntro"><div><h2>Drone first.<br/>Rhythm without harmonic clutter.</h2><p>Maqam is primarily melodic, so these tracks use a tonic/fifth drone, a soft ghammaz cue and programmable iqa‘, not a Western chord loop that dictates the phrase.</p></div><aside><b>No audio files</b><p>Every track is generated in real time. Change maqam, root, rhythm, tempo and form to create a new practice bed.</p></aside></section>
   <section className="iqaCards">{(Object.keys(IQAA) as IqaKey[]).map(key=>{const x=IQAA[key];return <button disabled={backing} className={iqa===key?"active":""} key={key} onClick={()=>setIqa(key)}><small>{x.meter}</small><b>{x.name}<i>{x.ar}</i></b><div>{x.pattern.map((p,i)=><span className={p==="D"?"dum":p==="T"?"tak":"rest"} key={i}>{p}</span>)}</div></button>})}</section>
   <section className="backingConsole">
    <header><div><h2>{pitchName(root)} {maqam.name} · {IQAA[iqa].name}</h2><p>Root drone + fifth · ghammaz cue: {toneInfo(maqam,maqam.cents[maqam.ghammaz]).name} · {IQAA[iqa].meter}</p></div><button className={backing?"stop":""} onClick={startBacking}>{backing?"■ STOP BACKING":"▶ START BACKING"}</button></header>
    <div className="backingControls"><label>Tempo <b>{tempo} BPM</b><input disabled={backing} type="range" min="50" max="120" value={tempo} onChange={e=>setTempo(+e.target.value)}/></label><label>Drone <b>{droneVolume}%</b><input type="range" min="0" max="80" value={droneVolume} onChange={e=>setDroneVolume(+e.target.value)}/></label><label>Percussion <b>{drumVolume}%</b><input type="range" min="0" max="80" value={drumVolume} onChange={e=>setDrumVolume(+e.target.value)}/></label><label>Form<select disabled={backing} value={formBars} onChange={e=>setFormBars(+e.target.value)}><option value="4">4 bars</option><option value="8">8 bars</option><option value="16">16 bars</option></select></label></div>
    <div className="backingTransport"><div><small>BAR</small><b>{String(backingBar).padStart(2,"0")}<i>/ {formBars}</i></b></div><div className="beatTrack">{IQAA[iqa].pattern.map((p,i)=><span className={`${p==="D"?"dum":p==="T"?"tak":"rest"} ${backing&&backingStep===i?"playing":""}`} key={i}><b>{p}</b><small>{i+1}</small></span>)}</div><div><small>Guided prompt</small><b>{backingPrompt}</b></div></div>
    <p className="headphoneNote"><b>WHEN LISTENING COACH IS ON:</b> wear headphones and send the bass directly to the selected input. Speaker bleed can be mistaken for your note.</p>
   </section>
   <section className="backingUse"><article><h3>Intonation</h3><p>Hold tonic, microtonal colour, ghammaz, tonic. No improvising until every target centres.</p></article><article><h3>Sayr</h3><p>2 bars lower jins · 2 bars bridge · 2 bars upper answer · 2 bars return.</p></article><article><h3>Taqsim arc</h3><p>Build slowly, leave silence, reach one peak, then make the final return unmistakable.</p></article></section>
  </div>}

  <section className="maqamNextStep"><div><h3>{maqamFlowStep[5]}</h3>{nextMaqamTab?<p><b>NEXT · {nextMaqamTab[1]}</b>{nextMaqamTab[4]}</p>:<p>The route is complete. Return to Explore with a new maqam or root and repeat the same evidence chain.</p>}</div><button onClick={()=>setTab(nextMaqamTab?.[0]??"explore")}>{nextMaqamTab?<>CONTINUE TO {nextMaqamTab[1]}</>:"Return to explore"}</button></section>
  <footer className="maqamFoot"><p><b>Intonation note</b> · “24-tone” labels are a useful notation convention, not proof that every tradition places every microtone at exactly 50 cents. Use this lab for repeatable practice, then refine pitch with repertoire and a qualified teacher.</p><span>AJNAS + SAYR → HAND ROUTE → PRACTICE → MODULATION → MUSIC</span></footer>
 </div>;
}

declare global{interface Window{webkitAudioContext:typeof AudioContext}}

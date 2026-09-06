import {SHORT_NAMES as DEGREES} from "./theory/degrees.ts";

export const NOTES=["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
export const AXES=["HEAR","SEE","KNOW","PLAY","CREATE"] as const;
export type Axis=typeof AXES[number];
export type BlockAxis=Axis|"REPAIR"|"PROVE";

export type TakeEvent={midi:number;offset:number;tension:number;resolution:string;start:number;end:number;dur:number;beat:number};
export type ExerciseStep={at:number;cue:string;detail:string;spoken?:string;target?:number[]};
export type DetectorSpec={
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
export type CoachBlock={id:string;title:string;minutes:number;axis:BlockAxis;reason:string;task:string;pass:string;tool:string;done:boolean;steps?:ExerciseStep[];listenFor?:string[];autoCorrection?:string;detector?:DetectorSpec};
export type BlockAnalysis={score:number;pass:boolean;events:number;timing:number;coverage:number;inside:number;recovery:number;range:number;motifRepeats:number;issue:string;correction:string};

export const clamp=(value:number,min=0,max=100)=>Math.max(min,Math.min(max,value));
export const pc=(midi:number)=>(midi%12+12)%12;
export const noteAt=(key:number,interval:number)=>NOTES[(key+interval+120)%12];
export const noteList=(key:number,intervals:number[])=>intervals.map(interval=>`${noteAt(key,interval)} (${DEGREES[(interval+12)%12]})`).join(" · ");
export const timeline=(minutes:number,steps:Array<Omit<ExerciseStep,"at">>):ExerciseStep[]=>{
 const positions=[0,.18,.42,.66,.84];
 return steps.map((step,index)=>({...step,at:Math.min(minutes*60-12,Math.round(minutes*60*(positions[index]??index/steps.length)))}));
};
export const defaultDetector=(minutes:number,modeIntervals:number[],characterInterval:number):DetectorSpec=>({
 allowed:modeIntervals,
 stable:[0,modeIntervals.includes(3)?3:4,7,modeIntervals.includes(10)?10:11].filter(interval=>modeIntervals.includes(interval)),
 required:[0,characterInterval],
 minEvents:Math.max(8,minutes*5),
 timingTolerance:115,
 maxOutsideRate:.12,
 minCoverage:2,
 passScore:72,
});
export const getSteps=(block:CoachBlock)=>block.steps?.length?block.steps:timeline(block.minutes,[
 {cue:"Establish the target",detail:block.task},
 {cue:"Repeat slowly",detail:"Use clear quarter notes and leave one beat of silence after every four notes."},
 {cue:"Connect the material",detail:"Keep the pulse while changing register once."},
 {cue:"Apply it musically",detail:"Use short phrases; every phrase must have a clear ending."},
 {cue:"Proof pass",detail:block.pass},
]);
export const getDetector=(block:CoachBlock,modeIntervals:number[],characterInterval:number)=>block.detector||defaultDetector(block.minutes,modeIntervals,characterInterval);

export function repeatedContourCount(events:TakeEvent[]){
 if(events.length<6)return 0;
 const cells=new Map<string,number>();
 for(let index=0;index<=events.length-3;index++){
  const a=events[index].midi,b=events[index+1].midi,c=events[index+2].midi;
  const shape=`${Math.sign(b-a)}:${Math.min(7,Math.abs(b-a))}|${Math.sign(c-b)}:${Math.min(7,Math.abs(c-b))}`;
  cells.set(shape,(cells.get(shape)||0)+1);
 }
 return Math.max(0,...cells.values())-1;
}

export function analyzeEvents(block:CoachBlock,raw:TakeEvent[],key:number,tempo:number,startMs:number,modeIntervals:number[],characterInterval:number,expectedFactor=1):BlockAnalysis{
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

export function axisBlueprint(axis:Axis,minutes:number,key:number,modeName:string,modeIntervals:number[],characterInterval:number,courseTitle:string){
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

/**
 * A Repair block isn't proving any of the five skills, so it earns no
 * attempt. A Prove block is this course's stand-in for CREATE, the axis its
 * "unedited musical proof" task is built to test.
 */
export function scoringAxisFor(block:CoachBlock):Axis|null{
 if((AXES as readonly string[]).includes(block.axis))return block.axis as Axis;
 if(block.axis==="PROVE")return "CREATE";
 return null;
}

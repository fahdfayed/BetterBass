"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {positionKeys} from "./fretboard-positions";
import {NOTE_ROLES,PITCH_NAMES,PROGRESSION_PRESETS,buildChordVoicing,classifyNote,commonTones,intervalLabel,parseChord,parseProgression,recommendScales,spellChordNote,voiceLeadingPaths,type ChordFamily,type ParsedChord} from "./harmony-fretboard-data";
import {degreeAt} from "./theory/degrees";

/**
 * Both of these tools stand on their own route and also sit inside a lesson as
 * a workspace pane. A page-level heading is right in the first case and wrong
 * in the second: inside a lesson it becomes a second h1 and the document claims
 * two top-level topics. `embedded` picks the level, and only the standalone
 * form carries the focus target the router looks for on navigation.
 */
type Props={
 /** True when rendered as a lesson workspace pane rather than its own page. */
 embedded?:boolean;
 homeMode:number;displayMode:string;fog:number;selectedPc:number|null;
 /**
  * The centre to show, when something outside decides it.
  *
  * On its own page the board owns its centre and this is left off. Inside a
  * lesson the lesson decides — otherwise the Lydian lesson opens its fretboard
  * wherever the player last left one, which is what it used to do.
  */
 centre?:number;
 /**
  * What the microphone is hearing, when the page is listening.
  *
  * The neck is the one screen where seeing the note you are playing is the
  * whole point, and it was the loudest of the screens that ignored the input
  * entirely — the site asked you to connect a bass and then drew a diagram.
  */
 livePitch?:{midi:number;cents:number}|null;
 listening?:boolean;
 /**
  * A progression handed over from somewhere else, to load and read here.
  *
  * The progression reader's "open this on the fretboard" set a root on the
  * page around the board and navigated, which the board — owning its own
  * centre and its own chords — ignored completely. Arriving on the default
  * vamp after asking to see your own progression is the same as the button
  * doing nothing.
  */
 progression?:string[];
 onSetRoot:(root:number)=>void;onSetMode:(mode:number)=>void;onSetChord:(chord:string)=>void;
 onDisplayMode:(mode:string)=>void;onFog:(level:number)=>void;onSelectPc:(pc:number|null)=>void;
 onAudition:(notes:number[],hold?:number,droneRoot?:number)=>void;
};
/*
 * The board works in pitch classes, but a heard note arrives as a real pitch,
 * so each string also carries where it actually starts. That is the difference
 * between lighting every E on the neck and lighting the one under the finger.
 */
const STRINGS=[{name:"G",open:7,midi:43},{name:"D",open:2,midi:38},{name:"A",open:9,midi:33},{name:"E",open:4,midi:28}],FRETS=Array.from({length:21},(_,i)=>i),mod=(n:number)=>((n%12)+12)%12;
type NeckRange="low"|"middle"|"high"|"full";
const HOME_FIELDS=["Ionian / major","Dorian","Phrygian","Lydian","Mixolydian","Aeolian / minor","Locrian"];
const FAMILY_NAMES:Record<ChordFamily,string>={major:"MAJOR",minor:"MINOR","minor-major":"MINOR–MAJOR",dominant:"DOMINANT",suspended:"SUSPENDED","half-diminished":"HALF-DIMINISHED",diminished:"DIMINISHED",augmented:"AUGMENTED"};
type BandStyleId="pocket"|"funk"|"grunge"|"neo"|"fusion"|"psychedelic";
type BandMix={drums:boolean;keys:boolean;guitar:boolean;cue:boolean};
type BandStyle={id:BandStyleId;name:string;feel:string;kick:number[];snare:number[];hat:number[];openHat:number[];keys:number[];guitar:number[];swing:number;keyGate:number;guitarGate:number;bright:boolean};
const BAND_STYLES:BandStyle[]=[
 {id:"pocket",name:"Deep pocket",feel:"Clear backbeat, breathing keys and small offbeat answers.",kick:[0,6,8,11],snare:[4,12],hat:[0,2,4,6,8,10,12,14],openHat:[14],keys:[0,10],guitar:[6,14],swing:0,keyGate:3.4,guitarGate:1.1,bright:false},
 {id:"funk",name:"Syncopated funk",feel:"Sixteenth-note grid, short chanks and an active kick pocket.",kick:[0,3,6,10,14],snare:[4,12],hat:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],openHat:[7,15],keys:[0,9],guitar:[2,6,9,11,14],swing:.08,keyGate:1.8,guitarGate:.55,bright:true},
 {id:"grunge",name:"Grunge / rock",feel:"Heavy backbeat, eighth-note drive and wide sustained harmony.",kick:[0,7,8,10],snare:[4,12],hat:[0,2,4,6,8,10,12,14],openHat:[14],keys:[0],guitar:[0,4,8,12],swing:0,keyGate:14.4,guitarGate:2.5,bright:true},
 {id:"neo",name:"Neo-soul",feel:"Laid-back pocket, soft syncopation and spacious upper voicings.",kick:[0,7,10],snare:[4,12],hat:[0,2,4,6,8,10,12,14],openHat:[15],keys:[0,10],guitar:[3,7,11,15],swing:.18,keyGate:4.8,guitarGate:1.25,bright:false},
 {id:"fusion",name:"Fusion",feel:"Dense subdivision, displaced accents and precise harmonic stabs.",kick:[0,3,7,10,14],snare:[4,11,12],hat:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],openHat:[6,14],keys:[0,7,12],guitar:[2,5,9,13],swing:.05,keyGate:1.6,guitarGate:.8,bright:true},
 {id:"psychedelic",name:"Psychedelic",feel:"Open drums, long colour beds and delayed rhythm answers.",kick:[0,8,11],snare:[4,12],hat:[0,2,4,6,8,10,12,14],openHat:[6,14],keys:[0,8],guitar:[5,11,15],swing:.1,keyGate:7.2,guitarGate:2.2,bright:false},
];
const PRESET_BAND_STYLE:Record<string,BandStyleId>={dorian:"pocket","major-251":"neo","minor-251":"neo","neo-soul":"neo","altered-turn":"fusion",fusion:"fusion",slash:"psychedelic",diminished:"fusion",augmented:"psychedelic",chromatic:"psychedelic"};
type HarmonyAudioEngine={ctx:AudioContext;output:GainNode;current:GainNode|null;previousUpper:number[];noise:AudioBuffer};
const midiHz=(midi:number)=>440*Math.pow(2,(midi-69)/12);

function schedulePadVoice(ctx:AudioContext,midi:number,when:number,duration:number,volume:number,out:AudioNode){
 const fundamental=ctx.createOscillator(),air=ctx.createOscillator(),gain=ctx.createGain(),airGain=ctx.createGain(),frequency=midiHz(midi);
 fundamental.type="triangle";fundamental.frequency.setValueAtTime(frequency,when);fundamental.detune.setValueAtTime((midi%2?1:-1)*2.5,when);
 air.type="sine";air.frequency.setValueAtTime(frequency*2,when);
 gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(volume,when+.035);gain.gain.exponentialRampToValueAtTime(volume*.62,when+Math.min(.65,duration*.35));gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
 airGain.gain.setValueAtTime(.0001,when);airGain.gain.exponentialRampToValueAtTime(volume*.16,when+.018);airGain.gain.exponentialRampToValueAtTime(.0001,when+Math.min(duration,.9));
 fundamental.connect(gain).connect(out);air.connect(airGain).connect(out);fundamental.start(when);air.start(when);fundamental.stop(when+duration+.04);air.stop(when+duration+.04);
}
function scheduleBassCue(ctx:AudioContext,midi:number,when:number,duration:number,out:AudioNode){
 const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type="sine";oscillator.frequency.setValueAtTime(midiHz(midi),when);gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(.075,when+.012);gain.gain.exponentialRampToValueAtTime(.026,when+Math.min(.24,duration*.3));gain.gain.exponentialRampToValueAtTime(.0001,when+duration);oscillator.connect(gain).connect(out);oscillator.start(when);oscillator.stop(when+duration+.04);
}
function scheduleCountClick(ctx:AudioContext,when:number,accent:boolean,out:AudioNode){
 const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type="square";oscillator.frequency.setValueAtTime(accent?1320:920,when);gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(accent ? .085 : .052,when+.002);gain.gain.exponentialRampToValueAtTime(.0001,when+.055);oscillator.connect(gain).connect(out);oscillator.start(when);oscillator.stop(when+.065);
}
function createNoiseBuffer(ctx:AudioContext){
 const buffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;return buffer;
}
function scheduleKick(ctx:AudioContext,when:number,velocity:number,out:AudioNode){
 const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type="sine";oscillator.frequency.setValueAtTime(138,when);oscillator.frequency.exponentialRampToValueAtTime(48,when+.12);gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(.19*velocity,when+.004);gain.gain.exponentialRampToValueAtTime(.0001,when+.19);oscillator.connect(gain).connect(out);oscillator.start(when);oscillator.stop(when+.21);
}
function scheduleSnare(ctx:AudioContext,noise:AudioBuffer,when:number,velocity:number,out:AudioNode){
 const source=ctx.createBufferSource(),filterNode=ctx.createBiquadFilter(),noiseGain=ctx.createGain(),body=ctx.createOscillator(),bodyGain=ctx.createGain();source.buffer=noise;filterNode.type="bandpass";filterNode.frequency.value=1850;filterNode.Q.value=.7;noiseGain.gain.setValueAtTime(.12*velocity,when);noiseGain.gain.exponentialRampToValueAtTime(.0001,when+.14);source.connect(filterNode).connect(noiseGain).connect(out);body.type="triangle";body.frequency.value=178;bodyGain.gain.setValueAtTime(.055*velocity,when);bodyGain.gain.exponentialRampToValueAtTime(.0001,when+.095);body.connect(bodyGain).connect(out);source.start(when);source.stop(when+.15);body.start(when);body.stop(when+.11);
}
function scheduleHat(ctx:AudioContext,noise:AudioBuffer,when:number,velocity:number,open:boolean,out:AudioNode){
 const source=ctx.createBufferSource(),filterNode=ctx.createBiquadFilter(),gain=ctx.createGain(),duration=open ? .24 : .055;source.buffer=noise;filterNode.type="highpass";filterNode.frequency.value=open?5700:6900;gain.gain.setValueAtTime((open ? .047 : .028)*velocity,when);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);source.connect(filterNode).connect(gain).connect(out);source.start(when);source.stop(when+duration+.01);
}
function scheduleGuitarVoice(ctx:AudioContext,midi:number,when:number,duration:number,volume:number,bright:boolean,out:AudioNode){
 const oscillator=ctx.createOscillator(),gain=ctx.createGain(),filterNode=ctx.createBiquadFilter();oscillator.type=bright?"sawtooth":"triangle";oscillator.frequency.value=midiHz(midi);filterNode.type="bandpass";filterNode.frequency.value=bright?1850:1280;filterNode.Q.value=.72;gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(volume,when+.004);gain.gain.exponentialRampToValueAtTime(volume*.32,when+Math.min(.075,duration*.3));gain.gain.exponentialRampToValueAtTime(.0001,when+duration);oscillator.connect(filterNode).connect(gain).connect(out);oscillator.start(when);oscillator.stop(when+duration+.025);
}
function swungStepTime(step:number,sixteenth:number,swing:number,barIndex:number){
 const delayed=step%4===2?sixteenth*swing*2:0,humanize=((step*7+barIndex*3)%5-2)*.0013;return step*sixteenth+delayed+humanize;
}

function nearestTarget(pc:number,chord:ParsedChord){
 const targets=[chord.bass,chord.root,...chord.pcs],distance=(target:number)=>Math.min(mod(target-pc),mod(pc-target));
 return targets.reduce((best,target)=>distance(target)<distance(best)?target:best,targets[0]);
}
function familyJob(family:ChordFamily){
 const jobs:Record<ChordFamily,string>={
  major:"Stable major colour. The progression decides whether Ionian or Lydian is more truthful.",
  minor:"Minor quality. Natural 6, ♭6 and ♭2 separate Dorian, Aeolian and Phrygian.",
  "minor-major":"Tonic minor with major-7 gravity; hear melodic or harmonic minor as a complete sound.",
  dominant:"Directional tension. Alterations only make sense through their destination.",
  suspended:"The 3rd is withheld. Preserve the suspension until its resolution is actually requested.",
  "half-diminished":"Unstable minor quality with ♭5; often prepares a minor-key dominant.",
  diminished:"Symmetrical connector. Any chord tone can redirect the harmony by semitone.",
  augmented:"Major colour without a perfect 5; whole-tone or Lydian-augmented logic can organize it.",
 };
 return jobs[family];
}

export default function HarmonyFretboard({embedded=false,centre:givenCentre,progression:givenProgression,livePitch,listening=false,homeMode,displayMode,fog,selectedPc,onSetRoot,onSetMode,onSetChord,onDisplayMode,onFog,onSelectPc,onAudition}:Props){
 const initial=PROGRESSION_PRESETS[0];
 const [presetId,setPresetId]=useState(initial.id),[draft,setDraft]=useState(initial.chords.join(" | ")),[applied,setApplied]=useState(initial.chords.join(" | ")),[centre,setCentre]=useState(initial.center),[lens,setLens]=useState<string>(initial.lens),[active,setActive]=useState(0),[choice,setChoice]=useState<{key:string;scale:string}|null>(null),[applyError,setApplyError]=useState(""),[autoFollow,setAutoFollow]=useState(false),[countIn,setCountIn]=useState(false),[tempo,setTempo]=useState(80),[barsPerChord,setBarsPerChord]=useState(2),[harmonyLevel,setHarmonyLevel]=useState(46),[bandStyle,setBandStyle]=useState<BandStyleId>("pocket"),[bandMix,setBandMix]=useState<BandMix>({drums:true,keys:true,guitar:true,cue:true});
 const [neckRange,setNeckRange]=useState<NeckRange>("low");

 /*
  * Every place the heard note could be fretted. A pitch sits on up to four
  * strings, and the board cannot know which finger produced it — so all of them
  * are marked rather than guessing one and being wrong three times in four.
  */
 const heardPc=livePitch?((livePitch.midi%12)+12)%12:null;
 const heardAt=useMemo(
  ()=>livePitch&&listening?positionKeys(livePitch.midi):new Set<string>(),
  [livePitch,listening],
 );

 // A centre handed in from outside replaces the board's own, when it moves.
 useEffect(()=>{if(givenCentre!==undefined)setCentre(givenCentre)},[givenCentre]);

 /*
  * Chords handed in replace what is loaded. Joined into the same text the
  * board's own input produces, so it arrives through one path rather than a
  * parallel one that could drift from it.
  */
 const handedOver=givenProgression?.join(" | ")??"";
 useEffect(()=>{
  if(!handedOver)return;
  setDraft(handedOver);setApplied(handedOver);setPresetId("custom");
  setActive(0);setChoice(null);setApplyError("");
 },[handedOver]);
 const parsed=useMemo(()=>parseProgression(applied),[applied]),chords=parsed.chords,current=chords[Math.min(active,Math.max(0,chords.length-1))]||parseChord("Cmaj9"),next=chords.length>1?chords[(active+1)%chords.length]:current,currentKey=`${active}:${current.symbol}:${applied}`;
 const recommendations=useMemo(()=>recommendScales(current,next,centre,homeMode,lens),[current,next,centre,homeMode,lens]),selectedRecommendation=recommendations.find(x=>choice?.key===currentKey&&x.scale.id===choice.scale)||recommendations[0],selectedScale=selectedRecommendation.scale,paths=useMemo(()=>voiceLeadingPaths(current,next),[current,next]),shared=useMemo(()=>commonTones(current,next),[current,next]);
 const actualDisplay=displayMode==="interval"?"degree":displayMode==="function"||displayMode==="heat"?"priority":displayMode,filter=Math.min(4,fog),visibleFrets=neckRange==="low"?FRETS.slice(0,13):neckRange==="middle"?FRETS.slice(5,16):neckRange==="high"?FRETS.slice(10):FRETS;
 const selected=selectedPc??current.bass,selectedRole=classifyNote(selected,current,selectedScale,next),selectedIv=mod(selected-current.root),selectedDestination=nearestTarget(selected,next),durationMs=Math.round(60000/tempo*4*barsPerChord),selectedBandStyle=BAND_STYLES.find(style=>style.id===bandStyle)||BAND_STYLES[0];
 const harmonyAudio=useRef<HarmonyAudioEngine|null>(null),countInTimer=useRef<number|null>(null),harmonyLevelRef=useRef(harmonyLevel),bandStyleRef=useRef<BandStyleId>(bandStyle),bandMixRef=useRef<BandMix>(bandMix);

 const releaseCurrentChord=useCallback(()=>{
  const engine=harmonyAudio.current;if(!engine?.current||engine.ctx.state==="closed")return;const now=engine.ctx.currentTime,gain=engine.current.gain;gain.cancelScheduledValues(now);gain.setValueAtTime(Math.max(.0001,gain.value),now);gain.exponentialRampToValueAtTime(.0001,now+.07);engine.current=null;
 },[]);
 const ensureHarmonyAudio=useCallback(async()=>{
  let engine=harmonyAudio.current;
  if(!engine||engine.ctx.state==="closed"){
   const ctx=new AudioContext(),output=ctx.createGain(),filterNode=ctx.createBiquadFilter(),compressor=ctx.createDynamicsCompressor();
   output.gain.value=harmonyLevelRef.current/100*.56;filterNode.type="lowpass";filterNode.frequency.value=9000;filterNode.Q.value=.3;compressor.threshold.value=-22;compressor.knee.value=18;compressor.ratio.value=3;compressor.attack.value=.012;compressor.release.value=.24;output.connect(filterNode).connect(compressor).connect(ctx.destination);engine={ctx,output,current:null,previousUpper:[],noise:createNoiseBuffer(ctx)};harmonyAudio.current=engine;
  }
  if(engine.ctx.state==="suspended")await engine.ctx.resume();
  return engine;
 },[]);
 const playChordAudio=useCallback(async(chord:ParsedChord,bars:number,bpm:number,withBand=false)=>{
  const engine=await ensureHarmonyAudio();releaseCurrentChord();const {ctx}=engine,group=ctx.createGain(),when=ctx.currentTime+.025,barSeconds=60/bpm*4,sixteenth=barSeconds/16,voicing=buildChordVoicing(chord,engine.previousUpper),voiceVolume=Math.min(.046,.105/Math.sqrt(Math.max(1,voicing.upperMidi.length))),style=BAND_STYLES.find(item=>item.id===bandStyleRef.current)||BAND_STYLES[0],mix=bandMixRef.current;
  group.gain.setValueAtTime(1,when);group.connect(engine.output);
  if(!withBand){
   scheduleBassCue(ctx,voicing.bassMidi,when,Math.min(1.05,barSeconds*.42),group);voicing.upperMidi.forEach((midi,index)=>schedulePadVoice(ctx,midi,when+index*.007,Math.max(.65,barSeconds*.92),voiceVolume,group));
  }else for(let barIndex=0;barIndex<bars;barIndex++){
   const barStart=when+barIndex*barSeconds,stepWhen=(step:number)=>barStart+swungStepTime(step,sixteenth,style.swing,barIndex);
   if(mix.drums){style.kick.forEach(step=>scheduleKick(ctx,stepWhen(step),step===0?1:.78,group));style.snare.forEach(step=>scheduleSnare(ctx,engine.noise,stepWhen(step),step===4||step===12?1:.58,group));style.hat.forEach(step=>{if(!style.openHat.includes(step))scheduleHat(ctx,engine.noise,stepWhen(step),step%4===0?1:.68,false,group)});style.openHat.forEach(step=>scheduleHat(ctx,engine.noise,stepWhen(step),.86,true,group))}
   if(mix.keys)style.keys.forEach(step=>{const start=stepWhen(step),duration=Math.max(.12,Math.min(sixteenth*style.keyGate,barStart+barSeconds-start-.025));voicing.upperMidi.forEach((midi,index)=>schedulePadVoice(ctx,midi,start+index*.006,duration,voiceVolume*.82,group))});
   if(mix.guitar){const guitarNotes=voicing.upperMidi.slice(-Math.min(4,voicing.upperMidi.length)),guitarVolume=Math.min(.034,.072/Math.sqrt(Math.max(1,guitarNotes.length)));style.guitar.forEach((step,hitIndex)=>{const start=stepWhen(step),duration=Math.max(.07,Math.min(sixteenth*style.guitarGate,barStart+barSeconds-start-.02));guitarNotes.forEach((midi,index)=>scheduleGuitarVoice(ctx,midi,start+index*.009,duration,guitarVolume*(hitIndex%2 ? .82 : 1),style.bright,group))})}
   if(mix.cue&&barIndex===0)scheduleBassCue(ctx,voicing.bassMidi+12,barStart,Math.min(.38,barSeconds*.18),group);
  }
  engine.current=group;engine.previousUpper=voicing.upperMidi;
 },[ensureHarmonyAudio,releaseCurrentChord]);
 const stopPlayback=useCallback(()=>{
  if(countInTimer.current!==null){window.clearTimeout(countInTimer.current);countInTimer.current=null}setCountIn(false);setAutoFollow(false);releaseCurrentChord();
 },[releaseCurrentChord]);
 const toggleProgression=async()=>{
  if(autoFollow||countIn){stopPlayback();return}
  const engine=await ensureHarmonyAudio();releaseCurrentChord();setActive(0);setChoice(null);onSelectPc(chords[0]?.bass??current.bass);onSetChord(chords[0]?.symbol??current.symbol);const group=engine.ctx.createGain(),beatSeconds=60/tempo,start=engine.ctx.currentTime+.045;group.gain.value=1;group.connect(engine.output);engine.current=group;for(let beatIndex=0;beatIndex<4;beatIndex++)scheduleCountClick(engine.ctx,start+beatIndex*beatSeconds,beatIndex===0,group);setCountIn(true);countInTimer.current=window.setTimeout(()=>{countInTimer.current=null;setCountIn(false);setAutoFollow(true)},Math.round(beatSeconds*4*1000)+55);
 };

 const activate=(index:number)=>{
  const chord=chords[index];if(!chord)return;setActive(index);setChoice(null);onSelectPc(chord.bass);onSetChord(chord.symbol);if(!autoFollow&&!countIn)void playChordAudio(chord,1,tempo);
 };
 const applyPreset=(id:string)=>{
  const preset=PROGRESSION_PRESETS.find(x=>x.id===id);if(!preset)return;stopPlayback();const text=preset.chords.join(" | ");setPresetId(id);setDraft(text);setApplied(text);setCentre(preset.center);setLens(preset.lens);setBandStyle(PRESET_BAND_STYLE[id]||"pocket");setActive(0);setChoice(null);setApplyError("");onSelectPc(null);onSetRoot(preset.center);onSetMode(preset.homeMode);onSetChord(preset.chords[0]);
 };
 const applyCustom=()=>{
  const result=parseProgression(draft),fatal=result.chords.some(x=>x.rootName==="?");
  if(!result.chords.length||fatal){setApplyError("Enter at least one readable chord. Separate chords with | — for example Dm9 | G13 | Cmaj9.");return}
  stopPlayback();setApplied(draft);setPresetId("custom");setActive(0);setChoice(null);setApplyError(result.errors.length?"The progression loaded, but check the highlighted symbol warning.":"");onSelectPc(null);onSetRoot(centre);onSetChord(result.chords[0].symbol);
 };
 useEffect(()=>{harmonyLevelRef.current=harmonyLevel;const engine=harmonyAudio.current;if(engine&&engine.ctx.state!=="closed")engine.output.gain.setTargetAtTime(harmonyLevel/100*.56,engine.ctx.currentTime,.025)},[harmonyLevel]);
 useEffect(()=>{bandStyleRef.current=bandStyle},[bandStyle]);
 useEffect(()=>{bandMixRef.current=bandMix},[bandMix]);
 useEffect(()=>{if(autoFollow)void playChordAudio(current,barsPerChord,tempo,true)},[autoFollow,current,barsPerChord,tempo,playChordAudio]);
 useEffect(()=>{
  if(!autoFollow||!chords.length)return;
  const timer=window.setTimeout(()=>{const index=(active+1)%chords.length,chord=chords[index];if(index===active)void playChordAudio(chord,barsPerChord,tempo,true);else{setActive(index);setChoice(null)}onSelectPc(chord.bass);onSetChord(chord.symbol)},durationMs);
  return()=>window.clearTimeout(timer);
 },[autoFollow,active,chords,durationMs,barsPerChord,tempo,onSelectPc,onSetChord,playChordAudio]);
 useEffect(()=>()=>{if(countInTimer.current!==null)window.clearTimeout(countInTimer.current);const engine=harmonyAudio.current;if(engine&&engine.ctx.state!=="closed")void engine.ctx.close();harmonyAudio.current=null},[]);

 const chordFormula=current.intervals.map(iv=>intervalLabel(iv,current)),chordNotes=current.intervals.map(iv=>spellChordNote(current,iv)),selectedName=current.intervals.includes(selectedIv)?spellChordNote(current,selectedIv):PITCH_NAMES[selected],selectedDestinationName=next.intervals.includes(mod(selectedDestination-next.root))?spellChordNote(next,selectedDestination-next.root):PITCH_NAMES[selectedDestination],viewLabels:[[string,string],[string,string],[string,string],[string,string]]=[
  ["priority","PRIORITY"],["degree","DEGREE"],["note","NOTE"],["voice","TO NEXT"],
 ],filterLabels:[[number,string],[number,string],[number,string],[number,string],[number,string]]=[
  [0,"ALL 12"],[1,"MODE"],[2,"RECOMMENDED"],[3,"ESSENTIALS"],[4,"BLIND TEST"],
 ],rangeLabels:[[NeckRange,string],[NeckRange,string],[NeckRange,string],[NeckRange,string]]=[
  ["low","LOW · 0–12"],["middle","MIDDLE · 5–15"],["high","HIGH · 10–20"],["full","FULL · 0–20"],
 ];
 const cellText=(pc:number,role:ReturnType<typeof classifyNote>)=>actualDisplay==="note"?PITCH_NAMES[pc]:actualDisplay==="degree"?intervalLabel(pc-current.root,current):actualDisplay==="voice"?`→${PITCH_NAMES[nearestTarget(pc,next)]}`:role.short;
 const visible=(role:ReturnType<typeof classifyNote>)=>filter===0||filter===1&&!["approach","outside"].includes(role.id)||filter===2&&role.rank<=6||filter===3&&role.rank<=3||filter===4;

 return <div className="osScreen harmonyFretboard">
  <section className="hfIntro"><div><span>{"HARMONY-AWARE FRETBOARD"}</span>{embedded?<h2>{"See what matters now."}</h2>:<h1 data-page-heading tabIndex={-1}>{"See what matters now."}</h1>}<p>{"Choose a progression, move through its chords and watch every fret change job. The map ranks bass note, root, guide tones, written tensions, modal colour, voice-leading targets and controlled outside routes—it does not pretend one scale is the only answer."}</p></div><aside><small>{"CURRENT DECISION"}</small><b dir="ltr">{current.symbol}</b><span>{PITCH_NAMES[current.root]} {selectedScale.name}</span><em>{selectedRecommendation.score}% {"FIT"}</em></aside></section>

  <section className="hfBuilder">
   <header><div><span>{"01 · CHOOSE THE HARMONIC STORY"}</span><h2>{"Progression first. Scale second."}</h2></div><p>{"The same G7 can ask for Mixolydian, Lydian dominant, diminished or altered language depending on its spelling and destination."}</p></header>
   <div className="hfBuilderControls">
    <label><span>{"PROGRESSION LIBRARY"}</span><select value={presetId} onChange={e=>e.target.value!=="custom"&&applyPreset(e.target.value)}><option value="custom">{"Custom progression"}</option>{PROGRESSION_PRESETS.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
    <label><span>{"TONAL CENTRE"}</span><select value={centre} onChange={e=>{const value=+e.target.value;setCentre(value);onSetRoot(value)}}>{PITCH_NAMES.map((note,i)=><option value={i} key={note}>{note}</option>)}</select></label>
    <label><span>{"HOME FIELD"}</span><select value={homeMode} onChange={e=>onSetMode(+e.target.value)}>{HOME_FIELDS.map((name,i)=><option value={i} key={name}>{name}</option>)}</select></label>
    <label><span>{"DECISION LENS"}</span><select value={lens} onChange={e=>setLens(e.target.value)}><option value="functional">{"Functional / directional"}</option><option value="modal">{"Modal / one centre"}</option><option value="modern">{"Modern / colour-first"}</option></select></label>
   </div>
   <div className="hfCustomInput"><label><span>{"EDIT OR PASTE CHORD SYMBOLS"}</span><input dir="ltr" value={draft} onChange={e=>{setDraft(e.target.value);setPresetId("custom")}} onKeyDown={e=>e.key==="Enter"&&applyCustom()} aria-label="Chord progression"/></label><button type="button" onClick={applyCustom}>{"ANALYZE PROGRESSION →"}</button></div>
   <p className="hfInputHelp">{"Understands: maj9 · m11 · mMaj9 · 13sus4 · 7alt · 13♭9 · m7♭5 · dim7 · maj7♯5 · slash bass. Literal extension rule: 13 includes 7, 9, 11 and 13; C(13) adds only 13. Separate up to 12 chords with |."}</p>
   {(applyError||current.error)&&<p className="hfError">{applyError||"The main chord structure loaded, but review this symbol’s spelling."}</p>}
   <nav className="hfChordRail" aria-label={"Chord progression"}>{chords.map((chord,i)=><button type="button" onClick={()=>activate(i)} className={active===i?"active":i===(active+1)%chords.length?"next":""} key={`${chord.symbol}-${i}`}><small>{active===i?"NOW":i===(active+1)%chords.length?"NEXT":`${i+1}`}</small><b dir="ltr">{chord.symbol}</b><span>{PITCH_NAMES[chord.bass]} {"in bass"}</span></button>)}</nav>
  </section>

  <section className="hfCurrent">
   <article className="hfChordDecode"><span>{"02 · DECODE THE CURRENT CHORD"}</span><div><b dir="ltr">{current.symbol}</b><small>{FAMILY_NAMES[current.family]}</small></div><p>{familyJob(current.family)}</p><dl><div><dt>{"FORMULA"}</dt><dd dir="ltr">{chordFormula.join(" · ")}</dd></div><div><dt>{"NOTES"}</dt><dd dir="ltr">{chordNotes.join(" · ")}</dd></div><div><dt>{"BASS ORDER"}</dt><dd>{current.bass===current.root?`${PITCH_NAMES[current.root]} · ROOT POSITION`:`${PITCH_NAMES[current.bass]} · SLASH BASS (upper root ${PITCH_NAMES[current.root]})`}</dd></div></dl><button type="button" className="hfChordPreview" disabled={autoFollow||countIn} onClick={()=>void playChordAudio(current,1,tempo)}>▶ {"HEAR THIS COMPLETE CHORD"}</button></article>
   <article className="hfAutoFollow"><span>{"HANDS-FREE BASS BACKING BAND"}</span><h3>{countIn?"Four beats. Get your hands ready.":autoFollow?"The band is playing. You are the bassist.":"One Start. A complete band behind you."}</h3><div className="hfTimingControls"><label>{"TEMPO"}<input type="number" min="35" max="220" disabled={autoFollow||countIn} value={tempo} onChange={e=>setTempo(Math.max(35,Math.min(220,+e.target.value||80)))}/></label><label>{"BARS / CHORD"}<select disabled={autoFollow||countIn} value={barsPerChord} onChange={e=>setBarsPerChord(+e.target.value)}><option value="1">1</option><option value="2">2</option><option value="4">4</option></select></label></div><label className="hfBandStyle"><span>{"BAND FEEL"}</span><select disabled={autoFollow||countIn} value={bandStyle} onChange={e=>setBandStyle(e.target.value as BandStyleId)}>{BAND_STYLES.map(style=><option value={style.id} key={style.id}>{style.name}</option>)}</select><small>{selectedBandStyle.feel}</small></label><div className="hfBandMixer"><header><span>{"BAND MIXER"}</span><b>{"NO BASSLINE — THAT IS YOUR PART"}</b></header><div>{(["drums","keys","guitar","cue"] as const).map((track,index)=>{const label=["DRUMS","KEYS / CHORDS","RHYTHM GUITAR","CHANGE CUE"][index];return <button type="button" disabled={autoFollow||countIn} aria-pressed={bandMix[track]} className={bandMix[track]?"active":""} onClick={()=>setBandMix(value=>({...value,[track]:!value[track]}))} key={track}><i>{bandMix[track]?"●":"○"}</i><span>{label}</span></button>})}</div></div><label className="hfHarmonyLevel"><span>{"BAND VOLUME"}</span><input type="range" min="0" max="100" value={harmonyLevel} onChange={e=>setHarmonyLevel(+e.target.value)}/><b>{harmonyLevel}%</b></label><div className="hfSounding"><small>{`${selectedBandStyle.name.toUpperCase()} · FULL VOICING NOW`}</small><b dir="ltr">{current.symbol} · {chordNotes.join(" · ")}</b><span>{`Drums hold the grid; keys state all ${current.intervals.length} written tones; rhythm guitar supplies movement. The optional change cue names ${current.bassName}, but never plays a bassline.`}</span></div><button type="button" className={autoFollow||countIn?"stop":""} onClick={()=>void toggleProgression()}>{countIn?"■ CANCEL COUNT-IN":autoFollow?"■ STOP FULL BAND":"▶ PLAY FULL BAND BACKING TRACK"}</button><p>{countIn?`Then the band enters together on ${chords[0]?.symbol||current.symbol}.`:`Next change: ${next.symbol} after ${barsPerChord} bar${barsPerChord===1?"":"s"}. Click any chord above to jump without stopping.`}</p><small className="hfHeadphoneNote">{"HEADPHONES / AUDIO INTERFACE RECOMMENDED FOR CLEAN PITCH DETECTION"}</small>{(autoFollow||countIn)&&<i className="hfAutoPulse" style={{animationDuration:`${countIn?Math.round(60000/tempo*4):durationMs}ms`}}/>}</article>
  </section>

  <section className="hfModes">
   <header><div><span>{"03 · RANKED CHORD-SCALE OPTIONS"}</span><h2>{"Several can be correct. Their jobs are different."}</h2></div><p>{"Percentages rank literal chord fit, tonal-centre overlap and connection into the next chord. They are guidance—not a law that replaces your ear."}</p></header>
   <div>{recommendations.map((recommendation,i)=>{const chosen=recommendation.scale.id===selectedScale.id;return <article className={chosen?"active":""} key={recommendation.scale.id}><button className="hfModeSelect" type="button" onClick={()=>setChoice({key:currentKey,scale:recommendation.scale.id})}><small>{i===0?"BEST STARTING POINT":i===1?"CONTEXT OPTION":"ALTERNATIVE COLOUR"}</small><b>{PITCH_NAMES[current.root]} {recommendation.scale.name}</b><strong>{recommendation.score}%</strong><code dir="ltr">{recommendation.scale.formula}</code><p>{recommendation.reason} {recommendation.scale.use}</p><span className="hfWorking">{(()=>{
     const total=current.intervals.length,covered=total-recommendation.missing.length;
     return <>
      <em className={recommendation.missing.length?"short":""}>{covered}/{total} chord tones</em>
      {recommendation.missing.length>0&&<em className="short">{"no "}{recommendation.missing.map(iv=>degreeAt(iv).names[0]).join(", ")}</em>}
      <em>{recommendation.contextOverlap}{"/7 shared with the key"}</em>
      {recommendation.commonNext>0&&<em>{recommendation.commonNext}{" lead into the next chord"}</em>}
     </>;
    })()}</span><em>{"WATCH · "}{recommendation.scale.watch}</em></button><button type="button" className="hfHear" onClick={()=>onAudition([...recommendation.scale.intervals.map(iv=>mod(current.root+iv)),current.root],.22,current.root)}>▶ {"HEAR"}</button></article>})}</div>
  </section>

  <section className="hfMapControls"><div><span>{"LABELS"}</span>{viewLabels.map(([value,label])=><button type="button" aria-pressed={actualDisplay===value} className={actualDisplay===value?"active":""} onClick={()=>onDisplayMode(value)} key={value}>{label}</button>)}</div><div><span>{"SHOW"}</span>{filterLabels.map(([value,label])=><button type="button" aria-pressed={filter===value} className={filter===value?"active":""} onClick={()=>onFog(value)} key={value}>{label}</button>)}</div><div><span>{"NECK AREA"}</span>{rangeLabels.map(([value,label])=><button type="button" aria-pressed={neckRange===value} className={neckRange===value?"active":""} onClick={()=>setNeckRange(value)} key={value}>{label}</button>)}</div></section>

  <section className={`hfNeckSection ${filter===4?"blind":""}`}>
   <header><div><span>{"04 · THE NECK RE-RANKED FOR THIS MOMENT"}</span><h2 dir="ltr">{current.symbol} → {next.symbol}</h2></div><p>{"Low register: bass/root/5. Middle register: guide tones and voice leading. Upper register: written tensions and modal colour. The same pitch class can have a different practical weight in each register."}</p></header>
   <div className="hfLegend">{(["bass","root","guide","chord","specified","voice","colour","available","context","approach","outside"] as const).map(id=><span className={`role-${id}`} key={id}><i/>{NOTE_ROLES[id].short}</span>)}</div>
   {listening&&<div className={`hfLive ${livePitch?"hearing":""}`} aria-live="off">
   {livePitch?(()=>{
    const pc=((livePitch.midi%12)+12)%12;
    const role=classifyNote(pc,current,selectedScale,next);
    const inTune=Math.abs(livePitch.cents)<=5;
    return <>
     <div className="hfLiveNote">
      <b dir="ltr">{PITCH_NAMES[pc]}</b>
      <small>{intervalLabel(mod(pc-current.root),current)} of {current.symbol}</small>
     </div>
     {/* A tuner, on the screen where the neck already is. */}
     <div className="hfTuner">
      <i className={`hfNeedle ${inTune?"lit":""}`}
         style={{left:`${Math.max(2,Math.min(98,50+livePitch.cents))}%`}}/>
      <span>♭</span>
      <b className={inTune?"lit":""}>{inTune?"IN TUNE":`${livePitch.cents>0?"+":""}${livePitch.cents}`}</b>
      <span>♯</span>
     </div>
     <div className={`hfLiveRole role-${role.id}`}><i className="hfDot"/><span>{role.short}</span></div>
    </>;
   })():<span className="hfLiveIdle">Listening — play a note and the neck will show where you are.</span>}
  </div>}

  <div className="hfBoardWrap"><div className="hfBoard" style={{minWidth:`${Math.max(780,visibleFrets.length*72+70)}px`}}><div className="hfFretNumbers" style={{gridTemplateColumns:`58px repeat(${visibleFrets.length}, minmax(64px, 1fr))`}}><b>{"STRING"}</b>{visibleFrets.map(f=><span className={[3,5,7,9,12,15,17,19].includes(f)?"marked":""} key={f}>{f}<i/></span>)}</div>{STRINGS.map((string,stringIndex)=><div className={`hfString string-${stringIndex}`} style={{gridTemplateColumns:`58px repeat(${visibleFrets.length}, minmax(64px, 1fr))`}} key={string.name}><b>{string.name}<small>{"STRING"}</small></b>{visibleFrets.map(fret=>{const pc=mod(string.open+fret),role=classifyNote(pc,current,selectedScale,next),show=visible(role),picked=selected===pc,destination=selectedDestination===pc;const under=heardAt.has(`${stringIndex}:${fret}`),sounding=heardPc===pc&&!under;return <button type="button" aria-pressed={picked} aria-label={`${string.name} string fret ${fret}: ${PITCH_NAMES[pc]}, ${role.label}${under?", playing now":""}`} onClick={()=>onSelectPc(pc)} className={`role-${role.id} ${show?"visible":"hidden"} ${picked?"picked":""} ${destination?"destination":""} ${under?"under":""} ${sounding?"sounding":""}`} key={fret}><i/><b dir="ltr">{filter===4?"?":cellText(pc,role)}</b><small dir="ltr">{filter===4?"":PITCH_NAMES[pc]}</small></button>})}</div>)}</div></div>
  </section>

  <section className="hfNoteTutor">
   <div className={`hfRoleBadge role-${selectedRole.id}`}><i/><span>{selectedRole.short}</span></div>
   <article><span>{"SELECTED NOTE"}</span><h2>{selectedName} <small dir="ltr">{intervalLabel(selectedIv,current)} {"over"} {current.symbol}</small></h2><h3>{selectedRole.label}</h3><p>{selectedRole.why}</p></article>
   <article><span>{"BASS DECISION"}</span><p>{selectedRole.advice}</p><dl><div><dt>{"NEXT TARGET"}</dt><dd>{selectedDestinationName} · {intervalLabel(selectedDestination-next.root,next)} / {next.symbol}</dd></div><div><dt>{"MOVEMENT"}</dt><dd>{Math.min(mod(selectedDestination-selected),mod(selected-selectedDestination))===0?"COMMON TONE":Math.min(mod(selectedDestination-selected),mod(selected-selectedDestination))===1?"SEMITONE PULL":"DIRECTED STEP / LEAP"}</dd></div></dl></article>
   <button type="button" onClick={()=>onAudition([current.root,selected,selectedDestination],.42,current.root)}>▶ {"HEAR: HOME → NOTE → NEXT TARGET"}</button>
  </section>

   <section className="hfVoiceLeading"><header><div><span>{"05 · DO NOT STOP AT THE SCALE"}</span><h2>{"Make the next chord inevitable."}</h2></div><p>{"These are the smallest useful routes between bass notes, roots, 3rds and 7ths. Choose one before adding chromatic decoration."}</p></header><div className="hfVoiceGrid">{paths.map((path,i)=><button type="button" onClick={()=>onAudition([path.from,path.to],.55,current.root)} key={`${path.from}-${path.to}-${i}`}><small>{i===0?"SHORTEST ROUTE":"VOICE OPTION"}</small><b dir="ltr">{current.intervals.includes(mod(path.from-current.root))?spellChordNote(current,path.from-current.root):PITCH_NAMES[path.from]} <i>{path.distance===0?"=":path.distance>0?`+${path.distance}`:path.distance}</i> {next.intervals.includes(mod(path.to-next.root))?spellChordNote(next,path.to-next.root):PITCH_NAMES[path.to]}</b><span dir="ltr">{path.fromDegree} / {current.symbol} → {path.toDegree} / {next.symbol}</span></button>)}</div><footer><div><span>{"COMMON TONES"}</span><b>{shared.length?shared.map(pc=>PITCH_NAMES[pc]).join(" · "):"NONE — movement must be audible"}</b></div><div><span>{"PRIMARY BASS LANDING"}</span><b dir="ltr">{next.bassName} · {next.bass===next.root?"ROOT":"SLASH ORDER"}</b></div><button type="button" onClick={()=>onAudition(paths.flatMap(path=>[path.from,path.to]),.32,current.root)}>▶ {"HEAR ALL ROUTES"}</button></footer></section>
 </div>;
}

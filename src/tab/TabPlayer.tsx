import {type CSSProperties,useEffect,useRef,useState} from "react";
import {type Degree,degreeAt} from "../theory/degrees";
import {noteName} from "./notation";
import * as alphaTab from "@coderline/alphatab";
import soundFontUrl from "@coderline/alphatab/soundfont/sonivox.sf3?url";
import bravuraUrl from "@coderline/alphatab/font/Bravura.woff2?url";

export type TabSource=
 /** An exercise authored in alphaTex, stored as text in the repo. */
 |{kind:"tex";tex:string}
 /** An uploaded Guitar Pro or MusicXML file. */
 |{kind:"file";data:ArrayBuffer;name:string};

type Props={
 source:TabSource;
 /** Shown above the transport; the exercise's own title. */
 title?:string;
 /** Practice material usually wants to loop from the start. */
 initialLooping?:boolean;
 /**
  * Concert pitch the exercise is rooted on. Given one, the reader can name
  * each note's function as it sounds rather than only showing where it is.
  */
 root?:number;
};

/**
 * Ticks in a bar of the given time signature.
 *
 * alphaTab counts a quarter note as 960 ticks, so a bar is its beat count
 * scaled by how long each beat is.
 */
const QUARTER=960;
const barTicks=(numerator:number,denominator:number)=>numerator*(4/denominator)*QUARTER;

/** Milliseconds as m:ss, for the transport readout. */
const clock=(ms:number)=>{
 const total=Math.max(0,Math.round(ms/1000));
 return `${Math.floor(total/60)}:${String(total%60).padStart(2,"0")}`;
};

/**
 * alphaTab draws the score in its own fixed palette, which is black ink for
 * print. Read the page's own tokens instead, so the notation belongs to
 * whichever ground the reader has chosen rather than sitting on a white card.
 */
function scoreColours(){
 const style=getComputedStyle(document.documentElement);
 const token=(name:string,fallback:string)=>style.getPropertyValue(name).trim()||fallback;
 const ink=token("--ink","#f4f2ee");
 return {
  mainGlyphColor:ink,
  secondaryGlyphColor:token("--ink-3","#9b9ba1"),
  staffLineColor:token("--rule","#2a2a2e"),
  barSeparatorColor:token("--ink-3","#9b9ba1"),
  barNumberColor:token("--accent","#c8ff00"),
  scoreInfoColor:ink,
 };
}

/** Bass strings from the top line of the tab down, which is how tab is read. */
const STRING_NAMES=["G","D","A","E"];

type StringLabel={key:string;name:string;top:number;left:number};

/**
 * Work out where to write the string names.
 *
 * alphaTab draws the staves but never names the strings on them, so the lines
 * are found in the rendered output: horizontal rules, grouped by how close
 * together they sit. A group of five is the notated stave and is left alone; a
 * group of four is a bass tab stave and gets its strings named. Anything that
 * does not match is skipped rather than guessed at, so an unusual score simply
 * goes unlabelled instead of being mislabelled.
 */
function stringLabels(stage:HTMLElement):StringLabel[]{
 const origin=stage.getBoundingClientRect();
 const rules=[...stage.querySelectorAll("rect,path,line")]
  .map(element=>{
   const box=element.getBoundingClientRect();
   return {y:box.y,x:box.x,width:box.width,height:box.height};
  })
  // Stave lines are wide and hairline-thin; note glyphs and stems are not.
  .filter(box=>box.width>=40&&box.height<=3.5)
  .sort((a,b)=>a.y-b.y);

 const systems:Array<typeof rules>=[];
 for(const rule of rules){
  const current=systems[systems.length-1];
  if(current&&rule.y-current[current.length-1].y<=20)current.push(rule);
  else systems.push([rule]);
 }

 const labels:StringLabel[]=[];
 systems.forEach((system,index)=>{
  // Overlapping elements can draw the same line twice.
  const lines:number[]=[];
  for(const rule of system)if(!lines.some(y=>Math.abs(y-rule.y)<1))lines.push(rule.y);
  if(lines.length!==STRING_NAMES.length)return;
  const left=Math.min(...system.map(rule=>rule.x))-origin.left;
  lines.forEach((y,line)=>{
   labels.push({key:`${index}-${line}`,name:STRING_NAMES[line],top:y-origin.top,left});
  });
 });
 return labels;
}

/**
 * Interactive tab reader.
 *
 * Rendering, Guitar Pro import and the synthesiser all come from alphaTab; what
 * is built here is the practice loop around them — a speed control that goes
 * down to half tempo, a count-in, a metronome, and bar looping, which is how
 * these exercises are actually meant to be worked.
 *
 * Loaded lazily: the engine is about 1.1MB and the soundfont another 0.9MB, and
 * neither is needed until a learner opens a tab.
 */
export default function TabPlayer({source,title,initialLooping=false,root}:Props){
 const host=useRef<HTMLDivElement>(null);
 const viewport=useRef<HTMLDivElement>(null);
 const api=useRef<alphaTab.AlphaTabApi|null>(null);

 const [ready,setReady]=useState(false);
 const [error,setError]=useState("");
 const [playing,setPlaying]=useState(false);
 /*
  * Tempo, not a percentage.
  *
  * The transport used to offer "80%", which is not a number anybody practises
  * to. Every exercise carries the tempo it is written at, so the control works
  * in beats per minute and converts to the ratio the engine wants.
  */
 const [bpm,setBpm]=useState(0);
 // The tempo the exercise is written at, read from the score once it loads.
 // The BPM control is relative to this, and the engine wants a ratio.
 const [written,setWritten]=useState(0);
 const [bars,setBars]=useState(0);
 const [loopFrom,setLoopFrom]=useState(1);
 const [loopTo,setLoopTo]=useState(0);
 const [looping,setLooping]=useState(initialLooping);
 const [metronome,setMetronome]=useState(false);
 const [countIn,setCountIn]=useState(true);
 const [soundFontProgress,setSoundFontProgress]=useState(0);
 const [position,setPosition]=useState({current:0,total:0});
 // While a finger is on the slider the incoming position updates are ignored,
 // so the handle does not fight the playhead it is being dragged away from.
 const [scrubbing,setScrubbing]=useState<number|null>(null);
 const [sounding,setSounding]=useState<{name:string;degree:Degree}[]>([]);
 const [labels,setLabels]=useState<StringLabel[]>([]);
 const stage=useRef<HTMLDivElement>(null);
 // The engine is created once; the root can change when the caller swaps
 // exercise, so the beat handler reads it through a ref rather than closing
 // over the value it was built with.
 const rootRef=useRef(root);
 rootRef.current=root;

 // One engine per mounted player. Re-created only if the host element changes.
 useEffect(()=>{
  if(!host.current)return;
  const instance=new alphaTab.AlphaTabApi(host.current,{
   core:{
    // The worker and worklet are wired by the vite plugin, but the music font is
    // not: alphaTab derives its own font directory from the script location,
    // which points into vite's pre-bundle cache where no font exists. Handing it
    // a bundler-resolved URL sidesteps that guess entirely.
    smuflFontSources:new Map([[alphaTab.FontFileFormat.Woff2,bravuraUrl]]),
    // Exercises are a handful of bars. Lazy loading only pays off on full
    // scores, and it leaves the staves blank whenever the intersection
    // observer behind it does not fire — a bad trade here.
    enableLazyLoading:false,
    logLevel:alphaTab.LogLevel.Warning,
   },
   display:{
    // Bass is read from tab; the notated stave is the reference above it.
    staveProfile:alphaTab.StaveProfile.ScoreTab,
    layoutMode:alphaTab.LayoutMode.Page,
    resources:scoreColours(),
   },
   notation:{
    // alphaTab's tuning block lists the strings low-to-high across a two-column
    // grid, which reads in the opposite direction to the stave right beside it.
    // The strings are named down the left of the tab instead, where tab
    // software puts them and where they line up with what they describe.
    elements:new Map([[alphaTab.NotationElement.GuitarTuning,false]]),
   },
   player:{
    playerMode:alphaTab.PlayerMode.EnabledSynthesizer,
    soundFont:soundFontUrl,
    scrollElement:viewport.current ?? undefined,
    scrollMode:alphaTab.ScrollMode.Continuous,
    enableCursor:true,
    enableUserInteraction:true,
   },
  });
  api.current=instance;
  // Dev-only handle, so the score model can be inspected from the console when
  // checking generated alphaTex against what actually gets built.
  if(import.meta.env.DEV)(window as unknown as {__alphaTab?:unknown}).__alphaTab=instance;

  const onReady=()=>{
   setReady(true);
   const count=instance.score?.masterBars.length??0;
   setBars(count);
   setWritten(Math.round(instance.score?.tempo??0));
   setLoopFrom(1);
   setLoopTo(count);
  };
  const onPlayerState=(args:{state:number})=>setPlaying(args.state===alphaTab.synth.PlayerState.Playing);
  const onSoundFont=(e:{loaded:number;total:number})=>setSoundFontProgress(e.total?e.loaded/e.total:0);
  const onPosition=(e:{currentTime:number;endTime:number})=>setPosition({current:e.currentTime,total:e.endTime});
  /*
   * Naming what is sounding.
   *
   * The reader already knows every pitch it plays; until now it only showed
   * where to put a finger. Given the exercise root it can say what each note
   * is doing — which is the difference between reading a tab and hearing a
   * function.
   */
  const onBeat=(beat:{notes?:{realValue:number}[]})=>{
   if(rootRef.current===undefined)return;
   const notes=beat?.notes??[];
   setSounding(notes.map(note=>({
    name:noteName(note.realValue).replace(/\d+$/,""),
    degree:degreeAt(note.realValue-rootRef.current!),
   })));
  };
  const onError=(e:Error)=>setError(e?.message||"The tab could not be rendered.");
  // postRenderFinished fires once everything is placed, which is the only point
  // at which the stave lines can be measured.
  const onPlaced=()=>{if(stage.current)setLabels(stringLabels(stage.current))};

  instance.renderFinished.on(onReady);
  instance.playerStateChanged.on(onPlayerState as never);
  instance.soundFontLoad.on(onSoundFont as never);
  instance.playerPositionChanged.on(onPosition as never);
  instance.playedBeatChanged.on(onBeat as never);
  instance.error.on(onError as never);
  instance.postRenderFinished.on(onPlaced);

  // A narrower pane re-flows the score, which moves every line.
  const observer=new ResizeObserver(()=>{if(stage.current)setLabels(stringLabels(stage.current))});
  if(stage.current)observer.observe(stage.current);

  return()=>{
   observer.disconnect();
   instance.destroy();
   api.current=null;
  };
 },[]);

 /**
  * Empty the drawing surface.
  *
  * Every render appends a fresh set of partial images rather than replacing
  * the ones already there, so anything that re-renders an existing engine has
  * to clear up after the previous pass or the score stacks on top of itself.
  */
 const clearSurface=()=>{
  host.current?.querySelectorAll(".at-surface").forEach(surface=>{surface.innerHTML=""});
 };

 // Load whatever the caller handed us. Keyed on the content rather than the
 // object, so a parent re-render does not re-parse the score and restart the
 // learner's playback underneath them.
 const sourceKey=source.kind==="tex"?source.tex:`${source.name}:${source.data.byteLength}`;
 useEffect(()=>{
  const instance=api.current;
  if(!instance)return;
  setReady(false);
  setError("");
  setPosition({current:0,total:0});
  setBpm(0);
  setSounding([]);
  setLabels([]);
  clearSurface();
  try{
   if(source.kind==="tex")instance.tex(source.tex);
   else instance.load(new Uint8Array(source.data));
  }catch(cause){
   setError(cause instanceof Error?cause.message:"That file could not be read.");
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[sourceKey]);

 /*
  * The ground no longer changes, so nothing re-inks the score after it is
  * built. The colours are applied once in the constructor from scoreColours();
  * the effect that used to watch a theme signal and re-render the whole surface
  * on every flip is gone with the second ground it existed for.
  */


 // Transport settings the learner changes while the engine is already running.
 useEffect(()=>{
  const instance=api.current;
  if(!instance||!written)return;
  instance.playbackSpeed=(bpm||written)/written;
 },[bpm,written]);

 /*
  * Loop a range of bars rather than the whole exercise.
  *
  * Practice happens on the two bars that are failing. The engine has supported
  * a playback range all along; nothing exposed it.
  */
 useEffect(()=>{
  const instance=api.current;
  if(!instance||!bars)return;
  const masterBars=instance.score?.masterBars;
  if(!masterBars?.length)return;
  const wholePiece=loopFrom<=1&&loopTo>=bars;
  if(wholePiece){instance.playbackRange=null;return}
  const first=masterBars[Math.max(0,loopFrom-1)];
  const last=masterBars[Math.min(masterBars.length-1,loopTo-1)];
  const after=masterBars[loopTo];
  instance.playbackRange={
   startTick:first.start,
   endTick:after?after.start:last.start+barTicks(last.timeSignatureNumerator,last.timeSignatureDenominator),
  };
 },[loopFrom,loopTo,bars]);
 useEffect(()=>{if(api.current)api.current.isLooping=looping},[looping]);
 useEffect(()=>{if(api.current)api.current.metronomeVolume=metronome?1:0},[metronome]);
 useEffect(()=>{if(api.current)api.current.countInVolume=countIn?1:0},[countIn]);

 const loadingSoundFont=soundFontProgress>0&&soundFontProgress<1;

 // Where the handle sits: the dragged value while scrubbing, the playhead
 // otherwise.
 const shown=scrubbing??position.current;
 const seek=(to:number)=>{
  if(api.current)api.current.timePosition=to;
  setPosition(previous=>({...previous,current:to}));
 };

 return (
  <section className="tabPlayer" aria-label={title?`Tab: ${title}`:"Tab"}>
   <header className="tabBar">
    <button
     className="action-primary tabPlay"
     onClick={()=>api.current?.playPause()}
     disabled={!ready}
     aria-label={playing?"Pause":"Play"}
    >
     {playing?"❚❚":"▶"} <span>{playing?"Pause":"Play"}</span>
    </button>

    <button className="action action-quiet" onClick={()=>api.current?.stop()} disabled={!ready}>
     Stop
    </button>

    {written>0&&(
     <div className="tabTempo">
      <span className="label">Tempo</span>
      <button type="button" onClick={()=>setBpm(Math.max(30,(bpm||written)-4))} aria-label="Slower">−</button>
      <b className="mono">{bpm||written}<small>BPM</small></b>
      <button type="button" onClick={()=>setBpm(Math.min(Math.round(written*1.2),(bpm||written)+4))} aria-label="Faster">+</button>
      {bpm>0&&bpm!==written&&(
       <button type="button" className="tabToggle" onClick={()=>setBpm(written)}>written {written}</button>
      )}
     </div>
    )}

    <div className="tabToggles">
     <button className={`tabToggle ${looping?"on":""}`} aria-pressed={looping} onClick={()=>setLooping(v=>!v)}>Loop</button>
     <button className={`tabToggle ${metronome?"on":""}`} aria-pressed={metronome} onClick={()=>setMetronome(v=>!v)}>Click</button>
     <button className={`tabToggle ${countIn?"on":""}`} aria-pressed={countIn} onClick={()=>setCountIn(v=>!v)}>Count-in</button>
    </div>
   </header>

   {bars>1&&(
    <div className="tabLoopRange">
     <span className="label">Loop bars</span>
     <label>
      <span className="sr">From bar</span>
      <select value={loopFrom} onChange={e=>{const v=Number(e.target.value);setLoopFrom(v);if(v>loopTo)setLoopTo(v)}}>
       {Array.from({length:bars},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}
      </select>
     </label>
     <i aria-hidden="true">to</i>
     <label>
      <span className="sr">To bar</span>
      <select value={loopTo} onChange={e=>{const v=Number(e.target.value);setLoopTo(v);if(v<loopFrom)setLoopFrom(v)}}>
       {Array.from({length:bars},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}
      </select>
     </label>
     {(loopFrom>1||loopTo<bars)&&(
      <button type="button" className="tabToggle" onClick={()=>{setLoopFrom(1);setLoopTo(bars)}}>whole exercise</button>
     )}
    </div>
   )}

   <div className="tabSeek">
    <span className="tabTime mono">{clock(shown)}</span>
    <input
     type="range"
     className="tabScrub"
     min={0}
     max={Math.max(position.total,1)}
     step={10}
     value={Math.min(shown,position.total||1)}
     disabled={!ready||!position.total}
     aria-label="Playback position"
     aria-valuetext={`${clock(shown)} of ${clock(position.total)}`}
     // Dragging updates the handle continuously but only seeks on release, so
     // the synthesiser is not asked to jump on every pixel of the drag.
     onChange={event=>setScrubbing(Number(event.target.value))}
     onPointerUp={()=>{if(scrubbing!==null){seek(scrubbing);setScrubbing(null)}}}
     onKeyUp={()=>{if(scrubbing!==null){seek(scrubbing);setScrubbing(null)}}}
     onBlur={()=>{if(scrubbing!==null){seek(scrubbing);setScrubbing(null)}}}
     style={{"--played":`${position.total?Math.min(shown/position.total,1)*100:0}%`} as CSSProperties}
    />
    <span className="tabTime mono dim">{clock(position.total)}</span>
   </div>

   {root!==undefined&&(
    <p className="nowSounding" role="status" aria-live="off">
     {sounding.length===0
      ?<span className="dim">Press play to hear each note named as it sounds.</span>
      :sounding.map((note,i)=>(
       <span key={i} className="soundingNote">
        <b>{note.name}</b>
        <i>{note.degree.names[0]}</i>
        <small>{note.degree.label}</small>
       </span>
      ))}
    </p>
   )}

   {error&&<p className="tabError" role="alert">{error}</p>}
   {loadingSoundFont&&(
    <p className="tabLoading" role="status">
     Loading instrument… {Math.round(soundFontProgress*100)}%
    </p>
   )}
   {!ready&&!error&&<p className="tabLoading" role="status">Setting the score…</p>}

   <div className="tabViewport" ref={viewport}>
    <div className="tabStage" ref={stage}>
     <div ref={host}/>
     <div className="tabStrings" aria-hidden="true">
      {labels.map(label=>(
       <span key={label.key} style={{top:`${label.top}px`,left:`${label.left}px`}}>{label.name}</span>
      ))}
     </div>
    </div>
   </div>
  </section>
 );
}

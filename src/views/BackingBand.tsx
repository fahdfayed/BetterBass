import {MODES} from "../harmony-fretboard-data";
import {NOTE_NAMES as N} from "../pitch";

const STYLES=["Psychedelic","Funk","Grunge","Fusion","Ambient","Reggae","Disco"];
const METERS=[3,4,5,7];
const CLICK_PLACEMENTS=["Every beat","2 & 4","Beat 4","Every 2 bars","Disappearing"];
const DENSITIES:[number,string][]=[[1,"Sparse"],[2,"Medium"],[3,"Full"]];
const WEATHER=["Stable","Darkening","Ambiguous","Increasing tension","Release"];

/** The four functions it is always safe to land on: root, ♭3, 5, ♭7. */
const SAFE_LANDINGS=[0,3,7,10];

const MISSIONS:[string,string][]=[
 ["BARS 1-4","Chord tones only. State the pocket."],
 ["BARS 5-8","Add modal colour without changing rhythm."],
 ["BARS 9-12","One chromatic approach per bar."],
 ["BARS 13-16","Climax, then resolve completely home."],
];

type Props={
 /** Pitch class of home. */
 root:number;
 /** Index into MODES. */
 mode:number;

 // Where the clock currently is. The clock itself belongs to the page.
 playing:boolean;
 bar:number;
 beat:number;
 onToggleBand:()=>void;

 // What the band is playing. Each of these can change mid-song, which is why
 // the page owns them — the audio loop reads them from a ref.
 style:string;         onStyle:(style:string)=>void;
 meter:number;         onMeter:(meter:number)=>void;
 bpm:number;           onBpm:(bpm:number)=>void;
 clickMode:string;     onClickMode:(mode:string)=>void;
 density:number;       onDensity:(density:number)=>void;
 weather:string;       onWeather:(weather:string)=>void;
 /** Four bars, each a semitone offset from home. */
 progression:number[]; onProgression:(progression:number[])=>void;

 onRandomise:()=>void;
};

/**
 * A band that keeps playing while you change your mind about it.
 *
 * The point is not accompaniment, it is that the harmony moves underneath the
 * player without warning them. Every readout is written as function against
 * home — NOW, NEXT, SAFE LANDINGS — so that a bar change is something to hear
 * coming rather than something to read off a chart.
 */
export default function BackingBand({
 root,mode,playing,bar,beat,onToggleBand,
 style,onStyle,meter,onMeter,bpm,onBpm,clickMode,onClickMode,
 density,onDensity,weather,onWeather,progression,onProgression,onRandomise,
}:Props){
 const at=(offset:number)=>N[(root+offset+12)%12];
 const nowOffset=progression[bar-1];

 return (
  <div className="osScreen">
   <div className="screenIntro">
    <h1 data-page-heading tabIndex={-1}>Your responsive band.</h1>
    <p>Generate a musical environment, hear the harmony move and practice against a shared sample-accurate clock. The Musical GPS follows every chord change.</p>
   </div>

   <div className="runtimeHero">
    <div className="bandDeck">
     <div className={`pulse ${playing?"playing":""}`}>
      <b>{beat}</b><span>Beat</span><i>{bar}</i><small>BAR</small>
     </div>
     <div>
      <h2>{weather}</h2>
      <p>{style} · {meter}/4 · {bpm} BPM</p>
     </div>
     <button className={playing?"stop":""} onClick={onToggleBand}>
      {playing?"■ STOP BAND":"▶ START BAND"}
     </button>
    </div>
    <div className="runtimeGps">
     <div><small>NOW</small><b>{at(nowOffset)}m7</b></div>
     <div><small>Home</small><b>{N[root]} {MODES[mode].n}</b></div>
     {/* The bar counter is one-based, so bar%4 is already the next one. */}
     <div><small>Next</small><b>{at(progression[bar%4])}m7</b></div>
     <div><small>Safe landings</small>
      <b>{SAFE_LANDINGS.map(x=>at(nowOffset+x)).join(" · ")}</b>
     </div>
    </div>
   </div>

   <div className="runtimeGrid">
    <article className="bandSettings">
     <span>Jam configuration</span>
     <div className="controlGrid">
      <label>STYLE
       <select value={style} onChange={e=>onStyle(e.target.value)}>
        {STYLES.map(x=><option key={x}>{x}</option>)}
       </select>
      </label>
      <label>TIME SIGNATURE
       <select value={meter} onChange={e=>onMeter(+e.target.value)}>
        {METERS.map(x=><option value={x} key={x}>{x}/4</option>)}
       </select>
      </label>
      <label>CLICK PLACEMENT
       <select value={clickMode} onChange={e=>onClickMode(e.target.value)}>
        {CLICK_PLACEMENTS.map(x=><option key={x}>{x}</option>)}
       </select>
      </label>
      <label>HARMONIC DENSITY
       <select value={density} onChange={e=>onDensity(+e.target.value)}>
        {DENSITIES.map(([value,name])=><option value={value} key={value}>{name}</option>)}
       </select>
      </label>
     </div>

     <label className="tempoControl">Tempo <b>{bpm} BPM</b>
      <input type="range" min="45" max="160" value={bpm} onChange={e=>onBpm(+e.target.value)}/>
     </label>

     <div className="progressionBuilder">
      <span>Four-bar harmony</span>
      {progression.map((offset,i)=>(
       <button className={bar===i+1?"active":""} key={i}>
        <small>BAR {i+1}</small>
        <b>{at(offset)}m7</b>
        <em>{offset===0?"Home":offset>0?`+${offset} SEMITONES`:`${offset} SEMITONES`}</em>
       </button>
      ))}
     </div>

     <div className="runtimeActions">
      <button onClick={onRandomise}>⚄ RANDOMIZE MISSION</button>
      <button onClick={()=>onProgression([0,0,0,0])}>Static vamp</button>
      <button onClick={()=>onProgression([0,1,0,0])}>Side-slip curveball</button>
     </div>
    </article>

    <article className="mixer">
     <span>Band mixer</span>
     {([["DRONE","Root + fifth",78],["HARMONY","Electric keys",54],
        ["DRUMS",`${style} kit`,68],["CLICK",clickMode,72]] as [string,string,number][])
      .map(([name,detail,level])=>(
       <div className="channel" key={name}>
        <i className={playing?"live":""}/>
        <div><b>{name}</b><small>{detail}</small></div>
        <input type="range" aria-label={`${name} level`} defaultValue={level}/>
        <span>{level}</span>
       </div>
     ))}
     <div className="weatherMap">
      <span>Harmonic weather</span>
      {WEATHER.map((name,i)=>(
       <button className={weather===name?"active":""} key={name} onClick={()=>onWeather(name)}>
        <i style={{height:`${20+i*14}px`}}/>
        <b>{name}</b>
       </button>
      ))}
     </div>
    </article>
   </div>

   <div className="runtimeMissions">
    <span>Live improvisation mission</span>
    {MISSIONS.map(([bars,brief])=><div key={bars}><b>{bars}</b><p>{brief}</p></div>)}
   </div>
  </div>
 );
}

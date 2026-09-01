"use client";
import {useState} from "react";
import {THEORY_DICTIONARIES,THEORY_DOMAINS} from "./bass-theory-data";
import {MODES} from "./harmony-fretboard-data";
import Formula from "./components/Formula";

const N=["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
/** See the note on HarmonyFretboard: this tool is also a lesson workspace pane. */
type Props={embedded?:boolean;root:number;onSetMode:(mode:number)=>void;onAudition:(notes:number[],hold?:number)=>void};

export default function TheoryReference({embedded=false,root,onSetMode,onAudition}:Props){
 const [theoryDomain,setTheoryDomain]=useState(0),[theoryDictionary,setTheoryDictionary]=useState(0);
 const theory=THEORY_DOMAINS[theoryDomain],dictionary=THEORY_DICTIONARIES[theoryDictionary],ri=root;
 return <div className={`osScreen courseReference theoryEncyclopedia ${""}`} dir={"ltr"}>
  <header>
   <span>{"Complete bass theory reference"}</span>
   {embedded?<h2>{<>The language behind<br/>every bass decision.</>}</h2>:<h1 data-page-heading tabIndex={-1}>{<>The language behind<br/>every bass decision.</>}</h1>}
   <p>{"One reference from first principles to professional musicianship: time, ear, fretboard, harmony, line construction, improvisation, reading, arranging and global musical systems. Open it when a lesson needs an explanation, it is not a second course to complete in order."}</p>
  </header>

  <section className="theoryCoverage" aria-label={"Reference coverage"}>
   {[["18","THEORY DOMAINS"],["72","CONCEPT CLUSTERS"],["5","WORKING DICTIONARIES"],["BASS","FIRST"],["EAR","BEFORE SHAPE"],["PROOF","OVER BROWSING"]].map(([value,label])=><article key={`${value}-${label}`}><b>{value}</b><span>{label}</span></article>)}
  </section>

  <section className="theoryUseFlow">
   <header><h2>{"Theory is not knowledge until it becomes sound and choice."}</h2></header>
   <div>{[
    ["01","HEAR","Recognize the effect without a name or shape."],
    ["02","NAME","State the interval, degree or function."],
    ["03","MAP","Find it in multiple positions and registers."],
    ["04","APPLY","Use it in a groove, song or phrase."],
    ["05","PROVE","Repeat it on command without assistance."],
   ].map(([n,title,description])=><article key={n}><i>{n}</i><b>{title}</b><p>{description}</p></article>)}</div>
  </section>

  <section className="theoryDomainSection">
   <header><h2>{"From reading the first bar to making professional decisions."}</h2><p>{"Do not memorize all 18 at once. Open the domain that explains the problem your ear or hands are facing now."}</p></header>
   <nav className="theoryDomainNav" aria-label={"Bass theory domains"}>{THEORY_DOMAINS.map((domain,i)=><button type="button" className={theoryDomain===i?"active":""} aria-pressed={theoryDomain===i} onClick={()=>setTheoryDomain(i)} key={domain.id}><h3>{domain.title}</h3><p>{domain.aim}</p></button>)}</nav>
  </section>

  <section className="theoryChapter">
   <header className="theoryChapterHead"><div><h2>{theory.title}</h2><p>{theory.aim}</p></div><b>{theory.n}</b></header>
   <article className="theoryCore"><span>{"The central idea"}</span><p>{theory.core}</p></article>
   <div className="theoryConceptGrid">{theory.concepts.map((concept,i)=><article key={concept.formula}><i>{String(i+1).padStart(2,"0")}</i><span>{concept.name}</span><b dir="ltr"><Formula formula={concept.formula}/></b><p>{concept.explain}</p></article>)}</div>
   <div className="theoryEvidence">
    <article><h3>{"Turn it into action"}</h3><p>{theory.bass}</p></article>
    <article><h3>{"Know when knowledge misleads"}</h3><p>{theory.trap}</p></article>
    <article><h3>{"Evidence that you own it"}</h3><p>{theory.proof}</p></article>
   </div>
  </section>

  <section className="theoryDictionary">
   <header><h2>{"Look up the relationship, not only the label."}</h2><p>{`The reference root is currently ${N[ri]}. Change it in the course tools to transpose interval examples instantly.`}</p></header>
   <div className="theoryDictionaryTabs" role="tablist" aria-label={"Theory dictionaries"}>{THEORY_DICTIONARIES.map((item,i)=><button type="button" role="tab" aria-selected={theoryDictionary===i} className={theoryDictionary===i?"active":""} onClick={()=>setTheoryDictionary(i)} key={item.id}>{item.title}</button>)}</div>
   <div className="theoryDictionaryIntro"><div><h3>{dictionary.title}</h3><p>{dictionary.intro}</p></div><b dir="ltr">ROOT · {N[ri]}</b></div>
   <div className="theoryTableWrap"><table><thead><tr>{dictionary.columns.map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{dictionary.rows.map(row=><tr key={`${row.name}-${row.formula}`}><td>{row.name}</td><td dir="ltr"><Formula formula={row.formula}/></td><td>{row.meaning}{row.semitones!==undefined&&<small className="theoryRootExample" dir="ltr">{N[ri]} → {N[(ri+row.semitones)%12]}</small>}</td></tr>)}</tbody></table></div>
  </section>

  <section className="modeReference"><div className="refHead"><span>{"The seven modes · same root"}</span><p>{`Click a row to hear the mode over ${N[ri]}. The characteristic degree is the fastest clue, but it never replaces melodic behavior, phrasing or feel.`}</p></div>{MODES.map((m,i)=><button type="button" onClick={()=>{onSetMode(i);onAudition(m.s.map(x=>(ri+x)%12),.25)}} key={m.n}><b>{m.n}</b><span dir="ltr">{m.f}</span><em dir="ltr">{["3 + 7","NATURAL 6","♭2","♯4","♭7","♭6","♭5 + ♭2"][i]}</em><small>{(["major reference","minor with lift","minor, darkest root rub","major, raised-four colour","major dominant colour","natural minor","m7♭5 environment"])[i]}</small><i>▶</i></button>)}</section>

  <section className="thinkingReference">
   <article><h2>{"One centre has time to develop."}</h2><p>{"Static vamps, pedal tones and slow harmonic rhythm reward characteristic tone, motif, register and colour development."}</p></article>
   <article><h2>{"Chords create directional gravity."}</h2><p>{"Dominants, ii-V-I movement and changing guide tones reward targets, voice leading and resolution over separate scale shapes."}</p></article>
   <article><h2>{"A home centre contains local chord motion."}</h2><p>{"Preserve the larger tonal centre while adjusting structural tones for the chord that is sounding now."}</p></article>
  </section>

  <section className="theoryMastery"><header><h2>{"Five doors. If one stays closed, the idea is not yours yet."}</h2></header><div>{[
   ["01","HEAR IT","Recognize it by sound and in real context."],
   ["02","EXPLAIN IT","State its meaning and function in plain language."],
   ["03","SEE IT","Locate it on the neck, notation and chart."],
   ["04","PLAY IT","Execute it in time from more than one position."],
   ["05","CREATE WITH IT","Choose it, or reject it, for a musical reason."],
  ].map(([n,title,description])=><article key={n}><i>{n}</i><b>{title}</b><p>{description}</p></article>)}</div></section>
 </div>;
}


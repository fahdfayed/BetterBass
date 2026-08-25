"use client";
import {useState} from "react";
import {useEgyptianArabic} from "./EgyptianArabicToggle";
import {THEORY_DICTIONARIES,THEORY_DOMAINS,type LocalText} from "./bass-theory-data";

const N=["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
const MODES=[
 {n:"Ionian",f:"1 2 3 4 5 6 7",s:[0,2,4,5,7,9,11]}, {n:"Dorian",f:"1 2 ♭3 4 5 6 ♭7",s:[0,2,3,5,7,9,10]},
 {n:"Phrygian",f:"1 ♭2 ♭3 4 5 ♭6 ♭7",s:[0,1,3,5,7,8,10]}, {n:"Lydian",f:"1 2 3 ♯4 5 6 7",s:[0,2,4,6,7,9,11]},
 {n:"Mixolydian",f:"1 2 3 4 5 6 ♭7",s:[0,2,4,5,7,9,10]}, {n:"Aeolian",f:"1 2 ♭3 4 5 ♭6 ♭7",s:[0,2,3,5,7,8,10]},
 {n:"Locrian",f:"1 ♭2 ♭3 4 ♭5 ♭6 ♭7",s:[0,1,3,5,6,8,10]}
];
type Props={root:number;onSetMode:(mode:number)=>void;onAudition:(notes:number[],hold?:number)=>void};

export default function TheoryReference({root,onSetMode,onAudition}:Props){
 const [theoryDomain,setTheoryDomain]=useState(0),[theoryDictionary,setTheoryDictionary]=useState(0);
 const egyptian=useEgyptianArabic(),theory=THEORY_DOMAINS[theoryDomain],dictionary=THEORY_DICTIONARIES[theoryDictionary],lt=(value:LocalText)=>egyptian?value.ar:value.en,ri=root;
 return <div data-no-translate className={`osScreen courseReference theoryEncyclopedia ${egyptian?"theoryArabic":""}`} dir={egyptian?"rtl":"ltr"}>
  <header>
   <span>{egyptian?"المرجع الكامل لنظرية الباص":"COMPLETE BASS THEORY REFERENCE"}</span>
   <h1>{egyptian?<>اللغة ورا كل<br/>قرار على الباص.</>:<>The language behind<br/>every bass decision.</>}</h1>
   <p>{egyptian?"مرجع واحد من الأساس للاحتراف: الوقت، الودن، الفريت بورد، الهارموني، بناء الخطوط، الارتجال، القراءة، التوزيع والأنظمة الموسيقية العالمية. ارجعله وقت ما الدرس يحتاج تفسير—مش كورس تاني لازم تخلصه بالترتيب.":"One reference from first principles to professional musicianship: time, ear, fretboard, harmony, line construction, improvisation, reading, arranging and global musical systems. Open it when a lesson needs an explanation—it is not a second course to complete in order."}</p>
  </header>

  <section className="theoryCoverage" aria-label={egyptian?"تغطية المرجع":"Reference coverage"}>
   {[["18",egyptian?"مجال نظري":"THEORY DOMAINS"],["72",egyptian?"مجموعة مفاهيم":"CONCEPT CLUSTERS"],["5",egyptian?"قواميس عملية":"WORKING DICTIONARIES"],[egyptian?"باص":"BASS",egyptian?"الأول":"FIRST"],[egyptian?"ودن":"EAR",egyptian?"قبل الشكل":"BEFORE SHAPE"],[egyptian?"إثبات":"PROOF",egyptian?"مش تصفّح":"OVER BROWSING"]].map(([value,label])=><article key={`${value}-${label}`}><b>{value}</b><span>{label}</span></article>)}
  </section>

  <section className="theoryUseFlow">
   <header><span>{egyptian?"طريقة استخدام أي فكرة":"THE OPERATING SEQUENCE"}</span><h2>{egyptian?"النظرية ما تبقاش معرفة لحد ما تتحول لصوت واختيار.":"Theory is not knowledge until it becomes sound and choice."}</h2></header>
   <div>{[
    ["01",egyptian?"اسمع":"HEAR",egyptian?"ميّز التأثير من غير اسم ولا شكل.":"Recognize the effect without a name or shape."],
    ["02",egyptian?"سمّي":"NAME",egyptian?"قول المسافة أو الدرجة أو الوظيفة.":"State the interval, degree or function."],
    ["03",egyptian?"شوف":"MAP",egyptian?"لاقيها في أكتر من مكان ومنطقة.":"Find it in multiple positions and registers."],
    ["04",egyptian?"طبّق":"APPLY",egyptian?"استخدمها في جروف أو أغنية أو جملة.":"Use it in a groove, song or phrase."],
    ["05",egyptian?"اثبت":"PROVE",egyptian?"كررها عند الطلب من غير مساعدة.":"Repeat it on command without assistance."],
   ].map(([n,title,description])=><article key={n}><i>{n}</i><b>{title}</b><p>{description}</p></article>)}</div>
  </section>

  <section className="theoryDomainSection">
   <header><span>{egyptian?"الخريطة الكاملة · اختار مجال":"THE COMPLETE MAP · CHOOSE A DOMAIN"}</span><h2>{egyptian?"من قراءة أول مازورة لقرارات المحترف.":"From reading the first bar to making professional decisions."}</h2><p>{egyptian?"مش لازم تحفظ الـ١٨ مجال مرة واحدة. افتح المجال اللي يفسّر المشكلة اللي ودنك أو إيدك قابلتها دلوقتي.":"Do not memorize all 18 at once. Open the domain that explains the problem your ear or hands are facing now."}</p></header>
   <nav className="theoryDomainNav" aria-label={egyptian?"مجالات نظرية الباص":"Bass theory domains"}>{THEORY_DOMAINS.map((domain,i)=><button type="button" className={theoryDomain===i?"active":""} aria-pressed={theoryDomain===i} onClick={()=>setTheoryDomain(i)} key={domain.id}><span><b>{domain.n}</b><small>{lt(domain.level)}</small></span><h3>{lt(domain.title)}</h3><p>{lt(domain.aim)}</p></button>)}</nav>
  </section>

  <section className="theoryChapter">
   <header className="theoryChapterHead"><div><span>{egyptian?`المجال ${theory.n} · ${lt(theory.level)}`:`DOMAIN ${theory.n} · ${lt(theory.level)}`}</span><h2>{lt(theory.title)}</h2><p>{lt(theory.aim)}</p></div><b>{theory.n}</b></header>
   <article className="theoryCore"><span>{egyptian?"الفكرة اللي لازم تفهمها":"THE CENTRAL IDEA"}</span><p>{lt(theory.core)}</p></article>
   <div className="theoryConceptGrid">{theory.concepts.map((concept,i)=><article key={concept.formula}><i>{String(i+1).padStart(2,"0")}</i><span>{lt(concept.name)}</span><b dir="ltr">{concept.formula}</b><p>{lt(concept.explain)}</p></article>)}</div>
   <div className="theoryEvidence">
    <article><span>{egyptian?"على الباص":"ON BASS"}</span><h3>{egyptian?"حوّلها لفعل":"Turn it into action"}</h3><p>{lt(theory.bass)}</p></article>
    <article><span>{egyptian?"غلطة شائعة":"COMMON TRAP"}</span><h3>{egyptian?"اعرف إمتى المعرفة بتضللك":"Know when knowledge misleads"}</h3><p>{lt(theory.trap)}</p></article>
    <article><span>{egyptian?"إثبات الإتقان":"MASTERY PROOF"}</span><h3>{egyptian?"الدليل إنك فعلاً تعرفها":"Evidence that you own it"}</h3><p>{lt(theory.proof)}</p></article>
   </div>
  </section>

  <section className="theoryDictionary">
   <header><span>{egyptian?"قواميس الاستخدام السريع":"WORKING DICTIONARIES"}</span><h2>{egyptian?"دَوّر على العلاقة، مش مجرد الاسم.":"Look up the relationship—not only the label."}</h2><p>{egyptian?`القرار الحالي في المرجع هو ${N[ri]}. غيّره من أدوات الكورس عشان تشوف أمثلة المسافات بنغمة جديدة.`:`The reference root is currently ${N[ri]}. Change it in the course tools to transpose interval examples instantly.`}</p></header>
   <div className="theoryDictionaryTabs" role="tablist" aria-label={egyptian?"قواميس النظرية":"Theory dictionaries"}>{THEORY_DICTIONARIES.map((item,i)=><button type="button" role="tab" aria-selected={theoryDictionary===i} className={theoryDictionary===i?"active":""} onClick={()=>setTheoryDictionary(i)} key={item.id}>{lt(item.title)}</button>)}</div>
   <div className="theoryDictionaryIntro"><div><span>{egyptian?"القاموس المختار":"SELECTED DICTIONARY"}</span><h3>{lt(dictionary.title)}</h3><p>{lt(dictionary.intro)}</p></div><b dir="ltr">ROOT · {N[ri]}</b></div>
   <div className="theoryTableWrap"><table><thead><tr>{dictionary.columns.map(column=><th key={column.en}>{lt(column)}</th>)}</tr></thead><tbody>{dictionary.rows.map(row=><tr key={`${row.name.en}-${row.formula}`}><td>{lt(row.name)}</td><td dir="ltr">{row.formula}</td><td>{lt(row.meaning)}{row.semitones!==undefined&&<small className="theoryRootExample" dir="ltr">{N[ri]} → {N[(ri+row.semitones)%12]}</small>}</td></tr>)}</tbody></table></div>
  </section>

  <section className="modeReference"><div className="refHead"><span>{egyptian?"المودات السبعة · نفس القرار":"THE SEVEN MODES · SAME ROOT"}</span><p>{egyptian?`اضغط على صف عشان تسمع المود فوق ${N[ri]}. درجة الهوية هي أسرع دليل، لكنها مش بديل للسير والجملة والإحساس.`:`Click a row to hear the mode over ${N[ri]}. The characteristic degree is the fastest clue, but it never replaces melodic behavior, phrasing or feel.`}</p></div>{MODES.map((m,i)=><button type="button" onClick={()=>{onSetMode(i);onAudition(m.s.map(x=>(ri+x)%12),.25)}} key={m.n}><b>{m.n}</b><span dir="ltr">{m.f}</span><em dir="ltr">{["3 + 7","NATURAL 6","♭2","♯4","♭7","♭6","♭5 + ♭2"][i]}</em><small>{(egyptian?["مرجع الميجور","ماينور برفعة","ماينور باحتكاك قرار غامق","ميجور بلون الرابعة المرفوعة","لون ميجور دومينانت","الماينور الطبيعي","بيئة m7♭5"]:["major reference","minor with lift","minor, darkest root rub","major, raised-four colour","major dominant colour","natural minor","m7♭5 environment"])[i]}</small><i>▶</i></button>)}</section>

  <section className="thinkingReference">
   <article><span>{egyptian?"فكّر مقامياً لما":"THINK MODALLY WHEN"}</span><h2>{egyptian?"مركز واحد عنده وقت يتطوّر.":"One centre has time to develop."}</h2><p>{egyptian?"الفامب الثابت والبيدال والإيقاع الهارموني البطيء يكافئوا درجة الهوية والموتيف والمنطقة وتطوير اللون.":"Static vamps, pedal tones and slow harmonic rhythm reward characteristic tone, motif, register and colour development."}</p></article>
   <article><span>{egyptian?"فكّر وظيفياً لما":"THINK FUNCTIONALLY WHEN"}</span><h2>{egyptian?"الكوردات تعمل جاذبية واتجاه.":"Chords create directional gravity."}</h2><p>{egyptian?"الدومينانت وحركة ii–V–I وتغيّر الجايد تونز يكافئوا الأهداف وحركة الأصوات والقفلة أكتر من أشكال سلالم منفصلة.":"Dominants, ii–V–I movement and changing guide tones reward targets, voice leading and resolution over separate scale shapes."}</p></article>
   <article><span>{egyptian?"فكّر بالاتنين لما":"THINK HYBRID WHEN"}</span><h2>{egyptian?"مركز كبير جواه حركة كوردات محلية.":"A home centre contains local chord motion."}</h2><p>{egyptian?"حافظ على المركز الكبير، وعدّل النغمات الأساسية للكورد اللي شغّال دلوقتي.":"Preserve the larger tonal centre while adjusting structural tones for the chord that is sounding now."}</p></article>
  </section>

  <section className="theoryMastery"><header><span>{egyptian?"معنى إن النظرية كاملة":"WHAT COMPLETE THEORY MEANS"}</span><h2>{egyptian?"خمسة أبواب. لو باب ناقص، الفكرة لسه مش ملكك.":"Five doors. If one stays closed, the idea is not yours yet."}</h2></header><div>{[
   ["01",egyptian?"اسمعها":"HEAR IT",egyptian?"تتعرف عليها من الصوت وفي سياق حقيقي.":"Recognize it by sound and in real context."],
   ["02",egyptian?"اشرحها":"EXPLAIN IT",egyptian?"تقول معناها ووظيفتها بكلام بسيط.":"State its meaning and function in plain language."],
   ["03",egyptian?"شوفها":"SEE IT",egyptian?"تلاقيها على الرقبة وفي النوتة والشارت.":"Locate it on the neck, notation and chart."],
   ["04",egyptian?"اعزفها":"PLAY IT",egyptian?"تنفذها في الوقت ومن أكتر من مكان.":"Execute it in time from more than one position."],
   ["05",egyptian?"اخلق بيها":"CREATE WITH IT",egyptian?"تختارها أو تسيبها بقصد موسيقي.":"Choose it—or reject it—for a musical reason."],
  ].map(([n,title,description])=><article key={n}><i>{n}</i><b>{title}</b><p>{description}</p></article>)}</div></section>
 </div>;
}


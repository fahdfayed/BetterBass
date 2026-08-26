export type LocalText={en:string};
const t=(en:string):LocalText=>({en});
export const PITCH_NAMES=["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
export const DEGREE_NAMES=["1","♭9 / ♭2","9 / 2","♭3 / ♯9","3","11 / 4","♯11 / ♭5","5","♭13 / ♯5","13 / 6","♭7","7"];
const noteMap:Record<string,number>={C:0,"B#":0,"C#":1,DB:1,D:2,"D#":3,EB:3,E:4,FB:4,"E#":5,F:5,"F#":6,GB:6,G:7,"G#":8,AB:8,A:9,"A#":10,BB:10,B:11,CB:11};
const mod=(n:number,m=12)=>((n%m)+m)%m;
const unique=(values:number[])=>[...new Set(values.map(x=>mod(x)))].sort((a,b)=>a-b);

export type ChordFamily="major"|"minor"|"minor-major"|"dominant"|"suspended"|"half-diminished"|"diminished"|"augmented";
export type ParsedChord={
 symbol:string;root:number;rootName:string;bass:number;bassName:string;family:ChordFamily;
 core:number[];tensions:number[];intervals:number[];pcs:number[];flags:string[];error?:string;
};

function notePc(value:string){return noteMap[value.toUpperCase().replace("♯","#").replace("♭","B")]}
function has(source:string,pattern:RegExp){return pattern.test(source)}

export function parseChord(raw:string):ParsedChord{
 const original=raw.trim()||"C";
 const normalized=original.replaceAll("♯","#").replaceAll("♭","b").replaceAll("Δ","maj").replaceAll("ø","m7b5").replaceAll("°","dim").replaceAll("−","m").replaceAll("–","m");
 let symbol=normalized.replace(/[(),\s]/g,"");
 const bassMatch=symbol.match(/\/([A-Ga-g](?:#|b)?)$/),bassToken=bassMatch?.[1];
 if(bassMatch)symbol=symbol.slice(0,-bassMatch[0].length);
 const rootMatch=symbol.match(/^([A-Ga-g])([#b]?)(.*)$/);
 if(!rootMatch)return {symbol:original,root:0,rootName:"?",bass:0,bassName:"?",family:"major",core:[0,4,7],tensions:[],intervals:[0,4,7],pcs:[0,4,7],flags:[],error:`Could not read “${original}”. Start with a note name, for example Cmaj9 or G7alt.`};
 const rootToken=`${rootMatch[1].toUpperCase()}${rootMatch[2]}`,root=notePc(rootToken),suffix=rootMatch[3].toLowerCase(),baseSymbol=normalized.replace(/\([^)]*\)/g,"").replace(/\s/g,"").replace(/\/([A-Ga-g](?:#|b)?)$/,"");
 const baseRootMatch=baseSymbol.match(/^([A-Ga-g])([#b]?)(.*)$/),baseSuffix=(baseRootMatch?.[3]||"").toLowerCase();
 if(root===undefined)return {symbol:original,root:0,rootName:"?",bass:0,bassName:"?",family:"major",core:[0,4,7],tensions:[],intervals:[0,4,7],pcs:[0,4,7],flags:[],error:`The root in “${original}” is not recognized.`};
 const bass=bassToken===undefined?root:notePc(bassToken),bassName=bassToken?bassToken.replace("b","♭").replace("#","♯"):rootToken.replace("b","♭").replace("#","♯");
 const halfDim=has(suffix,/m7b5|halfdim/),diminished=!halfDim&&has(suffix,/dim/),augmented=has(suffix,/aug|\+/),minorMajor=has(suffix,/m(?:in)?maj/),minor=!minorMajor&&!halfDim&&has(suffix,/^(?:m(?!aj)|min|-)/),sus2=has(suffix,/sus2/),sus4=!sus2&&has(suffix,/sus(?:4)?/);
 const family:ChordFamily=halfDim?"half-diminished":diminished?"diminished":augmented?"augmented":minorMajor?"minor-major":sus2||sus4?"suspended":minor?"minor":has(baseSuffix,/maj|6\/9|add/)?"major":has(baseSuffix,/(?:7|9|11|13|alt)/)?"dominant":"major";
 let core=halfDim?[0,3,6]:diminished?[0,3,6]:augmented?[0,4,8]:sus2?[0,2,7]:sus4?[0,5,7]:minor||minorMajor?[0,3,7]:[0,4,7];
 const flags:string[]=[];
 if(halfDim)flags.push("half-diminished");if(diminished)flags.push("diminished");if(augmented)flags.push("augmented");if(sus2)flags.push("sus2");if(sus4)flags.push("sus4");if(minorMajor)flags.push("minor-major");
 const withoutAdds=baseSuffix.replace(/add(?:2|4|6|9|11|13)/g,"").replace("6/9","");
 const impliesSeventh=has(withoutAdds,/(?:7|9|11|13|alt)/);
 if(diminished&&has(suffix,/7/))core.push(9);
 else if(halfDim)core.push(10);
 else if(minorMajor||has(suffix,/maj(?:7|9|11|13)/))core.push(11);
 else if(impliesSeventh)core.push(10);
 const tensions:number[]=[];
 if(has(suffix,/(?:^|[^0-9])6(?:\/9|$)|m6/)){tensions.push(9);flags.push("6")}
 if(has(suffix,/6\/9/)){tensions.push(2);flags.push("6/9")}
 if(has(suffix,/add(?:2|9)/)){tensions.push(2);flags.push("add9")}
 if(has(suffix,/add(?:4|11)/)){tensions.push(5);flags.push("add11")}
 if(has(suffix,/add(?:6|13)/)){tensions.push(9);flags.push("add13")}
 if(has(suffix,/b9/)){tensions.push(1);flags.push("b9")}
 if(has(suffix,/#9/)){tensions.push(3);flags.push("#9")}
 const stacked13=has(baseSuffix,/(?<![b#])13/),stacked11=!stacked13&&has(baseSuffix,/(?<![b#])11/),stacked9=!stacked13&&!stacked11&&has(baseSuffix,/(?<![b#])9/)&&!has(baseSuffix,/6\/9|add9/),altered9=has(suffix,/[b#]9/);
 if(stacked9||stacked11||stacked13){if(!altered9)tensions.push(2);flags.push("9")}
 else if(has(suffix,/(?<![b#])9/)&&!has(suffix,/6\/9|add9/)){tensions.push(2);flags.push("9")}
 if(has(suffix,/#11/)){tensions.push(6);flags.push("#11")}
 else if(stacked11||stacked13){tensions.push(5);flags.push("11")}
 else if(has(suffix,/(?<!add)11/)){tensions.push(5);flags.push("11")}
 if(has(suffix,/b13/)){tensions.push(8);flags.push("b13")}
 else if(has(suffix,/(?<![b#])13/)){tensions.push(9);flags.push(stacked13?"13":"add13")}
 if(has(suffix,/b5/)&&!halfDim){core=core.filter(x=>x!==7&&x!==8);core.push(6);flags.push("b5")}
 if(has(suffix,/#5/)){core=core.filter(x=>x!==7&&x!==6);core.push(8);flags.push("#5")}
 if(has(suffix,/alt/)){flags.push("alt");core=core.filter(x=>x!==7);tensions.push(1,3,6,8)}
 if(has(suffix,/no3/))core=core.filter(x=>x!==3&&x!==4);
 if(has(suffix,/no5/))core=core.filter(x=>x!==6&&x!==7&&x!==8);
 core=unique(core);const tensionSet=unique(tensions.filter(x=>!core.includes(x))),intervals=unique([...core,...tensionSet]),pcs=intervals.map(x=>mod(root+x));
 const supported=/^(?:(?:maj|min|m|dim|aug|sus|add|alt|no)|[0-9+#b/-])*$/i.test(suffix);
 return {symbol:original,root,rootName:rootToken.replace("b","♭").replace("#","♯"),bass:bass??root,bassName, family,core,tensions:tensionSet,intervals,pcs,flags,error:supported?undefined:`Read the core of “${original}”, but some suffix text is unfamiliar. Check the spelling.`};
}

export type ScaleDef={id:string;name:string;ar:string;formula:string;intervals:number[];character:number[];use:LocalText;watch:LocalText};
export const SCALE_LIBRARY:ScaleDef[]=[
 {id:"ionian",name:"Ionian",ar:"أيونيان",formula:"1 2 3 4 5 6 7",intervals:[0,2,4,5,7,9,11],character:[4,11],use:t("Clear major-key stability."),watch:t("The natural 4 can obscure the major 3 when sustained.")},
 {id:"dorian",name:"Dorian",ar:"دوريان",formula:"1 2 ♭3 4 5 6 ♭7",intervals:[0,2,3,5,7,9,10],character:[9],use:t("Minor with a natural-6 lift; strong for modal minor and funk."),watch:t("Feature 6 against ♭3; otherwise it can sound like generic minor.")},
 {id:"phrygian",name:"Phrygian",ar:"فريجيان",formula:"1 ♭2 ♭3 4 5 ♭6 ♭7",intervals:[0,1,3,5,7,8,10],character:[1],use:t("Dark minor with an exposed root–♭2 identity."),watch:t("The ♭2 needs deliberate duration and return.")},
 {id:"lydian",name:"Lydian",ar:"ليديان",formula:"1 2 3 ♯4 5 6 7",intervals:[0,2,4,6,7,9,11],character:[6],use:t("Open major sound; natural fit for maj7♯11."),watch:t("Make ♯4 audible without turning it into an accidental passing note.")},
 {id:"mixolydian",name:"Mixolydian",ar:"ميكسوليديان",formula:"1 2 3 4 5 6 ♭7",intervals:[0,2,4,5,7,9,10],character:[10],use:t("Default unaltered dominant, rock, blues and funk field."),watch:t("Natural 4 rubs the major 3; pass, suspend or resolve it.")},
 {id:"aeolian",name:"Aeolian",ar:"أيوليان",formula:"1 2 ♭3 4 5 ♭6 ♭7",intervals:[0,2,3,5,7,8,10],character:[8],use:t("Natural-minor home and rock/grunge minor language."),watch:t("♭6 strongly changes the colour; do not substitute it for Dorian 6 casually.")},
 {id:"locrian",name:"Locrian",ar:"لوكريان",formula:"1 ♭2 ♭3 4 ♭5 ♭6 ♭7",intervals:[0,1,3,5,6,8,10],character:[1,6],use:t("Literal diatonic match for half-diminished harmony."),watch:t("♭2 is highly exposed; Locrian natural 2 is often smoother in minor ii–V.")},
 {id:"melodic-minor",name:"Melodic minor",ar:"ميلوديك ماينور",formula:"1 2 ♭3 4 5 6 7",intervals:[0,2,3,5,7,9,11],character:[9,11],use:t("Tonic minor with natural 6 and major 7; modern minor gravity."),watch:t("The major 7 must sound intentional against the minor 3.")},
 {id:"dorian-b2",name:"Dorian ♭2",ar:"دوريان ♭٢",formula:"1 ♭2 ♭3 4 5 6 ♭7",intervals:[0,1,3,5,7,9,10],character:[1,9],use:t("Dark sus/minor colour with a natural 6."),watch:t("Separate ♭2 colour from an unintended root clash.")},
 {id:"lydian-aug",name:"Lydian augmented",ar:"ليديان أوجمنتد",formula:"1 2 3 ♯4 ♯5 6 7",intervals:[0,2,4,6,8,9,11],character:[6,8],use:t("Precise home for maj7♯5 and bright augmented harmony."),watch:t("Both ♯4 and ♯5 need a clear upper-register context.")},
 {id:"lydian-dominant",name:"Lydian dominant",ar:"ليديان دومينانت",formula:"1 2 3 ♯4 5 6 ♭7",intervals:[0,2,4,6,7,9,10],character:[6,10],use:t("Dominant with ♯11; ideal for non-resolving 7♯11 and tritone-sub colour."),watch:t("It is brighter and less inside than ordinary Mixolydian.")},
 {id:"mixo-b6",name:"Mixolydian ♭6",ar:"ميكسوليديان ♭٦",formula:"1 2 3 4 5 ♭6 ♭7",intervals:[0,2,4,5,7,8,10],character:[8,10],use:t("Dominant colour with ♭13 but an unaltered 9 and 5."),watch:t("Natural 4 still rubs the major 3.")},
 {id:"locrian-n2",name:"Locrian natural 2",ar:"لوكريان ٢ طبيعية",formula:"1 2 ♭3 4 ♭5 ♭6 ♭7",intervals:[0,2,3,5,6,8,10],character:[2,6],use:t("Smooth modern choice for m7♭5, especially iiø in minor."),watch:t("The natural 2 defines this choice; hear it before using the shape.")},
 {id:"altered",name:"Altered",ar:"ألترد",formula:"1 ♭9 ♯9 3 ♭5 ♭13 ♭7",intervals:[0,1,3,4,6,8,10],character:[1,3,6,8],use:t("Maximum directed dominant tension with every common alteration."),watch:t("Choose the resolution first; the scale is not a licence to run all seven notes.")},
 {id:"harmonic-minor",name:"Harmonic minor",ar:"هارمونيك ماينور",formula:"1 2 ♭3 4 5 ♭6 7",intervals:[0,2,3,5,7,8,11],character:[8,11],use:t("Minor tonic with strong leading-tone pull."),watch:t("The augmented second between ♭6 and 7 is a sound, not just a fingering gap.")},
 {id:"phrygian-dominant",name:"Phrygian dominant",ar:"فريجيان دومينانت",formula:"1 ♭2 3 4 5 ♭6 ♭7",intervals:[0,1,4,5,7,8,10],character:[1,4,8],use:t("Dominant with ♭9 and ♭13; strong minor-key V colour."),watch:t("Its cultural associations and phrasing are not reducible to this pitch list.")},
 {id:"harmonic-major",name:"Harmonic major",ar:"هارمونيك ميجور",formula:"1 2 3 4 5 ♭6 7",intervals:[0,2,4,5,7,8,11],character:[8,11],use:t("Major tonic with a dark ♭6; useful for maj7♭6 colours."),watch:t("The natural 4 and ♭6 both require careful placement.")},
 {id:"half-whole",name:"Half–whole diminished",ar:"ديمينشد نص–تون",formula:"1 ♭9 ♯9 3 ♯11 5 13 ♭7",intervals:[0,1,3,4,6,7,9,10],character:[1,3,6,9],use:t("Dominant ♭9/♯9 tension while retaining natural 5 and 13."),watch:t("Its symmetry can sound like an exercise unless targets and rhythm lead.")},
 {id:"whole-half",name:"Whole–half diminished",ar:"ديمينشد تون–نص",formula:"1 2 ♭3 4 ♭5 ♭6 𝄫7 7",intervals:[0,2,3,5,6,8,9,11],character:[3,6,9],use:t("Complete symmetrical field for fully diminished seventh chords."),watch:t("Any chord tone can act as a temporary root; keep the destination clear.")},
 {id:"whole-tone",name:"Whole tone",ar:"هول تون",formula:"1 2 3 ♯4 ♯5 ♭7",intervals:[0,2,4,6,8,10],character:[6,8],use:t("Floating augmented dominant colour with no perfect 5."),watch:t("With no semitone hierarchy, rhythm and destination must create direction.")},
 {id:"major-pent",name:"Major pentatonic",ar:"بنتاتونيك ميجور",formula:"1 2 3 5 6",intervals:[0,2,4,7,9],character:[2,9],use:t("Open major line with fewer collision points."),watch:t("It omits the 7, so it may not state maj7 harmony completely.")},
 {id:"minor-pent",name:"Minor pentatonic",ar:"بنتاتونيك ماينور",formula:"1 ♭3 4 5 ♭7",intervals:[0,3,5,7,10],character:[3,10],use:t("Portable minor, blues, rock and funk vocabulary."),watch:t("It can blur chord changes unless guide tones are restored.")},
 {id:"dominant-bebop",name:"Dominant bebop",ar:"بيبُب دومينانت",formula:"1 2 3 4 5 6 ♭7 7",intervals:[0,2,4,5,7,9,10,11],character:[10,11],use:t("Eight-note dominant field that can place chord tones on downbeats."),watch:t("The major 7 is normally a passing tone, not a held dominant colour.")},
];

export type ProgressionPreset={id:string;name:LocalText;brief:LocalText;center:number;homeMode:number;lens:"functional"|"modal"|"modern";chords:string[]};
export const PROGRESSION_PRESETS:ProgressionPreset[]=[
 {id:"dorian",name:t("Dorian pocket"),brief:t("Static minor centre with IV dominant colour."),center:9,homeMode:1,lens:"modal",chords:["Am9","D13","Am9","E7sus4"]},
 {id:"major-251",name:t("Extended major ii–V–I"),brief:t("Guide-tone gravity through 9th and 13th chords."),center:0,homeMode:0,lens:"functional",chords:["Dm9","G13","Cmaj9","C6/9"]},
 {id:"minor-251",name:t("Minor iiø–V–i"),brief:t("Half-diminished preparation, altered dominant, minor arrival."),center:9,homeMode:5,lens:"functional",chords:["Bm7b5","E7b9","AmMaj9","Am6/9"]},
 {id:"neo-soul",name:t("Neo-soul turn"),brief:t("Chromatic dominant and soft extended voice leading."),center:5,homeMode:0,lens:"modern",chords:["Fmaj9","E7#9","Am9","Gm9","C13"]},
 {id:"altered-turn",name:t("Altered turnaround"),brief:t("Lydian tonic colour into altered and diminished dominant options."),center:0,homeMode:0,lens:"modern",chords:["Cmaj7#11","A7alt","Dm11","G13b9"]},
 {id:"fusion",name:t("Fusion cycle"),brief:t("Extended minor, Lydian dominant and altered secondary dominant."),center:2,homeMode:0,lens:"modern",chords:["Em11","A13#11","Dmaj9","B7alt"]},
 {id:"slash",name:t("Slash-bass architecture"),brief:t("The lowest voice changes the meaning of stable upper structures."),center:0,homeMode:0,lens:"functional",chords:["Cmaj9/E","Fmaj7/A","Dm11/G","G13sus4/F"]},
 {id:"diminished",name:t("Diminished connector"),brief:t("A symmetrical passing chord connects tonic to ii."),center:0,homeMode:0,lens:"functional",chords:["Cmaj9","C#dim7","Dm9","G13"]},
 {id:"augmented",name:t("Augmented colours"),brief:t("Maj7♯5, half-diminished and altered dominant movement."),center:4,homeMode:0,lens:"modern",chords:["Cmaj7#5","F#m7b5","B7alt","Emaj9#11"]},
 {id:"chromatic",name:t("Chromatic mediants"),brief:t("Remote major colours joined by common tones and dominant return."),center:0,homeMode:0,lens:"modern",chords:["Cmaj9","Emaj7#11","A♭maj7#5","G13b9"]},
];

const scaleById=(id:string)=>SCALE_LIBRARY.find(x=>x.id===id)!;
function preferredScales(chord:ParsedChord){
 const f=chord.flags;
 if(chord.family==="half-diminished")return ["locrian-n2","locrian"];
 if(chord.family==="diminished")return ["whole-half"];
 if(chord.family==="augmented")return f.includes("#5")&&chord.core.includes(11)?["lydian-aug","whole-tone"]:["whole-tone","lydian-aug"];
 if(chord.family==="minor-major")return ["melodic-minor","harmonic-minor"];
 if(chord.family==="minor"){
  if(f.includes("6")||f.includes("6/9"))return ["dorian","melodic-minor","minor-pent"];
  return ["dorian","aeolian","phrygian","minor-pent","melodic-minor"];
 }
 if(chord.family==="suspended")return ["mixolydian","dorian-b2","minor-pent"];
 if(chord.family==="dominant"){
  if(f.includes("alt"))return ["altered","half-whole","whole-tone","lydian-dominant"];
  if(f.includes("#11"))return ["lydian-dominant","half-whole","whole-tone","mixolydian"];
  if(f.includes("#5"))return ["whole-tone","altered","mixo-b6"];
  if(f.includes("b13"))return ["mixo-b6","phrygian-dominant","altered"];
  if(f.includes("b9")||f.includes("#9"))return ["half-whole","altered","phrygian-dominant","mixolydian"];
  return ["mixolydian","lydian-dominant","dominant-bebop","half-whole"];
 }
 if(f.includes("#5"))return ["lydian-aug","whole-tone"];
 if(f.includes("#11"))return ["lydian","major-pent","ionian"];
 if(f.includes("b13"))return ["harmonic-major","ionian"];
 return ["ionian","lydian","major-pent","harmonic-major"];
}

export type ScaleRecommendation={scale:ScaleDef;score:number;missing:number[];commonNext:number;contextOverlap:number;reason:LocalText};
export function recommendScales(chord:ParsedChord,next:ParsedChord|undefined,centre:number,homeMode:number,lens:string):ScaleRecommendation[]{
 const modeIntervals=[[0,2,4,5,7,9,11],[0,2,3,5,7,9,10],[0,1,3,5,7,8,10],[0,2,4,6,7,9,11],[0,2,4,5,7,9,10],[0,2,3,5,7,8,10],[0,1,3,5,6,8,10]][homeMode]||[0,2,4,5,7,9,11],centrePcs=modeIntervals.map(x=>mod(centre+x)),preferred=preferredScales(chord);
 const pool=[...preferred,...SCALE_LIBRARY.map(x=>x.id).filter(id=>!preferred.includes(id))].map(scaleById);
 return pool.map(scale=>{
  const missing=chord.intervals.filter(iv=>!scale.intervals.includes(iv)),absolute=scale.intervals.map(iv=>mod(chord.root+iv)),contextOverlap=absolute.filter(pc=>centrePcs.includes(pc)).length,commonNext=next?absolute.filter(pc=>next.pcs.includes(pc)||pc===next.bass).length:0,preferredIndex=preferred.indexOf(scale.id);
  let score=50+(preferredIndex>=0?34-preferredIndex*7:0)-missing.length*17+contextOverlap*.8+commonNext*.7;
  if(lens==="modal"&&["dorian","phrygian","lydian","mixolydian","aeolian"].includes(scale.id))score+=3;
  if(lens==="modern"&&["melodic-minor","lydian-aug","lydian-dominant","altered","half-whole","whole-tone"].includes(scale.id))score+=3;
  const reason=missing.length?t("Some written chord tones are absent; treat this as an outside option, not the default."):preferredIndex===0?t("Best literal fit for the chord spelling and its strongest colour."):commonNext>=3?t("Fits this chord and already contains several tones from the next harmony."):t("Valid alternative colour; the progression decides whether it sounds convincing.");
  return {scale,score:Math.round(Math.max(18,Math.min(98,score))),missing,commonNext,contextOverlap,reason};
 }).filter(x=>x.missing.length===0||preferred.includes(x.scale.id)).sort((a,b)=>b.score-a.score).slice(0,4);
}

export type NoteRoleId="bass"|"root"|"guide"|"chord"|"specified"|"voice"|"colour"|"available"|"context"|"approach"|"outside";
export type NoteRole={id:NoteRoleId;rank:number;label:LocalText;short:LocalText;why:LocalText;advice:LocalText};
const roles:Record<NoteRoleId,NoteRole>={
 bass:{id:"bass",rank:0,label:t("Required bass note"),short:t("BASS"),why:t("The slash symbol explicitly assigns this as the lowest voice."),advice:t("State it clearly on the change; it controls the inversion even when it is not in the upper chord.")},
 root:{id:"root",rank:1,label:t("Chord root"),short:t("ROOT"),why:t("It names the current harmony and gives the listener the clearest reference."),advice:t("Strong in the low register, but do not restart every phrase on it.")},
 guide:{id:"guide",rank:2,label:t("Guide tone"),short:t("GUIDE"),why:t("The 3rd or 7th defines chord quality and usually carries the shortest meaningful voice leading."),advice:t("Feature it in the middle register; connect it by semitone or common tone into the next chord.")},
 chord:{id:"chord",rank:3,label:t("Structural chord tone"),short:t("CHORD"),why:t("It is written into the chord and stabilizes the harmony."),advice:t("Use it as an anchor or destination; the 5th is safe but says less than the 3rd or 7th.")},
 specified:{id:"specified",rank:3,label:t("Written colour / tension"),short:t("WRITTEN"),why:t("The chord symbol explicitly asks for this extension or alteration."),advice:t("Make it audible above the low register, then resolve according to the next chord.")},
 voice:{id:"voice",rank:4,label:t("Next-chord connector"),short:t("→ NEXT"),why:t("It belongs to the selected scale now and becomes structural in the next chord."),advice:t("Hold it as a common tone or approach it before the change.")},
 colour:{id:"colour",rank:5,label:t("Mode-defining colour"),short:t("COLOUR"),why:t("This degree distinguishes the selected mode from a more generic option."),advice:t("Feature it once or twice with space; do not bury it inside a scale run.")},
 available:{id:"available",rank:6,label:t("Available extension"),short:t("PATH"),why:t("It belongs to the selected chord-scale but is not structurally required."),advice:t("Use it as motion between stronger tones and control its beat placement.")},
 context:{id:"context",rank:7,label:t("Context / dose note"),short:t("DOSE"),why:t("It is in the scale but creates a close rub with a defining chord tone."),advice:t("Pass, suspend or resolve it; avoid a long low-register sustain unless that rub is the point.")},
 approach:{id:"approach",rank:8,label:t("Chromatic approach"),short:t("APPROACH"),why:t("It sits outside the chosen scale but a semitone from a structural destination."),advice:t("Keep it shorter and rhythmically lighter than the landing note.")},
 outside:{id:"outside",rank:9,label:t("Outside the current choice"),short:t("OUT"),why:t("It is neither in the selected scale nor an immediate structural target."),advice:t("Use only with a named route, duration and landing; otherwise omit it.")},
};
export const NOTE_ROLES=roles;

function guideIntervals(chord:ParsedChord){return chord.core.filter(x=>[3,4,10,11].includes(x))}
function isContextNote(iv:number,chord:ParsedChord){
 if(chord.family==="suspended"&&(iv===3||iv===4)&&!chord.tensions.includes(iv))return true;
 if(iv===5&&chord.core.includes(4)&&!chord.tensions.includes(5))return true;
 if(iv===1&&!chord.tensions.includes(1))return true;
 if(iv===11&&["dominant","suspended"].includes(chord.family)&&!chord.core.includes(11))return true;
 if(iv===3&&chord.core.includes(4)&&!chord.tensions.includes(3))return true;
 if(iv===8&&chord.core.includes(7)&&!chord.tensions.includes(8))return true;
 return false;
}
export function classifyNote(pc:number,chord:ParsedChord,scale:ScaleDef,next?:ParsedChord):NoteRole{
 const iv=mod(pc-chord.root),scalePc=scale.intervals.includes(iv),nextStructural=next&&(pc===next.bass||pc===next.root||next.pcs.includes(pc));
 if(pc===chord.bass&&chord.bass!==chord.root)return roles.bass;
 if(iv===0)return roles.root;
 if(guideIntervals(chord).includes(iv))return roles.guide;
 if(chord.core.includes(iv))return roles.chord;
 if(chord.tensions.includes(iv))return roles.specified;
 if(scalePc&&nextStructural)return roles.voice;
 if(scale.character.includes(iv))return roles.colour;
 if(scalePc&&isContextNote(iv,chord))return roles.context;
 if(scalePc)return roles.available;
 const targets=next?[next.bass,next.root,...next.pcs]:[chord.root,...chord.pcs];
 if(targets.some(target=>Math.min(mod(pc-target),mod(target-pc))===1))return roles.approach;
 return roles.outside;
}

export function intervalLabel(iv:number,chord:ParsedChord){
 const n=mod(iv);
 if(n===0)return "1";
 if(n===1)return chord.flags.includes("b9")||chord.flags.includes("alt")?"♭9":"♭2";
 if(n===2)return chord.flags.some(x=>["9","11","13","add9","6/9"].includes(x))?"9":"2";
 if(n===3)return chord.flags.includes("alt")||chord.flags.includes("#9")&&!chord.core.includes(3)?"♯9":chord.flags.includes("#9")&&chord.family==="dominant"?"♯9":"♭3";
 if(n===4)return "3";
 if(n===5)return chord.flags.some(x=>["11","add11"].includes(x))?"11":"4";
 if(n===6)return chord.flags.includes("alt")?"♭5 / ♯11":chord.flags.includes("#11")?"♯11":chord.flags.includes("b5")||["half-diminished","diminished"].includes(chord.family)?"♭5":"♯4 / ♭5";
 if(n===7)return "5";
 if(n===8)return chord.flags.includes("alt")?"♯5 / ♭13":chord.flags.includes("b13")?"♭13":chord.flags.includes("#5")||chord.family==="augmented"?"♯5":"♭6 / ♯5";
 if(n===9)return chord.family==="diminished"&&chord.core.includes(9)?"𝄫7":chord.flags.includes("13")?"13":chord.flags.some(x=>["6","6/9"].includes(x))?"6":"6 / 13";
 if(n===10)return "♭7";
 if(n===11)return "7";
 return DEGREE_NAMES[n];
}

export function spellChordNote(chord:ParsedChord,iv:number){
 const n=mod(iv),label=intervalLabel(n,chord),degree=n===0?1:n===1||n===2||label==="♯9"?2:n===3||n===4?3:n===5||label==="♯11"?4:n===6||n===7||label==="♯5"||label==="♭5"?5:n===8&&label==="♭13"?6:n===8?5:n===9&&!label.includes("7")?6:7;
 const rootLetter=chord.rootName[0].toUpperCase(),letters=["C","D","E","F","G","A","B"],natural=[0,2,4,5,7,9,11],rootLetterIndex=letters.indexOf(rootLetter),letterIndex=(rootLetterIndex+degree-1)%7,targetLetter=letters[letterIndex],targetPc=mod(chord.root+n),naturalPc=natural[letterIndex];
 let difference=mod(targetPc-naturalPc);if(difference>6)difference-=12;
 const accidental=difference===2?"𝄪":difference===1?"♯":difference===-1?"♭":difference===-2?"𝄫":"";
 return `${targetLetter}${accidental}`;
}

export type VoicePath={from:number;to:number;distance:number;fromDegree:string;toDegree:string};
function signedDistance(from:number,to:number){let d=mod(to-from);if(d>6)d-=12;return d}
export function voiceLeadingPaths(chord:ParsedChord,next:ParsedChord):VoicePath[]{
 const starts=unique([chord.bass,chord.root,...guideIntervals(chord).map(x=>mod(chord.root+x))]),targets=unique([next.bass,next.root,...guideIntervals(next).map(x=>mod(next.root+x))]);
 const paths=starts.map(from=>{const to=targets.reduce((best,target)=>Math.abs(signedDistance(from,target))<Math.abs(signedDistance(from,best))?target:best,targets[0]),distance=signedDistance(from,to);return {from,to,distance,fromDegree:intervalLabel(from-chord.root,chord),toDegree:intervalLabel(to-next.root,next)}}).sort((a,b)=>Math.abs(a.distance)-Math.abs(b.distance));
 return paths.filter((path,i,array)=>array.findIndex(x=>x.from===path.from&&x.to===path.to)===i).slice(0,4);
}
export function commonTones(chord:ParsedChord,next:ParsedChord){return unique([chord.bass,...chord.pcs].filter(pc=>pc===next.bass||next.pcs.includes(pc)))}
export function parseProgression(text:string){
 const symbols=text.split(/\s*(?:\||→)\s*|\s+/).map(x=>x.trim()).filter(Boolean).slice(0,12),chords=symbols.map(parseChord);
 return {symbols,chords,errors:chords.filter(x=>x.error).map(x=>x.error!)};
}

export type ChordVoicing={bassMidi:number;upperMidi:number[];pitchClasses:number[]};
export function buildChordVoicing(chord:ParsedChord,previousUpper:number[]=[]):ChordVoicing{
 const bassMidi=36+chord.bass,previousCentre=previousUpper.length?previousUpper.reduce((sum,midi)=>sum+midi,0)/previousUpper.length:60;
 const upperMidi=chord.intervals.map(iv=>{
  const pc=mod(chord.root+iv),held=previousUpper.find(midi=>mod(midi)===pc);
  if(held!==undefined&&held>=48&&held<=83)return held;
  const extension=chord.tensions.includes(iv)&&!(iv===9&&chord.flags.some(flag=>["6","6/9","add13"].includes(flag)));
  let target=48+chord.root+iv+(extension?12:0);
  while(target>83)target-=12;
  while(target<48)target+=12;
  const candidates=[48+pc,60+pc,72+pc].filter(midi=>midi<=83);
  return candidates.reduce((best,midi)=>Math.abs(midi-target)+Math.abs(midi-previousCentre)*.18<Math.abs(best-target)+Math.abs(best-previousCentre)*.18?midi:best,candidates[0]);
 }).sort((a,b)=>a-b);
 return {bassMidi,upperMidi,pitchClasses:chord.intervals.map(iv=>mod(chord.root+iv))};
}

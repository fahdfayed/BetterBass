import {parseProgression,PITCH_NAMES,type ChordFamily,type ParsedChord} from "../harmony-fretboard-data.ts";

/**
 * What a progression is doing, in the terms the course teaches.
 *
 * The encyclopedia explains Roman numerals, function, secondary dominants and
 * borrowing in prose, and the site never let anyone actually do it to a
 * progression of their own. This does the reading: which key, what each chord
 * is called in that key, what job it holds, and which of the chords that are
 * not in the key are explicable rather than merely outside.
 *
 * It says what it can support and no more. Where the evidence is thin — one
 * chord, an ambiguous pair — the confidence says so rather than the analysis
 * inventing a key.
 */

const mod=(value:number)=>((value%12)+12)%12;

export type KeyMode="major"|"minor";

/** Scale degrees of each mode, and the chord quality each degree expects. */
const MAJOR_DEGREES=[0,2,4,5,7,9,11];
const MINOR_DEGREES=[0,2,3,5,7,8,10];

const MAJOR_QUALITY:Record<number,ChordFamily[]>={
 0:["major"],2:["minor"],4:["minor"],5:["major"],
 7:["dominant","major"],9:["minor"],11:["half-diminished","diminished"],
};
/*
 * Minor takes more than one answer in two places, and both are ordinary rather
 * than exceptional: the fifth degree is minor in natural minor and dominant in
 * harmonic minor — the second is how minor keys actually cadence — and the
 * seventh is a ♭VII dominant or a leading-tone diminished depending on which
 * minor is in force.
 */
const MINOR_QUALITY:Record<number,ChordFamily[]>={
 0:["minor","minor-major"],2:["half-diminished","diminished"],3:["major"],
 5:["minor"],7:["minor","dominant"],8:["major"],
 10:["dominant","major"],11:["diminished"],
};

const NUMERALS=["I","II","III","IV","V","VI","VII"];

const MODE_DEGREES:Record<string,number[]>={
 Ionian:[0,2,4,5,7,9,11],Dorian:[0,2,3,5,7,9,10],Phrygian:[0,1,3,5,7,8,10],
 Lydian:[0,2,4,6,7,9,11],Mixolydian:[0,2,4,5,7,9,10],Aeolian:[0,2,3,5,7,8,10],
 Locrian:[0,1,3,5,6,8,10],
};

/** Where each semitone sits as a numeral, and whether it needs an accidental. */
function numeralFor(offset:number,degreesIn:number[]|KeyMode){
 const degrees=Array.isArray(degreesIn)?degreesIn:(degreesIn==="major"?MAJOR_DEGREES:MINOR_DEGREES);
 const exact=degrees.indexOf(offset);
 if(exact>=0)return {numeral:NUMERALS[exact],accidental:""};
 // Not in the scale: name it from the degree below, flattened — except the
 // raised fourth, which every musician reads as ♯IV rather than ♭V.
 if(offset===6&&degrees.includes(5))return {numeral:NUMERALS[3],accidental:"♯"};
 /*
  * A chord one semitone above a degree is that degree raised, not the next one
  * flattened. C♯°7 between Cmaj7 and Dm7 is ♯i°7 climbing to ii, and calling
  * it ♭ii°7 describes a descent that is not happening.
  */
 const above=degrees.indexOf(offset-1);
 if(above>=0)return {numeral:NUMERALS[above],accidental:"♯"};
 for(let below=offset-1;below>=0;below--){
  const index=degrees.indexOf(below);
  if(index>=0)return {numeral:NUMERALS[index+1]??NUMERALS[0],accidental:"♭"};
 }
 return {numeral:NUMERALS[0],accidental:"♭"};
}

const MAJOR_QUALITIES:ChordFamily[]=["major","dominant","augmented"];

/** The suffix that names the chord's quality after the numeral. */
function suffixFor(chord:ParsedChord){
 if(chord.family==="half-diminished")return "ø7";
 if(chord.family==="diminished")return chord.intervals.includes(9)?"°7":"°";
 if(chord.family==="augmented")return "+";
 if(chord.family==="suspended")return chord.intervals.includes(10)?"7sus":"sus";
 if(chord.family==="minor-major")return "mMaj7";
 // Name the tallest extension the chord actually carries, so a 13th does not
 // report itself as a seventh.
 const seventh=chord.intervals.includes(11)?"maj":chord.intervals.includes(10)?"":null;
 if(seventh===null)return chord.intervals.includes(9)?"6":"";
 const top=chord.intervals.includes(9)&&chord.intervals.includes(2)?"13"
  :chord.intervals.includes(5)&&chord.intervals.includes(2)?"11"
  :chord.intervals.includes(2)?"9":"7";
 return seventh+top;
}

/**
 * The job a chord holds.
 *
 * "modal" is not a weaker kind of function, it is the absence of one: Dorian
 * has no dominant, so a chord in a modal progression is a degree of the mode
 * rather than a step in a cadence, and saying otherwise would teach the wrong
 * thing.
 */
export type ChordFunction="tonic"|"predominant"|"dominant"|"chromatic"|"modal";

const MAJOR_FUNCTION:Record<number,ChordFunction>={0:"tonic",4:"tonic",9:"tonic",2:"predominant",5:"predominant",7:"dominant",11:"dominant"};
const MINOR_FUNCTION:Record<number,ChordFunction>={0:"tonic",3:"tonic",8:"tonic",2:"predominant",5:"predominant",7:"dominant",10:"dominant",11:"dominant"};

export type ChordReading={
 symbol:string;
 root:number;
 rootName:string;
 /** The chord in the key, e.g. "ii7", "V7", "♭VII". */
 numeral:string;
 job:ChordFunction;
 diatonic:boolean;
 /** Set when the chord is the dominant of something else in the progression. */
 secondaryOf?:string;
 /** Set when the chord belongs to the parallel key rather than this one. */
 borrowed?:boolean;
 /** One line saying why the chord is what it is. */
 note:string;
};

export type KeyReading={
 tonic:number;
 mode:KeyMode;
 name:string;
 /** 0–100. Low means the progression did not give enough to be sure. */
 confidence:number;
 /** The pitch the progression actually revolves around. */
 centre:number;
 /**
  * Set when the centre is neither the key's tonic nor its relative — the same
  * seven notes, heard from a different degree. "A Dorian" rather than
  * "G major", which is what the player is hearing.
  */
 modal?:{name:string;collection:string};
};

export type ProgressionReading={
 symbols:string[];
 chords:ParsedChord[];
 errors:string[];
 key:KeyReading|null;
 readings:ChordReading[];
 /** Cadences and other structure worth naming, in order. */
 observations:string[];
};

/**
 * Is this chord the dominant of the one after it?
 *
 * A dominant seventh a fifth above the next chord explains its own accidentals:
 * the C♯ in A7 is not evidence against C major when the A7 is on its way to
 * Dm7. Scoring it as an intruder is what made a ii–V into the wrong key.
 */
const resolvesDownAFifth=(chord:ParsedChord,next:ParsedChord|undefined)=>
 !!next&&!next.error&&chord.family==="dominant"&&mod(chord.root-next.root)===7;

/** A diminished chord a semitone below the next is passing through to it. */
const passesUpASemitone=(chord:ParsedChord,next:ParsedChord|undefined)=>
 !!next&&!next.error&&chord.family==="diminished"&&mod(next.root-chord.root)===1;

/** How well a set of chords sits in one key. */
function scoreKey(chords:ParsedChord[],tonic:number,mode:KeyMode){
 const degrees=mode==="major"?MAJOR_DEGREES:MINOR_DEGREES;
 const quality=mode==="major"?MAJOR_QUALITY:MINOR_QUALITY;
 let score=0;
 for(const chord of chords){
  const offset=mod(chord.root-tonic);
  const expected=quality[offset];
  if(expected)score+=expected.includes(chord.family)?3:1.25;
  else if(degrees.includes(offset))score+=1;
  /*
   * Pitches the key does not contain count against it — that is what separates
   * a borrowed chord from a wrong guess. But a chord whose accidentals are
   * explained by where it resolves is not evidence against anything, so a
   * secondary dominant or a passing diminished is scored on its destination
   * instead of being punished for existing.
   */
  const next=chords[chords.indexOf(chord)+1];
  const explained=resolvesDownAFifth(chord,next)||passesUpASemitone(chord,next);
  if(explained&&next&&degrees.includes(mod(next.root-tonic)))score+=1.5;
  else{
   const outside=chord.pcs.filter(pc=>!degrees.includes(mod(pc-tonic))).length;
   score-=outside*0.45;
  }
 }
 // A progression tends to end where it lives, and to announce itself at the top.
 const last=chords[chords.length-1],first=chords[0];
 if(last&&mod(last.root-tonic)===0)score+=2.5;
 if(first&&mod(first.root-tonic)===0)score+=1.5;
 for(let i=0;i<chords.length-1;i++){
  const here=chords[i],there=chords[i+1];
  // A dominant resolving down a fifth onto the tonic is strong evidence.
  if(here.family==="dominant"&&mod(here.root-tonic)===7&&mod(there.root-tonic)===0)score+=2.5;
  /*
   * A ii–V is the strongest evidence of all, and it is what separates a key
   * from its neighbours. Cmaj7 A7 Dm7 G7 scores almost identically as C major
   * and as D minor — in D minor the A7→Dm7 reads as a V–i and wins by a
   * whisker. Only one of the two readings has a ii–V in it, and it is the
   * right one: Dm7 G7 is ii–V of C, and i–IV of D minor, which is not a
   * cadence at all.
   */
  const second=mod(here.root-tonic)===2&&(here.family==="minor"||here.family==="half-diminished");
  if(second&&there.family==="dominant"&&mod(there.root-tonic)===7)score+=2.5;
 }
 return score;
}

const MODE_NAMES:Record<number,string>={0:"Ionian",2:"Dorian",4:"Phrygian",5:"Lydian",7:"Mixolydian",9:"Aeolian",11:"Locrian"};

/**
 * The pitch a progression revolves around.
 *
 * Usually where it lands. But a progression that ends on a dominant is not
 * arriving, it is turning around to start again — a vamp on Am9 that closes
 * with E7sus4 is centred on A, not on E — so in that case the opening chord
 * carries the weight instead.
 */
function centreOf(chords:ParsedChord[]){
 const playable=chords.filter(c=>!c.error);
 if(!playable.length)return {centre:0,margin:0};
 const last=playable[playable.length-1];
 const turningBack=last.family==="dominant"||last.family==="suspended";
 const weight=new Map<number,number>();
 playable.forEach((chord,index)=>{
  let value=1;
  if(index===0)value+=turningBack?4:2;
  if(index===playable.length-1&&!turningBack)value+=4;
  weight.set(chord.root,(weight.get(chord.root)??0)+value);
 });
 const ranked=[...weight.entries()].sort((a,b)=>b[1]-a[1]);
 return {centre:ranked[0][0],margin:ranked[0][1]-(ranked[1]?.[1]??0)};
}

function findKey(chords:ParsedChord[]):KeyReading|null{
 const playable=chords.filter(chord=>!chord.error);
 if(!playable.length)return null;
 const candidates:{tonic:number,mode:KeyMode,score:number}[]=[];
 for(let tonic=0;tonic<12;tonic++)
  for(const mode of ["major","minor"] as KeyMode[])
   candidates.push({tonic,mode,score:scoreKey(playable,tonic,mode)});
 candidates.sort((a,b)=>b.score-a.score);

 const best=candidates[0],runnerUp=candidates[1];
 const perfect=playable.length*3+4;
 /*
  * Confidence is how far clear the winner is, not how high it scored. Two keys
  * a hair apart mean the progression has not said which one it is, and a single
  * chord never has — Dm7 alone belongs to C major, F major, B♭ major and more.
  */
 const margin=best.score-runnerUp.score;
 const fit=Math.max(0,Math.min(1,best.score/perfect));
 const separation=Math.max(0,Math.min(1,margin/3));
 const evidence=playable.length<2?0.25:playable.length<3?0.65:1;
 const {centre,margin:centreMargin}=centreOf(playable);
 const reading:KeyReading={
  tonic:best.tonic,mode:best.mode,
  name:`${PITCH_NAMES[best.tonic]} ${best.mode}`,
  confidence:Math.round(fit*separation*evidence*100),
  centre,
 };

 /*
  * The seven notes can be right while the name is wrong. If the progression
  * revolves around a degree that is neither the tonic nor its relative, the
  * player is hearing a mode, and calling it "G major" tells them nothing about
  * where home is.
  */
 if(centre!==best.tonic){
  const collectionTonic=best.mode==="major"?best.tonic:mod(best.tonic+3);
  const degree=mod(centre-collectionTonic);
  const name=MODE_NAMES[degree];
  if(name&&name!=="Ionian"&&name!=="Aeolian"){
   reading.modal={
    name:`${PITCH_NAMES[centre]} ${name}`,
    collection:`${PITCH_NAMES[collectionTonic]} major`,
   };
   /*
    * A modal progression scores nearly the same in every relative key, so the
    * separation that measures a functional reading is close to zero by
    * definition — which is why this said "A Dorian, 0% sure". What is actually
    * in doubt is how firmly the progression settles on its centre, so that is
    * what the number reports instead.
    */
   reading.confidence=Math.round(fit*Math.min(1,centreMargin/3)*evidence*100);
  }
 }
 return reading;
}

const FUNCTION_NOTE:Record<ChordFunction,string>={
 tonic:"Home. Rest, or the place a departure is measured from.",
 predominant:"Leaves home and prepares the dominant.",
 dominant:"Points back at the tonic and asks to be resolved.",
 chromatic:"Outside the key as written.",
 modal:"A degree of the mode — colour around one centre, not a step in a cadence.",
};

/**
 * Read a progression.
 *
 * Accepts what the fretboard accepts — bars separated by `|`, arrows or plain
 * spaces — and reports unreadable symbols rather than guessing at them.
 */
export function analyseProgression(text:string):ProgressionReading{
 const {symbols,chords,errors}=parseProgression(text);
 const key=findKey(chords);
 const observations:string[]=[];

 /*
  * A modal progression is measured from the note it revolves around, using
  * that mode's own degrees. Naming Am9 "iv7 of E minor" is arithmetically true
  * and useless; "i9 in A Dorian" is what the player is hearing.
  */
 const modal=key?.modal?MODE_DEGREES[key.modal.name.split(" ")[1]]:undefined;
 const home=modal&&key?key.centre:key?.tonic??0;

 const readings:ChordReading[]=chords.map((chord,index)=>{
  if(chord.error||!key)return {
   symbol:chord.symbol,root:chord.root,rootName:chord.rootName,
   numeral:"?",job:"chromatic" as ChordFunction,diatonic:false,
   note:chord.error??"No key could be read from these chords.",
  };

  const offset=mod(chord.root-home);
  const degrees=modal??(key.mode==="major"?MAJOR_DEGREES:MINOR_DEGREES);
  const quality=key.mode==="major"?MAJOR_QUALITY:MINOR_QUALITY;
  const expected=modal?undefined:quality[offset];
  const diatonic=modal
   ?degrees.includes(offset)&&chord.pcs.every(pc=>degrees.includes(mod(pc-home)))
   :degrees.includes(offset)&&!!expected&&expected.includes(chord.family);

  const {numeral,accidental}=numeralFor(offset,modal??key.mode);
  const minorish=!MAJOR_QUALITIES.includes(chord.family)&&chord.family!=="suspended";
  const written=accidental+(minorish?numeral.toLowerCase():numeral)+suffixFor(chord);

  const job:ChordFunction=modal
   ?(offset===0?"tonic":diatonic?"modal":"chromatic")
   :diatonic
    ?(key.mode==="major"?MAJOR_FUNCTION:MINOR_FUNCTION)[offset]??"chromatic"
    :"chromatic";

  const reading:ChordReading={
   symbol:chord.symbol,root:chord.root,rootName:chord.rootName,
   numeral:written,job,diatonic,note:FUNCTION_NOTE[job],
  };

  // A dominant that resolves down a fifth is the dominant of wherever it lands,
  // whether or not that target is the key's own tonic.
  const next=chords[index+1];
  if(chord.family==="dominant"&&next&&!next.error&&mod(chord.root-next.root)===7&&offset!==7){
   const targetOffset=mod(next.root-home);
   const target=numeralFor(targetOffset,modal??key.mode);
   const targetMinor=!MAJOR_QUALITIES.includes(next.family)&&next.family!=="suspended";
   const targetName=target.accidental+(targetMinor?target.numeral.toLowerCase():target.numeral);
   reading.secondaryOf=targetName;
   reading.numeral=`V${suffixFor(chord)}/${targetName}`;
   reading.job="dominant";
   reading.note=`Borrowed dominant: it treats ${next.rootName} as a tonic for one chord, then hands it back.`;
  }else if(!diatonic){
   // A chord outside the key is worth separating into the kind that has an
   // explanation and the kind that is simply outside.
   const parallel=key.mode==="major"?MINOR_DEGREES:MAJOR_DEGREES;
   const parallelQuality=key.mode==="major"?MINOR_QUALITY:MAJOR_QUALITY;
   if(parallel.includes(offset)&&parallelQuality[offset]?.includes(chord.family)){
    reading.borrowed=true;
    reading.note=`Borrowed from ${PITCH_NAMES[key.tonic]} ${key.mode==="major"?"minor":"major"} — the parallel key, not a change of key.`;
   }else if(degrees.includes(offset)){
    reading.note="On a scale degree of the key, but not the quality the key builds there.";
   }
  }
  return reading;
 });

 // Structure worth naming, once, in the order it happens.
 for(let i=0;i<readings.length-1;i++){
  const here=readings[i],there=readings[i+1];
  if(here.job!=="dominant"||here.secondaryOf)continue;
  const landsOnHome=mod(there.root-(key!.modal?key!.centre:key!.tonic))===0;
  const target=mod(there.root-(key!.modal?key!.centre:key!.tonic));
  if(landsOnHome&&mod(here.root-there.root)===7)
   observations.push(`${here.numeral} → ${there.numeral}: an authentic cadence, the strongest close in the key.`);
  else if(target===9&&key!.mode==="major")
   observations.push(`${here.numeral} → ${there.numeral}: a deceptive cadence — the dominant lands on vi and the tonic is denied.`);
  else if(target===4&&key!.mode==="major")
   observations.push(`${here.numeral} → ${there.numeral}: the dominant is evaded, stepping to iii instead of home.`);
  else if(landsOnHome)
   observations.push(`${here.numeral} → ${there.numeral}: the dominant resolves.`);
 }
 const predominant=readings.findIndex(r=>r.job==="predominant");
 const endsHome=readings[predominant+2]&&key
  &&mod(readings[predominant+2].root-(key.modal?key.centre:key.tonic))===0;
 if(predominant>=0&&readings[predominant+1]?.job==="dominant"&&endsHome)
  observations.push(`${readings[predominant].numeral} → ${readings[predominant+1].numeral} → ${readings[predominant+2].numeral}: the complete functional sentence.`);

 return {symbols,chords,errors,key,readings,observations};
}

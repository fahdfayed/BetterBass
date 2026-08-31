import {type Bar,type Event,type TabExercise,n} from "./notation.ts";

/**
 * Chromatic approach material, generated rather than written out.
 *
 * The course teaches chromatic approaches, enclosures and side-slipping in
 * three lessons carrying four exercises each, which is enough to explain the
 * devices and nowhere near enough to build them into the hands. Drilling them
 * properly means every device against every chord quality, aimed at every
 * chord tone, in every key — a few thousand short studies, which is a set
 * nobody would write by hand and nobody should have to.
 *
 * So the devices are described here as procedures and the notes are worked out
 * from them. A device says where its approach notes sit relative to the note
 * being approached; the generator supplies the chord, the target, the register
 * and the key. Everything it produces is derived from the procedure, and the
 * procedures are the common property of the idiom — an enclosure is a way of
 * arriving at a note, not a tune.
 */

/** A way of arriving at a note, as semitone offsets ending on the target. */
export type Device={
 id:string;
 name:string;
 /** Offsets from the target. The final 0 is the target itself. */
 offsets:number[];
 /** What it does to the ear. */
 explain:string;
 /** Where it earns its place. */
 use:string;
};

export const DEVICES:Device[]=[
 {id:"below",name:"Chromatic from below",offsets:[-1,0],
  explain:"A semitone under the target behaves as a leading tone and pushes upward into it.",
  use:"The default approach. Strongest when the target lands on a strong beat."},
 {id:"above",name:"Chromatic from above",offsets:[1,0],
  explain:"A semitone over the target behaves as a suspension and falls into it.",
  use:"Softer arrival than from below. Use when the line is descending anyway."},
 {id:"double-below",name:"Double chromatic from below",offsets:[-2,-1,0],
  explain:"Two semitones of runway make the arrival feel inevitable well before it happens.",
  use:"Fills three eighth notes cleanly. The workhorse of a walking line."},
 {id:"double-above",name:"Double chromatic from above",offsets:[2,1,0],
  explain:"The same runway descending, which releases into the target rather than driving into it.",
  use:"Ends a phrase without the push a leading tone gives."},
 {id:"enclose-ab",name:"Enclosure, above then below",offsets:[1,-1,0],
  explain:"Both neighbours are heard before the target, so it arrives as the answer to a question.",
  use:"The standard bebop enclosure. Ending from below drives hardest."},
 {id:"enclose-ba",name:"Enclosure, below then above",offsets:[-1,1,0],
  explain:"The same surround with the order reversed, so the target is settled onto from above.",
  use:"Use when the next phrase continues downward."},
 {id:"wide-above",name:"Whole tone above, semitone below",offsets:[2,-1,0],
  explain:"A wider step in makes the chromatic note underneath sound more pointed by contrast.",
  use:"When a plain enclosure has started to sound automatic."},
 {id:"wide-below",name:"Whole tone below, semitone above",offsets:[-2,1,0],
  explain:"The mirror of the above: a wide approach from underneath, settling down onto the target.",
  use:"Good over a descending bass line, where the wide step is already implied."},
 {id:"four-note",name:"Four-note enclosure",offsets:[2,1,-1,0],
  explain:"Three neighbours before the target. It occupies a whole beat and a half, so the target must be worth it.",
  use:"Reserve for the strongest chord tone in the phrase."},
];

/**
 * A chord to aim at, as semitones above its own root.
 *
 * The four core tones carry the quality and are what the guide-tone logic
 * reads. The extensions are targets too — a ninth or a thirteenth is where a
 * line goes when the chord tones have stopped being interesting — but they are
 * kept separate so that "the third" and "the seventh" stay at a known index.
 */
export type Quality={
 id:string;name:string;symbol:string;
 tones:number[];
 /** Ninth, eleventh and thirteenth, spelled as this chord takes them. */
 extensions:number[];
};

export const QUALITIES:Quality[]=[
 {id:"maj7",name:"Major seventh",symbol:"maj7",tones:[0,4,7,11],extensions:[14,18,21]},
 {id:"m7",name:"Minor seventh",symbol:"m7",tones:[0,3,7,10],extensions:[14,17,21]},
 {id:"dom7",name:"Dominant seventh",symbol:"7",tones:[0,4,7,10],extensions:[14,18,21]},
 {id:"m7b5",name:"Half diminished",symbol:"m7♭5",tones:[0,3,6,10],extensions:[14,17,20]},
 {id:"dim7",name:"Diminished seventh",symbol:"°7",tones:[0,3,6,9],extensions:[14,17,20]},
 {id:"min-maj7",name:"Minor major seventh",symbol:"mMaj7",tones:[0,3,7,11],extensions:[14,17,21]},
 {id:"six",name:"Major sixth",symbol:"6",tones:[0,4,7,9],extensions:[14,18,21]},
 // The altered and raised-eleventh chords, which is where most of the
 // interesting approach work actually happens.
 {id:"maj7-s11",name:"Major seventh ♯11",symbol:"maj7♯11",tones:[0,4,6,11],extensions:[14,18,21]},
 {id:"dom7-s11",name:"Dominant ♯11",symbol:"7♯11",tones:[0,4,6,10],extensions:[14,18,21]},
 {id:"dom7-s5",name:"Dominant ♯5",symbol:"7♯5",tones:[0,4,8,10],extensions:[13,15,18]},
 {id:"maj7-s5",name:"Major seventh ♯5",symbol:"maj7♯5",tones:[0,4,8,11],extensions:[14,18,21]},
];

/**
 * Name an extension from the interval, not from its position in the list.
 *
 * A fixed list of "9th, 11th, 13th" labelled maj7's raised eleventh as a
 * natural one, which is the note the chord specifically cannot take — the
 * natural 11 sits a semitone above the major third.
 */
const EXTENSION_NAME:Record<number,string>={
 13:"♭9th",14:"9th",15:"♯9th",17:"11th",18:"♯11th",20:"♭13th",21:"13th",
};
const extensionName=(semitones:number)=>
 EXTENSION_NAME[semitones]??`${semitones} semitones up`;

const TARGET_NAMES=["root","3rd","5th","7th"];

/**
 * How far under its own root a bar may reach.
 *
 * Not a musical limit but a transposing one. A study is moved to a new key by
 * finding a root of the right pitch class between 28 and 45, so a bar that digs
 * nine semitones below its root needs a root of at least 37 and can only reach
 * the nine keys above that. Holding the floor at six keeps all twelve.
 */
const FLOOR=-6;

/**
 * One bar: reach the target on beat 3, from the chord tones below it.
 *
 * Beats 1 and 2 are four eighths — chord tones, then the approach, so the
 * harmony is stated before it is decorated and the device is heard as one
 * gesture. The target takes beat 3 as a quarter note, because the lesson this
 * material drills says the approach gets the energy and the target gets the
 * authority, and a target no longer than its own approach does not sound like
 * an arrival. Beat 4 descends through the chord so the next bar has somewhere
 * to start from.
 */
function approachBar(tones:number[],targetIndex:number,device:Device):Bar{
 const target=tones[targetIndex];
 const approach=device.offsets.slice(0,-1).map(offset=>target+offset);

 /*
  * Chord tones climbing into the approach.
  *
  * Reading them from the bottom of the chord instead put the opening of the bar
  * an octave under its own target whenever the chord was voiced low — the bar
  * leapt internally before the device even started. These are the chord tones
  * directly beneath the approach, so the whole bar walks upward into the
  * target and the harmony is still stated before it is decorated.
  */
 const leadCount=4-approach.length;
 const ceiling=approach[0]??target;
 const lead=[...tones,...tones.map(tone=>tone-12)]
  .filter(tone=>tone<ceiling&&tone>=ceiling-7&&tone>=FLOOR)
  .sort((a,b)=>b-a)
  .slice(0,leadCount)
  .reverse();
 /*
  * Within a fifth there is not always a chord tone per beat — aiming at a root
  * leaves only the seventh and fifth beneath it. Repeating the lowest at the
  * start of the bar is what a bass line does anyway, and reaching a full octave
  * down instead needed a span of thirty-seven semitones from an instrument
  * that has thirty-five.
  */
 while(lead.length<leadCount)lead.unshift(lead[0]??target);

 /*
  * Two chord tones under the target, descending. Taking them from the octave
  * below as well as this one keeps the tail an arpeggio: aiming at the root
  * leaves nothing beneath it in its own octave, and padding with a repeat put
  * the same note down three times and reached below the low E.
  */
 const tail=[...tones,...tones.map(tone=>tone-12)]
  .filter(tone=>tone<target&&tone>=FLOOR)
  .sort((a,b)=>b-a)
  .slice(0,2);
 /*
  * Nothing below the target that the floor allows — a chord voiced at the
  * bottom of the register aiming at its own root. Continue upward through the
  * chord instead of downward, which keeps the bar four beats long and is what a
  * line does when it has run out of room underneath.
  */
 const above=tones.filter(tone=>tone>target).sort((a,b)=>a-b);
 for(let i=0;tail.length<2;i++)tail.push(above[i%Math.max(1,above.length)]??target);

 return [
  ...lead.map(deg=>n(deg,8)),
  ...approach.map(deg=>n(deg,8)),
  n(target,4,{accent:true}),
  ...tail.map(deg=>n(deg,8)),
 ] as Event[];
}

/**
 * Where the studies are written before they are transposed.
 *
 * A bar reaches {@link FLOOR} under its root and the upper-octave target
 * studies reach twenty-five above it, against a neck running from 28 to 63.
 * C2 clears both ends.
 */
const STUDY_ROOT=36; // C2

const KEY_SPELLING=["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"];

/**
 * Every device against every chord tone of one quality.
 *
 * Four bars, one target each, so a single study covers the whole chord and the
 * player hears the device change meaning as the target changes.
 */
export function deviceStudy(device:Device,quality:Quality):TabExercise{
 return {
  id:`chrom-${device.id}-${quality.id}`,
  title:`${device.name} · ${quality.symbol}`,
  brief:`Approach every chord tone of ${quality.symbol} using ${device.name.toLowerCase()}. `+
        `The target lands on beat 3 of each bar; the approach is the beat before it.`,
  pass:"Four bars at tempo with every target on beat 3 and no hesitation between bars.",
  root:STUDY_ROOT,
  rootName:`${KEY_SPELLING[STUDY_ROOT%12]}${quality.symbol}`,
  tempo:76,
  bars:quality.tones.map((_,index)=>approachBar(quality.tones,index,device)),
  loop:true,
 };
}

/**
 * One device, one target, across two octaves.
 *
 * The device study covers a chord; this covers a habit. Repeating one approach
 * into one chord tone is what makes it available without thinking, and doing it
 * an octave up stops it being a shape.
 */
export function targetStudy(device:Device,quality:Quality,targetIndex:number):TabExercise{
 const low=approachBar(quality.tones,targetIndex,device);
 const high=approachBar(quality.tones.map(t=>t+12),targetIndex,device);
 return {
  id:`chrom-${device.id}-${quality.id}-t${targetIndex}`,
  title:`${device.name} → ${TARGET_NAMES[targetIndex]} of ${quality.symbol}`,
  brief:`One device, one target, two registers. Approach the ${TARGET_NAMES[targetIndex]} of `+
        `${quality.symbol} using ${device.name.toLowerCase()}, then the same an octave up.`,
  pass:`The ${TARGET_NAMES[targetIndex]} lands on beat 3 in both registers without looking for it.`,
  root:STUDY_ROOT,
  rootName:`${KEY_SPELLING[STUDY_ROOT%12]}${quality.symbol}`,
  tempo:72,
  bars:[low,high,low,high],
  loop:true,
 };
}

/** A chord in a progression: how far above the tonic, and what quality. */
export type Step={degree:number;quality:string;label:string};

export type Progression={id:string;name:string;blurb:string;steps:Step[]};

const at=(degree:number,quality:string,label:string):Step=>({degree,quality,label});

/**
 * The harmony the devices get practised against.
 *
 * Static chords build the hand; changes build the ear. These are the sequences
 * a bassist actually meets, written as degrees above a tonic so each one exists
 * in every key without being written twice.
 */
export const PROGRESSIONS:Progression[]=[
 {id:"ii-v-i",name:"ii–V–I major",blurb:"The cadence most jazz harmony is assembled from.",
  steps:[at(2,"m7","ii"),at(7,"dom7","V"),at(0,"maj7","I")]},
 {id:"ii-v-i-minor",name:"ii–V–i minor",blurb:"The same motion into a minor tonic; the ii is half diminished.",
  steps:[at(2,"m7b5","iiø"),at(7,"dom7","V"),at(0,"m7","i")]},
 {id:"turnaround",name:"I–vi–ii–V turnaround",blurb:"The four bars that send a chorus back to its own beginning.",
  steps:[at(0,"maj7","I"),at(9,"m7","vi"),at(2,"m7","ii"),at(7,"dom7","V")]},
 {id:"iii-vi-ii-v",name:"iii–vi–ii–V",blurb:"The longer turnaround, descending the cycle a chord earlier.",
  steps:[at(4,"m7","iii"),at(9,"m7","vi"),at(2,"m7","ii"),at(7,"dom7","V")]},
 {id:"backdoor",name:"Backdoor ii–V",blurb:"iv and ♭VII resolving to the major tonic from underneath.",
  steps:[at(5,"m7","iv"),at(10,"dom7","♭VII"),at(0,"maj7","I")]},
 {id:"tritone",name:"Tritone substitute V",blurb:"The V replaced by the dominant a semitone above the tonic, so the bass descends by step.",
  steps:[at(2,"m7","ii"),at(1,"dom7","♭II7"),at(0,"maj7","I")]},
 {id:"blues-head",name:"Blues, first four bars",blurb:"The quick change: I to IV and back, all dominant.",
  steps:[at(0,"dom7","I7"),at(5,"dom7","IV7"),at(0,"dom7","I7"),at(0,"dom7","I7")]},
 {id:"blues-turn",name:"Blues, last four bars",blurb:"Where a blues chorus decides whether it is ending or going round again.",
  steps:[at(7,"dom7","V7"),at(5,"dom7","IV7"),at(0,"dom7","I7"),at(7,"dom7","V7")]},
 {id:"rhythm-a",name:"Rhythm changes, first four",blurb:"I–vi–ii–V at speed, where the chords move faster than the hand wants to.",
  steps:[at(0,"maj7","I"),at(9,"m7","vi"),at(2,"m7","ii"),at(7,"dom7","V")]},
 {id:"cycle",name:"Cycle of dominants",blurb:"Four dominants resolving down a fifth each time, which is the engine under most turnarounds.",
  steps:[at(2,"dom7","II7"),at(7,"dom7","V7"),at(0,"dom7","I7"),at(5,"dom7","IV7")]},
];

/**
 * Which guide tone each bar aims at.
 *
 * The third and the seventh are what carry a chord's quality, and they connect
 * by a semitone or less around the cycle — the third of ii is the seventh of V,
 * and the third of V is the seventh of I. Aiming at them alternately is what
 * makes a line state the changes rather than merely survive them; the two
 * chains are the two places that alternation can start.
 */
export type Chain="3-7"|"7-3";

const CHAIN_LABEL:Record<Chain,string>={
 "3-7":"third first",
 "7-3":"seventh first",
};

/**
 * The device carried through a progression.
 *
 * Devices practised on one static chord are a technique; the same devices
 * placed where the harmony changes are a line.
 */
export function progressionLine(device:Device,progression:Progression,chain:Chain):TabExercise{
 const start=chain==="3-7"?1:3;

 /*
  * Keep the whole line in one register.
  *
  * Built straight up from its degree, a V chord starts a fifth above the key
  * and its seventh lands an eleventh up, so the line jumped an octave whenever
  * the harmony moved. Folding the root down helps and is not enough on its own,
  * because a target can sit anywhere from a root to a seventh above it: aiming
  * at the seventh of ii and then the third of V still crosses an octave.
  *
  * So each chord is voiced in whichever octave puts its target nearest the
  * previous one, which is what a player does without thinking about it. The
  * pitch classes are unchanged; only the register the line sits in is chosen.
  */
 let previous:number|null=null;

 const bars=progression.steps.map((step,index)=>{
  const quality=QUALITIES.find(q=>q.id===step.quality)!;
  const folded=step.degree>6?step.degree-12:step.degree;

  /*
   * After the first chord, take whichever guide tone is nearest.
   *
   * Alternating third and seventh strictly is right while the roots move by
   * fourths, and wrong the moment they do not. A tritone substitute shares its
   * third with the chord it replaces — the third of ii and the third of ♭II7
   * are the same note — so the alternation sent the line across a tritone to
   * reach a seventh when the note it wanted was already under the finger.
   * Choosing by distance produces the alternation round the cycle by itself,
   * and does the right thing everywhere else.
   */
  const options=previous===null
   ?[{index:start,base:folded}]
   :[1,3].flatMap(targetIndex=>
     [folded-12,folded,folded+12]
      // Nearest-neighbour choices compound: over the four chords of a blues
      // turnaround each one reached slightly lower than the last until the bar
      // fell off the bottom of the neck. The band is what stops it walking.
      // Low enough that the bar clears FLOOR, high enough that a chord can be
      // voiced above the tonic when that is where its guide tone lives — the
      // seventh-first chain needs the V an octave up to reach the third of I
      // by a semitone rather than by a fifth.
      .filter(base=>base>=FLOOR&&base<=7)
      .map(base=>({index:targetIndex,base})));

  /*
   * Which guide tone first, which octave second.
   *
   * Judging candidates on written distance alone let register decide the note:
   * where the neck could not fit the right guide tone nearby, the line took the
   * wrong one in a convenient octave. The connection is a pitch-class
   * relationship — the seventh of iii really is a step from the third of vi —
   * so that is scored first, and the octave only breaks the tie.
   */
  const best=options.reduce((chosen,option)=>{
   if(previous===null)return chosen;
   const score=(o:typeof option)=>{
    const pitch=o.base+quality.tones[o.index];
    const apart=Math.abs(((pitch-previous!)%12+12)%12);
    return Math.min(apart,12-apart)*100+Math.abs(pitch-previous!);
   };
   return score(option)<score(chosen)?option:chosen;
  });

  previous=best.base+quality.tones[best.index];
  return approachBar(quality.tones.map(tone=>tone+best.base),best.index,device);
 });

 const names=progression.steps.map(step=>step.label).join(" ");
 return {
  id:`chrom-line-${progression.id}-${device.id}-${chain}`,
  title:`${progression.name} · ${device.name}`,
  brief:`${progression.blurb} One bar per chord (${names}), aimed at the guide tones, `+
        `${CHAIN_LABEL[chain]}. Every target lands on beat 3 and the approach is the beat before it.`,
  pass:"The changes are audible with nothing accompanying you, and no target is hunted for.",
  root:STUDY_ROOT,
  rootName:KEY_SPELLING[STUDY_ROOT%12],
  tempo:84,
  bars,
  loop:true,
 };
}

/**
 * Aiming above the seventh.
 *
 * Chord tones are where a line proves the harmony; extensions are where it says
 * something about it. A player who can only approach root, third, fifth and
 * seventh has the vocabulary of the chord and none of the colour, and the
 * ninth in particular is a target long before it is an exotic one.
 */
export function extensionStudy(device:Device,quality:Quality):TabExercise{
 const tones=[...quality.tones,...quality.extensions];
 return {
  id:`chrom-ext-${device.id}-${quality.id}`,
  title:`${device.name} → extensions of ${quality.symbol}`,
  brief:`Approach the ${quality.extensions.map(extensionName).join(", the ")} of ${quality.symbol} using `+
        `${device.name.toLowerCase()}. The chord is underneath the whole time; these are the `+
        `notes that say something about it rather than state it.`,
  pass:"Three extensions approached cleanly, each still sounding like part of the chord rather than above it.",
  root:STUDY_ROOT,
  rootName:`${KEY_SPELLING[STUDY_ROOT%12]}${quality.symbol}`,
  tempo:70,
  bars:quality.extensions.map((_,index)=>
   approachBar(tones,quality.tones.length+index,device)),
  loop:true,
 };
}

/**
 * One procedure, twelve bars, every key.
 *
 * Transposing a study to a chosen key is useful and is not the same as taking
 * it round the cycle: the point of the cycle is that the hand never settles,
 * and the exercise ends where it started having passed through all twelve. The
 * roots ascend by a fourth, which on this instrument is one string across.
 */
export function cycleStudy(device:Device,quality:Quality,targetIndex=1):TabExercise{
 let previous:number|null=null;
 const bars=Array.from({length:12},(_,step)=>{
  const pitchClass=(step*5)%12;
  const folded=pitchClass>6?pitchClass-12:pitchClass;
  const options=[folded-12,folded,folded+12].filter(base=>base>=FLOOR&&base<=7);
  const base=previous===null?options[options.length-1]:options.reduce((best,candidate)=>
   Math.abs(candidate+quality.tones[targetIndex]-previous!)
    <Math.abs(best+quality.tones[targetIndex]-previous!)?candidate:best);
  previous=base+quality.tones[targetIndex];
  return approachBar(quality.tones.map(tone=>tone+base),targetIndex,device);
 });

 return {
  id:`chrom-cycle-${device.id}-${quality.id}-t${targetIndex}`,
  title:`${quality.symbol} round the cycle · ${device.name}`,
  brief:`The same approach into the ${TARGET_NAMES[targetIndex]} of ${quality.symbol}, twelve times, `+
        `with the root rising a fourth each bar until it arrives back where it began. `+
        `A fourth is one string across, so the shape barely moves — only the position does.`,
  pass:"Twelve bars at one tempo with no bar taken more slowly than the others, and the last one leading back into the first.",
  root:STUDY_ROOT,
  rootName:`${KEY_SPELLING[STUDY_ROOT%12]}${quality.symbol} · cycle of fourths`,
  tempo:66,
  bars,
  loop:true,
 };
}

/** Everything the generator can produce, before any key is chosen. */
export const CHROMATIC_STUDIES:TabExercise[]=[
 ...DEVICES.flatMap(device=>QUALITIES.map(quality=>deviceStudy(device,quality))),
 ...DEVICES.flatMap(device=>QUALITIES.flatMap(quality=>
  quality.tones.map((_,index)=>targetStudy(device,quality,index)))),
 ...DEVICES.flatMap(device=>QUALITIES.map(quality=>extensionStudy(device,quality))),
 ...DEVICES.flatMap(device=>QUALITIES.flatMap(quality=>
  [1,3].map(index=>cycleStudy(device,quality,index)))),
 ...DEVICES.flatMap(device=>PROGRESSIONS.flatMap(progression=>
  (["3-7","7-3"] as Chain[]).map(chain=>progressionLine(device,progression,chain)))),
];

export const chromaticStudy=(id:string)=>CHROMATIC_STUDIES.find(study=>study.id===id);

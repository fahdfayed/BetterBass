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

/** A chord to aim at, as semitones above its own root. */
export type Quality={id:string;name:string;symbol:string;tones:number[]};

export const QUALITIES:Quality[]=[
 {id:"maj7",name:"Major seventh",symbol:"maj7",tones:[0,4,7,11]},
 {id:"m7",name:"Minor seventh",symbol:"m7",tones:[0,3,7,10]},
 {id:"dom7",name:"Dominant seventh",symbol:"7",tones:[0,4,7,10]},
 {id:"m7b5",name:"Half diminished",symbol:"m7♭5",tones:[0,3,6,10]},
 {id:"dim7",name:"Diminished seventh",symbol:"°7",tones:[0,3,6,9]},
 {id:"min-maj7",name:"Minor major seventh",symbol:"mMaj7",tones:[0,3,7,11]},
 {id:"six",name:"Major sixth",symbol:"6",tones:[0,4,7,9]},
];

const TARGET_NAMES=["root","3rd","5th","7th"];

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

 // Chord tones ahead of the approach, ascending from the root.
 const leadCount=4-approach.length;
 const lead=Array.from({length:leadCount},(_,i)=>tones[i%tones.length]);

 /*
  * Two chord tones under the target, descending. Taking them from the octave
  * below as well as this one keeps the tail an arpeggio: aiming at the root
  * leaves nothing beneath it in its own octave, and padding with a repeat put
  * the same note down three times and reached below the low E.
  */
 const tail=[...tones,...tones.map(tone=>tone-12)]
  .filter(tone=>tone<target)
  .sort((a,b)=>b-a)
  .slice(0,2);

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
 * Bounded at both ends: the tail reaches six semitones under the root, and the
 * upper-octave target studies reach twenty-five above it, against a neck that
 * runs from 28 to 63. That leaves 34 to 38, and C2 sits in the middle of it.
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

/**
 * The device carried through a ii–V–I.
 *
 * Devices practised on one static chord are a technique; the same devices
 * placed where the harmony changes are a line. Each bar aims at the guide tone
 * that states its own chord — the third of ii, the third of V, the third of I —
 * because that is the note the change is actually made of.
 */
export function cadenceLine(device:Device):TabExercise{
 // Relative to the tonic: ii is a whole tone up, V is a fifth up.
 const ii=2,V=7;
 const shift=(tones:number[],by:number)=>tones.map(tone=>tone+by);
 const m7=QUALITIES.find(q=>q.id==="m7")!.tones;
 const dom=QUALITIES.find(q=>q.id==="dom7")!.tones;
 const maj=QUALITIES.find(q=>q.id==="maj7")!.tones;

 return {
  id:`chrom-line-${device.id}`,
  title:`ii–V–I line · ${device.name}`,
  brief:`One device through a full cadence, aimed at the third of each chord. `+
        `Bar 1 is ii, bar 2 is V, bar 3 is I, bar 4 lets it settle.`,
  pass:"The third of each chord lands on beat 3 and the cadence is audible without accompaniment.",
  root:STUDY_ROOT,
  rootName:KEY_SPELLING[STUDY_ROOT%12],
  tempo:84,
  bars:[
   approachBar(shift(m7,ii),1,device),
   approachBar(shift(dom,V),1,device),
   approachBar(maj,1,device),
   [n(0,1)],
  ],
  loop:true,
 };
}

/** Everything the generator can produce, before any key is chosen. */
export const CHROMATIC_STUDIES:TabExercise[]=[
 ...DEVICES.flatMap(device=>QUALITIES.map(quality=>deviceStudy(device,quality))),
 ...DEVICES.flatMap(device=>QUALITIES.flatMap(quality=>
  quality.tones.map((_,index)=>targetStudy(device,quality,index)))),
 ...DEVICES.map(cadenceLine),
];

export const chromaticStudy=(id:string)=>CHROMATIC_STUDIES.find(study=>study.id===id);

/**
 * What the degree shorthand means.
 *
 * Every formula on the site is written the way a chart is — `1 2 ♭3 4 5 6 ♭7`
 * — and until now nothing anywhere said what those symbols stand for. A reader
 * who does not already know that ♭7 means the seventh note lowered by a
 * semitone cannot use a single one of them.
 *
 * This is also the one place that maps a written degree to a distance, so the
 * scale library, the dictionaries and the tests all measure formulas the same
 * way.
 */

export type Degree={
 /** Distance above the root, in semitones. */
 semitones:number;
 /** Every spelling that means this distance. */
 names:string[];
 /** What the interval is called. */
 label:string;
 /** What it does, in one line. */
 meaning:string;
};

/**
 * The thirteen distances inside an octave.
 *
 * Several have two spellings because the same distance is named differently
 * depending on whether it is read as a step of a scale or as an extension
 * stacked above a seventh chord — a 2nd and a 9th are the same note in
 * different octaves, and the shorthand does not distinguish them.
 */
export const DEGREES:Degree[]=[
 {semitones:0,names:["1"],label:"root",
  meaning:"Where everything else is measured from."},
 {semitones:1,names:["♭2","♭9"],label:"minor 2nd",
  meaning:"The 2nd lowered by a semitone — one fret above the root, and the most exposed note there is."},
 {semitones:2,names:["2","9"],label:"major 2nd",
  meaning:"A whole step above the root. Called the 9th when it sits above a seventh chord rather than inside the scale."},
 {semitones:3,names:["♭3","♯9"],label:"minor 3rd",
  meaning:"The 3rd lowered by a semitone. This is the note that makes a chord minor."},
 {semitones:4,names:["3"],label:"major 3rd",
  meaning:"This is the note that makes a chord major, so it is rarely the one to leave out."},
 {semitones:5,names:["4","11"],label:"perfect 4th",
  meaning:"A semitone above the major 3rd, so it rubs against it — pass through it or resolve it."},
 {semitones:6,names:["♯4","♭5","♯11"],label:"tritone",
  meaning:"Exactly half an octave, which is why it sounds unresolved from either direction."},
 {semitones:7,names:["5"],label:"perfect 5th",
  meaning:"The most stable note after the root, and the least informative — it belongs to major and minor alike."},
 {semitones:8,names:["♭6","♯5","♭13"],label:"minor 6th",
  meaning:"The 6th lowered by a semitone. It is what separates natural minor from Dorian."},
 {semitones:9,names:["6","13"],label:"major 6th",
  meaning:"Called the 13th above a seventh chord. It is what lifts Dorian out of plain minor."},
 {semitones:10,names:["♭7"],label:"minor 7th",
  meaning:"The 7th lowered by a semitone. It turns a major chord into a dominant and is the backbone of every blues."},
 {semitones:11,names:["7"],label:"major 7th",
  meaning:"A semitone below the octave, so it pulls hard upward into the root."},
 {semitones:12,names:["8"],label:"octave",
  meaning:"The same note twelve semitones up, in a higher register."},
];

/** A double-flatted 7th is spelled apart because it only appears in one scale. */
const EXTRA:Record<string,number>={"𝄫7":9};

const BY_NAME=new Map<string,Degree>();
for(const degree of DEGREES)for(const name of degree.names)BY_NAME.set(name,degree);

/** The degree a written symbol stands for, or undefined if it is not one. */
export const degreeOf=(token:string):Degree|undefined=>{
 const direct=BY_NAME.get(token);
 if(direct)return direct;
 const extra=EXTRA[token];
 return extra===undefined?undefined:DEGREES.find(d=>d.semitones===extra);
};

/** Semitones above the root, or undefined if the token is not a degree. */
export const semitonesOf=(token:string):number|undefined=>degreeOf(token)?.semitones;

/** True when every token in a formula is a degree this table knows. */
export const isDegreeFormula=(formula:string):boolean=>{
 const tokens=formula.trim().split(/\s+/).filter(Boolean);
 return tokens.length>0&&tokens.every(token=>semitonesOf(token)!==undefined);
};

/**
 * Split a formula into the parts that are degrees and the parts that are not.
 *
 * Formulas are not all degree lists: a lesson's is often a sentence, and some
 * dictionary rows offer alternatives. Splitting rather than parsing lets those
 * pass through untouched while the degrees inside them still get explained.
 */
export type FormulaPiece={text:string;degree?:Degree};
export const readFormula=(formula:string):FormulaPiece[]=>
 // Split on slashes as well as spaces: a formula often offers two spellings of
 // one distance as "♯4/♭5", and both halves deserve explaining.
 formula.split(/(\s+|\/)/).filter(part=>part!=="").map(part=>({text:part,degree:degreeOf(part)}));

/** How a distance is written, for naming a pitch heard against a root. */
export const degreeAt=(semitones:number):Degree=>
 DEGREES[((semitones%12)+12)%12];

const FLATS=["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"];

/**
 * The note a degree lands on above a root, as a bare pitch class.
 *
 * The explanation of a degree used to carry its own example in C. Beside an
 * exercise in A that read as a contradiction — the chip said C and the
 * sentence said E-flat — so the example is worked out from the root in front
 * of the reader instead.
 */
export const noteAbove=(rootPitchClass:number,semitones:number):string=>
 FLATS[(((rootPitchClass+semitones)%12)+12)%12];

/** How a degree reads for a given root: "in A, the ♭3 is C". */
export const exampleFor=(degree:Degree,rootPitchClass:number):string=>
 `In ${FLATS[((rootPitchClass%12)+12)%12]}, the ${degree.names[0]} is ${noteAbove(rootPitchClass,degree.semitones)}.`;

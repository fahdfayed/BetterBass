/**
 * A real notation glyph.
 *
 * Every codepoint below is SMuFL, drawn from the Standard Music Font Layout's
 * private-use range, and every one was checked against the shipped Bravura by
 * measuring its advance width against an unassigned control slot. None of them
 * is a Unicode lookalike: U+2669 is a text character shaped like a quarter note
 * and it is what an interface reaches for when it has no notation font. U+E1D5
 * is the quarter note, drawn by the people who drew the rest of the score, and
 * it sits on the same baseline and the same stem weight as the barlines beside
 * it. That difference is most of why engraving looks engraved.
 *
 * The face comes from `--smufl`, which the surrounding register sets, so the
 * same call renders in Leland inside a lesson and Petaluma inside a jam room.
 * Every stack ends in Bravura, so a register whose face has not been added
 * still draws a correct glyph rather than a missing-character box.
 */

/** SMuFL codepoints, verified present in Bravura. */
const GLYPHS={
 /* barlines and repeats */
 barline:"\u{E030}",
 barlineDouble:"\u{E031}",
 barlineFinal:"\u{E032}",
 repeatLeft:"\u{E040}",
 repeatRight:"\u{E041}",
 repeatBoth:"\u{E042}",
 /* navigation */
 dalSegno:"\u{E045}",
 daCapo:"\u{E046}",
 segno:"\u{E047}",
 coda:"\u{E048}",
 /* clefs */
 trebleClef:"\u{E050}",
 bassClef:"\u{E062}",
 /* notes, and the metronome cuts used in tempo marks */
 noteQuarter:"\u{E1D5}",
 noteEighth:"\u{E1D7}",
 metQuarter:"\u{ECA5}",
 metEighth:"\u{ECA7}",
 /* accidentals */
 flat:"\u{E260}",
 natural:"\u{E261}",
 sharp:"\u{E262}",
 /* marks */
 fermata:"\u{E4C0}",
 restQuarter:"\u{E4E5}",
 forte:"\u{E522}",
 timeSig4:"\u{E084}",
 timeSigCommon:"\u{E08A}",
} as const;

export type GlyphName=keyof typeof GLYPHS;

type Props={
 name:GlyphName;
 /**
  * What a screen reader should say. A glyph with no label is decorative and is
  * hidden: a repeat sign beside the words "four times" is drawn twice for the
  * eye and once for everyone else, and reading it aloud only adds noise.
  */
 label?:string;
 className?:string;
};

export default function Glyph({name,label,className}:Props){
 return (
  <span
   className={`glyph${className?" "+className:""}`}
   role={label?"img":undefined}
   aria-label={label}
   aria-hidden={label?undefined:"true"}
  >
   {GLYPHS[name]}
  </span>
 );
}

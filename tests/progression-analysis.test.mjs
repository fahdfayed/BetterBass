import assert from "node:assert/strict";
import test from "node:test";
import {analyseProgression} from "../src/theory/progression-analysis.ts";

/**
 * Reading a progression.
 *
 * Every case here has an answer musicians agree on, so a failure means the
 * analysis is wrong rather than that opinions differ. The site teaches Roman
 * numerals, function, secondary dominants and borrowing in prose; this is the
 * thing that has to actually do it.
 */

const numerals=text=>analyseProgression(text).readings.map(r=>r.numeral);
const jobs=text=>analyseProgression(text).readings.map(r=>r.job);
const key=text=>analyseProgression(text).key;

test("the ordinary cadences are read the way they are taught",()=>{
 assert.equal(key("Dm7 G7 Cmaj7").name,"C major");
 assert.deepEqual(numerals("Dm7 G7 Cmaj7"),["ii7","V7","Imaj7"]);
 assert.deepEqual(jobs("Dm7 G7 Cmaj7"),["predominant","dominant","tonic"]);

 // The same shape a tone up is the same analysis a tone up.
 assert.equal(key("Am7 D7 Gmaj7").name,"G major");
 assert.deepEqual(numerals("Am7 D7 Gmaj7"),["ii7","V7","Imaj7"]);

 // Minor takes its half-diminished second degree and a harmonic-minor dominant.
 assert.equal(key("Am7 Bm7b5 E7 Am7").name,"A minor");
 assert.deepEqual(numerals("Am7 Bm7b5 E7 Am7"),["i7","iiø7","V7","i7"]);
 assert.deepEqual(jobs("Am7 Bm7b5 E7 Am7"),["tonic","predominant","dominant","tonic"]);

 assert.deepEqual(numerals("Cmaj7 Am7 Dm7 G7"),["Imaj7","vi7","ii7","V7"]);
});

test("a secondary dominant is named for what it points at, not what it contains",()=>{
 /*
  * Cmaj7 A7 Dm7 G7 is the case that made this worth testing. A7 carries a C♯,
  * which is not in C major, and reading that as evidence against C major put
  * the whole progression in D minor — where A7→Dm7 looks like a V–i. Only one
  * of the two readings contains a ii–V, and it is the right one.
  */
 const reading=analyseProgression("Cmaj7 A7 Dm7 G7");
 assert.equal(reading.key.name,"C major");
 assert.deepEqual(reading.readings.map(r=>r.numeral),["Imaj7","V7/ii","ii7","V7"]);
 assert.equal(reading.readings[1].secondaryOf,"ii");
 assert.equal(reading.readings[1].job,"dominant");
 assert.match(reading.readings[1].note,/treats D as a tonic/);

 // The dominant of the third degree, inside a progression that stays in F.
 const neo=analyseProgression("Fmaj7 E7#9 Am9 Gm9 C13");
 assert.equal(neo.key.name,"F major");
 assert.equal(neo.readings[1].secondaryOf,"iii");
 assert.match(neo.readings[1].numeral,/^V7\/iii$/);
});

test("a borrowed chord is separated from a chord that is merely outside",()=>{
 const borrowed=analyseProgression("Cmaj7 Fm7 Cmaj7");
 assert.equal(borrowed.key.name,"C major");
 assert.equal(borrowed.readings[1].numeral,"iv7");
 assert.equal(borrowed.readings[1].borrowed,true);
 assert.match(borrowed.readings[1].note,/parallel key, not a change of key/);

 // A passing diminished climbs to the degree above, so it is that degree
 // raised — ♯i°7 — rather than the next one flattened.
 const passing=analyseProgression("Cmaj7 C#dim7 Dm7 G13");
 assert.equal(passing.key.name,"C major");
 assert.equal(passing.readings[1].numeral,"♯i°7","a diminished chord takes a lower-case numeral");
 assert.equal(passing.readings[1].diatonic,false);
});

test("a modal progression is read from the note it revolves around",()=>{
 /*
  * Am9 D13 Am9 E7sus4 is the site's own Dorian preset. Its seven notes are the
  * G major collection, so a purely functional reading lands on E minor and
  * calls the opening chord "iv7" — arithmetically true and no use to anyone
  * playing it. The centre is A, because a progression closing on a dominant is
  * turning around rather than arriving.
  */
 const dorian=analyseProgression("Am9 D13 Am9 E7sus4");
 assert.ok(dorian.key.modal,"this should be recognised as modal");
 assert.equal(dorian.key.modal.name,"A Dorian");
 assert.equal(dorian.key.modal.collection,"G major");
 assert.equal(dorian.key.centre,9,"A is the centre");
 // Am9 and D13 report the extension they carry, not the seventh underneath it.
 assert.deepEqual(dorian.readings.map(r=>r.numeral),["i9","IV13","i9","V7sus"]);
 assert.equal(dorian.readings[0].job,"tonic");
 assert.equal(dorian.readings[1].job,"modal","Dorian has no dominant to be a predominant for");

 /*
  * A modal progression scores about the same in every relative key, so the
  * separation a functional reading is measured by is near zero by definition.
  * Reporting that as the confidence said "A Dorian, 0% sure", which reads as
  * a contradiction; what is genuinely in doubt is the centre, so that is what
  * the number has to be about.
  */
 assert.ok(dorian.key.confidence>=50,
  `a clear modal centre should read as confident, got ${dorian.key.confidence}`);

 // A progression that lands on its tonic is not modal, it has simply arrived.
 assert.equal(analyseProgression("Dm7 G7 Cmaj7").key.modal,undefined);
});

test("confidence reports how much the progression actually settled",()=>{
 // A full cadence names its key beyond argument.
 assert.equal(analyseProgression("Dm7 G7 Cmaj7").key.confidence,100);

 // One chord never does. Dm7 alone lives in C, F, B♭ and more.
 const alone=analyseProgression("Dm7");
 assert.ok(alone.key.confidence<40,
  `one chord should not be confident, got ${alone.key.confidence}`);

 // Neither does a pair that could belong to several keys.
 assert.ok(analyseProgression("G7 Cmaj7").key.confidence<analyseProgression("Dm7 G7 Cmaj7").key.confidence);
});

test("cadences are named, and the ones that are denied are not called resolutions",()=>{
 const authentic=analyseProgression("Dm7 G7 Cmaj7").observations.join(" ");
 assert.match(authentic,/authentic cadence/);
 assert.match(authentic,/complete functional sentence/);

 // V→iii does not arrive, and saying "the dominant resolves" would teach the
 // opposite of what the ear hears.
 const evaded=analyseProgression("Dm7 G7 Em7 A7 Dm7 G7 Cmaj7").observations.join(" ");
 assert.match(evaded,/evaded, stepping to iii/);
 assert.doesNotMatch(evaded,/V7 → iii7: the dominant resolves/);

 // V→vi is the deceptive cadence by name.
 const deceptive=analyseProgression("Dm7 G7 Am7").observations.join(" ");
 assert.match(deceptive,/deceptive cadence/);
});

test("the numeral reports the tallest extension the chord carries",()=>{
 assert.deepEqual(numerals("Cmaj7"),["Imaj7"]);
 assert.deepEqual(numerals("C13 Fmaj7"),["V13","Imaj7"],"a 13th should not report itself as a seventh");
 assert.deepEqual(numerals("Dm9 G13 Cmaj9"),["ii9","V13","Imaj9"]);
});

test("unreadable input is reported rather than analysed",()=>{
 const bad=analyseProgression("Dm7 zzz Cmaj7");
 assert.equal(bad.errors.length,1,"the one unreadable symbol should be reported");
 assert.match(bad.errors[0],/zzz/);

 // Nothing at all is not an error, it is an empty analysis.
 const empty=analyseProgression("");
 assert.deepEqual(empty.readings,[]);
 assert.deepEqual(empty.errors,[]);
 assert.equal(empty.key,null);
});

test("bars and arrows are accepted the way the fretboard accepts them",()=>{
 const bars=analyseProgression("| Dm7 | G7 | Cmaj7 |");
 assert.deepEqual(bars.readings.map(r=>r.numeral),["ii7","V7","Imaj7"]);
 const arrows=analyseProgression("Dm7 → G7 → Cmaj7");
 assert.deepEqual(arrows.readings.map(r=>r.numeral),["ii7","V7","Imaj7"]);
});

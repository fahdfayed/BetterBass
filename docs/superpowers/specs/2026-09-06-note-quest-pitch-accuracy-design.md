# The Long Way Home: pitch-detection accuracy fix

Status: approved by user, pending spec review before planning.

## Problem

"The Long Way Home" (`src/views/NoteQuest.tsx`) asks the player to produce
one specific note at a time on a live bass, judged by pitch class against
the mic. It has been reported unusable: notes played correctly are
sometimes judged wrong (false rejection), and the reverse also happens
(false acceptance — a note gets accepted that wasn't the target).

The game-state logic (`src/quest-data.ts`) is not the cause — it is
already covered by `tests/quest.test.mjs` and its rules (checkpoint
fallback, pitch-class matching, miss counting) are straightforward and
correct. The cause is upstream, in the pitch detector itself
(`src/pitch.ts`).

## Diagnosis

`autoCorrelate` in `src/pitch.ts` implements the McLeod NSDF method. It
finds every correlation peak across the search range, takes the global
tallest, then walks peaks from short lag (high frequency) to long lag (low
frequency) and returns the **first peak that reaches `PEAK_RATIO` (0.8) of
the tallest**. That rule is a deliberate trade-off, documented in the
existing code comments: it exists to prefer a real note over a taller but
spurious peak at exactly double its period (a sub-octave partial — common
when a bass note has a weak fundamental).

The same rule fires identically whether the shorter-lag peak it picks is:

- **(a)** the true note, correctly preferred over a spurious sub-octave
  doubling (the case the rule was designed for), or
- **(b)** a genuine harmonic overtone of a *different, longer-lag* true
  note, incorrectly preferred over that true note.

The correlation curve is identical in both cases. The code's own comment
already admits this: *"which of the two is the note is not recoverable
from the curve — only from knowing which is likelier."* Bass tone commonly
carries strong 2nd/3rd harmonics, which is exactly the condition that
produces case (b).

This single ambiguity plausibly explains both reported symptoms:

- **False rejection**: the player's true note is undervalued relative to
  its own harmonic, so the harmonic's frequency is reported instead.
- **False acceptance**: a harmonic of some *other*, unplayed note reads as
  a real one and happens to match (or fails to match) the target.

## Goals

- Meaningfully reduce false-accept/false-reject in "The Long Way Home"
  specifically.
- Zero behavior change for every other screen that calls `autoCorrelate`
  (the tuner in `BassLab.tsx`, `PerformanceCoach.tsx`, `LiveSession.tsx`).
- Keep the change testable with synthetic signals, the same way
  `tests/pitch.test.mjs` already tests the detector.

## Non-goals

- Replacing the NSDF/McLeod algorithm family (Approach 3 from the
  brainstorm). The existing algorithm is well-reasoned; nothing found here
  suggests the algorithm *class* is wrong, only that one specific,
  previously-undecidable ambiguity can now be resolved with context this
  particular caller has and the detector itself does not.
- Extending the fix to other screens with known targets (e.g.
  `PerformanceCoach`'s ear-training exercises). The mechanism generalizes,
  but wiring it up elsewhere is out of scope for this pass — YAGNI until a
  second caller actually needs it.
- Any change to `quest-data.ts`'s judgment rules, checkpoint logic, or
  `NoteQuest.tsx`'s UI/UX. This is a detection-accuracy fix only.

## Design

### 1. `src/pitch.ts` — `autoCorrelate` gains an optional hint

```ts
export function autoCorrelate(b: Float32Array, rate: number, expectedPitchClass?: number)
```

Internally, the function already computes, during the coarse peak scan:

- `chosen` — the McLeod-selected peak's lag (today's return value's basis)
- the global tallest peak's value

It does **not** currently retain the tallest peak's *lag* once `chosen` is
picked. The fix retains it as `strongestLag`.

After picking `chosen` (exactly as today), add:

```
if (expectedPitchClass !== undefined && chosen !== strongestLag) {
  // This is exactly the ambiguous case: McLeod's rule overrode the
  // naive "pick the tallest" answer. Check which candidate, if either,
  // matches what the caller says it expects.
  const chosenPc = pitch class of (coarseRate / chosen)
  const strongestPc = pitch class of (coarseRate / strongestLag)
  const chosenMatches = chosenPc === expectedPitchClass
  const strongestMatches = strongestPc === expectedPitchClass
  if (strongestMatches && !chosenMatches) chosen = strongestLag
  // if chosenMatches, or both/neither match: no change, keep `chosen`
}
```

This runs before the existing fine-refinement step, which proceeds
unchanged using whichever coarse lag was ultimately selected.

**Behavior guarantee:** when `expectedPitchClass` is `undefined` (every
existing call site, unchanged), or when `chosen === strongestLag` (the
common, unambiguous case), the function is byte-for-byte identical to
today. The new branch can only ever change behavior when both a hint is
supplied *and* the specific ambiguity this spec diagnoses is present.

### 2. `src/BassLab.tsx` — thread the hint from child to mic loop

`BassLab.tsx` owns the mic loop (`tick()`, inside `startAudio`) for every
screen, including `NoteQuest`, which is rendered as a child when
`view==="quest"`. `NoteQuest` knows the current target pitch class
(`targetPitchOf(quest, walk)`); `BassLab.tsx` does not, and has no reason
to duplicate quest state to get it.

Add `expectedPitchRef = useRef<number | null>(null)`, alongside the
existing `harmonyRef`/`bpmRef`/`noiseRef` — the same "a child sets it via
an effect; the animation-frame loop reads it imperatively" pattern already
used for those refs. In `tick()`, read `expectedPitchRef.current` and pass
it (converted to `undefined` when `null`) as `autoCorrelate`'s third
argument.

Pass a setter down: `onExpectedPitch={pc => { expectedPitchRef.current = pc }}`.

### 3. `src/views/NoteQuest.tsx` — report the current target

New prop: `onExpectedPitch: (pitchClass: number | null) => void`.

Call it:
- Whenever `targetPitch` changes (an effect keyed on `targetPitch`,
  mirroring the existing `useEffect` that resets the walk on `lesson`
  change).
- With `null` when the walk is `done`, and on unmount (cleanup function of
  that same effect), so the hint doesn't leak into whatever screen the
  player opens next.

## Testing

Extend `tests/pitch.test.mjs`, using its existing synthetic-waveform
generators (`pluck`/`signal`, which already support a `harmonics` option):

1. Construct a signal genuinely ambiguous between a fundamental and its
   2nd or 3rd harmonic (tuned so today's McLeod rule picks the harmonic —
   reproduce the bug first, as a red test).
2. Assert `autoCorrelate(buffer, rate)` with no hint is unchanged
   (still exhibits today's behavior — this pins the "zero regression"
   guarantee, not the bug itself).
3. Assert `autoCorrelate(buffer, rate, hintForTrueFundamental)` returns
   the true fundamental's frequency.
4. Assert `autoCorrelate(buffer, rate, hintForHarmonic)` returns the
   harmonic's frequency (proving the hint can go either direction, not
   just "always prefer the lower note" — that would just be a different
   hardcoded bias, not a real fix).
5. A case where `chosen === strongestLag` (unambiguous): assert supplying
   any hint does not change the result.

## Risks / trade-offs

- This only helps callers with a known target. It does not improve
  general-purpose tuning/free-practice accuracy, which has no target to
  hint with — that gap is real but out of scope (see Non-goals).
- If the true ambiguity in practice is *not* the harmonic-vs-fundamental
  case diagnosed here (e.g., it's noise-driven, not harmonic-driven), this
  fix will show no improvement. The test plan's red test (step 1) is the
  checkpoint: if a genuinely ambiguous synthetic signal can't be
  constructed that reproduces today's failure, that's a signal to revisit
  the diagnosis before writing more code around it.

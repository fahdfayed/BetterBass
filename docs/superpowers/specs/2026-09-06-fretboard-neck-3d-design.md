# 3D fretboard neck: Phase 1 (spatial memory drill)

Status: approved by user, pending spec review before planning.

## Problem

`HarmonyFretboard.tsx` is the site's main practice tool for seeing where
notes sit against harmony — but it's a flat, 2D grid. The user wants a 3D
neck, specifically to help internalize where notes and patterns actually
sit in physical space, which a flat diagram doesn't convey.

The eventual goal, stated explicitly, is to **replace** `HarmonyFretboard`
entirely. That component is substantial: live mic-driven pitch feedback, a
multi-track backing-band progression player, root/mode/chord selection, and
a "fog" recall-fade filter, used from two call sites (`BassLab.tsx`'s main
"fret" screen and `LessonTools.tsx`'s embedded lesson-workspace variant).
Attempting all of that in one pass, in an unfamiliar rendering paradigm
(WebGL via React Three Fiber, replacing 2D SVG/DOM), was judged too large
and too risky to spec and build in one step — a working tool would be down
for however long the rewrite took, with no way to tell until the end
whether the 3D paradigm was even worth it.

This spec covers only **Phase 1**: a new, separate 3D neck for spatial
exploration. It does not touch `HarmonyFretboard.tsx` or either of its call
sites. Later phases (live pitch feedback, backing-band playback, and the
actual swap-and-retire of the 2D component) are out of scope here and will
each get their own spec once Phase 1 proves the paradigm is worth
continuing.

## Goals

- A 3D bass neck the player can rotate/explore, matching the site's real
  4-string tuning and fret count.
- Root and mode selectable; notes shown are the current mode's scale,
  colored by role (root/colour/scale) computed from the existing
  `SCALE_LIBRARY`/`MODES` data — reusing existing theory data, not
  inventing new.
- Clicking a note plays it, through the same `audition` callback every
  other screen already uses.
- Genuinely usable on the hardware this app is actually practiced on —
  not just a desktop demo.

## Non-goals (this phase)

- Live mic-driven pitch feedback (Phase 2, if Phase 1 is judged worth
  continuing).
- Backing-band / progression playback (Phase 3).
- The "fog" recall-fade filter from `HarmonyFretboard.tsx` — a specific
  pedagogical layer that can be revisited once the base 3D neck itself is
  proven.
- Replacing either of `HarmonyFretboard.tsx`'s call sites. This phase adds
  a new, separate view; nothing about `BassLab.tsx`'s or
  `LessonTools.tsx`'s existing "fret" screens changes.
- A loaded 3D model or external asset pipeline. The neck is procedural
  geometry (boxes, cylinders, spheres), generated from the same data the
  2D view already uses — consistent with how this codebase already
  prefers generated content over hand-authored assets (e.g. the Chromatic
  Gym's studies).

## Design

### 1. Shared geometry data

The tuning and fret count already exist as tested, exported data —
`src/fretboard-positions.ts`'s `OPEN_STRINGS` (`[43,38,33,28]`, MIDI, G
string first) and `TOP_FRET` (`20`) — used today for lighting up where a
heard pitch could be fretted. `HarmonyFretboard.tsx` separately declares
its own `STRINGS`/`FRETS` consts for its own purposes (pitch-class-based
theory lookups rather than MIDI-based position-finding); that duplication
already exists and is out of scope to unify here.

A new `src/fretboard-neck-geometry.ts` imports `OPEN_STRINGS`/`TOP_FRET`
from `fretboard-positions.ts` rather than re-deriving them, and adds only
what doesn't exist yet:
- `fretPosition(fret, scaleLength)` — real fret spacing via the standard
  12th-root-of-2 formula, since real frets are not evenly spaced and an
  evenly-spaced neck would look and feel wrong in 3D in a way it never
  did as a flat 2D grid.
- `notesInMode(root, mode)` and the role classifier from section 2 below.

Nothing in `HarmonyFretboard.tsx` changes in this phase.

### 2. The 3D scene

New file `src/views/FretboardNeck3D.tsx`, built with `@react-three/fiber`
(the React-idiomatic wrapper for Three.js, matching this codebase's React
patterns everywhere else) and `@react-three/drei` (for `OrbitControls` and
convenience helpers). New dependencies: `three`, `@react-three/fiber`,
`@react-three/drei`.

- **Neck**: a single elongated box, sized from `fretPosition`'s real
  spacing rather than an arbitrary length.
- **Frets**: thin cylinders positioned via `fretPosition`, laid across the
  neck's width.
- **Strings**: four thin cylinders running the neck's full length, spaced
  to match `OPEN_STRINGS`'s order.
- **Notes**: a small sphere at each string/fret intersection whose pitch
  class (`mod(OPEN_STRINGS[string]+fret)`) falls in the current mode's
  scale.

  Colored by a 4-tier role, computed directly from the mode data that
  already exists — **not** `classifyNote`, which turns out not to fit:
  it requires a full `ParsedChord` (core tones, tensions, guide tones),
  and Phase 1 has no chord, only a root and a mode. Feeding it a
  fabricated single-note "chord" would exercise branches built for real
  chord tensions with no real tensions behind them. The correct reuse is
  simpler and needs no chord at all:
  - **Root** — `iv===0`.
  - **Colour** — `iv` is one of `SCALE_LIBRARY[mode].character` (the
    mode's own identifying tones, already used exactly this way
    elsewhere).
  - **Scale** — `iv` is in `MODES[mode].s` but not root or colour.
  - **Outside** — not in `MODES[mode].s` (already excluded from getting
    a sphere at all, per the note above — kept as a named tier here only
    because the legend and the shared role type describe the full
    range).
  This is genuinely a 4-tier scheme, not the 5-tier
  root/chord/colour/scale/outside one `HarmonyFretboard.tsx` shows —
  "chord" and "guide-tone" tiers describe a note's relationship to a
  *sounding chord*, which doesn't exist until Phase 3 wires in
  progression playback. Reusing `SCALE_LIBRARY`/`MODES` unchanged still
  satisfies the spirit of "reuse existing theory data, don't invent
  new" — it's `classifyNote` specifically that doesn't apply yet, not
  the underlying data.
- **Camera**: `OrbitControls` for drag-to-rotate and scroll-to-zoom,
  starting at an angle looking down the neck the way a player sees their
  own instrument, not a flat elevation.

### 3. Interaction

- Root and mode selectors above the canvas, the same dropdown/button
  pattern used elsewhere in the app (not a new control style).
- Clicking a note sphere calls the existing `onAudition([pc])` prop and
  gives the sphere a brief highlight pulse — the only "judgment" this
  phase makes; there is no scoring, no drill structure, no session.
- A small legend maps each role to its color, since color alone is never
  the only signal anywhere else in this app either.

### 4. Where it lives

Phase 1 is reachable as its own screen under the "Specialties" section of
`BassLab.tsx`'s navigation — the same section that already lists Arabic
maqam and Slap bass: novel, optional tools rather than core lesson flow,
which is exactly what an evaluatory 3D neck is right now. It gets its own
`view` value (e.g. `"neck3d"`) alongside the existing ones, behind
`React.lazy` like every other heavy tool screen already is. It does not
replace, wrap, or get embedded into the existing "fret" view or
`LessonTools.tsx`.

## Testing

- `fretPosition`'s spacing formula is pure math — tested directly with
  `tests/fretboard-neck-geometry.test.mjs`, asserting known real-world fret
  ratios (e.g. the 12th fret sits at exactly half the scale length).
- The note-set-for-a-mode computation and the root/colour/scale role
  classification (section 2) are likewise pure and testable without
  React or WebGL.
- The 3D scene itself (React Three Fiber components, camera, meshes) is
  not unit-tested — this codebase has no precedent for testing rendered
  WebGL output, and building one for a single evaluatory screen is not
  justified here. It is verified by hand in the browser instead.

## Risks / trade-offs

- **Bundle size**: `three` + `@react-three/fiber` + `@react-three/drei`
  add real weight to a build that already warns about >500kB chunks. This
  phase does not attempt code-splitting or lazy-loading beyond whatever
  this codebase's existing `lazy()`-per-screen convention already gives
  it for free (every other heavy tool screen is already behind
  `React.lazy`; this one will be too).
- **Mobile performance**: WebGL on lower-end phones can be a real
  regression from a plain 2D DOM view. This phase does not attempt mobile
  optimization or a 2D fallback — it's an evaluation screen, and if
  Phase 1 doesn't hold up on the hardware this app is actually practiced
  on, that is itself the answer to whether later phases are worth doing.
- **Unproven paradigm for this codebase**: nothing in this repo currently
  uses WebGL or a 3D library. This phase is deliberately scoped small
  specifically so that risk is contained to one new, separate,
  low-stakes screen rather than a tool players already depend on.

---
name: Outside In Bass Lab
description: A music book open on a stand, printed, pencilled and played from, with the instrument along the bottom edge.
colors:
  stand: "#101619"
  stand-2: "#0a0f12"
  stand-line: "rgba(250,247,240,.10)"
  fold: "#0c1113"
  fold-line: "rgba(250,247,240,.07)"
  fold-shade: "rgba(27,26,23,.11)"
  on-stand: "rgba(250,247,240,.90)"
  on-stand-2: "rgba(250,247,240,.66)"
  on-stand-3: "rgba(250,247,240,.55)"
  paper: "#faf7f0"
  paper-2: "#f4efe3"
  paper-3: "#ede7d8"
  paper-edge: "#e2dbc9"
  ink: "#1b1a17"
  ink-2: "#46443e"
  ink-3: "#6a675e"
  ink-4: "#9c988c"
  rule: "#dcd6c6"
  rule-2: "#c3bca8"
  rule-3: "#a9a08a"
  stave: "#ded8c9"
  gutter-shade: "rgba(27,26,23,.055)"
  vermillion: "#c4351a"
  vermillion-deep: "#9d2811"
  vermillion-wash: "rgba(196,53,26,.10)"
  vermillion-wash-2: "rgba(196,53,26,.18)"
  on-vermillion: "#fffaf5"
  pencil: "#2f5c9e"
  pencil-2: "#24497f"
  pencil-wash: "rgba(47,92,158,.09)"
  moss: "#63701a"
  moss-line: "#8a9a33"
  moss-wash: "rgba(99,112,26,.12)"
  caution: "#8a6206"
  stop: "#8f2f14"
  neck-voice: "#0f6b78"
  neck-colour: "#6b3f8c"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.375rem, 1.4rem + 4.2vw, 4.75rem)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-.015em"
  headline:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.375rem, 1.15rem + 1.05vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "0"
  title:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.125rem, 1.05rem + .45vw, 1.4375rem)"
    fontWeight: 620
    lineHeight: 1.2
    letterSpacing: "0"
  body:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "clamp(.9375rem, .9rem + .18vw, 1rem)"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "max(11px, .6875rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: ".14em"
  hand:
    fontFamily: "Caveat, Segoe Script, cursive"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "0"
  readout:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.5rem, 1.4rem + 4.6vw, 5.25rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-.015em"
    fontFeature: "tabular-nums lining-nums"
  notation:
    fontFamily: "Bravura, serif"
    fontSize: "1.375rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0"
rounded:
  control: "2px"
  surface: "3px"
  well: "2px"
  page: "10px"
  switch: "9999px"
  notehead: "50%"
spacing:
  s1: ".25rem"
  s2: ".5rem"
  s3: ".75rem"
  s4: "1rem"
  s5: "1.25rem"
  s6: "1.75rem"
  s7: "2.5rem"
  s8: "3.5rem"
  s9: "5rem"
  s10: "7rem"
  stave-gap: "7px"
  stave-height: "28px"
components:
  rocker:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1.25rem"
    height: "2.375rem"
  rocker-hover:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
  rocker-on:
    backgroundColor: "{colors.vermillion-wash}"
    textColor: "{colors.vermillion}"
  rocker-pencil:
    backgroundColor: "transparent"
    textColor: "{colors.pencil}"
    rounded: "{rounded.control}"
  tape:
    backgroundColor: "{colors.vermillion}"
    textColor: "{colors.on-vermillion}"
    typography: "{typography.label}"
    rounded: "0"
    padding: "1rem 2.5rem"
    height: "2.75rem"
  tape-hover:
    backgroundColor: "{colors.vermillion-deep}"
    textColor: "{colors.on-vermillion}"
  tape-disabled:
    backgroundColor: "{colors.rule-2}"
    textColor: "{colors.ink-2}"
  chalk:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1.75rem"
    height: "2.5rem"
  switch:
    backgroundColor: "{colors.paper-3}"
    rounded: "{rounded.switch}"
    width: "2.5rem"
    height: "1.375rem"
  switch-on:
    backgroundColor: "{colors.vermillion}"
    rounded: "{rounded.switch}"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
  panel:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "1.75rem"
  well:
    backgroundColor: "{colors.paper-3}"
    textColor: "{colors.ink}"
    rounded: "{rounded.well}"
    padding: "1rem"
  page:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.page}"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-3}"
    typography: "{typography.body}"
    rounded: "0"
    padding: "0 1.25rem"
    height: "3.5rem"
  tab-current:
    backgroundColor: "transparent"
    textColor: "{colors.vermillion}"
  plate-label:
    backgroundColor: "transparent"
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
  section-mark:
    backgroundColor: "transparent"
    textColor: "{colors.vermillion}"
    typography: "{typography.label}"
  annotation:
    backgroundColor: "transparent"
    textColor: "{colors.pencil}"
    typography: "{typography.hand}"
  index-tab:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
    rounded: "0 10px 10px 0"
    width: "2.5rem"
  index-tab-current:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.vermillion}"
  transport-strip:
    backgroundColor: "{colors.stand-2}"
    textColor: "{colors.on-stand}"
    typography: "{typography.label}"
    rounded: "{rounded.page}"
    height: "4.25rem"
  transport-key:
    backgroundColor: "{colors.vermillion}"
    textColor: "{colors.on-vermillion}"
    rounded: "10px 0 0 10px"
    width: "5.25rem"
  transport-key-running:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
---

# Design System: Outside In Bass Lab

## Overview

**Creative North Star: "The Working Page"**

This is not a page you read. It is a page you play from, propped on a stand
with both of your hands on an instrument, and every decision in the system
follows from that. The book is open to a spread: the section's contents on the
left, today's work on the right, the instrument docked in a strip along the
bottom edge. Nothing floats over anything, because nothing on a stand does.

The material is warm ivory paper on a dark blue-black stand, and paper is the
material rather than a theme. Two things are dark, and both are objects rather
than themes: the stand the book lies on, and the instrument strip bolted to the
foot of it, which is a machine and reads as one. Depth is what paper does: the book casts a real shadow onto
the stand, a raised element takes a fine white top edge, and a well is cut into
the sheet as darker stock. Nothing here is glass, so nothing has anything to
blur.

Three things carry the look. **The stave is the grid**: lists are set on real
five-line staves with a real SMuFL clef at the head of each line, and the ruling
is the paper a row is printed on rather than a divider drawn between rows.
**Four hands, never mixed**: Playfair strikes the title, Source Serif prints
everything read, Inter is stamped small and tracked as the engraved plate label
above a control, and Caveat writes in the margin in pencil blue. **Vermillion is
live**: the red marks what is running, what is current and what to press — never
what is important — so a page with nothing running and nothing to press carries
no red at all, and that is the correct amount.

**Key Characteristics:**

- Paper is the ground. Two things are dark and both are objects rather than
  themes: the stand the book lies on, and the instrument strip bolted to the
  foot of it. There is one ground; a book does not have a night mode.
- A workspace opens as a spread. Reading on the verso, the instrument on the
  recto, and a real binding down the middle that both pages curve into.
- The page is printed first, annotated in pencil second, and worked from third.
  Anything the interface must communicate is printed; the pencil is beside it.
- Lists are set on staves. Rules are what a row sits on, not what separates it.
- Everything interactive is a ruled rectangle at a 2px trim. The only fully
  rounded control is a switch.
- Four inks with four jobs: ink reads, vermillion is live, pencil annotates,
  moss is a measurement taken off the player.
- Depth is cast shadow, a lit top edge, and a milled well. No `backdrop-filter`
  anywhere.
- Ink lands on paper, and pages turn. Arrival is a settle and a darkening;
  changing what is on a page turns it about the binding.
- The fore-edge carries an index. Four tabs cut into the outer edge of the
  book, always in the same order and the same position.
- Motion is governed by the transport. While the clock runs, durations are
  musical values and a route change lands on the next eighth.

## Colors

Warm ivory in three steps, warm black in four, and three inks that each mean one
thing.

### Primary

- **Vermillion** (`#c4351a`): the one red, and it is a state rather than an
  emphasis. It fills the transport's play key, the strip of tape that commits an
  action, the rule under the section name on the left page, the current tab, and
  the margin mark beside the entry you are on. It is measured to work in both
  directions — as ink on paper and with white sitting on it — which is why it is
  a shade deeper than the swatch looks: a brighter red sets a beautiful heading
  and an illegible caption, and this one has to do both.
- **Deep Vermillion** (`#9d2811`): the pressed and hovered state of anything
  vermillion, and the ink used when a vermillion label sits inside its own
  vermillion wash, where the lighter red would fall under AA.

### Secondary

- **Pencil Blue** (`#2f5c9e`): the hand that annotates. It writes the margin
  notes in Caveat, rules the arrows that point at what a note is about, marks
  guide tones on the neck, and outlines the secondary action — the one you
  listen to rather than commit to.
- **Moss** (`#63701a`): the instrument's own colour on the page, and it is
  always a reading taken off the player: waveforms, cent deviations, tempo
  reached, criteria met. Nothing moss is pressable. A pass is moss because a
  pass is a measurement.

### Tertiary

- **Ochre** (`#8a6206`): the colour of a pencil correction. Caution only.
- **Deep Oxide** (`#8f2f14`): a stop, and it is deeper than the vermillion so
  that stop and play never read as the same mark on the transport, where they
  sit side by side.

### Neutral

- **Paper** (`#faf7f0`): the sheet. The ground of both pages and the transport
  strip.
- **Shaded Paper** (`#f4efe3`): the shading that falls near the gutter and under
  a raised element; also the hover ground of a ruled control.
- **Well Stock** (`#ede7d8`): the darker stock of a well cut into the page.
- **Warm Black** (`#1b1a17`): everything set to be read, and the fill of the
  second-commitment button.
- **Ink Two** (`#46443e`): a control's resting label, secondary prose. 9.1:1.
- **Ink Three** (`#6a675e`): the floor for anything that is read, at 5.3:1 on
  paper and 4.6:1 in a well.
- **Mark Ink** (`#9c988c`): 2.7:1, and therefore not a text colour. It draws the
  clef at the head of a contents row, a spent life, a disabled control.
- **Rule / Enclosing Rule / Heavy Rule** (`#dcd6c6` / `#c3bca8` / `#a9a08a`):
  three printed greys for engraving. They are printed rather than transparent
  black, so a rule over the shaded paper near the gutter never goes darker than
  the same rule out on the open sheet.
- **Stave** (`#ded8c9`): the five ruled lines, one weight, never varied.
- **Stand** (`#101619`) and **Stand Line** (`rgba(250,247,240,.10)`): the dark
  blue-black surface the book lies on, and the ground of the instrument strip
  (`#0a0f12`) bolted to the foot of it. Both carry their own three ink steps in
  the paper colour, because the page ink is near-black and cannot be read out
  there — the strip repoints the whole ink scale at those steps rather than
  restating every control in a second colour.
- **Fold** (`#0c1113`): the binding a spread opens at, and darker than the stand
  because you are looking into a gutter rather than at the surface under it. It
  carries one lit hairline (`rgba(250,247,240,.07)`) down its centre, and the
  paper darkens into it over the last few centimetres of each page
  (`rgba(27,26,23,.11)`).

### Named Rules

**The Vermillion Is Live Rule.** Red marks what is running, what is current, and
what to press. It never marks what is important. Audit test: if you removed every
running clock and every pressable control from a screen and any vermillion
remained, that vermillion is wrong.

**The Four Jobs Rule.** Every colour on the page answers one question. Ink: is
this read? Vermillion: is this live? Pencil: is this an aside in the margin?
Moss: was this measured off the player? A value that answers two of them has
been reached for out of habit.

**The Mark Ink Rule.** `--ink-4` is for marks, never for words. It measures
2.7:1 on paper. If it is setting a word, the word is not meant to be read, and
the answer is `--ink-3` rather than a lighter grey.

**The Redundant Code Rule.** Every colour signal is paired with a word or a glyph
in the markup. On the neck a role carries hue, an ink step, a ring and a fill,
never hue alone.

## Typography

**Display Font:** Playfair Display (with Georgia, serif)
**Body Font:** Source Serif 4 (with Georgia, Times New Roman, serif)
**Label Font:** Inter (with system-ui, sans-serif)
**Margin Hand:** Caveat (with Segoe Script, cursive)
**Notation:** Bravura — real SMuFL, self-hosted

**Character:** Four hands doing four jobs, and which one is which is the whole
typographic system. The didone strikes a title and a numeral big enough to read
from the stand; the printer's serif sets every sentence; the sans is a rubber
stamp that never sets a sentence; the script stays in the margin. Mixing them is
not a stylistic slip, it is a category error.

All five faces are self-hosted as variable `woff2` under `/fonts`. Source Serif
and Playfair italic are preloaded because they render above the fold on the
opening page; Inter, Caveat and Bravura arrive a beat late by design.

### Hierarchy

- **Display** (Playfair Display, 400, `clamp(2.375rem, 1.4rem + 4.2vw, 4.75rem)`,
  1.02, `-.015em`): the struck title at the head of a page, and the wordmark. It
  is often two voices in one line, with an `<em>` set roman inside the italic.
- **Headline** (Source Serif, 600, `clamp(1.375rem, 1.15rem + 1.05vw, 2rem)`,
  1.15): a section within a page.
- **Title** (Source Serif, 620, `clamp(1.125rem, 1.05rem + .45vw, 1.4375rem)`,
  1.2): a subsection or a card heading.
- **Body** (Source Serif, 400, `clamp(.9375rem, .9rem + .18vw, 1rem)`, 1.65):
  everything read. Measure 65–75ch; the narrow reading column is capped at
  `--measure-text` (34rem).
- **Label** (Inter, 500, `max(11px, .6875rem)`, 1, `.14em`, uppercase): the
  engraved plate above a control. It states what the control does, above whatever
  the control currently says. Section marks and tape labels go wider at `.22em`.
- **Hand** (Caveat, 400, `1.0625rem`, 1.25, rotated `-1.5deg`): the margin. An
  aside, a reminder, an instruction the player gives himself.
- **Readout** (Playfair Display, 500, `clamp(2.5rem, 1.4rem + 4.6vw, 5.25rem)`,
  tabular lining figures): a number read from across the room — tempo, bar,
  cents.

### Named Rules

**The Four Hands Rule.** Playfair strikes, Source Serif prints, Inter stamps,
Caveat writes in the margin. Reach for Playfair through `--font-title` only, and
only for a struck page title, the wordmark, or a numeral. `--font-display` stays
on the printer's serif: fourteen stylesheets ask for it by name, and pointing it
at the didone puts the entire interface into italic — lesson titles and the word
PASSED included.

**The Positive Tracking Rule.** Tracking is zero on anything set in a serif,
because a serif on a page wants its designed fit. The didone comes in a hair at
display size (`-.015em`) where its own fit opens up. The only place tracking goes
far is the stamped label, where it goes far positive (`.14em`, `.22em`) — 11px
uppercase without tracking is a smudge.

**The Small Didone Rule.** A didone has hairlines. Set it small and they
disappear. Playfair below `--t-h3` is a bug.

**The Real Glyph Rule.** A clef, a notehead, a time signature and a repeat sign
are drawn in Bravura, never in a Unicode lookalike. Every symbol stack ends in
Bravura, so a register whose first-choice face is missing loses its handwriting
and keeps its engraving rather than falling through to a text font that draws a
quarter note as a lowercase box.

### Notation registers

`data-register` on any container picks both the symbol face and the handwriting
face for everything inside it: `engraved` (Leland), `classical` (Bravura with the
didone as script), `jazz` (Petaluma), `chart` (MuseJazz). One attribute, four
hands, and the fallback always ends in Bravura.

## Layout

**The bound spread.** `.stand` is `100dvh` with `.5rem` of padding and never
scrolls; inside it a three-column grid lays out the verso
(`clamp(17rem, 24vw, 22rem)`), the gutter (`2.25rem`), and the recto
(`minmax(0, 1fr)`); the transport strip is a fixed `4.25rem` along the bottom.
The spread does not scroll as a unit — each page scrolls inside itself, the way
the two halves of an open book are read independently — and that is also what
lets the whole thing fit a viewport exactly.

The recto carries the tab row across its head at `3.5rem`, then the sheet. Pages
are capped at `--measure` (74rem) for reading and `--measure-wide` (120rem) for
a workspace, with `--page-pad` at `clamp(1.25rem, 2.4vw, 2.5rem)`. A fourth
column holds the fore-edge index at `2.5rem`.

**A split workspace opens as a spread.** Inside the recto, the instruction and
the instrument sit on facing pages with the binding between them:
`minmax(20rem, 1fr)` for the reading, `.625rem` of fold, `minmax(30rem, 1.2fr)`
for the work, and no gap — the pages meet the fold rather than standing off it.
The standard for the stage is the last thing printed on the reading page, so the
fold runs the full height of the spread. Below 84rem the spread stacks into one
column and the fold goes with it: a binding drawn down the middle of a single
column is a dark band through the reading.

**Spacing** runs `.25 / .5 / .75 / 1 / 1.25 / 1.75 / 2.5 / 3.5 / 5 / 7rem`. The
stave is measured separately and in pixels: `--stave-gap` is `7px` and the
five-line height is `28px`, because a stave that scales with its text stops being
a stave and becomes an underline pattern.

**Responsive.** Breakpoints at 34, 44, 52, 62, 64, 68 and 84rem. The verso
collapses below 64rem and the spread becomes a single page. A two-pane workspace
stacks at 84rem — that stop is set from the recto's width rather than the
window's, because the split lives inside the right page and the book chrome takes
roughly 400px before the split is measured at all. Rails that outgrow their width
scroll sideways and pin their trailing controls to the scrollport.

### Named Rules

**The Scrolling Column Rule.** A scrolling flex column never shrinks what it is
scrolling: `.page > *` and `.leaf > *` are `flex-shrink: 0`. Without it a child
whose automatic minimum is zero — anything with an `overflow` of its own, or an
explicit `min-height: 0` — collapses to its padding and lets its contents spill
out and be clipped, silently.

**The Independent Pages Rule.** The stand does not scroll. The verso scrolls, the
recto scrolls, and the transport is not part of the document.

**The Recto Measures Itself Rule.** Any minimum inside the right page is measured
against the recto, not the viewport. A grid that adds up to less than the window
can still add up to more than the page it is printed on.

**The Fold Owns The Curl Rule.** The shading either side of the binding hangs off
the fold, not off the two pages. Painted on the panes it stops wherever the
shorter pane stops — the workspace is sticky and capped at the viewport — and a
binding shaded for two thirds of its length is a stripe again.

## Elevation & Depth

Paper depth, which is three things and no glass. A book lying on a stand casts a
real shadow with an offset and a soft blur, because a zero-offset halo is
decoration rather than light. Something resting on the page takes a fine white
top edge and a short shadow. A well is cut into the page as darker stock with the
light caught along its inner top edge. There is no `backdrop-filter` in the
system: nothing here is glass, so nothing has anything to blur.

### Shadow Vocabulary

- **Book** (`0 28px 70px -24px rgba(0,0,0,.62), 0 3px 10px rgba(0,0,0,.28)`):
  the two pages and the transport strip, cast onto the stand. Used three times in
  the whole design.
- **Raise** (`0 1px 0 rgba(255,255,255,.75), 0 1px 3px rgba(27,26,23,.14)`): a
  lit top edge and a short shadow, for something resting on the page.
- **Tape** (`0 2px 4px -1px rgba(27,26,23,.28)`), lifting to
  `0 4px 8px -2px rgba(27,26,23,.32)` on hover and
  `0 1px 2px -1px rgba(27,26,23,.30)` on press.
- **Well** (`inset 0 1px 3px rgba(27,26,23,.12), inset 0 0 0 1px var(--rule)`):
  recessed, never emphasised.
- **Press** (`inset 0 2px 4px rgba(27,26,23,.18)`): the active state of a ruled
  control. The press goes into the page.
- **Block** (`-4px 6px 0 0 var(--paper-edge), -8px 12px 0 0 var(--rule-2),
  -12px 18px 0 0 var(--rule-3)` on the verso, mirrored straight down with no
  `x` on the recto): three crisp, unblurred steps, each further and a shade
  duller than the last, not a shadow — see The block (signature), below.

### Named Rules

**The No Glass Rule.** `--blur` is `none` and `--depth-panel` is `none`. Do not
apply `backdrop-filter` to anything. A panel is a ruled box, not a pane.

**The Press Goes In Rule.** Active states push into the surface with an inset
shadow. Nothing lifts on press; only the strip of tape, which is stuck to the
page rather than printed on it, rises a pixel on hover.

**The Flat Panel Rule.** A panel carries no fill and no shadow — the page is
already the right colour, and a second ivory inside the first only muddies the
rule that separates them.

## Shapes

A ruled box has a hard corner. The radius is the printer's trim: `2px` for a
control, `3px` for a bordered surface, `2px` for a well. The only exception is
the page itself — the verso, the recto and the transport strip take a `10px`
trimmed corner because a printed sheet has one, and nothing printed on them
borrows it. That is what keeps a button from reading as a smaller copy of the
page it sits on.

Two things are round, and both are round because the object is: a switch, which
is a rounded slot with a travelling knob, and a notehead, which is a circle.

Rules come in three weights and one heavy terminator: `--rule` separates,
`--rule-2` encloses, `--rule-3` is the heavy engraving, and a `3px` bar of full
ink is a final barline — it ends a system rather than dividing one. The red rule
under a section name is `2.75rem × 2px` of vermillion.

### Named Rules

**The Ruled Rectangle Rule.** Interactive means a hard-cornered rectangle at
`2px`. The switch is the one exception, and it earns it by being a switch.

**The Trimmed Corner Rule.** `10px` belongs to the three physical objects — verso,
recto, transport — and to nothing inside them.

**The No Radius In Focus Rule.** Never set `border-radius` inside a focus rule.
It reshapes the element rather than the outline.

## Components

### Buttons

- **Rocker / Action** — the default control. A ruled rectangle: transparent
  ground, `1px solid var(--rule-2)`, `2px` radius, `.5rem 1.25rem` of padding,
  `2.375rem` minimum height, and an Inter plate label in `--ink-2` at 11px
  uppercase tracked `.14em`. Hover darkens the label to full ink and lays down a
  `--paper-2` ground; active takes the inset press. Pressed-on
  (`aria-pressed="true"`) turns the whole control vermillion — label, border and
  a 10% wash.
- **Tape (`.action-primary`, `.rocker-go`)** — the one that commits. A strip of
  vermillion tape stuck to the page: no radius at all, `--on-vermillion` label at
  600 weight tracked `.22em`, `1rem 2.5rem` of padding, `2.75rem` tall, on the
  tape shadow. The torn ends are two fixed-width `5px` pseudo-elements carrying a
  ten-point `clip-path`, positioned `-6px` outside each edge — fixed width rather
  than a percentage polygon, so the tear stays the same size whether the label is
  one word or four. Hover deepens the red and lifts a pixel; active drops a pixel.
  Disabled goes to `--rule-2` with `--ink-2` on it, at 5.1:1.
- **Chalk (`.chalkPill`)** — the second commitment: the same rectangle struck in
  ink rather than vermillion, `--paper` on `--ink`, for an action that matters but
  is not the one thing the page is asking for.
- **Pencil rocker (`.rocker-pencil`)** — the listening action, outlined in the
  margin hand. Pencil blue label and border; hover fills with the pencil wash.
  Hear it before you commit.

### Switch

The one fully rounded control: a `2.5rem × 1.375rem` slot in `--paper-3` with a
`--rule-2` edge and a travelling knob in `--paper` on the knob shadow. On, the
slot fills vermillion and the knob runs to the far end.

### Fields

`--paper` ground, `1px solid var(--rule-2)`, `2px` radius, `.5rem 1rem` padding,
set in Source Serif at body size. Hover raises the border to `--rule-3`. Native
`<option>` lists are painted in paper and ink so a dropdown does not open a black
panel out of an ivory page.

### Panels and wells

- **Panel** — a ruled box: no fill, `1px solid var(--rule)`, `3px` radius, no
  shadow.
- **Well** — cut into the page: `--paper-3`, no border, the inset well shadow.
  It means recessed, never emphasised.

### Navigation

- **Tabs** — the section rail across the head of the recto, `3.5rem` tall,
  separated by vertical `1px` rules rather than gaps so the row reads as one strip
  of tabs cut from the same sheet. Source Serif at body size in `--ink-3`; hover
  goes to full ink on a `--paper-2` ground; the current tab is vermillion with a
  `2px` vermillion rule beneath it — the same mark the verso uses under its
  section name, so "where am I" is answered in the same hand twice. The rail
  scrolls sideways when the sections stop fitting and pins its trailing controls
  to the scrollport edge.
- **Contents list (the verso)** — the section's screens in course order, each row
  printed on its own stave with a Bravura bass clef at its head, a Playfair
  numeral, and a two-line blurb. There is no border between rows: five ruled lines
  already say where one entry ends and the next begins. The entry you are on takes
  a `2px` vermillion rule down its leading edge — the one place a colour runs
  along an edge — because a fill would cover the ruling that makes it a stave. The
  page ends in a pencilled note at its foot.

### Stave and clef

`.stave` and `.staveRow` paint five `1px` lines as a repeating gradient rather
than as five elements, so a list of forty rows costs forty backgrounds and not
two hundred nodes. Text knocks the ruling out behind it with a three-layer
`text-shadow` halo in the paper colour — what an engraver does, and what every
engraving program does. `.clef` renders U+E050, U+E062 and U+E069 in Bravura at
the same stem weight as everything else on the line.

### The binding (signature)

Where a workspace opens as a spread, the two pages meet at a real fold rather
than at a rule. It is drawn in three parts and needs all three or it reads as a
dark stripe: the gutter itself (`--fold`, `.625rem`), deepest at its centre; one
lit hairline down that centre, which is the light catching the fold and the only
thing keeping it from reading flat; and the curl, a `2.75rem` wash of
`--fold-shade` hung off each side of the gutter, darkening whichever page is
under it. Nothing in the fold takes a pointer, so it sits above the page rather
than under it — a sticky element at the foot of the reading page would otherwise
punch a rectangle of flat paper through the middle of the binding.

### The block (signature)

The spread is not two loose sheets resting on the stand — it is cut from a
book, and a book has a block: the stack of every page behind the one open to
right now. The block only shows where no other sheet is bound to it, which is
every edge but the spine, so three crisp, unblurred steps trail off the verso
and the recto — `--paper-edge`, then `--rule-2`, then `--rule-3` — each one
further out and a shade duller than the last, cast in the same `10px` trim as
the page itself since a box-shadow inherits its caster's radius. Three steps
and a widening gap between them, not one, because a stack this shallow reads
as a smudge on the edge of the page rather than as more pages behind it; the
darkening is what tells the eye it is looking at depth and not dirt. The two
pages recede in opposite directions because a bound book's two fore-edges
fall on opposite sides of the spine: the verso's steps trail down and further
left, toward the outer edge of the stand where nothing else is docked; the
recto's trail straight down, never right, because its fore-edge is where the
index tabs are already cut into the stand. The stand's own padding was
widened to `1.5rem` (desktop) and `1rem` (stacked) to give the deepest step
room to land clear of the stand's edge rather than being clipped by it.
Below the point the spread closes into one page, the two recede as a single
set of steps under the whole book, the same way the two pages already
collapse into one shadow there.

### Index tabs (signature)

Four tabs cut into the fore-edge of the book, on the stand rather than on the
page, because a tab is behind the sheet and not printed on it. `2.5rem` wide,
trimmed on the outer corners only, in `--paper-2` with the label set in the
stamp hand and rotated to run up the edge. They hold the four questions that
interrupt playing — what is this called, where am I, can I hear it, what have I
proved — always in the same order and the same position, so the one you want is
reached for rather than read for. Hovering slides the tab `3px` out of the book,
which is what a hand does to a tab, and it is the whole hover state. The current
tab comes forward to full paper, turns vermillion, and takes a `2px` rule down
its inner edge.

Below 64rem the book is a single page and there is no fore-edge to cut, so the
index goes; its four destinations are all in the contents palette.

### Transport (signature)

The instrument strip along the bottom edge of the stand, full width, dark, and
set entirely in the label face — it is a machine bolted to the foot of the stand
rather than a page with controls printed on it, and it reads as one because it
shares the ground the book lies on. The play key is full-bleed into the corner — `5.25rem` wide,
carrying the strip's own `10px` trim on its left corners — because it is a key on
a machine rather than a button on a page: the one control a hand reaches for
without looking, and a key at the corner can be hit by feel. It is the one
vermillion fill in the chrome, and while the clock runs it goes to ink, so a
stopped transport and a running one are never the same colour in the same place.
Groups are divided by barlines rather than gaps.

### The neck (signature)

The fretboard is the product's centre, and it is the one place the design carries
more than its four inks: the job a note is doing is content, not decoration, and
four jobs told apart by ink weight alone are four jobs the player has to decode
mid-bar. So role gets hue here, and only here.

- **Root** — `--vermillion-deep` on a 13% vermillion fill, with the one ring on
  the board. It is told apart by hue, a ring and a fill rather than by being the
  blackest thing on the neck.
- **Guide tone** — pencil blue on an 8% pencil fill, with a hairline ring.
- **Chord tone / written** — full ink on a 5% ink wash, at 500 weight.
- **Voice** — teal (`#0f6b78`). **Colour** — plum (`#6b3f8c`).
- **Available / approach / outside** — the achromatic tail, in three legible
  steps: `--ink` for a chord tone, `--ink-2` for available, `--ink-3` for
  outside, at 16.3:1, 9.1:1 and 5.3:1. The further out the note, the lighter the
  ink, and the lightest still clears AA — these are the notes the product exists
  to explain.

Fret pads keep their left border, because the left border of a fret pad *is* the
fret; without it the board is one undivided field and the labels of adjacent
frets run together into a single line of letters.

### The page turn (signature)

Changing what is on a page turns a leaf of the book, about the binding, over
`460ms` on `cubic-bezier(.46,.03,.24,1)` — slow at both ends and quick through
the middle, because a turned page is lifted against its own weight, tips past
the vertical, falls, and lands.

**The sheet is paper, not a picture of one.** It is a real element rather than a
snapshot of the outgoing page, and that decides everything else about it. A
snapshot has one side, so there is no moment in it where the back of the sheet
exists — which is the only part of a page turn that says "page". This world's
paper is one flat ivory, so a real sheet and a captured one are the same to the
eye, and the real one costs one element and three gradients.

**The leaf has two sides, and needs both.** The front is on screen for about a
fifth of a second while it is visibly rotating, and that is the part that reads
as a page lifting; without it the first half of the arc contains nothing, and
the turn becomes a shadow fading in and out. The front earns its place by not
being flat: it carries the gutter shading on its binding edge, because that
shading belongs to the sheet and travels with it; it darkens toward the free
edge, the way paper does as it curves away from the lamp; and the free edge
takes a soft shadow, which is the page's own thickness.

The reverse is a shade cooler, mirrors its gutter shading (rotated a half turn,
the binding edge is on the other side), and takes a hairline of catch-light on
its trimmed edge. The sheet thins out only over the last tenth of the arc as it
lands, because the left page here is a standing contents list rather than a pile
for it to lie on.

**Direction carries information.** The reading order in `nav.ts` is the
authority: a later destination turns the page forward, an earlier one turns it
back, played as the same arc in reverse. The course states that lessons open in
order and the left page prints that order against every entry, so the turn is
the third place the interface says it without words.

A route change turns the working page. A stage change turns the reading page of
a spread alone, because the instrument beside it has not changed and turning it
would say that it had. The stand, the fore-edge index and the instrument strip
never turn — furniture that flips is a glitch, not a transition.

The turn is a real element and not a View Transition, deliberately. That API
cross-fades two snapshots, cannot show a reverse, defers its DOM update to the
next rendering opportunity, and aborts outright when the document is hidden or
another transition is in flight — so a route change routed through it arrived a
click late in a background tab, and the animation silently did not happen. The
leaf runs either way, and it is cleaned up by its own `animationend` with a
timer as a backstop for the case where no frame ever comes.

### Named Rules

**The Plate Label Rule.** A control's label is engraved above it and does not
change. What the control currently says goes inside the control.

**The Margin Is Never Load-Bearing Rule.** Anything the interface must
communicate is printed. The pencil hand is written next to it, and a screen that
still works with every `.annot` deleted is correct.

**The Nut Is The Line Rule.** The first fret in a row drops its left border,
because the string-name column already draws the nut as a heavy rule and a
hairline a pixel to its right reads as the nut printed twice.

## Do's and Don'ts

### Do:

- **Do** let paper be the ground and keep the stand as the only dark surface.
- **Do** spend vermillion only on what is running, current, or pressable. If
  nothing on the screen is any of those, the screen carries no red.
- **Do** set every list on staves, with a real Bravura clef at the head of each
  line and the ruling knocked out behind the words.
- **Do** give every interactive element a `2px` hard corner, and reserve `10px`
  for the verso, the recto and the transport strip.
- **Do** engrave a plate label above a control in Inter at 11px uppercase,
  tracked `.14em`.
- **Do** keep `--ink-3` as the floor for anything read, and `--ink-4` for marks
  only.
- **Do** self-host every face and every symbol font under `/fonts`.
- **Do** put `flex-shrink: 0` on the children of any scrolling flex column.
- **Do** theme the browser's own furniture — selection, caret, scrollbar, focus
  ring, and tabular figures — from this palette.
- **Do** open a split workspace as a spread, with the binding between the pages
  and no gap standing them off it.
- **Do** turn a page about the binding when what is printed on it changes, and
  turn it the way the reading order went.
- **Do** keep the fore-edge index in one order and one position.
- **Do** collapse every entrance to its final state under `prefers-reduced-motion`.

### Don't:

- **Don't** point `--font-display` at Playfair. The didone is reached through
  `--font-title` only.
- **Don't** set Playfair below `--t-h3`; its hairlines disappear.
- **Don't** apply `backdrop-filter` to anything. There is no glass here.
- **Don't** set `border-radius` inside a focus rule.
- **Don't** track a serif. Tracking is zero on anything set in Source Serif or
  Playfair body copy, and far positive only on the stamped label.
- **Don't** use `--ink-4` for words. It measures 2.7:1.
- **Don't** rank a note's role by hue alone — the ink step, the ring and the fill
  have to carry it too.
- **Don't** introduce a second ground or a theme attribute. There is one ground;
  a rule gated on a theme that is never set is a rule that does nothing while the
  value it was written to correct stays live.
- **Don't** put a fill behind a row that is set on a stave. It covers the ruling
  that makes it a stave; mark it in the margin instead.
- **Don't** let a control inside a page borrow the page's `10px` corner.
- **Don't** hotlink a font, image, script or stylesheet from a third-party host.
  They are blocked outright here and the failure is silent.
- **Don't** measure a minimum inside the right page against the viewport.
- **Don't** put a rule between two pages of a spread. The fold is the divider,
  and a line beside it reads as a scratch down the binding.
- **Don't** draw the fold on a stacked layout. One column has no gutter.
- **Don't** turn the stand, the fore-edge index or the instrument strip. Only
  pages turn.
- **Don't** remount a live tool to animate it. Hold the turn as state.
- **Don't** judge motion from a paused frame. Blank paper over the page looks
  broken in a still and reads as a page in motion; a turn assessed by scrubbing
  loses the half of itself that only exists at speed.
- **Don't** route a navigation through a View Transition. It defers the DOM
  update to the next rendering opportunity and aborts when the document is
  hidden, so the address arrives late and the motion does not arrive at all.
- **Don't** reach for `--bg` when you mean the page. The legacy token file
  repoints it at the shaded stock; the page is `--paper`.
- **Don't** widen the block's steps past what `.stand`'s own padding can hold.
  The stand clips — it is not a document — so a deepest step past `1.5rem`
  (desktop) or `1rem` (stacked) is a step silently cut short rather than a
  thicker book. Widen the padding to match if the block ever needs more.

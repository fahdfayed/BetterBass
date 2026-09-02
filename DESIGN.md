---
name: Outside In Bass Lab
description: A bass workstation photographed rather than diagrammed, with one orange and a light you move.
colors:
  ground: "#000000"
  ground-2: "#0a0a0b"
  lift: "rgba(255,255,255,.06)"
  lift-2: "rgba(255,255,255,.10)"
  glass: "rgba(255,255,255,.20)"
  glass-line: "rgba(255,255,255,.30)"
  ink: "#ffffff"
  ink-2: "rgba(255,255,255,.80)"
  ink-3: "rgba(255,255,255,.62)"
  ink-4: "rgba(255,255,255,.44)"
  hairline: "rgba(255,255,255,.14)"
  flame: "#e8702a"
  flame-deep: "#d2611f"
  chalk: "#ffffff"
  on-chalk: "#111827"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(3rem, 1.6rem + 6vw, 8rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-.08em"
  accent:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(3rem, 1.6rem + 6vw, 8rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-.05em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 1.2rem + 1.4vw, 2.5rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-.08em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(.875rem, .85rem + .15vw, .9375rem)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-.02em"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "max(11px, .6875rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: ".01em"
rounded:
  control: "9999px"
  surface: "1.5rem"
  well: "1rem"
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
components:
  pill-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1.25rem"
    typography: "{typography.label}"
    height: "2.5rem"
  pill-flame:
    backgroundColor: "{colors.flame}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1.75rem"
    height: "2.75rem"
  pill-chalk:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.on-chalk}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1.75rem"
    height: "2.75rem"
  nav-pill:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "0.5rem"
  glass-pane:
    backgroundColor: "{colors.lift}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "1.75rem"
  field:
    backgroundColor: "{colors.lift}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
---

# Design System: Outside In Bass Lab

## Overview

**Creative North Star: "The Lit Face"**

The instrument photographed, not diagrammed. A dark full-bleed image with the
interface floating over it, and a light you move across the picture to reveal
what is underneath. The loudest thing on any screen is the photograph; the
chrome is glass over the top of it.

Three things carry the look and all three are pinned. **Type is two voices in
one line**: Playfair Display italic and Inter alternating inside a single
heading, the first clause set and the second stated. Tracking is negative
everywhere and hard negative on display, which is most of why it reads
expensive. **Everything interactive is a pill**, without exception, because a
half-measure between pill and square reads as neither. And **colour is almost
absent**, one orange spent on the single thing to press, with every other
distinction carried by white at four opacities.

The restraint is the point. A design with one accent and four greys puts all of
its energy into the imagery and the type, which is why it survives being applied
to a dense working screen and not just a hero.

**Key Characteristics:**

- Photography is the ground; the interface floats over it in glass.
- One orange. If two things on a screen are orange, one is wrong.
- Every control is a pill; nothing is square.
- Playfair italic is an accent, never a display default.
- Tracking is negative everywhere, hardest on the sans display line.
- Entrances arrive out of blur, on one exponential curve.

## Colors

Black under photographs, white at four opacities, and a single oxide orange.

### Primary

- **Flame** (`#e8702a`): The one thing to press. It fills the primary pill,
  marks the current position on the neck, and draws the focus ring. It deepens
  to `#d2611f` on hover and carries a soft glow beneath the button. It appears
  nowhere else; two flames on a screen means one of them is wrong.

  The label on it is near-black (`#1a0d04`, 6.15:1), not white. White reads 3.1
  on this orange, which is below AA at button size. Cream runs a deeper flame
  (`#c05411`) where white reaches 4.65 and near-black would fall to 4.09, so
  `--on-flame` is defined per theme and the two must not be collapsed back into
  one value.

### Secondary

- **Chalk** (`#ffffff` on `#111827`): The second action shape, a white pill. Used
  where an action matters but is not the commitment on that screen.

### Neutral

- **Ground** (`#000000`) and **Ground 2** (`#0a0a0b`): True black, because a
  photograph over near-black looks washed.
- **Lift** (6%) and **Lift 2** (10%): Surfaces, as white at low alpha rather
  than as lighter greys. Glass over a picture, not a panel beside one.
- **Glass** (20%) with a **30%** line: The floating nav pill and the dock.
- **Ink** and three steps (100 / 80 / 62 / 44%): Every textual distinction in
  the system, and most of the non-textual ones.

### On-image ink

The hero's copy sits on a photograph rather than on the theme's ground, so it
has its own tokens (`--on-image`, `--on-image-2`) that stay white in both
themes. Flipping them with the theme would put dark type on a dark photo.

A **scrim** runs top-to-bottom over the imagery at 55% / 15% / 25% / 75%. It is
not decoration: without it the copy is legible over the dark half of an image
and invisible over the bright half, which is the most common way a hero like
this ships broken.

### Named Rules

**The One Flame Rule.** One orange element per screen, and none when there is no
action to take.

**The Four Greys Rule.** Every distinction that is not "press this" is carried
by white at one of four opacities. Reaching for a fifth colour means the
hierarchy has not been thought through.

**The Photograph Wins.** Nothing in the chrome may compete with the image. When
a surface and a photograph both want attention, the surface loses.

## Typography

**Interface:** Inter (300, 400, 500, 600, 700)
**Accent:** Playfair Display italic (400, 500, 600)
**Notation:** Bravura, and by register Leland, Petaluma, Petaluma Script,
MuseJazz, MuseJazz Text

Self-hosted as WOFF2 under `/fonts`, both SIL Open Font Licence.
The brief specifies a Google Fonts `@import`; that is replaced with self-hosting
because a linked font stylesheet does not arrive in this project and the failure
is silent, so the page keeps its layout and quietly wears system-ui.

### The notation register

Musical content is engraved rather than styled. Six further faces exist for it,
all SIL Open Font Licence, all served from `/fonts` beside the other two.

Only **Bravura** is present in the repository; it arrives with alphaTab and is
the reason the notation in this interface can be real SMuFL glyphs instead of
the Unicode miscellaneous-symbols lookalikes every other web application
settles for. U+2669 is a text character shaped like a quarter note. U+E1D5 is
the quarter note, on the same baseline and the same stem weight as the barlines
beside it, and that difference is most of why engraving looks engraved.

Four registers select a symbol face and a handwriting face together, through
`data-register` on any container:

| Register | Symbols | Hand | Used for |
|---|---|---|---|
| `engraved` | Leland | Inter | Lessons, exercises, notation |
| `classical` | Bravura | Playfair italic | Theory and reference |
| `jazz` | Petaluma | Petaluma Script | Jam rooms, improv, chord charts |
| `chart` | MuseJazz | MuseJazz Text | Challenges, chord symbols, annotations |

Every symbol stack ends in Bravura. A register whose first choice has not been
added loses its handwriting and keeps its engraving, rather than falling through
to a text font that would draw a quarter note as an empty box. That is the whole
reason the symbol font and the text font are separate tokens.

**Character:** Inter carries everything. Playfair Display italic is the accent
voice, and it exists only in italic because that is the only cut this design
uses. The signature is the two of them alternating inside one heading.

### Hierarchy

- **Display** (Inter 400, up to 8rem, `-.08em`, line-height .95): The stated
  half of a two-voice heading.
- **Accent** (Playfair italic 400, same size, `-.05em`): The set half. The
  looser tracking on the serif is deliberate; it is what makes the two lines sit
  as one block instead of two.
- **Title** (Inter 500, `-.08em`): Section headings.
- **Body** (Inter 400, 1.6, `-.02em`): Prose, capped at a 34rem measure.
- **Label** (Inter 500, `max(11px,.6875rem)`, `.01em`, uppercase): The one place
  tracking goes positive, because small caps need it.

### Named Rules

**The Accent Is Opt-In.** `--font-display` is Inter. Playfair is reached only
through `--font-accent`, and only for the wordmark, one line of a two-voice
heading, or an `<em>` inside a title. Pointing the display token at Playfair put
every lesson title and the word PASSED in italic serif, which turns an accent
into a typeface.

**The Tracking Rule.** Negative everywhere: `-.02em` as standard, `-.05em` on
the serif display line, `-.08em` on the sans. This is the cheapest thing in the
design and the largest part of its character.

## Layout

Nothing is inset to make room for chrome. The nav floats clear of the top edge
with the page running underneath it, the content is full-bleed where it wants to
be, and the instrument is docked at the bottom.

There is **no sidebar**. Navigation is the centre pill, which lists one entry per
section, plus a contents control that opens the command palette for everything
else. A pill listing twenty-four routes would be a menu bar wearing a rounded
border.

Working routes clear the nav with top padding; the hero does not, because a
full-bleed image running under floating chrome is the whole point of the chrome
floating.

Reading routes hold **74rem**, workspaces run to **120rem**, prose caps at
**34rem**.

### Named Rules

**The Floating Chrome Rule.** Nav and dock float over the content and never
reserve space in the layout. A bar that pushes content down is not this design.

## Elevation & Depth

Glass and glow, not shadow. Depth is white at low alpha with a hairline, and the
only cast shadow in the system is the warm glow beneath the flame pill on hover.

`backdrop-filter` appears three times: the nav pill, the contents menu and the
dock. The dock is fixed and the other two are children of the fixed nav bar, so
none of them sits in a scrolling region. Blur on a scrolling container repaints
every frame and destroys performance on a phone, so it is never applied to one.

### Named Rules

**Blur Is For Fixed Things.** If it scrolls, it does not blur.

## Shapes

`--r` is `9999px`. Every button, field, pill and control is fully rounded.
Surfaces take `1.5rem`, wells `1rem`, and a note head is a circle.

This is a complete reversal of the square system it replaces, and the reversal is
deliberate: a design that rounds some things and squares others reads as
undecided.

### Named Rules

**The Pill Rule.** Interactive means fully rounded. No exceptions, no partial
radii.

**A Focus Ring Does Not Reshape.** Never set `border-radius` in a `:focus-visible`
rule. The outline already follows the element's shape, and setting a radius
there changes the **element**, which with a pill radius drew an orange ellipse
around the page heading on every navigation.

## Components

### Pills

- **Ghost** is the default: transparent, hairline border, ink-2 label. Hover
  lifts the border and the text; press scales to .95.
- **Flame** commits: orange fill, white label, scale 1.03 and a glow on hover.
  One per screen.
- **Chalk** is the second action: white fill, dark label.

Press feedback is **scale**, not travel, because nothing here sits on a surface
it could be pushed into.

### The floating nav

Mark and wordmark left, sections centred in a glass pill, actions right. The
pill is hidden below 900px, where the contents control becomes the whole
navigation.

### The dock

Fixed bottom strip, glass over the ground. Transport, tempo, loop, count-in and
input status. Every control drives the session clock.

### Signature: the spotlight reveal

Two images stacked, the upper one masked to a soft circle that trails the
pointer, revealing the image beneath. The circle eases toward the cursor at a
tenth per frame from a `requestAnimationFrame` loop, so it keeps travelling
after the mouse stops. A mask that tracks exactly reads as a cheap flashlight;
one that lags reads as light with weight.

The mask is a CSS `radial-gradient` at the brief's exact stops (solid to 40%,
then .75, .4, .12, 0). The brief specifies drawing this into a canvas and
calling `toDataURL()` every render; that is deliberately not done, because
`toDataURL` is synchronous and costs milliseconds per call, so running it per
frame spends most of a 16ms budget serialising a PNG the compositor draws for
free. The visual result is identical.

The effect is skipped entirely under `prefers-reduced-motion` and on a coarse
pointer. There is no cursor to follow on a phone, and a reveal that exists only
where a pointer is would hide the second image forever.

## Time

Motion is governed by the transport. `src/conductor.ts` publishes the live tempo
as `--beat-ms` and its subdivisions, and while the clock runs the motion
constants are expressed in musical values and route changes land on the next
eighth. Stopped, everything falls back to fixed values and navigation is
immediate.

Entrances use three keyframes on one exponential curve: a blur-rise for display
type, a plain rise for supporting copy, and a slow zoom-out on the imagery,
staggered at 0.25s, 0.42s, 0.7s and 0.85s.

Under `prefers-reduced-motion` every element keeps its final state and loses only
the arrival. An entrance that hides content until an animation completes is a
blank screen for anyone who turned animation off.

## Do's and Don'ts

### Do:

- **Do** let the photograph be the loudest thing on the screen.
- **Do** keep one flame element per screen, and none when there is no action.
- **Do** carry every other distinction with white at four opacities.
- **Do** make every interactive element a fully rounded pill.
- **Do** reach for Playfair only through `--font-accent`, and only for a
  wordmark, one line of a two-voice heading, or an `<em>` in a title.
- **Do** put a scrim under any copy that sits on an image.
- **Do** self-host every face and every hero image under `/fonts` and `/hero`.
- **Do** collapse entrances to their final state under reduced motion.

### Don't:

- **Don't** point `--font-display` at Playfair. The accent must stay opt-in.
- **Don't** set `border-radius` inside a focus rule.
- **Don't** apply `backdrop-filter` to anything that scrolls.
- **Don't** introduce a second accent colour or a fifth grey.
- **Don't** square a control, or round it partially.
- **Don't** hotlink a font, image, script or stylesheet from a third-party host.
  They are blocked outright here and the failure is silent.
- **Don't** set text on a photograph without checking it over the image's bright
  half as well as its dark half.
- **Don't** run `toDataURL` in an animation frame.

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Bass players who find Bass Lab on their own and use it with nobody to
explain it. The primary user is confirmed as the general public, not a
private student roster and not the author practising alone.

That has a consequence worth stating plainly, because it governs most
future decisions: **every screen is somebody's first screen.** There is no
teacher in the loop to fill a gap, no shared vocabulary that can be
assumed, and no second chance at a cold visit. A screen that only makes
sense to the person who built it is broken for this audience even when it
works correctly.

The user is at their instrument, with both hands occupied. Interaction
happens in the gaps between playing, or by playing. Anything that needs
sustained mouse work competes with the thing the user came to do.

## Product Purpose

An interactive environment for learning to play bass: harmony, time,
fretboard command, Arabic maqamat, slap technique and improvisation, held
together by a 28-lesson ordered course and a set of practice labs.

Success is that the player can do something on the instrument they could
not do before, and can tell that they can. The product measures whether
that happened rather than asking the player to self-report it.

## Positioning

**Progression first, scale second.** This is the confirmed differentiator
and it lives in the harmony fretboard.

The board is driven by where the harmony is going, not by a scale the
player selected. `recommendScales` scores several candidates against the
current chord and the next one, returning a reason for each, what the
scale is missing, and how far it overlaps the context. The screen states
it directly: several answers can be correct, and their jobs are different.

Underneath that, `classifyNote` gives every note on the neck a role for
the current chord, drawn from twelve: bass, root, guide, chord tone,
specified, voice, colour, available, context, approach, outside. Each role
carries a label, the reason it applies, and advice. So the neck answers
"what does this note do here", not "is this note allowed", which is the
question a scale diagram answers and the reason a scale diagram stops
helping a player who can already spell scales.

`VoicePath` computes the voice leading into the next chord, so the board
also shows where a line has to arrive.

The second mechanism, real but secondary: the app listens. Pitch detection
judges what was played and when, so exercises and games are answered on
the instrument rather than by choosing from options. A competitor could
add listening. The harder thing to copy is the harmonic model the
listening is pointed at.

## Operating Context

- Practice happens at the instrument, usually with headphones or an audio
  interface, since microphone pitch detection degrades in a loud room.
- Sessions are self-directed and interrupted. The player leaves and comes
  back; progress has to survive that.
- The harmony fretboard is used live, against a backing band the app
  generates (drums, keys, rhythm guitar, change cue). The band deliberately
  plays no bassline, because that is the user's part.
- The board is the centre of the product in the literal sense, not only the
  strategic one: it is the workspace a session is run from, with the controls
  that describe the current harmony arranged around it. It used to sit part
  way down a scrolling page of other things, which is worth recording because
  the arrangement is the confirmed positioning made concrete, and a future
  change that files it back behind a link would be reversing a product
  decision rather than a layout one.
- Notation renders through alphaTab, so exercises can be read as tab or
  standard notation and played back.

## Capabilities and Constraints

Confirmed functionality:

- 24 client routes across a course, labs, practice, coach and progress.
- Harmony fretboard: a chord-symbol parser covering 8 chord families, a
  23-scale library, 12 note roles, 11 progression presets, three lenses
  (functional, modal, modern), voice-leading paths, and a generated band.
- Live pitch detection from the microphone (MPM / normalised square
  difference), used by the fretboard, the tuner, the games and the drills.
- 8 listening drills with scoring, streaks and session limits.
- A 28-lesson ordered course, plus labs for chromatic study, technique,
  maqamat, slap, improvisation, progression analysis and tab study.
- Anonymous progress under a generated learner id, kept in browser local
  storage with a local JSON store on the server.
- Speech synthesis for hands-free coaching cues.

Technical shape:

- One Express process serves both the API and the built client. No
  database, no external service, no authentication.
- Deployable to a plain Node host. Also runs on Vercel, where the server
  copy of progress is not durable and browser storage is the real record.

**No inviolable constraints are recorded.** Everything above describes how
the product is built today, not what it has to remain. The user was asked
and declined to designate any of it as a commitment, so nothing in this
section binds a future decision.

That declining is itself the fact worth keeping, because the alternative
failure is quiet: a later reader sees a consistent implementation, infers
the rule it seems to follow, and starts enforcing a constraint nobody
agreed to. Do not do that. Anything here can be changed on its merits.

**Open and genuinely contested, the source-material policy.** Four books
have been used as reference: Diaz (240 Chromatic Exercises + 1165 Jazz
Lines), Eager (Complete Guide To Music Theory For Bass), Goodman (Bass
Theory) and Cap (Music Theory For The Bass Player). The position the
project has operated under is that concepts, procedures, scope and
sequence are not ownable and may be used freely, while specific composed
lines are, and that transposing or re-notating one into tab produces a
derivative work rather than an original. The user has explicitly disagreed
with the second half of that. It is unresolved and must not be recorded as
settled in either direction. Nothing from those books currently ships.

## Brand Commitments

- Name: Outside In. The product surface is "Bass Lab".
- Voice: terse, declarative, second person. It states what to do and what
  counts as done. It does not encourage, congratulate or hedge. Section
  headings are statements ("Several can be correct. Their jobs are
  different."), not labels.
- The voice is the strongest existing brand asset and predates any visual
  treatment. Preserve it.

## Evidence on Hand

Real and shippable:

- The generated exercise material: the chromatic library (9 devices x 11
  qualities x 3 study shapes, plus 10 progressions x 2 chains) and its
  keyed expansions. Original, generated from rules, and effectively
  unbounded.
- The written course and lab content, authored for this product.
- The harmonic model itself: parser, scale library, role classifier and
  voice-leading, all test-covered.
- 151 passing tests.

Absent, and never to be fabricated:

- No testimonials, reviews, user quotes or named customers.
- No usage numbers, download counts, ratings or benchmarks.
- No pricing, licensing, subscription or business model.
- No press, awards or endorsements.
- No photography of the author, of students, or of any real person.

## Product Principles

1. **Answer it on the instrument.** Anything checkable by listening should
   be checked that way rather than by clicking. Recognition is not ability,
   and a multiple-choice answer proves neither.
2. **Say what the note does, not whether it is allowed.** Permission is a
   beginner's question. The product's job is to explain function in
   context, including for notes outside the chord.
3. **Context before content.** Where the harmony is going determines what
   is correct now. Never present one answer where several are correct for
   different reasons.
4. **Every screen is a first screen.** The audience arrives cold and alone.
   Assume no vocabulary, no teacher, and no prior visit.
5. **Measure, do not congratulate.** State the standard, judge against it,
   report the result without decoration.

## Accessibility & Inclusion

No product-specific standard has been set by the user yet, so this records
the floor the implementation currently holds and should not fall below:

- Reduced motion is honoured across 11 source files; every animation added
  collapses to static under `prefers-reduced-motion`.
- A skip link, a document language, and 19 distinct ARIA attributes are in
  place. Page headings are focus targets on route change.
- Body text sits at 15.99:1 on the dark ground, past WCAG AAA.

One product-specific need is flagged for a future decision: the core
mechanism is auditory and pitch detection requires a microphone. What the
product offers a deaf or hard-of-hearing player, or a player with no
microphone, is undecided. The harmony fretboard works fully without audio;
the games and drills do not.

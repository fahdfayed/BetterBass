# Context

Glossary only. No implementation detail — see the code for that.

## Terms

### Authored content

Hand-written, lesson- or item-specific prose: the 28-lesson course (`course-data.ts`,
`course-details.ts`), the Theory Reference's 18 domains and 6 dictionaries
(`bass-theory-data.ts`), and the specialty labs' drills/exercises (Slap, Maqam, Jaco).
Each item is written once, for its own subject — it does not vary at runtime, and its
depth is a writing decision, not a generation-pool size.

### Generated content

Content assembled at runtime from a small, fixed combinatorial pool: RescueGames'
per-round "asks" (`game/drills.ts`), NoteQuest's walk narration (`quest-data.ts`),
ProgressionAnalyser's presets, the Improvisation Lab's motif mutations, and similar
systems. The pool itself — the set of chord qualities, rhythm figures, approach
shapes, presets, mutations, or narration lines a system draws from — is what
determines whether the content feels varied or repetitive to a player who returns
daily. Widening a generated system means growing its pool, not writing more prose
by hand for one item.

### Why the split matters

A 2026-09-04 content audit (grilling session) found every *authored* surface in the
site fully fleshed and evenly deep, with no genuine gaps outside two spots the code
itself documents as intentionally incomplete (Maqam Lab's 8-of-many maqamat, Jaco
Masterclass's two non-exercise chapters). Every real "this feels thin" finding was in
a *generated* system's underlying pool, not in authored prose. Scope decisions about
"does X need more content" should ask which category X is in before answering: an
authored gap is a writing decision; a generated system's thinness is a pool-size
decision.

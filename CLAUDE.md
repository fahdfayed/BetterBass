# CLAUDE.md

Working agreements for this repo.

## Token guard

These rules exist because context is re-read on **every** turn. A session that
drifts to 500k tokens pays 500k on each of the next hundred turns. Length is
the cost driver, not any single expensive action.

### Be concise

- Answer the question asked. No preamble, no recap of what you just did, no
  restating the plan before executing it.
- Report results, not narration. One line per outcome beats a paragraph.
- Don't re-read files already in context. Don't re-derive facts already
  established this session.
- Read the slice you need: `sed -n`, `grep -n`, `Read` with `offset`/`limit`.
  Never open a large file whole to check one symbol.
- Never paste a PDF, screenshot, or page scan into context when the text will
  do. Images persist for the rest of the session and are re-read every turn.

### Route mechanical work to a Haiku sub-agent

Work that is well-specified and needs no repo judgement goes to a
`claude-haiku-4-5` sub-agent via the Agent tool, so its intermediate output
never lands in the main context:

- bulk renames and find/replace across many files
- formatting, lint fixes, import sorting
- summarizing long logs, transcripts, or docs
- scraping or extracting structured data from pages
- mechanical test-fixture or boilerplate generation

Keep in the main session: design decisions, debugging, anything needing
knowledge of this codebase's history or conventions.

### Never suggest `/compact` as a cost measure

`/compact` is a **context-limit** tool, not a cost tool. It rewrites the
conversation prefix, which invalidates the prompt cache and forces a full
cache re-write at 12.5-20x the cache-read rate. Compacting to save money
costs money.

When context is the problem, the answer is `/clear` and a fresh session
scoped to one job. Finish a job, clear, start the next.

## Project notes

- Vite + React + TypeScript. Dev server: `npm run dev` (port 3000).
- `npx tsc --noEmit` currently reports pre-existing errors in
  `src/PerformanceCoach.tsx` (string-literal casing vs. union types). Not
  introduced by recent work; don't treat a non-zero `tsc` exit as a new
  regression without diffing first.
- Build/install/test output is auto-trimmed to the last 30 lines plus error
  lines by `.claude/hooks/pretool-trim.mjs`. If you need full output, write it
  to a file and grep it rather than disabling the hook.

#!/usr/bin/env node
/**
 * Trims noisy command output to the last N lines, preserving any error-ish
 * lines from the part that gets cut. Reads stdin, writes trimmed stdout.
 *
 * Invoked by the PreToolUse hook in .claude/settings.local.json, which pipes
 * build/install/test commands through it so only the trimmed form ever
 * reaches the model's context.
 */
const TAIL_LINES = 30;
const MAX_ERROR_LINES = 40;

// Two halves: tokens that end in a word char (need \b), and tokens that do not
// (ERR!, glyphs) -- a trailing \b after "!" never matches.
const ERROR_RE =
  /(^|\s)(error|errors|failed|failing|failure|fatal|exception|panic|Traceback|ENOENT|EACCES|EADDRINUSE|MODULE_NOT_FOUND|unresolved|FAIL)\b|ERR!|✗|✘|×|\bnot found\b|\bcannot find\b/i;

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  const lines = raw.split('\n');
  // Drop a single trailing empty line produced by a final newline.
  if (lines.length && lines[lines.length - 1] === '') lines.pop();

  if (lines.length <= TAIL_LINES) {
    process.stdout.write(lines.join('\n') + (lines.length ? '\n' : ''));
    return;
  }

  const cutoff = lines.length - TAIL_LINES;
  const head = lines.slice(0, cutoff);
  const tail = lines.slice(cutoff);

  const errors = [];
  for (let i = 0; i < head.length; i++) {
    if (ERROR_RE.test(head[i])) {
      errors.push(`  ${i + 1}: ${head[i]}`);
      if (errors.length >= MAX_ERROR_LINES) break;
    }
  }

  const out = [];
  out.push(`[trimmed: ${lines.length} lines -> last ${TAIL_LINES}` +
    (errors.length ? ` + ${errors.length} error line(s)` : '') + ']');
  if (errors.length) {
    out.push('--- error lines from the trimmed section ---');
    out.push(...errors);
    if (errors.length >= MAX_ERROR_LINES) {
      out.push(`  ... error list capped at ${MAX_ERROR_LINES}`);
    }
  }
  out.push(`--- last ${TAIL_LINES} lines ---`);
  out.push(...tail);
  process.stdout.write(out.join('\n') + '\n');
});

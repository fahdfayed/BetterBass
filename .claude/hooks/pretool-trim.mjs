#!/usr/bin/env node
/**
 * PreToolUse hook (matcher: Bash).
 *
 * PostToolUse cannot alter tool output -- `tool_response` is immutable by the
 * time it fires. So to keep noisy output OUT of context we rewrite the command
 * itself here, piping it through trim-output.mjs before it ever runs.
 *
 * Only commands matching NOISY_RE are touched; everything else passes through
 * untouched. Exit status of the original command is preserved via PIPESTATUS.
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TRIMMER = path.join(HERE, 'trim-output.mjs').split(path.sep).join('/');
const MARKER = 'trim-output.mjs';

// Commands whose output is routinely long and rarely worth reading in full.
const NOISY_RE =
  /\b(npm|pnpm|yarn|bun)\s+(i|install|ci|add|update|audit|dedupe)\b|\b(npm|pnpm|yarn|bun)\s+run\s+\S*(build|test|lint|typecheck|check|dev|bundle)|\bnpx?\s+tsc\b|\btsc\b|\b(vite|webpack|rollup|esbuild|parcel|next|nuxt|astro)\s+build\b|\b(jest|vitest|mocha|ava|playwright|cypress|karma)\b|\bpip3?\s+install\b|\bpoetry\s+(install|update)\b|\bcargo\s+(build|test|check|clippy)\b|\bgo\s+(build|test)\b|\b(gradlew?|mvn)\s|\bmake\b|\bdocker\s+(build|compose)\b|\beslint\b|\bprettier\b/i;

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { buf += c; });
process.stdin.on('end', () => {
  let evt;
  try { evt = JSON.parse(buf); } catch { process.exit(0); }

  const input = evt.tool_input || {};
  const cmd = input.command;

  const skip =
    evt.tool_name !== 'Bash' ||
    typeof cmd !== 'string' ||
    !cmd.trim() ||
    input.run_in_background === true ||  // output is not inlined anyway
    cmd.includes(MARKER) ||              // already wrapped; stay idempotent
    !NOISY_RE.test(cmd);

  if (skip) process.exit(0);

  const wrapped =
    '{\n' + cmd + '\n} 2>&1 | node "' + TRIMMER + '"\n' +
    'exit ${PIPESTATUS[0]}';

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      permissionDecisionReason: 'Piped through output trimmer (last 30 lines + error lines).',
      updatedInput: { ...input, command: wrapped },
    },
  }));
  process.exit(0);
});

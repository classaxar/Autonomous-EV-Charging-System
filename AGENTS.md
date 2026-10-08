# AGENTS.md (copy the same content to CLAUDE.md for Claude Code)

PROJECT: autonomous-ev-system | monorepo | Node20+Express+MongoDB+Docker+K8s | 10 services + React frontend | 3 devs (A, B, C)

READ ORDER (stop reading once you have what you need):
1. `RULEBOOK.md` -> sections 1-5 always; others when needed.
2. `TASKBOOK.md` -> ONLY your dev's section. Do not read other devs' sections.
3. Never open another dev's service code. Use the contracts in RULEBOOK section 6.

YOU ARE: the dev named in your prompt (A, B or C). If unsure, ask once. Do not guess.

HARD LIMITS:
- Write only inside paths you own (RULEBOOK section 1).
- One task ID = one branch = one PR. Never commit to `main` or `develop`.
- Never change contracts, ports, or env names. Open an issue instead.
- Output at most 3 lines when a task is done (format in RULEBOOK section 12).

START: open `TASKBOOK.md`, find your first task not marked `[x]`, run it.

# CODING_RULES.md

## UI / Styling
- Mobile-first responsive design — design for a volunteer holding a phone, not a desktop
  window.
- Visual style: dark-mode glassmorphism — `bg-[#0F0F0F]/60`, `backdrop-blur-md`, subtle
  borders, soft shadows.
- Use **hardcoded hex values** in Tailwind classes (not CSS variables or dynamically
  constructed class strings) to avoid Tailwind's JIT purge dropping classes at build time.
- No heavy 3D canvas libraries (e.g. Three.js) — 2D/SVG for the stadium map.

## Code Quality
- Keep components small and single-purpose; avoid monolithic files. Split UI, state,
  and reasoning logic into separate modules (`/components`, `/store`, `/lib`).
- Favor O(1)/O(log n) lookups (hash maps, keyed objects) over nested loops or linear
  scans for gate/facility data — this is graded explicitly.
- Comment *why*, not *what*, especially in the reasoning-prompt logic where intent
  matters more than syntax.

## Security
- All secrets (API keys) go in `.env`, and `.env` must be in `.gitignore` — verify this
  before every push, not just once.
- No hardcoded API keys anywhere in frontend code, including inside string templates or
  fallback defaults.
- Explicit CORS configuration on any backend/Cloud Run endpoint — don't leave it wide open.

## Testing
- Use Vitest. Every data-handling function (CSV parsing, reasoning trigger logic, wait-time
  calculations) needs tests for:
  - Normal input
  - Empty/missing input
  - Malformed input (bad CSV rows, wrong types)
  - Extreme values (NaN, negative numbers, 0% and 100%+ capacity)
- Target meaningful coverage on logic modules, not just happy-path UI smoke tests.

## Accessibility
- Semantic HTML elements (`<button>`, `<nav>`, `<main>`, not `<div onClick>`).
- ARIA labels on icon-only buttons and dynamic status cards (e.g. capacity alerts).
- Sufficient color contrast even within the dark glassmorphic theme — don't let frosted
  glass reduce text legibility below WCAG AA.

## Git Hygiene
- Do not commit generated boilerplate you didn't actually write/direct without reviewing
  it — keep commit history reflecting real incremental work rather than one giant
  AI-generated dump, since duplicate/identical boilerplate across projects has caused
  false-positive plagiarism flags before on this account. Review diffs before pushing.
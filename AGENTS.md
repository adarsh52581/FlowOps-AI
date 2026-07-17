# Design & build standards

These rules apply to every UI task in this project. They work alongside the
UI UX Pro Max skill (design system generation) and the shadcn MCP server
(real component code) — this file governs *process*, they supply *content*.

## Stack (edit this block for your actual hackathon stack)
- Framework: React + Vite (swap for Next.js / Vue / plain HTML+Tailwind as needed)
- Styling: Tailwind CSS
- Components: shadcn/ui as the base layer, installed through the shadcn MCP
  tool — never hand-write a component that shadcn, Aceternity, or Magic UI
  already has. Check the registry before writing JSX from scratch.
- Icons: Lucide only (comes with shadcn). Never emoji as icons, never a
  missing icon left as blank space.

## Before writing any UI code
1. State the product in one line: what it is, who it's for, one word for
   mood (playful / trustworthy / luxe / clinical / etc). If the human hasn't
   given you this, pick a reasonable interpretation and say what you assumed.
2. Ask the UI UX Pro Max skill to generate a design system from that line —
   palette, type pairing, layout pattern, and anti-patterns — before
   producing any code. Treat the result as a contract for the rest of the
   build: don't quietly drift from the palette or type scale mid-session.
3. Pick exactly one signature moment for the build — a hero interaction, a
   distinctive chart, one animated reveal — and keep everything else quiet
   and disciplined around it. Spend your boldness in one place, not five.

## While building
- One visual language across every screen: same spacing scale, same corner
  radii, same shadow/elevation, same motion easing. If screen 2 introduces a
  new spacing rhythm, that's a bug.
- Real, specific content over lorem ipsum wherever you can invent it — filler
  text is one of the fastest "this is a prototype" tells to a judge.
- Every interactive element gets a hover and focus state, and a visible
  keyboard focus ring. Every clickable element gets cursor-pointer.
- Respect prefers-reduced-motion. Don't animate everything just because you can.

## Self-critique loop — run this after every screen, not just at the end
1. Open the page in the built-in browser (click the Chrome icon top-right if
   it isn't already running).
2. Screenshot it at a desktop width and a mobile width (~375px).
3. Compare the screenshot against the design system from step 2 above and
   the checklist below. Name anything that's off, out loud, before fixing it.
4. Fix it, then re-screenshot. A screen isn't done until this has happened
   at least once — "it compiles" is not the same as "it looks right."
5. If the chrome-devtools MCP tool is available, also check the console for
   errors after significant changes — a broken layout is sometimes a silent
   JS error, not a CSS problem.

## Anti-pattern checklist — reject your own output if you see these
- The default purple-to-pink gradient "AI look," used without a reason tied
  to the actual brief
- Every card the same size and weight with no visual hierarchy
- Text-to-background contrast under 4.5:1
- A layout that only actually works at the one width you happened to test
- Icons that are emoji, or a plain bordered <div> standing in for a real
  button / input / card component that already exists in the registry
- Placeholder copy ("Lorem ipsum", "Card title", "Description goes here")
  left in anywhere the demo will actually show it

## MCP tools available in this project
- `shadcn` — search, view, and install components before writing one by
  hand. Also reachable through namespaced registries for more visual flair,
  e.g. `@aceternity`, `@magicui` — ask for these explicitly by name.
- `chrome-devtools` — inspect console errors, network requests, and layout
  on the page the built-in browser has open. Use it to debug, not just to
  look.

## Judging-day polish pass (do this once, near the end)
- Tab through the whole flow with only the keyboard once.
- Resize to a phone width and check nothing clips or overlaps.
- Remove every console.log and any dead/commented-out code.
- Read every button and label out loud — does it say what it does?

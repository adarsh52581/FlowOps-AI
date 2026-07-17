# ARCHITECTURE.md

## Overview
FlowOps AI is a client-heavy React/Vite SPA. There is no live stadium sensor feed, so the
system is built around a **synthetic data layer** that behaves like a real-time feed, plus
a **reasoning layer** that turns that data into human-readable volunteer instructions.

## State Management
- **Zustand store** (`useCrowdStore`) holds:
  - `gates`: [{ id, name, capacityPct, trend }]
  - `facilities`: [{ id, type (restroom/foodstall/medical), waitMinutes }]
  - `lastUpdated`
- A simulated ticker (setInterval or similar) mutates this state at a fixed cadence to
  mimic live crowd flow, so the UI has something dynamic to react to even offline.

## Data Ingestion (Judge's Override)
- A CSV/PDF/SQL upload component parses judge-supplied data into the same shape as the
  Zustand store (`gates`/`facilities`), and swaps it in as the active data source.
- Parsing must fail gracefully on malformed input (missing columns, NaN values, empty
  files) — surface a clear error state in the UI rather than crashing.

## Reasoning Layer (XAI)
- A single function, e.g. `getCrowdRecommendation(gateData)`, sends the current gate/facility
  state to the LLM (Gemini) with a prompt that asks it to:
  1. Identify any gate/facility over a capacity threshold (e.g. 80%).
  2. Explain *why* it's a problem (plain English).
  3. Recommend a specific alternative (nearest under-capacity gate/facility).
- The response is rendered as a reasoning card, not just a raw score — this is what
  distinguishes the app from a rule-based dashboard.
- Keep this logic isolated in its own module so it's easy to test independently of the UI.

## Multilingual Assistant
- Input: fan's spoken/typed request + free-text or voice.
- The prompt sent to the LLM includes an instruction to detect urgency/tone (e.g. medical
  emergency vs. casual question) and adjust register accordingly, then return both the
  translation and a short "context tag" (e.g. "Urgent — Medical") the volunteer can see
  at a glance.

## Backend / Cloud Services
- Firebase: stores synthetic crowd data and any judge-uploaded datasets so state can
  persist across a session/demo.
- Cloud Run: hosts the deployed build.
- Both integrated through Antigravity's MCP servers rather than called ad hoc — document
  the actual service calls made (not just "MCP installed") so the integration is real,
  not cosmetic.

## Performance Considerations
- 2D/SVG stadium map only — no 3D canvas libraries.
- Avoid nested-loop lookups on gate/facility data; use keyed lookups (map/object) for O(1)
  access instead of linear scans, since this feeds directly into the reasoning function.
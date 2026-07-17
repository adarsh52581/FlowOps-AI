# PROJECT_CONTEXT.md

## App Name
FlowOps AI — The Volunteer Co-Pilot (FIFA World Cup 2026 Stadium Companion)

## Persona Scope (deliberately narrow)
This app targets **one persona only: the Volunteer**. It does not attempt to serve fans,
organizers, or venue staff. Two verticals only:
1. Crowd Management (Explainable AI / XAI)
2. Context-Aware Multilingual Assistance

Do not add features for other personas. Depth over breadth.

## Goal
Give stadium volunteers a mobile, real-time "Heads-Up Display" that:
- Reasons over crowd density data and issues plain-English redirect instructions
  (not just raw numbers/dashboards).
- Translates fan requests with awareness of urgency/context (e.g. "where's the bathroom"
  vs. a medical emergency), not literal word-for-word translation.
- Lets an evaluator/judge inject their own data (CSV upload) to test the reasoning logic
  against non-mock input.

## Stack
- React + Vite
- Tailwind CSS (hardcoded hex values only — no dynamic/templated Tailwind tokens, to avoid
  build-time purge issues)
- Zustand for local/simulated live state
- Gemini API (or equivalent LLM call) for the reasoning + translation layer
- Firebase (data) and Cloud Run (deployment) integrated via MCP servers in Antigravity

## Core Views
1. **Crowd Ops (Fan/Gate Dashboard)** — SVG stadium map + floating glass cards showing
   live/simulated gate & facility capacity, with AI-generated redirect reasoning.
2. **AI Translator** — context-aware multilingual assistant for volunteer-fan interaction.
3. **Data Upload (Judge's Override)** — CSV/PDF/SQL upload so evaluators can feed in their
   own data and see the AI reasoning respond to it live.

## Non-Goals (explicitly out of scope for v1)
- Organizer, staff, or generic fan-facing features
- Real backend integration with actual stadium sensors (synthetic data only)
- Heavy 3D visualization — 2D/SVG only, for performance and load-time reasons
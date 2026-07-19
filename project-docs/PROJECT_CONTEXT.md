# PROJECT_CONTEXT.md

## App Name
FlowOps AI — The Volunteer Co-Pilot (FIFA World Cup 2026 Stadium Companion)

## Project Context & Hackathon Alignment

This project, **FlowOps AI**, is a **dynamic assistant** built for the **FIFA World Cup 2026** challenge. It delivers **real-time decision support** and **logical decision making** for the **Volunteer** persona operating within the **Crowd Management** vertical.

## 1. Challenge & Persona Alignment
We have selected the **Volunteer** target group, focusing deeply on their most critical pain point: handling massive crowd surges safely and effectively. Instead of a superficial app that tries to serve organizers and fans simultaneously, this tool acts as an intelligent co-pilot specifically for the frontline volunteer.

## 2. Core Operational Mechanics
- Reads real-time stadium gate capacity and wait-time data (mocked/simulated live).
- Sends context slices to the Gemini API.
- Generates specific, localized action scripts ("move fans from Gate D to Gate E")
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
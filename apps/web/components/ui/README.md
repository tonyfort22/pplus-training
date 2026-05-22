# Shared web UI kit

This directory is the home for the reusable PPLUS web UI kit.

Phase 1 foundation decisions:
- font: Geist
- themes: dark + light
- accent: green/teal
- radius: tighter/systematic
- icon direction: Lucide
- API style: simple

Rules:
- shared generic components live here
- admin-only page composition stays under `components/admin/`
- Tailwind owns layout, spacing, sizing, and structure
- CSS variables own theme tokens and semantic styling

# Admin UI Ruleset

> Source of truth for the PPLUS web UI kit foundations and admin-facing demo surface.

## Baseline

This ruleset now reflects the agreed PPLUS web UI kit direction:
- near-clone structure to the reference standard UI kit
- PPLUS styling
- dark + light themes
- current green/teal accent
- Geist font
- tighter/systematic radius
- Lucide icon direction
- simple API
- shared kit code under `apps/web/components/ui/`

## Phase 1 foundations

### Shared kit location
- shared reusable kit: `apps/web/components/ui/`
- admin-specific composition: `apps/web/components/admin/`

### Theme model
- both **dark + light** must exist in the system
- theme variables live in `globals.css`
- `html[data-theme='dark']` and `html[data-theme='light']` are the source of truth

### Font
- **Geist** is the web UI kit font

### Accent
- keep the current **green/teal** direction

### Radius
- tighter/systematic
- foundation radius scale should feel closer to product UI than oversized showcase cards

### API style
- simple API only
- predictable variants and sizes
- avoid combinatorial chaos

## Foundation token families

The shared kit foundation must define semantic tokens for:
- font family
- spacing scale
- radius scale
- type scale
- shadow scale
- surfaces
- text colors
- borders
- focus ring
- interaction colors

## Shared structural defaults

- readable content width: `720px`
- sidebar width: `240px`
- topbar height: `56px`
- compact button: `24px`
- default button: `32px`
- prominent button: `40px`
- auth button: `68px`
- standard card padding: `16px`
- spacious card padding: `24px`
- auth card padding: `30px`

## Implementation principles

- Tailwind owns layout, spacing, sizing, and structure
- CSS variables own theme tokens and semantic styling
- `/admin/ui` becomes the real source-of-truth showcase only after the shared kit is real
- do not confuse partially wired values with an actually applied system

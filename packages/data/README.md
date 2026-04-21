# Data Layer

## Purpose
This package is the backend-facing module boundary for the product.

It should become the place where the apps talk to structured repositories and services instead of reaching straight into database-specific logic.

## Domain modules
- `identity`
- `athletes`
- `exercises`
- `workouts`
- `programs`
- `sessions`
- `analytics`

## Intended flow
- Supabase or SQL client gets initialized elsewhere
- this package receives that db client
- each domain exposes repository-style functions
- app layers consume domain functions, not raw SQL tables directly

## Goal
Keep the app implementation tied to product domains instead of letting the UI shape the data layer.

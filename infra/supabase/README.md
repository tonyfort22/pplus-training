# Supabase Backend Foundation

## Purpose
This folder is the backend foundation for PPLUS Training.

The backend must support the full product, not only the active workout flow.

## Domain coverage
The backend should cover:
- identity
- exercises and muscle mappings
- workout templates
- program planning
- workout sessions
- analytics

## Structure
- `.env.example` - connection secrets to fill later
- `schema-v1.sql` - readable full schema snapshot
- `migrations/` - ordered SQL migrations to apply over time
- `seeds/` - optional seed data and import helpers later

## Current migration baseline
- `migrations/0001_initial_schema.sql`

## Recommended flow
1. refine schema in the readable snapshot first when needed
2. mirror those changes into the next migration file
3. apply migrations to Supabase once the project is connected
4. add seed/import scripts once exercise and program import begins

## Current priority
Turn the documented schema into a real SQL foundation that can be applied to Supabase cleanly.

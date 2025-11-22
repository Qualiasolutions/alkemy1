# alkemy - Data Models

**Date:** 2025-11-22

## Overview

The database schema is managed via Supabase migrations.
The source of truth for the data models is located in `supabase/migrations/`.

## Schema Management

Migrations are SQL files that define the database structure.
They are applied using the Supabase CLI.

## Key Tables (Inferred)

_Refer to migration files for exact definitions._

- `users` (managed by Supabase Auth)
- `profiles` (likely linked to `auth.users`)
- Domain specific tables (e.g., `projects`, `assets`, `scripts` - inferred from application logic)

---

_Generated using BMAD Method `document-project` workflow_

# Supabase project boundary

This directory owns the local Supabase configuration and versioned database migrations.

The Task foundation is defined under `migrations/`. Product data access runs through
`apps/api` using the authenticated caller's access token, so normal operations remain
subject to Row Level Security.

Use the repository-local CLI from the repository root:

```text
npx supabase start
npx supabase db reset
```

Remote migrations must be reviewed, linked explicitly, and applied with
`npx supabase db push`. Never use `db reset --linked` for this project.

Service-role keys and database credentials are intentionally not part of the repository.
